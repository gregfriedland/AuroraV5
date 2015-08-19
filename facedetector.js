var SafeInterval = require('./safeinterval.js').SafeInterval;

function FaceDetector(cam, historySize) {
	this.cam = cam;
	this.history = {data: new Array(historySize), index: 0};
}

FaceDetector.prototype.start = function(fps) {
	// run opencv and store the faces in this.faces
	var instance = this;
	this.repeater = new SafeInterval(function() {
	  if (instance.cam.getImage() != null) {
	  	instance.cam.getLock().readLock(function (release) {
		    instance.cam.getImage().detectObject('./node_modules/opencv/data/haarcascade_frontalface_alt.xml', {}, function(err, faces) {
		      if (err) throw err;
		      //console.log("  face detection");
	      	  instance.history.data[instance.history.index] = faces.length > 0;
	    	  instance.history.index = (instance.history.index+1) % instance.history.data.length;
	          instance.lastFaces = faces;
	          // if (faces.length > 0)
	          // 	  console.log("    detected " + faces.length + " faces");
	          release();
		    });
		});
	  }
	}, 1000 / fps);

	console.log("starting face detection");
}

FaceDetector.prototype.stop = function() {
	this.repeater.stop();
	console.log("stopping face detection");
}

// are we currently looking at a face?
// signalThreshold is the percent of our stored history that matches a face
FaceDetector.prototype.foundFaces = function(present, signalThreshold) {
	var foundCount = this.history.data.filter(function(b) 
		{ return ((b == true && present) || (b == false && !present)); }).length;
	// console.log(present + " " + foundCount);
	return (foundCount / this.history.data.length >= signalThreshold);
}

module.exports.FaceDetector = FaceDetector;
