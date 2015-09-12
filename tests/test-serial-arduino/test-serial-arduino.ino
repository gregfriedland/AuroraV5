#include <Arduino.h>

#define USE_SMARTMATRIX 1

#define WIDTH 64
#define HEIGHT 32
#define DEPTH 24

#if USE_SMARTMATRIX
  #include <SmartMatrix3.h>

  #define COLOR_DEPTH DEPTH                  // known working: 24, 48 - If the sketch uses type `rgb24` directly, COLOR_DEPTH must be 24
  const uint8_t kMatrixWidth = WIDTH;        // known working: 32, 64, 96, 128
  const uint8_t kMatrixHeight = HEIGHT;       // known working: 16, 32, 48, 64
  const uint8_t kRefreshDepth = 24;       // known working: 24, 36, 48
  const uint8_t kDmaBufferRows = 4;       // known working: 2-4, use 2 to save memory, more to keep from dropping frames and automatically lowering refresh rate
  const uint8_t kPanelType = SMARTMATRIX_HUB75_32ROW_MOD16SCAN;   // use SMARTMATRIX_HUB75_16ROW_MOD8SCAN for common 16x32 panels
  const uint8_t kMatrixOptions = (SMARTMATRIX_OPTIONS_NONE);      // see http://docs.pixelmatix.com/SmartMatrix for options
  const uint8_t kBackgroundLayerOptions = (SM_BACKGROUND_OPTIONS_NONE);
  const uint8_t kScrollingLayerOptions = (SM_SCROLLING_OPTIONS_NONE);
  const uint8_t kIndexedLayerOptions = (SM_INDEXED_OPTIONS_NONE);

  SMARTMATRIX_ALLOCATE_BUFFERS(matrix, kMatrixWidth, kMatrixHeight, kRefreshDepth, kDmaBufferRows, kPanelType, kMatrixOptions);
  SMARTMATRIX_ALLOCATE_BACKGROUND_LAYER(backgroundLayer, kMatrixWidth, kMatrixHeight, COLOR_DEPTH, kBackgroundLayerOptions);
  // SMARTMATRIX_ALLOCATE_SCROLLING_LAYER(scrollingLayer, kMatrixWidth, kMatrixHeight, COLOR_DEPTH, kScrollingLayerOptions);
  // SMARTMATRIX_ALLOCATE_INDEXED_LAYER(indexedLayer, kMatrixWidth, kMatrixHeight, COLOR_DEPTH, kIndexedLayerOptions);
#endif

#define BUFFER_SIZE WIDTH*HEIGHT*DEPTH/8


void setup() {
  Serial.begin(115200);
  Serial.setTimeout(0);

  matrix.addLayer(&backgroundLayer); 
  // matrix.addLayer(&scrollingLayer); 
  // matrix.addLayer(&indexedLayer); 
  matrix.begin();

  matrix.setBrightness(255);
  backgroundLayer.enableColorCorrection(false);  
}

void loop() {
  char buf[BUFFER_SIZE];
  int count=0;
  int n;

  while (count < BUFFER_SIZE) {
    n = Serial.readBytes(buf+count, BUFFER_SIZE-count);
    count = count + n;
  }

#if USE_SMARTMATRIX
#if COLOR_DEPTH == 24
    for (int i = 0; i < BUFFER_SIZE; i++) {
        int pos = i / 3;
        RGB_TYPE(COLOR_DEPTH)& col = backgroundLayer.backBuffer()[pos];
  
        int c = buf[i];
        switch (i % 3) {
          case 0:
            col.red = c;
            break;
          case 1:
            col.green = c;
            break;
          case 2:
            col.blue = c;
            break;
        }
    }
#else //COLOR_DEPTH
  for (int i = 0; i < BUFFER_SIZE; i++) {
      int pos = i / 6;
      RGB_TYPE(COLOR_DEPTH)& col = backgroundLayer.backBuffer()[pos];

      int c = buf[i];
      switch (i % 6) {
        case 0:
          col.red = (col.red & 0xFF00) + c;
          break;
        case 1:
          col.red = (c << 8) + (col.red & 0xFF);
          break;
        case 2:
          col.green = (col.green & 0xFF00) + c;
          break;
        case 3:
          col.green = (c << 8) + (col.green & 0xFF);
          break;
        case 4:
          col.blue = (col.blue & 0xFF00) + c;
          break;
        case 5:
          col.blue = (c << 8) + (col.blue & 0xFF);
          break;
      }
  }
#endif //COLOR_DEPTH

  backgroundLayer.swapBuffers(true);
#endif // USE_SMARTMATRIX
  Serial.write(1);
}
