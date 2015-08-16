var PNG = require('pngjs').PNG;
var fs = require('fs');
var WebSocket = require('ws');
var SerialPort = require("serialport").SerialPort;

var updateImageInterval = 10;
var fpsOutputMillis = 5000;
var GAMMA = 4;


function createGammaTable(gamma, numvals, maxval) {
  var table = [];
  for (var i = 0; i < numvals; i++) {
    var val = Math.pow(i / numvals, gamma);
    val = Math.floor(val * maxval + 0.5);
    table.push(val);
  }
  return table;
}

function gammaRgb48(gammaTable, depth, rgb48) {
  if (depth == 48) {
    if (gammaTable != null)
      return [gammaTable[rgb48[0]], gammaTable[rgb48[1]], gammaTable[rgb48[2]]];
    else
      return rgb48;
  } else if (depth == 24) {
    var rgb24 = [rgb48[0] >> 8, rgb48[1] >> 8, rgb48[2] >> 8];
    if (gammaTable != null)
      return [gammaTable[rgb24[0]], gammaTable[rgb24[1]], gammaTable[rgb24[2]]];
    else
      return rgb24;
  } else {
    assert(false);
  }
}

function LEDs(width, height, depth, device, layoutLeftToRight) {
  this.layoutLeftToRight = layoutLeftToRight;
  this.width = width;
  this.height = height;
  this.depth = depth;
  this.lastUpdateMillis = new Date().getTime();
  this.rgbs48 = [];
  if (GAMMA > 1)
    this.gammaTable = createGammaTable(GAMMA, 1<<(depth/3), 1<<(depth/3));
  else
    this.gammaTable = null;

  this.clear();
  this.pngData = "";
  this.count = 0;
  this.socket = null;
  this.serial = null;
  this.connected = false;
  this.frameTimer = { count: 0, lastUpdate: new Date().getTime() }
  var leds = this; // for closures
  
  if (device.indexOf("ws:") > -1) {
    // start the FadeCandy server websockets connection...
    this.socket = new WebSocket(device);
    this.socket.on('close', function(event) {
      console.log('Unable to connect to fcserver');
    });

    this.socket.on('open', function(msg) {
      console.log('Connected to fcserver');
      leds.connected = true;
    });
  } else if (device.indexOf("/dev/tty") > -1) {
    // ... or connect over a serial port ...
    leds.serial = new SerialPort(device, {baudrate: 115200});
  
    leds.serial.on("open", function () {
      console.log('Connected to serial device ' + device);
      leds.connected = true;
    });
    leds.serial.on("data", function(data) {
      console.log("Serial data: " + data);
    });
    leds.serial.on('error', function(e) {
      console.error('Serial port error: ' + e);
    });
  } else {
    // ... or don't connect to anything
  }
}

LEDs.prototype.setAllRgb48 = function(rgb48) {
  this.rgbs48 = [];
  for (var x=0; x<this.width; x++) {
    this.rgbs48[x] = [];
    for (var y=0; y<this.height; y++) {
      this.rgbs48[x][y] = rgb48;
    }
  }
}

LEDs.prototype.setRgb48 = function(x, y, rgb48) {
  this.rgbs48[x][y] = rgb48;
}


LEDs.prototype.getRgb48 = function(x, y) {
  return this.rgbs48[x][y];
}


LEDs.prototype.clear = function() {
  this.setAllRgb48([0,0,0]);
}

function getRgbBytes(depth, rgb) {
  bytes = []
  if (depth == 48) {
    bytes.push(rgb[0] & 0xFF);
    bytes.push(rgb[0] >> 8);
    bytes.push(rgb[1] & 0xFF);
    bytes.push(rgb[1] >> 8);
    bytes.push(rgb[2] & 0xFF);
    bytes.push(rgb[2] >> 8);
  } else if (depth == 24) {
    bytes.push(rgb[0]);
    bytes.push(rgb[1]);
    bytes.push(rgb[2]);
  } else {
    assert(false);
  }
  return bytes;
}

LEDs.prototype.packData = function() {
  var packet;
  if (this.socket != null) {
    // Fadecandy
    packet = new Uint8ClampedArray(4 + this.width * this.height * 3);
    var dest = 4; // Dest position in our packet. Start right after the header.
    for (var y = 0; y < this.height; y++) {
      for (var x = 0; x < this.width; x++) {
        var rgb = gammaRgb48(this.gammaTable, this.depth, this.rgbs48[x][y]);
        packet[dest++] = rgb[0];
        packet[dest++] = rgb[1];
        packet[dest++] = rgb[2];
      }
    }

    return packet.buffer;
  } else {
    // Serial
    packet = [];
    for (var y=0; y<this.height; y++) {
      if ((this.layoutLeftToRight && y % 2 == 0) ||
          (this.layoutLeftToRight && y % 2 == 1)) {
        // flip
        for (var x=0; x<this.width; x++) {
          var rgb = gammaRgb48(this.gammaTable, this.depth, this.rgbs48[this.width-1-x][y]);
          var bytes = getRgbBytes(this.depth, rgb);
          //console.log(rgb48 + ": " + bytes);
          for (i in bytes)
            packet.push(bytes[i]);
        }
      } else {
        // don't flip
        for (var x=0; x<this.width; x++) {
          var rgb = gammaRgb48(this.gammaTable, this.depth, this.rgbs48[x][y]);
          //console.log(rgb + " " + this.rgbs48[x][y]);
          var bytes = getRgbBytes(this.depth, rgb);
          //console.log(rgb + ": " + bytes);
          for (i in bytes)
            packet.push(bytes[i]);
        }
      }
    }
    
    // cap at 254 (the Teensy uses 255 to denote end of packtes) and apply the gamma
    for (var i=0; i<packet.length; i++) {
      packet[i] = Math.min(254, packet[i]);
    }
    packet.push(255); // add the termination
    //console.log("#######" + packet.length);
  }
  
  //console.log(packet);
  return new Buffer(packet);
}

LEDs.prototype.updateImage = function() {
  var png = new PNG({width: this.width, height: this.height});

  var dest = 0;
  for (var y=0; y<this.height; y++) {
    for (var x=0; x<this.width; x++) {
      for (var c=0; c<3; c++) {
        png.data[dest++] = this.rgbs48[x][y][c] >> 8;
      }
      png.data[dest++] = 255; // alpha
    }
  }
  
  var leds = this;
  var chunks = [];
  png.on('data', function(chunk) {
    chunks.push(chunk);
  });
  png.on('end', function() {
     leds.pngData = Buffer.concat(chunks);
  });
  png.pack();
}

LEDs.prototype.sendData = function(packet) {
  if (this.socket != null) {
    // Fadecandy
    if (this.socket.readyState != 1 /* OPEN */) {
      console.log("Fadecandy server not open");
      // The server connection isn't open. Nothing to do.
      return;
    }

    if (this.socket.bufferedAmount > packet.length) {
      console.log("Fadecandy server connection problems");
      // The network is lagging, and we still haven't sent the previous frame.
      // Don't flood the network, it will just make us laggy.
      // If fcserver is running on the same computer, it should always be able
      // to keep up with the frames we send, so we shouldn't reach this point.
      return;
    }

    this.socket.send(packet);
  } else {
    // Serial
//    this.serial.drain(function(error) {
//      console.log("Error draining serial connection: " + error);
//    });
    this.serial.write(packet);
  }
}

LEDs.prototype.update = function() {
  this.count++;
  // write the image to disk
  if (updateImageInterval != 0 && this.count % updateImageInterval == 0) {
    this.updateImage();
  }

  if (this.connected) {
    var packet = this.packData();
    this.sendData(packet);

    this.frameTimer.count++;
    var timeDiff = new Date().getTime() - this.frameTimer.lastUpdate;
    if (timeDiff > fpsOutputMillis) {
      console.log((this.frameTimer.count / timeDiff * 1000).toFixed(1) + " fps");
      this.frameTimer = { count: 0, lastUpdate: new Date().getTime() }
    }
  }
}



module.exports.LEDs = LEDs;
