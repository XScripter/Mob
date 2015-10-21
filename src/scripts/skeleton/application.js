define('mob/application', function(require, exports, module) {

  var lang = require('mob/lang');
  var base = require('mob/base');
  var Class = require('mob/class');
  var Router = require('mob/router');
  var ScreenManager = require('mob/screenManager');
  var Storage = require('mob/storage');
  var Logger = require('mob/logger');

  var extendFn = lang.extend;
  var isFunctionFn = lang.isFunction;

  var Application = Class.extend({

    constructor: function(options) {
      this._initScreens(options);

      this.appRouter = new Router();
      this.appCache = new Storage({
        name: 'appCache',
        type: 'memory'
      });

      this._initRouters(options);

      extendFn(this, options);
      Class.apply(this, arguments);
    },

    // kick off all of the application's processes.
    // initializes all of the screens that have been added
    // to the app, and runs all of the initializer functions
    start: function(options) {

      var logPrefix = (options && options.logPrefix) || '[Mob Application]';

      options = extendFn({
        autoRunRouter: true,
        logLevel: Logger.WARN,
        logFormatter: function (messages, context) {
          messages.unshift(logPrefix);
          if (context.name) {
            messages.unshift('[' + context.name + ']');
          }
        }
      }, options || {});

      this.triggerMethod('before:start', options);

      Logger.useDefaults({
        logLevel: options.logLevel,
        formatter: options.logFormatter
      });

      options.autoRunRouter && this.appRouter.run();

      this.triggerMethod('start', options);
    },

    getLocalStorage: function() {
      return this._initStorage('local');
    },

    getSessionStorage: function() {
      return this._initStorage('session');
    },

    getCookie: function() {
      return this._initStorage('cookie');
    },

    // Add screens to your app.
    // Accepts a hash of named strings or Screen objects
    // addScreens({something: "#someScreen"})
    // addScreens({something: Screen.extend({el: "#someScreen"}) });
    addScreens: function(screens) {
      return this._screenManager.addScreens(screens);
    },

    // Empty all screens in the app, without removing them
    emptyScreens: function() {
      return this._screenManager.emptyScreens();
    },

    // Removes a screen from your app, by name
    // Accepts the screens name
    // removeScreen('myScreen')
    removeScreen: function(screen) {
      return this._screenManager.removeScreen(screen);
    },

    // Provides alternative access to screens
    // Accepts the screen name
    // getScreen('main')
    getScreen: function(screen) {
      return this._screenManager.get(screen);
    },

    // Get all the screens from the screen manager
    getScreens: function() {
      return this._screenManager.getScreens();
    },

    // Enable easy overriding of the default `ScreenManager`
    // for customized screen interactions and business-specific
    // view logic for better control over single screens.
    getScreenManager: function() {
      return new ScreenManager();
    },

    addRouters: function(routers) {
      for (var matcher in routers) {
        this.addRouter(matcher, routers[matcher]);
      }
      return this;
    },

    addRouter: function(matcher, router) {
      this.appRouter.addRoute(matcher, router);
      return this;
    },

    redirect: function(url) {
      this.appRouter.redirect(url);
      return this;
    },

    _initRouters: function(options) {

      var routers = isFunctionFn(this.routers) ? this.routers(options) : this.routers || {};

      var optionRouters = base.getOption(options, 'routers');

      if (isFunctionFn(optionRouters)) {
        optionRouters = optionRouters.call(this, options);
      }

      extendFn(routers, optionRouters);

      this.addRouters(routers);

      return this;
    },

    // Internal method to initialize the screens that have been defined in a
    // `screens` attribute on the application instance
    _initScreens: function(options) {
      var screens = isFunctionFn(this.screens) ? this.screens(options) : this.screens || {};

      this._initScreenManager();

      // Enable users to define `screens` in instance options.
      var optionScreens = base.getOption(options, 'screens');

      // Enable screen options to be a function
      if (isFunctionFn(optionScreens)) {
        optionScreens = optionScreens.call(this, options);
      }

      // Overwrite current screens with those passed in options
      extendFn(screens, optionScreens);

      this.addScreens(screens);

      return this;
    },

    // Internal method to set up the screen manager
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
    },

    _initStorage: function(type) {
      var storageCache = '__app' + type + 'storage';
      if (!this[storageCache]) {
        this[storageCache] = new Storage({
          name: storageCache,
          type: type
        });
      }
      return this[storageCache];
    }

  });

  module.exports = Application;

});