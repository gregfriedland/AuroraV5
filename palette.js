function hexToRgb48(hex) {
  var bigint = parseInt(hex.toUpperCase(), 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;

  return [r << 8, g << 8, b << 8];
}

function getGradientColorRgb48(colors, gradientIndex, gradientSize) {
  var subGradientSize = Math.floor(gradientSize / (colors.length-1));

  var hex1 = Math.floor(gradientIndex / subGradientSize);
  var hex2 = (hex1 + 1) % colors.length;

  var rgb48_1 = hexToRgb48(colors[hex1]);
  var rgb48_2 = hexToRgb48(colors[hex2]);

  gradientIndex = gradientIndex % subGradientSize;

  var rgb48 = [Math.floor(rgb48_1[0] + gradientIndex * (rgb48_2[0] - rgb48_1[0]) / subGradientSize),
             Math.floor(rgb48_1[1] + gradientIndex * (rgb48_2[1] - rgb48_1[1]) / subGradientSize),
             Math.floor(rgb48_1[2] + gradientIndex * (rgb48_2[2] - rgb48_1[2]) / subGradientSize)];
  
  //console.log(rgb);
  return rgb48;
}



function Palette(index, baseColors, numColors) {
  this.index = index;
  this.baseColors = baseColors;
  this.numColors = numColors;

  this.rgbs48 = [];
  for (var i=0; i<numColors; i++) {
    var rgb48 = getGradientColorRgb48(baseColors, i, numColors);
    this.rgbs48.push(rgb48);
  }
  //console.log();
}

Palette.prototype.getRgb48 = function(index) {
  index = ((index % this.numColors) + this.numColors) % this.numColors;
  return this.rgbs48[index];
}

// Palette.prototype.print = function() {
//   var s = "";
//   for (var i=0; i<this.rgbs48.length; i++) {
//     s += ('000'+i).slice(-4) + ' ' +
//          ('00'+this.rgbs48[i][0]).slice(-3) + ' ' +
//          ('00'+this.rgbs48[i][1]).slice(-3) + ' ' +
//          ('00'+this.rgbs48[i][2]).slice(-3) + '\n';
//   }
//   return s;
// }



function PaletteManager(allBaseColors, numColors) {
  this.numColors = numColors;
  this.palettes = [];
  for (var i=0; i<allBaseColors.length; i++) {
    this.palettes.push(new Palette(i, allBaseColors[i], numColors));
  }
  this.currPalette = Math.floor(Math.random() * allBaseColors.length);
  //console.log(this.palettes[this.currPalette].print());
}

PaletteManager.prototype.getCurrent = function() {
  return this.palettes[this.currPalette];
}

PaletteManager.prototype.setCurrentIndex = function(i) {
  this.currPalette = i % this.palettes.length;
}


module.exports.PaletteManager = PaletteManager;
