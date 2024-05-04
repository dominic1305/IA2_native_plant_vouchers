import ServerHandler from "./../ServerHandler.js";
import DataTableManager from "./../DataTableManager.js";
import FileHandler from "./../FileHandler.js";

/**@type {ServerHandler}*/ let server;
/**@type {DataTableManager?}*/ let tableManager;

document.body.onload = async () => {
	server = await ServerHandler.getConnection();
}

document.querySelector('#database-selecter').addEventListener('change', async (e) => {
	if (tableManager != null) tableManager = tableManager.dispose();

	// const file = FileHandler.parseString(await server.request('query_data', `SELECT * FROM ${e.target.value}`), 'json', e.target.value);
	const file = FileHandler.parseString(await server.request('query_data', e.target.value), 'json', e.target.value); //TEST: replace with top line
	const tableLocation = document.querySelector('.data-displayer');
	const btnLocation = document.querySelector('.filter-controls-btn');
	const displayType = e.target.options[e.target.selectedIndex].dataset['default'];

	tableManager = DataTableManager.getManager(file, tableLocation, btnLocation, displayType);

	document.querySelectorAll('.format-controls > img').forEach(bin => bin.classList.remove('inactive'));
});

document.querySelector('.format-controls').addEventListener('click', (e) => {
	if (tableManager == null) return;

	switch (e.target) {
		case document.querySelector('.format-controls > img[alt="cards"]'): tableManager.displayCards(); break;
		case document.querySelector('.format-controls > img[alt="table"]'): tableManager.displayTable(); break;
	}
});