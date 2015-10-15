define('mob/screenManager', function(require, exports, module) {

  var lang = require('mob/lang');
  var base = require('mob/base');
  var Class = require('mob/class');
  var Screen = require('mob/screen');

  var ScreenManager = Class.extend({

    constructor: function(options) {
      this._screens = {};
      this.length = 0;

      Class.call(this, options);

      this.addScreens(this.getOption('screens'));
    },

    addScreens: function(screenDefinitions, defaults) {
      screenDefinitions = base._getValue(screenDefinitions, this, arguments);

      return lang.reduce(screenDefinitions, function(screens, definition, name) {
        if (lang.isString(definition)) {
          definition = {
            selector: definition
          };
        }
        if (definition.selector) {
          definition = lang.defaults({}, definition, defaults);
        }

        screens[name] = this.addScreen(name, definition);
        return screens;
      }, {}, this);
    },

    addScreen: function(name, definition) {
      var screen;

      if (definition instanceof Screen) {
        screen = definition;
      } else {
        screen = Screen.buildScreen(definition, Screen);
      }

      this.triggerMethod('before:add:screen', name, screen);

      screen._parent = this;
      this._store(name, screen);

      this.triggerMethod('add:screen', name, screen);
      return screen;
    },

    get: function(name) {
      return this._screens[name];
    },

    getScreens: function() {
      return lang.clone(this._screens);
    },

    removeScreen: function(name) {
      var screen = this._screens[name];
      this._remove(name, screen);

      return screen;
    },

    removeScreens: function() {
      var screens = this.getScreens();
      lang.each(this._screens, function(screen, name) {
        this._remove(name, screen);
      }, this);

      return screens;
    },

    emptyScreens: function() {
      var screens = this.getScreens();
      lang.invoke(screens, 'empty');
      return screens;
    },

    destroy: function() {
      this.removeScreens();
      return Class.prototype.destroy.apply(this, arguments);
    },

    _store: function(name, screen) {
      if (!this._screens[name]) {
        this.length++;
      }

      this._screens[name] = screen;
    },

    _remove: function(name, screen) {
      this.triggerMethod('before:remove:screen', name, screen);
      screen.empty();
      screen.stopListening();

      delete screen._parent;
      delete this._screens[name];
      this.length--;
      this.triggerMethod('remove:screen', name, screen);
    }
  });

  module.exports = ScreenManager;

});