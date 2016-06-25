(function () {
  'use strict';

  const ROTATION_DEGREE = 45,
        MAX_VISION = 500,
        DIRECTIONS = {
          right: 0,
          rtop: 45,
          top: 90,
          ltop: 135,
          left: 180,
          ldown: 225,
          down: 270,
          rdown: 315
        },
        ACTIONS = {
          stop: 0,
          move: 1,
          rotateLeft: 2,
          rotateRight: 3
        };

  var incrementalId = 0;

  function Agent(map, network, width, height) {
    var self = this,
        direction, foodEaten, position;

    function initialize() {
      self.id = incrementalId++;
      width = width || 10;
      height = height || 10;
      foodEaten = 0;
      position = generateRandomPosition();
      //position = {x: width / 2, y: height / 2};
      direction = DIRECTIONS.right;
    }

    function generateRandomPosition() {
      var halfWidth = Math.ceil(width / 2),
          halfHeight = Math.ceil(height / 2),
          x, y;

      do {
        x = _.random(halfWidth, map.getWidth() - halfWidth);
        y = _.random(halfHeight, map.getHeight() - halfHeight);
      } while (!map.isRegionFree(x, y, width, height));

      return {x: x, y: y};
    }

    function isNextPositionAccessible() {
      var nextPosition = getNewPositionForMove();
      return map.isRegionFree(nextPosition.x, nextPosition.y, width, height);
    }

    function getDistanceToNextFood() {
      var diffs = getDiffsForMove(),
          halfSize = Math.floor(width / 2),
          x = position.x,
          y = position.y,
          i = 0,
          food;

      //function hasFoodInNewBorder() {
      //  var halfSize = Math.ceil(width / 2),
      //      edge = {x: x + halfSize * diffs.dx, y: y + halfSize * diffs.dy};
      //
      //  for (let i = -halfSize; i < halfSize; i++) {
      //    if (map.hasFood(edge.x - i * diffs.dy, edge.y + i * diffs.dx)) return true;
      //  }
      //}

      function getFoodInNewBorder(radius) {
        var perimeter = Math.sqrt(Math.pow(radius / Math.sin((3/8) * Math.PI), 2) - Math.pow(radius, 2)),
            halfPerimeter = Math.floor(perimeter / 2),
            edge;

        if (halfPerimeter < halfSize) halfPerimeter = halfSize;
        edge = {x: x + halfPerimeter * diffs.dx, y: y + halfPerimeter * diffs.dy};

        for (let i = -halfPerimeter; i < halfPerimeter; i++) {
          var posX = edge.x - i * diffs.dy,
              posY = edge.y + i * diffs.dx;
          if (map.hasFood(posX, posY)) {
            return {dx: Math.abs(position.x - posX), dy: Math.abs(position.y - posY)};
          }
        }
      }

      //while (i < MAX_VISION && !hasFoodInNewBorder()) {
      while (i < MAX_VISION && !food) {
        food = getFoodInNewBorder(halfSize + i);
        x += diffs.dx;
        y += diffs.dy;
        i++;
        if (!map.isFree(x, y)) i = MAX_VISION;
      }

      return food;
    }

    function getActionFromNeuralNetwork() {
      var distanceToFood = getDistanceToNextFood(),
          distanceX = distanceToFood ? distanceToFood.dx / MAX_VISION : 1,
          distanceY = distanceToFood ? distanceToFood.dy / MAX_VISION : 1,
          answer = network.run([1, Number(isNextPositionAccessible()), Number(!!distanceToFood), distanceX, distanceY]);
          //y0 = Math.round(answer[0]),
          //y1 = Math.round(answer[1]);

      //return y0 + y1 * 2;
      return _.indexOf(answer, _.max(answer));
    }

    function generateRandomAction() {
      return _.sample(_.values(ACTIONS));
    }

    function getDiffsForMove() {
      var movementByDirection = {};

      movementByDirection[DIRECTIONS.right] = {dx: 1, dy: 0};
      movementByDirection[DIRECTIONS.rtop] = {dx: 1, dy: -1};
      movementByDirection[DIRECTIONS.top] = {dx: 0, dy: -1};
      movementByDirection[DIRECTIONS.ltop] = {dx: -1, dy: -1};
      movementByDirection[DIRECTIONS.left] = {dx: -1, dy: 0};
      movementByDirection[DIRECTIONS.ldown] = {dx: -1, dy: 1};
      movementByDirection[DIRECTIONS.down] = {dx: 0, dy: 1};
      movementByDirection[DIRECTIONS.rdown] = {dx: 1, dy: 1};

      return movementByDirection[direction];
    }

    function getNewPositionForMove() {
      var movement = getDiffsForMove();
      return {x: position.x + movement.dx, y: position.y + movement.dy};
    }

    function eatFoodInArea() {
      var foods = map.getFoodsInRegion(position.x, position.y, width, height);

      _.forEach(foods, function (food) {
        //console.log('food!');
        foodEaten++;
        map.removeFoodAt(food.x, food.y);
      });
    }

    function move() {
      var newPosition = getNewPositionForMove();

      if (!map.isRegionFree(newPosition.x, newPosition.y, width, height)) {
        //console.log('collided');
        return;
      }

      position = newPosition;
      eatFoodInArea();
    }

    function rotate(degrees) {
      direction = (direction + degrees) % 360;
      if (direction < 0) direction = 360 + direction;
    }

    this.next = function () {
      var action = getActionFromNeuralNetwork(),
      //var action = generateRandomAction(),
          consequences = {};

      consequences[ACTIONS.move] = move;
      consequences[ACTIONS.rotateLeft] = _.partial(rotate, ROTATION_DEGREE);
      consequences[ACTIONS.rotateRight] = _.partial(rotate, -ROTATION_DEGREE);
      consequences[ACTIONS.stop] = _.identity;

      consequences[action]();
    };

    this.getPosition = function() {
      return _.clone(position);
    };

    this.getNumberOfFoodsEaten = function () {
      return foodEaten;
    };

    this.getDirection = function () {
      return direction;
    };

    initialize();
  }

  window.navigation = window.navigation || {};
  navigation.Agent = Agent;
}());
