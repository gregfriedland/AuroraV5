function VideoDrawer(width, height, numColors, cam) {
    this.name = "Video";
    this.colorIndex = 0;
    this.cam = cam;
    this.audioLevel = 0;
    this.values = {colorSpeed: 0, audioSensitivity: 10, maxAudioShift: 10};
    this.ranges = {colorSpeed: [0,50], audioSensitivity: [0,100], maxAudioShift: [0,100]};
}

VideoDrawer.prototype.draw = function(leds, palette) {
    var instance = this;
    instance.palette = palette;

    if (this.cam.getImage() != null) {
        //console.log("video: resizing image")
        var img = instance.cam.getImage();

        var audioIndex = instance.audioLevel * palette.numColors * instance.values.audioSensitivity / 100;
        audioIndex = Math.min(audioIndex, instance.values.maxAudioShift * palette.numColors / 100);

        for (var x=0; x<leds.width; x++) {
	    var xx = Math.floor(x * this.cam.width / leds.width);
            for (var y=0; y<leds.height; y++) {
		var yy = Math.floor(y * this.cam.height / leds.height);
                var rgb = img.pixel(yy, xx);
				    
                var index = Math.floor(rgb[0] / 256 * instance.palette.numColors + audioIndex + instance.colorIndex);
                leds.rgbs48[x][y] = instance.palette.rgbs48[index % instance.palette.numColors];
            }
        }

	//img.release();
        instance.colorIndex += instance.values.colorSpeed;
    }
}

VideoDrawer.prototype.setAudioLevel = function(level) {
    this.audioLevel = level;
}

VideoDrawer.prototype.reset = function() {
}

VideoDrawer.prototype.type = function() {
    return "2D";
}

module.exports.VideoDrawer = VideoDrawer;


