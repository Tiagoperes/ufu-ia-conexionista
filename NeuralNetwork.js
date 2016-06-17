(function () {
  'use strict';

  function NeuralNetwork(numberOfNeuronsInHiddenLayer, links) {
    var numberOfNeuronsInInputLayer = 2,
        numberOfNeuronsInOutputLayer = 2,
        maximumNumberOfNeuronsInHiddenLayer = 16,
        maximumNumberOfNeurons = numberOfNeuronsInInputLayer + numberOfNeuronsInOutputLayer + maximumNumberOfNeuronsInHiddenLayer,
        inputNodes = [0, 1],
        hiddenNodes = [],
        outputNodes = [18, 19],
        neuronList;

    function initialize() {
      generateHiddenNodes();
      if (!links) {
        createLinkStructure();
        createRandomLinks(10);
      }
    }

    function generateHiddenNodes() {
      for (let i = 0; i < numberOfNeuronsInHiddenLayer; i++) {
        hiddenNodes.push(numberOfNeuronsInInputLayer + i);
      }
    }

    function createLinkStructure() {
      for (let i = 0; i < maximumNumberOfNeurons; i++) {
        links[i] = [];
        for (let j = 0; j < maximumNumberOfNeurons; j++) {
          links[i][j] = null;
        }
      }
    }

    function createRandomLinks(numberOfLinks) {
      var i = 0;
      while (i < numberOfLinks) {
        let from = _.sample(_.union(inputNodes, hiddenNodes));
        let to = _.sample(_.union(hiddenNodes, outputNodes));
        if (from !== to) {
          links[from][to] = _.random(-1, 1, true);
          i++;
        }
      }
    }

    function sigmoid(x) {
      return 1 / (1 + Math.pow(Math.E, -x));
    }

    function getNumberOfIncidentLinks(neuronId) {
      return _.reduce(_.union(inputNodes, hiddenNodes), function (sum, n) {
        return links[n][neuronId] ? sum + 1 : sum;
      }, 0);
    }

    function getOutgoingNeurons(neuronId) {
      return _.reduce(links[neuronId], function (result, weight, n) {
        if (weight !== null) result.push(_.find(neuronList, {id: n}));
        return result;
      }, []);
    }

    function Neuron(id, output) {
      var self = this,
          activationSignalsReceived = 0,
          sum = 0,
          numberOfIncidentLinks = getNumberOfIncidentLinks(id);

      this.id = id;
      this.done = false;
      this.output = output;

      this.isSumComplete = function() {
        return activationSignalsReceived === numberOfIncidentLinks;
      };

      this.receiveSignal = function (signal) {
        sum += signal;
        activationSignalsReceived++;
        if (self.isSumComplete()) {
          self.output = sigmoid(sum);
        }
      };

      this.propagateSignal = function() {
        var destinationNeurons = getOutgoingNeurons(self.id);
        _.forEach(destinationNeurons, function (n) {
          n.receiveSignal(self.output * links[self.id][n.id]);
        });
        self.done = true;
      };
    }

    function forwardPropagation() {
      var allDone = true;

      _.forEach(neuronList, function (neuron) {
        if (neuron.done) return;

        allDone = false;
        if (neuron.isSumComplete()) neuron.propagateSignal();
      });

      if (!allDone) forwardPropagation(neuronList);
    }

    this.addNeuronToHiddenLayer = function () {

    };

    this.removeNeuronFromHiddenLayer = function () {

    };

    this.correctWeight = function (fromLayer, toLayer, index, differenceToApply) {

    };

    this.run = function (inputToNetwork) {
      neuronList = _.map(_.union(inputNodes, hiddenNodes, outputNodes), function (neuronId) {
        return new Neuron(neuronId, inputToNetwork[neuronId]);
      });

      forwardPropagation();
      return [_.find(neuronList, {id: 18}).output, _.find(neuronList, {id: 19}).output];
    };

    initialize();
  }

  window.geneticNetwork = window.geneticNetwork || {};
  geneticNetwork.NeuralNetwork = NeuralNetwork;
}());
