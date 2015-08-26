var cv = require('opencv');
var ReadWriteLock = require('rwlock');

// Camera class that allows multiple sources to access the last acquired
// image.
function Camera(size, fps) {
	this.cam = new cv.VideoCapture(0);
	this.cam.setWidth(size[0]);
	this.cam.setHeight(size[1]);
	this.image = null;
    // this.lock = new ReadWriteLock();
}

Camera.prototype.start = function(fps) {
	console.log("starting camera");
    fpsInfo = {count: 0, lastTime: Date.now(), outputInterval: 5000};

	var instance = this;
	this.intervalId = setInterval(function() {
        var startTime = Date.now();
        // instance.lock.writeLock(function (release) {
            instance.cam.read(function(err, im) {
                // release();
                //console.log("camera: acquired");

                instance.image = im.clone();

                // keep track of effective camera fps
                var currTime = Date.now();
                if (currTime - fpsInfo.lastTime > fpsInfo.outputInterval) {
		            console.log("camera: " + (1000 * fpsInfo.count/(currTime - fpsInfo.lastTime)).toFixed(1));
		            fpsInfo.count = 0;
                    fpsInfo.lastTime = currTime;
                }
                fpsInfo.count++;
            });
        // });
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
