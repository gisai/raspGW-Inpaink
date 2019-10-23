const express = require('express');
const router = express.Router();




/* CONTROLLER */
const DevicesController = require('../controllers/devices.js');

//var btSerial = new(require('bluetooth-serial-port')).BluetoothSerialPort();

/* API GET */
router.get('/', DevicesController.devices_get_all);

router.get('/test/', function(req, res) {
	console.log("Started BT legacy");
	btSerial = new(require('bluetooth-serial-port')).BluetoothSerialPort();

	var result = [];
	result.push({"address": "12321321", "name": "13213"});
	btSerial.on('found', function(address, name) {
		console.log('Found: ' + address + ' with name ' + name);
		result.push({"address": address, "name": name});  
	});
	btSerial.on('finished', function() {
		console.log('Finished');
		return res.status(200).json(result);
		//return res.send(result);
	});


	btSerial.inquire();
});



/* API PUT */
/* USAGE /?mac=3DF2C9A6B34F*/
//router.put('/?*', DevicesController.device_update);
router.put('/', (req, res) => {	
	console.log("Received mac: "+req.body.mac+" w: "+req.body.w+" h: "+req.body.h);
  DevicesController.device_update(req, res);
});



module.exports = router;