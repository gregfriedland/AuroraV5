var SIZE = 64 * 32 * 3;

var device = process.argv[2];
var COUNTS = parseInt(process.argv[3]);
var WARMUP_COUNTS = 10;
var SerialPort = require("serialport").SerialPort;
var serial = new SerialPort(device, {baudrate: 115200});

var startTime = Date.now();
var counter = COUNTS;
var packet = new Buffer(SIZE+1);
for (var i = 0; i < SIZE; i++)
	packet[i] = 0;
packet[SIZE] = 255;
function writeData() {
	if (counter == COUNTS - WARMUP_COUNTS)
		startTime = Date.now();

	serial.write(packet);
	console.log("wrote packet");
	counter--;
}

serial.on("data", function(data) {
    console.log("Serial data: " + data);

	if (counter > 0)
		writeData();
	else {
		console.log("Done: " + (COUNTS - WARMUP_COUNTS) * 1000 / (Date.now() - startTime));
		process.exit();//serial.close();
	}
});
serial.on('error', function(e) {
    console.error('Serial port error: ' + e);
});
serial.on("open", function () {
    console.log('Connected to serial device ' + device);

	writeData();
});



process.on('SIGINT', function() {
    console.log("Caught sigint");
	process.exit();//serial.close();
});
