var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static('public'));

var currProgram = null;
var settings = {Gradient: {values: {speed:10,      colorCycling:20},
                           ranges: {speed:[0,100], colorCycling:[0,100]}}};

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

http.listen(8080, function(){
  console.log('listening on *:8080');
});
