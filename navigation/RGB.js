(function () {
  'use strict';

  function RGB(red, green, blue) {
    this.red = red;
    this.blue = green;
    this.green = blue;

    this.gte = function (rgb) {
      return this.red >= rgb.red && this.blue >= rgb.blue && this.green >= rgb.green;
    };

    this.lte = function (rgb) {
      return this.red <= rgb.red && this.blue <= rgb.blue && this.green <= rgb.green;
    }
  }

  window.navigation = window.navigation || {};
  navigation.RGB = RGB;
}());
