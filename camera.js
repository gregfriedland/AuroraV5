var cv = require('opencv');
var raspicam2 = require('raspicam2').raspicam2;
var sys = require('sys')
var exec = require('child_process').exec;
var FpsCounter = require('./fpscounter.js').FpsCounter;
var path = require('path');

// Camera class that allows multiple sources to access the last acquired
// image.
function Camera(size, fps) {
    this.width = size[0];
    this.height = size[1];
    this.fpsCounter = FpsCounter("camera");
    this.cvImage = null;

    var instance = this;
    var child = exec("uname -m", function (error, stdout, stderr) {
	if (error !== null)
	    console.log('exec error: ' + error);
	instance.isRaspi = stdout.trim() == "armv7l";
	
	if (instance.isRaspi) {
	    console.log("camera: creating RaspiCam");
	    raspicam2.open();
	    raspicam2.setSize(instance.width, instance.height);

	    var dummyImageFn = path.resolve(__dirname, 'dummy.png');
	    cv.readImage(dummyImageFn, function(err, cvImg) {
		instance.cvImage = cvImg;
		instance.data = new Buffer(this.width * this.height * 3);
	    });
	} else {
	    console.log("camera: creating OpenCV cam");
	    instance.cvcam = new cv.VideoCapture(0);
	    instance.cvcam.setWidth(size[0]);
	    instance.cvcam.setHeight(size[1]);
	    instance.cvImage = cv.ReadSync();
	}
	startCam(fps);
    });
}

function startCam(instance, fps) {
    console.log("starting camera");

    var funcOuter;
    if (instance.isRaspi) {
	var funcInner = function() {
	    instance.cvImage.put(instance.data);
	    sys.exit();
	    instance.fpsCounter.tick(5000);
	};
	funcOuter = function() { 
	    if (!instance.inited) return;
	    raspicam2.readAsync(instance.data, funcInner); 
	}
    } else {
	var funcInner = function(err, im) {
	    if (err) throw err;
	    instance.cvImage = im;
	    instance.fpsCounter.tick(5000);
	};
	funcOuter = function() {
	    if (!instance.inited) return;
	    instance.cvcam.read(funcInner); 
	}
    }
    this.intervalId = setInterval(funcOuter, 1000 / fps);
}

Camera.prototype.stop = function(fps) {
    clearInterval(this.intervalId);
    raspicam2.release();
    console.log("stopping camera");
}

Camera.prototype.getCvImage = function() {
    return this.cvImage;
}


module.exports.Camera = Camera;
