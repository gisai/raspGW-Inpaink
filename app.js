var express = require("express");
var app = express();
const morgan = require('morgan');
var bodyParser = require("body-parser");
var cors = require('cors');
var path = require('path');

//Routes
const statusRoutes = require('./api/routes/status');
const devicesRoutes = require('./api/routes/devices');

//Add-ons
app.use(morgan('dev')); // logger
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors({origin: '*'}));

// Routes which should handle requests
app.use('/status', statusRoutes);
app.use('/devices', devicesRoutes);

/*

//CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token'
  );
  if (req.method === 'OPTIONS'){
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET, OPTIONS');
    return res.status(200).json({});
  }
  next();
}); */

//Favicon
/*
app.get('/favicon.ico', function(req, res) {
    res.sendStatus(204);
});
*/

//Errors

app.use('/favicon.ico', express.static('favicon.ico'));


app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});


app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500);
  res.json({error: {message: err.message}});
});


//Server
var server = app.listen(5000, function () {
    console.log("app running on port.", server.address().port);
});