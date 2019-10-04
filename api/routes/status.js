const express = require('express');
const router = express.Router();  

/* CONTROLLER */
const StatusController = require('../controllers/status.js');

/* API GET */
router.get('/', StatusController.status_get);


module.exports = router; 
