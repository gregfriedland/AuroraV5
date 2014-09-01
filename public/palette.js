
function Palette(index, baseColors, numColors) {
  this.index = index;
  this.baseColors = baseColors;
  this.rgbs = this.getGradient(baseColors, numColors);
  this.numColors = numColors;
}

Palette.prototype.getGradient = function(colors, length) {
  var canvas = document.createElement('canvas');
  canvas.width = length;
  canvas.height = 1;
  var context = canvas.getContext('2d');

  var gradient = context.createLinearGradient(0, 0, length, 1);
  for (var i=0; i<colors.length; i++) {
    gradient.addColorStop(i/colors.length, "#" + colors[i]);
  }
  gradient.addColorStop(1.0, "#" + colors[0]);

  context.fillStyle = gradient;
  context.fillRect(0, 0, length, 1);  
  var imageData = context.getImageData(0, 0, length, 1).data;
  var rgbs = [];
  for (var i=0; i<length; i++) {
    rgbs.push([imageData[i*4], imageData[i*4+1], imageData[i*4+2]]);
  }
  return rgbs;
}



function PaletteManager(allBaseColors, numColors) {
  this.numColors = numColors;
  this.palettes = [];
  for (var i=0; i<allBaseColors.length; i++) {
    this.palettes.push(new Palette(i, allBaseColors[i], numColors));
  }
  this.currPalette = Math.floor(Math.random() * allBaseColors.length);
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
  //var text = new Kinetic.Text({ x: 10, y: 10, fill: 'black', text: 'test' });
  //layer2.add(text);

  var context = layer1.getContext()._context;
  console.log(context);
  
  var onmouseover = function(palRect, i) {
    return function() {
      //text.setText('mouseover ' + i);
      //palRect.strokeWidth(4);
      palRect.stroke('black');
      layer2.draw();
      //console.log(i);
    }
  }
  
  var onmouseout = function(palRect, i) {
    return function() {
      //text.setText('mouseover ' + i);
      palRect.stroke(null);
      layer2.draw();
      //console.log(i);
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
  
//  // add the click callback
//  canvasE.addEventListener("click",
//                           function(e) {
//                             return canvasOnClick(e, canvas, clickCallback, paletteMgr.palettes.length);
//                           }, false);
//
}
//
//function canvasOnClick(e, canvas, clickCallback, numPalettes) {
//    var offsetX = 0, offsetY = 0
//
//    if (canvas.offsetParent) {
//      do {
//        offsetX += canvas.offsetLeft;
//        offsetY += canvas.offsetTop;
//      } while ((canvas = canvas.offsetParent));
//    }
//
//    x = e.pageX - offsetX;
//    y = e.pageY - offsetY;
//  
//    var paletteIndex = Math.floor(canvas.height / numPalettes);
//  
//    clickCallback
//  
//}
//
//
//
