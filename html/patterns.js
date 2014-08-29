function Animator(numLeds, paletteMgr, updateLEDsFunc) {
  this.leds = [];
  for (var i=0; i<numLeds; i++) {
    this.leds.push([0,0,0]);
  }
  
  this.updateLEDsFunc = updateLEDsFunc;
  this.paletteMgr = paletteMgr;
}

Animator.prototype.run = function(func, config, state) {
  var newState = func(this.leds, this.updateLEDsFunc, this.paletteMgr.getCurrent(), config, state);
  
  var anim = this;
  setTimeout(function() { anim.run(func, config, newState); },
             newState.delay);
}



function RotateGradient(leds, updateLEDsFunc, palette, config, state) {
  for (var l=0; l<leds.length; l++) {
    var rgb = palette.rgbs[Math.floor(((state.t + l) % leds.length) * palette.numColors / leds.length)];
    leds[l] = rgb;
  }

  updateLEDsFunc(leds);
  
  state.t = (state.t + 1) % leds.length;
  state.delay = 1000/getWaitTime(config.wait, config.waitRange[0], config.waitRange[1]);
  return state;
}


