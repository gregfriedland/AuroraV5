//// Node.js server ////

var patterns = require('./patterns.js');
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
var numLEDs = 104;
//var leapUpdateInterval = 100;


//// Global variables ////
var drawers = {Gradient: new patterns.GradientDrawer(),
               Wipe: new patterns.WipeDrawer(),
               Wave: new patterns.WaveDrawer(),
               Pulse: new patterns.PulseDrawer()};
var currDrawer = drawers['Gradient'];
var animator;


//// Start the http server ///
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/image', function(req, res) {
  fs.readFile('public/image.png', function(err, original_data){
    if (err) {
      console.log("Error loading image file: " + err);
      res.send("");
      return;
    } else if (original_data.length == 0) {
      console.log("Error loading image file: has no data");
      res.send("");
      return;
    }
    
    var base64Image = original_data.toString('base64');
    //console.log(base64Image);
    var image = "data:image/png;base64," + base64Image;
    res.send(image);
  });
});

app.use(express.static('public'));

http.listen(8080, function(){
  console.log('listening on *:8080');
});



//// Start the websockets connection to the fadecandy server ////
var fcSocket = new WebSocket('ws://localhost:7890');
fcSocket.on('close', function(event) {
  console.log('Unable to connect to fcserver');
});

fcSocket.on('open', function(msg) {
  console.log('Connected to fcserver');
  
  var paletteMgr = new palette.PaletteManager(allBaseColors, numColors);

  animator = new patterns.Animator(new leds.LEDs(numLEDs, fcSocket), paletteMgr, currDrawer);

  console.log('starting drawer ' + currDrawer.name);
  animator.run();
});



//// Handle the websockets connection to the client ////
io.sockets.on('connection', function (socket) {
  // get the allowed programs
  socket.on('get programs', function (data, fn) {
    console.log('get programs: ' + JSON.stringify(data));
    fn(Object.keys(drawers));
  });

  // set the running program, return it's settings
  socket.on('set program', function (program, fn) {
    console.log('set program: ' + program);
    currDrawer = drawers[program];
    fn({ranges: currDrawer.ranges, values: currDrawer.values});
  });

  // update the settings on the server
  socket.on('set settings', function (settingVals, fn) {
    console.log('set settings: ' + JSON.stringify(settingVals));
    currDrawer.values = settingVals;
    //fn();
  });

  // randomize the settings on the server
  socket.on('randomize settings', function (data, fn) {
    console.log('randomize settings: ' + data);
    //randomizeSettings();
    fn(currDrawer.values);
  });
});
