(function () {
  'use strict';

  const FOOD_WIDTH = 10,
        FOOD_HEIGHT = 10,
        SMELL_AREA = 500,
        POPULATION_SIZE = 50;

  function RGB(red, green, blue) {
    this.red = red;
    this.blue = green;
    this.green = blue;

    this.gte = function (rgba) {
      return this.red >= rgba.red && this.blue >= rgba.blue && this.green >= rgba.green;
    };

    this.lte = function (rgba) {
      return this.red <= rgba.red && this.blue <= rgba.blue && this.green <= rgba.green;
    }
  }

  function Map(canvas, path, freeRGBInterval) {
    var img = new Image();
    var self = this;
    var foodMatrix;
    var imageData;
    var loadListener;
    var context;
    img.src = path;
    img.addEventListener("load", function () {
      canvas.width = img.width;
      canvas.height = img.height;
      context = canvas.getContext('2d');
      context.drawImage(img, 0, 0);
      imageData = context.getImageData(0, 0, img.width, img.height).data;
      createFoodMatrix();
      generateFood(100);
      if (loadListener) loadListener();
    }, false);

    function createFoodMatrix() {
      foodMatrix = [];
      for (let i = 0; i < img.height; i++) {
        foodMatrix[i] = [];
      }
    }

    function generateFood(numberOfFoods) {
      var i = 0;
      while (i < numberOfFoods) {
        let x = _.random(img.width - 1);
        let y = _.random(img.height - 1);
        if (self.isRegionFree(x, y, FOOD_WIDTH, FOOD_HEIGHT) && !foodMatrix[y][x]) {
          foodMatrix[y][x] = true;
          i++;
        } else {
          console.log('retrying');
        }
      }
    }

    function getPixelColorAt(x, y) {
      var base = (y * img.width + x) * 4;
      return new RGB(imageData[base], imageData[base + 1], imageData[base + 2]);
    }


    this.load = function (listener) {
      loadListener = listener;
    };

    this.getFoodMatrix = function () {
      return foodMatrix;
    };

    this.isFree = function (x, y) {
      var color;
      if (x >= img.width || x < 0 || y >= img.height || y < 0) return false;
      color = getPixelColorAt(x, y);
      return color.gte(freeRGBInterval[0]) && color.lte(freeRGBInterval[1]);
    };

    this.hasFood = function (x, y) {
      return x >= 0 && x < img.width && y >= 0 && y < img.height && foodMatrix[y][x];
    };

    this.removeFoodAt = function (x, y) {
      foodMatrix[y][x] = false;
    };

    this.createFoodAt = function (x, y) {
      foodMatrix[y][x] = true;
    };

    this.getFoodsInRegion = function (x, y, width, height) {
      var wOffset = width / 2,
          hOffset = height / 2,
          foods = [];

      for(let i = x - wOffset; i < x + wOffset; i++) {
        for(let j = y - hOffset; j < y + hOffset; j++) {
          if (self.hasFood(i, j)) {
            foods.push({x: i, y: j});
          }
        }
      }

      return foods;
    };

    this.isRegionFree = function (x, y, width, height) {
      var wOffset = width / 2,
          hOffset = height / 2;

      for(let i = x - wOffset; i < x + wOffset; i++) {
        for(let j = y - hOffset; j < y + hOffset; j++) {
          if (!self.isFree(i, j)) return false;
        }
      }

      return true;
    };
  }

  function FoodContainer(foodList, foodMatrix) {
    function printFood(x, y) {
      foodList.append('<li style="top: ' + y +'px; left: ' + x +'px"></li>');
    }

    this.print = function () {
      foodList.html('');
      for (let i = 0; i < foodMatrix.length; i++) {
        for (let j = 0; j < foodMatrix[i].length; j++) {
          if (foodMatrix[i][j]) {
            printFood(j, i);
          }
        }
      }
    };
  }

  function NeuralNetwork(agent, weights) {
    weights = weights || [generateRandomWeights(10, 5), generateRandomWeights(5, 2)];

    function generateRandomWeights(neuronsOnLayerA, neuronsOnLayerB) {
      var matrix = [];
      for (let i = 0; i < neuronsOnLayerA; i ++) {
        matrix[i] = [];
        for (let j = 0; j < neuronsOnLayerB; j++) {
          matrix[i][j] = _.random(-1, 1, true);
        }
      }
      return matrix;
    }

    function getDataIn() {
      var foodDirection = agent.getFoodVector();
      return [
        [
          agent.preview(Agent.N),
          agent.preview(Agent.S),
          agent.preview(Agent.E),
          agent.preview(Agent.W),
          agent.preview(Agent.NE),
          agent.preview(Agent.NW),
          agent.preview(Agent.SE),
          agent.preview(Agent.SW),
          foodDirection.x,
          foodDirection.y
        ]
      ];
    }

    function sigmoid(x) {
      //return (1 - Math.pow(Math.E, -x)) / (1 + Math.pow(Math.E, -x));
      //if (x <= -4) return -1;
      //if (x <= 3) return 0;
      //return 1;
      return x <= 0 ? -1 : 1;
    }

    function multiplyMatrices(m1, m2) {
      var result = [];
      for (var i = 0; i < m1.length; i++) {
        result[i] = [];
        for (var j = 0; j < m2[0].length; j++) {
          var sum = 0;
          for (var k = 0; k < m1[0].length; k++) {
            sum += m1[i][k] * m2[k][j];
          }
          result[i][j] = sum;
        }
      }
      return result;
    }

    function mapMatrix(m, func) {
      for (let i = 0; i < m.length; i++) {
        for (let j = 0; j < m[0].length; j++) {
          m[i][j] = func(m[i][j]);
        }
      }
      return m;
    }

    function sum(l) {
      return multiplyMatrices(activation(l - 1), weights[l - 1]);
    }

    function activation(l) {
      return l === 0 ? getDataIn() : mapMatrix(sum(l), sigmoid);
    }

    this.run = function () {
      return activation(2);
    };

    this.getWeights = function () {
      return weights;
    }
  }

  function Agent(map, speed, weights, width, height) {
    const INITIAL_ENERGY = 100;

    var energy = INITIAL_ENERGY,
        net = new NeuralNetwork(this, weights),
        position;

    this.lifetime = 0;
    this.id = Agent.incrementalId();

    speed = speed || 1;
    width = width || 10;
    height = height || 10;
    position = {x: width / 2, y: height / 2};

    function generateRandomMovement() {
      return {
        dx: _.random(-1, 1),
        dy: _.random(-1, 1)
      }
    }

    function generateNetworkMovement() {
      var movement = net.run();

      function normalize(value) {
        if (value <= -0.4) return -1;
        if (value <= 0.3) return 0;
        return 1;
      }

      return {dx: movement[0][0], dy: movement[0][1]};
      //return {dx: normalize(movement.e(1, 1)), dy: normalize(movement.e(1, 2))};
    }

    function turnIntoFood() {
      map.createFoodAt(position.x, position.y)
    }

    this.move = function () {
      //var movement = generateRandomMovement(),
      var movement = generateNetworkMovement(),
          newX = position.x + movement.dx * speed,
          newY = position.y + movement.dy * speed,
          foods;

      energy--;

      if (!map.isRegionFree(newX, newY, width, height)) {
        console.log('collided');
        energy -= 10;
        if (energy <= 0) turnIntoFood();
        return;
      }

      foods = map.getFoodsInRegion(newX, newY, width, height);
      _.forEach(foods, function (food) {
        console.log('food!');
        energy += 20;
        map.removeFoodAt(food.x, food.y);
      });

      position.x = newX;
      position.y = newY;

      if (energy <= 0) turnIntoFood();
    };

    this.getEnergy = function () {
      return energy / INITIAL_ENERGY;
    };

    this.getPosition = function() {
      return _.clone(position);
    };

    this.preview = function (direction) {
      var x = position.x + direction[0] * speed,
          y = position.y + direction[1] * speed;

      if (!map.isFree(x, y)) return -1;
      if (map.hasFood(x, y)) return 1;
      return 0;
    };

    this.getFoodVector = function() {
      var directions = {x: 0, y: 0},
          offset = SMELL_AREA / 2;

      for (let i =  -offset; i < offset; i++) {
        if ((position.x + i) < 0) i = -position.x;
        for (let j =  -offset; j < offset; j++) {
          if ((position.y + j) < 0) j = -position.y;
          if (map.hasFood(position.x + i, position.y + j)) {
            if (i !== 0) directions.x += 1 / i;
            if (j !== 0) directions.y += 1 / j;
          }
        }
      }

      if (directions.x < 0) directions.x = -1;
      if (directions.x > 0) directions.x = 1;
      if (directions.y < 0) directions.y = -1;
      if (directions.y > 0) directions.y = 1;
      return directions;
    };

    this.getNeuralNetwork = function() {
      return net;
    };
  }

  Agent.N = [0, -1];
  Agent.S = [0, 1];
  Agent.E = [1, 0];
  Agent.W = [-1, 0];
  Agent.NE = [1, -1];
  Agent.NW = [-1, -1];
  Agent.SE = [1, 1];
  Agent.SW = [-1, 1];
  Agent.incId = 0;
  Agent.incrementalId = function () {
    return Agent.incId++;
  };

  function printAgent(agent) {
    var element = $('#agent-' + agent.id);
    if (!element.length) {
      $('body').append('<div id="agent-' + agent.id + '" class="agent"></div>');
      element = $('#agent-' + agent.id);
    }
    agent.color = agent.color || 'red';
    element.css({
      top: agent.getPosition().y,
      left: agent.getPosition().x,
      opacity: agent.getEnergy(),
      backgroundColor: agent.color
    });
  }

  function clearAgents() {
    $('.agent').remove();
  }

  function Genetics(populationSize, map) {
    const colors = ['red', 'green', 'blue', 'black', 'brown', 'darkgray', 'coral', 'chocolate', 'darkmagenta', 'indianred', 'springgreen'];

    var population = [],
        genNumber = 1;

    function createRandomPopulation() {
      for (let i = 0; i < populationSize; i++) {
        let agent = new Agent(map, 10);
        agent.color = colors[i % colors.length];
        population.push(agent);
      }
    }

    function selectBest(quantity) {
      return _.slice(_.orderBy(population, 'lifetime', 'desc'), 0, quantity);
    }

    function takeMeanMatrix(matrixA, matrixB) {
      return matrixA.map(function (element, i, j) {
        return (element + matrixB[i][j]) / 2;
      });
    }

    function takeMeanWeights(weightsA, weightsB) {
      return _.map(weightsA, function (weightMatrix, i) {
        return takeMeanMatrix(weightMatrix, weightsB[i]);
      });
    }

    function crossover(a, b) {
      var netA = a.getNeuralNetwork(),
          netB = b.getNeuralNetwork(),
          weights = takeMeanWeights(netA.getWeights(), netB.getWeights()),
          resultingAgent = new Agent(map, 10, weights);

      resultingAgent.color = a.color;
      return resultingAgent;
    }

    this.nextGeneration = function() {
      var best = selectBest(Math.floor(populationSize * 0.3)),
          newPopulation = _.map(best, function (agent) {
            return new Agent(map, 10, agent.getNeuralNetwork().getWeights());
          });

      while (newPopulation.length < populationSize) {
        let a = _.sample(best);
        let b = _.sample(best);
        newPopulation.push(crossover(a, b));
      }

      population = newPopulation;
      genNumber++;
    };

    this.getGenerationNumber = function() {
      return genNumber;
    };

    this.getPopulation = function() {
      return population;
    };

    createRandomPopulation();
  }

  var map = new Map($('#map')[0], 'map-1.png', [new RGB(191,207,255), new RGB(232, 238, 255)]);
  map.load(function () {
    var foodContainer = new FoodContainer($('.food-list'), map.getFoodMatrix());
    //var agent = new Agent(map, 10);
    //foodContainer.print();
    //printAgent(agent);
    //setInterval(function () {
    //  if (agent.getEnergy() > 0) {
    //    agent.move();
    //    foodContainer.print();
    //    printAgent(agent);
    //  }
    //}, 50)

    function runRoutine(callback, print) {
      var interval = setInterval(function () {
        var deaths = 0;
        _.forEach(genetics.getPopulation(), function (agent) {
          if (agent.getEnergy() > 0) {
            agent.move();
            agent.lifetime++;
            if (print) printAgent(agent);
          }
          else deaths++;

          if (deaths === POPULATION_SIZE) {
            clearInterval(interval);
            callback();
          }
        });
        if (print) foodContainer.print();
      }, 0);
    }

    function goNextGen() {
      if (genetics.getGenerationNumber() < 10) {
        genetics.nextGeneration();
        clearAgents();
        console.log('Generation ' + genetics.getGenerationNumber());
        runRoutine(goNextGen, true);
      }
    }

    var genetics = new Genetics(POPULATION_SIZE, map);
    console.log('Generation ' + genetics.getGenerationNumber());
    _.forEach(genetics.getPopulation(), function (agent) {
      printAgent(agent);
    });
    foodContainer.print();
    runRoutine(goNextGen, true);

    foodContainer.print();

  });
}());
