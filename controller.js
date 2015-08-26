var extend = require('extend');
var facedetector = require('./facedetector.js');

var FACEDETECTION_FPS = 10
var FACEDETECTION_HISTORY_SIZE = 3;
var FACEDETECTION_SIGNAL_THRESHOLD = 1;
var AUDIO_LEVEL_HISTORY = 30;

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function Controller(leds, paletteMgr, drawers, startDrawerName, drawerChangeInterval, cam, enableAudio) {
  this.leds = leds;
  this.paletteMgr = paletteMgr;
  this.drawers = drawers;
  this.currDrawer = drawers[startDrawerName];
  this.drawerChange = {interval: drawerChangeInterval, lastChange: Date.now()};
  this.cam = cam;

  if (enableAudio) {
    var coreAudio = require("node-core-audio");
    audioEngine = coreAudio.createNewAudioEngine();
    audioEngine.setOptions({sampleRate: 11025, framesPerBuffer: 512, inputChannels: 1, outputChannels: 1})

    var instance = this;
    audioEngine.addAudioCallback( function(buffer) { return instance.processAudio(buffer); });
    this.audioLevel = 0;
  }

  console.log('starting drawer ' + startDrawerName);

  if (cam) {
    this.facedetector = new facedetector.FaceDetector(cam, FACEDETECTION_HISTORY_SIZE);
    this.facedetector.start(FACEDETECTION_FPS);
  }
}

Controller.prototype.processAudio = function(buffer) {
  var ss = 0;
  for (var i = 0; i < buffer[0].length; i++)
    ss += buffer[0][i] * buffer[0][i];
  //console.log("processAudio: " + ss.toFixed(7));
  // running moving average
  this.audioLevel = ((AUDIO_LEVEL_HISTORY-1) * this.audioLevel + ss) / AUDIO_LEVEL_HISTORY;
  this.currDrawer.setAudioLevel(this.audioLevel);
  return buffer;
}

Controller.prototype.loop = function() {
  if (Date.now() - this.drawerChange.lastChange > this.drawerChange.interval &&
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
    this.drawerChange.lastChange = Date.now();
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
  if (this.facedetector)
    return this.facedetector.foundFaces(present, FACEDETECTION_SIGNAL_THRESHOLD);
  else
    return false;
}

Controller.prototype.changeDrawer = function(drawer) {
  console.log("changing to drawer: " + drawer.name);
  this.currDrawer = drawer;
  this.randomizeSettings();
  this.currDrawer.reset()

  this.drawerChange.lastChange = Date.now();
}

module.exports.Controller = Controller;


