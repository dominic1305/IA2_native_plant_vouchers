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
				case "check-admin-login": {//return bool of admin credential validity TODO: implement server integration
					$username = $data->data->username;
					$password = $data->data->password;
					$bool = $username == "admin" && $password == "admin";
					printf("<p id=\"php-response\">%s</p>", $bool);
					break;
				}
				case "get-DB-signature": {//return a string[] of the databases keys TODO: implement server integration
					switch ($data->data) {
						case "species": {
							$arr = ["type", "species", "description_and_growing_requirements", "attracts"];
							printf("<p id=\"php-response\">%s</p>", json_encode($arr));
							break;
						}
						case "nurseries": {
							$arr = ["region", "nursery", "address", "contact", "location"];
							printf("<p id=\"php-response\">%s</p>", json_encode($arr));
							break;
						}
						case "wards": {
							$arr = ["name", "address", "councillor", "phone_number", "fax", "email", "location"];
							printf("<p id=\"php-response\">%s</p>", json_encode($arr));
							break;
						}
					}
					break;
				}
				case "query_data": {//returns the result of a SQL query TODO: implement server integration TEST: returns JSON of nurseries
					$query = $data->data;
					$temp = [["region","nursery","address","contact","latitude","longitude"],["North","City Farm Nursery (open Tuesday to Sunday)","Northey Street City Farm, 16 Victoria Street, Windsor","07 3857 8774",-27.442718505859375,153.03125],["South","Crossacres Garden Centre (open Tuesday-Sunday)","58 Crossacres Street, Doolandella","CrossacresGarden@gmail.com",-27.612504959106445,152.96875],["East","B4C Sustainability Centre (open Monday-Friday)","Corner of Wright Street and 1358 Old Cleveland Road, Carindale (access via 21 Wright Street)","07 3398 8003",-27.501806259155273,153.125],["East","Daly's Native Plants (open Monday to Saturday)","57 Weedon Street West, Mansfield ","07 3349 0807",-27.539600372314453,153.125],["West","Paten Park Native Nursery (open Tuesday to Sunday)","57 Paten Road, The Gap","07 3300 6304",-27.45279884338379,152.96875],["North","Downfall Creek Bushland Centre (open Tuesday to Friday)","815 Rode Road, Chermside West","07 3407 2400",-27.389509201049805,153],["South","Karawatha Forest Discovery Centre (open Tuesday to Sunday)","149 Acacia Road, Karawatha","07 3178 0330",-27.624208450317383,153.09375]];
					printf("<p id=\"php-response\">%s</p>", json_encode($temp));
					break;
				}
				case "replace-table": {//drop and create a table TODO: implement server integration TODO: add idx entry
					printf("<p id=\"php-response\">[ERROR] table creation not implemented</p>",);
					break;
				}
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
				case 'read-credential-cache':
					window.parent.postMessage(JSON.stringify({cmd: 'read-credential-cache', response: localStorage['credential-cache']}), '*');
					localStorage.removeItem('cmd');
					localStorage.removeItem('credential-cache');
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