import ServerHandler from "./../ServerHandler.js";
import Encryption from "./../Encryption.js";
import FileHandler from "./../FileHandler.js";
import DataTableManager from "./../DataTableManager.js";

/**@type {ServerHandler}*/ let server;
/**@type {DataTableManager?} */ let tableManager;

document.body.onload = async () => {
	server = await ServerHandler.getConnection();

	try {
		/**@type {string?}*/ let response = await server.request('read-credential-cache');
		if (response != null) {//got cache from server
			response = Encryption.decode(response, 16);

			const [ username, password ] = response.split('\x00');
			const bool = Boolean(await server.request('check-admin-login', {username: username, password: password}));

			if (!bool) throw new Error('invalid cache data');

			sessionStorage.setItem('credential-cache', Encryption.encode(`${username}\x00${password}\x00${new Date().valueOf()}`, 16));
		} else {//cache doesn't exist, check session data
			response = sessionStorage.getItem('credential-cache');
			if (response == null) throw new Error('session data doesn\'t exist');
			response = Encryption.decode(response, 16);

			const [ username, password, time ] = response.split('\x00');
			const bool = Boolean(await server.request('check-admin-login', {username: username, password: password}));

			if (!bool) throw new Error('invalid session data');
			if (new Date().valueOf() - Number(time) > 1.8e+6) {//session has existed for more than half an hour
				sessionStorage.removeItem('credential-cache');
				throw new Error('session has expired');
			}
		}
	} catch (err) {//something is invalid, go back to home page!
		alert(`[ERROR] ${err.message}`);
		location.assign('./../home/index.html');
	}
}

document.querySelector('nav > div.title').addEventListener('click', () => {
	sessionStorage.removeItem('credential-cache');
	location.assign('./../home/index.html');
});

document.querySelector('#admin-logout-btn').addEventListener('click', () => {//logout
	sessionStorage.removeItem('credential-cache');
	location.assign('./../home/index.html');
});

document.querySelector('.import-file-btn div#submit').addEventListener('click', async () => {//import file
	try {
		const { fileReference, DB_name } = getFileInfo();
		let file = await FileHandler.parseFile(fileReference, DB_name);
		/**@type {string[]}*/ const DB_keys = JSON.parse(await server.request('get-DB-signature', DB_name)).map(bin => bin.replaceAll('_', ' '));

		if (DB_keys.some((_, i, arr) => !arr.includes(file.Keys[i]))) throw new Error('invalid key file format');

		switch (await getImportMethod(file)) {
			case 'replace': {//drop existing table & upload a new one
				server.request('replace-table', {createStmt: file.CreateTableStmt, data: file.Data, DB_name: DB_name});
				break;
			}
			case 'extend': {//drop existing table & upload a conjoined one
				// file = file.add(FileHandler.parseString(await server.request('query_data', `SELECT * FROM ${DB_name}`), 'json', DB_name)); //old + new file
				file = file.add(FileHandler.parseString(await server.request('query_data', DB_name), 'json', DB_name)); //TEST: replace with top line
				server.request('replace-table', {createStmt: file.CreateTableStmt, data: file.Data, DB_name: DB_name});
				break;
			}
		}
	} catch (elemSelector) {
		if (elemSelector instanceof Error) throw elemSelector; //encountered an actual error, throw higher

		const element = document.querySelector(`.import-file-btn ${elemSelector}`);
		element.style.outline = '2px solid #ff0000ff';

		let opacity = 0xff;
		let interval = setInterval(() => {
			element.style.outline = `2px solid #ff0000${(opacity -= 5).toString(16).padStart(2, '0')}`;
			if (opacity <= 0) return clearInterval(interval);
		}, 10);
	}
});

document.querySelector('.import-file-btn input[type="file"]').addEventListener('change', () => {
	document.querySelector('.import-file-btn #file-name').innerHTML = document.querySelector('.import-file-btn input[type="file"]').files[0].name;
});

/**@returns {{fileReference: File, DB_name: string}}*/
function getFileInfo() {
	/**@type {File?}*/ const fileReference = document.querySelector('.import-file-btn input[type="file"]').files[0];
	const DB_name = document.querySelector('.import-file-btn #database-name').value;
	if (fileReference == null) throw '#file-name';
	if (DB_name == '') throw '#database-name';
	return { fileReference: fileReference, DB_name: DB_name };
}

/**@returns {Promise<'replace' | 'extend'>} @param {FileHandler} file*/
async function getImportMethod(file) {
	document.querySelector('.import-method-modal .file-display-content').innerHTML = `${file.exportToString('xml').replaceAll('\t', '    ')}`;
	document.querySelector('.import-method-modal').showModal();
	let buffer;
	await new Promise((resolve) => {
		document.querySelector('.import-method-modal .footer').addEventListener('click', (e) => {//get footer response
			if (e.target.dataset['method'] != null) return resolve(e.target.dataset['method']);
		});
		document.querySelector('.import-method-modal div.close-btn').addEventListener('click', () => {//close modal
			document.querySelector('.import-method-modal').close();
			return resolve(null);
		});
	}).then(bin => buffer = bin);
	document.querySelector('.import-method-modal').close();
	return buffer;
}

document.querySelector('.export-file-btn').addEventListener('click', () => {//export file
	throw new Error('not implemented');
});

document.querySelector('#database-selecter').addEventListener('change', async (e) => {
	if (tableManager != null) tableManager = tableManager.dispose();

	// const file = FileHandler.parseString(await server.request('query_data', `SELECT * FROM ${e.target.value}`), 'json', e.target.value);
	const file = FileHandler.parseString(await server.request('query_data', e.target.value), 'json', e.target.value); //TEST: replace with top line
	const tableLocation = document.querySelector('.data-displayer');
	const btnLocation = document.querySelector('.filter-controls-btn');
	const displayType = e.target.options[e.target.selectedIndex].dataset['default'];

	document.querySelector('.data-displayer').dataset['format'] = displayType;

	tableManager = DataTableManager.getManager(file, tableLocation, btnLocation, displayType);

	addVoucherDisplayBtns();

	document.querySelectorAll('.format-controls > img').forEach(bin => bin.classList.remove('inactive'));
});

document.querySelector('.format-controls').addEventListener('click', (e) => {//change display formats, cards | table
	if (tableManager == null) return;

	switch (e.target) {
		case document.querySelector('.format-controls > img[alt="cards"]'): {
			tableManager.displayCards();
			document.querySelector('.data-displayer').dataset['format'] = 'cards';
			break;
		}
		case document.querySelector('.format-controls > img[alt="table"]'): {
			tableManager.displayTable();
			document.querySelector('.data-displayer').dataset['format'] = 'table';
			break;
		}
	}

	addVoucherDisplayBtns();
});

function addVoucherDisplayBtns() {
	for (const btn of document.querySelectorAll('.data-displayer button#plant')) {
		btn.addEventListener('click', async () => {
			const idx = Number(btn.dataset['idx']);

			const modal = document.createElement('dialog');
			modal.className = 'plant-viewer-modal';

			// const plantInfo = await server.request('query_data', `SELECT * FROM vouchers WHERE idx = ${idx}`); //TODO: implement server integration
		});
	}
}