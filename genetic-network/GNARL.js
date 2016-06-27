(function () {
  'use strict';

  function GNARL(populationSize, evaluate, maxEvaluation) {
    const PROPORTIONALITY_CONSTANT = 1,
          NON_HIDDEN_LINK_PROBABILITY = 0.2,
          NODES_TO_REMOVE = {min: 1, max: 3},
          NODES_TO_ADD = {min: 1, max: 3},
          LINKS_TO_REMOVE = {min: 1, max: 5},
          LINKS_TO_ADD = {min: 1, max: 5};

    var population = [],
        generation = 1;

    function initialize() {
      randomizePopulation();
    }

    function randomizePopulation() {
      var numberOfIndividuals = populationSize - population.length;
      for (let i = 0; i < numberOfIndividuals; i++) {
        var numberOfHiddenNodes = _.random(1, 5);
        population.push(new geneticNetwork.NeuralNetwork(numberOfHiddenNodes));
      }
    }

    function selectParents() {
      var orderedByBest = _.orderBy(population, 'evaluation', 'desc'),
          halfPopulation = Math.floor(populationSize / 2);
      if (orderedByBest.length < halfPopulation) return orderedByBest;
      return _.slice(orderedByBest, 0, halfPopulation);
    }

    function getNetworkTemperature(network) {
      return 1 - network.evaluation / maxEvaluation;
    }

    function mutateParameters(network, severity) {
      network.updateWeights(function (weight) {
        var variance = severity * PROPORTIONALITY_CONSTANT * _.random(0, 1, true),
            newWeight = weight + gaussian.random(0, variance);

        if (newWeight < -1) return -1;
        if (newWeight > 1) return 1;
        return newWeight;
      });
    }

    function getNumberOfStructuralMutations(severity, interval) {
      var severityTerm = _.random(0, 1, true) * _.random(0, 1, true) * severity * (interval.max - interval.min);
      return interval.min + Math.floor(severityTerm);
    }

    function removeNodes(network, severity) {
      var numberOfMutations = getNumberOfStructuralMutations(severity, NODES_TO_REMOVE);
      for (let i = 0; i < numberOfMutations; i++) {
        network.removeRandomHiddenNode();
      }
    }

    function createNodes(network, severity) {
      var numberOfMutations = getNumberOfStructuralMutations(severity, NODES_TO_ADD);
      for (let i = 0; i < numberOfMutations; i++) {
        network.createHiddenNode();
      }
    }

    function randomizeLinkClasses(network) {
      var fromClass = Math.random() > NON_HIDDEN_LINK_PROBABILITY ? 'hidden' : 'input',
          toClass = Math.random() > NON_HIDDEN_LINK_PROBABILITY ? 'hidden' : 'output';

      return {from: fromClass, to: toClass};
    }

    function removeLinks(network, severity) {
      var numberOfMutations = getNumberOfStructuralMutations(severity, LINKS_TO_REMOVE);
      for (let i = 0; i < numberOfMutations; i++) {
        var classes = randomizeLinkClasses(network);
        network.removeRandomLink(classes.from, classes.to);
      }
    }

    function createLinks(network, severity) {
      var numberOfMutations = getNumberOfStructuralMutations(severity, LINKS_TO_ADD);
      for (let i = 0; i < numberOfMutations; i++) {
        var classes = randomizeLinkClasses(network);
        network.createRandomLink(classes.from, classes.to);
      }
    }

    function mutateStructure(network, severity) {
      removeNodes(network, severity);
      createNodes(network, severity);
      removeLinks(network, severity);
      createLinks(network, severity);
    }

    function mutate(network, severity) {
      console.log('mutating');
      mutateParameters(network, severity);
      mutateStructure(network, severity);
    }

    function generateOffspring(parents) {
      var offspring = [];
      _.forEach(parents, function (parent) {
        var child = parent.clone(),
            severityOfMutation = getNetworkTemperature(parent);

        mutate(child, severityOfMutation);
        offspring.push(parent);
        offspring.push(child);
      });
      return offspring;
    }

    this.nextGeneration = function () {
      var parents, offspring;

      _.forEach(population, function (net) {
        var evaluation = evaluate(net);
        if (!net.evaluation || net.evaluation < evaluation) net.evaluation = evaluation;
      });

      parents = selectParents();
      offspring = generateOffspring(parents);
      population = offspring;
      randomizePopulation();
      generation++;
    };

    this.getPopulation = function () {
      return population;
    };

    initialize();
  }

  window.geneticNetwork = window.geneticNetwork || {};
  geneticNetwork.GNARL = GNARL;
}());
