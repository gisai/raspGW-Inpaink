// A $( document ).ready() block.

 
$( document ).ready(function() {
/* Data config */
host = 'http://'+ $("#ip_addr").val()+'/devices';

$('#scandisplays').click(function(){

$( "#device-selec" ).empty();
     $.ajax({
   url: host,
   type: "GET",
   crossDomain: true,  
   success: function (response) {   
     response.forEach(function(entry) {
    $( "#device-selec" ).append("<option>"+entry.name+"@"+entry.address+"</option>");
  //console.log(data);
});

   },
   error: function (xhr, status) {
     console.log("Error: "+status);
   },
   beforeSend: function() { $('#waitingresults').show(); },
   complete: function() { $('#waitingresults').hide(); }
 });



});
//console.log($("#ip_addr").val());

});



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
        Btn(5, 'Upload image', 'uploadImage();'));
    setInn('XY', getNud('x', '0') + getNud('y', '0'));
    setInn('WH', getNud('w', '200') + getNud('h', '200'));
    setInn('RB', RB(0, '1.54&ensp;') + RB(1, '1.54b') + RB(2, '1.54c') +
        RB(3, '2.13&ensp;') + RB(4, '2.13b') + RB(5, '2.13c') + RB(6, '2.13d') +
        RB(7, '2.7&ensp;&ensp;') + RB(8, '2.7b&ensp;') +
        RB(9, '2.9&ensp;&ensp;') + RB(10, '2.9b&ensp;') + RB(11, '2.9c&ensp;') +
        RB(12, '4.2&ensp;&ensp;') + RB(13, '4.2b&ensp;') + RB(14, '4.2c&ensp;') +
        RB(15, '5.83&ensp;') + RB(16, '5.83b') + RB(17, '5.83c') +
        RB(18, '7.5&ensp;&ensp;') + RB(19, '7.5b&ensp;') + RB(20, '7.5c&ensp;'));
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
  //  if ((p.data[i] == 0x7F) && (p.data[i + 1] == 0x7F)) return 2;
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

//function byteToStr(v) { return String.fromCharCode((v & 0xF) + 97, ((v >> 4) & 0xF) + 97); }
function byteToStr(v) {
    var s = v.toString(16);
    while (s.length < 2) s = '0' + s;
    return s.slice(-2);
}

/*function wordToStr(v) { 
    var s = v.toString(16) + (v >> 8).toString(16); 
    console.log(s + " " + rqMsg.length+ " "+v.toString(16)+ " "+(v >> 8).toString(16));
    return s;
}*/

function oldbyteToStr(v){return String.fromCharCode((v & 0xF) + 97, ((v >> 4) & 0xF) + 97);}
function oldwordToStr(v){return byteToStr(v&0xFF) + byteToStr((v>>8)&0xFF);}

function wordToStr(v) { 

    var s= byteToStr(v&0xFF) + byteToStr((v>>8)&0xFF);
   
    console.log(s + " " + rqMsg.length);
    return s;
}

/* //Funciona a medias
function wordToStr(v) { 
    var s = byteToStr(v & 0xFF) + byteToStr((v >> 8) & 0xFF); 
    console.log(s + " " + rqMsg.length+ " "+byteToStr(v & 0xFF)+ " "+byteToStr((v >> 8) & 0xFF));
    return s;
}*/

/*function wordToStr(v) {
    var s = v.toString(16);
    while (s.length < 4) s = '0' + s
    console.log(s + " " + rqMsg.length+ " "+byteToStr(v & 0xFF)+ " "+byteToStr((v >> 8) & 0xFF));        
    return s;
}*/

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
            //rqMsg += byteToStr(v);
            //console.log(a.length + " " + rqMsg.length);
        }
    } else {
        while (pxInd < a.length) {
            var v = 0;
            for (var i = 0; i < 8; i++)
                if ((pxInd < a.length) && (a[pxInd++] != c)) v |= (128 >> i);
            rqMsg += byteToStr(v);

            //console.log(a.length+" "+rqMsg.length);
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
    //console.log(p);
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
       // xhReq.onload = xhReq.onerror = function() {
            if (stInd == 0) return u_line(a, 0, 100);
            if (stInd == 1) return u_done();
       // };
       // return u_send('EPDd_', false);
    }
    if (((epdInd % 3) == 0) || (epdInd == 7)) {
      //  xhReq.onload = xhReq.onerror = function() {
            if (stInd == 0) return u_data2(a, 0, 0, 100);
            if (stInd == 1) return u_done();
      //  };
      //  return u_send('EPD' + String.fromCharCode(epdInd + 97) + '_', false);
    }
    if (epdInd > 15) {
      //  xhReq.onload = xhReq.onerror = function() {
            if (stInd == 0) return u_data2(a, -1, 0, 100);
            if (stInd == 1) return u_done();
      //  };
      //  return u_send('EPD' + String.fromCharCode(epdInd + 97) + '_', false);
    } else {
     //   xhReq.onload = xhReq.onerror = function() {
            if (stInd == 0) return u_data2(a, ((epdInd == 1) || (epdInd == 12)) ? -1 : 0, 0, 50, true);
          //  if (stInd == 1) return u_next();
          //  if (stInd == 2) return u_data2(a, 3, 50, 50);
          //  if (stInd == 3) return u_done();
    //    };
    //    return u_send('EPD' + String.fromCharCode(epdInd + 97) + '_', false);
    }




        /* 
         var a = new Array(w * h);
         var i = 0;
         for (var y = 0; y < h; y++)
             for (var x = 0; x < w; x++, i++) a[i] = getVal(p, i << 2);
         dispX = 0;
         pxInd = 0;
         stInd = 0;
         xhReq = new XMLHttpRequest();
         rqPrf = 'http://' + getElm('ip_addr').value + '/';
         if (epdInd == 3) {
             xhReq.onload = xhReq.onerror = function() {
                 if (stInd == 0) return u_line(a, 0, 100);
                 if (stInd == 1) return u_done();
             };
             return u_send('EPDd_', false); 
         }
         if (((epdInd % 3) == 0) || (epdInd == 7)) {
             xhReq.onload = xhReq.onerror = function() {
                 if (stInd == 0) return u_data(a, 0, 0, 100);
                 if (stInd == 1) return u_done();
             };
             return u_send('EPD' + String.fromCharCode(epdInd + 97) + '_', false);
         }
         if (epdInd > 15) {
             xhReq.onload = xhReq.onerror = function() {
                 if (stInd == 0) return u_data(a, -1, 0, 100);
                 if (stInd == 1) return u_done();
             };
             return u_send('EPD' + String.fromCharCode(epdInd + 97) + '_', false);
         } else {
             xhReq.onload = xhReq.onerror = function() {
                 if (stInd == 0) return u_data(a, ((epdInd == 1) || (epdInd == 12)) ? -1 : 0, 0, 50);
                 if (stInd == 1) return u_next();
                 if (stInd == 2) return u_data(a, 3, 50, 50);
                 if (stInd == 3) return u_done();
             };
             return u_send('EPD' + String.fromCharCode(epdInd + 97) + '_', false);
         }*/

    }
