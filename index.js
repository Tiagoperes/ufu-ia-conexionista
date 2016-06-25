(function () {
  'use strict';

  const POPULATION_SIZE = 1,
        MAX_EVALUATION = 1,
        NUMBER_OF_GENERATIONS = 1,
        NUMBER_OF_STEPS = 10000,
        NUMBER_OF_FOODS_IN_MAP = 300;

  var Map = navigation.Map,
      //GeneticAlgorithm = geneticNetwork.GNARL,
      GeneticAlgorithm = geneticNetwork.SimpleGeneticAlgorithm,
      Agent = navigation.Agent,
      RGB = navigation.RGB;

  function Environment(mapImagePath, freeRGBInterval, canvas) {
    var self = this,
        genetics, img, gen, mapImageData, defaultFoodMatrix;

    function initialize() {
      loadImage(mapImagePath).then(function () {
        gen = 2;
        drawCanvasAndGetImageData();
        console.log('generation 1');
        genetics = new GeneticAlgorithm(POPULATION_SIZE, evaluateNetwork, MAX_EVALUATION);
      });
    }

    window.nextGen = function (gens, print) {
      for (let i = 0; i < gens; i++) {
        console.log('generation ' + gen);
        genetics.nextGeneration();
        console.log('end of generation ' + gen);
        gen++;
      }
      if (print) printExecution();
    };

    function evaluateNetwork(net) {
      var map = new Map(img.width, img.height, mapImageData, freeRGBInterval, defaultFoodMatrix, NUMBER_OF_FOODS_IN_MAP),
          agent = new Agent(map, net);

      defaultFoodMatrix = _.cloneDeep(map.getFoodMatrix());

      //console.log('ok');

      for (let i = 0; i < NUMBER_OF_STEPS; i++) {
        agent.next();
      }

      console.log('foodsEaten: ' + agent.getNumberOfFoodsEaten());
      return agent.getNumberOfFoodsEaten() / NUMBER_OF_FOODS_IN_MAP;
    }

    function loadImage(path) {
      var deferred = $.Deferred();

      img = new Image();
      img.src = path;
      img.addEventListener("load", deferred.resolve, false);
      return deferred.promise();
    }

    function drawCanvasAndGetImageData() {
      var context;
      canvas.width = img.width;
      canvas.height = img.height;
      context = canvas.getContext('2d');
      context.drawImage(img, 0, 0);
      mapImageData = context.getImageData(0, 0, img.width, img.height).data;
    }

    function printAgent(agent) {
      $('body').append('<div id="agent-' + agent.id + '" class="agent"></div>');
    }

    function updateAgentPosition(agent) {
      $('#agent-' + agent.id).css({
        top: agent.getPosition().y,
        left: agent.getPosition().x,
        backgroundColor: 'red'
      }).attr('class', 'agent direction-' + agent.getDirection());
    }

    function clearAgents() {
      $('.agent').remove();
    }

    function printExecution() {
      var map = new Map(img.width, img.height, mapImageData, freeRGBInterval, defaultFoodMatrix, NUMBER_OF_FOODS_IN_MAP),
          nets = genetics.getPopulation(),
          steps = 0,
          interval, agents;

      clearAgents();
      defaultFoodMatrix = _.cloneDeep(map.getFoodMatrix());
      window.stopThisShit = false;

      agents = _.map(nets, function (net) {
        return new Agent(map, net);
      });

      printFoodMatrix(map.getFoodMatrix());
      _.forEach(agents, printAgent);

      interval = setInterval(function () {
        _.forEach(agents, executeAndPrintStep);
        printFoodMatrix(map.getFoodMatrix());
        steps++;
        if (steps === NUMBER_OF_STEPS || window.stopThisShit) clearInterval(interval);
      }, 20);
    }

    function executeAndPrintStep(agent) {
      agent.next();
      updateAgentPosition(agent);
    }

    function printFoodAt(x, y) {
      $('.food-list').append('<li style="top: ' + y +'px; left: ' + x +'px"></li>');
    }

    function printFoodMatrix(foodMatrix) {
      $('.food-list').html('');
      for (let i = 0; i < foodMatrix.length; i++) {
        for (let j = 0; j < foodMatrix[i].length; j++) {
          if (foodMatrix[i][j]) {
            printFoodAt(j, i);
          }
        }
      }
    }

    initialize();
  }

  new Environment('map-1-no-obstacles.png', [new RGB(191,207,255), new RGB(232, 238, 255)], $('#map')[0]);
}());
