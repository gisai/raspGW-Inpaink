
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
      myFunc();
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
      myFunc();
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

var response;

exports.device_update = async (req, res) => {
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

  noble.startScanning([SERVICE_UUID],true);   

  //setTimeout(myFunc(res), 10000);
}

async function myFunc() {
  try{
    await sleep(100);
    connected.disconnect();
    connected = false;
  }catch(error){console.log(error);}
  connected = false;
  noble.stopScanning();
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
