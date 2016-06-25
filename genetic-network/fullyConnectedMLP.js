(function () {
  'use strict';

  const MAXIMUM_NODES = 37;

  function createFullyConnectedMLP(hidden) {
    var links = [],
        input = 3,
        output = 2;

    function canTransmit(x) {
      return x < input + hidden;
    }

    function canReceive(x) {
      return (x >= input && x < hidden) || (x >= MAXIMUM_NODES - output);
    }

    for (let i = 0; i < MAXIMUM_NODES; i++) {
      links[i] = [];
      for (let j = 0; j < MAXIMUM_NODES; j++) {
        if (canTransmit(i) && canReceive(j)) {
          links[i][j] = _.random(-1, 1);
        } else {
          links[i][j] = null;
        }
      }
    }

    return new geneticNetwork.NeuralNetwork(hidden, links);
  }

  window.geneticNetwork = window.geneticNetwork || {};
  geneticNetwork.createFullyConnectedMLP = createFullyConnectedMLP;
}());
