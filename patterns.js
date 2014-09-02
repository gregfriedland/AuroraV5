function mod(m, n) {
  return ((m % n) + n) % n;
}



function Animator(numLeds, paletteMgr, updateLEDsFunc,
                  pattern, state, config) {
  this.numLeds = numLeds;
  this.clear();
  
  this.updateLEDsFunc = updateLEDsFunc;
  this.paletteMgr = paletteMgr;
  this.pattern = pattern;
  this.state = state;
  this.config = config;
}

Animator.prototype.setAll = function(rgb) {
  this.leds = [];
  for (var i=0; i<this.numLeds; i++) {
    this.leds.push(rgb);
  }
}

Animator.prototype.clear = function() {
  this.setAll([0,0,0]);
}

Animator.prototype.run = function() {
  var drawFunc;
  if (this.pattern == "Gradient") {
    drawFunc = drawGradient;
  } else if (this.pattern == "Wave") {
    drawFunc = drawWave;
  } else if (this.pattern == "Pulse") {
    drawFunc = drawPulse;
  } else if (this.pattern == "Wipe") {
    drawFunc = drawWipe;
  } else {
    drawFunc = null;
  }

  if (drawFunc != null) {
    this.state = drawFunc(this.leds, this.paletteMgr.getCurrent(), this.state, this.config);
    this.updateLEDsFunc(this.leds);
  }
  
  var anim = this;
  setTimeout(function() { anim.run(); }, this.config.delay);
}



function drawGradient(leds, palette, state, config) {
  for (var l=0; l<leds.length; l++) {
    var rgb = palette.rgbs[Math.floor(((state.index + l) % leds.length) * palette.numColors / leds.length)];
    leds[l] = rgb;
  }
  
  state.index = mod(state.index + config.incr, leds.length);
  return state;
}



// wipe a color from one side to the next
// possible config: random order, forward/reverse, point/swipe, palette incr
//                  delay between leds and after all leds
function drawWipe(leds, palette, state, config) {
  if ((state.ledIndex == 0 && config.incr > 0) ||
      (state.ledIndex == leds.length-1 && config.incr < 0 )) {
    this.clear();
  }

  var rgb = palette.rgbs[Math.floor(state.ledIndex * palette.numColors / leds.length)];
  leds[l] = rgb;
  
  state.ledIndex = mod(state.ledIndex + config.incr, leds.length);
  return state;
}


var maxPulseVal = 256;
var pulseTable = [255,248,242,236,229,223,217,211,205,200,194,188,183,177,172,167,162,157,152,147,142,137,132,128,123,119,114,110,106,102,98,94,90,86,82,79,75,72,68,65,62,59,55,52,50,47,44,41,39,36,34,32,29,27,25,23,21,19,18,16,14,13,11,10,9,8,6,5,4,4,3,2,2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3,5,7,10,12,15,19,22,26,31,35,40,46,51,57,63,70,77,84,91,99,107,116,124,134,143,153,163,173,184,195,206,218,230,242];

function drawPulse(leds, palette, state, config) {
  var rgb = palette.rgbs[state.colorIndex];

  var pulseVal = pulseTable[state.pulseIndex]/maxPulseVal;
  var pulsedRgb = [Math.floor(rgb[0]*pulseVal),
                   Math.floor(rgb[1]*pulseVal),
                   Math.floor(rgb[2]*pulseVal)];
  
  for (var l=0; l<leds.length; l++) {
    leds[l] = pulsedRgb;
  }
  
  state.pulseIndex = mod(state.pulseIndex+1, pulseTable.length);
  if (state.pulseIndex == 0) {
    state.colorIndex = mod(state.colorIndex+config.colorIncr, palette.numColors);
  }
  return state;
}



var maxWaveVal = 100;
var waveTable = [0,1,4,9,16,25,36,49,64,81,100,121,144,169,196,225,196,169,144,121,100,81,64,49,36,25,16,9,4,1,0,0];

function drawWave(leds, palette, state, config) {
  for (var l=0; l<leds.length; l++) {
    var waveIndex = (state.startIndex + l) % waveTable.length;
    var waveVal = waveTable[waveIndex]/maxWaveVal;

    var rgb = palette.rgbs[Math.floor(state.startIndex * palette.numColors / leds.length)];
    var waveRgb = [Math.floor(rgb[0]*waveVal),
                   Math.floor(rgb[1]*waveVal),
                   Math.floor(rgb[2]*waveVal)];
    
    leds[l] = waveRgb;
  }
  
  state.startIndex = mod(state.startIndex + 1, leds.length);
  return state;

}



function drawSparkle(leds, palette, state, config) {
}


module.exports.Animator = Animator;

