import ServerHandler from "./../ServerHandler.js";
import Encryption from "./../Encryption.js";
import FileHandler from "./../FileHandler.js";

/**@type {ServerHandler}*/ let server;

document.body.onload = async () => {
	server = await ServerHandler.getConnection();

	try {
		/**@type {string?}*/ let response = await server.request('read-credential-cache');
		if (response != null) {//got cache from server
			response = Encryption.decode(response, 16);
			const [ username, password ] = response.split('\x00');
			const bool = Boolean(await server.request('check-admin-login', {username: username, password: password}));
			if (!bool) throw new Error('invalid cache data');
			sessionStorage.setItem('credential-cache', Encryption.encode(`${username}\x00${password}\x00${new Date().valueOf()}`, 16));
		} else {//cache doesn't exist, check session data
			response = sessionStorage.getItem('credential-cache');
			if (response == null) throw new Error('session data doesn\'t exist');
			response = Encryption.decode(response, 16);
			const [ username, password, time ] = response.split('\x00');
			const bool = Boolean(await server.request('check-admin-login', {username: username, password: password}));
			if (!bool) throw new Error('invalid session data');
			if (new Date().valueOf() - Number(time) > 1.8e+6) {//session has existed for more than half an hour
				sessionStorage.removeItem('credential-cache');
				throw new Error('session has expired');
			}
		}
	} catch (err) {//something is invalid, go back to home page!
		alert(`[ERROR] ${err.message}`);
		location.assign('./../home/index.html');
	}
}

document.querySelector('#admin-logout-btn').addEventListener('click', () => {//logout
	sessionStorage.removeItem('credential-cache');
	location.assign('./../home/index.html');
});

document.querySelector('.import-file-btn div#submit').addEventListener('click', async () => {//import file
	try {
		/**@type {File?}*/ const fileReference = document.querySelector('.import-file-btn input[type="file"]').files[0];
		if (fileReference == null) throw new Error('no file provided');
		const file = await FileHandler.parseFile(fileReference);
		console.log(file);
	} catch (err) {
		if (err.message == 'no file provided') {
			document.querySelector('.import-file-btn #file-name').style.outline = '2px solid #ff0000ff';
			let opacity = 255;
			const interval = setInterval(() => {
				document.querySelector('.import-file-btn #file-name').style.outline = `2px solid #ff0000${(opacity -= 5).toString(16).padStart(2, '0')}`;
				if (opacity <= 0) {
					document.querySelector('.import-file-btn #file-name').style.outline = '';
					return clearInterval(interval)
				}
			}, 10);
		} else alert(`[ERROR] ${err.message}`);
	}
});

document.querySelector('.import-file-btn input[type="file"]').addEventListener('change', () => {
	document.querySelector('.import-file-btn #file-name').innerHTML = document.querySelector('.import-file-btn input[type="file"]').files[0].name;
});