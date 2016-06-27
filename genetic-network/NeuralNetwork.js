(function () {
  'use strict';

  function NeuralNetwork(numberOfNeuronsInHiddenLayer, links) {
    var numberOfNeuronsInInputLayer = 3,
        numberOfNeuronsInOutputLayer = 3,
        maximumNumberOfNeuronsInHiddenLayer = 20,
        maximumNumberOfNeurons = numberOfNeuronsInInputLayer + numberOfNeuronsInOutputLayer + maximumNumberOfNeuronsInHiddenLayer,
        inputNodes = [0, 1, 2],
        hiddenNodes = [],
        outputNodes = [23, 24, 25],
        neuronList;

    function initialize() {
      generateHiddenNodes();
      if (!links) {
        createLinkStructure();
        createRandomLinks(_.random(1, 10));
      }
    }

    function generateHiddenNodes() {
      for (let i = 0; i < numberOfNeuronsInHiddenLayer; i++) {
        hiddenNodes.push(numberOfNeuronsInInputLayer + i);
      }
    }

    function createLinkStructure() {
      links = [];
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
        let to = _.sample(_.filter(_.union(hiddenNodes, outputNodes), _.partial(_.gt, _, from)));
        links[from][to] = _.random(-1, 1, true);
        i++;
      }
    }

    function activation(x) {
      //return 1 / (1 + Math.pow(Math.E, -x));
      return x;
    }

    function getIncomingNeuronsIds(neuronId) {
      return _.reduce(_.union(inputNodes, hiddenNodes), function (result, nodeId) {
        if (links[nodeId][neuronId] !== null) result.push(nodeId);
        return result;
      }, []);
    }

    function getOutgoingNeurons(neuronId) {
      return _.reduce(links[neuronId], function (result, weight, n) {
        if (weight !== null) {
          let neuron = _.find(neuronList, {id: n});
          if (neuron) result.push(neuron); // fixme: perigo! fiz isso, pois deve estar ocorrendo algum problema na mutação. Existem links para nós inexistentes, o que causa erro aqui.
        }
        return result;
      }, []);
    }

    function Neuron(id, output) {
      var self = this,
          activationSignalsReceived = 0,
          sum = 0,
          numberOfIncidentLinks = getIncomingNeuronsIds(id).length;

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
          self.output = activation(sum);
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

    function removeLinksFrom(nodeId) {
      var linksFromNode = links[nodeId];
      for (let i = 0; i < linksFromNode.length; i++) {
        linksFromNode[i] = null;
      }
    }

    function removeLinksTo(nodeId) {
      for (let i = 0; i < links.length; i++) {
        links[i][nodeId] = null;
      }
    }

    function forwardPropagation() {
      var allDone;

      do {
        allDone = true;

        _.forEach(neuronList, function (neuron) {
          if (neuron.done) return;
          allDone = false;
          if (neuron.isSumComplete()) neuron.propagateSignal();
        });

      } while (!allDone);
    }

    function getAllLinksInGroups(fromGroup, toGroup) {
      var eligibleLinks = [];

      _.forEach(fromGroup, function (nIn) {
        _.forEach(toGroup, function (nOut) {
          if (links[nIn][nOut] !== null) {
            eligibleLinks.push({from: nIn, to: nOut});
          }
        });
      });

      return eligibleLinks;
    }

    this.updateWeights = function (updateFunction) {
      var neuronIds = _.union(inputNodes, hiddenNodes);
      _.forEach(neuronIds, function (id) {
        _.forEach(links[id], function (weight, index) {
          if (weight !== null) {
            links[id][index] = updateFunction(weight);
          }
        });
      });
    };

    this.removeRandomHiddenNode = function () {
      if (hiddenNodes.length > 0) {
        let node = _.sample(hiddenNodes);
        _.remove(hiddenNodes, node);
        removeLinksFrom(node);
        removeLinksTo(node);
      }
    };

    this.createHiddenNode = function () {
      var i = 0;
      while (i < maximumNumberOfNeuronsInHiddenLayer && hiddenNodes.length < maximumNumberOfNeuronsInHiddenLayer) {
        let nodeId = i + numberOfNeuronsInInputLayer;
        if (!_.includes(hiddenNodes, nodeId)) {
          hiddenNodes.push(nodeId);
          break;
        }
        i++;
      }
    };

    this.removeRandomLink = function (fromClass, toClass) {
      var fromGroup = fromClass === 'hidden' ? hiddenNodes : inputNodes,
          toGroup = toClass === 'hidden' ? hiddenNodes : outputNodes,
          eligibleLinks = getAllLinksInGroups(fromGroup, toGroup),
          linkToRemove = _.sample(eligibleLinks);

      if (linkToRemove) {
        links[linkToRemove.from][linkToRemove.to] = null;
      }
    };

    this.createRandomLink = function (fromClass, toClass) {
      var fromGroup = fromClass === 'hidden' ? hiddenNodes : inputNodes,
          toGroup = toClass === 'hidden' ? hiddenNodes : outputNodes,
          from = _.sample(fromGroup),
          to = _.sample(_.filter(toGroup, _.partial(_.gt, _, from)));
          links[from][to] = 0;
    };

    this.run = function (inputToNetwork) {
      neuronList = _.map(_.union(inputNodes, hiddenNodes, outputNodes), function (neuronId) {
        return new Neuron(neuronId, inputToNetwork[neuronId]);
      });

      forwardPropagation();

      return _.map(outputNodes, function (nid) {
        return _.find(neuronList, {id: nid}).output || 0;
      });
    };

    this.clone = function() {
      return new NeuralNetwork(hiddenNodes.length, _.cloneDeep(links));
    };

    this.getLinkMatrix = function () {
      return links;
    };

    initialize();
  }

  window.geneticNetwork = window.geneticNetwork || {};
  geneticNetwork.NeuralNetwork = NeuralNetwork;
}());
