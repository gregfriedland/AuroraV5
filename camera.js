var cv = require('opencv');
var raspicam2 = require('raspicam2').raspicam2;

// Camera class that allows multiple sources to access the last acquired
// image.
function Camera(size, fps) {
    this.height = size[1];
    this.width = size[0];
    // console.log("camera: creating");
    // 	this.cam = new cv.VideoCapture(0);
    // console.log("camera: setting width");
    // 	this.cam.setWidth(size[0]);
    // console.log("camera: setting height");
    // 	this.cam.setHeight(size[1]);

    raspicam2.open();
    //raspicam2.setSize(this.width, this.height);
    this.image = new Buffer(this.height * this.width * 3);
}

Camera.prototype.start = function(fps) {
    console.log("starting camera");
    var fpsInfo = {count: 0, lastTime: Date.now(), outputInterval: 5000};
    var instance = this;

    var funcInner = function(im) {
        //instance.image = im;

        // keep track of effective camera fps
        var currTime = Date.now();
        if (currTime - fpsInfo.lastTime > fpsInfo.outputInterval) {
            console.log("camera: " + (1000 * fpsInfo.count/(currTime - fpsInfo.lastTime)).toFixed(1));
            fpsInfo.count = 0;
            fpsInfo.lastTime = currTime;
        }
        fpsInfo.count++;
    };

    var funcAsync = function() { raspicam2.readAsync(instance.image, funcInner); }

    var funcSync = function() {
	raspicam2.read(instance.image);

        // keep track of effective camera fps
        var currTime = Date.now();
        if (currTime - fpsInfo.lastTime > fpsInfo.outputInterval) {
            console.log("camera: " + (1000 * fpsInfo.count/(currTime - fpsInfo.lastTime)).toFixed(1));
            fpsInfo.count = 0;
            fpsInfo.lastTime = currTime;
        }
        fpsInfo.count++;
    };

    this.intervalId = setInterval(funcAsync, 1000 / fps);
    //this.intervalId = setInterval(funcSync, 1000 / fps);
}

Camera.prototype.stop = function(fps) {
    clearInterval(this.intervalId);
    raspicam2.release();
    console.log("stopping camera");
}

Camera.prototype.getImage = function() {
    return this.image;
}


module.exports.Camera = Camera;
