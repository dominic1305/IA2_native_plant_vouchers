import ServerHandler from "./../ServerHandler.js";
import DataTableManager from "./../DataTableManager.js";
import FileHandler from "./../FileHandler.js";

/**@type {ServerHandler}*/ let server;
/**@type {DataTableManager?}*/ let tableManager;
/**@type {MutationObserver?} */ let dataObserver;
/**@type {[number, number]}*/ let voucher = new Array(2);

document.body.onload = async () => {
	server = await ServerHandler.getConnection();
}

document.querySelector('nav > div.title').addEventListener('click', () => {//go back home
	location.assign('./../home/index.html');
});

document.querySelector('#database-selecter').addEventListener('change', async (e) => {
	if (tableManager != null) tableManager = tableManager.dispose();
	if (dataObserver != null) dataObserver.disconnect();

	const file = FileHandler.parseString(await server.request('query_data', `SELECT * FROM ${e.target.value}`), 'json', e.target.value);
	const tableLocation = document.querySelector('.data-displayer');
	const btnLocation = document.querySelector('.filter-controls-btn');
	const displayType = e.target.options[e.target.selectedIndex].dataset['default'];

	document.querySelector('.data-displayer').dataset['format'] = displayType;

	dataObserver = new MutationObserver(() => {
		if (e.target.value != 'species') return;

		switch (document.querySelector('.data-displayer').dataset['format']) {
			case 'table': {
				const bool = Boolean(Number(document.querySelector('.voucher-menu').dataset['shown']));
				const offset = (bool) ? parseInt(window.getComputedStyle(document.querySelector('.voucher-menu')).height) - 20 : 0;
				document.querySelector('table.data-display').style.paddingBottom = `${offset}px`;
				addToVoucher_table();
				break;
			}
			case 'cards': {
				const bool = Boolean(Number(document.querySelector('.voucher-menu').dataset['shown']));
				const offset = (bool) ? parseInt(window.getComputedStyle(document.querySelector('.voucher-menu')).height) : 0;
				document.querySelector('.data-displayer-cards').style.paddingBottom = `${offset}px`;
				addToVoucher_cards();
				break;
			}
		}
	});
	dataObserver.observe(document.querySelector('.data-displayer'), { attributes: true, characterData: true, childList: true, });

	tableManager = DataTableManager.getManager(file, tableLocation, btnLocation, displayType);

	document.querySelectorAll('.format-controls > img').forEach(bin => bin.classList.remove('inactive'));
});

document.querySelector('.format-controls').addEventListener('click', (e) => {//change display formats, cards | table
	if (tableManager == null) return;

	dataObserver.disconnect(); //changing format, disengage observer for this

	switch (e.target) {
		case document.querySelector('.format-controls > img[alt="cards"]'): {
			tableManager.displayCards();
			addToVoucher_cards();
			document.querySelector('.data-displayer').dataset['format'] = 'cards';

			const bool = Boolean(Number(document.querySelector('.voucher-menu').dataset['shown']));
			const offset = (bool) ? parseInt(window.getComputedStyle(document.querySelector('.voucher-menu')).height) : 0;
			document.querySelector('.data-displayer-cards').style.paddingBottom = `${offset}px`;
			break;
		}
		case document.querySelector('.format-controls > img[alt="table"]'): {
			tableManager.displayTable();
			addToVoucher_table();
			document.querySelector('.data-displayer').dataset['format'] = 'table';

			const bool = Boolean(Number(document.querySelector('.voucher-menu').dataset['shown']));
			const offset = (bool) ? parseInt(window.getComputedStyle(document.querySelector('.voucher-menu')).height) - 20 : 0;
			document.querySelector('table.data-display').style.paddingBottom = `${offset}px`;
			break;
		}
	}

	dataObserver.observe(document.querySelector('.data-displayer'), { attributes: true, characterData: true, childList: true }); //re-engage observer
});

document.querySelector('#see-selected-plants-btn').addEventListener('click', () => {
	const modal = document.createElement('dialog');
	modal.className = 'voucher-plants-modal';

	let table = '<table><tbody>';

	table += '<div id="close-modal">&#10006;</div>';

	for (let i = 0; i < voucher.length; i++) {
		const txt = (voucher[i] != null) ? tableManager.Data['species'][voucher[i]].split('').map(bin => {
			return (bin.charCodeAt() < 128) ? bin : ' ';
		}).join('') : 'not selected';
		table += `<tr><th>Plant ${i+1}</th><td>${txt}</td><td id="remove" data-idx="${i}">&#10006;</td></tr>`;
	}

	modal.innerHTML = table + '</tbody></table>';

	document.body.appendChild(modal);
	modal.showModal();

	for (const btn of modal.querySelectorAll('td[id="remove"]')) {
		btn.addEventListener('click', () => {
			switch (Number(btn.dataset['idx'])) {
				case 0: {//swap indices 1 and 0, redisplay
					const plant_2_idx = voucher[1];
					voucher[1] = null;
					voucher[0] = plant_2_idx;
					btn.parentElement.querySelector('td:nth-child(2)').innerHTML = btn.parentElement.parentElement.querySelector('tr:nth-child(2) > td:nth-child(2)').innerHTML;
					btn.parentElement.parentElement.querySelector('tr:nth-child(2) > td:nth-child(2)').innerHTML = 'not selected';
					break;
				}
				case 1: {//delete idx 1, redisplay
					voucher[1] = null;
					btn.parentElement.querySelector('td:nth-child(2)').innerHTML = 'not selected';
					break;
				}
			}

			if (voucher.filter(bin => bin == null).length == voucher.length) {//all indecies are null, close modal
				document.body.removeChild(modal);
				toggleVoucherMenu(false);
			}
		});
	}

	modal.querySelector('#close-modal').addEventListener('click', () => {
		document.body.removeChild(modal);
	});
});

document.querySelector('.voucher-menu > #phone-number').addEventListener('input', () => {
	let val = String(document.querySelector('.voucher-menu > #phone-number').value.replaceAll(' ', '')).split('').map((bin, i) => {
		return (i == 2 || i == 6) ? ` ${bin}` : bin
	}).join('');

	if (val.length > 12) val = val.slice(0, 12); //larger than 10 digits + 2 spaces

	if (isNaN(Number(val[val.length-1]))) val = val.slice(0, val.length-1); //new char isn't a digit

	document.querySelector('.voucher-menu > #phone-number').value = val;
});

document.querySelector('.voucher-menu > #rate-number').addEventListener('input', () => {
	let val = String(document.querySelector('.voucher-menu > #rate-number').value);

	if (val.length > 10) val = val.slice(0, 10); //larger than 10 digits

	if (isNaN(Number(val[val.length-1]))) val = val.slice(0, val.length-1); //new char isn't a digit

	document.querySelector('.voucher-menu > #rate-number').value = val;
});

document.querySelector('.voucher-menu div.submit-btn').addEventListener('click', () => {
	try {
		const info = Object.fromEntries(Array.from(document.querySelectorAll('.voucher-menu > input, .voucher-menu > select')).map(bin => {//get voucher menu info
			if (bin.value == '') throw bin.id;

			if (bin.id == 'phone-number' || bin.id == 'rate-number') return [ bin.id.replaceAll('-', '_'), Number(bin.value.replaceAll(' ', '')) ];

			return [ bin.id.replaceAll('-', '_'), bin.value ];
		}));

		for (let i = 0; i < voucher.length; i++) {//add plant indecies
			info[`plant_${i+1}`] = voucher[i];
		}

		info['placement_time'] = new Date().valueOf();

		console.log(JSON.stringify(info)); //TODO: implement server integration, send to database
	} catch (elemId) {
		if (elemId instanceof Error) throw elemId; //encountered an actual error, throw higher

		const errElem = document.querySelector(`.voucher-menu > #${elemId}`);
		errElem.style.outline = '3px solid #ff0000';

		let opacity = 0xff;
		let interval = setInterval(() => {//error animation
			errElem.style.outline = `3px solid #ff0000${(opacity -= 2).toString(16).padStart(2, '0')}`;
			if (opacity <= 0) return clearInterval(interval);
		}, 10);
	}
});

function addToVoucher_table() {
	for (const row of document.querySelectorAll('.data-displayer tbody > tr')) {
		row.style.cursor = 'pointer';
		row.querySelectorAll('td, th').forEach(bin => bin.style.userSelect = 'none');
		row.addEventListener('click', () => {
			addToVoucher(row.dataset['idx']);
			toggleVoucherMenu(true);
		});
	}
}

function addToVoucher_cards() {
	for (const btn of document.querySelectorAll('.add-to-voucher-btn')) {//add voucher btns
		btn.addEventListener('click', () => {
			addToVoucher(Number(btn.parentElement.dataset['idx']));
			toggleVoucherMenu(true);
		});
	}
}

/**@param {number} idx*/
function addToVoucher(idx) {
	if (voucher[0] == null && voucher[1] == null) {//set first plant choice
		voucher[0] = idx;
	} else if (voucher[0] != null && voucher[1] == null && idx != voucher[0]) {//set second plant choise
		voucher[1] = idx;
	} else throw new Error('too many plants selected');
}

/**@param {boolean} bool*/
function toggleVoucherMenu(bool = !Boolean(Number(document.querySelector('.voucher-menu').dataset['shown']))) {
	const menu = document.querySelector('.voucher-menu');
	menu.dataset['shown'] = Number(bool);

	for (const inp of document.querySelectorAll('.voucher-menu > input, .voucher-menu > select')) {
		inp.value = (bool) ? '' : inp.value;
	}

	menu.style.bottom = (bool) ? '0' : '-50vh'; //bring menu up/down

	switch (tableManager.DisplayType) {
		case "table": {
			const offset = (bool) ? parseInt(window.getComputedStyle(menu).height) - 20 : 0;
			document.querySelector('table.data-display').style.paddingBottom = `${offset}px`;
			break;
		}
		case "cards": {
			const offset = (bool) ? parseInt(window.getComputedStyle(menu).height) : 0;
			document.querySelector('.data-displayer-cards').style.paddingBottom = `${offset}px`;
			break;
		}
	}
}