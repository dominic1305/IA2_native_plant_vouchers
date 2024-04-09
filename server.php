<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>server</title>
</head>
<body>

	<form method="POST">
		<input type="text" name="data-input" id="data-input">
		<input type="submit" name="data-send" id="data-send">
	</form>

	<?php
		if (isset($_POST["data-send"])) {
			$data = json_decode($_POST["data-input"]); //{cmd: string, data: any}
			switch ($data->cmd) {
				case "check-admin-login": //return bool of admin credential validity TODO: implement server integration
					$username = $data->data->username;
					$password = $data->data->password;
					$bool = $username == "admin" && $password == "admin";
					printf("<p id=\"php-response\">%s</p>", $bool);
					break;
				default: printf("<p id=\"php-response\">[ERROR] invalid command {%s}</p>", $data->cmd); break;
			}
		}
	?>

	<script>
		document.body.onload = () => {
			const element = document.querySelector('#php-response');
			if (element != null) {//response was given, send back to parent
				window.parent.postMessage(JSON.stringify({cmd: localStorage['cmd'], response: element.innerHTML}), '*');
				localStorage.removeItem('cmd');
			} else {//send default message
				window.parent.postMessage(JSON.stringify({cmd: 'state-check', online: true}), '*');
			}
		};

		window.addEventListener('message', (e) => {
			const data = JSON.parse(e.data); //{cmd: string, data: any}
			localStorage['cmd'] = data['cmd'];
			switch (data['cmd']) {
				case 'state-check':
					window.parent.postMessage(JSON.stringify({cmd: 'state-check', response: true}), '*');
					localStorage.removeItem('cmd');
					break;
				case 'write-credential-cache':
					localStorage['credential-cache'] = data['data'];
					window.parent.postMessage(JSON.stringify({cmd: 'write-credential-cache', response: localStorage['credential-cache'] == data['data']}), '*');
					localStorage.removeItem('cmd');
					break;
				default:
					document.querySelector('#data-input').value = e.data;
					document.querySelector('#data-send').click();
					break;
			}
		});
	</script>
</body>
</html>