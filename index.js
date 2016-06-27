(function () {
  'use strict';

  const POPULATION_SIZE = 30,
        MAX_EVALUATION = 1,
        NUMBER_OF_GENERATIONS = 1,
        NUMBER_OF_STEPS = 200,
        NUMBER_OF_FOODS_IN_MAP = 300,
        PRINT_ONLY_BEST_AGENT_OF_PREVIOUS_GENERATION = true;

  var Map = navigation.Map,
      GeneticAlgorithm = geneticNetwork.GNARL,
      //GeneticAlgorithm = geneticNetwork.SimpleGeneticAlgorithm,
      //GeneticAlgorithm = geneticNetwork.RandomSearch,
      Agent = navigation.Agent,
      RGB = navigation.RGB;

  function Environment(mapImagePath, freeRGBInterval, canvas) {
    var genetics, img, gen, mapImageData, defaultFoodMatrix,
        shouldInterruptEvolution, shouldStopAnimation;

    function initialize() {
      loadImage(mapImagePath).then(function () {
        gen = 1;
        drawCanvasAndGetImageData();
        console.log('generation 1');
        genetics = new GeneticAlgorithm(POPULATION_SIZE, evaluateNetwork, MAX_EVALUATION);
        createButtons();
        updateGenerationPanel();
      });
    }

    function evolve(numberOfGenerationsToEvolve, callback) {
      shouldInterruptEvolution = false;
      for (let i = 0; i < numberOfGenerationsToEvolve; i++) {
        if (shouldInterruptEvolution) break;
        gen++;
        console.log('generation ' + gen);
        genetics.nextGeneration();
        console.log('end of generation ' + gen);
        updateGenerationPanel();
      }
      callback();
    }

    function interruptEvolution() {
      shouldInterruptEvolution = true;
    }

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

    function printExecution(callback) {
      var map = new Map(img.width, img.height, mapImageData, freeRGBInterval, defaultFoodMatrix, NUMBER_OF_FOODS_IN_MAP),
          nets = genetics.getPopulation(),
          interval, agents;

      shouldStopAnimation = false;
      clearAgents();
      defaultFoodMatrix = _.cloneDeep(map.getFoodMatrix());

      if (PRINT_ONLY_BEST_AGENT_OF_PREVIOUS_GENERATION) {
        agents = [new Agent(map, nets[0])];
      } else {
        agents = _.map(nets, function (net) {
          return new Agent(map, net);
        });
      }


      printFoodMatrix(map.getFoodMatrix());
      _.forEach(agents, printAgent);

      interval = setInterval(function () {
        _.forEach(agents, executeAndPrintStep);
        printFoodMatrix(map.getFoodMatrix());
        if (shouldStopAnimation) {
          clearInterval(interval);
          callback();
        }
      }, 20);
    }

    function stopAnimation() {
      shouldStopAnimation = true;
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

    function createButtons() {
      createPlayAnimationButton();
      createStopAnimationButton();
      createStartEvolutionButton();
      createInterruptEvolutionButton();
      createExportButton();
      createImportButton();
    }

    function createPlayAnimationButton() {
      $('.ctrl-animation .play').click(function () {
        $(this).attr('disabled', 'disabled');
        $('.ctrl-evolution button').attr('disabled', 'disabled');
        printExecution(function () {
          $('.ctrl-animation .play').removeAttr('disabled');
          $('.ctrl-evolution button').removeAttr('disabled');
        });
      });
    }

    function createStopAnimationButton() {
      $('.ctrl-animation .stop').click(stopAnimation);
    }

    function createStartEvolutionButton() {
      $('.ctrl-evolution .evolve').click(function () {
        $(this).attr('disabled', 'disabled');
        $('.ctrl-animation button').attr('disabled', 'disabled');
        var numberOfGenerations = Number(prompt('Quantas gerações deseja evoluir?'));
        evolve(numberOfGenerations, function () {
          $('.ctrl-evolution .evolve').removeAttr('disabled');
          $('.ctrl-animation button').removeAttr('disabled');
          alert(numberOfGenerations + ' gerações evoluídas com sucesso!');
        });
      });
    }

    function createInterruptEvolutionButton() {
      $('.ctrl-evolution .interrupt').click(interruptEvolution);
    }

    function createExportButton() {
      $('.ctrl-export-import .export').click(save);
    }

    function createImportButton() {
      $('.ctrl-export-import .import input').change(function () {
        var file = _.head(this.files);
        var fr = new FileReader();
        fr.onload = _.partial(importPopulation, file.name);
        fr.readAsText(file);
      });
    }

    function importPopulation(filename, event) {
      var json = JSON.parse(event.target.result);
      gen = json.generation;
      updateGenerationPanel();
      genetics.loadPopulation(json.population);
      alert(filename + ' importado com sucesso!');
    }

    function updateGenerationPanel() {
      $('.generation-panel').html('Geração ' + gen);
    }

    function getNetworkLinks(net) {
      return net.getLinkMatrix();
    }

    function save() {
      var json = {
        generation: gen,
        population: _.map(genetics.getPopulation(), getNetworkLinks)
      };

      var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));

      var a = document.createElement('a');
      a.id = 'download-population';
      a.href = 'data:' + data;
      a.download = 'genetic-network-gen' + gen + '-' + new Date().getTime() + '.json';
      $('body').append(a);
      $('#download-population')[0].click();
      $('#download-population').remove();
    }

    initialize();
  }

  new Environment('map-1-no-obstacles.png', [new RGB(191,207,255), new RGB(232, 238, 255)], $('#map')[0]);
}());
