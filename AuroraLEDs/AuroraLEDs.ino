/*
  Required Connections
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

#define LED_TYPE 2801
#define WIDTH 32
#define HEIGHT 18
#define BLINK_PIN 13

#define p(...) Serial.print(__VA_ARGS__)
#define MIN(a,b) ((a)>(b)?(a):(b))

#if (LED_TYPE==2811)
  #include <OctoWS2811.h>
  #define LEDS_PER_STRIP (WIDTH*HEIGHT/8)

  DMAMEM int displayMemory[LEDS_PER_STRIP*6];
  int drawingMemory[LEDS_PER_STRIP*6];
  OctoWS2811 leds(LEDS_PER_STRIP, displayMemory, drawingMemory, WS2811_GRB | WS2811_800kHz);
#else
  #include "FastSPI_LED2.h"
  #define CLOCK_PIN 2 // data line 1
  #define DATA_PIN 14 // data line 2
  CRGB leds[WIDTH*HEIGHT];

  #define BUFFER_SIZE 1500
  static byte buffer[BUFFER_SIZE];
#endif


void setup() {
  pinMode(BLINK_PIN, OUTPUT);

	// sanity check delay - allows reprogramming if accidently blowing power w/leds
  delay(2000);

  Serial.begin(115200);
  Serial.setTimeout(0);

#if (LED_TYPE==2811)
  leds.begin();
#else
  FastLED.addLeds<WS2801, DATA_PIN, CLOCK_PIN, BRG, DATA_RATE_MHZ(4)>(leds, WIDTH*HEIGHT);
  memset(leds, 0, sizeof(leds));
#endif

}

static int lastBlinkTime = 0;
static boolean lastBlinkState = LOW;
static int pix=0;

void loop() {

#if (LED_TYPE==2811)
  // FIX: this won't work yet because the data order expected is probably different than the one being sent: check VideoDisplay pde sketch
  int count = Serial.readBytes((char *)drawingMemory, sizeof(drawingMemory));
  if (count != sizeof(drawingMemory)) {
    memset(drawingMemory, 0, sizeof(drawingMemory));
    leds.setPixel(0, 0xFF0000);
  }
  leds.show();
#else
    //int nbytes = Serial.readBytes((char*)buffer, BUFFER_SIZE);
//    int avail = Serial.available();
//    Serial.println(avail);
//    int nbytes = Serial.readBytes((char*)buffer, MIN(avail, BUFFER_SIZE));

  int nbytes = Serial.readBytes((char*)buffer, BUFFER_SIZE);


  for (int i=0; i<nbytes; i++) {
    int c = (int)buffer[i];
    if (c == 255) {
        digitalWrite(BLINK_PIN, HIGH);
        delayMicroseconds(300);
        digitalWrite(BLINK_PIN, LOW);
        FastLED.show();
        memset(leds, 0, sizeof(leds));

        pix = 0;
    } else {
      leds[pix/3] += (c) << (8*(pix%3));
//
////      // uncomment this to print color data to Serial
////      if (pix <= 2) { p(c,DEC); p(" "); }
////      CRGB col = leds[pix/3];
////      if (pix == 2) {
////        p(col.r,DEC); p(" "); p(col.g,DEC); p(" "); p(col.b,DEC);
////        p("\n"); Serial.flush();
//      }
//
      pix++;
    }
  }
#endif
}


