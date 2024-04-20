import FileHandler from "./FileHandler.js";

export default class DataTableManager {
	#data;
	#tableElement;
	#btnElement;
	#filter;
	get #NewFilter() {
		const element = document.querySelector('.filter-controller-container');
		if (element == null) throw new Error('modal doesn\'t exist');

		const filter = {};
		for (const key of this.#data.Keys) {
			const obj = {};

			obj['checked'] = element.querySelector(`div.row[data-key="${key}"] input[type="checkbox"]`).checked;

			const arr = [];
			for (const selectBox of element.querySelectorAll(`div.row[data-key="${key}"] div.option-select input`)) {//get non-unique selection info
				arr.push({ checked: selectBox.checked, value: selectBox.dataset['value']});
			}
			obj['options'] = arr;

			filter[key] = obj;
		}

		return filter;
	}
	/**@private @param {FileHandler} data @param {HTMLDivElement} tableElement @param {HTMLDivElement} btnElement @param {{}} filterInfo */
	constructor(data, tableElement, btnElement, filterInfo) {
		this.#data = data;
		this.#tableElement = tableElement;
		this.#btnElement = btnElement;
		this.#filter = filterInfo;
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
		// manager.#display();

		return manager
	}
	#initListeners() {
		this.#btnElement.onclick = () => {
			const element = this.#generateFilterModal();

			document.body.appendChild(element);

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
							box.checked = false;
						}
					}
				});
			}

			element.querySelector('div.title > p.exit').addEventListener('click', () => {//close modal
				document.body.removeChild(element);
			});

			element.querySelector('.submit').addEventListener('click', () => {//TODO: generate data table here
				this.#filter = this.#NewFilter;
				document.body.removeChild(element);
				console.log(this.#filter);
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

			if (options != null && options.length > 0 && options.length < this.#data.Length) {
				row += `<div data-key="${key}" class="option-select ${(checked) ? '' : 'inactive'}" id="${(checked) ? '' : 'inactive'}">`; //start options

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
		throw new Error('not implemented');
	}
	dispose() {//destructor | remove listeners
		this.#btnElement.classList.add('inactive');
		this.#btnElement.onclick = null;
		this.#tableElement.innerHTML = '';
		return null;
	}
}