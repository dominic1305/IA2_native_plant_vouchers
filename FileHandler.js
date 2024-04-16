export default class FileHandler {
	#data;
	#keys;
	#DB_name;
	get Keys() {
		return Object.freeze(this.#keys);
	}
	get Length() {
		const arrs = Object.values(this.#data).map(bin => bin.length);
		return arrs.reduce((a, b) => a + b) / Object.values(this.#data).length;
	}
	get Types() {
		let obj = {};
		for (const key of this.#keys) {
			/**@type {string[]}*/ const typeArr = this.#data[key].map(bin => typeof bin);
			obj[key] = (typeArr.some(bin => bin == 'string')) ? 'string' : typeArr[0];
		}
		return obj;
	}
	get CreateTableStmt() {
		const buffer = [];
		for (const key of this.#keys) {
			let maxLength = 0;
			switch (this.Types[key]) {
				case 'string': maxLength = Math.max(...this.#data[key].map(bin => bin.length)); break;
				case 'number': maxLength = Math.max(...this.#data[key]); break;
				case 'bigint': maxLength = this.#data[key].reduce((a, b) => b > a ? b : a); break;
				default: throw new Error('invalid type for key');
			}
			buffer.push(`${key.replaceAll(' ', '_')} ${FileHandler.#getSQLType(this.Types[key], maxLength)}`);
		}
		return `CREATE TABLE ${this.#DB_name} (idx int UNSIGNED, ${buffer.join(', ')});`; //TODO: 'idx' is for when plant selection is implemented
	}
	/**@private @param {{}} obj @param {string[]} keys @param {string} DB_name*/
	constructor(obj, keys, DB_name) {
		this.#data = obj;
		this.#keys = keys;
		this.#DB_name = DB_name;
	}
	/**@returns {Promise<FileHandler>} @param {File} file @param {string} DB_name*/
	static async parseFile(file, DB_name) {
		let buffer;
		await file.text().then(txt => buffer = this.parseString(txt, file.name.split('.').at(-1), DB_name));
		return buffer;
	}
	/**@returns {FileHandler} @param {string} str @param {'csv' | 'json' | 'xml'} format @param {string} DB_name*/
	static parseString(str, format, DB_name) {
		let keys = [];
		let obj = {};

		if (format == 'csv') {
			keys = str.split('\r\n')[0].split(',').map(bin => bin.toLowerCase());
			for (const key of keys) {//init keys
				obj[key] = [];
			}
			for (const line of str.split('\r\n').splice(1)) {//handle data rows
				const dataPoints = this.#tokenizeCSV(line);
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
		} else if (format == 'xml') {
			const rows = this.#TokenizeXML(str.split('\r\n').slice(1, str.split('\r\n').length-1).map(bin => String(bin.replaceAll('\t', ''))));
			for (const row of rows[0]) {//init keys
				const key = row.split('>')[0].slice(1).replaceAll('_', ' ');
				keys.push(key);
				obj[key] = [];
			}
			for (const row of rows) {//handle data row
				for (let i = 0; i < row.length; i++) {
					obj[keys[i]].push(row[i].split('>')[1].split('<')[0]);
				}
			}
		} else throw new Error(`invalid file format {${format}}`);

		if (keys.includes('latitude') && keys.includes('longitude')) {//turn latitude & longitude into a single 64bit hex number
			if (obj['latitude'].length != obj['longitude'].length) throw new Error('invalid latitude or longitude length');
			obj['location'] = [];
			for (let i = 0; i < obj['latitude'].length; i++) {
				obj['location'].push(this.translateLatLongToLong(obj['latitude'][i], obj['longitude'][i]));
			}
			delete obj['latitude'];
			delete obj['longitude'];
			keys.splice(keys.indexOf('latitude'), 2, 'location');
		} else if (keys.includes('latitude') || keys.includes('longitude')) throw new Error('missing either latitude or longitude');

		if (keys.includes('phone number')) {//translate to numbers
			obj['phone number'] = obj['phone number'].map(bin => Number(bin.replaceAll(' ', '')));
		}
		if (keys.includes('fax')) {//translate to numbers
			obj['fax'] = obj['fax'].map(bin => Number(bin.replaceAll(' ', '')));
		}

		return new FileHandler(obj, keys, DB_name);
	}
	/**@param {string} line*/
	static #tokenizeCSV(line) {
		let isInString = false;
		let arr = [];
		let buffer = '';
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
	/**@param {string[]} lines*/
	static #TokenizeXML(lines) {
		let isInTag = false;
		let arr = [];
		let buffer = [];
		for (const line of lines) {
			if (!isInTag && line == '<row>') {//open tag
				isInTag = true;
				continue;
			}
			if (isInTag && line == '</row>') {//close tag
				isInTag = false;
				arr.push(buffer);
				buffer = [];
				continue;
			}
			buffer.push(line);
		}
		return arr;
	}
	/**@param {number} lat @param {number} long*/
	static translateLatLongToLong(lat, long) {//wrapper for 'floatToBinary'
		lat = this.#floatToBinary(lat);
		long = this.#floatToBinary(long);
		return BigInt(parseInt(lat + long, 2));
	}
	/**@returns {{lat: number, long: number}} @param {number} int*/
	static translateIntToLatLong(int) {//wrapper for 'binaryToFloat'
		const bits = int.toString(2);
		const lat = this.#binaryToFloat(bits.slice(0, 32));
		const long = this.#binaryToFloat(bits.slice(32));
		return { lat: lat, long: long };
	}
	/**@param {number} float*/
	static #floatToBinary(float) {//memory nonsense! | "appropriated" from https://gist.github.com/Jozo132/2c0fae763f5dc6635a6714bb741d152f
		const hexToBin = (hex) => { return (parseInt(hex, 16).toString(2)).padStart(32, '0'); };
		const getHex = (i) => { return ('00' + i.toString(16)).slice(-2) };
		const view = new DataView(new ArrayBuffer(4));
		view.setFloat32(0, float);
		return hexToBin(new Array(4).fill().map((_, i) => { return getHex(view.getUint8(i)) }).join(''));
	}
	/**@param {string} binary*/
	static #binaryToFloat(binary) {//even more memory nonsense, YIPPEE! | "appropriated" from https://gist.github.com/Jozo132/2c0fae763f5dc6635a6714bb741d152f
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
	/**@param {string} type @param {number} maxLength*/
	static #getSQLType(type, maxLength) {
		switch (type) {
			case 'string': return (maxLength > 255) ? 'TEXT' : 'TINYTEXT';
			case 'number': return `int${(maxLength > (2 ** 32 / 2)) ? ' UNSIGNED' : ''}`;
			case 'bigint': return `bigint${(maxLength > (2n ** 64n / 2n)) ? ' UNSIGNED' : ''}`;
			default: throw new Error('invalid SQL type conversion');
		}
	}
	/**@returns {string} @param {'csv' | 'json' | 'xml'} format*/
	exportToString(format) {
		let arr = [];

		arr.push(Array.from(this.#keys)); //don't give 'arr' the pointer, it's not allowed!
		for (let i = 0; i < this.Length; i++) {//populate data array
			let lineBuffer = [];
			for (const key of this.#keys) {
				let data = String(this.#data[key][i]);
				if (format == 'csv' && data.includes(',')) data = `"${data}"`; //only do if csv, json stringifier escapes ", BAD!
				lineBuffer.push(data);
			}
			arr.push(lineBuffer);
		}

		if (this.#keys.includes('location')) {//turn location into latitude & longitude
			const locationIdx = arr[0].indexOf('location');
			arr[0].splice(locationIdx, 1, ...['latitude', 'longitude']);
			for (let i = 1; i < arr.length; i++) {//data rows
				const { lat, long } = FileHandler.translateIntToLatLong(Number(arr[i][locationIdx]));
				arr[i].splice(locationIdx, 1, ...[lat, long]);
			}
		}

		if (format == 'csv') {//turn into single string
			arr = arr.map(bin => bin.join(',')).join('\r\n');
		} else if (format == 'json') {//stringify
			arr = JSON.stringify(arr);
		} else if (format == 'xml') {//repopulate for xml
			const keys = arr.splice(0, 1)[0].map(bin => bin.replaceAll(' ', '_')); //remove key row | replace spaces with underscores
			for (let i = 0; i < arr.length; i++) {
				let row = arr[i].map((bin, j) => {//add key tags
					return `\t\t<${keys[j]}>${bin}</${keys[j]}>`;
				}).join('\r\n');
				row = `\t<row>\r\n${row}\r\n\t</row>`;
				arr.splice(i, 1, row);
			}
			arr = `<${this.#DB_name}>\r\n${arr.join('\r\n')}\r\n</${this.#DB_name}>`;
		} else throw new Error('invalid file format');

		return arr;
	}
	/**@param {'csv' | 'json' | 'xml'} format @param {string} filename*/
	exportToFile(format, filename) {
		const file = new Blob([this.exportToString(format)]);
		const element = document.createElement('a');
		element.href = URL.createObjectURL(file);
		element.download = `${filename}.${format}`;
		element.click();
		URL.revokeObjectURL(element.href);

		return file;
	}
	/**@param {FileHandler} newFile*/
	add(newFile) {
		if (this.#keys.some((_, i, arr) => !arr.includes(newFile.Keys[i]))) throw new Error('non-matching keys, cannot add files');
		const thisStr = this.exportToString('csv');
		const newStr = newFile.exportToString('csv');
		return FileHandler.parseString(`${thisStr}\r\n${newStr.split('\r\n').slice(1).join('\r\n')}`, 'csv', this.#DB_name);
	}
}