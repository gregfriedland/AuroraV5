

// Set all pixels to a given color
function updateLEDs(socket, leds) {
  var packet = new Uint8ClampedArray(4 + leds.length * 3);

  if (socket.readyState != 1 /* OPEN */) {
      console.log("Fadecandy server not open");
      // The server connection isn't open. Nothing to do.
      return;
  }

  if (socket.bufferedAmount > packet.length) {
      console.log("Fadecandy server connection problems");
      // The network is lagging, and we still haven't sent the previous frame.
      // Don't flood the network, it will just make us laggy.
      // If fcserver is running on the same computer, it should always be able
      // to keep up with the frames we send, so we shouldn't reach this point.
      return;
  }

  // Sample the center pixel of each LED
  var dest = 4; // Dest position in our packet. Start right after the header.
  for (var i = 0; i < leds.length; i++) {
      packet[dest++] = leds[i][0];
      packet[dest++] = leds[i][1];
      packet[dest++] = leds[i][2];
  }
  socket.send(packet.buffer);
}
