(function () {
  'use strict';

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
    var loadListener;
    var context;
    img.src = path;
    img.addEventListener("load", function() {
      canvas.width = img.width;
      canvas.height = img.height;
      context = canvas.getContext('2d');
      context.drawImage(img, 0, 0);
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
        let x = _.random(img.height - 1);
        let y = _.random(img.width - 1);
        if (self.isFree(x, y) && !foodMatrix[x][y]) {
          foodMatrix[x][y] = true;
          i++;
        }
      }
    }

    function getPixelColorAt(x, y) {
      var data = context.getImageData(0, 0, img.width, img.height).data;
      return new RGB(data[0], data[1], data[2]);
    }

    this.load = function (listener) {
      loadListener = listener;
    };

    this.getFoodMatrix = function() {
      return foodMatrix;
    };

    this.isFree = function(x, y) {
      var color = getPixelColorAt(x, y);
      return color.gte(freeRGBInterval[0]) && color.lte(freeRGBInterval[1]);
    };

    this.hasFood = function(x, y) {
      return foodMatrix[x][y];
    };
  }

  function FoodContainer(foodList, foodMatrix) {
    function printFood(x, y) {
      foodList.append('<li style="top: ' + y +'; left: ' + x +'"></li>');
    }

    this.print = function() {
      foodList.html('');
      for (let i = 0; i < foodMatrix.length; i++) {
        for (let j = 0; j < foodMatrix.length; j++) {
          if (foodMatrix[i][j]) {
            printFood(i, j);
          }
        }
      }
    };
  }

  var map = new Map($('#map')[0], 'map-1.png', [new RGB(191,207,255), new RGB(232, 238, 255)]);
  map.load(function () {
    var foodContainer = new FoodContainer($('.food-list'), map.getFoodMatrix());
    foodContainer.print();
  });
}());
