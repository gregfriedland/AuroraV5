var cv = require('opencv');

function FaceDetector(camSize, camFps, historySize) {
	this.camSize = camSize;
	this.camInterval = 1000 / camFps;
	this.running = true;

	this.history = {data: new Array(historySize), index: 0};
}

FaceDetector.prototype.start = function() {
	this.camera = new cv.VideoCapture(0);
	this.camera.setWidth(this.camSize[0]);
	this.camera.setHeight(this.camSize[1]);

	// run opencv and store the faces in this.faces
	var facedetector = this;
	var loopFunc = function() {
		if (!facedetector.running)
			return;
		setTimeout(loopFunc, facedetector.camInterval);

	    facedetector.camera.read(function(err, im) {
	        if (err) throw err;

	        im.detectObject('./node_modules/opencv/data/haarcascade_frontalface_alt2.xml', {}, function(err, faces) {
	        	if (err) throw err;
	        	facedetector.lastFaces = faces;
	        	// if (faces.length > 0)
	        	// 	console.log("  detected " + faces.length + " faces");

	        	facedetector.history.data[facedetector.history.index] = faces.length > 0;
	        	facedetector.history.index = (facedetector.history.index+1) % facedetector.history.data.length;
	        });
	    });

	};
	loopFunc();
	console.log("starting face detection");
}

FaceDetector.prototype.stop = function() {
	this.running = false;
	console.log("stopping face detection");
}

// are we currently looking at a face?
// signalThreshold is the percent of our stored history that matches a face
FaceDetector.prototype.foundFaces = function(present, signalThreshold) {
	var foundCount = this.history.data.filter(function(b) 
		{ if ((b == true && present) || (b == false && !present)) return 1; }).length;
	// console.log(present + " " + foundCount);
	return (foundCount / this.history.data.length >= signalThreshold);
}

module.exports.FaceDetector = FaceDetector;
