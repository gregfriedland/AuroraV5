var path = require('path');

function FaceDetector(cam, historySize) {
    this.cam = cam;
    this.history = {data: new Array(historySize), index: 0};
}

FaceDetector.prototype.start = function(fps) {
    // run opencv face detection and store the faces in this.faces
    var cascadeFn = path.resolve(__dirname, 'node_modules/opencv/data/haarcascade_frontalface_alt.xml');
    var instance = this;

    var innerFunc = function(err, faces) {
        //console.log("  face detection running");
        if (err) throw err;
        instance.history.data[instance.history.index] = faces.length > 0;
        instance.history.index = (instance.history.index+1) % instance.history.data.length;
        instance.lastFaces = faces;
        // if (faces.length > 0)
        //    console.log("    detected " + faces.length + " faces");
    };

    var outerFunc = function() {
        if (instance.cam.getCvImage() == null) return;
        instance.cam.getCvImage().detectObject(cascadeFn, {}, innerFunc);
    };
    this.intervalId = setInterval(func, 1000 / fps);

    console.log("starting face detection");
}

FaceDetector.prototype.stop = function() {
    clearInterval(this.intervalId);
    console.log("stopping face detection");
}

// are we currently looking at a face?
// signalThreshold is the percent of our stored history that matches a face
FaceDetector.prototype.foundFaces = function(present, signalThreshold) {
    var foundCount = 0;
    for (var i = 0; i < this.history.data.length; i++) {
        var b = this.history.data[i];
        foundCount += ((b == true && present) || (b == false && !present));
    }
    // console.log(present + " " + foundCount);
    return (foundCount / this.history.data.length >= signalThreshold);
}

module.exports.FaceDetector = FaceDetector;
