
/* UUIDs ---------------------------------------------------------------------*/
const SERVICE_UUID = "4fafc2011fb5459e8fccc5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e36e14688b7f5ea07361b26a8";

//BLocking
var waiting = false;

var noble = require('@abandonware/noble');
var connected = false;

var wantToConnect = false;
var wantToGetName = false;
var idToGet = '';
var deviceFound = '';
var discoveredDevices = {};
var devCount = 0;

var response,timeout, macaddress, 
  data, w, h, type, dataNext;

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));


/*
 * Event listener for "BLE Discover"
 */
noble.on('discover', peripheral => {
  console.log('Device discovered with name: '+peripheral.advertisement.localName);
  const id = peripheral.id;
  //If only want to get if device exists and get name
  if(wantToGetName){
    console.log("Checking if "+id+" is the same as"+ idToGet);
    if (id === idToGet) deviceFound = peripheral.advertisement.localName;
  }
  //If want to connect and send image
  else if(wantToConnect){
    const name = peripheral.advertisement.localName;
    if (id != idToGet) return;
    noble.stopScanning();
    console.log(`Connecting to '${name}' ${peripheral.id}`);
    //Connect!
    connectAndSetUp(peripheral);
    wantToConnect = false;
  //Otherwise, we want to scan for devices
  }else{
    var newDevice = {
      "id": devCount,
      "mac": peripheral.id,
      "screen": peripheral.advertisement.localName,
      "rssi": peripheral.rssi,
      "batt": "50",
      "initcode" : peripheral.id 
    };
    devCount +=1;
    discoveredDevices.device.push(newDevice);
  }
});

/*
 * Perform a connection with a peripheral
 */
function connectAndSetUp(peripheral) {

  peripheral.once('disconnect', () => {
    peripheral.disconnect();
    console.log('disconnected')
  });

  peripheral.connect(error => {
    console.log('Connected to', peripheral.id);
    connected = peripheral;

    // specify the services and characteristics to filter discovering
    const serviceUUIDs = [SERVICE_UUID];
    const characteristicUUIDs = [CHARACTERISTIC_UUID];

    peripheral.discoverSomeServicesAndCharacteristics(
      serviceUUIDs,
      characteristicUUIDs,
      onServicesAndCharacteristicsDiscovered
      );
  });
}

/*
 * Event listener when characteristics discovered
 * Set the callback for a received notification
 */
function onServicesAndCharacteristicsDiscovered(error, services, characteristics) {
  console.log('Discovered services and characteristics');
  const epdCharacteristic = characteristics[0];

  // Function that process new data received
  function processData(buffer) {
    console.log("Status: "+status);
    console.log('Read message: "' + buffer + '"');
    if (buffer.toString() == 'Ok!' && status == 0 && type !=1) {
      //Emepzamos el envio
      rqMsg = '';

      while ((pxInd < w * h) && (rqMsg.length < 256 - 12)) { //Bytes disponibles
        rqMsg += data[hexInd];
        pxInd += 4;
        hexInd++;
      }

      if (pxInd >= w * h) status++;                    

      const arr = new Uint16Array(2);

      buffIndCalc = (rqMsg.length + 12) / 2;
      const buffInd = Buffer.alloc(2);
      buffInd.writeUInt16LE(buffIndCalc);

      dSizeCalc += buffIndCalc;

      const dSize = Buffer.alloc(3);
      dSize.writeUInt16LE(dSizeCalc, 0, 3)


      var bufferToSend = Buffer.concat([Buffer.from('L', 'ascii'), buffInd, dSize, Buffer.from(rqMsg, 'hex')]);
      console.log("Buffer to send1: " + bufferToSend.toString('hex'));


      epdCharacteristic.write(bufferToSend, function(err, bytesWritten) {
        if (err) console.log(err);
        console.log("wrote: L");
      });
    } else if (buffer.toString() == 'Ok!' && status == 0 && type == 1) {
      //Emepzamos el envio pantalla a color
      rqMsg = '';

      while ((pxInd < w * h) && (rqMsg.length < 256 - 12)) { //Bytes disponibles
        rqMsg += data[hexInd];
          pxInd += 2; //cada pixel son 2 bits, por eso para cada hex tenemos avanzar 2 pixeles.
          hexInd++;
        }
      if (pxInd >= w * h) status++;

      const arr = new Uint16Array(2);

      buffIndCalc = (rqMsg.length + 12) / 2;
      const buffInd = Buffer.alloc(2);
      buffInd.writeUInt16LE(buffIndCalc);

      dSizeCalc += buffIndCalc;

      const dSize = Buffer.alloc(3);
      dSize.writeUInt16LE(dSizeCalc, 0, 3);


      var bufferToSend = Buffer.concat([Buffer.from('L', 'ascii'), buffInd, dSize, Buffer.from(rqMsg, 'hex')]);
      console.log("Buffer to send info: dSizeCalc"+dSizeCalc+" buffIndCalc: "+buffIndCalc+" pxInd: "+pxInd);
      console.log("Buffer to send2: " + bufferToSend.toString('hex'));


      epdCharacteristic.write(bufferToSend, function(err, bytesWritten) {
        if (err) console.log(err);
        console.log("wrote: L");
      });
    } else if (buffer.toString() == 'Ok!' && status == 1 && type != 1) {
      //Hacemos el Show
      epdCharacteristic.write(Buffer.from('S', 'ascii'), function(err, bytesWritten) {
        if (err) console.log(err);
        console.log("wrote: S");
      });
      status = 4;
      console.log("Desconectamos....");
      clearTimeout(timeout);
      screenDisconect(false);
      return response.send({
        message: 'Success at updating the device: ' + macaddress,
      });
    } else if (buffer.toString() == 'Ok!' && status == 1 && type == 1) {
      //Hacemos el Next

      pxInd =0;
      hexInd = 0;

      epdCharacteristic.write(Buffer.from('N', 'ascii'), function(err, bytesWritten) {
        if (err) console.log(err);
        console.log("wrote: N");                      
      });
      status = 2;
    } else if (buffer.toString() == 'Ok!' && status == 2 && type == 1) {
      //Hacemos el Load del Next
      //let dataNext = req.body.dataNext;
       //Emepzamos el envio
      rqMsg = '';

      while ((pxInd < w * h) && (rqMsg.length < 256 - 12)) { //Bytes disponibles
        rqMsg += dataNext[hexInd];
        pxInd += 4; //en caso de rojo, cada pixel es un bit.
        hexInd++;
      }
      if (pxInd >= w * h) status = 3;

      const arr = new Uint16Array(2);

      buffIndCalc = (rqMsg.length + 12) / 2;
      const buffInd = Buffer.alloc(2);
      buffInd.writeUInt16LE(buffIndCalc);

      dSizeCalc += buffIndCalc;

      const dSize = Buffer.alloc(3);
      dSize.writeUInt16LE(dSizeCalc, 0, 3)


      var bufferToSend = Buffer.concat([Buffer.from('L', 'ascii'), buffInd, dSize, Buffer.from(rqMsg, 'hex')]);
      console.log("N_Buffer to send3: " + bufferToSend.toString('hex'));


      epdCharacteristic.write(bufferToSend, function(err, bytesWritten) {
        if (err) console.log(err);
        console.log("wrote: L");
      });
    } else if (buffer.toString() == 'Ok!' && status == 3 && type == 1) {
      console.log("Finalizamos...");
      //Hacemos el Show
      epdCharacteristic.write(Buffer.from('S', 'ascii'), function(err, bytesWritten) {
        if (err) console.log(err);
        console.log("wrote: S");
      });
      status = 4;
      console.log("Desconectamos....");
      clearTimeout(timeout);
      screenDisconect(false);
      return response.send({
        message: 'Success at updating the device: ' + macaddress,
      });
    }
  trytoread();
  }

  /*
   * Active read new data on peripheral
   */
  async function trytoread(){
    if(status != 4){
      let data = "not";
      epdCharacteristic.read(function(err, read) {
        if (err) console.log(err);
        console.log("READ: "+read);
        data = read;
        if (data != "Ok!"){
          trytoread();
        } else {
          processData(data);
        }
      });
    }
  }

  if (status == 0) {
    console.log('COMENZAMOS TRANSMISION');
    epdCharacteristic.write(Buffer.concat([Buffer.from('I', 'ascii'), Buffer.from([type])]), function(err, bytesWritten) {
      if (err) console.log(err);
      console.log("wrote: I");
    });
    trytoread();
  }          
};

async function screenDisconect(needResp) {
  try{
    await sleep(1000);
    connected.disconnect();
    connected = false;
  }catch(error){
    console.log(error);
  }
  connected = false;
  noble.stopScanning();
  waiting = false;
  if (needResp)
    response.status(200).json({message: 'ERROR at updating the device: '});
}

/* GET */
exports.devices_get_all = async (req, res, next) => {
  //Retrieve/scan devices
  if(!waiting){
    waiting = true;
    wantToConnect = false;
    discoveredDevices = {"device":[]};
    devCount = 0;
    while (noble.state != "poweredOn") await sleep(100);
    console.log('SCAN STARTED');
    noble.startScanning([SERVICE_UUID],false);
    await sleep(10000);
    noble.stopScanning();
    console.log("Discovered devices:");
    console.log(discoveredDevices);
    waiting = false;
    //JSON error handling(only for testing)
    res.status(200).json(discoveredDevices);
  }else{
    console.log('Waiting for another request to finish');
      res.status(500).json({error: {message: 'Waiting for another request to finish'}});
  }
}



exports.device_update = async (req, res) => {
  if(!waiting){
    waiting = true;
    let mac = req.query.mac;
    macaddress = mac;
    //Check MAC format
    if(!macRegex.test(mac)){
      waiting = false;
      res.status(400).json({error: {message: 'Bad format: '+ mac}});
        return
    }
    //Save uploaded image
    upload(req, res, function (err) {
      if (err){
        waiting = false;
        console.log('error:'+err);
        res.status(500).json({error: {message: 'Error uploading', error: err}});
          return
      }
      //Check image
      if(req.file == undefined){
        waiting = false;
        res.status(400).json({error: {message: 'Image format not valid', error: err}});
        return
      }
      initUpload(res);
    });
  } else {
    console.log('Waiting for another request to finish');
    res.status(500).json({error:'Waiting for another request to finish'});
  } 
}

async function initUpload(res){
  while (noble.state != "poweredOn") await sleep(100);

  wantToGetName = true;
  idToGet = macaddress.replace(/:/g, '');
  noble.startScanning([SERVICE_UUID], false);
  await sleep(2000);
  wantToGetName = false;
  if(deviceFound === ''){
    wantToGetName = false;
    waiting = false;
    console.log('Device not found!!!')
    res.status(404).json({error:'Device not found'});
    return;
  }
  wantToGetName = false;
  noble.stopScanning();
  var detectedIndex = getIndexFromType(deviceFound.split("-")[1]);
  if(detectedIndex === ""){
    waiting = false;
    console.log('Device name malformed')
    res.status(400).json({error:'Device name malformed'});
    return;
  }
  rbClick(detectedIndex);
  console.log('Comenzamos tratamiento de IMAGEN...');
  await processFiles();
  console.log('Dithering IMAGEN...');
  await procImg(false,false);

  console.log('Construimos el payload Imagen');
  uploadImage();

  response = res;
  console.log('Sacamos el tipo con edpInd: '+epdInd);
  type = parseInt(epdInd);
  data = rqMsg;
  dataNext = nextMsg; 

  status = 0;
  pxInd =0;
  hexInd = 0;
  dSizeCalc = 0; 
  console.log ("Screen type: "+type);
  console.log("Processed mac: " + macaddress);

  wantToConnect = true;
  console.log("FINAL");
  noble.startScanning([SERVICE_UUID], false);   

  timeout = setTimeout(screenDisconect, 30000, true);  
}



//----------------------------------SCRIPT-----------------------------------------
var multer = require('multer'); 
var fs = require('fs');
var Jimp = require('jimp');

//Paths
var folder = './Uploads/';
var fileName = 'image.bmp';

//MAC Validation
var macRegex = RegExp(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/);

//Storage Path and FIlename for images
var Storage = multer.diskStorage({ 
    destination: function (req, file, callback) { 
        callback(null, folder); 
    }, 
    filename: function (req, file, callback) { 
        callback(null, file.originalname); 
    } 
}); 

//Storage and filter by filename
var upload = multer({ 
  storage: Storage,
  fileFilter: function (req, file, callback) {
        if(!file.originalname == fileName) return callback(new Error('Image not found/Bad filename'))
        callback(null, true)
    }
}).single('image'); 

/*.....................................................................................*/

var srcBox, srcImg, sourceJimp, dstImg;
var epdInd, nud_h, nud_w, nud_x, nud_y;
var curPal;

function rbClick(index) {
  console.log("Index selected: "+index)
  nud_w = +epdArr[index][0];
  nud_h = +epdArr[index][1];
  nud_x = 0;
  nud_y = 0;
  epdInd = index;
}

var dX, dY, dW, dH, sW, sH;

function getVal(p, i) {
  if ((p.data[i] == 0x00) && (p.data[i + 1] == 0x00)) return 0;
  if ((p.data[i] == 0xFF) && (p.data[i + 1] == 0xFF)) return 1;
  //if ((p.data[i] == 0x7F) && (p.data[i + 1] == 0x7F)) return 2;
  if ((p.data[i] == 0x7F) && (p.data[i + 1] == 0x7F)) return 0;
  return 3;
}

function setVal(p, i, c) {
  p.data[i] = curPal[c][0];
  p.data[i + 1] = curPal[c][1];
  p.data[i + 2] = curPal[c][2];
  p.data[i + 3] = 255;
}

function addVal(c, r, g, b, k) {
  return [c[0] + (r * k) / 32, c[1] + (g * k) / 32, c[2] + (b * k) / 32];
}

function getErr(r, g, b, stdCol) {
  r -= stdCol[0];
  g -= stdCol[1];
  b -= stdCol[2];
  return r * r + g * g + b * b;
}

function getNear(r, g, b) {
  var ind = 0;
  var err = getErr(r, g, b, curPal[0]);
  for (var i = 1; i < curPal.length; i++) {
    var cur = getErr(r, g, b, curPal[i]);
    if (cur < err) {
      err = cur;
      ind = i;
    }
  }
  return ind;
}

async function processFiles() {
  srcImg = 0;
  srcImg = await Jimp.read('./Uploads/image.bmp');

  dX = parseInt(nud_x);
  dY = parseInt(nud_y);
  dW = parseInt(nud_w);
  dH = parseInt(nud_h);

  w = dW;
  h = dH;

  console.log('Imagen origen: '+srcImg.bitmap.width+' x '+srcImg.bitmap.height);
}


var pDst;
var pSrc;

async function procImg(isLvl, isRed) {
  var palInd = epdArr[epdInd][2];
  if (isRed && ((palInd & 1) == 0)) {
    console.log('This white-black display');
    return;
  }
  if (!isRed) palInd = palInd & 0xFE;
  curPal = palArr[palInd];
  

  srcImg.resize(dW, dH);


  sW = srcImg.bitmap.width;
  sH = srcImg.bitmap.height;

  console.log('Imagen redimensionda a: '+sW+' x '+sH);

  if ((dW < 3) || (dH < 3)) {
    console.log('Image is too small');
    return;
  }

  var index = 0;
  pSrc = {};
  pSrc.data = srcImg.bitmap.data;

  pDst = {};
  pDst.data = [];

  if (isLvl) {
    for (var j = 0; j < dH; j++) {
      var y = dY + j;
      if ((y < 0) || (y >= sH)) {
        for (var i = 0; i < dW; i++, index += 4) setVal(pDst, index, (i + j) % 2 == 0 ? 1 : 0);
        continue;
      }
      for (var i = 0; i < dW; i++) {
        var x = dX + i;
        if ((x < 0) || (x >= sW)) {
          setVal(pDst, index, (i + j) % 2 == 0 ? 1 : 0);
          index += 4;
          continue;
        }
        var pos = (y * sW + x) * 4;
        setVal(pDst, index, getNear(pSrc.data[pos], pSrc.data[pos + 1], pSrc.data[pos + 2]));
        index += 4;
      }
    }
  } else {
    var aInd = 0;
    var bInd = 1;
    var errArr = new Array(2);
    errArr[0] = new Array(dW);
    errArr[1] = new Array(dW);
    for (var i = 0; i < dW; i++)
      errArr[bInd][i] = [0, 0, 0];
    for (var j = 0; j < dH; j++) {
      var y = dY + j;
      if ((y < 0) || (y >= sH)) {
        for (var i = 0; i < dW; i++, index += 4) setVal(pDst, index, (i + j) % 2 == 0 ? 1 : 0);
        continue;
      }
      aInd = ((bInd = aInd) + 1) & 1;
      for (var i = 0; i < dW; i++) errArr[bInd][i] = [0, 0, 0];
      for (var i = 0; i < dW; i++) {
        var x = dX + i;
        if ((x < 0) || (x >= sW)) {
          setVal(pDst, index, (i + j) % 2 == 0 ? 1 : 0);
          index += 4;
          continue;
        }
        var pos = (y * sW + x) * 4;
        var old = errArr[aInd][i];
        var r = pSrc.data[pos] + old[0];
        var g = pSrc.data[pos + 1] + old[1];
        var b = pSrc.data[pos + 2] + old[2];
        var colVal = curPal[getNear(r, g, b)];
        pDst.data[index++] = colVal[0];
        pDst.data[index++] = colVal[1];
        pDst.data[index++] = colVal[2];
        pDst.data[index++] = 255;
        r = (r - colVal[0]);
        g = (g - colVal[1]);
        b = (b - colVal[2]);
        if (i == 0) {
          errArr[bInd][i] = addVal(errArr[bInd][i], r, g, b, 7.0);
          errArr[bInd][i + 1] = addVal(errArr[bInd][i + 1], r, g, b, 2.0);
          errArr[aInd][i + 1] = addVal(errArr[aInd][i + 1], r, g, b, 7.0);
        } else if (i == dW - 1) {
          errArr[bInd][i - 1] = addVal(errArr[bInd][i - 1], r, g, b, 7.0);
          errArr[bInd][i] = addVal(errArr[bInd][i], r, g, b, 9.0);
        } else {
          errArr[bInd][i - 1] = addVal(errArr[bInd][i - 1], r, g, b, 3.0);
          errArr[bInd][i] = addVal(errArr[bInd][i], r, g, b, 5.0);
          errArr[bInd][i + 1] = addVal(errArr[bInd][i + 1], r, g, b, 1.0);
          errArr[aInd][i + 1] = addVal(errArr[aInd][i + 1], r, g, b, 7.0);
        }
      }
    }
  }
}

var pxInd, stInd;
var dispW, dispH;
var xhReq, dispX;
var rqPrf, rqMsg;

function byteToStr(v) {
  var s = v.toString(16);
  while (s.length < 2) s = '0' + s;
  return s.slice(-2);
}


function wordToStr(v) { 
  var s= byteToStr(v&0xFF) + byteToStr((v>>8)&0xFF);
  console.log(s + " " + rqMsg.length);
  return s;
}

function u_send(cmd, next) {
  xhReq.open('POST', rqPrf + cmd, true);
  xhReq.send('');
  if (next) stInd++;
  return 0;
}

function u_next() {
  lnInd = 0;
  pxInd = 0;
  u_send('NEXT_', true);
}

function u_done() {
  console.log('Performed complete!');
  return u_send('SHOW_', true);
}

function u_show(a, k1, k2) {
  var x = '' + (k1 + k2 * pxInd / a.length);
  if (x.length > 5) x = x.substring(0, 5);
  console.log('Progress: ' + x + '%');
  return u_send(rqMsg + wordToStr(rqMsg.length) + 'LOAD_', pxInd >= a.length);
}

function u_data(a, c, k1, k2) {
  rqMsg = '';
  if (c == -1) {
    while ((pxInd < a.length) && (rqMsg.length < 1000)) {
      var v = 0;
      for (var i = 0; i < 16; i += 2)
        if (pxInd < a.length) v |= (a[pxInd++] << i);
      rqMsg += wordToStr(v);
    }
  } else {
    while ((pxInd < a.length) && (rqMsg.length < 1000)) {
      var v = 0;
      for (var i = 0; i < 8; i++)
        if ((pxInd < a.length) && (a[pxInd++] != c)) v |= (128 >> i);
      rqMsg += byteToStr(v);
    }
  }
  return u_show(a, k1, k2);
}

function u_data2(a, c, k1, k2, next) {
  rqMsg = '';

  if (c == -1) {
    while (pxInd < a.length) {
      var v = 0;
      for (var i = 0; i < 16; i += 2)
        if (pxInd < a.length) v |= (a[pxInd++] << i);
      rqMsg += wordToStr(v);
    }
  } else {
    while (pxInd < a.length) {
      var v = 0;
      for (var i = 0; i < 8; i++)
        if ((pxInd < a.length) && (a[pxInd++] != c)) v |= (128 >> i);
      rqMsg += byteToStr(v);
    }
  }
  nextMsg = '';
  pxInd = 0;
  
  if (next){
    c=3; //Por las pantallas a color
    while (pxInd < a.length) {
      var v = 0;
      for (var i = 0; i < 8; i++)
        if ((pxInd < a.length) && (a[pxInd++] != c)) v |= (128 >> i);
      nextMsg += byteToStr(v);
      console.log(a.length+" "+rqMsg.length);
    }
  }

  return rqMsg;
}

function u_line(a, k1, k2) {
  var x;
  rqMsg = '';
  while (rqMsg.length < 1000) {
    x = 0;
    while (x < 122) {
      var v = 0;
      for (var i = 0;
        (i < 8) && (x < 122); i++, x++)
        if (a[pxInd++] != 0) v |= (128 >> i);
      rqMsg += byteToStr(v);
    }
  }
  return u_show(a, k1, k2);
}

function uploadImage() {
  w = dW;
  h = dH;

  var a = new Array(w * h);
  var i = 0;    
  for (var y = 0; y < h; y++)
    for (var x = 0; x < w; x++, i++) {
      a[i] = getVal(pDst, i << 2);
    }
  //console.log("a: "+a);

  dispX = 0;
  pxInd = 0;
  stInd = 0;
  
  console.log("epdInd seleccionado: "+epdInd);

  if (epdInd == 3) {
    if (stInd == 0) return u_line(a, 0, 100);
    if (stInd == 1) return u_done();
  }
  if (((epdInd % 3) == 0) || (epdInd == 7)) {
    if (stInd == 0) return u_data2(a, 0, 0, 100);
    if (stInd == 1) return u_done();
  }
  if (epdInd > 15) {
    if (stInd == 0) return u_data2(a, -1, 0, 100);
    if (stInd == 1) return u_done();
  } else {
    if (stInd == 0) return u_data2(a, ((epdInd == 1) || (epdInd == 12)) ? -1 : 0, 0, 50, true);
  }
}


var palArr = [
    [
      [0, 0, 0],
      [255, 255, 255]
    ],
    [
      [0, 0, 0],
      [255, 255, 255],
      [127, 0, 0]
    ],
      [
      [0, 0, 0],
      [255, 255, 255],
      [127, 127, 127]
    ],
    [
      [0, 0, 0],
      [255, 255, 255],
      [127, 127, 127],
      [127, 0, 0]
    ],
    [
      [0, 0, 0],
      [255, 255, 255]
    ],
    [
      [0, 0, 0],
      [255, 255, 255],
      [220, 180, 0]
    ]
  ];

  var epdArr = [
    [200, 200, 0],
    [200, 200, 3],
    [152, 152, 5],
    [122, 250, 0],
    [104, 212, 1],
    [104, 212, 5],
    [104, 212, 0],
    [176, 264, 0],
    [176, 264, 1],
    [128, 296, 0],
    [128, 296, 1],
    [128, 296, 5],
    [400, 300, 0],
    [400, 300, 1],
    [400, 300, 5],
    [600, 448, 0],
    [600, 448, 1],
    [600, 448, 5],
    [640, 384, 0],
    [640, 384, 1],
    [640, 384, 5]
  ];

function getIndexFromType (edpType){   
  switch (edpType) {
    case "1.54": 
      return "0";
    case "1.54b":      
      return "1";
    case "1.54c": 
      return "2";
    case "2.13": 
      return "3";
    case "2.13b":  
      return "4";
    case "2.13c": 
      return "5";
    case "2.13d":       
      return "6";
    case "2.7":  
      return "7";
    case "2.7b": 
      return "8";
    case "2.9": 
      return "9";
    case "2.9b": 
      return "10";
    case "2.9c":       
      return "11";
    case "4.2": 
      return "12";
    case "4.2b": 
      return "13";
    case "4.2c":
      return "14";
    case "5.83": 
      return "15";
    case "5.83b":        
      return "16";
    case "5.83c":
      return "17";
    case "7.5":  
      return "18";
    case "7.5b": 
      return "19";
    case "7.5c": 
      return "20";
    default:
      return "";
  }
}
