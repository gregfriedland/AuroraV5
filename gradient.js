function GradientDrawer(width, height, numColors) {
  this.name = "Gradient";
  this.colorIndex = 0;
  this.values = {speed: 50, colorSpeed: 10, shrinking: 1};
  this.ranges = {speed: [0,100], colorSpeed: [0,100], shrinking: [0,1]};
  this.speedMultiplier = 100;
  this.colorSpeedMultiplier = 5;
  this.pos = 0;
}

GradientDrawer.prototype.draw = function(leds, palette) {
  for (var x=0; x<leds.width; x++) {
    for (var y=0; y<leds.height; y++) {
      var index;
      if (this.values.shrinking)
      	index = Math.floor(x * this.colorIndex + this.pos) % palette.numColors;
      else
   	    index = Math.floor(x * this.values.colorSpeed + this.pos) % palette.numColors;      
      leds.setRgb48(x, y, palette.getRgb48(index % palette.numColors))
    }
  }
  this.pos += this.speedMultiplier * this.values.speed / 100.0;
  this.colorIndex += this.values.colorSpeed / 100.0 * this.colorSpeedMultiplier;
}

GradientDrawer.prototype.getDelay = function() {
  return 100;
}

GradientDrawer.prototype.reset = function() {
}


module.exports.GradientDrawer = GradientDrawer;


