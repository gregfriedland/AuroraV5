var PNG = require('pngjs').PNG;
var fs = require('fs');
var WebSocket = require('ws');
var SerialPort = require("serialport").SerialPort;

var updateImageInterval = 10;
var fpsOutputMillis = 5000;
var correctGamma = true;

// 256 8-bit values; gamma=2.5
var gammaTable = [
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x01,0x01,
    0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,
    0x01,0x02,0x02,0x02,0x02,0x02,0x02,0x02,
    0x02,0x03,0x03,0x03,0x03,0x03,0x04,0x04,
    0x04,0x04,0x04,0x05,0x05,0x05,0x05,0x06,
    0x06,0x06,0x06,0x07,0x07,0x07,0x07,0x08,
    0x08,0x08,0x09,0x09,0x09,0x0a,0x0a,0x0a,
    0x0b,0x0b,0x0c,0x0c,0x0c,0x0d,0x0d,0x0e,
    0x0e,0x0f,0x0f,0x0f,0x10,0x10,0x11,0x11,
    0x12,0x12,0x13,0x13,0x14,0x14,0x15,0x16,
    0x16,0x17,0x17,0x18,0x19,0x19,0x1a,0x1a,
    0x1b,0x1c,0x1c,0x1d,0x1e,0x1e,0x1f,0x20,
    0x21,0x21,0x22,0x23,0x24,0x24,0x25,0x26,
    0x27,0x28,0x28,0x29,0x2a,0x2b,0x2c,0x2d,
    0x2e,0x2e,0x2f,0x30,0x31,0x32,0x33,0x34,
    0x35,0x36,0x37,0x38,0x39,0x3a,0x3b,0x3c,
    0x3d,0x3e,0x3f,0x40,0x41,0x43,0x44,0x45,
    0x46,0x47,0x48,0x49,0x4b,0x4c,0x4d,0x4e,
    0x50,0x51,0x52,0x53,0x55,0x56,0x57,0x59,
    0x5a,0x5b,0x5d,0x5e,0x5f,0x61,0x62,0x63,
    0x65,0x66,0x68,0x69,0x6b,0x6c,0x6e,0x6f,
    0x71,0x72,0x74,0x75,0x77,0x79,0x7a,0x7c,
    0x7d,0x7f,0x81,0x82,0x84,0x86,0x87,0x89,
    0x8b,0x8d,0x8e,0x90,0x92,0x94,0x96,0x97,
    0x99,0x9b,0x9d,0x9f,0xa1,0xa3,0xa5,0xa6,
    0xa8,0xaa,0xac,0xae,0xb0,0xb2,0xb4,0xb6,
    0xb8,0xba,0xbd,0xbf,0xc1,0xc3,0xc5,0xc7,
    0xc9,0xcc,0xce,0xd0,0xd2,0xd4,0xd7,0xd9,
    0xdb,0xdd,0xe0,0xe2,0xe4,0xe7,0xe9,0xeb,
    0xee,0xf0,0xf3,0xf5,0xf8,0xfa,0xfd,0xff];

function LEDs(width, height, device, layoutLeftToRight) {
  this.layoutLeftToRight = layoutLeftToRight;
  this.width = width;
  this.height = height;
  this.lastUpdateMillis = new Date().getTime();

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

LEDs.prototype.setAll = function(rgb) {
  this.rgbs = [];
  for (var x=0; x<this.width; x++) {
    this.rgbs[x] = [];
    for (var y=0; y<this.height; y++) {
      this.rgbs[x][y] = rgb;
    }
  }
}

LEDs.prototype.clear = function() {
  this.setAll([0,0,0]);
}

LEDs.prototype.packData = function() {
  var packet;
  if (this.socket != null) {
    // Fadecandy
    packet = new Uint8ClampedArray(4 + this.width * this.height * 3);
    var dest = 4; // Dest position in our packet. Start right after the header.

    for (var y = 0; y < this.height; y++) {
      for (var x = 0; x < this.width; x++) {
        packet[dest++] = this.rgbs[x][y][0];
        packet[dest++] = this.rgbs[x][y][1];
        packet[dest++] = this.rgbs[x][y][2];
      }
    }

    if (correctGamma) {
      // apply gamma table again even though fadecandy is supposed to
      // do this; this makes sure the colors are rich
      for (var i=0; i<packet.length; i++) {
        packet[i] = gammaTable[packet[i]];
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
          packet.push(this.rgbs[this.width-1-x][y][0]);
          packet.push(this.rgbs[this.width-1-x][y][1]);
          packet.push(this.rgbs[this.width-1-x][y][2]);
        }
      } else {
        // don't flip
        for (var x=0; x<this.width; x++) {
          packet.push(this.rgbs[x][y][0]);
          packet.push(this.rgbs[x][y][1]);
          packet.push(this.rgbs[x][y][2]);
        }
      }
    }
    
    // cap at 254 (the Teensy uses 255 to denote end of packtes) and apply the gamma
    for (var i=0; i<packet.length; i++) {
      if (correctGamma)
        packet[i] = gammaTable[packet[i]];
      packet[i] = Math.min(254, packet[i]);
    }
    packet.push(255); // add the termination
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
        png.data[dest++] = this.rgbs[x][y][c];
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
