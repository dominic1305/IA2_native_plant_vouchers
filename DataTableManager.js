import FileHandler from "./FileHandler.js";

export default class DataTableManager {
	#data;
	#tableElement;
	#btnElement;
	#filter;
	#tableIdx;
	static #idxSkip = 10;
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
	/**@private @param {FileHandler} data @param {HTMLDivElement} tableElement @param {HTMLDivElement} btnElement @param {{}} filterInfo */
	constructor(data, tableElement, btnElement, filterInfo) {
		this.#data = data;
		this.#tableElement = tableElement;
		this.#btnElement = btnElement;
		this.#filter = filterInfo;
		this.#tableIdx = 0;
	}
	/**@param {FileHandler} file @param {HTMLDivElement} tableLocation @param {HTMLDivElement} btnLocation*/
	static getManager(file, tableLocation, btnLocation) {
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
		manager.#display();

		return manager
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
				this.#display();
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

			//must have an options array, and the the options array must be at least 70% unique
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
	#display() {//show table with filter accounted for
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
					row = '';
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
						const txt = this.#data.Data[key][i].split('').map(bin => (bin.charCodeAt() <= 127) ? bin : '').join(''); //remove non-ascii characters
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
			this.#display();
		});

		this.#tableElement.querySelector('.scope-controller > div#right').addEventListener('click', () => {//next page
			if (this.#tableElement.querySelector('.scope-controller > div#right').classList.contains('inactive')) return;
			this.#tableIdx += DataTableManager.#idxSkip;
			this.#tableElement.innerHTML = '';
			this.#display();
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