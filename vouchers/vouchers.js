import ServerHandler from "./../ServerHandler.js";
import DataTableManager from "./../DataTableManager.js";
import FileHandler from "./../FileHandler.js";

/**@type {ServerHandler}*/ let server;
/**@type {DataTableManager?}*/ let tableManager;

document.body.onload = async () => {
	server = await ServerHandler.getConnection();
}

document.querySelector('#database-selecter').addEventListener('change', async (e) => {//TEST: only returns full JSON of nurseries
	if (tableManager != null) tableManager = tableManager.dispose();

	const file = FileHandler.parseString(await server.request('query_data', `SELECT * FROM ${e.target.value}`), 'json', e.target.value);
	tableManager = DataTableManager.getManager(file, document.querySelector('.data-displayer'), document.querySelector('.filter-controls-btn'));
	console.log(tableManager);
});