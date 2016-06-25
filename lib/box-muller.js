(function () {

  function gaussianRandom(mean, variance) {
    if (mean === undefined || variance === undefined) {
      throw "Gaussian random needs 2 arguments (mean, standard deviation)";
    }
    var std = Math.sqrt(variance);
    return randByBoxMullerTransform() * std + mean;
  }

  var randByBoxMullerTransform = (function() {
    var vals = [];

    function calc() {
      var alpha = Math.random(),
        beta = Math.random();
      return [
        Math.sqrt(-2 * Math.log(alpha)) * Math.sin(2 * Math.PI * beta),
        Math.sqrt(-2 * Math.log(alpha)) * Math.cos(2 * Math.PI * beta)
      ];
    }

    return function() {
      vals = vals.length == 0 ? calc() : vals;
      return vals.pop();
    }
  })();

  window.gaussian = {random: gaussianRandom};
}());
