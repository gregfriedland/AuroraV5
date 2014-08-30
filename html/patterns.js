function mod(m, n) {
  return ((m % n) + n) % n;
}

function Animator(numLeds, paletteMgr, delay, updateLEDsFunc,
                  drawFunc, updateIndexFunc) {
  this.leds = [];
  for (var i=0; i<numLeds; i++) {
    this.leds.push([0,0,0]);
  }
  
  this.updateLEDsFunc = updateLEDsFunc;
  this.paletteMgr = paletteMgr;
  this.delay = delay;
  this.drawFunc = drawFunc;
  this.updateIndexFunc = updateIndexFunc;
  this.index = 0;
}

Animator.prototype.run = function() {
  this.index = this.updateIndexFunc(this.index);
  this.drawFunc(this.leds, this.paletteMgr.getCurrent(), this.index);
  this.updateLEDsFunc(this.leds);
  
  var anim = this;
  setTimeout(function() { anim.run(); }, anim.delay);
}



function drawGradient(leds, palette, startIndex) {
  for (var l=0; l<leds.length; l++) {
    var rgb = palette.rgbs[Math.floor(((startIndex + l) % leds.length) * palette.numColors / leds.length)];
    leds[l] = rgb;
  }
}


// create a function that increments an index by a given amount each iteration
function makeIndexIncrementFunc(incr, wrap) {
  return function(index) {
    return mod(index + incr, wrap);
  }
}


  //state.delay = 1000/getWaitTime(config.wait, config.waitRange[0], config.waitRange[1]);


