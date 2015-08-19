function VideoDrawer(width, height, numColors, cam) {
    this.name = "Video";
    this.cam = cam;
    this.colorIndex = 0;
    this.values = {};
    this.ranges = {};  
}

VideoDrawer.prototype.draw = function(leds, palette) {
    var instance = this;
    instance.palette = palette;
    if (this.cam.getImage() != null) {
        this.cam.getLock().readLock(function (release) {
            var img = instance.cam.getImage().clone();
            img.resize(leds.width, leds.height);

            for (var x=0; x<leds.width; x++) {
                for (var y=0; y<leds.height; y++) {
                    var rgb = img.pixel(y,x);
                    var index = Math.floor((rgb[0] + rgb[1] + rgb[2]) * instance.palette.numColors / (256*3));
                    leds.rgbs48[x][y] = instance.palette.rgbs48[index % instance.palette.numColors];
                }
              }

            release();
        });
    }
  // });
}

VideoDrawer.prototype.reset = function() {
}

VideoDrawer.prototype.type = function() {
    return "2D";
}

module.exports.VideoDrawer = VideoDrawer;


