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
    this.drawer.values[setting] = parseInt(settingVals[setting]);
  }
  this.paletteMgr.setCurrentIndex(parseInt(settingVals.palette));
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
  this.ledIndex = 0;
  this.colorIndex = 0;
  this.values = {wipeSpeed: 20, colorSpeed: 5};
  this.ranges = {wipeSpeed: [0,100], colorSpeed: [0, 20]};
}

WipeDrawer.prototype.draw = function(leds, palette) {
  if (this.ledIndex == 0) {
    leds.clear();
    this.colorIndex = mod(this.colorIndex + this.values.colorSpeed, leds.length);
  }

  var rgbIndex = Math.floor((this.ledIndex + this.colorIndex) * palette.numColors / leds.length)
  var rgb = palette.rgbs[mod(rgbIndex, palette.numColors)];
  leds.rgbs[this.ledIndex] = rgb;
  
  this.ledIndex = mod(this.ledIndex + 1, leds.length);
}

WipeDrawer.prototype.getDelay = function() {
  return 1000/this.values.wipeSpeed;
}



function PulseDrawer() {
  this.name = "Pulse";
  this.index = 0;
  this.values = {pulseSpeed: 20, colorSpeed: 3};
  this.ranges = {pulseSpeed: [0,100], colorSpeed: [0,10]};
  this.maxPulseVal = 256;
  this.pulseTable = [255,248,242,236,229,223,217,211,205,200,194,188,183,177,172,167,162,157,152,147,142,137,132,128,123,119,114,110,106,102,98,94,90,86,82,79,75,72,68,65,62,59,55,52,50,47,44,41,39,36,34,32,29,27,25,23,21,19,18,16,14,13,11,10,9,8,6,5,4,4,3,2,2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,5,7,10,12,15,19,22,26,31,35,40,46,51,57,63,70,77,84,91,99,107,116,124,134,143,153,163,173,184,195,206,218,230,242];
}

PulseDrawer.prototype.draw = function(leds, palette) {
  var pulseVal = this.pulseTable[this.index%this.pulseTable.length]/this.maxPulseVal;
  for (var l=0; l<leds.length; l++) {
    var rgbIndex = (this.index+l) * this.values.colorSpeed;
    
    var rgb = palette.rgbs[rgbIndex % palette.numColors];
    rgb = [Math.floor(rgb[0]*pulseVal),
           Math.floor(rgb[1]*pulseVal),
           Math.floor(rgb[2]*pulseVal)];
    
    leds.rgbs[l] = rgb;
  }
  
  this.index++;
}

PulseDrawer.prototype.getDelay = function() {
  return 1000/this.values.pulseSpeed;
}



function WaveDrawer() {
  this.name = "Wave";
  this.index = 0;
  this.values = {waveSpeed: 20, waveSize: 10, colorSpeed: 3};
  this.ranges = {waveSpeed: [0,100], waveSize: [2, 100], colorSpeed: [0, 10]};
}


WaveDrawer.prototype.draw = function(leds, palette) {
  for (var l=0; l<leds.length; l++) {
    var waveIndex = (this.index+l) % this.values.waveSize;
    var waveVal = Math.sin(waveIndex / this.values.waveSize * Math.PI);

    var rgbIndex = (this.index+l) * this.values.colorSpeed;
    var rgb = palette.rgbs[rgbIndex % palette.numColors];
    var waveRgb = [Math.floor(rgb[0]*waveVal),
                   Math.floor(rgb[1]*waveVal),
                   Math.floor(rgb[2]*waveVal)];
    
    leds.rgbs[l] = waveRgb;
  }
  
  this.index++;
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

