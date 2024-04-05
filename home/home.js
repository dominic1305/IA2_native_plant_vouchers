import ServerHandler from "./../ServerHandler.js";

/**@type {ServerHandler} */ let server;

window.onload = async () => {
	server = await ServerHandler.getConnection();
	console.log(await server.validate());
}