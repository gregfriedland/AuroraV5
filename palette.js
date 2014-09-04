function hexToRgb(hex) {
  var bigint = parseInt(hex, 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;

  return [r,g,b];
}

function getGradientColor(colors, gradientIndex, gradientSize) {
  var subGradientSize = Math.floor(gradientSize / (colors.length-1));

  var hex1 = Math.floor(gradientIndex / subGradientSize);
  var hex2 = (hex1 + 1) % colors.length;

  var rgb1 = hexToRgb(colors[hex1]);
  var rgb2 = hexToRgb(colors[hex2]);

  gradientIndex = gradientIndex % subGradientSize;

  var rgb = [Math.floor(rgb1[0] + gradientIndex * (rgb2[0] - rgb1[0]) / subGradientSize),
             Math.floor(rgb1[1] + gradientIndex * (rgb2[1] - rgb1[1]) / subGradientSize),
             Math.floor(rgb1[2] + gradientIndex * (rgb2[2] - rgb1[2]) / subGradientSize)];
  
  //console.log(rgb);
  return rgb;
}



function Palette(index, baseColors, numColors) {
  this.index = index;
  this.baseColors = baseColors;
  this.numColors = numColors;

  this.rgbs = [];
  for (var i=0; i<numColors; i++) {
    var rgb = getGradientColor(baseColors, i, numColors);
    this.rgbs.push(rgb);
  }
  //console.log();
}

Palette.prototype.print = function() {
  var s = "";
  for (var i=0; i<this.rgbs.length; i++) {
    s += ('000'+i).slice(-4) + ' ' +
         ('00'+this.rgbs[i][0]).slice(-3) + ' ' +
         ('00'+this.rgbs[i][1]).slice(-3) + ' ' +
         ('00'+this.rgbs[i][2]).slice(-3) + '\n';
  }
  return s;
}



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



// draw palettes to a canvas
function drawPalettes(paletteMgr, clickCallback, width, height) {
  var colorsPerPixel = Math.floor(paletteMgr.numColors / width);
  width = paletteMgr.numColors / colorsPerPixel;
  //var context = canvas.getContext('2d');
  var stripHeight = height / paletteMgr.palettes.length;
  
  var stage = new Kinetic.Stage({ container: 'palettes', width: width, height: height });

  // create a layer for directly drawing to a canvas
  var layer1 = new Kinetic.Layer();
  stage.add(layer1);

  // another layer for the outlines of the palettes
  var layer2 = new Kinetic.Layer();

  var context = layer1.getContext()._context;
  console.log(context);
  
  var onmouseover = function(palRect, i) {
    return function() {
      palRect.stroke('black');
      layer2.draw();
    }
  }
  
  var onmouseout = function(palRect, i) {
    return function() {
      palRect.stroke(null);
      layer2.draw();
    }
  }

  for (var i=0; i < paletteMgr.palettes.length; i++) {
    var rgbs = paletteMgr.palettes[i].rgbs;
    for (var j=0; j < rgbs.length; j+=colorsPerPixel) {
      context.fillStyle = 'rgb(' + rgbs[j][0] + ',' + rgbs[j][1] + ',' + rgbs[j][2] + ')';
      context.fillRect(j/colorsPerPixel, i*stripHeight, 1, stripHeight);
    }

    var palRect = new Kinetic.Rect({ x: 0, y: i*stripHeight, width: width, height: stripHeight,
                                     stroke: null, strokeWidth: 4 });
    palRect.on('mouseover', onmouseover(palRect, i));
    palRect.on('mouseout', onmouseout(palRect, i));
    layer2.add(palRect);
  }
  
  stage.add(layer2);
}


module.exports.PaletteManager = PaletteManager;
module.exports.drawPalettes = drawPalettes;