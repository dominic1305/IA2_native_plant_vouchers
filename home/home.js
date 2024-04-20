import ServerHandler from "./../ServerHandler.js";
import Encryption from "./../Encryption.js";

/**@type {ServerHandler} */ let server;

document.body.onload = async () => {
	server = await ServerHandler.getConnection();

	const items = document.querySelectorAll('.index-carousel > img');
	const counter = function*() { for (let i = 0; true; i++) yield i % items.length; }();
	document.querySelector('#carousel-text').innerHTML = items[items.length-1].src.split('/').at(-1).split('.')[0].replaceAll('_', ' ');
	setInterval(() => {
		const i = counter.next().value;
		for (const elemenet of items) { elemenet.className = 'inactive'; }
		(i != 0) ? items[i-1].className = 'offload' : items[items.length-1].className = 'offload';
		items[i].className = 'active';
		document.querySelector('#carousel-text').innerHTML = items[i].src.split('/').at(-1).split('.')[0].replaceAll('_', ' ');
	}, 5000);
}

document.querySelector('#admin-login-btn').addEventListener('click', () => {
	document.body.appendChild(document.querySelector('#admin-login-template').content.cloneNode(true));
	const element = document.querySelector('.admin-login');
	element.querySelector('.close-btn').addEventListener('click', () => { document.body.removeChild(element); });
	element.addEventListener('keyup', (e) => {
		if (e.key == 'Enter') element.querySelector('.submit-btn').click();
	});
	element.querySelector('.submit-btn').addEventListener('click', async () => {
		try {
			var username = String(document.querySelector('#username').value) || void function() { throw 0 }();
			var password = String(document.querySelector('#password').value) || void function() { throw 1 }();
		} catch (idx) {
			element.querySelectorAll('.inputs > input').forEach(bin => bin.style.border = '');
			const elemenet = element.querySelectorAll('.inputs > input')[idx];
			elemenet.style.border = '2px solid red';
			return;
		}
		element.querySelectorAll('.inputs > input').forEach(bin => bin.style.border = '');

		const bool = Boolean(await server.request('check-admin-login', {username: username, password: password}));
		if (bool) {
			const bool = await server.request('write-credential-cache', Encryption.encode(`${username}\x00${password}`, 16));
			if (!bool) throw new Error('unable to save credentials');
			location.assign('./../admin/admin.html');
		} else {
			const err = element.querySelector('.error-msg');
			err.innerHTML = 'Invalid Credentials';
			err.style.margin = '5px 0';
			err.style.padding = '5px';
			element.querySelectorAll('.inputs > input').forEach(bin => bin.value = '');
			element.querySelectorAll('.inputs > input')[0].focus();
		}
	});
});

document.querySelector('.apply-voucher-btn').addEventListener('click', () => {//redirect to data page
	location.assign('./../vouchers/vouchers.html');
});