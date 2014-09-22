var PNG = require('pngjs').PNG;

var writeImageInterval = 10;

function LEDs(width, height, socket, writeImage) {
  this.width = width;
  this.height = height;
  this.socket = socket;
  this.writeImage = writeImage;
  this.clear();
  this.pngData = "";
  this.count = 0;
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

LEDs.prototype.update = function() {
  this.count++;
  
  var packet = new Uint8ClampedArray(4 + this.width * this.height * 3);
  var dest = 4; // Dest position in our packet. Start right after the header.
  for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
      packet[dest++] = this.rgbs[x][y][0];
      packet[dest++] = this.rgbs[x][y][1];
      packet[dest++] = this.rgbs[x][y][2];
    }
  }

  // write the image to disk
  if (this.writeImage && (this.count % writeImageInterval == 0)) {
    var png = new PNG({width: this.width, height: this.height});

    for (var i=0, j=4; i<png.width * png.height * 4; i+=4) {
      png.data[i]   = packet[j++];
      png.data[i+1] = packet[j++];
      png.data[i+2] = packet[j++];
      png.data[i+3] = 255;
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

  if (this.socket == null) {
    return;
  }
  
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

  this.socket.send(packet.buffer);
}



module.exports.LEDs = LEDs;
