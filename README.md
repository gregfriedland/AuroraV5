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

5. Install Aurora to run automatically when the system boots
  * Serial version
    1. `sudo cp AuroraV5/system/aurora-serial-init.d /etc/init.d/aurora-serial`
    2. `sudo chmod 755 /etc/init.d/aurora-serial`
    3. `sudo update-rc.d aurora-serial defaults`
  * Fadecandy version
    1. `cp AuroraV5/system/aurora-fc-init.d /etc/init.d/aurora-fc`
    2. `chmod 755 /etc/init.d/aurora-fc`
    3. `cp AuroraV5/system/fcserver-init.d /etc/init.d/fcserver`
    4. `chmod 755 /etc/init.d/fcserver`

6. Optional for Rasperry Pi
  1. Comment out this line in node_modules/serialport/serialport.js which is slowing things down: `//debug('Write: '+JSON.stringify(buffer));`


Notes
1. To get it running on two side by side SmartMatrix panels for 64x32, I used [the rgb48 branch of my SmartMatrix fork](https://github.com/gregfriedland/SmartMatrix) and overclocked the Teensy 3.1 to 144Mhz.

Work in progress
1. Get color speed working
