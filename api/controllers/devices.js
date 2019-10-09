
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

/* UUIDs ---------------------------------------------------------------------*/
const SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
const CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"


var noble = require('@abandonware/noble');
var connected;

noble.on('discover', peripheral => {
  // connect to the first peripheral that is scanned
  noble.stopScanning();
  const name = peripheral.advertisement.localName;
  console.log(`Connecting to '${name}' ${peripheral.id}`);
  connectAndSetUp(peripheral);
});

function connectAndSetUp(peripheral) {

  peripheral.connect(error => {
    console.log('Connected to', peripheral.id);

    // specify the services and characteristics to discover
    const serviceUUIDs = [SERVICE_UUID];
    const characteristicUUIDs = [CHARACTERISTIC_UUID];

    peripheral.discoverSomeServicesAndCharacteristics(
      serviceUUIDs,
      characteristicUUIDs,
      onServicesAndCharacteristicsDiscovered
      );
  });
  
  peripheral.on('disconnect', () => console.log('disconnected'));
}

function onServicesAndCharacteristicsDiscovered(error, services, characteristics) {
  console.log('Discovered services and characteristics');
  const epdCharacteristic = characteristics[0];

  // data callback receives notifications
  epdCharacteristic.on('data', (buffer, isNotification) => {
    console.log('Received: "' + buffer + '"');
    console.log('received message:', buffer.toString());
    if (buffer.toString() == 'Ok!' && status == 0 && type !=1) {
      //Emepzamos el envio
      rqMsg = '';

      while ((pxInd < w * h) && (rqMsg.length < 512 - 12)) { //Bytes disponibles
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
      console.log("Buffer to send: " + bufferToSend.toString('hex'));


      btSerial.write(bufferToSend, function(err, bytesWritten) {
        if (err) console.log(err);
        console.log("wrote: L");
      });
    } else if (buffer.toString() == 'Ok!' && status == 0 && type == 1) {
      //Emepzamos el envio pantalla a color
      rqMsg = '';

      while ((pxInd < w * h) && (rqMsg.length < 512 - 12)) { //Bytes disponibles
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
      console.log("Buffer to send: " + bufferToSend.toString('hex'));


      epdCharacteristic.write(bufferToSend, function(err, bytesWritten) {
        if (err) console.log(err);
        console.log("wrote: L");
      });
    } else if (buffer.toString() == 'Ok!' && status == 1 && type != 1) {
      //Hacemos el Show
      epdCharacteristic.write(Buffer.from('S', 'ascii'), function(err, bytesWritten) {
        if (err) console.log(err);
        console.log("wrote: S");
        status = 0;
        btSerial.close(); //
        return res.send({
          message: 'Success at updating the device: ' + macaddress,
          });
      });
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

      while ((pxInd < w * h) && (rqMsg.length < 512 - 12)) { //Bytes disponibles
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
      console.log("N_Buffer to send: " + bufferToSend.toString('hex'));


      epdCharacteristic.write(bufferToSend, function(err, bytesWritten) {
        if (err) console.log(err);
        console.log("wrote: L");

      });
    } else if (buffer.toString() == 'Ok!' && status == 3 && type == 1) {
      //Hacemos el Show
      epdCharacteristic.write(Buffer.from('S', 'ascii'), function(err, bytesWritten) {
        if (err) console.log(err);
        console.log("wrote: S");
        status = 0;
        btSerial.close(); //
        return res.send({
          message: 'Success at updating the device: ' + macaddress,
          });
      });
    }
  });

  // subscribe to be notified whenever the peripheral update the characteristic
  epdCharacteristic.subscribe(error => {
    if (error) {
      console.error('Error subscribing to epdCharacteristic');
    } else {
      console.log('Subscribed for epdCharacteristic notifications');
    }
  });

  if (status == 0) {
    console.error('COMENZAMOS TRANSMISION');
    epdCharacteristic.write(Buffer.concat([Buffer.from('I', 'ascii'), Buffer.from([type])]), function(err, bytesWritten) {
      if (err) console.log(err);
      console.log("wrote: I");
    });
  }          
}

var macaddress;
var data;
var w;
var h;
var map;
var type = getScreenType(req.body.type); 

exports.device_update = (req, res) => {

  macaddress = req.body.mac;
  data = req.body.data;
  w = req.body.w;
  h = req.body.h;
  map = new Map();
  console.log ("Screen type: "+req.body.type);
  type = getScreenType(req.body.type); 
  console.log("Processed mac: " + macaddress);

  status = 0;
  pxInd =0;
  hexInd = 0;
  dSizeCalc = 0; 

  noble.startScanning([SERVICE_UUID]);   



  res.status(200).json({message: 'ERROR at updating the device: ' + mac});
  return;

}