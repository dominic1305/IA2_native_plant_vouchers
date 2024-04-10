//"appropriated" from https://stackoverflow.com/questions/424292/seedable-javascript-random-number-generator

export default class RandomNumberGenerator {
	#seed;
	#m;
	#a;
	#c;
	#state;
	/**@param {number} seed*/
	constructor(seed) {
		this.#seed = seed;
		this.#m = 0x80000000; //2^31
		this.#a = 1103515245;
		this.#c = 12345;
		this.#state = seed ?? Math.floor(Math.random() * (this.#m-1));
	}
	get Seed() {
		return this.#seed;
	}
	/**@returns {number}*/
	nextInt() {//returns a random integer
		this.#state = (this.#a * this.#state + this.#c) % this.#m;
		return this.#state;
	}
	/**@returns {number}*/
	nextFloat() {//returns a value between 0 & 1
		return this.nextInt() / (this.#m - 1);
	}
	/**@returns {number} @param {number} start @param {number} end*/
	nextRange(start, end) {//returns a value between the two bounds
		if (start > end) throw new Error('start is larger than end');
		const range = end - start;
		const randUnder1 = this.nextInt() / this.#m;
		return start + Math.floor(randUnder1 * range);
	}
	/**@param {any[]} arr*/
	choose(arr) {//returns a random element of an array
		return arr[this.nextRange(0, arr.length)];
	}
	/**@returns {Generator<number>} @param {number} indices*/
	*nextFloatArr(indices) {
		for (let i = 0; i < indices; i ++) {
			yield this.nextFloat();
		}
	}
	/**@returns {Generator<number>} @param {number} indices*/
	*nextIntArr(indices) {
		for (let i = 0; i < indices; i ++) {
			yield this.nextInt();
		}
	}
}