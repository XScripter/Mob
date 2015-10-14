/**
 * Mobird 0.2.0
 * Full Featured HTML5 Framework For Building Mobile Apps
 * 
 * http://www.xscripter.com/mobird/
 * 
 * Copyright 2015, Clarence Hu
 * The XScripter.com
 * http://www.xscripter.com/
 * 
 * Licensed under MIT
 * 
 * Released on: October 14, 2015
 */
(function(factory) {
  var root = (typeof self == 'object' && self.self == self && self) ||
      (typeof global == 'object' && global.global == global && global);
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], function($) {
      root.Mob = factory(root, $);
    });
  } else {
    root.Mob = factory(root, (root.jQuery || root.Zepto || root.ender || root.$));
  }
}(function(root, $) {

  var previousMob = root.Mob;
  
  var Mob = {};
  
  Mob.$ = $;
  
  Mob.VERSION = '0.2.0';
  
  Mob.noConflict = function() {
    root.Mob = previousMob;
    return this;
  };

  var require,
    define,
    modules = {},
    requireStack = [],
    inProgressModules = {};
  
  function moduleBuild(module) {
    var factory = module.factory,
      SEPERATOR = '.',
      localRequire = function(id) {
        var resultantId = id;
        //Its a relative path, so lop off the last portion and add the id (minus './')
        if (id.charAt(0) === SEPERATOR) {
          resultantId = module.id.slice(0, module.id.lastIndexOf(SEPERATOR)) + SEPERATOR + id.slice(2);
        }
        return require(resultantId);
      };
  
    module.exports = {};
    delete module.factory;
    factory(localRequire, module.exports, module);
    return module.exports;
  }
  
  require = function(id) {
    if (!modules[id]) {
      throw 'module ' + id + ' not found';
    } else if (id in inProgressModules) {
      var cycle = requireStack.slice(inProgressModules[id]).join('->') + '->' + id;
      throw 'Cycle in module require graph: ' + cycle;
    }
    if (modules[id].factory) {
      try {
        inProgressModules[id] = requireStack.length;
        requireStack.push(id);
        return moduleBuild(modules[id]);
      } finally {
        delete inProgressModules[id];
        requireStack.pop();
      }
    }
    return modules[id].exports;
  };
  
  define = function(id, factory) {
    if (modules[id]) {
      throw 'module ' + id + ' already defined';
    }
  
    modules[id] = {
      id: id,
      factory: factory
    };
  };
  
  Mob.Module = {
    require: require,
    define: define,
    remove: function(id) {
      delete modules[id];
    },
    map: function() {
      return modules;
    }
  };
  Mob.requireModule = require;
  Mob.defineModule = define;

  define('mob/lang', function(require, exports, module) {
  
    var lang = {};
  
    // Save bytes in the minified (but not gzipped) version:
    var ArrayProto = Array.prototype,
      ObjProto = Object.prototype,
      FuncProto = Function.prototype;
  
    // Create quick reference variables for speed access to core prototypes.
    var
      push = ArrayProto.push,
      slice = ArrayProto.slice,
      toString = ObjProto.toString,
      hasOwnProperty = ObjProto.hasOwnProperty;
  
    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.
    var
      nativeIsArray = Array.isArray,
      nativeKeys = Object.keys,
      nativeBind = FuncProto.bind,
      nativeCreate = Object.create;
  
    // Naked function reference for surrogate-prototype-swapping.
    var Ctor = function(){};
  
    var optimizeCb = function(func, context, argCount) {
      if (context === void 0) {
        return func;
      }
      switch (argCount == null ? 3 : argCount) {
        case 1:
          return function(value) {
            return func.call(context, value);
          };
        case 2:
          return function(value, other) {
            return func.call(context, value, other);
          };
        case 3:
          return function(value, index, collection) {
            return func.call(context, value, index, collection);
          };
        case 4:
          return function(accumulator, value, index, collection) {
            return func.call(context, accumulator, value, index, collection);
          };
      }
      return function() {
        return func.apply(context, arguments);
      };
    };
  
    var createAssigner = function(keysFunc, undefinedOnly) {
      return function(obj) {
        var length = arguments.length;
        if (length < 2 || obj == null) return obj;
        for (var index = 1; index < length; index++) {
          var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
          for (var i = 0; i < l; i++) {
            var key = keys[i];
            if (!undefinedOnly || obj[key] === void 0) {
              obj[key] = source[key];
            }
          }
        }
        return obj;
      };
    };
  
    var baseCreate = function(prototype) {
      if (!isObject(prototype)) {
        return {};
      }
      if (nativeCreate) {
        return nativeCreate(prototype);
      }
      Ctor.prototype = prototype;
      var result = new Ctor;
      Ctor.prototype = null;
      return result;
    };
  
    var property = function(key) {
      return function(obj) {
        return obj == null ? void 0 : obj[key];
      };
    };
  
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
    var getLength = property('length');
    var isArrayLike = function(collection) {
      var length = getLength(collection);
      return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };
  
    // 集合(数组或对象)相关方法
    // ==========================================================================================
  
    var each = lang.each = function(obj, iteratee, context) {
      iteratee = optimizeCb(iteratee, context);
      var i, length;
      if (isArrayLike(obj)) {
        for (i = 0, length = obj.length; i < length; i++) {
          iteratee(obj[i], i, obj);
        }
      } else {
        var keys = objectKeys(obj);
        for (i = 0, length = keys.length; i < length; i++) {
          iteratee(obj[keys[i]], keys[i], obj);
        }
      }
      return obj;
    };
  
    // 数组相关方法
    // ==========================================================================================
  
  
  
    // 对象相关方法
    // ==========================================================================================
  
    var objectKeys = lang.keys = function(obj) {
      if (!isObject(obj)) {
        return [];
      }
      if (nativeKeys) {
        return nativeKeys(obj);
      }
      var keys = [];
      for (var key in obj) {
        if (has(obj, key)) {
          keys.push(key);
        }
      }
  
      return keys;
    };
  
    var allKeys = lang.allKeys = function(obj) {
      if (!isObject(obj)) {
        return [];
      }
      var keys = [];
      for (var key in obj) {
        keys.push(key);
      }
      return keys;
    };
  
    lang.extend = createAssigner(allKeys);
    lang.assign = createAssigner(objectKeys);
    lang.defaults = createAssigner(allKeys, true);
  
    var isArray = lang.isArray = nativeIsArray || function(obj) {
        return toString.call(obj) === '[object Array]';
      };
  
  
    var isObject = lang.isObject = function(obj) {
      var type = typeof obj;
      return type === 'function' || type === 'object' && !!obj;
    };
  
    each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
      lang['is' + name] = function(obj) {
        return toString.call(obj) === '[object ' + name + ']';
      };
    });
  
    // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
    // IE 11 (#1621), and in Safari 8 (#1929).
    if (typeof /./ != 'function' && typeof Int8Array != 'object') {
      lang.isFunction = function(obj) {
        return typeof obj == 'function' || false;
      };
    }
  
    lang.isNaN = function(obj) {
      return lang.isNumber(obj) && obj !== +obj;
    };
  
    lang.isBoolean = function(obj) {
      return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    };
  
    lang.isNull = function(obj) {
      return obj === null;
    };
  
    lang.isUndefined = function(obj) {
      return obj === void 0;
    };
  
    lang.isEmpty = function(obj) {
      if (obj == null) {
        return true;
      }
      if (isArrayLike(obj) && (isArray(obj) || lang.isString(obj) || lang.isArguments(obj))) {
        return obj.length === 0;
      }
      return objectKeys(obj).length === 0;
    };
  
    var has = lang.has = function(obj, key) {
      return obj != null && hasOwnProperty.call(obj, key);
    };
  
    // 函数相关方法
    // ==========================================================================================
    var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
      if (!(callingContext instanceof boundFunc)) {
        return sourceFunc.apply(context, args);
      }
      var self = baseCreate(sourceFunc.prototype);
      var result = sourceFunc.apply(self, args);
      if (isObject(result)) {
        return result;
      }
      return self;
    };
  
    lang.bind = function(func, context) {
      if (nativeBind && func.bind === nativeBind) {
        return nativeBind.apply(func, slice.call(arguments, 1));
      }
      if (!lang.isFunction(func)) {
        throw new TypeError('Bind must be called on a function');
      }
      var args = slice.call(arguments, 2);
      var bound = function() {
        return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
      };
      return bound;
    };
  
    module.exports = lang;
  
  });
  var lang = require('mob/lang');
  lang.extend(Mob, lang);

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

  return Mob;

}));