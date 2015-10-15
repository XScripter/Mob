define('mob/transition', function(require, exports, module) {

  var Support = require('mob/support');
  var lang = require('mob/lang');
  var $ = require('mob/jqlite');
  var Logger = require('mob/logger');

  var screenHistory = [];

  var animations = [{
    name: 'cubeleft',
    is3d: true
  }, {
    name: 'cuberight',
    is3d: true
  }, {
    name: 'dissolve'
  }, {
    name: 'fade'
  }, {
    name: 'flipleft',
    is3d: true
  }, {
    name: 'flipright',
    is3d: true
  }, {
    name: 'pop',
    is3d: true
  }, {
    name: 'swapleft',
    is3d: true
  }, {
    name: 'swapright',
    is3d: true
  }, {
    name: 'slidedown'
  }, {
    name: 'slideright'
  }, {
    name: 'slideup'
  }, {
    name: 'slideleft'
  }];

  function addScreenToHistory(screen, animation, hash) {
    screenHistory.unshift({
      screen: screen,
      animation: animation,
      hash: hash || location.hash,
      id: screen.attr('id')
    });
  }

  function reverseAnimation(animation) {
    var opposites = {
      'up': 'down',
      'down': 'up',
      'left': 'right',
      'right': 'left',
      'in': 'out',
      'out': 'in'
    };
    return opposites[animation] || animation;
  }

  var Transition = {

    options: {
      useAnimations: true,
      defaultAnimation: 'slideleft',
      tapBuffer: 100, // High click delay = ~350, quickest animation (slide) = 250
      trackScrollPositions: false,
      updateHash: true
    },

    $currentScreen: $('.mo-screen.current'),
    $body: $('.mo-body'),

    addAnimation: function(animation) {
      if (lang.isString(animation.name)) {
        animations.push(animation);
      }
    },

    transit: function(fromScreen, toScreen, animation, goingBack, hash) {

      goingBack = goingBack ? goingBack : false;

      // Error check for target screen
      if (lang.isUndefined(toScreen) || toScreen.length === 0) {
        return false;
      }

      // Error check for fromScreen === toScreen
      if (toScreen.hasClass('current')) {
        return false;
      }

      // Collapse the keyboard
      $(':focus').trigger('blur');

      fromScreen.trigger('screenAnimationStart', {
        direction: 'out',
        back: goingBack
      });
      toScreen.trigger('screenAnimationStart', {
        direction: 'in',
        back: goingBack
      });

      if (Support.animationEvents && animation && Transition.options.useAnimations) {
        // Fail over to 2d animation if need be
        if (!Support.transform3d() && animation.is3d) {
          Logger.warn('Did not detect support for 3d animations, falling back to ' + Transition.options.defaultAnimation + '.');
          animation.name = Transition.options.defaultAnimation;
        }

        // Reverse animation if need be
        var finalAnimationName = animation.name,
          is3d = animation.is3d ? 'animating3d' : '';

        if (goingBack) {
          finalAnimationName = finalAnimationName.replace(/left|right|up|down|in|out/, reverseAnimation);
        }

        Logger.warn('finalAnimationName is ' + finalAnimationName + '.');

        setTimeout(function() {
          navigationEndHandler();
        }, 250);

        // Trigger animations
        Transition.$body.addClass('animating ' + is3d);

        var lastScroll = window.pageYOffset;

        // Position the incoming screen so toolbar is at top of
        // viewport regardless of scroll position on from screen
        if (Transition.options.trackScrollPositions === true) {
          toScreen.css('top', window.pageYOffset - (toScreen.data('lastScroll') || 0));
        }

        toScreen.addClass(finalAnimationName + ' in current');
        fromScreen.removeClass('current').addClass(finalAnimationName + ' out inmotion');

        if (Transition.options.trackScrollPositions === true) {
          fromScreen.data('lastScroll', lastScroll);
          $('.mo-scroll', fromScreen).each(function() {
            $(this).data('lastScroll', Transition.scrollTop);
          });
        }
      } else {
        toScreen.addClass('current in');
        fromScreen.removeClass('current');
        navigationEndHandler();
      }

      // Housekeeping
      Transition.$currentScreen = toScreen;
      if (goingBack) {
        screenHistory.shift();
      } else {
        addScreenToHistory(Transition.$currentScreen, animation, hash);
      }

      if (hash) {
        Transition.setHash(hash);
      }

      // Private navigationEnd callback
      function navigationEndHandler(event) {
        var bufferTime = Transition.options.tapBuffer;

        if (Support.animationEvents && animation && Transition.options.useAnimations) {
          fromScreen.unbind('webkitAnimationEnd', navigationEndHandler);
          fromScreen.removeClass(finalAnimationName + ' out inmotion');
          if (finalAnimationName) {
            toScreen.removeClass(finalAnimationName);
          }
          Transition.$body.removeClass('animating animating3d');
          if (Transition.options.trackScrollPositions === true) {
            toScreen.css('top', -toScreen.data('lastScroll'));

            // Have to make sure the scroll/style resets
            // are outside the flow of this function.
            setTimeout(function() {
              toScreen.css('top', 0);
              window.scroll(0, toScreen.data('lastScroll'));
              $('.mo-scroll', toScreen).each(function() {
                this.scrollTop = -$(this).data('lastScroll');
              });
            }, 0);
          }
        } else {
          fromScreen.removeClass(finalAnimationName + ' out inmotion');
          if (finalAnimationName) {
            toScreen.removeClass(finalAnimationName);
          }
          bufferTime += 260;
        }

        // 'in' class is intentionally delayed,
        // as it is our ghost click hack
        setTimeout(function() {
          toScreen.removeClass('in');
          window.scroll(0, 0);
        }, bufferTime);

        // Trigger custom events
        toScreen.trigger('screenAnimationEnd', {
          direction: 'in',
          animation: animation,
          back: goingBack
        });
        fromScreen.trigger('screenAnimationEnd', {
          direction: 'out',
          animation: animation,
          back: goingBack
        });
      }

      return true;
    },

    goBack: function() {
      if (screenHistory.length < 1) {
        Logger.warn('History is empty.');
        return false;
      }

      if (screenHistory.length === 1) {
        Logger.warn('You are on the first panel.');
        window.history.go(-1);
      }

      var from = screenHistory[0],
        to = screenHistory[1];

      if (to && to.screen) {
        if (to.hash) {
          Transition.setHash(to.hash);
        }
        if (Transition.transit(from.screen, to.screen, from.animation, true)) {
          return true;
        }
      }
      Logger.warn('Could not go back.');
      return false;
    },

    goTo: function(toScreen, animation, hash) {
      var fromScreen;

      if (screenHistory.length === 0) {

        if ($('.mo-screen.current').length === 0) {
          Transition.$currentScreen = $('.mo-screen:first-child').addClass('current');
        }

        fromScreen = Transition.$currentScreen;

      } else {
        fromScreen = screenHistory[0].screen;
      }

      if (typeof animation === 'string') {
        for (var i = 0, max = animations.length; i < max; i++) {
          if (animations[i].name === animation) {
            animation = animations[i];
            break;
          }
        }
      }

      if (Transition.transit(fromScreen, toScreen, animation, false, hash)) {
        return true;
      } else {
        return false;
      }
    },

    setHash: function(hash) {
      if (Transition.options.updateHash) {
        location.hash = '#' + hash.replace(/^#/, '');
      }
    }

  };

  module.exports = Transition;

});