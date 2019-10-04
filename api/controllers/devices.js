
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

exports.device_update = (req, res) => {

    let macaddress = req.body.mac;
    let data = req.body.data;
    let w = req.body.w;
    let h = req.body.h;
    var map = new Map();
    console.log ("Screen type: "+req.body.type);
    var type = getScreenType(req.body.type); 


    /*macArray = mac.match(/..?/g)
    
    macaddress = '';

    for (var i = 0; i < 6; i++) {
        if (i != 5) macaddress += macArray[i] + ':';
        else macaddress += macArray[i];
    }
    */

    console.log("Processed mac: " + macaddress);

    

     status = 0;
  	  pxInd =0;
  	  hexInd = 0;
  	  dSizeCalc = 0;

     /*  res.status(200).json({
                            message: 'Success at updating the device: ' + mac,
                        });
       return;
      */ 

    btSerial = new(require('bluetooth-serial-port')).BluetoothSerialPort();


    btSerial.findSerialPortChannel(macaddress, function(channel) {
        btSerial.connect(macaddress, channel, function() {
            console.log('connected to address: ' + macaddress + " channel: " + channel); 

            if (status == 0) {
                btSerial.write(Buffer.concat([Buffer.from('I', 'ascii'), Buffer.from([type])]), function(err, bytesWritten) {
                    if (err) console.log(err);
                    console.log("wrote: I");
                });
            }          

            btSerial.on('data', function(buffer) {
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


                    btSerial.write(bufferToSend, function(err, bytesWritten) {
                        if (err) console.log(err);
                        console.log("wrote: L");
                    });
                }


                else if (buffer.toString() == 'Ok!' && status == 1 && type != 1) {
                    //Hacemos el Show
                    btSerial.write(Buffer.from('S', 'ascii'), function(err, bytesWritten) {
                        if (err) console.log(err);
                        console.log("wrote: S");
                        status = 0;
                        btSerial.close(); //
                        return res.send({
                            message: 'Success at updating the device: ' + macaddress,
                        });
                    });

                }
                else if (buffer.toString() == 'Ok!' && status == 1 && type == 1) {
                    //Hacemos el Next

                     pxInd =0;
                     hexInd = 0;

                    btSerial.write(Buffer.from('N', 'ascii'), function(err, bytesWritten) {
                        if (err) console.log(err);
                        console.log("wrote: N");
                        status = 2;                      
                    });

                }
                else if (buffer.toString() == 'Ok!' && status == 2 && type == 1) {
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


                    btSerial.write(bufferToSend, function(err, bytesWritten) {
                        if (err) console.log(err);
                        console.log("wrote: L");

                    });

                }else if (buffer.toString() == 'Ok!' && status == 3 && type == 1) {
                    //Hacemos el Show
                    btSerial.write(Buffer.from('S', 'ascii'), function(err, bytesWritten) {
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
            


        });
    }, function() {
        console.log('cannot connect');
        setTimeout(function(){
    // this code will only run when time has elapsed
    exports.device_update(req, res, btSerial);
}, 3 * 1000);

    });

    // close the connection when you're ready
    btSerial.close();
   

}