
function FpsCounter(name) {
    this.lastTime = Date.now();
    this.count = 0;
    this.name = name;
}

FpsCounter.prototype.tick = function(outputInterval) {
    var currTime = Date.now();
    if (currTime - this.lastTime > outputInterval) {
        console.log(name + ": " + (1000 * this.count/(currTime - this.lastTime)).toFixed(1));
        this.count = 0;
        this.lastTime = currTime;
    }
    this.count++;
}

module.exports.FpsCounter = FpsCounter