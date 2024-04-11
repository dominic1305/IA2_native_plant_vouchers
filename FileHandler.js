export default class FileHandler {
	#data;
	#keys;
	/**@private @param {{}} obj @param {string[]} keys*/
	constructor(obj, keys) {
		this.#data = obj;
		this.#keys = keys;
	}
	/**@returns {Promise<FileHandler>} @param {File} file*/
	static async parseFile(file) {//wrapper function for 'getFromString'
		let buffer;
		await file.text().then(txt => buffer = this.parseString(txt, file.name.split('.').at(-1)));
		return buffer;
	}
	/**@returns {FileHandler} @param {string} str @param {'csv' | 'json'} format*/
	static parseString(str, format) {
		let keys = [];
		let obj = {};

		if (format == 'csv') {
			keys = str.split('\r\n')[0].split(',').map(bin => bin.toLowerCase());
			for (const key of keys) {//init keys
				obj[key] = [];
			}
			for (const line of str.split('\r\n').splice(1)) {//handle data rows
				const dataPoints = this.#parseCSVLine(line);
				for (let i = 0; i < dataPoints.length; i++) {
					obj[keys[i]].push(dataPoints[i]);
				}
			}
		} else if (format == 'json') {
			const data = JSON.parse(str);
			keys = data[0];
			for (const key of keys) {//init keys
				obj[key] = [];
			}
			for (const line of data.slice(1)) {//handle data row
				for (let i = 0; i < line.length; i++) {
					obj[keys[i]].push(line[i]);
				}
			}
		} else throw new Error(`invalid file format {${format}}`);

		if (keys.includes('latitude') && keys.includes('longitude')) {//turn latitude & longitude into a single 64bit hex number
			if (obj['latitude'].length != obj['longitude'].length) throw new Error('invalid latitude or longitude length');
			obj['location'] = [];
			for (let i = 0; i < obj['latitude'].length; i++) {
				obj['location'].push(this.translateLatLongToHex(obj['latitude'][i], obj['longitude'][i]));
			}
			delete obj['latitude'];
			delete obj['longitude'];
			keys.splice(keys.indexOf('latitude'), 2, 'location');
		} else if (keys.includes('latitude') || keys.includes('longitude')) throw new Error('missing either latitude or longitude');

		return new FileHandler(obj, keys);
	}
	/**@returns {string[]} @param {string} line*/
	static #parseCSVLine(line) {
		let isInString = false;
		let arr = [];
		let buffer = "";
		for (const char of line.split('')) {
			if (!isInString && char == '"') {//open "
				isInString = true;
				continue;
			}
			if (isInString && char == '"') {//close "
				isInString = false;
				arr.push(buffer);
				buffer = '';
				continue;
			}
			if (!isInString && char == ',' && buffer != '') {//close point
				arr.push(buffer);
				buffer = '';
				continue;
			}
			if (!isInString && char == ',' && buffer == '') {//skip
				continue;
			}
			buffer += char;
		}
		if (buffer != '') {//flush buffer
			arr.push(buffer);
		}
		return arr;
	}
	/**@param {number} lat @param {number} long*/
	static translateLatLongToHex(lat, long) {//wrapper for 'floatToBinary'
		lat = this.#floatToBinary(lat);
		long = this.#floatToBinary(long);
		return parseInt(lat + long, 2).toString(16);
	}
	/**@returns {{lat: number, long: number}} @param {string} hex*/
	static translateHexToLatLong(hex) {//wrapper for 'binaryToFloat'
		hex = parseInt(hex, 16).toString(2)
		const lat = this.#binaryToFloat(hex.split('').slice(0, 32).join(''));
		const long = this.#binaryToFloat(hex.split('').slice(32).join(''));
		return { lat: lat, long: long };
	}
	/**@param {number} float*/
	static #floatToBinary(float) {//memory nonsense!
		const hexToBin = (hex) => { return (parseInt(hex, 16).toString(2)).padStart(32, '0'); };
		const getHex = (i) => { return ('00' + i.toString(16)).slice(-2) };
		const view = new DataView(new ArrayBuffer(4));
		view.setFloat32(0, float);
		return hexToBin(new Array(4).fill().map((_, i) => { return getHex(view.getUint8(i)) }).join(''));
	}
	/**@param {string} binary*/
	static #binaryToFloat(binary) {//even more memory nonsense, YIPPEE!
		const int = parseInt(binary, 2);
    	if (int == 0) return 0;

		let sign = int >> 31 || 1;
		let E = (int >> 23 & 0xff) - 0x7f;
		let mantissa = ((int & 0x7fffff) + 0x800000).toString(2);
		let float32 = 0;
		for (const bit of mantissa) {
			float32 += parseInt(bit) ? Math.pow(2, E) : 0; E--;
		}
		return float32 * sign;
	}
	get Length() {
		const arrs = Object.values(this.#data).map(bin => bin.length);
		return arrs.reduce((a, b) => a + b) / Object.values(this.#data).length;
	}
	/**@param {'csv' | 'json'} format @param {string} filename*/
	export(format, filename) {
		let arr = [];

		arr.push(this.#keys);
		for (let i = 0; i < this.Length; i++) {//populate data array
			let lineBuffer = [];
			for (const key of this.#keys) {
				let data = String(this.#data[key][i]);
				if (format == 'csv' && data.includes(',')) data = `"${data}"`; //NOTE: only do if csv, json stringifier escapes ", BAD!
				lineBuffer.push(data);
			}
			arr.push(lineBuffer);
		}

		if (this.#keys.includes('location')) {//turn location into latitude & longitude
			const locationIdx = arr[0].indexOf('location');
			arr[0].splice(locationIdx, 1, ...['latitude', 'longitude']);
			for (let i = 1; i < arr.length; i++) {//data rows
				const { lat, long } = FileHandler.translateHexToLatLong(arr[i][locationIdx]);
				arr[i].splice(locationIdx, 1, ...[lat, long]);
			}
		}

		if (format == 'csv') {//turn into single string
			arr = arr.map(bin => bin.join(',')).join('\r\n');
		} else if (format == 'json') {
			arr = JSON.stringify(arr);
		} else throw new Error('invalid file format');

		const file = new Blob([arr]);
		const element = document.createElement('a');
		element.href = URL.createObjectURL(file);
		element.download = `${filename}.${format}`;
		element.click()
		URL.revokeObjectURL(element.href);
	}
}