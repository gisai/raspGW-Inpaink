
/* UUIDs ---------------------------------------------------------------------*/
const SERVICE_UUID = "4fafc2011fb5459e8fccc5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e36e14688b7f5ea07361b26a8";

//BLocking
var waiting = false;

var noble = require('@abandonware/noble');
var connected = false;

var wantToConnect = false;

var macaddress;
var data;
var w;
var h;
var map;
var type; 

var discoveredDevices = {};
var devCount = 0;

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

noble.on('discover', peripheral => {
  if(wantToConnect){
    console.log('Device discovered!');
    const name = peripheral.advertisement.localName;
    if(name != "esp32") return;
    noble.stopScanning();
    console.log(`Connecting to '${name}' ${peripheral.id}`);
    connectAndSetUp(peripheral);
    wantToConnect = false;
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

function connectAndSetUp(peripheral) {

  peripheral.on('disconnect', () => console.log('disconnected'));

  peripheral.connect(error => {
    console.log('Connected to', peripheral.id);
    connected = peripheral;

    // specify the services and characteristics to discover
    const serviceUUIDs = [SERVICE_UUID];
    const characteristicUUIDs = [CHARACTERISTIC_UUID];

    peripheral.discoverSomeServicesAndCharacteristics(
      serviceUUIDs,
      characteristicUUIDs,
      onServicesAndCharacteristicsDiscovered
      );
  });
}

function onServicesAndCharacteristicsDiscovered(error, services, characteristics) {
  console.log('Discovered services and characteristics');
  const epdCharacteristic = characteristics[0];

  // data callback receives notifications
  function processData(buffer) {
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
      dSize.writeUInt16LE(dSizeCalc, 0, 3)


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
      return response.send({
        message: 'Success at updating the device: ' + macaddress,
      });
      screenDisconect(true);
      clearTimeout(timeout);
    } else if (buffer.toString() == 'Ok!' && status == 1 && type == 1) {
      //Hacemos el Next

      pxInd =0;
      hexInd = 0;

      epdCharacteristic.write(Buffer.from('N', 'ascii'), function(err, bytesWritten) {
        if (err) console.log(err);
        console.log("wrote: N");
        status = 2;                      
      });
    } else if (buffer.toString() == 'Ok!' && status == 2 && type == 1) {
      //Hacemos el Load del Next
      let dataNext = req.body.dataNext;
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
      return response.send({
        message: 'Success at updating the device: ' + macaddress,
      });
      screenDisconect(true);
      clearTimeout(timeout);
    }
  trytoread();
  }

  async function trytoread(){
    if(status != 4){
      let data = "not";
      epdCharacteristic.read(function(err, read) {
        if (err) console.log(err);
        console.log("READ: "+read);
        data = read;
      });
      while (data != "Ok!"){
        await sleep(100);
      }
      processData(data);
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

function screenDisconect(resp) {
  try{
    connected.disconnect();
    connected = false;
  }catch(error){console.log(error);}
  connected = false;
  noble.stopScanning();
  if (!resp)
    response.status(200).json({message: 'ERROR at updating the device: '});
}

function getScreenType (type){
  switch (type) {
    case "1.54":
    return 0;       
    case "1.54b":
    return 1; 
    case "1.54c":
    return 2; 
    case "2.13":
    return 3; 
    case "2.13b":
    return 4; 
    case "2.13c":
    return 5;       
    case "2.13d":
    return 6; 
    case "2.7":
    return 7; 
    case "2.7b":
    return 8; 
    case "2.9":
    return 9; 
    case "2.9b":
    return 10;       
    case "2.9c":
    return 11; 
    case "4.2":
    return 12; 
    case "4.2b":
    return 13; 
    case "4.2c":
    return 14; 
    case "5.83":
    return 15;       
    case "5.83b":
    return 16; 
    case "5.83c":
    return 17; 
    case "7.5":
    return 18; 
    case "7.5b":
    return 19; 
    case "7.5c":
    return 20;     
  }
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

var response,timeout;

exports.device_update = async (req, res) => {
  if(!waiting){
    waiting = true;
    let mac = req.query.mac;
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

      response = res;
      type = getScreenType(req.body.type);
      macaddress = req.body.mac;
      data = req.body.data;
      w = req.body.w;
      h = req.body.h;
      map = new Map(); 
      status = 0;
      pxInd =0;
      hexInd = 0;
      dSizeCalc = 0; 
      console.log ("Screen type: "+req.body.type);
      console.log("Processed mac: " + macaddress);

      while (noble.state != "poweredOn") await sleep(100);
      wantToConnect = true;

      noble.startScanning([SERVICE_UUID], false);   

      timeout = setTimeout(screenDisconect(false), 10000);  
    });
  } else {
    console.log('Waiting for another request to finish');
    res.status(500).json({error:'Waiting for another request to finish'});
  } 
}



//----------------------------------SCRIPT-----------------------------------------
var multer = require('multer'); 
var fs = require('fs');

//Paths
var folder = './Uploads/';
var fileName = 'image.bmp';

//MAC Validation
var macRegex = RegExp(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/);

//BLocking
var waiting = false;

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

/*.......*/

var srcBox, srcImg, dstImg;
var epdArr, epdInd, palArr;
var curPal;

function getElm(n) { return document.getElementById(n); }

function setInn(n, i) { document.getElementById(n).innerHTML = i; }

function processFiles(files) {
  var file = files[0];
  var reader = new FileReader();
  srcImg = new Image();
  reader.onload = function(e) {
    setInn('srcBox', '<img id="imgView" class="sourceImage">');
    var img = getElm('imgView');
    img.src = e.target.result;
    srcImg.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function drop(e) {
  e.stopPropagation();
  e.preventDefault();
  var files = e.dataTransfer.files;
  processFiles(files);
}

function ignoreDrag(e) {
  e.stopPropagation();
  e.preventDefault();
}

function getNud(nm, vl) {
  return '<td class="comment">' + nm + ':</td>' +
  '<td><input id="nud_' + nm + '" class="nud"type="number" value="' + vl + '"/></td>';
}

function Btn(nm, tx, fn) {
  return '<div><label class="menu_button" for="_' + nm + '">' + tx + '</label>' +
  '<input class="hidden_input" id="_' + nm + '" type="' +
  (nm == 0 ? 'file" onchange="' : 'button" onclick="') + fn + '"/></div>';
}

function RB(vl, tx) {
  return ((vl % 3) > 0 ? ' ' : '<br>') + '<input type="radio" name="kind" value="m' + vl +
  '" onclick="rbClick(' + vl + ');"' + (vl == 0 ? 'checked="true"' : '') + '/>' + tx;
}
window.onload = function() {
  srcBox = getElm('srcBox');
  srcBox.ondragenter = ignoreDrag;
  srcBox.ondragover = ignoreDrag;
  srcBox.ondrop = drop;
  srcImg = 0;
  epdInd = 0;
  palArr = [
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

  epdArr = [
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

  setInn('BT',
    Btn(0, 'Select image file', 'processFiles(this.files);') +
    Btn(1, 'Level: mono', 'procImg(true,false);') +
    Btn(2, 'Level: color', 'procImg(true,true);') +
    Btn(3, 'Dithering: mono', 'procImg(false,false);') +
    Btn(4, 'Dithering: color', 'procImg(false,true);') +
    Btn(5, 'Upload image', 'uploadImage();')
  );

  setInn('XY', getNud('x', '0') + getNud('y', '0'));

  setInn('WH', getNud('w', '200') + getNud('h', '200'));

  setInn('RB', 
    RB(0, '1.54&ensp;') + 
    RB(1, '1.54b') + 
    RB(2, '1.54c') +
    RB(3, '2.13&ensp;') + 
    RB(4, '2.13b') + 
    RB(5, '2.13c') + 
    RB(6, '2.13d') +
    RB(7, '2.7&ensp;&ensp;') + 
    RB(8, '2.7b&ensp;') +
    RB(9, '2.9&ensp;&ensp;') + 
    RB(10, '2.9b&ensp;') + 
    RB(11, '2.9c&ensp;') +
    RB(12, '4.2&ensp;&ensp;') + 
    RB(13, '4.2b&ensp;') + 
    RB(14, '4.2c&ensp;') +
    RB(15, '5.83&ensp;') + 
    RB(16, '5.83b') + 
    RB(17, '5.83c') +
    RB(18, '7.5&ensp;&ensp;') + 
    RB(19, '7.5b&ensp;') + 
    RB(20, '7.5c&ensp;')
  );
}

function getScreenTypefrom_epdInd (epdInd){   
  switch (epdInd) {
    case 0:
    return "1.54";       
    case 1:
    return "1.54b"; 
    case 2:
    return "1.54c"; 
    case 3:
    return "2.13"; 
    case 4:
    return "2.13b"; 
    case 5:
    return "2.13c";       
    case 6:
    return "2.13d"; 
    case 7:
    return "2.7"; 
    case 8:
    return "2.7b"; 
    case 9:
    return "2.9"; 
    case 10:
    return "2.9b";       
    case 11:
    return "2.9c"; 
    case 12:
    return "4.2"; 
    case 13:
    return "4.2b"; 
    case 14:
    return "4.2c"; 
    case 15:
    return "5.83";       
    case 16:
    return "5.83b"; 
    case 17:
    return "5.83c"; 
    case 18:
    return "7.5"; 
    case 19:
    return "7.5b"; 
    case 20:
    return "7.5c";   
  }
}

function rbClick(index) {
  getElm('nud_w').value = +epdArr[index][0];
  getElm('nud_h').value = +epdArr[index][1];
  epdInd = index;
}

var source;
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


function procImg(isLvl, isRed) {
  if (document.getElementsByClassName('sourceImage').length == 0) {
    alert('First select image');
    return;
  }
  var palInd = epdArr[epdInd][2];
  if (isRed && ((palInd & 1) == 0)) {
    alert('This white-black display');
    return;
  }
  if (!isRed) palInd = palInd & 0xFE;
  curPal = palArr[palInd];
  getElm('dstBox').innerHTML =
  '<span class="title">Processed image</span><br><canvas id="canvas"></canvas>';
  var canvas = getElm('canvas');
  sW = srcImg.width;
  sH = srcImg.height;
  source = getElm('source');
  source.width = sW;
  source.height = sH;
  source.getContext('2d').drawImage(srcImg, 0, 0, sW, sH);
  dX = parseInt(getElm('nud_x').value);
  dY = parseInt(getElm('nud_y').value);
  dW = parseInt(getElm('nud_w').value);
  dH = parseInt(getElm('nud_h').value);
  if ((dW < 3) || (dH < 3)) {
    alert('Image is too small');
    return;
  }
  canvas.width = dW;
  canvas.height = dH;
  var index = 0;
  var pSrc = source.getContext('2d').getImageData(0, 0, sW, sH);
  var pDst = canvas.getContext('2d').getImageData(0, 0, dW, dH);
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
  canvas.getContext('2d').putImageData(pDst, 0, 0);
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

function oldbyteToStr(v){return String.fromCharCode((v & 0xF) + 97, ((v >> 4) & 0xF) + 97);}
function oldwordToStr(v){return byteToStr(v&0xFF) + byteToStr((v>>8)&0xFF);}

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
  setInn('logTag', 'Complete!');
  return u_send('SHOW_', true);
}

function u_show(a, k1, k2) {
  var x = '' + (k1 + k2 * pxInd / a.length);
  if (x.length > 5) x = x.substring(0, 5);
  setInn('logTag', 'Progress: ' + x + '%');
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
  var canvas = getElm('canvas');
  var w = dispW = canvas.width;
  var h = dispH = canvas.height;

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

  if (!$('#device-selec :selected').val()) {
    alert("Please select device before uploading");
    return;
  }

  var mac = $('#device-selec :selected').val().split("@")[1];

  $.ajax({
    url: host,
    type: 'PUT',
    data: JSON.stringify({ mac: mac, w: w, h: h, type: getScreenTypefrom_epdInd(epdInd), data: rqMsg, dataNext: nextMsg }),

    contentType: "application/json",
    success: function(data) {
      console.log("Data received: " + data);
    }
  });

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
  var c = getElm('canvas');
  var w = dispW = c.width;
  var h = dispH = c.height;
  var p = c.getContext('2d').getImageData(0, 0, w, h);
  //La imagen está en p

  var a = new Array(w * h);
  var i = 0;    
  for (var y = 0; y < h; y++)
    for (var x = 0; x < w; x++, i++) {
      a[i] = getVal(p, i << 2);
    }
  console.log("a: "+a);

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
