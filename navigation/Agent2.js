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
          move: 0,
          rotateRight: 1,
          rotateLeft: 2
        };

  var incrementalId = 0,
    movementByDirection = {};

  movementByDirection[DIRECTIONS.right] = {dx: 1, dy: 0};
  movementByDirection[DIRECTIONS.rtop] = {dx: 1, dy: -1};
  movementByDirection[DIRECTIONS.top] = {dx: 0, dy: -1};
  movementByDirection[DIRECTIONS.ltop] = {dx: -1, dy: -1};
  movementByDirection[DIRECTIONS.left] = {dx: -1, dy: 0};
  movementByDirection[DIRECTIONS.ldown] = {dx: -1, dy: 1};
  movementByDirection[DIRECTIONS.down] = {dx: 0, dy: 1};
  movementByDirection[DIRECTIONS.rdown] = {dx: 1, dy: 1};

  function Agent(map, network, width, height) {
    var self = this,
        direction, foodEaten, position;

    function initialize() {
      self.id = incrementalId++;
      width = width || 10;
      height = height || 10;
      foodEaten = 0;
      position = generateRandomPosition();
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

    function getClosestFoodAtDistance(distance) {
      var moveDirection = getDiffsForMove();
      var directionList = [[1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1]];
      var dirIndex = _.findIndex(directionList, function (dir) {
        return dir[0] === moveDirection.dx && dir[1] === moveDirection.dy;
      });
      for (let i = 0; i < directionList.length; i++) {
        let sourceIndex = (dirIndex + i) % directionList.length;
        let destinationIndex = (dirIndex + i + 1) % directionList.length;
        let source = [position.x + distance * directionList[sourceIndex][0], position.y + distance * directionList[sourceIndex][1]];
        let destination = [position.x + distance * directionList[destinationIndex][0], position.y + distance * directionList[destinationIndex][1]];
        let dx = Math.abs(destination[0] - source[0]);
        let xIncrease = (destination[0] - source[0]) / distance;
        let dy = Math.abs(destination[1] - source[1]);
        let yIncrease = (destination[1] - source[1]) / distance;
        for (let j = 0; j <= dx; j++) {
          for (let k = 0; k <= dy; k++) {
            let posX = source[0] + j * xIncrease;
            let posY = source[1] + k * yIncrease;
            if (map.hasFood(posX, posY)) return {x: posX, y: posY};
            if (!map.isFree(posX, posY)) {
              j = dx + 1;
              k = dy + 1;
            }
          }
        }
      }
    }

    function convertToRelativePosition(pos) {
      var facing = movementByDirection[direction],
          rightAngle = direction - 90,
          atRight;

      if (rightAngle < 0) rightAngle = 360 + rightAngle;
      atRight = movementByDirection[rightAngle];

      return {
        vertical: facing.dx * pos.x + facing.dy * pos.y,
        horizontal: atRight.dx * pos.x + atRight.dy * pos.y
      };
    }

    function normalizeVisionSensorData(data) {
      return _.mapValues(data, function (value) {
        return value / MAX_VISION;
      });
    }

    function getClosestFood() {
      var food, halfSize = Math.floor(width / 2), i = halfSize;
      while (!food && i < MAX_VISION + halfSize) {
        food = getClosestFoodAtDistance(i);
        i++;
      }
      return food;
    }

    function getRelativeDistanceToPoint(point) {
      if (point) {
        let distance = {x: point.x - position.x, y: point.y - position.y};
        return normalizeVisionSensorData(convertToRelativePosition(distance));
      }
      return {vertical: 1, horizontal: 1};
    }

    function getActionFromNeuralNetwork() {
      var closestFood = getClosestFood();
      var distance = getRelativeDistanceToPoint(closestFood);
      var answer = network.run([isNextPositionAccessible() ? 1 : -1, distance.vertical, distance.horizontal]);
      return _.indexOf(answer, _.max(answer));
    }

    function getDiffsForMove() {
      return movementByDirection[direction];
    }

    function getNewPositionForMove() {
      var movement = getDiffsForMove();
      return {x: position.x + movement.dx, y: position.y + movement.dy};
    }

    function eatFoodInArea() {
      var foods = map.getFoodsInRegion(position.x, position.y, width, height);

      _.forEach(foods, function (food) {
        foodEaten++;
        map.removeFoodAt(food.x, food.y);
      });
    }

    function move() {
      var newPosition = getNewPositionForMove();
      if (!map.isRegionFree(newPosition.x, newPosition.y, width, height)) {
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
          consequences = {};

      consequences[ACTIONS.move] = move;
      consequences[ACTIONS.rotateLeft] = _.partial(rotate, ROTATION_DEGREE);
      consequences[ACTIONS.rotateRight] = _.partial(rotate, -ROTATION_DEGREE);

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
