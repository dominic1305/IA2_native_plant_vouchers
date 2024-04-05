export default class ServerHandler {
	#iframe;
	/**@private @param {Window} iframe*/
	constructor(iframe) {
		this.#iframe = iframe;
	}
	/**@returns {Promise<ServerHandler>}*/
	static async getConnection() {
		const iframe = document.createElement('iframe');
		iframe.src = './../server.php'
		iframe.style.display = 'none';

		let buffer;
		await new Promise((resolve, reject) => {
			window.addEventListener('message', (e) => {
				const data = JSON.parse(e.data);
				if (data['cmd'] = 'state-check' && data['online']) return resolve(true);
			});
			document.body.appendChild(iframe);
			setTimeout(() => { return reject('[ERROR] unable to get server connection'); }, 500);
		}).then(() => {//connection was established
			buffer = new ServerHandler(iframe.contentWindow);
		}).catch(msg => console.error(msg));

		return buffer;
	}
	/**@returns {Promise<any>} @param {string} cmd @param {any} data*/
	async request(cmd, data) {
		let buffer;
		await new Promise((resolve, reject) => {
			window.addEventListener('message', (e) => {
				const data = JSON.parse(e.data);
				if (data['cmd'] != cmd) return reject(`[ERROR] invalid command response {${data['cmd']}}`);
				if (String(data['response']).includes('[ERROR]')) return reject(data['response']);
				return resolve(data['response']);
			});
			this.#iframe.postMessage(JSON.stringify({cmd: cmd, data: data}), '*');
			setTimeout(() => { return reject('[ERROR] server response timeout'); }, 500);
		}).then(response => buffer = response).catch(msg => console.error(msg));
		return buffer;
	}
	/**@returns {Promise<boolean>}*/
	async validate() {
		return await this.request('state-check');
	}
}