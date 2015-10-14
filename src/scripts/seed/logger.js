define('mob/logger', function(require, exports, module) {

  var lang = require('mob/lang');

  var Logger = {};

  var logHandler;
  var contextualLoggersByNameMap = {};

  function defaultMessageFormatter(messages, context) {
    if (context.name) {
      messages.unshift('[' + context.name + ']');
    }
  }

  var defineLogLevel = function(value, name) {
    return {
      value: value,
      name: name
    };
  };

  Logger.DEBUG = defineLogLevel(1, 'DEBUG');
  Logger.INFO = defineLogLevel(2, 'INFO');
  Logger.TIME = defineLogLevel(3, 'TIME');
  Logger.WARN = defineLogLevel(4, 'WARN');
  Logger.ERROR = defineLogLevel(8, 'ERROR');
  Logger.OFF = defineLogLevel(99, 'OFF');

  var ContextualLogger = function(defaultContext) {
    this.context = defaultContext;
    this.setLevel(defaultContext.filterLevel);
    this.log = this.info;
  };

  ContextualLogger.prototype = {

    setLevel: function(newLevel) {
      if (newLevel && 'value' in newLevel) {
        this.context.filterLevel = newLevel;
      }
    },

    enabledFor: function(lvl) {
      var filterLevel = this.context.filterLevel;
      return lvl.value >= filterLevel.value;
    },

    debug: function() {
      this.invoke(Logger.DEBUG, arguments);
    },

    info: function() {
      this.invoke(Logger.INFO, arguments);
    },

    warn: function() {
      this.invoke(Logger.WARN, arguments);
    },

    error: function() {
      this.invoke(Logger.ERROR, arguments);
    },

    time: function(label) {
      if (typeof label === 'string' && label.length > 0) {
        this.invoke(Logger.TIME, [label, 'start']);
      }
    },

    timeEnd: function(label) {
      if (typeof label === 'string' && label.length > 0) {
        this.invoke(Logger.TIME, [label, 'end']);
      }
    },

    invoke: function(level, msgArgs) {
      if (logHandler && this.enabledFor(level)) {
        logHandler(msgArgs, lang.extend({
          level: level
        }, this.context));
      }
    }
  };

  var globalLogger = new ContextualLogger({
    filterLevel: Logger.OFF
  });

  lang.each(['enabledFor', 'debug', 'time', 'timeEnd', 'info', 'warn', 'error'], function(method) {
    Logger[method] = lang.bind(globalLogger[method], globalLogger);
  });

  Logger.log = Logger.info;

  Logger.setHandler = function(func) {
    logHandler = func;
  };

  Logger.setLevel = function(level) {
    globalLogger.setLevel(level);

    for (var key in contextualLoggersByNameMap) {
      if (contextualLoggersByNameMap.hasOwnProperty(key)) {
        contextualLoggersByNameMap[key].setLevel(level);
      }
    }
  };

  Logger.get = function(name) {
    return contextualLoggersByNameMap[name] ||
      (contextualLoggersByNameMap[name] = new ContextualLogger(lang.extend({
        name: name
      }, globalLogger.context)));
  };

  Logger.useDefaults = function(options) {
    options = options || {};

    options.formatter = options.formatter || defaultMessageFormatter;

    if (typeof console === 'undefined') {
      return;
    }

    var timerStartTimeByLabelMap = {};

    var invokeConsoleMethod = function(hdlr, messages) {
      Function.prototype.apply.call(hdlr, console, messages);
    };

    Logger.setLevel(options.defaultLevel || Logger.DEBUG);
    Logger.setHandler(function(messages, context) {
      messages = Array.prototype.slice.call(messages);

      var hdlr = console.log;
      var timerLabel;

      if (context.level === Logger.TIME) {
        timerLabel = (context.name ? '[' + context.name + '] ' : '') + messages[0];

        if (messages[1] === 'start') {
          if (console.time) {
            console.time(timerLabel);
          } else {
            timerStartTimeByLabelMap[timerLabel] = new Date().getTime();
          }
        } else {
          if (console.timeEnd) {
            console.timeEnd(timerLabel);
          } else {
            invokeConsoleMethod(hdlr, [timerLabel + ': ' + (new Date().getTime() - timerStartTimeByLabelMap[timerLabel]) + 'ms']);
          }
        }
      } else {
        if (context.level === Logger.WARN && console.warn) {
          hdlr = console.warn;
        } else if (context.level === Logger.ERROR && console.error) {
          hdlr = console.error;
        } else if (context.level === Logger.INFO && console.info) {
          hdlr = console.info;
        }

        options.formatter(messages, context);
        invokeConsoleMethod(hdlr, messages);
      }
    });
  };

  module.exports = Logger;

});
Mob.Logger = require('mob/logger');
Mob.each(['debug', 'time', 'timeEnd', 'info', 'warn', 'error', 'log'], function(method) {
  Mob[method] = Mob.Logger[method];
});