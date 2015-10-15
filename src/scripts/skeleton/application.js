define('mob/application', function(require, exports, module) {

  var lang = require('mob/lang');
  var base = require('mob/base');
  var Class = require('mob/class');
  var Router = require('mob/router');
  var ScreenManager = require('mob/screenManager');

  var Application = Class.extend({

    constructor: function(options) {
      this._initializeScreens(options);

      this.appRouter = new Router();

      if (options && options.routers) {
        this._initializeRouters(options.routers);
      }

      lang.defaults(this, options);

      Class.call(this, options);
    },

    start: function(options) {
      this.triggerMethod('before:start', options);
      this.triggerMethod('start', options);
    },

    addScreens: function(screens) {
      return this._screenManager.addScreens(screens);
    },

    emptyScreens: function() {
      return this._screenManager.emptyScreens();
    },

    removeScreen: function(screen) {
      return this._screenManager.removeScreen(screen);
    },

    getScreen: function(screen) {
      return this._screenManager.get(screen);
    },

    getScreens: function() {
      return this._screenManager.getScreens();
    },

    getScreenManager: function() {
      return new ScreenManager();
    },

    _initializeRouters: function(routers) {
      for (var matcher in routers) {
        this.appRouter.addRoute(matcher, routers[matcher]);
      }
    },

    _initializeScreens: function(options) {
      var screens = lang.isFunction(this.screens) ? this.screens(options) : this.screens || {};

      this._initScreenManager();

      // Enable users to define `screens` in instance options.
      var optionScreens = base.getOption(options, 'screens');

      // Enable screen options to be a function
      if (lang.isFunction(optionScreens)) {
        optionScreens = optionScreens.call(this, options);
      }

      // Overwrite current screens with those passed in options
      lang.extend(screens, optionScreens);

      this.addScreens(screens);

      return this;
    },

    _initScreenManager: function() {
      this._screenManager = this.getScreenManager();
      this._screenManager._parent = this;

      this.listenTo(this._screenManager, 'before:add:screen', function() {
        base._triggerMethod(this, 'before:add:screen', arguments);
      });

      this.listenTo(this._screenManager, 'add:screen', function(name, screen) {
        this[name] = screen;
        base._triggerMethod(this, 'add:screen', arguments);
      });

      this.listenTo(this._screenManager, 'before:remove:screen', function() {
        base._triggerMethod(this, 'before:remove:screen', arguments);
      });

      this.listenTo(this._screenManager, 'remove:screen', function(name) {
        delete this[name];
        base._triggerMethod(this, 'remove:screen', arguments);
      });
    }
  });

  module.exports = Application;

});