var cv = require('opencv');

// Camera class that allows multiple sources to access the last acquired
// image.
function Camera(size, fps) {
    this.height = size[1];
    this.width = size[0];
    console.log("camera: creating");
	this.cam = new cv.VideoCapture(0);
    console.log("camera: setting width");
	this.cam.setWidth(size[0]);
    console.log("camera: setting height");
	this.cam.setHeight(size[1]);
	this.image = null;
}

Camera.prototype.start = function(fps) {
    console.log("starting camera");
    var fpsInfo = {count: 0, lastTime: Date.now(), outputInterval: 5000};
    var instance = this;

    var funcInner = function(err, im) {
        instance.image = im;

        // keep track of effective camera fps
        var currTime = Date.now();
        if (currTime - fpsInfo.lastTime > fpsInfo.outputInterval) {
            console.log("camera: " + (1000 * fpsInfo.count/(currTime - fpsInfo.lastTime)).toFixed(1));
            fpsInfo.count = 0;
            fpsInfo.lastTime = currTime;
        }
        fpsInfo.count++;
    };

    var funcOuter = function() { instance.cam.read(funcInner); }
    this.intervalId = setInterval(funcOuter, 1000 / fps);
}

Camera.prototype.stop = function(fps) {
    clearInterval(this.intervalId);
    console.log("stopping camera");
}

Camera.prototype.getImage = function() {
    return this.image;
}


module.exports.Camera = Camera;
