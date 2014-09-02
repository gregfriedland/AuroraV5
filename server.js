//// Node.js server ////


//// Server config variables ////
var numColors = 1024;
var numLeds = 104;
//var leapUpdateInterval = 100;


//// Global variables ////
var currProgram = null;
var settings = {Gradient: {values: {speed:10,      colorCycling:20},
                           ranges: {speed:[0,100], colorCycling:[0,100]}}};
var animator;


var patterns = require('./patterns.js');
var leds = require('./leds.js');
var palette = require('./palette.js');
var allBaseColors = require('./kuler.js').allBaseColors;

var express = require('express');
var app = express();
var http = require('http').Server(app);
var socketIO = require('socket.io');
var io = socketIO(http);
var path = require('path');
var WebSocket = require('ws');


//// Start the http server ///
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static('public'));

http.listen(8080, function(){
  console.log('listening on *:8080');
});



//// Start the websockets connection to the fadecandy server ////
var fcSocket = new WebSocket('ws://localhost:7890');
fcSocket.onclose = function(event) {
  console.log('Unable to connect to fcserver');
}
fcSocket.onopen = function(event) {
  console.log('Connected to fcserver');
  
  paletteMgr = new palette.PaletteManager(allBaseColors, numColors);

  // gradient transition
  animator = new patterns.Animator(numLeds, paletteMgr,
                      function(ledData) { leds.update(fcSocket, ledData); },
                      "Gradient",
                      {index: 0}, {delay: 20, incr: 1});

//    anim = new Animator(numLeds, paletteMgr,
//                        function(leds) { updateLEDs(socket, leds); },
//                        drawWipe,
//                        {index: 0}, {delay: 20, incr: 1});

//    anim = new Animator(numLeds, paletteMgr,
//                        function(leds) { updateLEDs(socket, leds); },
//                        drawPulse,
//                        {colorIndex: 0, pulseIndex: 0},
//                        {delay: 20, colorIncr: 5});

    animator.run();
}



//// Handle the websockets connection to the client ////
io.sockets.on('connection', function (socket) {
  // get the allowed programs
  socket.on('get programs', function (data, fn) {
    console.log('get programs: ' + JSON.stringify(data));
    fn(Object.keys(settings));
  });

  // set the running program, return it's settings
  socket.on('set program', function (program, fn) {
    console.log('set program: ' + program);
    currProgram = program;
    fn(settings[program]);
  });

  // update the settings on the server
  socket.on('set settings', function (settingVals, fn) {
    console.log('set settings: ' + JSON.stringify(settingVals));
    settings[currProgram].values = settingVals;
    //fn();
  });

  // randomize the settings on the server
  socket.on('randomize settings', function (data, fn) {
    console.log('randomize settings: ' + data);
    //randomizeSettings();
    fn(settings[currProgram].values);
  });
});
