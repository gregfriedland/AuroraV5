function VideoDrawer(width, height, numColors, cam) {
    this.name = "Video";
    this.colorIndex = 0;
    this.cam = cam;
    this.audioLevel = 0;
    this.values = {colorSpeed: 0, audioSensitivity: 10, maxAudioShift: 10};
    this.ranges = {colorSpeed: [0,100], audioSensitivity: [0,100], maxAudioShift: [0,100]};
}

VideoDrawer.prototype.draw = function(leds, palette) {
    var instance = this;
    instance.palette = palette;
    if (this.cam.getImage() != null) {
        this.cam.getLock().readLock(function (release) {
            var img = instance.cam.getImage().clone();
            img.resize(leds.width, leds.height);
            img.convertGrayscale();

            var audioIndex = instance.audioLevel * palette.numColors * instance.values.audioSensitivity / 100;
            audioIndex = Math.min(audioIndex, instance.values.maxAudioShift * palette.numColors / 100);

            for (var x=0; x<leds.width; x++) {
                for (var y=0; y<leds.height; y++) {
                    var rgb = img.pixel(y,x);
                    var index = Math.floor(rgb / 256 * instance.palette.numColors + audioIndex + instance.colorIndex);
                    leds.rgbs48[x][y] = instance.palette.rgbs48[index % instance.palette.numColors];
                }
            }

            instance.colorIndex += instance.values.colorSpeed;
            release();
        });
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


