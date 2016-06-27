(function () {
  'use strict';

  const INPUT = 3,
    HIDDEN = 4,
    OUTPUT = 3;

  function RandomSearch(populationSize, evaluate) {
    var population;

    function initialize() {
      randomizePopulation();
    }

    function randomizePopulation() {
      population = [];
      for (let i = 0; i < populationSize; i++) {
        population.push(new geneticNetwork.MLP(INPUT, HIDDEN, OUTPUT));
      }
    }

    function evaluatePopulation() {
      _.forEach(population, function (individual) {
        individual.timesEvaluated = individual.timesEvaluated || 0;
        individual.timesEvaluated++;
        individual.allTimeEvaluation = individual.allTimeEvaluation || 0;
        individual.allTimeEvaluation += evaluate(individual);
        individual.evaluation = individual.allTimeEvaluation / individual.timesEvaluated;
      });
    }

    function orderPopulationByEvaluation() {
      population = _.orderBy(population, 'evaluation', 'desc');
    }

    this.getPopulation = function () {
      return population;
    };

    this.nextGeneration = function () {
      var oldPopulation = population;
      randomizePopulation();
      population = _.union(oldPopulation, population);
      evaluatePopulation();
      orderPopulationByEvaluation();
      population = _.slice(population, 0, populationSize);
    };

    this.loadPopulation = function (linkMatrices) {
      population = _.map(linkMatrices, function (linkMatrix) {
        return new geneticNetwork.MLP(INPUT, HIDDEN, OUTPUT, linkMatrix);
      });
    };

    initialize();
  }

  window.geneticNetwork = window.geneticNetwork || {};
  geneticNetwork.RandomSearch = RandomSearch;
}());
