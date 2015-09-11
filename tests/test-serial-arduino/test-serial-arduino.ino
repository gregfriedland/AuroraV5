#include <Arduino.h>

#define USE_SMARTMATRIX 1
#define DO_COPY 1

#define WIDTH 64
#define HEIGHT 32

#if USE_SMARTMATRIX
  #include <SmartMatrix3.h>
  #define DEPTH 24 // 24 or 48bit
  const uint8_t kMatrixHeight = HEIGHT;      // known working: 16, 32
  const uint8_t kMatrixWidth = WIDTH;        // known working: 32, 64
  const uint8_t kDmaBufferRows = 4;          // known working: 4
  SMARTMATRIX_ALLOCATE_BUFFERS(kMatrixWidth, kMatrixHeight, DEPTH, 48, kDmaBufferRows);
#endif

#define BUFFER_SIZE WIDTH*HEIGHT*DEPTH/8


// use one of these to define
// the USB virual serial name
//
#define USBSERIAL Serial      // Arduino Leonardo, Teensy, Fubarino
//#define USBSERIAL SerialUSB   // Arduino Due, Maple


void setup() {
  USBSERIAL.begin(115200);
  USBSERIAL.setTimeout(0);
//  delay(3000);

#if USE_SMARTMATRIX
  SMARTMATRIX_SETUP_DEFAULT_LAYERS(kMatrixWidth, kMatrixHeight, DEPTH);
#endif  
}

void loop() {
  char buf[BUFFER_SIZE];
  int count=0;
  int n;

  while (count < BUFFER_SIZE) {
    n = USBSERIAL.readBytes(buf+count, BUFFER_SIZE-count);
//    USBSERIAL.print(n, DEC);
    count = count + n;
  }

#if USE_SMARTMATRIX
#if DO_COPY
#if DEPTH == 24
    for (int i = 0; i < BUFFER_SIZE; i++) {
        int pos = i / 3;
        RGB_TYPE(DEPTH)& col = matrix.backBuffer()[pos];
  
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
#else //DEPTH
  for (int i = 0; i < BUFFER_SIZE; i++) {
      int pos = i / 6;
      RGB_TYPE(DEPTH)& col = matrix.backBuffer()[pos];

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
#endif // DEPTH
#endif // DO_COPY

  matrix.swapBuffers();
#endif // USE_SMARTMATRIX
  USBSERIAL.write(1);
}
