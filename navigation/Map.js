(function () {
  'use strict';

  const FOOD_WIDTH = 10,
        FOOD_HEIGHT = 10;

  function Map(width, height, imageData, freeRGBInterval, foodMatrix, numberOfInitialFoods) {
    var self = this,
        RGB = navigation.RGB;

    function initialize() {
      if (!foodMatrix) {
        createFoodMatrix();
        generateFood(numberOfInitialFoods);
      }
    }

    function createFoodMatrix() {
      foodMatrix = [];
      for (let i = 0; i < height; i++) {
        foodMatrix[i] = [];
      }
    }

    function generateFood(numberOfFoods) {
      var i = 0;
      while (i < numberOfFoods) {
        let x = _.random(width - 1);
        let y = _.random(height - 1);
        if (self.isRegionFree(x, y, FOOD_WIDTH, FOOD_HEIGHT) && !foodMatrix[y][x]) {
          foodMatrix[y][x] = true;
          i++;
        } else {
          //console.log('retrying');
        }
      }
    }

    function getPixelColorAt(x, y) {
      var base = (y * width + x) * 4;
      return new RGB(imageData[base], imageData[base + 1], imageData[base + 2]);
    }

    this.getFoodMatrix = function () {
      return foodMatrix;
    };

    this.isFree = function (x, y) {
      var color;
      if (x >= width || x < 0 || y >= height || y < 0) return false;
      color = getPixelColorAt(x, y);
      return color.gte(freeRGBInterval[0]) && color.lte(freeRGBInterval[1]);
    };

    this.hasFood = function (x, y) {
      return x >= 0 && x < width && y >= 0 && y < height && foodMatrix[y][x];
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

      for(let i = x - wOffset; i <= x + wOffset; i++) {
        for(let j = y - hOffset; j <= y + hOffset; j++) {
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

    this.getWidth = function() {
      return width;
    };

    this.getHeight = function() {
      return height;
    };

    initialize();
  }

  window.navigation = window.navigation || {};
  navigation.Map = Map;
}());
