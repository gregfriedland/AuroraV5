var cv = require('opencv');
var camera = new cv.VideoCapture(0);

var gcLastTime = new Date().getTime();
setInterval(function() {
    var currTime = new Date().getTime();
    if (currTime - gcLastTime > 3000) {
        global.gc();
        gcLastTime = new Date().getTime();
    }

    var im = camera.ReadSync()

    var im2 = im.clone();
    im2.detectObject('./node_modules/opencv/data/haarcascade_frontalface_alt.xml', {}, function(err, faces) {
        console.log(im2.size());
      if (err) throw err;

      });
}, 10);
