var extend = require('extend');


function mod(m, n) {
  return ((m % n) + n) % n;
}

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}




function Animator(leds, paletteMgr, drawer) {
  this.leds = leds;
  this.paletteMgr = paletteMgr;
  this.drawer = drawer;
}

Animator.prototype.run = function() {
  this.drawer.draw(this.leds, this.paletteMgr.getCurrent());
  this.leds.update()
  
  var anim = this;
  setTimeout(function() { anim.run(); }, this.drawer.getDelay());
}

Animator.prototype.getSettings = function() {
  var ranges = extend({}, this.drawer.ranges,
                      {palette: [1,this.paletteMgr.palettes.length]});
  var values = extend({}, this.drawer.values,
                      {palette: this.paletteMgr.currPalette});
  return {ranges: ranges, values: values};
}

Animator.prototype.setSettings = function(settingVals) {
  for (setting in this.drawer.values) {
    this.drawer.values[setting] = settingVals[setting];
  }
  this.paletteMgr.setCurrentIndex(settingVals.palette);
}

Animator.prototype.randomizeSettings = function() {
  var d = this.drawer
  var pm = this.paletteMgr;

  for (setting in d.values) {
    d.values[setting] = randomInt(d.ranges[setting][0], d.ranges[setting][1]+1);
  }
  pm.setCurrentIndex(randomInt(1,pm.palettes.length));
}



function GradientDrawer() {
  this.name = "Gradient";
  this.index = 0;
  this.values = {speed: 20};
  this.ranges = {speed: [0,100]};
}

GradientDrawer.prototype.draw = function(leds, palette) {
  for (var l=0; l<leds.length; l++) {
    var rgb = palette.rgbs[Math.floor(((this.index + l) % leds.length) * palette.numColors / leds.length)];
    leds.rgbs[l] = rgb;
  }
  
  this.index = mod(this.index + 1, leds.length);
}

GradientDrawer.prototype.getDelay = function() {
  return 1000/this.values.speed;
}



// wipe a color from one side to the next
// possible config: random order, forward/reverse, point/swipe, palette incr
//                  delay between leds and after all leds
function WipeDrawer() {
  this.name = "Wipe";
  this.index = 0;
  this.values = {speed: 20};
  this.ranges = {speed: [0,100]};
}

WipeDrawer.prototype.draw = function(leds, palette) {
  if (this.index == 0) {
    leds.clear();
  }

  var rgb = palette.rgbs[Math.floor(this.index * palette.numColors / leds.length)];
  leds.rgbs[this.indexd] = rgb;
  
  this.index = mod(this.index + 1, leds.length);
}

WipeDrawer.prototype.getDelay = function() {
  return 1000/this.values.speed;
}




function PulseDrawer() {
  this.name = "Pulse";
  this.colorIndex = 0;
  this.pulseIndex = 0;
  this.values = {pulseSpeed: 20, colorSpeed: 3};
  this.ranges = {pulseSpeed: [0,100], colorSpeed: [0,10]};
  this.maxPulseVal = 256;
  this.pulseTable = [255,248,242,236,229,223,217,211,205,200,194,188,183,177,172,167,162,157,152,147,142,137,132,128,123,119,114,110,106,102,98,94,90,86,82,79,75,72,68,65,62,59,55,52,50,47,44,41,39,36,34,32,29,27,25,23,21,19,18,16,14,13,11,10,9,8,6,5,4,4,3,2,2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,5,7,10,12,15,19,22,26,31,35,40,46,51,57,63,70,77,84,91,99,107,116,124,134,143,153,163,173,184,195,206,218,230,242];
}

PulseDrawer.prototype.draw = function(leds, palette) {
  var rgb = palette.rgbs[this.colorIndex];

  var pulseVal = this.pulseTable[this.pulseIndex]/this.maxPulseVal;
  var pulsedRgb = [Math.floor(rgb[0]*pulseVal),
                   Math.floor(rgb[1]*pulseVal),
                   Math.floor(rgb[2]*pulseVal)];
  
  for (var l=0; l<leds.length; l++) {
    leds.rgbs[l] = pulsedRgb;
  }
  
  this.pulseIndex = mod(this.pulseIndex+1, this.pulseTable.length);
  if (this.pulseIndex == 0) {
    this.colorIndex = mod(this.colorIndex+this.values.colorSpeed, palette.numColors);
  }
}

PulseDrawer.prototype.getDelay = function() {
  return 1000/this.values.pulseSpeed;
}



function WaveDrawer() {
  this.name = "Wave";
  this.index = 0;
  this.values = {waveSpeed: 20, colorSpeed: 3};
  this.ranges = {waveSpeed: [0,100], colorSpeed: [0,10]};
  this.maxWaveVal = 100;
  this.waveTable = [0,1,4,9,16,25,36,49,64,81,100,121,144,169,196,225,196,169,144,121,100,81,64,49,36,25,16,9,4,1,0,0];
}


WaveDrawer.prototype.draw = function(leds, palette) {
  for (var l=0; l<leds.length; l++) {
    var waveIndex = (this.index + l) % this.waveTable.length;
    var waveVal = this.waveTable[waveIndex]/this.maxWaveVal;

    var rgb = palette.rgbs[Math.floor(this.index * palette.numColors / leds.length)];
    var waveRgb = [Math.floor(rgb[0]*waveVal),
                   Math.floor(rgb[1]*waveVal),
                   Math.floor(rgb[2]*waveVal)];
    
    leds.rgbs[l] = waveRgb;
  }
  
  this.index = mod(this.index + this.values.colorSpeed, leds.length);
}

WaveDrawer.prototype.getDelay = function() {
  return 1000/this.values.waveSpeed;
}



function drawSparkle(leds, palette, state, config) {
}


module.exports.Animator = Animator;
module.exports.GradientDrawer = GradientDrawer;
module.exports.WipeDrawer = WipeDrawer;
module.exports.WaveDrawer = WaveDrawer;
module.exports.PulseDrawer = PulseDrawer;

