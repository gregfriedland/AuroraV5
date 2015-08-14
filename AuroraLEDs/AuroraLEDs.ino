// Arduino code to listen for pixel data in serial format from a PC/RaspberryPi,
// and relay it to an LED matrix or strip

#define ADAFRUIT_MATRIX 77
#define LED_TYPE ADAFRUIT_MATRIX // 2801 | 2811 | ADAFRUIT_MATRIX
#define WIDTH 64
#define HEIGHT 32
#define BLINK_PIN 13
#define OUTPUT_FPS_INTERVAL 5000
#define FPS 30

#define p(...) Serial.print(__VA_ARGS__)

#if (LED_TYPE==2811)
  #include <OctoWS2811.h>
  #define LEDS_PER_STRIP (WIDTH*HEIGHT/8)

  DMAMEM int displayMemory[LEDS_PER_STRIP*6];
  int drawingMemory[LEDS_PER_STRIP*6];
  OctoWS2811 leds(LEDS_PER_STRIP, displayMemory, drawingMemory, WS2811_GRB | WS2811_800kHz);
#elif (LED_TYPE==2801)
  #include "FastLED.h"
  #define CLOCK_PIN 2 // data line 1
  #define DATA_PIN 14 // data line 2
  CRGB leds[WIDTH*HEIGHT];
#elif (LED_TYPE==ADAFRUIT_MATRIX)
  #include <SmartMatrix3.h>
  const uint8_t kMatrixHeight = HEIGHT;       // known working: 16, 32
  const uint8_t kMatrixWidth = WIDTH;        // known working: 32, 64
  const uint8_t kColorDepthRgb = 36;      // known working: 36, 48 (24 isn't efficient and has color correction issues)
  const uint8_t kDmaBufferRows = 4;       // known working: 4
  SMARTMATRIX_ALLOCATE_BUFFERS(kMatrixWidth, kMatrixHeight, kColorDepthRgb, kDmaBufferRows);
#endif

#define BUFFER_SIZE 2500
static byte buffer[BUFFER_SIZE];

//Metro metro = Metro(1000/FPS);


void updateLEDs()
{
#if (LED_TYPE==2811)
    leds.show();
#elif (LED_TYPE==2801)
    FastLED.show();
    //memset(leds, 0, sizeof(leds));
#elif (LED_TYPE==ADAFRUIT_MATRIX)
    matrix.swapBuffers();
#endif
}

void setup() {
  pinMode(BLINK_PIN, OUTPUT);

	// sanity check delay - allows reprogramming if accidently blowing power w/leds
  delay(2000);

  Serial.begin(115200);
  Serial.setTimeout(0);

#if (LED_TYPE==2811)
  leds.begin();
#elif (LED_TYPE==2801)
  FastLED.addLeds<WS2801, DATA_PIN, CLOCK_PIN, BRG, DATA_RATE_MHZ(4)>(leds, WIDTH*HEIGHT);
  memset(leds, 0, sizeof(leds));
#elif (LED_TYPE==ADAFRUIT_MATRIX)
  SMARTMATRIX_SETUP_DEFAULT_LAYERS(kMatrixWidth, kMatrixHeight);
  matrix.setBrightness(255);
  matrix.setColorCorrection(cc48dither);
#endif
}


void outputFPS() {
  static uint32_t lastFpsOutputTime = millis();
  static int32_t fpsOutputCount = 0;

  // output effective FPS every so often
  fpsOutputCount++;
  uint32_t fpsOutputTimeDiff = millis() - lastFpsOutputTime;
  if (fpsOutputTimeDiff > OUTPUT_FPS_INTERVAL) {
    digitalWrite(BLINK_PIN, HIGH);
    delayMicroseconds(1000);
    digitalWrite(BLINK_PIN, LOW);

    int32_t fps = fpsOutputCount * 1000UL / fpsOutputTimeDiff;
    p(fps);

#if (LED_TYPE==ADAFRUIT_MATRIX)
    char value[] = "00";
    value[0] = '0' + fps / 100;
    value[1] = '0' + (fps % 100) / 10;
    value[2] = '0' + fps % 10;    
    matrix.drawForegroundString(12, matrix.getScreenHeight()-1 -5, value, true);
    matrix.displayForegroundDrawing();
    matrix.clearForeground();
#endif
    fpsOutputCount = 0;
    lastFpsOutputTime = millis();
  }
}

static int pix=0;

void loop() {
  int nbytes = Serial.readBytes((char*)buffer, BUFFER_SIZE);

  for (int i=0; i<nbytes; i++) {
    int c = (int)buffer[i];
    if (c == 255) {
      updateLEDs();
      outputFPS();

      pix = 0;
    } else {
#if (LED_TYPE==2811)
#elif (LED_TYPE==2801)
      leds[pix/3] += (c) << (8*(pix%3));
#elif (LED_TYPE==ADAFRUIT_MATRIX)
      int pos = pix / 3;
      rgb24& col = matrix.backBuffer()[pos];
      switch (pix % 3) {
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
#endif

      pix++;
    }
  }
}
