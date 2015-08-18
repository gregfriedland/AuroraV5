function SafeInterval(func, interval) {
	this.running = true;

	var instance = this;
	var loopFunc = function() {
		if (instance.running) {
			func();
			setTimeout(loopFunc, interval);
		}
	};
	loopFunc();
}

SafeInterval.prototype.clear = function() {
	this.running = false;
}

module.exports.SafeInterval = SafeInterval;