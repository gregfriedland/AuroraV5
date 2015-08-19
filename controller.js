var extend = require('extend');
var facedetector = require('./facedetector.js');
var coreAudio = require("node-core-audio");

var FACEDETECTION_FPS = 10
var FACEDETECTION_HISTORY_SIZE = 3 * FACEDETECTION_FPS;
var FACEDETECTION_SIGNAL_THRESHOLD = 0.75;
var AUDIO_SENSITIVITY = 2;

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function Controller(leds, paletteMgr, drawers, startDrawerName, drawerChangeInterval, cam) {
  this.leds = leds;
  this.paletteMgr = paletteMgr;
  this.drawers = drawers;
  this.currDrawer = drawers[startDrawerName];
  this.drawerChange = {interval: drawerChangeInterval, lastChange: new Date().getTime()};
  this.cam = cam;
  audioEngine = coreAudio.createNewAudioEngine();
  audioEngine.setOptions({sampleRate: 44100, framesPerBuffer: 512, inputChannels: 1, outputChannels: 1})

  var instance = this;
  audioEngine.addAudioCallback( function(buffer) { return instance.processAudio(buffer); });

  console.log('starting drawer ' + startDrawerName);

  this.facedetector = new facedetector.FaceDetector(cam, 
    FACEDETECTION_HISTORY_SIZE);
  this.facedetector.start(FACEDETECTION_FPS);
}

Controller.prototype.processAudio = function(buffer) {
  var ss = buffer[0].map(function (n) { return Math.pow(n,2); }).reduce(function (sum,n) { return sum+n; });
  //console.log("processAudio: " + ss);
  this.currDrawer.colorShift = ss * AUDIO_SENSITIVITY;
  return buffer;
}

Controller.prototype.loop = function() {
  if (new Date().getTime() - this.drawerChange.lastChange > this.drawerChange.interval &&
    this.currDrawer.name != "Off") {
    // change the drawer every so often to keep things interesting except if we're on
    // the 'video' drawer in which case only change the settings
    if (this.currDrawer.name != "Video") {
      var drawerNames = Object.keys(this.drawers).filter(
        function(name) { return name != "Off" && name != "Video"; });
      var randDrawerName = drawerNames[randomInt(0, drawerNames.length)];
      this.currDrawer = this.drawers[randDrawerName];
      console.log('changing drawer randomly to ' + this.currDrawer.name);
    } else
      console.log('randomizing drawer settings');

    this.randomizeSettings();
    this.drawerChange.lastChange = new Date().getTime();
  } else if (this.currDrawer.name != "Video" && this.foundFaces(true)) {
    console.log('found some faces nearby');
    this.changeDrawer(this.drawers["Video"]);
  } else if (this.currDrawer.name == "Video" && this.foundFaces(false)) {
    console.log('no longer found any faces nearby');
    this.changeDrawer(this.drawers["AlienBlob"]);
  }

  this.currDrawer.draw(this.leds, this.paletteMgr.getCurrent());
  this.leds.update()  
}

Controller.prototype.getSettings = function() {
  var ranges = extend({}, this.currDrawer.ranges,
                      {palette: [1,this.paletteMgr.palettes.length]});
  var values = extend({}, this.currDrawer.values,
                      {palette: this.paletteMgr.currPalette});
  return {ranges: ranges, values: values};
}

Controller.prototype.setSettings = function(settingVals) {
  for (setting in this.currDrawer.values) {
    this.currDrawer.values[setting] = parseInt(settingVals[setting]);
  }
  this.paletteMgr.setCurrentIndex(parseInt(settingVals.palette));
}

Controller.prototype.randomizeSettings = function() {
  var d = this.currDrawer
  var pm = this.paletteMgr;

  for (setting in d.values) {
    d.values[setting] = randomInt(d.ranges[setting][0], d.ranges[setting][1]+1);
  }
  pm.setCurrentIndex(randomInt(1,pm.palettes.length));
  d.reset();
}

Controller.prototype.foundFaces = function(present) {
  return this.facedetector.foundFaces(present, FACEDETECTION_SIGNAL_THRESHOLD);
}

Controller.prototype.changeDrawer = function(drawer) {
  console.log("changing to drawer: " + drawer.name);
  this.currDrawer = drawer;
  this.currDrawer.reset()
  this.drawerChange.lastChange = new Date().getTime();
}

module.exports.Controller = Controller;


