define('mob/screenTransition', function(require, exports, module) {

  var lang = require('mob/lang');
  var $ = require('mob/jqlite');
  var Logger = require('mob/logger');

  var ScreenTransition = {

    options: {
      useAnimations: true,
      defaultAnimation: 'slideleft',
      tapBuffer: 100, // High click delay = ~350, quickest animation (slide) = 250
      trackScrollPositions: false,
      updateHash: true
    },

    $currentScreen: $('.mob-screen.current'),
    $body: $('.mob-body'),

    _history: [],

    _animations: [{
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
    }],

    addAnimation: function(animation) {
      if (lang.isString(animation.name)) {
        this._animations.push(animation);
      }
    },

    _addScreenToHistory: function(screen, animation, hash) {
      this._history.unshift({
        screen: screen,
        animation: animation,
        hash: hash || location.hash,
        id: screen.attr('id')
      });
    },

    transit: function(fromScreen, toScreen, animation, goingBack, hash) {

      var self = this;

      goingBack = goingBack ? goingBack : false;

      // Error check for target screen
      if (lang.isUndefined(toScreen) || toScreen.length === 0) {
        Logger.warn('Target element is missing.');
        return false;
      }

      // Error check for fromScreen === toScreen
      if (toScreen.hasClass('current')) {
        Logger.warn('You are already on the screen you are trying to navigate to.');
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

      if (Support.animationEvents && animation && this.options.useAnimations) {
        // Fail over to 2d animation if need be
        if (!Support.transform3d && animation.is3d) {
          Logger.warn('Did not detect support for 3d animations, falling back to ' + this.options.defaultAnimation + '.');
          animation.name = this.options.defaultAnimation;
        }

        // Reverse animation if need be
        var finalAnimationName = animation.name,
          is3d = animation.is3d ? 'animating3d' : '';

        if (goingBack) {
          finalAnimationName = finalAnimationName.replace(/left|right|up|down|in|out/, this._reverseAnimation);
        }

        Logger.warn('finalAnimationName is ' + finalAnimationName + '.');

        setTimeout(function() {
          navigationEndHandler();
        }, 250);

        // Trigger animations
        this.$body.addClass('animating ' + is3d);

        var lastScroll = window.pageYOffset;

        // Position the incoming screen so toolbar is at top of
        // viewport regardless of scroll position on from screen
        if (this.options.trackScrollPositions === true) {
          toScreen.css('top', window.pageYOffset - (toScreen.data('lastScroll') || 0));
        }

        toScreen.addClass(finalAnimationName + ' in current');
        fromScreen.removeClass('current').addClass(finalAnimationName + ' out inmotion');

        if (this.options.trackScrollPositions === true) {
          fromScreen.data('lastScroll', lastScroll);
          $('.mob-scroll', fromScreen).each(function() {
            $(this).data('lastScroll', this.scrollTop);
          });
        }
      } else {
        toScreen.addClass('current in');
        fromScreen.removeClass('current');
        navigationEndHandler();
      }

      // Housekeeping
      this.$currentScreen = toScreen;
      if (goingBack) {
        this._history.shift();
      } else {
        this._addScreenToHistory(this.$currentScreen, animation, hash);
      }

      if (hash) {
        this.setHash(hash);
      }

      // Private navigationEnd callback
      function navigationEndHandler(event) {
        var bufferTime = self.options.tapBuffer;

        if (Support.animationEvents && animation && self.options.useAnimations) {
          fromScreen.unbind('webkitAnimationEnd', navigationEndHandler);
          fromScreen.removeClass(finalAnimationName + ' out inmotion');
          if (finalAnimationName) {
            toScreen.removeClass(finalAnimationName);
          }
          self.$body.removeClass('animating animating3d');
          if (self.options.trackScrollPositions === true) {
            toScreen.css('top', -toScreen.data('lastScroll'));

            // Have to make sure the scroll/style resets
            // are outside the flow of this function.
            setTimeout(function() {
              toScreen.css('top', 0);
              window.scroll(0, toScreen.data('lastScroll'));
              $('.mob-scroll', toScreen).each(function() {
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

    _reverseAnimation: function(animation) {
      var opposites = {
        'up': 'down',
        'down': 'up',
        'left': 'right',
        'right': 'left',
        'in': 'out',
        'out': 'in'
      };
      return opposites[animation] || animation;
    },

    goBack: function goBack() {
      if (this._history.length < 1) {
        Logger.warn('History is empty.');
      }

      if (this._history.length === 1) {
        Logger.warn('You are on the first panel.');
        window.history.go(-1);
      }

      var from = this._history[0],
        to = this._history[1];

      if (to && to.screen) {
        if (to.hash) {
          this.setHash(to.hash);
        }
        if (this.transit(from.screen, to.screen, from.animation, true)) {
          return true;
        }
      }
      Logger.warn('Could not go back.');
      return false;
    },

    goTo: function goTo(toScreen, animation, hash) {
      var fromScreen;

      if (this._history.length === 0) {

        if ($('.mob-screen.current').length === 0) {
          this.$currentScreen = $('.mob-screen:first-child').addClass('current');
        }

        fromScreen = this.$currentScreen;

      } else {
        fromScreen = this._history[0].screen;
      }

      if (lang.isString(animation)) {
        for (var i = 0, max = this._animations.length; i < max; i++) {
          if (this._animations[i].name === animation) {
            animation = this._animations[i];
            break;
          }
        }
      }

      if (this.transit(fromScreen, toScreen, animation, false, hash)) {
        return true;
      } else {
        Logger.warn('Could not animate screens.');
        return false;
      }
    },

    setHash: function(hash) {
      if (this.options.updateHash) {
        location.hash = '#' + hash.replace(/^#/, '');
      }
    }

  };

  module.exports = ScreenTransition;

});