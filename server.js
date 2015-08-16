//// Node.js server ////

// var agent = require('webkit-devtools-agent');
// agent.start()
//require('look').start();

var patterns = require('./patterns.js');
var alienblob = require('./alienblob.js');
var bzr = require('./bzr.js');
var off = require('./off.js');
var gradient = require('./gradient.js');
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


//// Server config variables ////

// *** These must match settings on the Teensy ***
var width = 64;
var height = 32;
var depth = 48; // bit depth: 24 or 48
// *** End settings match ***

var numColors = 1024; // colors in the gradient of each palette
var fps = 30;
var startDrawer = 'AlienBlob';
var layoutLeftToRight = false; // only used for serial port connections

//// End Server config variables ///


//// Global variables ////
var device;
if (process.argv.length > 2) {
  device = process.argv[2];
} else {
  device = "/dev/ttyACM0"; // for direct serial access to Teensy
  // device = "ws://localhost:7890"; // for fadecandy
}

var drawers;
if (height == 1) {
  drawers = {Gradient: new patterns.GradientDrawer(),
             Wipe: new patterns.WipeDrawer(),
             Wave: new patterns.WaveDrawer(),
             Sparkle: new patterns.SparkleDrawer(),
             Pulse: new patterns.PulseDrawer()};
} else {
  drawers = {AlienBlob: new alienblob.AlienBlobDrawer(width, height, numColors),
             Bzr: new bzr.BzrDrawer(width, height, numColors),
             Gradient: new gradient.GradientDrawer(width, height, numColors),
             Off: new off.OffDrawer(width, height, numColors)};
}


//// Start the patterns ////
var paletteMgr = new palette.PaletteManager(allBaseColors, numColors);
var leds = new leds.LEDs(width, height, depth, device, layoutLeftToRight);
var animator = new patterns.Animator(leds, paletteMgr, drawers[startDrawer], fps);
console.log('starting drawer ' + startDrawer);
animator.run();



//// Start the http server ///
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/image', function(req, res) {
  var image = "data:image/png;base64," + leds.pngData.toString('base64');
  //leds.pngData = '';
  res.send(image);
});

app.use(express.static(path.join(__dirname, 'public')));

http.listen(8080, function(){
  console.log('listening on *:8080');
});



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
    animator.drawer.reset()
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
    animator.drawer.reset()
    fn(animator.getSettings().values);
  });
});



