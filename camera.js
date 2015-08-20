var cv = require('opencv');

// Camera class that allows multiple sources to access the last acquired
// image.
function Camera(size) {
	this.cam = new cv.VideoCapture(0);
	this.cam.setWidth(size[0]);
	this.cam.setHeight(size[1]);
	this.image = null;
}

Camera.prototype.start = function(fps) {
	console.log("starting camera");
    fpsInfo = {count: 0, lastTime: new Date().getTime(), outputInterval: 5000};

	var instance = this;
	this.intervalId = setInterval(function() {
		var im = instance.cam.ReadSync();
        instance.image = im.clone();

        // keep track of effective camera fps
        var currTime = new Date().getTime();
        if (currTime - fpsInfo.lastTime > fpsInfo.outputInterval) {
            console.log("camera: " + (1000 * fpsInfo.count/(currTime - fpsInfo.lastTime)).toFixed(1));
            fpsInfo = {count: 0, lastTime: currTime, outputInterval: fpsInfo.outputInterval};
        }
        fpsInfo.count++;
	}, 1000 / fps);
}

Camera.prototype.stop = function(fps) {
	clearInterval(this.intervalId);
	console.log("stopping camera");
}

Camera.prototype.getImage = function() {
	return this.image;
}

Camera.prototype.getLock = function() {
	return this.lock;
}

module.exports.Camera = Camera;
