var cv = require('opencv');
var SafeInterval = require('./safeinterval.js').SafeInterval;
var ReadWriteLock = require('rwlock');

// Camera class that allows multiple sources to access the last acquired
// image.
function Camera(size) {
	this.cam = new cv.VideoCapture(0);
	this.cam.setWidth(size[0]);
	this.cam.setHeight(size[1]);
	this.intervalId = null;
	this.image = null;
	this.lock = new ReadWriteLock();
}

Camera.prototype.start = function(fps) {
	console.log("starting camera");
	var instance = this;
	this.repeater = new SafeInterval(function() {
		instance.lock.writeLock(function (release) {
			instance.cam.read(function(err, im) {
			    if (err) throw err;

			    if (im.empty()) {
			      console.log("empty image");
			    } else {
			      //console.log("read image");
			      instance.image = im.clone();
			    }
			    release();
			});
		});
	}, 1000 / fps);
}

Camera.prototype.stop = function(fps) {
	this.repeater.clear();
	console.log("stopping camera");
}

Camera.prototype.getImage = function() {
	return this.image;
}

Camera.prototype.getLock = function() {
	return this.lock;
}

module.exports.Camera = Camera;
