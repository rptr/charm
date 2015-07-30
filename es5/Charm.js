"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Charm = (function () {
  function Charm() {
    _classCallCheck(this, Charm);

    //An array to store the global tweens
    this.globalTweens = [];

    //An object that stores all the easing formulas
    this.easingFormulas = {

      //Linear
      linear: function linear(x) {
        return x;
      },

      //Smoothstep
      smoothstep: function smoothstep(x) {
        return x * x * (3 - 2 * x);
      },
      smoothstepSquared: function smoothstepSquared(x) {
        return Math.pow(x * x * (3 - 2 * x), 2);
      },
      smoothstepCubed: function smoothstepCubed(x) {
        return Math.pow(x * x * (3 - 2 * x), 3);
      },

      //Acceleration
      acceleration: function acceleration(x) {
        return x * x;
      },
      accelerationCubed: function accelerationCubed(x) {
        return Math.pow(x * x, 3);
      },

      //Deceleration
      deceleration: function deceleration(x) {
        return 1 - Math.pow(1 - x, 2);
      },
      decelerationCubed: function decelerationCubed(x) {
        return 1 - Math.pow(1 - x, 3);
      },

      //Sine
      sine: function sine(x) {
        return Math.sin(x * Math.PI / 2);
      },
      sineSquared: function sineSquared(x) {
        return Math.pow(Math.sin(x * Math.PI / 2), 2);
      },
      sineCubed: function sineCubed(x) {
        return Math.pow(Math.sin(x * Math.PI / 2), 2);
      },
      inverseSine: function inverseSine(x) {
        return 1 - Math.sin((1 - x) * Math.PI / 2);
      },
      inverseSineSquared: function inverseSineSquared(x) {
        return 1 - Math.pow(Math.sin((1 - x) * Math.PI / 2), 2);
      },
      inverseSineCubed: function inverseSineCubed(x) {
        return 1 - Math.pow(Math.sin((1 - x) * Math.PI / 2), 3);
      },

      //Spline
      spline: function spline(t, p0, p1, p2, p3) {
        return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
      },

      //Bezier curve
      cubicBezier: function cubicBezier(t, a, b, c, d) {
        var t2 = t * t;
        var t3 = t2 * t;
        return a + (-a * 3 + t * (3 * a - a * t)) * t + (3 * b + t * (-6 * b + b * 3 * t)) * t + (c * 3 - c * 3 * t) * t2 + d * t3;
      }
    };

    //Add `scaleX` and `scaleY` properties to Pixi sprites
    this._addScaleProperties = function (sprite) {
      if (!sprite.scaleX && sprite.scale.x) {
        Object.defineProperty(sprite, "scaleX", {
          get: function get() {
            return sprite.scale.x;
          },
          set: function set(value) {
            sprite.scale.x = value;
          }
        });
      }
      if (!sprite.scaleY && sprite.scale.y) {
        Object.defineProperty(sprite, "scaleY", {
          get: function get() {
            return sprite.scale.y;
          },
          set: function set(value) {
            sprite.scale.y = value;
          }
        });
      }
    };
  }

  _createClass(Charm, [{
    key: "tweenProperty",

    //The low level `tweenProperty` function is used as the foundation
    //for the the higher level tween methods.
    value: function tweenProperty(sprite, //Sprite object
    property, //String property
    startValue, //Tween start value
    endValue, //Tween end value
    totalFrames) {
      var type = arguments[5] === undefined ? "smoothstep" : arguments[5];

      var _this = this;

      var yoyo = arguments[6] === undefined ? false : arguments[6];
      var delayBeforeRepeat = arguments[7] === undefined ? 0 //Delay in frames before repeating
      : arguments[7];

      //Create the tween object
      var o = {};

      //If the tween is a bounce type (a spline), set the
      //start and end magnitude values
      var typeArray = type.split(" ");
      if (typeArray[0] === "bounce") {
        o.startMagnitude = parseInt(typeArray[1]);
        o.endMagnitude = parseInt(typeArray[2]);
      }

      //Use `o.start` to make a new tween using the current
      //end point values
      o.start = function (startValue, endValue) {

        //Clone the start and end values so that any possible references to sprite
        //properties are converted to ordinary numbers
        o.startValue = JSON.parse(JSON.stringify(startValue));
        o.endValue = JSON.parse(JSON.stringify(endValue));
        o.playing = true;
        o.totalFrames = totalFrames;
        o.frameCounter = 0;

        //Add the tween to the global `tweens` array. The `tweens` array is
        //updated on each frame
        _this.globalTweens.push(o);
      };

      //Call `o.start` to start the tween
      o.start(startValue, endValue);

      //The `update` method will be called on each frame by the game loop.
      //This is what makes the tween move
      o.update = function () {

        var time = undefined,
            curvedTime = undefined;

        if (o.playing) {

          //If the elapsed frames are less than the total frames,
          //use the tweening formulas to move the sprite
          if (o.frameCounter < o.totalFrames) {

            //Find the normalized value
            var normalizedTime = o.frameCounter / o.totalFrames;

            //Select the correct easing function from the
            //`ease` object’s library of easing functions

            //If it's not a spline, use one of the ordinary easing functions
            if (typeArray[0] !== "bounce") {
              curvedTime = _this.easingFormulas[type](normalizedTime);
            }

            //If it's a spline, use the `spline` function and apply the
            //2 additional `type` array values as the spline's start and
            //end points
            else {
              curvedTime = _this.easingFormulas.spline(normalizedTime, o.startMagnitude, 0, 1, o.endMagnitude);
            }

            //Interpolate the sprite's property based on the curve
            sprite[property] = o.endValue * curvedTime + o.startValue * (1 - curvedTime);

            o.frameCounter += 1;
          }

          //When the tween has finished playing, run the end tasks
          else {
            o.end();
          }
        }
      };

      //The `end` method will be called when the tween is finished
      o.end = function () {

        //Set `playing` to `false`
        o.playing = false;

        //Call the tween's `onComplete` method, if it's been assigned
        if (o.onComplete) o.onComplete();

        //Remove the tween from the `tweens` array
        _this.globalTweens.splice(_this.globalTweens.indexOf(o), 1);

        //If the tween's `yoyo` property is `true`, create a new tween
        //using the same values, but use the current tween's `startValue`
        //as the next tween's `endValue`
        if (yoyo) {
          _this.wait(delayBeforeRepeat).then(function () {
            o.start(o.endValue, o.startValue);
          });
        }
      };

      //Pause and play methods
      o.play = function () {
        return o.playing = true;
      };
      o.pause = function () {
        return o.playing = false;
      };

      //Return the tween object
      return o;
    }
  }, {
    key: "makeTween",

    //`makeTween` is a general low-level method for making complex tweens
    //out of multiple `tweenProperty` functions. Its one argument,
    //`tweensToAdd` is an array containing multiple `tweenProperty` calls

    value: function makeTween(tweensToAdd) {
      var _this2 = this;

      //Create an object to manage the tweens
      var o = {};

      //Create a `tweens` array to store the new tweens
      o.tweens = [];

      //Make a new tween for each array
      tweensToAdd.forEach(function (tweenPropertyArguments) {

        //Use the tween property arguments to make a new tween
        var newTween = _this2.tweenProperty.apply(_this2, _toConsumableArray(tweenPropertyArguments));

        //Push the new tween into this object's internal `tweens` array
        o.tweens.push(newTween);
      });

      //Add a counter to keep track of the
      //number of tweens that have completed their actions
      var completionCounter = 0;

      //`o.completed` will be called each time one of the tweens
      //finishes
      o.completed = function () {

        //Add 1 to the `completionCounter`
        completionCounter += 1;

        //If all tweens have finished, call the user-defined `onComplete`
        //method, if it's been assigned. Reset the `completionCounter`
        if (completionCounter === o.tweens.length) {
          if (o.onComplete) o.onComplete();
          completionCounter = 0;
        }
      };

      //Add `onComplete` methods to all tweens
      o.tweens.forEach(function (tween) {
        tween.onComplete = function () {
          return o.completed();
        };
      });

      //Add pause and play methods to control all the tweens
      o.pause = function () {
        o.tweens.forEach(function (tween) {
          tween.playing = false;
        });
      };
      o.play = function () {
        o.tweens.forEach(function (tween) {
          tween.playing = true;
        });
      };

      //Return the tween object
      return o;
    }
  }, {
    key: "fadeOut",

    /* High level tween methods */

    //1. Simple tweens

    //`fadeOut`
    value: function fadeOut(sprite) {
      var frames = arguments[1] === undefined ? 60 : arguments[1];

      return this.tweenProperty(sprite, "alpha", sprite.alpha, 0, frames, "sine");
    }
  }, {
    key: "fadeIn",

    //`fadeIn`
    value: function fadeIn(sprite) {
      var frames = arguments[1] === undefined ? 60 : arguments[1];

      return this.tweenProperty(sprite, "alpha", sprite.alpha, 1, frames, "sine");
    }
  }, {
    key: "pulse",

    //`pulse`
    //Fades the sprite in and out at a steady rate.
    //Set the `minAlpha` to something greater than 0 if you
    //don't want the sprite to fade away completely
    value: function pulse(sprite) {
      var frames = arguments[1] === undefined ? 60 : arguments[1];
      var minAlpha = arguments[2] === undefined ? 0 : arguments[2];

      return this.tweenProperty(sprite, "alpha", sprite.alpha, minAlpha, frames, "smoothstep", true);
    }
  }, {
    key: "slide",

    //2. Complex tweens

    value: function slide(sprite, endX, endY) {
      var frames = arguments[3] === undefined ? 60 : arguments[3];
      var type = arguments[4] === undefined ? "smoothstep" : arguments[4];
      var yoyo = arguments[5] === undefined ? false : arguments[5];
      var delayBeforeRepeat = arguments[6] === undefined ? 0 : arguments[6];

      return this.makeTween([

      //Create the x axis tween
      [sprite, "x", sprite.x, endX, frames, type, yoyo, delayBeforeRepeat],

      //Create the y axis tween
      [sprite, "y", sprite.y, endY, frames, type, yoyo, delayBeforeRepeat]]);
    }
  }, {
    key: "breathe",
    value: function breathe(sprite) {
      var endScaleX = arguments[1] === undefined ? 0.8 : arguments[1];
      var endScaleY = arguments[2] === undefined ? 0.8 : arguments[2];
      var frames = arguments[3] === undefined ? 60 : arguments[3];
      var yoyo = arguments[4] === undefined ? true : arguments[4];
      var delayBeforeRepeat = arguments[5] === undefined ? 0 : arguments[5];

      //Add `scaleX` and `scaleY` properties to Pixi sprites
      this._addScaleProperties(sprite);

      return this.makeTween([

      //Create the scaleX tween
      [sprite, "scaleX", sprite.scaleX, endScaleX, frames, "smoothstepSquared", yoyo, delayBeforeRepeat],

      //Create the scaleY tween
      [sprite, "scaleY", sprite.scaleY, endScaleY, frames, "smoothstepSquared", yoyo, delayBeforeRepeat]]);
    }
  }, {
    key: "scale",
    value: function scale(sprite) {
      var endScaleX = arguments[1] === undefined ? 0.5 : arguments[1];
      var endScaleY = arguments[2] === undefined ? 0.5 : arguments[2];
      var frames = arguments[3] === undefined ? 60 : arguments[3];

      //Add `scaleX` and `scaleY` properties to Pixi sprites
      this._addScaleProperties(sprite);

      return this.makeTween([

      //Create the scaleX tween
      [sprite, "scaleX", sprite.scaleX, endScaleX, frames, "smoothstep", false],

      //Create the scaleY tween
      [sprite, "scaleY", sprite.scaleY, endScaleY, frames, "smoothstep", false]]);
    }
  }, {
    key: "strobe",
    value: function strobe(sprite) {
      var scaleFactor = arguments[1] === undefined ? 1.3 : arguments[1];
      var startMagnitude = arguments[2] === undefined ? 10 : arguments[2];
      var endMagnitude = arguments[3] === undefined ? 20 : arguments[3];
      var frames = arguments[4] === undefined ? 10 : arguments[4];
      var yoyo = arguments[5] === undefined ? true : arguments[5];
      var delayBeforeRepeat = arguments[6] === undefined ? 0 : arguments[6];

      var bounce = "bounce " + startMagnitude + " " + endMagnitude;

      //Add `scaleX` and `scaleY` properties to Pixi sprites
      this._addScaleProperties(sprite);

      return this.makeTween([

      //Create the scaleX tween
      [sprite, "scaleX", sprite.scaleX, scaleFactor, frames, bounce, yoyo, delayBeforeRepeat],

      //Create the scaleY tween
      [sprite, "scaleY", sprite.scaleY, scaleFactor, frames, bounce, yoyo, delayBeforeRepeat]]);
    }
  }, {
    key: "wobble",
    value: function wobble(sprite) {
      var scaleFactorX = arguments[1] === undefined ? 1.2 : arguments[1];
      var scaleFactorY = arguments[2] === undefined ? 1.2 : arguments[2];
      var frames = arguments[3] === undefined ? 10 : arguments[3];
      var xStartMagnitude = arguments[4] === undefined ? 10 : arguments[4];
      var xEndMagnitude = arguments[5] === undefined ? 10 : arguments[5];
      var yStartMagnitude = arguments[6] === undefined ? -10 : arguments[6];
      var yEndMagnitude = arguments[7] === undefined ? -10 : arguments[7];
      var friction = arguments[8] === undefined ? 0.98 : arguments[8];

      var _this3 = this;

      var yoyo = arguments[9] === undefined ? true : arguments[9];
      var delayBeforeRepeat = arguments[10] === undefined ? 0 : arguments[10];

      var bounce = "bounce " + startMagnitude + " " + endMagnitude;

      //Add `scaleX` and `scaleY` properties to Pixi sprites
      this._addScaleProperties(sprite);

      var o = this.makeTween([

      //Create the scaleX tween
      [sprite, "scaleX", sprite.scaleX, scaleFactorX, frames, bounce, yoyo, delayBeforeRepeat],

      //Create the scaleY tween
      [sprite, "scaleY", sprite.scaleY, scaleFactorY, frames, bounce, yoyo, delayBeforeRepeat]]);

      //Add some friction to the `endValue` at the end of each tween
      o.tweens.forEach(function (tween) {
        tween.onComplete = function () {

          //Add friction if the `endValue` is greater than 1
          if (tween.endValue > 1) {
            tween.endValue *= friction;

            //Set the `endValue` to 1 when the effect is finished and
            //remove the tween from the global `tweens` array
            if (tween.endValue <= 1) {
              tween.endValue = 1;
              _this3.removeTween(tween);
            }
          }
        };
      });

      return o;
    }
  }, {
    key: "followCurve",

    //3. Motion path tweens

    value: function followCurve(sprite, pointsArray, totalFrames) {
      var type = arguments[3] === undefined ? "smoothstep" : arguments[3];

      var _this4 = this;

      var yoyo = arguments[4] === undefined ? false : arguments[4];
      var delayBeforeRepeat = arguments[5] === undefined ? 0 : arguments[5];

      //Create the tween object
      var o = {};

      //If the tween is a bounce type (a spline), set the
      //start and end magnitude values
      var typeArray = type.split(" ");
      if (typeArray[0] === "bounce") {
        o.startMagnitude = parseInt(typeArray[1]);
        o.endMagnitude = parseInt(typeArray[2]);
      }

      //Use `tween.start` to make a new tween using the current
      //end point values
      o.start = function (pointsArray) {
        o.playing = true;
        o.totalFrames = totalFrames;
        o.frameCounter = 0;

        //Clone the points array
        o.pointsArray = JSON.parse(JSON.stringify(pointsArray));

        //Add the tween to the `globalTweens` array. The `globalTweens` array is
        //updated on each frame
        _this4.globalTweens.push(o);
      };

      //Call `tween.start` to start the first tween
      o.start(pointsArray);

      //The `update` method will be called on each frame by the game loop.
      //This is what makes the tween move
      o.update = function () {

        var normalizedTime = undefined,
            curvedTime = undefined,
            p = o.pointsArray;

        if (o.playing) {

          //If the elapsed frames are less than the total frames,
          //use the tweening formulas to move the sprite
          if (o.frameCounter < o.totalFrames) {

            //Find the normalized value
            normalizedTime = o.frameCounter / o.totalFrames;

            //Select the correct easing function

            //If it's not a spline, use one of the ordinary tween
            //functions
            if (typeArray[0] !== "bounce") {
              curvedTime = _this4.easingFormulas[type](normalizedTime);
            }

            //If it's a spline, use the `spline` function and apply the
            //2 additional `type` array values as the spline's start and
            //end points
            else {
              //curve = tweenFunction.spline(n, type[1], 0, 1, type[2]);
              curvedTime = _this4.easingFormulas.spline(normalizedTime, o.startMagnitude, 0, 1, o.endMagnitude);
            }

            //Apply the Bezier curve to the sprite's position
            sprite.x = _this4.easingFormulas.cubicBezier(curvedTime, p[0][0], p[1][0], p[2][0], p[3][0]);
            sprite.y = _this4.easingFormulas.cubicBezier(curvedTime, p[0][1], p[1][1], p[2][1], p[3][1]);

            //Add one to the `elapsedFrames`
            o.frameCounter += 1;
          }

          //When the tween has finished playing, run the end tasks
          else {
            o.end();
          }
        }
      };

      //The `end` method will be called when the tween is finished
      o.end = function () {

        //Set `playing` to `false`
        o.playing = false;

        //Call the tween's `onComplete` method, if it's been
        //assigned
        if (o.onComplete) o.onComplete();

        //Remove the tween from the global `tweens` array
        _this4.globalTweens.splice(_this4.globalTweens.indexOf(o), 1);

        //If the tween's `yoyo` property is `true`, reverse the array and
        //use it to create a new tween
        if (yoyo) {
          _this4.wait(delayBeforeRepeat).then(function () {
            o.pointsArray = o.pointsArray.reverse();
            o.start(o.pointsArray);
          });
        }
      };

      //Pause and play methods
      o.pause = function () {
        o.playing = false;
      };
      o.play = function () {
        o.playing = true;
      };

      //Return the tween object
      return o;
    }
  }, {
    key: "walkPath",
    value: function walkPath(sprite, //The sprite
    originalPathArray) {
      var totalFrames = arguments[2] === undefined ? 300 : arguments[2];
      var type = arguments[3] === undefined ? "smoothstep" : arguments[3];
      var loop = arguments[4] === undefined ? false : arguments[4];

      var _this5 = this;

      var yoyo = arguments[5] === undefined ? false : arguments[5];
      var delayBetweenSections = arguments[6] === undefined ? 0 //Delay, in milliseconds, between sections
      : arguments[6];

      //Clone the path array so that any possible references to sprite
      //properties are converted into ordinary numbers
      var pathArray = JSON.parse(JSON.stringify(originalPathArray));

      //Figure out the duration, in frames, of each path section by
      //dividing the `totalFrames` by the length of the `pathArray`
      var frames = totalFrames / pathArray.length;

      //Set the current point to 0, which will be the first waypoint
      var currentPoint = 0;

      //The `makePath` function creates a single tween between two points and
      //then schedules the next path to be made after it
      var makePath = function makePath(currentPoint) {

        //Use the `makeTween` function to tween the sprite's
        //x and y position
        var tween = _this5.makeTween([

        //Create the x axis tween between the first x value in the
        //current point and the x value in the following point
        [sprite, "x", pathArray[currentPoint][0], pathArray[currentPoint + 1][0], frames, type],

        //Create the y axis tween in the same way
        [sprite, "y", pathArray[currentPoint][1], pathArray[currentPoint + 1][1], frames, type]]);

        //When the tween is complete, advance the `currentPoint` by one.
        //Add an optional delay between path segments, and then make the
        //next connecting path
        tween.onComplete = function () {

          //Advance to the next point
          currentPoint += 1;

          //If the sprite hasn't reached the end of the
          //path, tween the sprite to the next point
          if (currentPoint < pathArray.length - 1) {
            _this5.wait(delayBetweenSections).then(function () {
              tween = makePath(currentPoint);
            });
          }

          //If we've reached the end of the path, optionally
          //loop and yoyo it
          else {

            //Reverse the path if `loop` is `true`
            if (loop) {

              //Reverse the array if `yoyo` is `true`
              if (yoyo) pathArray.reverse();

              //Optionally wait before restarting
              _this5.wait(delayBetweenSections).then(function () {

                //Reset the `currentPoint` to 0 so that we can
                //restart at the first point
                currentPoint = 0;

                //Set the sprite to the first point
                sprite.x = pathArray[0][0];
                sprite.y = pathArray[0][1];

                //Make the first new path
                tween = makePath(currentPoint);

                //... and so it continues!
              });
            }
          }
        };

        //Return the path tween to the main function
        return tween;
      };

      //Make the first path using the internal `makePath` function (below)
      var tween = makePath(currentPoint);

      //Pass the tween back to the main program
      return tween;
    }
  }, {
    key: "walkCurve",
    value: function walkCurve(sprite, //The sprite
    pathArray) {
      var totalFrames = arguments[2] === undefined ? 300 : arguments[2];
      var type = arguments[3] === undefined ? "smoothstep" : arguments[3];
      var loop = arguments[4] === undefined ? false : arguments[4];

      var _this6 = this;

      var yoyo = arguments[5] === undefined ? false : arguments[5];
      var delayBeforeContinue = arguments[6] === undefined ? 0 //Delay, in milliseconds, between sections
      : arguments[6];

      //Divide the `totalFrames` into sections for each part of the path
      var frames = totalFrames / pathArray.length;

      //Set the current curve to 0, which will be the first one
      var currentCurve = 0;

      //The `makePath` function
      var makePath = function makePath(currentCurve) {

        //Use the custom `followCurve` function to make
        //a sprite follow a curve
        var tween = _this6.followCurve(sprite, pathArray[currentCurve], frames, type);

        //When the tween is complete, advance the `currentCurve` by one.
        //Add an optional delay between path segments, and then make the
        //next path
        tween.onComplete = function () {
          currentCurve += 1;
          if (currentCurve < pathArray.length) {
            _this6.wait(delayBeforeContinue).then(function () {
              tween = makePath(currentCurve);
            });
          }

          //If we've reached the end of the path, optionally
          //loop and reverse it
          else {
            if (loop) {
              if (yoyo) {

                //Reverse order of the curves in the `pathArray`
                pathArray.reverse();

                //Reverse the order of the points in each curve
                pathArray.forEach(function (curveArray) {
                  return curveArray.reverse();
                });
              }

              //After an optional delay, reset the sprite to the
              //beginning of the path and make the next new path
              _this6.wait(delayBeforeContinue).then(function () {
                currentCurve = 0;
                sprite.x = pathArray[0][0];
                sprite.y = pathArray[0][1];
                tween = makePath(currentCurve);
              });
            }
          }
        };

        //Return the path tween to the main function
        return tween;
      };

      //Make the first path
      var tween = makePath(currentCurve);

      //Pass the tween back to the main program
      return tween;
    }
  }, {
    key: "wait",

    //4. Utilities

    /*
    The `wait` method lets you set up a timed sequence of events
       wait(1000)
        .then(() => console.log("One"))
        .then(() => wait(1000))
        .then(() => console.log("Two"))
        .then(() => wait(1000))
        .then(() => console.log("Three"))
     */

    value: function wait() {
      var duration = arguments[0] === undefined ? 0 : arguments[0];

      return new Promise(function (resolve, reject) {
        setTimeout(resolve, duration);
      });
    }
  }, {
    key: "removeTween",

    //A utility to remove tweens from the game
    value: function removeTween(tweenObject) {
      var _this7 = this;

      //Remove the tween if `tweenObject` doesn't have any nested
      //tween objects
      if (!tweenObject.tweens) {
        tweenObject.pause();
        this.globalTweens.splice(this.globalTweens.indexOf(tweenObject), 1);

        //Otherwise, remove the nested tween objects
      } else {
        tweenObject.pause();
        tweenObject.tweens.forEach(function (element) {
          _this7.globalTweens.splice(_this7.globalTweens.indexOf(element), 1);
        });
      }
    }
  }, {
    key: "update",
    value: function update() {

      //Update all the tween objects in the `globalTweens` array
      if (this.globalTweens.length > 0) {
        for (var i = this.globalTweens.length - 1; i >= 0; i--) {
          var tween = this.globalTweens[i];
          if (tween) tween.update();
        }
      }
    }
  }]);

  return Charm;
})();

//Duration in frames
//The easing type
//Yoyo?
//A 2D array of waypoints
//The duration, in frames
//The easing type
//Should the animation loop?
//Shoud the direction reverse?
//2D array of Bezier curves
//The duration, in frames
//The easing type
//Should the animation loop?
//Should the direction reverse?
//# sourceMappingURL=charm.js.map