function BzrDrawer(width, height, numColors) {
    this.name = "Bzr";
    this.colorIndex = 0;
    this.values = {speed: 50, colorSpeed: 0, zoom: 70,
                   audioSensitivity: 10, maxAudioShift: 10};
    this.ranges = {speed: [0,30], colorSpeed: [0,50], zoom: [0,100],
                   audioSensitivity: [0,100], maxAudioShift: [0,100]};
    this.speedMultiplier = 100;
    this.audioLevel = 0;
    
    this.bzr = new Bzr({width:width, height:height},
                       {width:width, height:height}, numColors);
}

BzrDrawer.prototype.draw = function(leds, palette) {
    var numStates = this.speedMultiplier - Math.floor(Math.pow(this.values.speed/100.0, 0.25) * (this.speedMultiplier-1));
 
    var zoom = this.values.zoom / 100.0 * 70 + 30; // compress to 30-100
    var indices = this.bzr.run(numStates, zoom/100.0);
    
    var audioIndex = this.audioLevel * palette.numColors * this.values.audioSensitivity / 100;
    audioIndex = Math.min(audioIndex, this.values.maxAudioShift * palette.numColors / 100);

    for (var x=0; x<leds.width; x++) {
        for (var y=0; y<leds.height; y++) {
            index = Math.floor(indices[x*leds.height + y] + this.colorIndex + audioIndex);
            if (isNaN(index)) // true due to interpolation from first position
                continue;
            //console.log(x + " " + y + " " + index + " " + numStates + " " + zoom + " " + this.colorIndex);
            leds.rgbs48[x][y] = palette.rgbs48[index % palette.numColors];
        }
    }
    
    this.pos += this.speedMultiplier * this.values.speed / 100.0;
    this.colorIndex += this.values.colorSpeed;
}

BzrDrawer.prototype.setAudioLevel = function(level) {
    this.audioLevel = level;
}

BzrDrawer.prototype.reset = function() {
    this.bzr.randomize(0, 0, this.bzr.bzrDims.width, this.bzr.bzrDims.height);
}

BzrDrawer.prototype.type = function() {
    return "2D";
}


function Bzr(ledDims, bzrDims, numColors) {
    this.ledDims = ledDims;
    this.bzrDims = bzrDims;
    this.numColors = numColors;
    this.indices = [];

    this.init();
}

Bzr.prototype.init = function() {
    this.p = 0;
    this.q = 1;
    this.state = 0;
    this.a = [];
    this.b = [];
    this.c = [];
    this.indices = [];
    this.randomize(0, 0, this.bzrDims.width, this.bzrDims.height);
}

Bzr.prototype.randomize = function(minx, miny, maxx, maxy) {
    for (var x=minx; x<=maxx; x++) {
        for (var y=miny; y<=maxy; y++) {
            var index = x + y*this.bzrDims.width +
                    this.p*this.bzrDims.width*this.bzrDims.height;
            this.a[index] = Math.random();
            this.b[index] = Math.random();
            this.c[index] = Math.random();
        }
    }
}

Bzr.prototype.run = function(numStates, zoom) {
    if (this.state > numStates)
        this.state = 1;

    var bwidth = this.bzrDims.width;
    var bheight = this.bzrDims.height;
    var lwidth = this.ledDims.width;
    var lheight = this.ledDims.height;

    if (this.state == 1) {
        for (var x=0; x<bwidth; x++) {
            for (var y=0; y<bheight; y++) {
                var c_a=0, c_b=0, c_c=0;

                for (var i=x-1; i<=x+1; i++) {
                    var ii = (i + bwidth) % bwidth;
                    for (var j=y-1; j<=y+1; j++) {
                        var jj = (j + bheight) % bheight;
                        var ind = ii + jj * bwidth + this.p * bwidth * bheight;
                        c_a += this.a[ind];
                        c_b += this.b[ind];
                        c_c += this.c[ind];
                    }
                }

                c_a /= 9;
                c_b /= 9;
                c_c /= 9;

                var ind = ii + jj * bwidth + this.q * bwidth * bheight;
                this.a[ind] = Math.min(Math.max(c_a + c_a * ( c_b - c_c ), 0), 1);
                this.b[ind] = Math.min(Math.max(c_b + c_b * ( c_c - c_a ), 0), 1);
                this.c[ind] = Math.min(Math.max(c_c + c_c * ( c_a - c_b ), 0), 1);
            }
        }
        this.p = 1 - this.p;
        this.q = 1 - this.q;
    }
    
    for (var x=0; x<lwidth; x++) {
        for (var y=0; y<lheight; y++) {
            var x2 = Math.floor(x * zoom);
            var y2 = Math.floor(y * zoom);
            var a_p = this.a[x2 + y2*bwidth + bwidth*bheight*this.p];
            var a_q = this.a[x2 + y2*bwidth + bwidth*bheight*this.q];
            
            // interpolate
            var a_val = this.state * (a_p - a_q) / numStates + a_q;
            //var a_val = a_p*this.state/numStates + a_q*(numStates-this.state)/numStates;
            this.indices[x*lheight + y] = Math.floor(a_val * (this.numColors-1));

            // if (x == 0 && y == 0) 
            //   console.log("state=" + this.state + " numStates=" + numStates + " a_q=" + a_q + " a_p=" + a_p + " a_val=" + a_val);

        }
    }

    this.state++;
    return this.indices;
}

module.exports.BzrDrawer = BzrDrawer;


