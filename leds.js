var PNG = require('pngjs').PNG;
var fs = require('fs');
var WebSocket = require('ws');
var SerialPort = require("serialport").SerialPort;

var updateImageInterval = 0;
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

    this.packet = new Buffer(new Uint8ClampedArray(4 + this.width * this.height * 3));
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

    this.packet = new Buffer(new Uint8ClampedArray(this.width * this.height * depth / 8));
  } else {
    // ... or don't connect to anything
  }

  this.png = new PNG({width: width, height: height});
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

LEDs.prototype.packData = function() {
    var dest;
  if (this.socket != null) {
    // Fadecandy
    dest = 4; // Dest position in our packet. Start right after the header.
    for (var y = 0; y < this.height; y++) {
      for (var x = 0; x < this.width; x++) {
        var rgb = gammaRgb48(this.gammaTable, this.depth, this.rgbs48[x][y]);
        this.packet[dest++] = rgb[0];
        this.packet[dest++] = rgb[1];
        this.packet[dest++] = rgb[2];
      }
    }

    return this.packet.buffer;
  } else {
    // Serial
    dest = 0;
    if (this.depth == 48) {
      //console.log(this.rgbs48[0][0]);
      for (var y=0; y<this.height; y++) {
	for (var x=0; x<this.width; x++) {  
	  var r = this.gammaTable[this.rgbs48[x][y][0]]; 
	  var g = this.gammaTable[this.rgbs48[x][y][1]]; 
	  var b = this.gammaTable[this.rgbs48[x][y][2]]; 
	  this.packet[dest++] = Math.min(254, r & 0xFF);
	  this.packet[dest++] = Math.min(254, r >> 8);
	  this.packet[dest++] = Math.min(254, g & 0xFF);
	  this.packet[dest++] = Math.min(254, g >> 8);
	  this.packet[dest++] = Math.min(254, b & 0xFF);
	  this.packet[dest++] = Math.min(254, b >> 8);
	}
      }
    } else if (this.depth == 24) {
      for (var y=0; y<this.height; y++) {
	for (var x=0; x<this.width; x++) {  
	  var r = this.gammaTable[this.rgbs48[x][y][0] >> 8]; 
	  var g = this.gammaTable[this.rgbs48[x][y][1] >> 8]; 
	  var b = this.gammaTable[this.rgbs48[x][y][2] >> 8]; 
	  this.packet[dest++] = Math.min(254, r);
          this.packet[dest++] = Math.min(254, g);
          this.packet[dest++] = Math.min(254, b);
	}
      }
    }
    
    this.packet[dest++]; // add the termination
  }
  
  return this.packet;
}

// update the internal png
LEDs.prototype.updateImage = function() {
  var dest = 0;
  for (var y=0; y<this.height; y++) {
    for (var x=0; x<this.width; x++) {
      for (var c=0; c<3; c++) {
        this.png.data[dest++] = this.rgbs48[x][y][c] >> 8;
      }
      this.png.data[dest++] = 255; // alpha
    }
  }
  
  var leds = this;
  var chunks = [];
  this.png.on('data', function(chunk) {
    chunks.push(chunk);
  });
  this.png.on('end', function() {
     leds.pngData = Buffer.concat(chunks);
  });
  this.png.pack();
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
