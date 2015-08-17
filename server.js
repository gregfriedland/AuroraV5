//// Node.js server ////

// var agent = require('webkit-devtools-agent');
// agent.start()
// require('look').start();

var controller = require('./controller.js');
var drawers1D = require('./drawers1D.js');
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
var WIDTH = 64;
var HEIGHT = 32;
var DEPTH = 48; // bit depth: 24 or 48
// *** End settings match ***

var NUM_COLORS = 1<<12; // colors in the gradient of each palette
var FPS = 30;
var START_DRAWER = 'Bzr';
var DRAWER_CHANGE_INTERVAL = 5000;
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
if (HEIGHT == 1) {
  drawers = {Gradient: new drawers1D.GradientDrawer(),
             Wipe: new drawers1D.WipeDrawer(),
             Wave: new drawers1D.WaveDrawer(),
             Sparkle: new drawers1D.SparkleDrawer(),
             Pulse: new drawers1D.PulseDrawer()};
} else {
  drawers = {AlienBlob: new alienblob.AlienBlobDrawer(WIDTH, HEIGHT, NUM_COLORS),
             Bzr: new bzr.BzrDrawer(WIDTH, HEIGHT, NUM_COLORS),
             Gradient: new gradient.GradientDrawer(WIDTH, HEIGHT, NUM_COLORS),
             Off: new off.OffDrawer(WIDTH, HEIGHT, NUM_COLORS)};
}


//// Start the patterns ////
var paletteMgr = new palette.PaletteManager(allBaseColors, NUM_COLORS);
var leds = new leds.LEDs(WIDTH, HEIGHT, DEPTH, device, layoutLeftToRight);
var control = new controller.Controller(leds, paletteMgr, drawers, START_DRAWER, DRAWER_CHANGE_INTERVAL);

function loop() {  
  setTimeout(function() { loop(); }, 1000 / FPS);
  control.loop();
}
loop();

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
    var settings = control.getSettings();
    fn({active: {name: control.currDrawer.name, ranges: settings.ranges, values: settings.values},
        allNames: Object.keys(drawers)});
  });

  // set the running program, return it's settings
  // plus the palette
  socket.on('set drawer', function (drawerName, fn) {
    console.log('set drawer: ' + drawerName);
    control.currDrawer = drawers[drawerName];
    control.currDrawer.reset()
    var settings = control.getSettings();
    fn({drawer: drawerName, ranges: settings.ranges, values: settings.values});
  });

  // update the settings on the server
  socket.on('set settings', function (settingVals, fn) {
    console.log('set settings: ' + JSON.stringify(settingVals));
    control.setSettings(settingVals);
    //fn();
  });

  // randomize the settings on the server
  socket.on('randomize settings', function (data, fn) {
    console.log('randomize settings: ' + data);
    control.randomizeSettings();
    control.currDrawer.reset()
    fn(control.getSettings().values);
  });
});



