/**@static*/
export default class Notification {
	/**@type {HTMLDivElement?}*/ static #container;
	/**@param {string} str*/
	static notify(str) {
		if (this.#container == null) this.#container = this.#createContainer();

		const msg = document.createElement('p');
		msg.innerHTML = str;
		this.#container.appendChild(msg);
		setTimeout(() => {
			this.#container.removeChild(msg);
		}, 3000);
	}
	static #createContainer() {
		const container = document.createElement('div');
		container.className = 'notification-container';

		document.body.appendChild(container);
		return container;
	}
}