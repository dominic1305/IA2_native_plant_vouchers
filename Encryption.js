import RandomNumberGenerator from "./RandomNumberGenerator.js";

/**@static*/
export default class Encryption {
	/**@param {string} str @param {number} register*/
	static encode(str, register) {
		if (register < 2 || register > 36 || typeof register != 'number') throw new Error(`invalid register: ${register}`);
		const cypher = Math.floor(Math.random() * (100 - 10) + 10);
		const rng = new RandomNumberGenerator(new Date().valueOf());
		const substiutionArr = this.#getShuffledArr(256, rng).map(bin => this.#regSize(bin.toString(register), register));
		return [`[${this.#regSize(cypher.toString(register), register)}]`, `{${this.#hashGen(str, cypher)}}`, `(${(rng.Seed * 2).toString(register)})`, ...str.split('').map((bin) => {
			return substiutionArr[bin.charCodeAt() + cypher];
		}).reverse()].join(' ');
	}
	/**@param {string} str @param {number} register*/
	static decode(str, register) {
		if (register < 2 || register > 36 || typeof register != 'number') throw new Error(`invalid register: ${register}`);
		const cypher = parseInt(this.#findSubString(str, '[', ']'), register);
		const hash = this.#findSubString(str, '{', '}');
		const rng = new RandomNumberGenerator(parseInt(this.#findSubString(str, '(', ')'), register) / 2);
		const substiutionArr = this.#getShuffledArr(256, rng).map(bin => this.#regSize(bin.toString(register), register));
		const finalStr = str.split(' ').reverse().slice(0, -3).map((bin) => {//translate characters
			return String.fromCharCode(substiutionArr.indexOf(bin) - cypher);
		}).join('');
		if (this.#hashGen(finalStr, cypher) != hash) throw new Error(`invalid hash: ${hash}`);
		else return finalStr;
	}
	/**@param {string} str @param {number} register*/
	static #regSize(str, register) {//add zeros to stay within register size
		return str.padStart((255).toString(register).length, '0');
	}
	/**@param {string} str @param {number} seed*/
	static #hashGen(str, seed) {
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
	static #findSubString(str, start, end = start) {//find expresions within a string
		let bool = false;
		return str.split('').map((bin) => {
			if (bin == start || bin == end) bool = !bool;
			else if (bool) return bin;
		}).filter(bin => bin != null).join('');
	}
	/**@param {number} length @param {RandomNumberGenerator} rng*/
	static #getShuffledArr(length, rng) {
		return new Array(length).fill().map((_, i) => i).sort(() => (Boolean(Math.floor(rng.nextFloat() * 2))) ? 1 : -1);
	}
}