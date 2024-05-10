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
					$response = mysqli_fetch_object(mysqli_query($conn, sprintf("SELECT DISTINCT * FROM admins WHERE username = \"%s\" and password = \"%s\"", $data->data->username, $data->data->password)));
					printf("<p id=\"php-response\">%s</p>", count($response) > 0);
					break;
				}
				case "get-DB-signature": {//return a string[] of the databases keys TODO: implement server integration
					$response = $conn->query("SELECT * FROM {$data->data}")->fetch_fields();

					$obj = [];

					foreach ($response as $field) {
						array_push($obj, $field->name);
					}

					printf("<p id=\"php-response\">%s</p>", json_encode($obj));
					break;
				}
				case "query_data": {//returns the result of a SQL query TODO: implement server integration
					$query = $data->data;

					$response = $conn->query($query)->fetch_fields();
					$keys = [];

					foreach ($response as $field) {
						array_push($keys, $field->name);
					}

					$obj = [];
					foreach ($keys as $key) {//init key
						$obj[$key] = [];
					}

					while ($row = mysqli_fetch_row(mysqli_query($conn, $query))) {
						foreach ($row as $key => $value) {
							array_push($obj[$key], $value);
						}
					}

					printf("<p id=\"php-response\">%s</p>", json_encode($obj));
					break;
				}
				case "replace-table": {//drop and create a table TODO: implement server integration TODO: add idx entry
					$createStmt = $data->data->createStmt;
					$obj = $data->data->data;
					$keys = array_keys((array)$obj);

					if ($data->data->DB_name == "species") {//add idx
						$keys = array_merge(["idx"], $keys);
					}

					print($createStmt);

					mysqli_query($conn, "DROP TABLE ".$data->data->DB_name);
					mysqli_query($conn, $createStmt);

					$length = (array)$obj;
					$length = count($length[$keys[1]]);

					for ($i = 1; $i < $length; $i++) {
						$temp = function($str) {
							return str_replace(" ", "_", $str);
						};
						$query = "INSERT INTO ".$data->data->DB_name." (".implode(", ", array_map($temp, $keys)).") VALUES (";
						$buffer = [];
						if ($data->data->DB_name == "species") {
							array_push($buffer, $i-1);
						}
						foreach ($obj as $key => $arr) {
							array_push($buffer, "\"$arr[$i]\"");
						}
						$query .= implode(", ", $buffer).")";

						print($query);

						mysqli_query($conn, $query);
					}
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