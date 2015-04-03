/*
  Required Connections for WS2811
  --------------------
    pin 2:  LED Strip #1    OctoWS2811 drives 8 LED Strips.
    pin 14: LED strip #2    All 8 are the same length.
    pin 7:  LED strip #3
    pin 8:  LED strip #4    A 100 ohm resistor should used
    pin 6:  LED strip #5    between each Teensy pin and the
    pin 20: LED strip #6    wire to the LED strip, to minimize
    pin 21: LED strip #7    high frequency ringining & noise.
    pin 5:  LED strip #8
    pin 15 & 16 - Connect together, but do not use
    pin 4 - Do not use
    pin 3 - Do not use as PWM.  Normal use is ok.
    pin 1 - Output indicating CPU usage, monitor with an oscilloscope,
            logic analyzer or even an LED (brighter = CPU busier)
*/

#define ADAFRUIT_MATRIX 77
#define LED_TYPE ADAFRUIT_MATRIX // 2801 | 2811 | ADAFRUIT_MATRIX
#define WIDTH 32
#define HEIGHT 32
#define BLINK_PIN 13

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
  #include <SmartMatrix_32x32.h>
  #include <FastLED.h>
  CRGB leds[WIDTH * HEIGHT];

  //#include <DueTimer.h>
  //#include "AdafruitMatrix.h"
#endif

#define BUFFER_SIZE 1500
static byte buffer[BUFFER_SIZE];


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
  LEDS.addLeds<SMART_MATRIX>(leds,WIDTH*HEIGHT);
  LEDS.setBrightness(255);  

  // FastLED disables SmartMatrix's gamma correction by default, turn it on if you like
  //pSmartMatrix->setColorCorrection(cc48);

  // With gamma correction on, the 24 bit color gets stretched out over 36-bits, now
  // try enabling/disabling FastLED's dithering and see the effect
  //FastLED.setDither( 0 );
#endif

}

static int pix=0;

void loop() {
  int nbytes = Serial.readBytes((char*)buffer, BUFFER_SIZE);

  for (int i=0; i<nbytes; i++) {
    int c = (int)buffer[i];
    if (c == 255) {
        digitalWrite(BLINK_PIN, HIGH);
        delayMicroseconds(3000);
        digitalWrite(BLINK_PIN, LOW);

        p(".");

#if (LED_TYPE==2811)
        leds.show();
#elif (LED_TYPE==2801)
        FastLED.show();
        memset(leds, 0, sizeof(leds));
#elif (LED_TYPE==ADAFRUIT_MATRIX)
        LEDS.show();
        memset(leds, 0, sizeof(leds));
#endif

        pix = 0;
    } else {
#if (LED_TYPE==2811)
#elif (LED_TYPE==2801)
      leds[pix/3] += (c) << (8*(pix%3));
#elif (LED_TYPE==ADAFRUIT_MATRIX)
      leds[pix/3][pix%3] = c;
#endif

      pix++;
    }
  }
}
