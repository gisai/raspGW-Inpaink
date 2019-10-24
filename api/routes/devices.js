const express = require('express');
const router = express.Router();

const DevicesController = require('../controllers/devices.js');

/* API GET */
router.get('/', DevicesController.devices_get_all);

/* API PUT */
/* USAGE /?mac=3DF2C9A6B34F*/
//router.put('/?*', DevicesController.device_update);
router.put('/', (req, res) => {	
	console.log("Received mac: "+req.body.mac+" w: "+req.body.w+" h: "+req.body.h);
  DevicesController.device_update(req, res);
});

module.exports = router;