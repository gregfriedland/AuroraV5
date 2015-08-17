var extend = require('extend');

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function Controller(leds, paletteMgr, drawers, startDrawerName, drawerChangeInterval) {
  this.leds = leds;
  this.paletteMgr = paletteMgr;
  this.drawers = drawers;
  this.currDrawer = drawers[startDrawerName];
  this.drawerChange = {interval: drawerChangeInterval, lastChange: new Date().getTime()};
  console.log('starting drawer ' + startDrawerName);
}

Controller.prototype.loop = function() {
  if (new Date().getTime() - this.drawerChange.lastChange > this.drawerChange.interval &&
    this.currDrawer.name != "Off") {
    // change the drawer every so often to keep things interesting
    var drawerNames = Object.keys(this.drawers).filter(
      function(name) { return name != "Off"; });
    var randDrawerName = drawerNames[randomInt(0, drawerNames.length)];
    this.currDrawer = this.drawers[randDrawerName];
    this.randomizeSettings();
    this.drawerChange.lastChange = new Date().getTime();
    console.log('changing drawer randomly to ' + this.currDrawer.name);
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

Controller.prototype.foundHumanFace = function() {
  return true;
}

Controller.prototype.changeDrawer = function(drawer) {
  this.currDrawer = drawer;
  this.currDrawer.reset()
  this.drawerChange.lastChange = new Date().getTime();
}

module.exports.Controller = Controller;


