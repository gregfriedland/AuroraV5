function AlienBlobDrawer(width, height, numColors) {
  this.name = "AlienBlob";
  this.pos = Math.floor(Math.random() * 1e6);
  this.colorIndex = 0;
  this.values = {speed: 20, colorSpeed: 10, detail: 3, zoom: 70};
  this.ranges = {speed: [0,100], colorSpeed: [0,100], detail: [1,6], zoom: [0,100]};
  this.decay = 0.5;
  this.speedMultiplier = 0.07;
  
  this.alienblob = new AlienBlob(width, height, numColors);
}

AlienBlobDrawer.prototype.draw = function(leds, palette) {
  var indices = this.alienblob.run(this.pos, this.values["zoom"]/100.0, this.values["detail"], this.decay);
  //console.log(indices);
  
  for (var x=0; x<leds.width; x++) {
    for (var y=0; y<leds.height; y++) {
      index = indices[x*leds.height + y] + this.colorIndex;
      leds.rgbs[x][y] = palette.rgbs[index % palette.numColors];
    }
  }
  
  this.pos += this.speedMultiplier * this.values.speed / 100.0;
  this.colorIndex++;
}

AlienBlobDrawer.prototype.getDelay = function() {
  return 1000/this.values.speed;
}



function AlienBlob(width, height, numColors) {
  this.width = width;
  this.height = height;
  this.numColors = numColors;
   
  // create precalculated sine table
  this.sineTable = [];
  for (i = 0; i < 360; i++)
    this.sineTable[i] = Math.sin(i * Math.PI / 180);
  
  this.indices = [];
  
  this.perlin = new PerlinNoise();
}

AlienBlob.prototype.run = function(zoff, zoom, detail, decay) {
  var incr = 0.3125;
  var noiseMult = 7;
  var multiplier = (1-zoom) + 0.02;

  var y, x;
  var yy = 0;
  for (var y = 0; y < this.height; y++) {
    var xx = 0;
    for (var x = 0; x < this.width; x++) {
      var n = this.perlin.noise(xx*multiplier, yy*multiplier, zoff, detail, decay);
      // use pre-calculated sine results
      var deg = Math.floor((n * noiseMult + 4 * Math.PI) * 180 / Math.PI);
      var h = (this.sineTable[deg % 360] + 1) / 2;
      
      // determine pixel color
      this.indices[x*this.height + y] = Math.floor(h * this.numColors);
      
      xx += incr;
    }
    
    yy += incr;
  }
  
  return this.indices;
}



/* -*- mode: java; c-basic-offset: 2; indent-tabs-mode: nil -*- */

/*
 Part of the Processing project - http://processing.org
 
 Copyright (c) 2012-13 The Processing Foundation
 Copyright (c) 2004-12 Ben Fry and Casey Reas
 Copyright (c) 2001-04 Massachusetts Institute of Technology
 
 This library is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation, version 2.1.
 
 This library is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.
 
 You should have received a copy of the GNU Lesser General
 Public License along with this library; if not, write to the
 Free Software Foundation, Inc., 59 Temple Place, Suite 330,
 Boston, MA  02111-1307  USA
 */
 
 // Translated to javascript by Greg Friedland 9/2/2014

//static float noise_fsc(float i);

//#define RANDOM() (random() / (float)RAND_MAX)

SINCOS_PRECISION = 0.5;
SINCOS_LENGTH = (360*2);
DEG_TO_RAD = (3.14159 / 180);

PERLIN_YWRAPB = 4;
PERLIN_YWRAP = (1<<PERLIN_YWRAPB);
PERLIN_ZWRAPB = 8;
PERLIN_ZWRAP = (1<<PERLIN_ZWRAPB);
PERLIN_SIZE = 4095;

//static float sinLUT[SINCOS_LENGTH];
//static float cosLUT[SINCOS_LENGTH];
//static int perlin_TWOPI, perlin_PI;
//static float *perlin_cosTable;
//static float perlin[PERLIN_SIZE+1];


function PerlinNoise() {
  //srandom(clock());
  
  this.perlin_TWOPI = SINCOS_LENGTH;
  this.perlin_PI = this.perlin_TWOPI / 2;
  
  this.cosTable = [];
  for (i = 0; i < SINCOS_LENGTH; i++) {
    //sinLUT[i] = (float) sin(i * DEG_TO_RAD * SINCOS_PRECISION);
    this.cosTable[i] = Math.cos(i * DEG_TO_RAD * SINCOS_PRECISION);
  }

  this.perlin = [];
  for (i = 0; i < PERLIN_SIZE + 1; i++) {
    this.perlin[i] = Math.random();
  }
}

PerlinNoise.prototype.noise_fsc = function(i) {
  // using bagel's cosine table instead
  return 0.5*(1.0-this.cosTable[Math.floor(i*this.perlin_PI)%this.perlin_TWOPI]);
}

PerlinNoise.prototype.noise = function(x, y, z, perlin_octaves, perlin_amp_falloff) {
  if (x<0) x=-x;
  if (y<0) y=-y;
  if (z<0) z=-z;
  
  var xi=Math.floor(x), yi=Math.floor(y), zi=Math.floor(z);
  var xf = x - xi;
  var yf = y - yi;
  var zf = z - zi;
  var rxf, ryf;
  
  var r=0;
  var ampl=0.5;
  
  var n1,n2,n3;
  
  for (var i=0; i<perlin_octaves; i++) {
    var of=xi+(yi<<PERLIN_YWRAPB)+(zi<<PERLIN_ZWRAPB);
    
    rxf = this.noise_fsc(xf);
    ryf = this.noise_fsc(yf);
    
    n1  = this.perlin[of&PERLIN_SIZE];
    n1 += rxf*(this.perlin[(of+1)&PERLIN_SIZE]-n1);
    n2  = this.perlin[(of+PERLIN_YWRAP)&PERLIN_SIZE];
    n2 += rxf*(this.perlin[(of+PERLIN_YWRAP+1)&PERLIN_SIZE]-n2);
    n1 += ryf*(n2-n1);

    of += PERLIN_ZWRAP;
    n2  = this.perlin[of&PERLIN_SIZE];
    n2 += rxf*(this.perlin[(of+1)&PERLIN_SIZE]-n2);
    n3  = this.perlin[(of+PERLIN_YWRAP)&PERLIN_SIZE];
    n3 += rxf*(this.perlin[(of+PERLIN_YWRAP+1)&PERLIN_SIZE]-n3);
    n2 += ryf*(n3-n2);
    
    n1 += this.noise_fsc(zf)*(n2-n1);
    
    r += n1*ampl;
    ampl *= perlin_amp_falloff;
    xi<<=1; xf*=2;
    yi<<=1; yf*=2;
    zi<<=1; zf*=2;
    
    if (xf>=1.0) { xi++; xf--; }
    if (yf>=1.0) { yi++; yf--; }
    if (zf>=1.0) { zi++; zf--; }
  }
  return r;
}

module.exports.AlienBlobDrawer = AlienBlobDrawer;
