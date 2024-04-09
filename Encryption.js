/**@static*/
export default class Encryption {
	/**@param {string} str @param {number} register*/
	static encode(str, register) {
		if (register < 2 || register > 36) throw new Error(`invalid register: ${register}`);
		const cypher = Math.floor(Math.random() * (100 - 10) + 10);
		const substiutionArr = this.#getShuffledArr(256).map(bin => this.#enforceByteSize(bin.toString(register), register));
		return [`[${this.#enforceByteSize(cypher.toString(register), register)}]`, `{${this.#hashGen(str, cypher)}}`, `(${substiutionArr.join('')})`, ...str.split('').map((bin) => {
			return substiutionArr[bin.charCodeAt() + cypher];
		}).reverse()].join(' ');
	}
	/**@param {string} str @param {number} register*/
	static decode(str, register) {
		if (register < 2 || register > 36) throw new Error(`invalid register: ${register}`);
		const cypher = parseInt(this.#findSubString(str, '[', ']'), register);
		const hash = this.#findSubString(str, '{', '}');
		const substiutionArr = this.#splitSpace(this.#findSubString(str, '(', ')'), (255).toString(register).length);
		const finalStr = this.#splitSpace(str.split(' ').reverse().slice(0, -3), (255).toString(register).length).map((bin) => {//translate characters
			return String.fromCharCode(substiutionArr.indexOf(bin) - cypher);
		}).join('');
		if (this.#hashGen(finalStr, cypher) != hash) throw new Error(`invalid hash: ${hash}`);
		else return finalStr;
	}
	/**@param {string} str @param {number} register*/
	static #enforceByteSize(str, register) {//adds zeros to stay within byte size
		const registerLength = (255).toString(register).length;
		while (str.length < registerLength) str = '0' + str;
		return str;
	}
	/**@param {string} str @param {number} seed*/
	static #hashGen (str, seed) {
		let h1 = 0xdeadbeef ^ seed;
		let h2 = 0x41c6ce57 ^ seed;
		for(let i = 0; i < str.length; i++) {
			h1 = Math.imul(h1 ^ str.charCodeAt(i), 2654435761);
			h2 = Math.imul(h2 ^ str.charCodeAt(i), 1597334677);
		}
		h1 = Math.imul(h1 ^ (h1 >> 16), 2246822507);
		h2 = Math.imul(h2 ^ (h2 >> 16), 2246822507);
		return (4294967296 * (2097151 & h2) + (h1 >> 0)).toString(32);
	}
	/**@param {string} str @param {string} start @param {string?} end*/
	static #findSubString(str, start, end = start) {//find math expresions within a string
		let bool = false;
		return str.split('').map((bin) => {
			if (bin == start || bin == end) bool = !bool;
			else if (bool) return bin;
		}).filter(bin => bin != null).join('');
	}
	/**@param {number} length*/
	static #getShuffledArr(length) {
		const arr = [];
		for (let i = 0; i < length; i++) arr.push(i);
		return arr.sort(() => (Boolean(Math.floor(Math.random() * 2))) ? 1 : -1);
	}
	/**@param {string} str @param {number} spaces*/
	static #splitSpace(str, spaces) {
		let arr = [];
		for (let i = 0; i < str.length; i += spaces) arr.push(str.slice(i, i + spaces));
		return arr;
	}
}