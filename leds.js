
function LEDs(length, socket) {
  this.length = length;
  this.socket = socket;
  this.clear();
}

LEDs.prototype.setAll = function(rgb) {
  this.rgbs = [];
  for (var i=0; i<this.length; i++) {
    this.rgbs.push(rgb);
  }
}

LEDs.prototype.clear = function() {
  this.setAll([0,0,0]);
}

LEDs.prototype.update = function() {
  var packet = new Uint8ClampedArray(4 + this.rgbs.length * 3);

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

  // Sample the center pixel of each LED
  var dest = 4; // Dest position in our packet. Start right after the header.
  for (var i = 0; i < this.rgbs.length; i++) {
      packet[dest++] = this.rgbs[i][0];
      packet[dest++] = this.rgbs[i][1];
      packet[dest++] = this.rgbs[i][2];
  }
  this.socket.send(packet.buffer);
}


module.exports.LEDs = LEDs;
