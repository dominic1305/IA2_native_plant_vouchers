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
				case "query_data": {//returns the result of a SQL query TODO: implement server integration
					$query = $data->data;
					#region
					$vouchers = [["address","pref_contact","email","phone_number","rate_number","plant_1","plant_2","placement_time"],["29 street street","phone","email@email.com",3123804248,4224782947,0,8,1715345135023],["31 street avenue","email","mail@eeeee.com",8097643914,927412461,15,23,1715345195023]];
					$nurseries = [["region","nursery","address","contact","latitude","longitude"],["North","City Farm Nursery (open Tuesday to Sunday)","Northey Street City Farm, 16 Victoria Street, Windsor","07 3857 8774",-27.442718505859375,153.03125],["South","Crossacres Garden Centre (open Tuesday-Sunday)","58 Crossacres Street, Doolandella","CrossacresGarden@gmail.com",-27.612504959106445,152.96875],["East","B4C Sustainability Centre (open Monday-Friday)","Corner of Wright Street and 1358 Old Cleveland Road, Carindale (access via 21 Wright Street)","07 3398 8003",-27.501806259155273,153.125],["East","Daly's Native Plants (open Monday to Saturday)","57 Weedon Street West, Mansfield ","07 3349 0807",-27.539600372314453,153.125],["West","Paten Park Native Nursery (open Tuesday to Sunday)","57 Paten Road, The Gap","07 3300 6304",-27.45279884338379,152.96875],["North","Downfall Creek Bushland Centre (open Tuesday to Friday)","815 Rode Road, Chermside West","07 3407 2400",-27.389509201049805,153],["South","Karawatha Forest Discovery Centre (open Tuesday to Sunday)","149 Acacia Road, Karawatha","07 3178 0330",-27.624208450317383,153.09375]];
					$wards = [["name","address","councillor","phone number","fax","email","latitude","longitude"],["BRACKEN RIDGE","Cnr Bracken and Barrett Streets, Bracken Ridge QLD 4017","Sandy Landers","736676000","736676005","brackenridge.ward@bcc.qld.gov.au",-27.31878089904785,153.03125],["CALAMVALE","Shop 10, Central Park Medical Centre, 168 Algester Road, Calamvale QLD 4116","Angela Owen","731317022","731317033","calamvale.ward@bcc.qld.gov.au",-27.611360549926758,153.03125],["CENTRAL","Suite 1, 5 Lamington Street, New Farm QLD 4005","Vicki Howard","734030254","734030256","central.ward@bcc.qld.gov.au",-27.464380264282227,153.0625],["CHANDLER","Shop 8, Millennium Centre, 14 Millennium Boulevard, Carindale QLD 4152","Ryan Murphy","734071400","734071891","chandler.ward@bcc.qld.gov.au",-27.500730514526367,153.09375],["COORPAROO","Suite 6, 737 Logan Road, Greenslopes QLD 4120","Fiona Cunningham","734032101","734032105","coorparoo.ward@bcc.qld.gov.au",-27.512340545654297,153.0625],["DEAGON","Level 1, Suite 2A/47 Brighton Road, Sandgate QLD 4017","Jared Cassidy","736676011","736676016","deagon.ward@bcc.qld.gov.au",-27.3199405670166,153.0625],["DOBOY","Shop 5, 1181 Wynnum Road, Cannon Hill QLD 4170","Lisa Atwood","734078800","734078805","doboy.ward@bcc.qld.gov.au",-27.47039031982422,153.09375],["ENOGGERA","9 South Pine Road, Alderley QLD 4051","Andrew Wines","734072510","734072515","enoggera.ward@bcc.qld.gov.au",-27.42367935180664,153],["FOREST LAKE","Inala Library Building, Cnr Wirraway Parade & Corsair Avenue, Inala QLD 4077","Charles Strunk","734071211","734071215","forestlake.ward@bcc.qld.gov.au",-27.59760856628418,152.96875],["HAMILTON","42 Racecourse Road, Hamilton QLD 4007","Julia Dixon","734031095","734031099","hamilton.ward@bcc.qld.gov.au",-27.437469482421875,153.0625],["HOLLAND PARK","Shop 13, 1290 Logan Road, Mt Gravatt QLD 4122","Krista Adams","734037791","734037794","hollandpark.ward@bcc.qld.gov.au",-27.531070709228516,153.0625],["JAMBOREE","Shop 146A, Mt Ommaney Shopping Centre, 171 Dandenong Road, Mt Ommaney QLD 4074","Sarah Hutton","734077000","734077005","jamboree.ward@bcc.qld.gov.au",-27.548839569091797,152.9375],["MacGREGOR","Ground Floor, 2072 Logan Road, Upper Mt Gravatt QLD 4122","Steven Huang","734078500","734078505","macgregor.ward@bcc.qld.gov.au",-27.55970001220703,153.09375],["MARCHANT","North Regional Business Centre, Level 1, 375 Hamilton Road, Chermside QLD 4032","Danita Parry","734070707","734070797","marchant.ward@bcc.qld.gov.au",-27.385921478271484,153.03125],["McDOWALL","Shops 5 and 6, Rode Shopping Centre, 271 Appleby Road, Stafford Heights QLD 4053","Tracy Davis","734037690","734037693","mcdowall.ward@bcc.qld.gov.au",-27.391700744628906,153],["MOOROOKA","Shop 2, 122 Beaudesert Road, Moorooka QLD 4105","Steve Griffiths","734031730","734031733","moorooka.ward@bcc.qld.gov.au",-27.530839920043945,153.03125],["MORNINGSIDE","Ground Floor, 63 Oxford Street, Bulimba QLD 4171","Lucy Collier","734078200","734078205","morningside.ward@bcc.qld.gov.au",-27.450380325317383,153.0625],["NORTHGATE","Banyo Library Building, 284 St Vincents Road, Banyo QLD 4014","Adam Allan","734032210","734032213","northgate.ward@bcc.qld.gov.au",-27.374187469482422,153.09375],["PADDINGTON","44 Latrobe Terrace, Paddington QLD 4064","Clare Jenkinson","734032520","734032523","paddington.ward@bcc.qld.gov.au",-27.45887565612793,153],["PULLENVALE","Kenmore Library Building, 9 Brookfield Road, Kenmore QLD 4069","Greg Adermann","734070220","734070226","pullenvale.ward@bcc.qld.gov.au",-27.506059646606445,152.9375],["RUNCORN","BCC Sunnybank Centre, 121 Lister Street, Sunnybank QLD 4109","Kim Marx","734070566","734070568","runcorn.ward@bcc.qld.gov.au",-27.578100204467773,153.0625],["TENNYSON","Fairfield Gardens, 180 Fairfield Road, Fairfield QLD 4103","Nicole Johnston","734038605","734038607","tennyson.ward@bcc.qld.gov.au",-27.50905418395996,153.03125],["THE GABBA","2/63 Annerley Road (Cnr Crown Street), Woolloongabba QLD 4102","Trina Massey","734032165","734032168","thegabba.ward@bcc.qld.gov.au",-27.488210678100586,153.03125],["THE GAP","477 Waterworks Road, Ashgrove QLD 4060","Steven Toomey","734071900","734071905","thegap.ward@bcc.qld.gov.au",-27.448780059814453,152.96875],["WALTER TAYLOR","70 Station Road, Indooroopilly QLD 4068","Penny Wolff","734070005","734070008","waltertaylor.ward@bcc.qld.gov.au",-27.50138282775879,152.96875],["WYNNUM MANLY","3A/212 Bay Terrace (Cnr Pine Street), Wynnum QLD 4178","Sara Whitmee","734032180","734032177","wynnummanly.ward@bcc.qld.gov.au",-27.446020126342773,153.1875]];
					$species = [["type","species","description and growing requirements","attracts"],["Groundcovers","Coastal boobialla�(Myoporum boninese)","Low growing, hardy spreading groundcover with thick fleshy glossy leaves.� Grows to three metres.� White flowers appear in spring and summer followed by purple berries.� Prefers a sunny well-draining position.� Suitable in pots or containers and rockeries.","Birds, lizards"],["Groundcovers","Creeping boobialla�(Myoporum parvifolium)","Hardy prostrate groundcover that grows to one metre. Purple and white flowers during the summer months. An excellent spreading groundcover for a sunny well-drained position. Suitable in pots or containers.","Birds, lizards"],["Groundcovers","Fan flower�(Scaevola aemula)","Spreading groundcover that grows to 60 centimetres with dark green foliage and small mauve-pink flowers in spring and summer. Prefers well-drained soils. Great for hanging baskets.","Bees, lizards"],["Groundcovers","Native violet�(Viola hederacea)","Attractive dense groundcover that grows to 15 centimetres suitable for damp shady areas. Small, round, light green leaves with violet flowers throughout the year. Ideal for rockeries, mass plantings, pots and hanging baskets.","Lizards, frogs"],["Tufting plants and grasses","Blue flax (Dianella caerulea)","Hardy plant with long, strappy leaves that grows to 45 centimetres. Blue flowers on branched spikes appear in spring. Bright blue berries occur after flowering. Prefers a sunny position in well-drained soil.","Birds, lizards"],["Tufting plants and grasses","Knobby club rush (Ficinia nodosa)","Tough, fast-growing, spreading, tufting grass with upright, dark green foliage up to one metre. Grows best in a full sun position. Brownish flower heads are produced on spikes throughout the year. Great plant for water features, ponds and effective in mass planting or containers.","Birds, frogs, lizards"],["Tufting plants and grasses","Mat rush (Lomandra sp.)","Deep green, glossy, narrow strap leaves to one metre. Small yellow-cream flowers in spring and summer. Grow in a full sun to partial shade position.","Lizards, frogs"],["Climbers","Guinea vine (Hibbertia scandens)","A vigorous twiner with glossy, dark green leaves and large, golden yellow flowers over spring and summer. Grows to 1.5 metres and makes an excellent screening plant on walls or fences. Prefers well-drained soil. Grow in full sun to partial shade in an open position. Suitable for tubs and containers or as a groundcover.","Birds"],["Climbers","Wonga-wonga vine (Pandorea pandorana)","A hardy, vigorous, fast growing, evergreen twining plant with bell-shaped white or yellow flowers in spring followed by large oblong shaped seed pods.� Spreads up to six metres. Prefers an open, sunny position in well-drained soil.� Great as a screening plant on a fence or trellis.� Will grow in a large pot.","Butterflies, bees, insects"],["Small shrubs - 0.5 metres to two metres","Bottlebrush (Callistemon sp.)","Fast growing, hardy, woody shrub that grows up to two metres that produces beautiful blooms in a variety of single colours in spring and summer and sometimes again in autumn. Plant in a moist, well-drained, sunny position. Regularly prune to encourage bushier growth and increased flower production. Great for containers, edging, rockeries, hedges and borders.�","Birds, insects"],["Small shrubs - 0.5 metres to two metres","Coastal rosemary (Westringia sp.)","Hardy, small, fast-growing, evergreen shrub that grows to 1m�. Long flowering and suitable as a hedge or screening plant or for low maintenance gardens, exposed sites and coastal gardens. Suitable for container planting.","Birds, butterflies, insects"],["Small shrubs - 0.5 metres to two metres","Honey myrtle 'Claret Tops'�(Melaleuca linariifolia)","A dense and compact shrub that grows to 1.5 metres with attractive, claret-coloured new growth and white flowers in summer. A great foliage plant for shrubberies or in a pot.�Grows well in full sun or semi-shaded positions.","Birds, insects"],["Small shrubs - 0.5 metres to two metres","Swamp banksia (Banksia robur)�- seasonal","Hardy, evergreen shrub to two metres with bold flowing spikes in a variety of single colours. Flowers appear from autumn through to spring. Plant in an open, sunny position in well-drained soil. To encourage flower production and thicker foliage, cut flowering spikes and use in a floral display.","Birds, bees, butterflies, insects"],["Small shrubs - 0.5 metres to two metres","Tea tree (Leptospermum sp.)","Attractive small shrub ranging in size from 80 centimetres up to two metres. Showy pink or white flowers in spring and autumn. Prefers moist well-drained soil in full sun or light shade. A useful feature plant for rockeries or over retaining walls.","Insects, bees"],["Small shrubs - 0.5 metres to two metres","Thyme honey myrtle�(Melaleuca thymifolia)","Small hardy shrub to 1m�. Mauve claw type flowers occur in clusters and are borne during summer. Grows best in full sun with good drainage. Suitable for large pots or containers.","Insects"],["Medium shrubs - three to five metres","Banksia�(Banksia sp.)� seasonal","Hardy evergreen shrubs with attractive foliage with bold single colour flowering spikes. Plant in an open sunny position in well-drained soil.","Birds"],["Medium shrubs - three to five metres","Bottlebrush (Callistemon sp.)","Hardy, woody shrub that grows up to five metres that produces beautiful blooms in a variety of single colours in spring and summer and sometimes again in autumn. Plant in a moist, well-drained, sunny position. Regularly prune to encourage bushier growth and increased flower production. Bottlebrushes make excellent screening plants and are quick growers.","Birds, insects"],["Medium shrubs - three to five metres","Grevillea�(Grevillea sp.)","Showy, evergreen plants that grow to four metres with nectar-rich flowers. They produce a 'spider flower' in a variety of single colours throughout the year. Grevillea's do best in a sunny position with light, gritty, free-draining soil.","Birds, bees, butterflies"],["Medium shrubs - three to five metres","Lillypilly�(Syzygium sp.)","Hardy evergreen plants to five metres with glossy, green leaves with fluffy, pom-pom, white flowers in spring and summer followed by red berries. Prefers a sunny position with well-drained soil. Lillypillies make excellent screens, windbreaks and hedges and can be pruned to size and shape.�","Birds, bees, flying foxes"],["Medium shrubs - three to five metres","Tea tree�(Leptospermum sp.)","A bushy rounded shrub that grows to five metres. White flowers cover the shrub in spring. Prefers well drained soil in a sunny position. Ideal as a screen, hedge or windbreak.","Insects, bees"],["Shade and feature trees - over five metres","Flame Tree�(Brachychiton acerifolius) seasonal","Spectacular, hardy deciduous tree to 10 metres with light green lobed leaved.� Profuse bell- shaped flowers occur in late spring or summer.� Grows in most soils in a sunny position.","Butterflies"],["Shade and feature trees - over five metres","Golden penda (Xanthostemon chrysanthus)","An attractive specimen tree up to eight metres. Showy, dense cluster of golden yellow flowers appear from summer to winter. Plant in full sun to part shade in well-drained soil. Suitable as a hedge, windbreak, screen, or feature tree.","Birds"],["Shade and feature trees - over five metres","Ivory curl tree (Buckinghamia cellsissima)��seasonal","Fast-growing evergreen tree that grows to eight metres. Striking, long, creamy-fragranced flowers from spring until autumn. Prefers moist, well-drained soil in full sun to semi shade.","Birds, bees"],["Shade and feature trees - over five metres","Lemon-scented myrtle�(Backhousia citriodora)","Great small feature tree to five metres. White flowers appear from summer to autumn. Leaves are lemon scented. Prefers moist, well-drained soil in semi shade. Ideal for hedges or mixed shrub bed.","Birds, butterflies, bees"],["Shade and feature trees - over five metres","Tuckeroo�(Cupaniopsis anacardioides)�seasonal","Attractive evergreen shade tree with rounded canopy. Grows to 8 metres. Green-yellow flowers are produced in autumn followed by orange fruits in winter. Plant in a full sun to partial shade position in organic rich soil.� Ideal as a shade or specimen tree.�","Birds, bees, insects"],["Shade and feature trees - over five metres","Tulipwood (Harpulia pendula)�seasonal","A hardy, fast-growing, evergreen tree that grows up to 10 metres with attractive, pale green foliage. Large sprays of light green-yellow, slightly fragrant flowers appear in summer followed by orange fruit. Requires open sunny position in a light to medium soil type. Excellent shade tree.","Birds, bees"],["Shade and feature trees - over five metres","Weeping lillypilly (Waterhousia floribunda)","Hardy, evergreen tree that grows to 8m�. Clusters of white flowers appear from spring to summer, followed by green, round fruits. Plant in a sunny open position in well-drained soil. Regular trimming will produce colourful, new growth and keep the plant bushy. Can be trimmed to shape and size. Ideal as a dense screen or windbreak, or stunning as a large container plant.","Birds, bees"]];
					#endregion

					switch ($query) {//TEST: return all the data
						case 'species': printf("<p id=\"php-response\">%s</p>", json_encode($species)); break;
						case 'nurseries': printf("<p id=\"php-response\">%s</p>", json_encode($nurseries)); break;
						case 'wards': printf("<p id=\"php-response\">%s</p>", json_encode($wards)); break;
						case 'vouchers': printf("<p id=\"php-response\">%s</p>", json_encode($vouchers)); break;
					}
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