var cv = require('opencv');
var width = 640, height = 480;

var camera = new cv.VideoCapture(0);
camera.setWidth(width);
camera.setHeight(height);
var camImg = camera.ReadSync();
console.log(camImg);
console.log(camImg.getData());
camImg.detectObject('./node_modules/opencv/data/haarcascade_frontalface_alt.xml', {}, function(err, faces) {
  console.log("cam img face detect");
});

cv.readImage("dummy.png", function(err, imgMat) {
  //var rawImg = new cv.Matrix(height, width,cv.Constants.CV_8UC1);
  //var rawBuf = Buffer(width * height);
  imgMat.resize(width, height);

  var buf = imgMat.getData();
  buf.fill(255);
  imgMat.put(buf);

  console.log(imgMat);
  console.log(imgMat.getData());

  imgMat.detectObject('./node_modules/opencv/data/haarcascade_frontalface_alt.xml', {}, function(err, faces) {
    console.log("raw img face detect");
  });
});
