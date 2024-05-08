import FileHandler from "./FileHandler.js";

export default class DataTableManager {
	static #idxSkip = 10;
	#data;
	#tableElement;
	#btnElement;
	#filter;
	#tableIdx;
	/**@type {'table' | 'cards'}*/ #displayType;
	#voucherable = false;
	static get IdxSkip() {
		return Object.freeze(this.#idxSkip);
	}
	get #NewFilter() {
		const element = document.querySelector('.filter-controller-container');
		if (element == null) throw new Error('modal doesn\'t exist');

		const filter = {};
		for (const key of this.#data.Keys) {
			const obj = { checked: false, options: null };

			obj['checked'] = element.querySelector(`div.row[data-key="${key}"] input[type="checkbox"]`).checked;

			if (this.#data.Types[key] == 'string') {//populate options
				obj['options'] = Array.from(new Set(this.#data.Data[key])).map((bin) => { return { checked: true, value: bin } });

				if (element.querySelector(`div.row[data-key="${key}"] div.option-select`) != null) {
					obj['options'] = Array.from(new Set(this.#data.Data[key])).map((bin) => {
						return {
							checked: element.querySelector(`div.row[data-key="${key}"] div.option-select input[data-value="${bin}"]`).checked,
							value: bin
						};
					});
				}
			}

			filter[key] = obj;
		}

		return filter;
	}
	get #FilteredLength() {
		let count = 0;
		rowLoop: for (let i = 0; i < this.#data.Length; i++) {
			itemLoop: for (const key of this.#data.Keys) {
				if (this.#filter[key]['options'] == null) continue itemLoop;
				if (!this.#filter[key]['options'].find(bin => bin['value'] == this.#data.Data[key][i])['checked']) continue rowLoop;
			}
			count++;
		}
		return count;
	}
	get DisplayType() {
		return this.#displayType;
	}
	get Data() {
		return this.#data.Data;
	}
	get DataName() {
		return this.#data.Name;
	}
	/**@private @param {FileHandler} data @param {HTMLDivElement} tableElement @param {HTMLDivElement} btnElement @param {{}} filterInfo*/
	constructor(data, tableElement, btnElement, filterInfo) {
		this.#data = data;
		this.#tableElement = tableElement;
		this.#btnElement = btnElement;
		this.#filter = filterInfo;
		this.#tableIdx = 0;
	}
	/**@param {FileHandler} file @param {HTMLDivElement} tableLocation @param {HTMLDivElement} btnLocation @param {string} displayType*/
	static getManager(file, tableLocation, btnLocation, displayType) {
		const obj = {};
		for (const key of file.Keys) {
			obj[key] = { checked: true, options: null };
			if (file.Types[key] == 'string') {
				obj[key]['options'] = Array.from(new Set(file.Data[key])).map((bin) => { return { checked: true, value: bin } });
			}
		}

		btnLocation.classList.remove('inactive');

		const manager = new DataTableManager(file, tableLocation, btnLocation, obj);
		manager.#initListeners();

		if (location.href.split('/')[4].split('.')[0] == 'data_view') manager.#voucherable = true; //on data_view page, can place vouchers

		switch (displayType) {
			case "cards": manager.displayCards(); break;
			case "table": manager.displayTable(); break;
			default: throw new Error(`[ERROR] invalid display type`);
		}

		return manager
	}
	/**@param {string} name*/
	static getImgRefName(name) {//God, please forgive me for what I'm about to do
		switch (name) {
			case 'Coastal boobialla':				return 'coastal_boobialla.webp';
			case 'Creeping boobialla':				return 'creeping_boobialla.jpg';
			case 'Fan flower':					 	return 'fan_flower.jpg';
			case 'Native violet':					return 'native_violet.webp';
			case 'Blue flax':						return 'blue_flax.webp';
			case 'Knobby club rush':				return 'knobby_club_rush.jpg';
			case 'Mat rush':						return 'mat_rush.webp';
			case 'Guinea vine':						return 'guinea_vine.jpg';
			case 'Wonga-wonga vine':				return 'wonga-wonga_vine.jpg';
			case 'Bottlebrush':						return 'bottle_brush.jpg';
			case 'Coastal rosemary':				return 'westringia_fruiticosa.jpg';
			case 'Honey myrtle \'Claret Tops\'':	return 'honey_myrtle.jpg';
			case 'Swamp banksia':					return 'swamp_banksia.jpg';
			case 'Tea tree':						return 'tea_tree.webp'
			case 'Thyme honey myrtle':				return 'thyme_honey_myrtle.jpg';
			case 'Banksia':							return 'banksia.webp';
			case 'Grevillea':						return 'grevillea.jpg';
			case 'Lillypilly':						return 'lillypilly.jpg';
			case 'Flame Tree':						return 'flame_tree.jpg';
			case 'Golden penda':					return 'golden_penda.jpeg';
			case 'Ivory curl tree':					return 'ivory_curl_tree.jpg';
			case 'Lemon-scented myrtle':			return 'lemon-scented_myrtle.webp';
			case 'Tuckeroo':						return 'tuckeroo.jpg';
			case 'Tulipwood':						return 'tulipwood.jpg';
			case 'Weeping lillypilly':				return 'weeping_lillypilly.webp';
			default: throw new Error(`invalid img reference: ${name}`);
		}
	}
	#initListeners() {
		this.#btnElement.onclick = () => {
			const element = this.#generateFilterModal();
			this.#btnElement.parentElement.appendChild(element);

			for (const row of element.querySelectorAll('.row')) {
				row.querySelector('input[type="checkbox"]').addEventListener('click', () => {
					if (row.querySelector('.option-select') == null) return;

					if (!row.querySelector('#key-select input').checked && Array.from(row.querySelectorAll('.option-select input')).some(bin => !bin.checked)) {
						row.querySelector('#key-select input').checked = true;
						for (const box of row.querySelectorAll('.option-select input[type="checkbox"]')) {
							box.checked = true;
						}
					} else if (row.querySelector('#key-select > input').checked) {
						row.querySelector('.option-select').classList.remove('inactive');
						for (const box of row.querySelectorAll('.option-select input[type="checkbox"]')) {
							box.checked = true;
						}
					} else {
						row.querySelector('.option-select').classList.add('inactive');
						for (const box of row.querySelectorAll('.option-select input[type="checkbox"]')) {
							box.checked = true;
						}
					}
				});

				for (const option of row.querySelectorAll('.option-select input[type="checkbox"]')) {//disable row if all options deselected
					option.addEventListener('click', () => {
						if (!Array.from(row.querySelectorAll('.option-select input[type="checkbox"]')).some(bin => bin.checked)) {
							row.querySelector('.option-select').classList.add('inactive');
							for (const box of row.querySelectorAll('.option-select input[type="checkbox"]')) {
								box.checked = true;
							}
							row.querySelector('input[type="checkbox"]').checked = false;
						}
					});
				}
			}

			element.querySelector('div.title > p.exit').addEventListener('click', () => {//close modal
				this.#btnElement.parentElement.removeChild(element);
			});

			element.querySelector('.submit').addEventListener('click', () => {
				this.#filter = this.#NewFilter;
				this.#btnElement.parentElement.removeChild(element);
				this.#tableElement.innerHTML = '';
				this.#tableIdx = 0;
				(this.#displayType == 'table') ? this.displayTable() : this.displayCards();
			});
		}
	}
	#generateFilterModal() {
		const parent = document.createElement('div');
		parent.className = 'filter-controller-container';

		parent.innerHTML += '<div class="title"><p class="title-txt">Filter</p><p class="exit">&#10005;</p></div>'; //title

		for (const [ key, { checked, options } ] of Object.entries(this.#filter)) {
			let row = `<div class="row" data-key="${key}">`; //start row

			row += `<label id="key-select" data-key="${key}"><input type="checkbox" ${(checked) ? 'checked' : ''}>${key}</label>`;

			//must have an options array, and the the options array must be at most 70% unique
			if (options != null && options.length / this.#data.Length <= 0.7) {
				row += `<div data-key="${key}" class="option-select ${(checked) ? '' : 'inactive'}">`; //start options

				for (const { checked: bool, value } of options) {
					row += `<label><input type="checkbox" ${(bool) ? 'checked' : ''} data-value="${value}">${value}</label>`; //select options
				}

				row += `</div>`; //end options
			}

			parent.innerHTML += row + '</div>'; //end row
		}

		parent.innerHTML += '<div class="submit">Submit</div>';

		return parent;
	}
	displayTable() {//show table with filter accounted for
		this.#displayType = 'table';

		const scopeController = `<div class="scope-controller">
			<div id="left" ${(this.#tableIdx <= 0) ? 'class="inactive"' : ''}>&#10092;</div>
			<div id="page-number">${Math.floor(this.#tableIdx / DataTableManager.#idxSkip) + 1}</div>
			<div id="right" ${(this.#tableIdx + DataTableManager.#idxSkip >= this.#FilteredLength) ? 'class="inactive"' : ''}>&#10093;</div>
		</div>`;

		let table = '<table class="data-display">'; //start table

		table += '<thead><tr>'; //start head
		for (const key of this.#data.Keys) {
			if (!this.#filter[key].checked) continue;
			table += `<th>${key}</th>`;
		}
		table += '</tr></thead>'; //end head

		table += '<tbody>'; //start body

		let rowCount = 0;
		rowLoop: for (let i = this.#tableIdx; rowCount < DataTableManager.#idxSkip && i < this.#data.Length; i++) {
			let row = `<tr data-idx="${i}">`; //start row

			itemLoop: for (const key of this.#data.Keys) {
				if (this.#filter[key].options != null && !this.#filter[key].options.find(bin => bin.value == this.#data.Data[key][i]).checked) {
					continue rowLoop;
				} else if (!this.#filter[key].checked) continue itemLoop;

				switch (key) {
					case 'location': {
						const { lat, long } = FileHandler.translateLongToLatLong(this.#data.Data[key][i]);
						row += `<td><button id="location" data-lat="${lat}" data-long="${long}">Show Map</button></td>`;
						break;
					}
					case 'phone number':
					case 'fax': {
						const txt = String(this.#data.Data[key][i]).padStart(10, '0').split('').map((bin, i) => (i == 2 || i == 6) ? ` ${bin}` : bin).join('');
						row += `<td>${txt}</td>`;
						break;
					}
					default: {
						const txt = this.#data.Data[key][i].split('').map(bin => (bin.charCodeAt() <= 127) ? bin : ' ').join(''); //remove non-ascii characters
						row += `<td>${txt}</td>`;
					}
				}
			}
			rowCount++;

			table += row + '</tr>'; //end row
		}
		table += '</tbody>'; //end body

		this.#tableElement.innerHTML = scopeController + table + '</table>'; //concat & add to DOM

		this.#tableElement.querySelectorAll('button#location').forEach(bin => {//has locations
			bin.addEventListener('click', () => {
				const { lat, long } = bin.dataset;
				this.#createMapModal(lat, long);
			});
		});

		this.#tableElement.querySelector('.scope-controller > div#left').addEventListener('click', () => {//previous page
			if (this.#tableElement.querySelector('.scope-controller > div#left').classList.contains('inactive')) return;
			this.#tableIdx -= DataTableManager.#idxSkip;
			this.#tableElement.innerHTML = '';
			(this.#displayType == 'table') ? this.displayTable() : this.displayCards();
		});

		this.#tableElement.querySelector('.scope-controller > div#right').addEventListener('click', () => {//next page
			if (this.#tableElement.querySelector('.scope-controller > div#right').classList.contains('inactive')) return;
			this.#tableIdx += DataTableManager.#idxSkip;
			this.#tableElement.innerHTML = '';
			(this.#displayType == 'table') ? this.displayTable() : this.displayCards();
		});
	}
	displayCards() {
		this.#displayType = 'cards';

		let container = '<div class="data-displayer-cards">';

		cardLoop: for (let i = 0; i < this.#data.Length; i++) {
			let card = `<div class="card" data-idx="${i}">`;

			if (this.#data.Name == 'species') {//add plant imgs
				const comName = this.#data.Data['species'][i].split('(')[0].split('').map(bin => (bin.charCodeAt() < 128) ? bin : '').join('').replace('.', '');
				card += `<img class="plant-img" src="./../img/${DataTableManager.getImgRefName(comName.trim())}" draggable="false">`;
			}

			itemLoop: for (const key of this.#data.Keys) {
				if (this.#filter[key].options != null && !this.#filter[key].options.find(bin => bin.value == this.#data.Data[key][i]).checked) {
					continue cardLoop;
				} else if (!this.#filter[key].checked) continue itemLoop;

				switch (key) {
					case 'location': {
						const { lat, long } = FileHandler.translateLongToLatLong(this.#data.Data[key][i]);
						card += `<button id="location" data-lat="${lat}" data-long="${long}">Show Map</button>`;
						break;
					}
					case 'phone number':
					case 'fax': {
						const txt = String(this.#data.Data[key][i]).padStart(10, '0').split('').map((bin, i) => (i == 2 || i == 6) ? ` ${bin}` : bin).join('');
						card += `<p>${txt}</p>`;
						break;
					}
					default: {
						const txt = this.#data.Data[key][i].split('').map(bin => (bin.charCodeAt() <= 127) ? bin : ' ').join(''); //remove non-ascii characters
						card += `<p>${txt}</p>`;
					}
				}
			}

			if (this.#voucherable && this.#data.Name == 'species') {//add voucher btns
				card += '<div class="add-to-voucher-btn">Add to Voucher</div>';
			}

			container += card + '</div>';
		}

		this.#tableElement.innerHTML = container + '</div>'; //concat & add to DOM

		this.#tableElement.querySelectorAll('button#location').forEach(bin => {//has locations
			bin.addEventListener('click', () => {
				const { lat, long } = bin.dataset;
				this.#createMapModal(lat, long);
			});
		});
	}
	/**@param {number} lat @param {number} long*/
	#createMapModal(lat, long) {
		const container = document.createElement('dialog');
		container.className = 'map-container-modal';

		container.innerHTML += '<div class="close-btn">&#10005;</div>';
		container.innerHTML += `<iframe src="https://maps.google.com/maps?q=${lat},${long}&hl=en&z=14&amp;output=embed"></iframe>`;
		container.innerHTML += '<div class="disclaimer">This is only an approximate loaction</div>';

		document.body.appendChild(container);
		container.showModal();

		document.body.style.cursor = 'progress';
		container.style.cursor = 'progress';

		container.querySelector('iframe').addEventListener('load', () => {//finished loading
			container.style.cursor = 'auto';
			document.body.style.cursor = 'auto';
		});

		container.querySelector('.close-btn').addEventListener('click', () => {
			document.body.removeChild(container);
		});
	}
	dispose() {//destructor | remove listeners
		this.#btnElement.classList.add('inactive');
		this.#btnElement.onclick = null;
		this.#tableElement.innerHTML = '';
		return null;
	}
}