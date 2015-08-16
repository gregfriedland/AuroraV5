function OffDrawer(width, height, numColors) {
  this.name = "Off";
}

OffDrawer.prototype.draw = function(leds, palette) {
  leds.setAllRgb48((0,0,0))
}

OffDrawer.prototype.getDelay = function() {
  return 100;
}

OffDrawer.prototype.reset = function() {
}


module.exports.OffDrawer = OffDrawer;


