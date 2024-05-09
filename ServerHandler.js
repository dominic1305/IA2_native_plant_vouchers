export default class ServerHandler {
	#iframe;
	/**@private @param {HTMLIFrameElement} iframe*/
	constructor(iframe) {
		this.#iframe = iframe;
	}
	/**@returns {Promise<ServerHandler>}*/
	static async getConnection() {
		const iframe = document.createElement('iframe');
		iframe.src = './../server.php';
		iframe.style.display = 'none';

		let buffer;
		await new Promise((resolve, reject) => {
			window.addEventListener('message', (e) => {
				const data = JSON.parse(e.data);
				if (data['cmd'] = 'state-check' && data['online']) return resolve(true);
			});
			document.body.appendChild(iframe);
			setTimeout(() => { return reject('[ERROR] unable to get server connection'); }, 1000);
		}).then(() => buffer = new ServerHandler(iframe)).catch(msg => alert(msg));

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
			}, {once: true});

			this.#iframe.contentWindow.postMessage(JSON.stringify({cmd: cmd, data: data}, (_, val) => (typeof val == 'bigint') ? val.toString() : val), '*');

			setTimeout(() => { return reject('[ERROR] server response timeout'); }, 1000);
		}).then(response => buffer = response).catch(msg => alert(msg));

		return buffer;
	}
	/**@returns {Promise<boolean>}*/
	async validate() {
		return await this.request('state-check');
	}
}