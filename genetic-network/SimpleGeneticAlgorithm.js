(function () {
  'use strict';

  const INPUT = 3,
        HIDDEN = 4,
        OUTPUT = 3;

  var biasedLinks = [
    [null, null, null, -1, 0, 0, 0, null, null, null],
    [null, null, null, 1, -1, 0, 0, null, null, null],
    [null, null, null, 0, 0, 1, -1, null, null, null],
    [null, null, null, null, null, null, null, 1, 0, 0],
    [null, null, null, null, null, null, null, 0, 1, 1],
    [null, null, null, null, null, null, null, 0, 1, 0],
    [null, null, null, null, null, null, null, 0, 0, 1],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null, null]
  ];

  function SimpleGeneticAlgorithm(populationSize, evaluate, maxEvaluation) {
    const KEEP_PARENTS_RATE = 0.2,
          MUTATION_RATE = 0.5;

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

    function getMinNonZeroEvaluation() {
      var i = population.length - 1;
      while (i >= 0 && population[i].evaluation === 0) i--;
      return _.get(population[i], 'evaluation') || 1;
    }

    function roulette() {
      var min, total, rand, sum;

      min = getMinNonZeroEvaluation();

      total = _.reduce(population, function (sum, nn) {
        return sum + (nn.evaluation || min);
      }, 0);

      rand = _.random(0, total, true);
      sum = 0;

      for (let i = 0; i < population.length; i++) {
        sum += (population[i].evaluation || min);
        if (rand <= sum) return population[i];
      }
    }

    function crossover(parent1, parent2) {
      var parent1Links = parent1.getLinkMatrix(),
          parent2Links = parent2.getLinkMatrix(),
          crossoverPointI = _.random(1, parent1Links.length),
          crossoverPointJ = _.random(1, parent1Links[0].length),
          links1 = [],
          links2 = [];

      for (let i = 0; i < parent1Links.length; i++) {
        links1[i] = [];
        links2[i] = [];
        for (let j = 0; j < parent1Links[i].length; j++) {
          if (i < crossoverPointI && j < crossoverPointJ) {
            links1[i][j] = parent1Links[i][j];
            links2[i][j] = parent2Links[i][j];
          } else {
            links1[i][j] = parent2Links[i][j];
            links2[i][j] = parent1Links[i][j];
          }
        }
      }

      return [
        new geneticNetwork.MLP(INPUT, HIDDEN, OUTPUT, links1),
        new geneticNetwork.MLP(INPUT, HIDDEN, OUTPUT, links2)
      ];
    }

    function mutate(individual, parent1Evaluation, parent2Evaluation) {
      var evalMean = parent1Evaluation + parent2Evaluation / 2,
          mutationChance = MUTATION_RATE * (maxEvaluation - evalMean);
      if (_.random(0, maxEvaluation, true) < mutationChance) {
        let severity = gaussian.random(0, mutationChance);
        individual.updateWeights(function (weight) {
          var w = weight + severity;
          if (w < -1) w = -1;
          if (w > 1) w = 1;
          return w;
        });
      }
      return individual;
    }

    function generateOffspring() {
      var parent1 = roulette(),
          parent2 = roulette();

      return _.map(crossover(parent1, parent2), _.partial(mutate, _, parent1.evaluation, parent2.evaluation));
    }

    function completePopulationWithOffspring(newPopulation) {
      while (newPopulation.length < populationSize) {
        let children = generateOffspring();
        newPopulation.push(children[0]);
        if (newPopulation.length < populationSize) newPopulation.push(children[1]);
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
      var newPopulation;

      evaluatePopulation();
      orderPopulationByEvaluation();
      newPopulation = _.slice(population, 0, Math.floor(KEEP_PARENTS_RATE * populationSize));
      completePopulationWithOffspring(newPopulation);
      population = newPopulation;
    };

    this.loadPopulation = function (linkMatrices) {
      population = _.map(linkMatrices, function (linkMatrix) {
        return new geneticNetwork.MLP(INPUT, HIDDEN, OUTPUT, linkMatrix);
      });
    };

    initialize();
  }

  window.geneticNetwork = window.geneticNetwork || {};
  geneticNetwork.SimpleGeneticAlgorithm = SimpleGeneticAlgorithm;
}());
