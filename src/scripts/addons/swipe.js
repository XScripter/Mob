define('mob/swipe', function(require, exports, module) {

  var lang = require('mob/lang');
  var Support = require('mob/support');

  var supportedAddEventListener = Support.addEventListener;
  var supportedTouch = Support.touch;
  var supportedTransitions = Support.transitions;

  var nowFn = lang.now;
  var delayFn = function(fn) {
    setTimeout(fn || lang.noop, 0);
  };

  function Swipe(container, options) {

    if (!container) {
      return;
    }

    options = lang.extend({

      /**
       * index position Swipe should start at (default:0)
       */
      startSlide: 0,

      /**
       * speed of prev and next transitions in milliseconds (default:300)
       */
      speed: 300,

      /**
       * begin with auto slideshow (time in milliseconds between slides)
       */
      auto: 0,

      /**
       * create an infinite feel with no endpoints (default:true)
       */
      continuous: true,

      /**
       * stop any touches on this container from scrolling the page (default:false)
       */
      disableScroll: false,

      /**
       * stop event propagation (default:false)
       */
      stopPropagation: false,

      /**
       * runs at slide change
       * @param index
       * @param elem
       */
      callback: function(index, elem) {},

      /**
       * runs at the end slide transition
       * @param index
       * @param elem
       */
      transitionEnd: function(index, elem) {}

    }, options || {});

    var element = container.children[0];

    var slides, slidePos, width, length;
    var index = parseInt(options.startSlide, 10);
    var speed = options.speed;

    function setup() {

      slides = element.children;
      length = slides.length;

      if (slides.length < 2) {
        options.continuous = false;
      }

      if (supportedTransitions && options.continuous && slides.length < 3) {
        element.appendChild(slides[0].cloneNode(true));
        element.appendChild(element.children[1].cloneNode(true));
        slides = element.children;
      }

      slidePos = new Array(slides.length);

      width = container.getBoundingClientRect().width || container.offsetWidth;

      element.style.width = (slides.length * width) + 'px';

      var pos = slides.length;

      while (pos--) {
        var slide = slides[pos];
        slide.style.width = width + 'px';
        slide.setAttribute('data-index', pos);
        if (supportedTransitions) {
          slide.style.left = (pos * -width) + 'px';
          move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
        }
      }

      if (options.continuous && supportedTransitions) {
        move(circle(index - 1), -width, 0);
        move(circle(index + 1), width, 0);
      }

      if (!supportedTransitions) {
        element.style.left = (index * -width) + 'px';
      }

      container.style.visibility = 'visible';

    }

    function prev() {
      if (options.continuous) {
        slide(index - 1);
      } else if (index) {
        slide(index - 1);
      }
    }

    function next() {
      if (options.continuous) {
        slide(index + 1);
      } else if (index < slides.length - 1) {
        slide(index + 1);
      }
    }

    function circle(index) {
      return (slides.length + (index % slides.length)) % slides.length;
    }

    function slide(to, slideSpeed) {
      if (index == to) {
        return;
      }

      if (supportedTransitions) {

        var direction = Math.abs(index - to) / (index - to); // 1: backward, -1: forward

        if (options.continuous) {
          var natural_direction = direction;
          direction = -slidePos[circle(to)] / width;

          // if going forward but to < index, use to = slides.length + to
          // if going backward but to > index, use to = -slides.length + to
          if (direction !== natural_direction) {
            to = -direction * slides.length + to;
          }

        }

        var diff = Math.abs(index - to) - 1;

        // move all the slides between index and to in the right direction
        while (diff--) {
          move(circle((to > index ? to : index) - diff - 1), width * direction, 0);
        }

        to = circle(to);

        move(index, width * direction, slideSpeed || speed);
        move(to, 0, slideSpeed || speed);

        if (options.continuous) {
          move(circle(to - direction), -(width * direction), 0);
        }

      } else {

        to = circle(to);
        animate(index * -width, to * -width, slideSpeed || speed);
      }

      index = to;
      delayFn(options.callback(index, slides[index]));
    }

    function move(index, dist, speed) {
      translate(index, dist, speed);
      slidePos[index] = dist;
    }

    function translate(index, dist, speed) {

      var slide = slides[index];
      var style = slide && slide.style;

      if (!style) {
        return;
      }

      style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = speed + 'ms';

      style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
      style.msTransform = style.MozTransform = style.OTransform = 'translateX(' + dist + 'px)';

    }

    function animate(from, to, speed) {

      if (!speed) {
        element.style.left = to + 'px';
        return;
      }

      var start = nowFn();

      var timer = setInterval(function() {

        var timeElap = nowFn() - start;

        if (timeElap > speed) {
          element.style.left = to + 'px';
          if (delay) {
            begin();
          }
          options.transitionEnd.call(event, index, slides[index]);
          clearInterval(timer);
          return;
        }

        element.style.left = (((to - from) * (Math.floor((timeElap / speed) * 100) / 100)) + from) + 'px';
      }, 4);

    }

    var delay = options.auto;
    var interval;

    function begin() {
      interval = setTimeout(next, delay);
    }

    function stop() {
      delay = 0;
      clearTimeout(interval);
    }

    // setup initial vars
    var start = {};
    var delta = {};
    var isScrolling;

    // setup event capturing
    var events = {

      handleEvent: function(event) {

        switch (event.type) {
          case 'touchstart':
            this.start(event);
            break;
          case 'touchmove':
            this.move(event);
            break;
          case 'touchend':
            delayFn(this.end(event));
            break;
          case 'webkitTransitionEnd':
          case 'msTransitionEnd':
          case 'oTransitionEnd':
          case 'otransitionend':
          case 'transitionend':
            delayFn(this.transitionEnd(event));
            break;
          case 'resize':
            delayFn(setup);
            break;
        }

        if (options.stopPropagation) {
          event.stopPropagation();
        }

      },
      start: function(event) {

        var touches = event.touches[0];
        // measure start values
        start = {
          // get initial touch coords
          x: touches.pageX,
          y: touches.pageY,
          // store time to determine touch duration
          time: +new Date

        };
        // used for testing first move event
        isScrolling = undefined;
        // reset delta and end measurements
        delta = {};
        // attach touchmove and touchend listeners
        element.addEventListener('touchmove', this, false);
        element.addEventListener('touchend', this, false);

      },
      move: function(event) {
        // ensure swiping with one touch and not pinching
        if (event.touches.length > 1 || event.scale && event.scale !== 1) {
          return;
        }

        if (options.disableScroll) {
          event.preventDefault();
        }

        var touches = event.touches[0];

        // measure change in x and y
        delta = {
          x: touches.pageX - start.x,
          y: touches.pageY - start.y
        };

        // determine if scrolling test has run - one time test
        if (lang.isUndefined(isScrolling)) {
          isScrolling = !!(isScrolling || Math.abs(delta.x) < Math.abs(delta.y));
        }

        if (!isScrolling) {
          event.preventDefault();
          stop();
          if (options.continuous) { // we don't add resistance at the end

            translate(circle(index - 1), delta.x + slidePos[circle(index - 1)], 0);
            translate(index, delta.x + slidePos[index], 0);
            translate(circle(index + 1), delta.x + slidePos[circle(index + 1)], 0);

          } else {

            delta.x =
              delta.x /
              ((!index && delta.x > 0 // if first slide and sliding left
                || index == slides.length - 1 // or if last slide and sliding right
                && delta.x < 0 // and if sliding at all
              ) ?
                (Math.abs(delta.x) / width + 1) // determine resistance level
                : 1); // no resistance if false

            // translate 1:1
            translate(index - 1, delta.x + slidePos[index - 1], 0);
            translate(index, delta.x + slidePos[index], 0);
            translate(index + 1, delta.x + slidePos[index + 1], 0);
          }
        }

      },
      end: function(event) {

        var duration = nowFn() - start.time;

        // determine if slide attempt triggers next/prev slide
        var isValidSlide =
          Number(duration) < 250 // if slide duration is less than 250ms
          && Math.abs(delta.x) > 20 // and if slide amt is greater than 20px
          || Math.abs(delta.x) > width / 2; // or if slide amt is greater than half the width

        // determine if slide attempt is past start and end
        var isPastBounds = !index && delta.x > 0 // if first slide and slide amt is greater than 0
          || index == slides.length - 1 && delta.x < 0; // or if last slide and slide amt is less than 0

        if (options.continuous) {
          isPastBounds = false;
        }

        // determine direction of swipe (true:right, false:left)
        var direction = delta.x < 0;

        // if not scrolling vertically
        if (!isScrolling) {

          if (isValidSlide && !isPastBounds) {

            if (direction) {

              if (options.continuous) { // we need to get the next in this direction in place

                move(circle(index - 1), -width, 0);
                move(circle(index + 2), width, 0);

              } else {
                move(index - 1, -width, 0);
              }

              move(index, slidePos[index] - width, speed);
              move(circle(index + 1), slidePos[circle(index + 1)] - width, speed);
              index = circle(index + 1);

            } else {
              if (options.continuous) { // we need to get the next in this direction in place

                move(circle(index + 1), width, 0);
                move(circle(index - 2), -width, 0);

              } else {
                move(index + 1, width, 0);
              }

              move(index, slidePos[index] + width, speed);
              move(circle(index - 1), slidePos[circle(index - 1)] + width, speed);
              index = circle(index - 1);

            }

            options.callback(index, slides[index]);

          } else {

            if (options.continuous) {

              move(circle(index - 1), -width, speed);
              move(index, 0, speed);
              move(circle(index + 1), width, speed);

            } else {

              move(index - 1, -width, speed);
              move(index, 0, speed);
              move(index + 1, width, speed);
            }

          }

        }

        // kill touchmove and touchend event listeners until touchstart called again
        element.removeEventListener('touchmove', events, false)
        element.removeEventListener('touchend', events, false)

      },
      transitionEnd: function(event) {

        if (parseInt(event.target.getAttribute('data-index'), 10) == index) {
          if (delay) {
            begin();
          }
          options.transitionEnd.call(event, index, slides[index]);
        }

      }

    };

    // trigger setup
    setup();

    // start auto slideshow if applicable
    if (delay) {
      begin();
    }

    // add event listeners
    if (supportedAddEventListener) {

      // set touchstart event on element
      if (supportedTouch) {
        element.addEventListener('touchstart', events, false);
      }

      if (supportedTransitions) {
        element.addEventListener('webkitTransitionEnd', events, false);
        element.addEventListener('msTransitionEnd', events, false);
        element.addEventListener('oTransitionEnd', events, false);
        element.addEventListener('otransitionend', events, false);
        element.addEventListener('transitionend', events, false);
      }

      // set resize event on window
      window.addEventListener('resize', events, false);

    } else {

      window.onresize = function() {
        setup()
      }; // to play nice with old IE

    }

    return {
      setup: function() {
        setup();
      },

      /**
       * slide to set index position
       *
       * @param index
       * @param duration speed of transition in milliseconds
       */
      slide: function(index, duration) {
        stop();
        slide(index, duration);
      },

      /**
       * slide to prev
       */
      prev: function() {
        stop();
        prev();
      },

      /**
       * slide to next
       */
      next: function() {
        stop();
        next();
      },
      stop: function() {
        // cancel slideshow
        stop();
      },

      /**
       * @returns {Number|number} current slide index position
       */
      getPos: function() {
        return index;
      },

      /**
       * @returns {*} the total amount of slides
       */
      getNumSlides: function() {
        return length;
      },

      kill: function() {
        stop();
        // reset element
        element.style.width = '';
        element.style.left = '';
        // reset slides
        var pos = slides.length;
        while (pos--) {
          var slide = slides[pos];
          slide.style.width = '';
          slide.style.left = '';
          if (supportedTransitions) {
            translate(pos, 0, 0);
          }
        }
        // removed event listeners
        if (supportedAddEventListener) {
          // remove current event listeners
          element.removeEventListener('touchstart', events, false);
          element.removeEventListener('webkitTransitionEnd', events, false);
          element.removeEventListener('msTransitionEnd', events, false);
          element.removeEventListener('oTransitionEnd', events, false);
          element.removeEventListener('otransitionend', events, false);
          element.removeEventListener('transitionend', events, false);
          window.removeEventListener('resize', events, false);
        } else {
          window.onresize = null;
        }

      }
    };

  }

  module.exports = Swipe;

});