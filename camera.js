var cv = require('opencv');

// Camera class that allows multiple sources to access the last acquired
// image.
function Camera(size, fps) {
    this.cam = new cv.VideoCapture(0);
    this.cam.setWidth(size[0]);
    this.cam.setHeight(size[1]);
    this.image = null;
}

Camera.prototype.start = function(fps) {
    console.log("starting camera");
    var fpsInfo = {count: 0, lastTime: Date.now(), outputInterval: 5000};
    var instance = this;

    var funcInner = function(err, im) {
        instance.image = im.clone();

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

Camera.prototype.getLock = function() {
    return this.lock;
}

module.exports.Camera = Camera;
