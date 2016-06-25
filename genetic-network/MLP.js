(function () {
  'use strict';

  function MLP(input, hidden, output, links) {
    var totalNodes = input + hidden + output;

    function initialize() {
      if (!links) createLinks();
    }

    function createLinks() {
      createLinkStructure();
      createLinksFromInputLayerToHiddenLayer();
      createLinksFromHiddenLayerToOutputLayer();
    }

    function createLinkStructure() {
      links = [];
      for (let i = 0; i < totalNodes; i++) {
        links[i] = [];
        for (let j = 0; j < totalNodes; j++) {
          links[i][j] = null;
        }
      }
    }

    function createLinksFromInputLayerToHiddenLayer() {
      for (let i = 0; i < input; i++) {
        for (let j = input; j < input + hidden; j++) {
          links[i][j] = _.random(-1, 1, true);
        }
      }
    }

    function createLinksFromHiddenLayerToOutputLayer() {
      for (let i = input; i < input + hidden; i++) {
        for (let j = input + hidden; j < totalNodes; j++) {
          links[i][j] = _.random(-1, 1, true);
        }
      }
    }

    function createList(begin, end) {
      var list = [];
      for (let i = begin; i < end; i++) {
        list.push(i);
      }
      return list;
    }

    function getIncomingNodes(node) {
      if (node >= input && node < input + hidden) return createList(0, input);
      if (node >= input + hidden) return createList(input, input + hidden);
      return [];
    }

    function getSum(incomingNodes, targetNode, values) {
      return _.reduce(incomingNodes, function (sum, node) {
        return sum + values[node] * links[node][targetNode];
      }, 0);
    }

    function activation(x) {
      return x;
    }

    function forwardPropagation(values) {
      while (values.length < totalNodes) {
        let node = values.length;
        let sum = getSum(getIncomingNodes(node), node, values);
        values.push(activation(sum));
      }
    }

    this.run = function (inputValues) {
      _.forEach(inputValues, function (x) {
        if (isNaN(x)) {
          debugger;
        }
      });

      forwardPropagation(inputValues);
      return _.slice(inputValues, input + hidden, totalNodes);
    };

    this.updateWeights = function (updateFunction) {
      for (let i = 0; i < links.length; i++) {
        for (let j = 0; j < links[i].length; j++) {
          if (links[i][j] !== null) {
            links[i][j] = updateFunction(links[i][j]);
          }
        }
      }
    };

    this.getLinkMatrix = function () {
      return links;
    };

    initialize();
  }

  window.geneticNetwork = window.geneticNetwork || {};
  geneticNetwork.MLP = MLP;
}());
