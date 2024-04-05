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
			$data = json_decode($_POST["data-input"]);
			switch ($data->cmd) {
				default: printf("<p id=\"php-response\">[ERROR] invalid command {%s}</p>", $data->cmd); break;
			}
		}
	?>

	<script>
		void function() {
			const element = document.querySelector('#php-response');
			if (element != null) {//response was given, send back to parent
				window.parent.postMessage(JSON.stringify({cmd: localStorage.getItem('cmd'), response: element.innerHTML}), '*');
				localStorage.removeItem('cmd');
			} else {//send default message
				window.parent.postMessage(JSON.stringify({cmd: 'state-check', online: true}), '*');
			}
		}();

		window.addEventListener('message', (e) => {
			const data = JSON.parse(e.data);
			switch (data['cmd']) {
				case 'state-check':
					window.parent.postMessage(JSON.stringify({cmd: 'state-check', response: true}), '*');
					break;
				default:
					localStorage.setItem('cmd', data['cmd']);
					document.querySelector('#data-input').value = e.data;
					document.querySelector('#data-send').click();
					break;
			}
		});
	</script>
</body>
</html>