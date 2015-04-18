AuroraV5
===========

Version 5 of the Aurora LED wall project.

||LEDs ▶︎|LED Controller ▶︎|Node.js server ▶︎|Web app|
|-|-|-|-|
|Function|Display patterns|Communicate with LEDs|Generate patterns|Control pattern parameters|
|Hardware|WS2812/Neopixels, Adafruit LED matrix, WS2801, etc.|FadeCandy board, [SmartMatrix board](https://www.adafruit.com/products/1902), etc.|Raspberry Pi, BeagleBone Black, etc.|PC, smartphone, tablet, etc.|

# Installation on a Raspberry Pi

1. Raspbian
 * Flash SD Card

2. Update apt-get
  * `sudo apt-get update`

3. Install Node
  1. `wget http://nodejs.org/dist/v0.10.16/node-v0.10.16-linux-arm-pi.tar.gz`
  2. `tar xzvf node-v0.10.16-linux-arm-pi.tar.gz`
  3. `sudo mv node-v0.10.16-linux-arm-pi /opt/node`
  4. `node -v (to make sure the version is 0.10.16)`

4. Install Aurora
  1. `git clone https://github.com/gregfriedland/AuroraV5.git`
  2. `cd AuroraV5`
  3. `npm install`


Notes
1. To get 64x32, I used [this fork of SmartMatrix](https://github.com/ncortot/SmartMatrix)
2. Does color speed work on Bzr?