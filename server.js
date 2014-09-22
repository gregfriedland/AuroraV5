//// Node.js server ////

var patterns = require('./patterns.js');
var alienblob = require('./alienblob.js');
var leds = require('./leds.js');
var palette = require('./palette.js');
var allBaseColors = require('./kuler.js').allBaseColors;

var fs = require('fs');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var socketIO = require('socket.io');
var io = socketIO(http);
var path = require('path');
var WebSocket = require('ws');


//// Server config variables ////
var numColors = 1024;
var width = 32;
var height = 18;
var startDrawer = 'AlienBlob';
var showImage = true;
var fadeCandyServer = null;// "ws://localhost:7890";

//// Global variables ////
var drawers = {AlienBlob: new alienblob.AlienBlobDrawer(width, height, numColors),
               Gradient: new patterns.GradientDrawer(),
               Wipe: new patterns.WipeDrawer(),
               Wave: new patterns.WaveDrawer(),
               Sparkle: new patterns.SparkleDrawer(),
               Pulse: new patterns.PulseDrawer()};



//// Start the patterns ////
var paletteMgr = new palette.PaletteManager(allBaseColors, numColors);
var leds = new leds.LEDs(width, height, fcSocket, showImage);
var animator = new patterns.Animator(leds, paletteMgr, drawers[startDrawer]);
console.log('starting drawer ' + startDrawer);
animator.run();



//// Start the http server ///
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (showImage) {
  app.get('/image', function(req, res) {
    var image = "data:image/png;base64," + leds.pngData.toString('base64');
    res.send(image);
  });
}

app.use(express.static(path.join(__dirname, 'public')));

http.listen(80, function(){
  console.log('listening on *:80');
});



//// Start the websockets connection to the fadecandy server ////
var fcSocket;
if (fadeCandyServer) {
  fcSocket = new WebSocket(fadeCandyServer);
  fcSocket.on('close', function(event) {
    console.log('Unable to connect to fcserver');
  });

  fcSocket.on('open', function(msg) {
    console.log('Connected to fcserver');
  });
} else {
  fcSocket = null;
}



//// Handle the websockets connection to the client ////
io.sockets.on('connection', function (socket) {
  // get the allowed programs
  socket.on('get drawers', function (data, fn) {
    console.log('get drawers: ' + JSON.stringify(data));
    fn({active: animator.drawer.name, all: Object.keys(drawers)});
  });

  // set the running program, return it's settings
  // plus the palette
  socket.on('set drawer', function (drawerName, fn) {
    console.log('set drawer: ' + drawerName);
    animator.drawer = drawers[drawerName];
    var settings = animator.getSettings();
    fn({drawer: drawerName, ranges: settings.ranges, values: settings.values});
  });

  // update the settings on the server
  socket.on('set settings', function (settingVals, fn) {
    console.log('set settings: ' + JSON.stringify(settingVals));
    animator.setSettings(settingVals);
    //fn();
  });

  // randomize the settings on the server
  socket.on('randomize settings', function (data, fn) {
    console.log('randomize settings: ' + data);
    animator.randomizeSettings();
    fn(animator.getSettings().values);
  });
});



