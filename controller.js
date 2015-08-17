var extend = require('extend');

function Controller(leds, paletteMgr, drawers, startDrawerName) {
  this.leds = leds;
  this.paletteMgr = paletteMgr;
  this.currDrawers = drawers;
  this.currDrawer = drawers[startDrawerName];
  console.log('starting drawer ' + startDrawerName);
}

Controller.prototype.loop = function() {
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
}

Controller.prototype.foundHumanFace = function() {
  return true;
}


module.exports.Controller = Controller;


