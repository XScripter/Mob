/**
 * MobJS 0.2.0
 * Full Featured HTML5 Framework For Building Mobile Apps
 * 
 * https://github.com/XScripter/Mob
 * 
 * Copyright 2015, Clarence Hu
 * The XScripter.com
 * http://www.xscripter.com/
 * 
 * Licensed under MIT
 * 
 * Released on: October 21, 2015
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
  var undefined;
  
  var Mob = {};
  
  Mob.$ = $;
  
  Mob.VERSION = '0.2.0';
  
  Mob.noConflict = function() {
    root.Mob = previousMob;
    return this;
  };

  var require, define;
  
  Mob.Module = function() {
  
    var modules = {};
    var requireStack = [];
    var inProgressModules = {};
  
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
  
    return {
      require: require,
      define: define,
      remove: function(id) {
        delete modules[id];
      },
      map: function() {
        return modules;
      }
    };
  
  }();

  define('mob/lang', function(require, exports, module) {
  
    var lang = {};
  
    var ArrayProto = Array.prototype,
      ObjProto = Object.prototype,
      FuncProto = Function.prototype,
      slice = ArrayProto.slice,
      toString = ObjProto.toString,
      hasOwnProperty = ObjProto.hasOwnProperty,
      nativeIsArray = Array.isArray,
      nativeKeys = Object.keys,
      nativeBind = FuncProto.bind,
      nativeCreate = Object.create,
      identityFn = function(value) {
        return value;
      },
      propertyFn = function(key) {
        return function(obj) {
          return obj == null ? void 0 : obj[key];
        };
      };
  
    var Ctor = function() {};
  
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
  
    var cb = function(value, context, argCount) {
      if (value == null) {
        return identityFn;
      }
      if (lang.isFunction(value)) {
        return optimizeCb(value, context, argCount);
      }
      if (isObjectFn(value)) {
        return matcherFn(value);
      }
      return propertyFn(value);
    };
  
    var createAssigner = function(keysFunc, undefinedOnly) {
      return function(obj) {
        var length = arguments.length;
        if (length < 2 || obj == null) {
          return obj;
        }
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
      if (!isObjectFn(prototype)) {
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
  
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
    var getLength = propertyFn('length');
    var isArrayLike = function(collection) {
      var length = getLength(collection);
      return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };
  
    // collections
    // =================================================================================
  
    var eachFn = lang.each = function(obj, iteratee, context) {
      iteratee = optimizeCb(iteratee, context);
      var i, length;
      if (isArrayLike(obj)) {
        for (i = 0, length = obj.length; i < length; i++) {
          iteratee(obj[i], i, obj);
        }
      } else {
        var keys = keysFn(obj);
        for (i = 0, length = keys.length; i < length; i++) {
          iteratee(obj[keys[i]], keys[i], obj);
        }
      }
      return obj;
    };
  
    var mapFn = lang.map = function(obj, iteratee, context) {
      iteratee = cb(iteratee, context);
      var keys = !isArrayLike(obj) && keysFn(obj),
        length = (keys || obj).length,
        results = Array(length);
      for (var index = 0; index < length; index++) {
        var currentKey = keys ? keys[index] : index;
        results[index] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
    };
  
    function createReduce(dir) {
  
      function iterator(obj, iteratee, memo, keys, index, length) {
        for (; index >= 0 && index < length; index += dir) {
          var currentKey = keys ? keys[index] : index;
          memo = iteratee(memo, obj[currentKey], currentKey, obj);
        }
        return memo;
      }
  
      return function(obj, iteratee, memo, context) {
        iteratee = optimizeCb(iteratee, context, 4);
        var keys = !isArrayLike(obj) && keysFn(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
        if (arguments.length < 3) {
          memo = obj[keys ? keys[index] : index];
          index += dir;
        }
        return iterator(obj, iteratee, memo, keys, index, length);
      };
    }
  
    lang.reduce = createReduce(1);
  
    lang.reduceRight = createReduce(-1);
  
    lang.find = function(obj, predicate, context) {
      var key;
      if (isArrayLike(obj)) {
        key = findIndexFn(obj, predicate, context);
      } else {
        key = findKeyFn(obj, predicate, context);
      }
      if (key !== void 0 && key !== -1) {
        return obj[key];
      }
    };
  
    var filterFn = lang.filter = function(obj, predicate, context) {
      var results = [];
      predicate = cb(predicate, context);
      eachFn(obj, function(value, index, list) {
        if (predicate(value, index, list)) {
          results.push(value);
        }
      });
      return results;
    };
  
    var containsFn = lang.contains = function(obj, item, fromIndex, guard) {
      if (!isArrayLike(obj)) {
        obj = valuesFn(obj);
      }
      if (typeof fromIndex != 'number' || guard) {
        fromIndex = 0;
      }
      return indexOfFn(obj, item, fromIndex) >= 0;
    };
  
    lang.invoke = function(obj, method) {
      var args = slice.call(arguments, 2);
      var isFunc = lang.isFunction(method);
      return mapFn(obj, function(value) {
        var func = isFunc ? method : value[method];
        return func == null ? func : func.apply(value, args);
      });
    };
  
    var pluckFn = lang.pluck = function(obj, key) {
      return mapFn(obj, propertyFn(key));
    };
  
    lang.sortBy = function(obj, iteratee, context) {
      iteratee = cb(iteratee, context);
      return pluckFn(mapFn(obj, function(value, index, list) {
        return {
          value: value,
          index: index,
          criteria: iteratee(value, index, list)
        };
      }).sort(function(left, right) {
        var a = left.criteria;
        var b = right.criteria;
        if (a !== b) {
          if (a > b || a === void 0) {
            return 1;
          }
          if (a < b || b === void 0) {
            return -1;
          }
        }
        return left.index - right.index;
      }), 'value');
    };
  
    var group = function(behavior) {
      return function(obj, iteratee, context) {
        var result = {};
        iteratee = cb(iteratee, context);
        eachFn(obj, function(value, index) {
          var key = iteratee(value, index, obj);
          behavior(result, value, key);
        });
        return result;
      };
    };
  
    lang.groupBy = group(function(result, value, key) {
      if (hasFn(result, key)) {
        result[key].push(value);
      } else {
        result[key] = [value];
      }
    });
  
    lang.indexBy = group(function(result, value, key) {
      result[key] = value;
    });
  
    lang.countBy = group(function(result, value, key) {
      if (hasFn(result, key)) {
        result[key]++;
      } else {
        result[key] = 1;
      }
    });
  
    lang.toArray = function(obj) {
      if (!obj) {
        return [];
      }
      if (lang.isArray(obj)) {
        return slice.call(obj);
      }
      if (isArrayLike(obj)) {
        return mapFn(obj, identityFn);
      }
      return valuesFn(obj);
    };
  
    lang.size = function(obj) {
      if (obj == null) {
        return 0;
      }
      return isArrayLike(obj) ? obj.length : keysFn(obj).length;
    };
  
    // arrays
    // =================================================================================
  
    lang.rest = function(array, n, guard) {
      return slice.call(array, n == null || guard ? 1 : n);
    };
  
    var uniqFn = lang.uniq = function(array, isSorted, iteratee, context) {
      if (!isBooleanFn(isSorted)) {
        context = iteratee;
        iteratee = isSorted;
        isSorted = false;
      }
      if (iteratee != null) iteratee = cb(iteratee, context);
      var result = [];
      var seen = [];
      for (var i = 0, length = getLength(array); i < length; i++) {
        var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
        if (isSorted) {
          if (!i || seen !== computed) result.push(value);
          seen = computed;
        } else if (iteratee) {
          if (!containsFn(seen, computed)) {
            seen.push(computed);
            result.push(value);
          }
        } else if (!containsFn(result, value)) {
          result.push(value);
        }
      }
      return result;
    };
  
    var flatten = function(input, shallow, strict, startIndex) {
      var output = [],
        idx = 0;
      for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
        var value = input[i];
        if (isArrayLike(value) && (lang.isArray(value) || lang.isArguments(value))) {
          //flatten current level of array or arguments object
          if (!shallow) value = flatten(value, shallow, strict);
          var j = 0,
            len = value.length;
          output.length += len;
          while (j < len) {
            output[idx++] = value[j++];
          }
        } else if (!strict) {
          output[idx++] = value;
        }
      }
      return output;
    };
  
    lang.flatten = function(array, shallow) {
      return flatten(array, shallow, false);
    };
  
    lang.union = function() {
      return uniqFn(flatten(arguments, true, true));
    };
  
    lang.difference = function(array) {
      var rest = flatten(arguments, true, true, 1);
      return filterFn(array, function(value) {
        return !containsFn(rest, value);
      });
    };
  
    function createPredicateIndexFinder(dir) {
      return function(array, predicate, context) {
        predicate = cb(predicate, context);
        var length = getLength(array);
        var index = dir > 0 ? 0 : length - 1;
        for (; index >= 0 && index < length; index += dir) {
          if (predicate(array[index], index, array)) return index;
        }
        return -1;
      };
    }
  
    var findIndexFn = lang.findIndex = createPredicateIndexFinder(1);
    var findLastIndexFn = lang.findLastIndex = createPredicateIndexFinder(-1);
  
    var sortedIndexFn = lang.sortedIndex = function(array, obj, iteratee, context) {
      iteratee = cb(iteratee, context, 1);
      var value = iteratee(obj);
      var low = 0,
        high = getLength(array);
      while (low < high) {
        var mid = Math.floor((low + high) / 2);
        if (iteratee(array[mid]) < value) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      return low;
    };
  
    function createIndexFinder(dir, predicateFind, sortedIndex) {
      return function(array, item, idx) {
        var i = 0,
          length = getLength(array);
        if (typeof idx == 'number') {
          if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
          } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
          }
        } else if (sortedIndex && idx && length) {
          idx = sortedIndex(array, item);
          return array[idx] === item ? idx : -1;
        }
        if (item !== item) {
          idx = predicateFind(slice.call(array, i, length), isNaNFn);
          return idx >= 0 ? idx + i : -1;
        }
        for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
          if (array[idx] === item) return idx;
        }
        return -1;
      };
    }
  
    var indexOfFn = lang.indexOf = createIndexFinder(1, findIndexFn, sortedIndexFn);
    lang.lastIndexOf = createIndexFinder(-1, findLastIndexFn);
  
    // objects
    // =================================================================================
  
    var keysFn = lang.keys = function(obj) {
      if (!isObjectFn(obj)) {
        return [];
      }
      if (nativeKeys) {
        return nativeKeys(obj);
      }
      var keys = [];
      for (var key in obj) {
        if (hasFn(obj, key)) {
          keys.push(key);
        }
      }
      return keys;
    };
  
    var allKeysFn = lang.allKeys = function(obj) {
      if (!isObjectFn(obj)) {
        return [];
      }
      var keys = [];
      for (var key in obj) {
        keys.push(key);
      }
      return keys;
    };
  
    var valuesFn = lang.values = function(obj) {
      var keys = keysFn(obj);
      var length = keys.length;
      var values = Array(length);
      for (var i = 0; i < length; i++) {
        values[i] = obj[keys[i]];
      }
      return values;
    };
  
    var invertFn = lang.invert = function(obj) {
      var result = {};
      var keys = keysFn(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        result[obj[keys[i]]] = keys[i];
      }
      return result;
    };
  
    var extendFn = lang.extend = createAssigner(allKeysFn);
  
    var assignFn = lang.assign = createAssigner(keysFn);
  
    var findKeyFn = lang.findKey = function(obj, predicate, context) {
      predicate = cb(predicate, context);
      var keys = keysFn(obj),
        key;
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (predicate(obj[key], key, obj)) {
          return key;
        }
      }
    };
  
    var pickFn = lang.pick = function(object, oiteratee, context) {
      var result = {},
        obj = object,
        iteratee, keys;
      if (obj == null) {
        return result;
      }
      if (lang.isFunction(oiteratee)) {
        keys = allKeysFn(obj);
        iteratee = optimizeCb(oiteratee, context);
      } else {
        keys = flatten(arguments, false, false, 1);
        iteratee = function(value, key, obj) {
          return key in obj;
        };
        obj = Object(obj);
      }
      for (var i = 0, length = keys.length; i < length; i++) {
        var key = keys[i];
        var value = obj[key];
        if (iteratee(value, key, obj)) {
          result[key] = value;
        }
      }
      return result;
    };
  
    lang.omit = function(obj, iteratee, context) {
      if (lang.isFunction(iteratee)) {
        iteratee = lang.negate(iteratee);
      } else {
        var keys = mapFn(flatten(arguments, false, false, 1), String);
        iteratee = function(value, key) {
          return !containsFn(keys, key);
        };
      }
      return pickFn(obj, iteratee, context);
    };
  
    lang.defaults = createAssigner(allKeysFn, true);
  
    lang.clone = function(obj) {
      if (!isObjectFn(obj)) {
        return obj;
      }
      return lang.isArray(obj) ? obj.slice() : extendFn({}, obj);
    };
  
    var isMatchFn = lang.isMatch = function(object, attrs) {
      var keys = keysFn(attrs),
        length = keys.length;
      if (object == null) {
        return !length;
      }
      var obj = Object(object);
      for (var i = 0; i < length; i++) {
        var key = keys[i];
        if (attrs[key] !== obj[key] || !(key in obj)) {
          return false;
        }
      }
      return true;
    };
  
    lang.isEmpty = function(obj) {
      if (obj == null) {
        return true;
      }
      if (isArrayLike(obj) && (lang.isArray(obj) || lang.isString(obj) || lang.isArguments(obj))) {
        return obj.length === 0;
      }
      return keysFn(obj).length === 0;
    };
  
    lang.isElement = function(obj) {
      return !!(obj && obj.nodeType === 1);
    };
  
    lang.isArray = nativeIsArray || function(obj) {
        return toString.call(obj) === '[object Array]';
      };
  
    var isObjectFn = lang.isObject = function(obj) {
      var type = typeof obj;
      return type === 'function' || type === 'object' && !!obj;
    };
  
    eachFn(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
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
  
    var isNaNFn = lang.isNaN = function(obj) {
      return lang.isNumber(obj) && obj !== +obj;
    };
  
    var isBooleanFn = lang.isBoolean = function(obj) {
      return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    };
  
    lang.isNull = function(obj) {
      return obj === null;
    };
  
    lang.isUndefined = function(obj) {
      return obj === void 0;
    };
  
    var isWindowFn = lang.isWindow = function(obj) {
      return obj != null && obj == obj.window;
    };
  
    lang.isPlainObject = function(obj) {
      return isObjectFn(obj) && !isWindowFn(obj) && Object.getPrototypeOf(obj) == Object.prototype;
    };
  
    lang.isDocument = function(obj) {
      return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
    };
  
    var hasFn = lang.has = function(obj, key) {
      return obj != null && hasOwnProperty.call(obj, key);
    };
  
    lang.inherits = function(protoProps, staticProps) {
      var parent = this;
      var child;
  
      if (protoProps && hasFn(protoProps, 'constructor')) {
        child = protoProps.constructor;
      } else {
        child = function() {
          return parent.apply(this, arguments);
        };
      }
  
      extendFn(child, parent, staticProps);
  
      var Surrogate = function() {
        this.constructor = child;
      };
      Surrogate.prototype = parent.prototype;
      child.prototype = new Surrogate;
  
      if (protoProps) {
        extendFn(child.prototype, protoProps);
      }
  
      child.__super__ = parent.prototype;
  
      return child;
    };
  
    // functions
    // =================================================================================
  
    var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
      if (!(callingContext instanceof boundFunc)) {
        return sourceFunc.apply(context, args);
      }
      var self = baseCreate(sourceFunc.prototype);
      var result = sourceFunc.apply(self, args);
      if (isObjectFn(result)) {
        return result;
      }
      return self;
    };
  
    var bindFn = lang.bind = function(func, context) {
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
  
    var partialFn = lang.partial = function(func) {
      var boundArgs = slice.call(arguments, 1);
      var bound = function() {
        var position = 0,
          length = boundArgs.length;
        var args = Array(length);
        for (var i = 0; i < length; i++) {
          args[i] = boundArgs[i] === lang ? arguments[position++] : boundArgs[i];
        }
        while (position < arguments.length) {
          args.push(arguments[position++]);
        }
        return executeBound(func, bound, this, this, args);
      };
      return bound;
    };
  
    lang.bindAll = function(obj) {
      var i, length = arguments.length,
        key;
      if (length <= 1) {
        throw new Error('bindAll must be passed function names');
      }
      for (i = 1; i < length; i++) {
        key = arguments[i];
        obj[key] = bindFn(obj[key], obj);
      }
      return obj;
    };
  
    lang.delay = function(func, wait) {
      var args = slice.call(arguments, 2);
      return setTimeout(function() {
        return func.apply(null, args);
      }, wait);
    };
  
    lang.throttle = function(func, wait, options) {
      var context, args, result;
      var timeout = null;
      var previous = 0;
      if (!options) {
        options = {};
      }
      var later = function() {
        previous = options.leading === false ? 0 : nowFn();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) {
          context = args = null;
        }
      };
      return function() {
        var now = nowFn();
        if (!previous && options.leading === false) {
          previous = now;
        }
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          previous = now;
          result = func.apply(context, args);
          if (!timeout) {
            context = args = null;
          }
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    };
  
    lang.debounce = function(func, wait, immediate) {
      var timeout, args, context, timestamp, result;
  
      var later = function() {
        var last = nowFn() - timestamp;
  
        if (last < wait && last >= 0) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) {
            result = func.apply(context, args);
            if (!timeout) {
              context = args = null;
            }
          }
        }
      };
  
      return function() {
        context = this;
        args = arguments;
        timestamp = nowFn();
        var callNow = immediate && !timeout;
        if (!timeout) {
          timeout = setTimeout(later, wait);
        }
        if (callNow) {
          result = func.apply(context, args);
          context = args = null;
        }
  
        return result;
      };
    };
  
    lang.negate = function(predicate) {
      return function() {
        return !predicate.apply(this, arguments);
      };
    };
  
    lang.after = function(times, func) {
      return function() {
        if (--times < 1) {
          return func.apply(this, arguments);
        }
      };
    };
  
    lang.before = function(times, func) {
      var memo;
      return function() {
        if (--times > 0) {
          memo = func.apply(this, arguments);
        }
        if (times <= 1) func = null;
        return memo;
      };
    };
  
    lang.once = partialFn(lang.before, 2);
  
    // utility
    // =================================================================================
  
    lang.noop = function() {};
  
    var matcherFn = lang.matcher = function(attrs) {
      attrs = assignFn({}, attrs);
      return function(obj) {
        return isMatchFn(obj, attrs);
      };
    };
  
    var nowFn = lang.now = Date.now || function() {
        return new Date().getTime();
      };
  
    var escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '`': '&#x60;'
    };
    var unescapeMap = invertFn(escapeMap);
  
    var createEscaper = function(map) {
      var escaper = function(match) {
        return map[match];
      };
      var source = '(?:' + keysFn(map).join('|') + ')';
      var testRegexp = RegExp(source);
      var replaceRegexp = RegExp(source, 'g');
      return function(string) {
        string = string == null ? '' : '' + string;
        return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
      };
    };
    lang.escape = createEscaper(escapeMap);
    lang.unescape = createEscaper(unescapeMap);
  
    lang.result = function(object, property, fallback) {
      var value = object == null ? void 0 : object[property];
      if (value === void 0) {
        value = fallback;
      }
      return lang.isFunction(value) ? value.call(object) : value;
    };
  
    var idCounter = 0;
    lang.uniqueId = function(prefix) {
      var id = ++idCounter + '';
      return prefix ? prefix + id : id;
    };
  
    lang.getParameterByName = function(name) {
      name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
      var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(location.search);
      return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };
  
    lang.camelize = function(str) {
      return str.replace(/-+(.)?/g, function(match, chr) {
        return chr ? chr.toUpperCase() : '';
      });
    };
  
    var rAFrameFn = (function() {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 16);
        };
    })();
  
    var cancelAnimationFrame = window.cancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      window.webkitCancelRequestAnimationFrame;
  
    lang.requestAnimationFrame = function(cb) {
      return rAFrameFn(cb);
    };
  
    lang.cancelAnimationFrame = function(requestId) {
      cancelAnimationFrame(requestId);
    };
  
    lang.adjustTitle = function(title) {
      lang.requestAnimationFrame(function() {
        document.title = title;
      });
    };
  
    var encodeUrlParamsFn = lang.encodeUrlParams = function(params) {
      var buf = [];
      var encodeString = function(str) {
        return encodeURIComponent(str).replace(/[!'()]/g, escape).replace(/\*/g, '%2A');
      };
  
      eachFn(params, function(value, key) {
        if (buf.length) {
          buf.push('&');
        }
        buf.push(encodeString(key), '=', encodeString(value));
      });
      return buf.join('').replace(/%20/g, '+');
    };
  
    function buildUrl(beforeQmark, fromQmark, optQuery, optParams) {
      var urlWithoutQuery = beforeQmark;
      var query = fromQmark ? fromQmark.slice(1) : null;
  
      if (lang.isString(optQuery)) {
        query = String(optQuery);
      }
  
      if (optParams) {
        query = query || '';
        var prms = encodeUrlParamsFn(optParams);
        if (query && prms) {
          query += '&';
        }
        query += prms;
      }
  
      var url = urlWithoutQuery;
      if (query !== null) {
        url += ('?' + query);
      }
  
      return url;
    }
  
    lang.constructUrl = function(url, query, params) {
      var queryMatch = /^(.*?)(\?.*)?$/.exec(url);
      return buildUrl(queryMatch[1], queryMatch[2], query, params);
    };
  
    module.exports = lang;
  
  });

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
    Logger.ERROR = defineLogLevel(5, 'ERROR');
    Logger.OFF = defineLogLevel(6, 'OFF');
  
    var LoggerClass = function(defaultContext) {
      this.context = defaultContext;
      this.setLevel(defaultContext.filterLevel);
      this.log = this.info;
    };
  
    LoggerClass.prototype = {
  
      setLevel: function(newLevel) {
        if (newLevel && ('value' in newLevel)) {
          this.context.filterLevel = newLevel;
        }
      },
  
      enabledFor: function(level) {
        var filterLevel = this.context.filterLevel;
        return level.value >= filterLevel.value;
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
        if (lang.isString(label) && label.length > 0) {
          this.invoke(Logger.TIME, [label, 'start']);
        }
      },
  
      timeEnd: function(label) {
        if (lang.isString(label) && label.length > 0) {
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
  
    var globalLogger = new LoggerClass({
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
        (contextualLoggersByNameMap[name] = new LoggerClass(lang.extend({
          name: name
        }, globalLogger.context)));
    };
  
    Logger.useDefaults = function(options) {
      options = options || {};
  
      options.formatter = options.formatter || defaultMessageFormatter;
  
      if (lang.isUndefined(console)) {
        return;
      }
  
      Logger.setLevel(options.defaultLevel || Logger.DEBUG);
      Logger.setHandler(function(messages, context) {
        messages = Array.prototype.slice.call(messages);
  
        var logFn = console.log;
        var timerLabel;
  
        if (context.level === Logger.TIME) {
          timerLabel = (context.name ? '[' + context.name + '] ' : '') + messages[0];
  
          if (messages[1] === 'start') {
            if (console.time) {
              console.time(timerLabel);
            }
          } else {
            if (console.timeEnd) {
              console.timeEnd(timerLabel);
            }
          }
        } else {
          if (context.level === Logger.WARN) {
            logFn = console.warn;
          } else if (context.level === Logger.ERROR) {
            logFn = console.error;
          } else if (context.level === Logger.INFO) {
            logFn = console.info;
          }
  
          options.formatter(messages, context);
          logFn.apply(console, messages);
        }
      });
    };
  
    module.exports = Logger;
  
  });

  define('mob/error', function(require, exports, module) {
  
    var lang = require('mob/lang');
  
    var errorProps = ['description', 'fileName', 'lineNumber', 'name', 'message', 'number'];
  
    var MoError = lang.inherits.call(Error, {
  
      urlRoot: 'http://xscripter.com/mobjs/docs/v' + Mob.VERSION + '/',
  
      constructor: function(message, options) {
        if (lang.isObject(message)) {
          options = message;
          message = options.message;
        } else if (!options) {
          options = {};
        }
  
        var error = Error.call(this, message);
        lang.extend(this, lang.pick(error, errorProps), lang.pick(options, errorProps));
  
        this.captureStackTrace();
  
        if (options.url) {
          this.url = this.urlRoot + options.url;
        }
      },
  
      captureStackTrace: function() {
        if (Error.captureStackTrace) {
          Error.captureStackTrace(this, MoError);
        }
      },
  
      toString: function() {
        return this.name + ': ' + this.message + (this.url ? ' See: ' + this.url : '');
      }
    });
  
    MoError.extend = lang.inherits;
  
    module.exports = MoError;
  
  });

  define('mob/jqlite', function(require, exports, module) {
  
    var lang = require('mob/lang');
  
    var undefined,
      isUndefined = lang.isUndefined,
      $,
      jqlite = {},
      ArrayProto = Array.prototype,
      slice = ArrayProto.slice,
      filter = ArrayProto.filter,
      document = window.document,
  
      filters,
      fragmentRE = /^\s*<(\w+|!)[^>]*>/,
      singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
      filterRe = new RegExp('(.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*'),
      childRe = /^\s*>/,
      classTag = 'JQLite' + (+new Date()),
      methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
      tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
      table = document.createElement('table'),
      tableRow = document.createElement('tr'),
      containers = {
        'tr': document.createElement('tbody'),
        'tbody': table,
        'thead': table,
        'tfoot': table,
        'td': tableRow,
        'th': tableRow,
        '*': document.createElement('div')
      },
      simpleSelectorRE = /^[\w-]*$/,
      tempParent = document.createElement('div'),
  
      elementDisplay = {},
      classCache = {},
      cssNumber = {
        'column-count': 1,
        'columns': 1,
        'font-weight': 1,
        'line-height': 1,
        'opacity': 1,
        'z-index': 1,
        'zoom': 1
      },
      classList,
      capitalRE = /([A-Z])/g,
      readyRE = /complete|loaded|interactive/,
      rootNodeRE = /^(?:body|html)$/i,
      propMap = {
        'tabindex': 'tabIndex',
        'readonly': 'readOnly',
        'for': 'htmlFor',
        'class': 'className',
        'maxlength': 'maxLength',
        'cellspacing': 'cellSpacing',
        'cellpadding': 'cellPadding',
        'rowspan': 'rowSpan',
        'colspan': 'colSpan',
        'usemap': 'useMap',
        'frameborder': 'frameBorder',
        'contenteditable': 'contentEditable'
      },
      duuid = 0,
      dataCache = {},
      dataExp = 'JQLite' + lang.now(),
  
      evtId = 1,
      evtHandlers = {},
      specialEvents = {
        click: 'MouseEvents',
        mousedown: 'MouseEvents',
        mouseup: 'MouseEvents',
        mousemove: 'MouseEvents'
      },
      evtFocusinSupported = 'onfocusin' in window,
      focus = {
        focus: 'focusin',
        blur: 'focusout'
      },
      hover = {
        mouseenter: 'mouseover',
        mouseleave: 'mouseout'
      },
  
      returnTrue = function() {
        return true
      },
      returnFalse = function() {
        return false
      },
      ignoreEvtProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      };
  
    function visible(elem) {
      elem = $(elem);
      return !!(elem.width() || elem.height()) && elem.css('display') !== 'none';
    }
  
    function uniq(array) {
      return filter.call(array, function(item, idx) {
        return array.indexOf(item) == idx;
      });
    }
  
    function likeArray(obj) {
      return typeof obj.length == 'number';
    }
  
    function compact(array) {
      return filter.call(array, function(item) {
        return item != null;
      });
    }
  
    function flatten(array) {
      return array.length > 0 ? $.fn.concat.apply([], array) : array;
    }
  
    function processSelector(sel, fn) {
      sel = sel.replace(/=#\]/g, '="#"]');
      var filter, arg, match = filterRe.exec(sel);
      if (match && match[2] in filters) {
        filter = filters[match[2]];
        arg = match[3];
        sel = match[1];
        if (arg) {
          var num = Number(arg);
          if (isNaN(num)) {
            arg = arg.replace(/^["']|["']$/g, '');
          } else {
            arg = num;
          }
        }
      }
      return fn(sel, filter, arg);
    }
  
    function doMatches(element, selector) {
  
      if (!selector || !element || element.nodeType !== 1) {
        return false;
      }
  
      var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
          element.oMatchesSelector || element.matchesSelector,
        match, parent = element.parentNode,
        temp = !parent;
  
      if (matchesSelector) {
        return matchesSelector.call(element, selector);
      }
  
      if (temp) {
        (parent = tempParent).appendChild(element);
      }
  
      match = ~jqlite.qsa(parent, selector).indexOf(element);
      temp && tempParent.removeChild(element);
      return match;
  
    }
  
    function doQsa(element, selector) {
      var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector,
        isSimple = simpleSelectorRE.test(nameOnly);
  
      return (lang.isDocument(element) && isSimple && maybeID) ?
        ((found = element.getElementById(nameOnly)) ? [found] : []) :
        (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
          slice.call(
            isSimple && !maybeID ?
              maybeClass ? element.getElementsByClassName(nameOnly) :
                element.getElementsByTagName(selector) :
              element.querySelectorAll(selector)
          );
    }
  
    function dataAttr(name, value) {
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase();
      var data = (1 in arguments) ? this.attr(attrName, value) : this.attr(attrName);
      return data !== null ? deserializeValue(data) : undefined;
    }
  
    function getData(node, name) {
      var id = node[dataExp],
        store = id && dataCache[id];
      if (isUndefined(name)) {
        return store || setData(node);
      } else {
        if (store) {
          if (name in store) {
            return store[name];
          }
          var camelName = lang.camelize(name);
          if (camelName in store) {
            return store[camelName];
          }
        }
        return dataAttr.call($(node), name);
      }
    }
  
    function setData(node, name, value) {
      var id = node[dataExp] || (node[dataExp] = ++duuid),
        store = dataCache[id] || (dataCache[id] = attributeData(node));
      if (!isUndefined(name)) {
        store[lang.camelize(name)] = value;
      }
      return store;
    }
  
    function attributeData(node) {
      var store = {};
      $.each(node.attributes || [], function(i, attr) {
        if (attr.name.indexOf('data-') == 0) {
          store[lang.camelize(attr.name.replace('data-', ''))] = deserializeValue(attr.value);
        }
      });
      return store;
    }
  
    function setEvtId(element) {
      return element.evtId || (element.evtId = evtId++);
    }
  
    function findHandlers(element, event, fn, selector) {
      event = parseEvt(event);
      if (event.ns) {
        var matcher = matcherForEvt(event.ns);
      }
      return (evtHandlers[setEvtId(element)] || []).filter(function(handler) {
        return handler && (!event.e || handler.e == event.e) && (!event.ns || matcher.test(handler.ns)) && (!fn || setEvtId(handler.fn) === setEvtId(fn)) && (!selector || handler.sel == selector);
      });
    }
  
    function parseEvt(event) {
      var parts = ('' + event).split('.');
      return {
        e: parts[0],
        ns: parts.slice(1).sort().join(' ')
      };
    }
  
    function matcherForEvt(ns) {
      return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)');
    }
  
    function eventCapture(handler, captureSetting) {
      return handler.del && (!evtFocusinSupported && (handler.e in focus)) || !!captureSetting;
    }
  
    function realEvent(type) {
      return hover[type] || (evtFocusinSupported && focus[type]) || type;
    }
  
    function addEvt(element, events, fn, data, selector, delegator, capture) {
      var id = setEvtId(element),
        set = (evtHandlers[id] || (evtHandlers[id] = []));
  
      events.split(/\s/).forEach(function(event) {
        if (event == 'ready') {
          return $(document).ready(fn);
        }
        var handler = parseEvt(event);
        handler.fn = fn;
        handler.sel = selector;
  
        if (handler.e in hover) {
          fn = function(e) {
            var related = e.relatedTarget;
            if (!related || (related !== this && !$.contains(this, related))) {
              return handler.fn.apply(this, arguments);
            }
          };
        }
        handler.del = delegator;
        var callback = delegator || fn;
        handler.proxy = function(e) {
          e = compatibleEvt(e);
          if (e.isImmediatePropagationStopped()) {
            return;
          }
          e.data = data;
          var result = callback.apply(element, isUndefined(e._args) ? [e] : [e].concat(e._args));
          if (result === false) {
            e.preventDefault();
            e.stopPropagation();
          }
          return result;
        };
  
        handler.i = set.length;
        set.push(handler);
        if ('addEventListener' in element) {
          element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
        }
      });
    }
  
    function removeEvt(element, events, fn, selector, capture) {
      var id = setEvtId(element);
      (events || '').split(/\s/).forEach(function(event) {
        findHandlers(element, event, fn, selector).forEach(function(handler) {
          delete evtHandlers[id][handler.i];
          if ('removeEventListener' in element) {
            element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
          }
        });
      });
    }
  
    function compatibleEvt(event, source) {
      if (source || !event.isDefaultPrevented) {
        source || (source = event);
  
        $.each(eventMethods, function(name, predicate) {
          var sourceMethod = source[name];
          event[name] = function() {
            this[predicate] = returnTrue;
            return sourceMethod && sourceMethod.apply(source, arguments);
          };
          event[predicate] = returnFalse;
        });
  
        if (!isUndefined(source.defaultPrevented) ? source.defaultPrevented :
            'returnValue' in source ? source.returnValue === false :
            source.getPreventDefault && source.getPreventDefault()) {
          event.isDefaultPrevented = returnTrue;
        }
      }
      return event;
    }
  
    function createProxy(event) {
      var key, proxy = {
        originalEvent: event
      };
  
      for (key in event) {
        if (!ignoreEvtProperties.test(key) && !isUndefined(event[key])) {
          proxy[key] = event[key];
        }
      }
  
      return compatibleEvt(proxy, event);
    }
  
    function dasherize(str) {
      return str.replace(/::/g, '/')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')
        .replace(/_/g, '-')
        .toLowerCase();
    }
  
    function classRE(name) {
      return name in classCache ? classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'));
    }
  
    function maybeAddPx(name, value) {
      return (typeof value == 'number' && !cssNumber[dasherize(name)]) ? value + 'px' : value;
    }
  
    function defaultDisplay(nodeName) {
      var element, display;
      if (!elementDisplay[nodeName]) {
        element = document.createElement(nodeName);
        document.body.appendChild(element);
        display = getComputedStyle(element, '').getPropertyValue('display');
        element.parentNode.removeChild(element);
        display == 'none' && (display = 'block');
        elementDisplay[nodeName] = display;
      }
      return elementDisplay[nodeName];
    }
  
    function children(element) {
      return 'children' in element ?
        slice.call(element.children) :
        $.map(element.childNodes, function(node) {
          if (node.nodeType == 1) {
            return node;
          }
        });
    }
  
    function filtered(nodes, selector) {
      return selector == null ? $(nodes) : $(nodes).filter(selector);
    }
  
    function funcArg(context, arg, idx, payload) {
      return lang.isFunction(arg) ? arg.call(context, idx, payload) : arg;
    }
  
    function setAttribute(node, name, value) {
      value == null ? node.removeAttribute(name) : node.setAttribute(name, value);
    }
  
    function className(node, value) {
      var klass = node.className || '',
        svg = klass && !isUndefined(klass.baseVal);
  
      if (isUndefined(value)) {
        return svg ? klass.baseVal : klass;
      }
      svg ? (klass.baseVal = value) : (node.className = value);
    }
  
    function deserializeValue(value) {
      try {
        return value ? value == 'true' || (value == 'false' ? false : value == 'null' ? null : +value + '' == value ? +value : /^[\[\{]/.test(value) ? JSON.parse(value) : value) : value;
      } catch (e) {
        return value;
      }
    }
  
    function traverseNode(node, fun) {
      fun(node);
      for (var i = 0, len = node.childNodes.length; i < len; i++) {
        traverseNode(node.childNodes[i], fun);
      }
    }
  
    $ = function(selector, context) {
      return jqlite.init(selector, context);
    };
  
    $.expr = [];
  
    filters = $.expr[':'] = {
      visible: function() {
        if (visible(this)) {
          return this;
        }
      },
      hidden: function() {
        if (!visible(this)) {
          return this;
        }
      },
      selected: function() {
        if (this.selected) {
          return this;
        }
      },
      checked: function() {
        if (this.checked) {
          return this;
        }
      },
      parent: function() {
        return this.parentNode;
      },
      first: function(idx) {
        if (idx === 0) {
          return this;
        }
      },
      last: function(idx, nodes) {
        if (idx === nodes.length - 1) {
          return this;
        }
      },
      eq: function(idx, _, value) {
        if (idx === value) {
          return this;
        }
      },
      contains: function(idx, _, text) {
        if ($(this).text().indexOf(text) > -1) {
          return this;
        }
      },
      has: function(idx, _, sel) {
        if (jqlite.qsa(this, sel).length) {
          return this;
        }
      }
    };
  
    $.contains = document.documentElement.contains ?
      function(parent, node) {
        return parent !== node && parent.contains(node);
      } :
      function(parent, node) {
        while (node && (node = node.parentNode))
          if (node === parent) {
            return true;
          }
        return false;
      };
  
    $.map = function(elements, callback) {
      var value, values = [],
        i, key;
      if (likeArray(elements)) {
        for (i = 0; i < elements.length; i++) {
          value = callback(elements[i], i);
          if (value != null) {
            values.push(value);
          }
        }
      } else {
        for (key in elements) {
          value = callback(elements[key], key);
          if (value != null) {
            values.push(value);
          }
        }
      }
  
      return flatten(values);
    };
  
    $.each = function(elements, callback) {
      var i, key;
      if (likeArray(elements)) {
        for (i = 0; i < elements.length; i++) {
          if (callback.call(elements[i], i, elements[i]) === false) {
            return elements;
          }
        }
      } else {
        for (key in elements) {
          if (callback.call(elements[key], key, elements[key]) === false) {
            return elements;
          }
        }
      }
  
      return elements;
    };
  
    $.proxy = function(fn, context) {
  
      var args = (2 in arguments) && slice.call(arguments, 2);
      if (lang.isFunction(fn)) {
        var proxyFn = function() {
          return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments);
        };
        proxyFn.evtId = setEvtId(fn);
        return proxyFn;
      } else if (lang.isString(context)) {
        if (args) {
          args.unshift(fn[context], fn);
          return $.proxy.apply(null, args);
        } else {
          return $.proxy(fn[context], fn);
        }
      } else {
        throw new TypeError('expected function');
      }
    };
  
    $.event = {
      add: addEvt,
      remove: removeEvt
    };
  
    $.Event = function(type, props) {
      if (!lang.isString(type)) {
        props = type;
        type = props.type;
      }
      var event = document.createEvent(specialEvents[type] || 'Events'),
        bubbles = true;
      if (props) {
        for (var name in props) {
          (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name]);
        }
      }
      event.initEvent(type, bubbles, true);
      return compatibleEvt(event);
    };
  
    jqlite.jQ = function(dom, selector) {
      dom = dom || [];
      dom.__proto__ = $.fn;
      dom.selector = selector || '';
      return dom;
    };
  
    jqlite.isJQ = function(object) {
      return object instanceof jqlite.jQ;
    };
  
    jqlite.qsa = function(node, selector) {
      return processSelector(selector, function(sel, filter, arg) {
        try {
          var taggedParent;
          if (!sel && filter) {
            sel = '*';
          } else if (childRe.test(sel)) {
            taggedParent = $(node).addClass(classTag);
            sel = '.' + classTag + ' ' + sel;
          }
  
          var nodes = doQsa(node, sel);
        } catch (e) {
          lang.error('error performing selector: %o', selector);
          throw e;
        } finally {
          if (taggedParent) {
            taggedParent.removeClass(classTag);
          }
        }
        return !filter ? nodes : uniq($.map(nodes, function(n, i) {
            return filter.call(n, i, nodes, arg);
          }));
      });
    };
  
    jqlite.matches = function(node, selector) {
      return processSelector(selector, function(sel, filter, arg) {
        return (!sel || doMatches(node, sel)) && (!filter || filter.call(node, null, arg) === node);
      });
    };
  
    jqlite.fragment = function(html, name, properties) {
  
      var dom, nodes, container;
  
      if (singleTagRE.test(html)) {
        dom = $(document.createElement(RegExp.$1));
      }
  
      if (!dom) {
        if (html.replace) {
          html = html.replace(tagExpanderRE, '<$1></$2>');
        }
        if (isUndefined(name)) {
          name = fragmentRE.test(html) && RegExp.$1;
        }
        if (!(name in containers)) {
          name = '*';
        }
  
        container = containers[name];
        container.innerHTML = '' + html;
        dom = $.each(slice.call(container.childNodes), function() {
          container.removeChild(this);
        });
      }
  
      if (lang.isPlainObject(properties)) {
        nodes = $(dom);
        $.each(properties, function(key, value) {
          if (methodAttributes.indexOf(key) > -1) {
            nodes[key](value);
          } else {
            nodes.attr(key, value);
          }
        });
      }
  
      return dom;
    };
  
    jqlite.init = function(selector, context) {
      var dom;
      if (!selector) {
        return jqlite.jQ();
      } else if (typeof selector == 'string') {
  
        selector = selector.trim();
        if (selector[0] == '<' && fragmentRE.test(selector)) {
          dom = jqlite.fragment(selector, RegExp.$1, context);
          selector = null;
        } else if (!isUndefined(context)) {
          return $(context).find(selector);
        } else {
          dom = jqlite.qsa(document, selector);
        }
      } else if (lang.isFunction(selector)) {
        return $(document).ready(selector);
      } else if (jqlite.isJQ(selector)) {
        return selector;
      } else {
        if (lang.isArray(selector)) {
          dom = compact(selector);
        } else if (lang.isObject(selector)) {
          dom = [selector];
          selector = null;
        } else if (fragmentRE.test(selector)) {
          dom = jqlite.fragment(selector.trim(), RegExp.$1, context);
          selector = null;
        } else if (!isUndefined(context)) {
          return $(context).find(selector);
        } else {
          dom = jqlite.qsa(document, selector);
        }
      }
      return jqlite.jQ(dom, selector);
    };
  
    $.fn = {
  
      forEach: ArrayProto.forEach,
      indexOf: ArrayProto.indexOf,
      concat: ArrayProto.concat,
      map: function(fn) {
        return $($.map(this, function(el, i) {
          return fn.call(el, i, el);
        }));
      },
      slice: function() {
        return $(slice.apply(this, arguments));
      },
      each: function(callback) {
        ArrayProto.every.call(this, function(el, idx) {
          return callback.call(el, idx, el) !== false;
        });
        return this;
      },
  
      ready: function(callback) {
        if (readyRE.test(document.readyState) && document.body) {
          callback($);
        } else {
          document.addEventListener('DOMContentLoaded', function() {
            callback($);
          }, false);
        }
        return this;
      },
  
      get: function(idx) {
        return isUndefined(idx) ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length];
      },
  
      size: function() {
        return this.length;
      },
  
      remove: function() {
  
        var elements = this.find('*');
        elements = elements.add(this);
        elements.removeData();
  
        return this.each(function() {
          if (this.parentNode != null) {
            this.parentNode.removeChild(this);
          }
        });
      },
  
      filter: function(selector) {
        if (lang.isFunction(selector)) {
          return this.not(this.not(selector));
        }
        return $(filter.call(this, function(element) {
          return jqlite.matches(element, selector);
        }));
      },
  
      add: function(selector, context) {
        return $(uniq(this.concat($(selector, context))));
      },
  
      not: function(selector) {
        var nodes = [];
        if (lang.isFunction(selector) && !isUndefined(selector.call)) {
          this.each(function(idx) {
            if (!selector.call(this, idx)) {
              nodes.push(this);
            }
          });
        } else {
          var excludes = typeof selector == 'string' ? this.filter(selector) :
            (likeArray(selector) && lang.isFunction(selector.item)) ? slice.call(selector) : $(selector);
          this.forEach(function(el) {
            if (excludes.indexOf(el) < 0) {
              nodes.push(el);
            }
          });
        }
        return $(nodes);
      },
  
      eq: function(idx) {
        return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1);
      },
  
      first: function() {
        var el = this[0];
        return el && !lang.isObject(el) ? el : $(el);
      },
  
      find: function(selector) {
        var result,
          $this = this;
        if (!selector) {
          result = $();
        } else if (typeof selector == 'object') {
          result = $(selector).filter(function() {
            var node = this;
            return ArrayProto.some.call($this, function(parent) {
              return $.contains(parent, node);
            });
          });
        } else if (this.length == 1) {
          result = $(jqlite.qsa(this[0], selector));
        } else {
          result = this.map(function() {
            return jqlite.qsa(this, selector);
          });
        }
        return result;
      },
  
      closest: function(selector, context) {
        var node = this[0],
          collection = false;
        if (typeof selector == 'object') {
          collection = $(selector);
        }
        while (node && !(collection ? collection.indexOf(node) >= 0 : jqlite.matches(node, selector))) {
          node = node !== context && !lang.isDocument(node) && node.parentNode;
        }
        return $(node);
      },
  
      parents: function(selector) {
        var ancestors = [],
          nodes = this;
        while (nodes.length > 0) {
          nodes = $.map(nodes, function(node) {
            if ((node = node.parentNode) && !lang.isDocument(node) && ancestors.indexOf(node) < 0) {
              ancestors.push(node);
              return node;
            }
          });
        }
  
        return filtered(ancestors, selector);
      },
  
      parent: function(selector) {
        return filtered(uniq(this.pluck('parentNode')), selector);
      },
  
      children: function(selector) {
        return filtered(this.map(function() {
          return children(this);
        }), selector);
      },
  
      contents: function() {
        return this.map(function() {
          return slice.call(this.childNodes);
        });
      },
  
      siblings: function(selector) {
        return filtered(this.map(function(i, el) {
          return filter.call(children(el.parentNode), function(child) {
            return child !== el;
          });
        }), selector);
      },
  
      empty: function() {
  
        var elements = this.find('*');
        elements.removeData();
  
        return this.each(function() {
          this.innerHTML = '';
        });
      },
  
      pluck: function(property) {
        return $.map(this, function(el) {
          return el[property];
        });
      },
  
      show: function() {
        return this.each(function() {
          this.style.display == 'none' && (this.style.display = '');
          if (getComputedStyle(this, '').getPropertyValue('display') == 'none') {
            this.style.display = defaultDisplay(this.nodeName);
          }
        });
      },
  
      replaceWith: function(newContent) {
        return this.before(newContent).remove();
      },
  
      wrap: function(structure) {
        var func = lang.isFunction(structure);
        if (this[0] && !func) {
          var dom = $(structure).get(0),
            clone = dom.parentNode || this.length > 1;
        }
  
        return this.each(function(index) {
          $(this).wrapAll(func ? structure.call(this, index) : clone ? dom.cloneNode(true) : dom);
        });
      },
  
      wrapAll: function(structure) {
        if (this[0]) {
          $(this[0]).before(structure = $(structure));
          var children;
  
          while ((children = structure.children()).length) {
            structure = children.first();
          }
  
          $(structure).append(this);
        }
        return this;
      },
  
      clone: function() {
        return this.map(function() {
          return this.cloneNode(true);
        });
      },
  
      hide: function() {
        return this.css('display', 'none');
      },
  
      toggle: function(setting) {
        return this.each(function() {
          var el = $(this);
          (isUndefined(setting) ? el.css('display') == 'none' : setting) ? el.show(): el.hide();
        });
      },
  
      prev: function(selector) {
        return $(this.pluck('previousElementSibling')).filter(selector || '*');
      },
  
      next: function(selector) {
        return $(this.pluck('nextElementSibling')).filter(selector || '*');
      },
  
      html: function(html) {
        return 0 in arguments ?
          this.each(function(idx) {
            var originHtml = this.innerHTML;
            $(this).empty().append(funcArg(this, html, idx, originHtml));
          }) : (0 in this ? this[0].innerHTML : null);
      },
  
      text: function(text) {
        return 0 in arguments ?
          this.each(function(idx) {
            var newText = funcArg(this, text, idx, this.textContent);
            this.textContent = newText == null ? '' : '' + newText;
          }) : (0 in this ? this[0].textContent : null);
      },
  
      attr: function(name, value) {
        var result, key;
        return (typeof name == 'string' && !(1 in arguments)) ?
          (!this.length || this[0].nodeType !== 1 ? undefined :
              (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
          ) :
          this.each(function(idx) {
            if (this.nodeType !== 1) {
              return;
            }
            if (lang.isObject(name)) {
              for (key in name) {
                setAttribute(this, key, name[key]);
              }
            } else {
              setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)));
            }
          });
      },
  
      removeAttr: function(name) {
        return this.each(function() {
          this.nodeType === 1 && name.split(' ').forEach(function(attribute) {
            setAttribute(this, attribute);
          }, this);
        });
      },
  
      prop: function(name, value) {
        name = propMap[name] || name;
        return (1 in arguments) ?
          this.each(function(idx) {
            this[name] = funcArg(this, value, idx, this[name]);
          }) : (this[0] && this[0][name]);
      },
  
      val: function(value) {
        return 0 in arguments ?
          this.each(function(idx) {
            this.value = funcArg(this, value, idx, this.value);
          }) :
          (this[0] && (this[0].multiple ?
            $(this[0]).find('option').filter(function() {
              return this.selected;
            }).pluck('value') : this[0].value));
      },
  
      offset: function(coordinates) {
        if (coordinates) {
          return this.each(function(index) {
            var $this = $(this),
              coords = funcArg(this, coordinates, index, $this.offset()),
              parentOffset = $this.offsetParent().offset(),
              props = {
                top: coords.top - parentOffset.top,
                left: coords.left - parentOffset.left
              };
  
            if ($this.css('position') == 'static') {
              props['position'] = 'relative';
            }
            $this.css(props);
          });
        }
  
        if (!this.length) {
          return null;
        }
        var obj = this[0].getBoundingClientRect();
        return {
          left: obj.left + window.pageXOffset,
          top: obj.top + window.pageYOffset,
          width: Math.round(obj.width),
          height: Math.round(obj.height)
        };
      },
  
      css: function(property, value) {
        if (arguments.length < 2) {
          var computedStyle, element = this[0];
          if (!element) {
            return;
          }
          computedStyle = getComputedStyle(element, '');
          if (typeof property == 'string') {
            return element.style[lang.camelize(property)] || computedStyle.getPropertyValue(property);
          } else if (lang.isArray(property)) {
            var props = {};
            $.each(property, function(_, prop) {
              props[prop] = (element.style[lang.camelize(prop)] || computedStyle.getPropertyValue(prop));
            });
            return props;
          }
        }
  
        var css = '',
          key;
        if (lang.isString(property)) {
          if (!value && value !== 0) {
            this.each(function() {
              this.style.removeProperty(dasherize(property));
            });
          } else {
            css = dasherize(property) + ':' + maybeAddPx(property, value);
          }
        } else {
          for (key in property) {
            if (!property[key] && property[key] !== 0) {
              this.each(function() {
                this.style.removeProperty(dasherize(key));
              });
            } else {
              css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';';
            }
          }
        }
  
        return this.each(function() {
          this.style.cssText += ';' + css;
        });
      },
  
      hasClass: function(name) {
        if (!name) {
          return false;
        }
        return ArrayProto.some.call(this, function(el) {
          return this.test(className(el));
        }, classRE(name));
      },
  
      addClass: function(name) {
        if (!name) {
          return this;
        }
        return this.each(function(idx) {
          if (!('className' in this)) {
            return;
          }
          classList = [];
          var cls = className(this),
            newName = funcArg(this, name, idx, cls);
          newName.split(/\s+/g).forEach(function(klass) {
            if (!$(this).hasClass(klass)) {
              classList.push(klass);
            }
          }, this);
          classList.length && className(this, cls + (cls ? ' ' : '') + classList.join(' '));
        });
      },
  
      removeClass: function(name) {
        return this.each(function(idx) {
          if (!('className' in this)) {
            return;
          }
          if (isUndefined(name)) {
            return className(this, '');
          }
          classList = className(this);
          funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass) {
            classList = classList.replace(classRE(klass), ' ');
          });
          className(this, classList.trim());
        });
      },
  
      toggleClass: function(name, when) {
        if (!name) {
          return this;
        }
        return this.each(function(idx) {
          var $this = $(this),
            names = funcArg(this, name, idx, className(this));
          names.split(/\s+/g).forEach(function(klass) {
            (isUndefined(when) ? !$this.hasClass(klass) : when) ?
              $this.addClass(klass): $this.removeClass(klass);
          });
        });
      },
  
      offsetParent: function() {
        return this.map(function() {
          var parent = this.offsetParent || document.body;
          while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css('position') == 'static') {
            parent = parent.offsetParent;
          }
          return parent;
        });
      },
  
      data: function(name, value) {
        return isUndefined(value) ?
          lang.isPlainObject(name) ?
            this.each(function(i, node) {
              $.each(name, function(key, value) {
                setData(node, key, value);
              });
            }) :
            (0 in this ? getData(this[0], name) : undefined) :
          this.each(function() {
            setData(this, name, value);
          });
      },
  
      removeData: function(names) {
        if (typeof names == 'string') {
          names = names.split(/\s+/);
        }
        return this.each(function() {
          var id = this[dataExp],
            store = id && dataCache[id];
          if (store) {
            $.each(names || store, function(key) {
              delete store[names ? lang.camelize(this) : key];
            });
          }
        });
      },
  
      on: function(event, selector, data, callback, one) {
        var autoRemove, delegator, $this = this;
  
        if (event && !lang.isString(event)) {
          $.each(event, function(type, fn) {
            $this.on(type, selector, data, fn, one);
          });
          return $this;
        }
  
        if (!lang.isString(selector) && !lang.isFunction(callback) && callback !== false) {
          callback = data;
          data = selector;
          selector = undefined;
        }
        if (lang.isFunction(data) || data === false) {
          callback = data;
          data = undefined;
        }
  
        if (callback === false) {
          callback = returnFalse;
        }
  
        return $this.each(function(_, element) {
          if (one) {
            autoRemove = function(e) {
              removeEvt(element, e.type, callback);
              return callback.apply(this, arguments);
            };
          }
  
          if (selector) {
            delegator = function(e) {
              var evt, match = $(e.target).closest(selector, element).get(0);
              if (match && match !== element) {
                evt = lang.extend(createProxy(e), {
                  currentTarget: match,
                  liveFired: element
                });
                return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)));
              }
            };
          }
  
          addEvt(element, event, callback, data, selector, delegator || autoRemove);
        })
      },
  
      off: function(event, selector, callback) {
        var $this = this;
        if (event && !lang.isString(event)) {
          $.each(event, function(type, fn) {
            $this.off(type, selector, fn);
          });
          return $this;
        }
  
        if (!lang.isString(selector) && !lang.isFunction(callback) && callback !== false) {
          callback = selector;
          selector = undefined;
        }
  
        if (callback === false) {
          callback = returnFalse;
        }
  
        return $this.each(function() {
          removeEvt(this, event, callback, selector);
        });
      },
  
      bind: function(event, data, callback) {
        return this.on(event, data, callback);
      },
  
      unbind: function(event, callback) {
        return this.off(event, callback);
      },
  
      one: function(event, selector, data, callback) {
        return this.on(event, selector, data, callback, 1);
      },
  
      trigger: function(event, args) {
        event = (lang.isString(event) || lang.isPlainObject(event)) ? $.Event(event) : compatibleEvt(event);
        event._args = args;
        return this.each(function() {
          if (event.type in focus && typeof this[event.type] == 'function') {
            this[event.type]();
          } else if ('dispatchEvent' in this) {
            this.dispatchEvent(event);
          } else {
            $(this).triggerHandler(event, args);
          }
        });
      },
  
      triggerHandler: function(event, args) {
        var e, result;
  
        this.each(function(i, element) {
          e = createProxy(lang.isString(event) ? $.Event(event) : event);
          e._args = args;
          e.target = element;
          $.each(findHandlers(element, event.type || event), function(i, handler) {
            result = handler.proxy(e);
            if (e.isImmediatePropagationStopped()) {
              return false;
            }
          });
        });
        return result;
      }
  
    };
  
    $.fn.detach = $.fn.remove;
  
    ['width', 'height'].forEach(function(dimension) {
      var dimensionProperty = dimension.replace(/./, function(m) {
        return m[0].toUpperCase();
      });
  
      $.fn[dimension] = function(value) {
        var offset, el = this[0];
        if (isUndefined(value)) {
          return lang.isWindow(el) ? el['inner' + dimensionProperty] :
            lang.isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
            (offset = this.offset()) && offset[dimension];
        } else {
          return this.each(function(idx) {
            el = $(this);
            el.css(dimension, funcArg(this, value, idx, el[dimension]()));
          });
        }
      };
    });
  
    ['after', 'prepend', 'before', 'append'].forEach(function(operator, operatorIndex) {
      var inside = operatorIndex % 2;
  
      $.fn[operator] = function() {
        var nodes = $.map(arguments, function(arg) {
            return lang.isObject(arg) || lang.isArray(arg) || arg == null ? arg : jqlite.fragment(arg);
          }),
          parent, copyByClone = this.length > 1;
  
        if (nodes.length < 1) {
          return this;
        }
  
        return this.each(function(_, target) {
          parent = inside ? target : target.parentNode;
  
          target = operatorIndex == 0 ? target.nextSibling :
            operatorIndex == 1 ? target.firstChild :
              operatorIndex == 2 ? target :
                null;
  
          var parentInDocument = $.contains(document.documentElement, parent);
  
          nodes.forEach(function(node) {
            if (copyByClone) {
              node = node.cloneNode(true);
            } else if (!parent) {
              return $(node).remove();
            }
  
            parent.insertBefore(node, target);
            if (parentInDocument) {
              traverseNode(node, function(el) {
                if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
                  (!el.type || el.type === 'text/javascript') && !el.src)
                  window['eval'].call(window, el.innerHTML);
              });
            }
          });
        });
      };
  
      $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function(html) {
        $(html)[operator](this);
        return this;
      };
  
    });
  
    jqlite.jQ.prototype = $.fn;
  
    $.jqlite = jqlite;
  
    module.exports = $;
  
  });

  define('mob/base', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var $ = require('mob/jqlite');
    var Error = require('mob/error');
  
    function bindFromStrings(target, entity, evt, methods) {
      var methodNames = methods.split(/\s+/);
  
      lang.each(methodNames, function(methodName) {
  
        var method = target[methodName];
        if (!method) {
          throw new Error('Method "' + methodName + '" was configured as an event handler, but does not exist.');
        }
  
        target.listenTo(entity, evt, method);
      });
    }
  
    function bindToFunction(target, entity, evt, method) {
      target.listenTo(entity, evt, method);
    }
  
    function unbindFromStrings(target, entity, evt, methods) {
      var methodNames = methods.split(/\s+/);
  
      lang.each(methodNames, function(methodName) {
        var method = target[methodName];
        target.stopListening(entity, evt, method);
      });
    }
  
    function unbindToFunction(target, entity, evt, method) {
      target.stopListening(entity, evt, method);
    }
  
    function iterateEvents(target, entity, bindings, functionCallback, stringCallback) {
      if (!entity || !bindings) {
        return;
      }
  
      if (!lang.isObject(bindings)) {
        throw new Error('Bindings must be an object or function.');
      }
  
      // allow the bindings to be a function
      bindings = _getValue(bindings, target);
  
      // iterate the bindings and bind them
      lang.each(bindings, function(methods, evt) {
  
        // allow for a function as the handler,
        // or a list of event names as a string
        if (lang.isFunction(methods)) {
          functionCallback(target, entity, evt, methods);
        } else {
          stringCallback(target, entity, evt, methods);
        }
  
      });
    }
  
    var isNodeAttached = exports.isNodeAttached = function(el) {
      return $.contains(document.documentElement, el);
    };
  
    var _triggerMethod = exports._triggerMethod = (function() {
  
      // split the event name on the ":"
      var splitter = /(^|:)(\w)/gi;
  
      function getEventName(match, prefix, eventName) {
        return eventName.toUpperCase();
      }
  
      return function(context, event, args) {
        var noEventArg = arguments.length < 3;
        if (noEventArg) {
          args = event;
          event = args[0];
        }
  
        // get the method name from the event name
        var methodName = 'on' + event.replace(splitter, getEventName);
        var method = context[methodName];
        var result;
  
        if (lang.isFunction(method)) {
          // pass all args, except the event name
          result = method.apply(context, noEventArg ? lang.rest(args) : args);
        }
  
        // trigger the event, if a trigger method exists
        if (lang.isFunction(context.trigger)) {
          if (noEventArg + args.length > 1) {
            context.trigger.apply(context, noEventArg ? args : [event].concat(lang.rest(args, 0)));
          } else {
            context.trigger(event);
          }
        }
  
        return result;
      };
    })();
  
    var triggerMethod = exports.triggerMethod = function(event) {
      return _triggerMethod(this, arguments);
    };
  
    var triggerMethodOn = exports.triggerMethodOn = function(context) {
      var fnc = lang.isFunction(context.triggerMethod) ? context.triggerMethod : triggerMethod;
  
      return fnc.apply(context, lang.rest(arguments));
    };
  
    // Merge `keys` from `options` onto `this`
    exports.mergeOptions = function(options, keys) {
      if (!options) {
        return;
      }
      lang.extend(this, lang.pick(options, keys));
    };
  
    var getOption = exports.getOption = function(target, optionName) {
      if (!target || !optionName) {
        return;
      }
      if (target.options && (!lang.isUndefined(target.options[optionName]))) {
        return target.options[optionName];
      } else {
        return target[optionName];
      }
    };
  
    exports.proxyGetOption = function(optionName) {
      return getOption(this, optionName);
    };
  
    // If a function is provided we call it with context
    // otherwise just return the value. If the value is
    // undefined return a default value
    var _getValue = exports._getValue = function(value, context, params) {
      if (lang.isFunction(value)) {
        value = params ? value.apply(context, params) : value.call(context);
      }
      return value;
    };
  
    exports.getValue = function(object, prop) {
      if (!(object && object[prop])) {
        return null;
      }
      return lang.isFunction(object[prop]) ? object[prop]() : object[prop];
    };
  
    var bindEntityEvents = exports.bindEntityEvents = function(target, entity, bindings) {
      iterateEvents(target, entity, bindings, bindToFunction, bindFromStrings);
    };
  
    var unbindEntityEvents = exports.unbindEntityEvents = function(target, entity, bindings) {
      iterateEvents(target, entity, bindings, unbindToFunction, unbindFromStrings);
    };
  
    exports.proxyBindEntityEvents = function(entity, bindings) {
      return bindEntityEvents(this, entity, bindings);
    };
  
    exports.proxyUnbindEntityEvents = function(entity, bindings) {
      return unbindEntityEvents(this, entity, bindings);
    };
  
    // Monitor a view's state, and after it has been rendered and shown
    // in the DOM, trigger a "dom:refresh" event every time it is
    // re-rendered.
    exports.monitorDOMRefresh = function(view) {
  
      if (view._isDomRefreshMonitored) {
        return;
      }
  
      view._isDomRefreshMonitored = true;
  
      function handleShow() {
        view._isShown = true;
        triggerDOMRefresh();
      }
  
      function handleRender() {
        view._isRendered = true;
        triggerDOMRefresh();
      }
  
      function triggerDOMRefresh() {
        if (view._isShown && view._isRendered && isNodeAttached(view.el)) {
          triggerMethodOn(view, 'dom:refresh', view);
        }
      }
  
      view.on({
        show: handleShow,
        render: handleRender
      });
    };
  
  });

  define('mob/class', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var base = require('mob/base');
    var Events = require('mob/events');
  
    var Class = function(options) {
      this.options = lang.extend({}, lang.result(this, 'options'), options);
  
      this.initialize.apply(this, arguments);
    };
  
    Class.extend = lang.inherits;
  
    lang.extend(Class.prototype, Events, {
  
      initialize: function() {},
  
      destroy: function() {
        this.triggerMethod('before:destroy');
        this.triggerMethod('destroy');
        this.stopListening();
  
        return this;
      },
  
      triggerMethod: base.triggerMethod,
  
      mergeOptions: base.mergeOptions,
  
      getOption: base.proxyGetOption,
  
      bindEntityEvents: base.proxyBindEntityEvents,
  
      unbindEntityEvents: base.proxyUnbindEntityEvents
    });
  
    module.exports = Class;
  
  });

  define('mob/events', function(require, exports, module) {
  
    var lang = require('mob/lang');
  
    var eventsApi = function(iteratee, events, name, callback, opts) {
      var i = 0,
        names,
        eventSplitter = /\s+/;
      if (name && typeof name === 'object') {
        // Handle event maps.
        if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
        for (names = lang.keys(name); i < names.length; i++) {
          events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
        }
      } else if (name && eventSplitter.test(name)) {
        // Handle space separated event names by delegating them individually.
        for (names = name.split(eventSplitter); i < names.length; i++) {
          events = iteratee(events, names[i], callback, opts);
        }
      } else {
        events = iteratee(events, name, callback, opts);
      }
      return events;
    };
  
    var eventInternalOn = function(obj, name, callback, context, listening) {
      obj._events = eventsApi(eventOnApi, obj._events || {}, name, callback, {
        context: context,
        ctx: obj,
        listening: listening
      });
  
      if (listening) {
        var listeners = obj._listeners || (obj._listeners = {});
        listeners[listening.id] = listening;
      }
  
      return obj;
    };
  
    var eventOnApi = function(events, name, callback, options) {
      if (callback) {
        var handlers = events[name] || (events[name] = []);
        var context = options.context,
          ctx = options.ctx,
          listening = options.listening;
        if (listening) listening.count++;
  
        handlers.push({
          callback: callback,
          context: context,
          ctx: context || ctx,
          listening: listening
        });
      }
      return events;
    };
  
    var eventOffApi = function(events, name, callback, options) {
      if (!events) return;
  
      var i = 0,
        listening;
      var context = options.context,
        listeners = options.listeners;
  
      if (!name && !callback && !context) {
        var ids = lang.keys(listeners);
        for (; i < ids.length; i++) {
          listening = listeners[ids[i]];
          delete listeners[listening.id];
          delete listening.listeningTo[listening.objId];
        }
        return;
      }
  
      var names = name ? [name] : lang.keys(events);
      for (; i < names.length; i++) {
        name = names[i];
        var handlers = events[name];
  
        if (!handlers) break;
  
        var remaining = [];
        for (var j = 0; j < handlers.length; j++) {
          var handler = handlers[j];
          if (
            callback && callback !== handler.callback &&
            callback !== handler.callback._callback ||
            context && context !== handler.context
          ) {
            remaining.push(handler);
          } else {
            listening = handler.listening;
            if (listening && --listening.count === 0) {
              delete listeners[listening.id];
              delete listening.listeningTo[listening.objId];
            }
          }
        }
  
        // Update tail event if the list has any events.  Otherwise, clean up.
        if (remaining.length) {
          events[name] = remaining;
        } else {
          delete events[name];
        }
      }
      if (lang.size(events)) {
        return events;
      }
    };
  
    var eventOnceMap = function(map, name, callback, offer) {
      if (callback) {
        var once = map[name] = lang.once(function() {
          offer(name, once);
          callback.apply(this, arguments);
        });
        once._callback = callback;
      }
      return map;
    };
  
    var eventTriggerApi = function(objEvents, name, cb, args) {
      if (objEvents) {
        var events = objEvents[name];
        var allEvents = objEvents.all;
        if (events && allEvents) allEvents = allEvents.slice();
        if (events) eventTriggerEvents(events, args);
        if (allEvents) eventTriggerEvents(allEvents, [name].concat(args));
      }
      return objEvents;
    };
  
    var eventTriggerEvents = function(events, args) {
      var ev, i = -1,
        l = events.length,
        a1 = args[0],
        a2 = args[1],
        a3 = args[2];
      switch (args.length) {
        case 0:
          while (++i < l)(ev = events[i]).callback.call(ev.ctx);
          return;
        case 1:
          while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1);
          return;
        case 2:
          while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1, a2);
          return;
        case 3:
          while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
          return;
        default:
          while (++i < l)(ev = events[i]).callback.apply(ev.ctx, args);
          return;
      }
    };
  
    var Events = {
  
      on: function(name, callback, context) {
        return eventInternalOn(this, name, callback, context);
      },
  
      listenTo: function(obj, name, callback) {
        if (!obj) return this;
        var id = obj._listenId || (obj._listenId = lang.uniqueId('l'));
        var listeningTo = this._listeningTo || (this._listeningTo = {});
        var listening = listeningTo[id];
  
        if (!listening) {
          var thisId = this._listenId || (this._listenId = lang.uniqueId('l'));
          listening = listeningTo[id] = {
            obj: obj,
            objId: id,
            id: thisId,
            listeningTo: listeningTo,
            count: 0
          };
        }
  
        // Bind callbacks on obj, and keep track of them on listening.
        eventInternalOn(obj, name, callback, this, listening);
        return this;
      },
  
      off: function(name, callback, context) {
        if (!this._events) return this;
        this._events = eventsApi(eventOffApi, this._events, name, callback, {
          context: context,
          listeners: this._listeners
        });
        return this;
      },
  
      stopListening: function(obj, name, callback) {
        var listeningTo = this._listeningTo;
        if (!listeningTo) return this;
  
        var ids = obj ? [obj._listenId] : lang.keys(listeningTo);
  
        for (var i = 0; i < ids.length; i++) {
          var listening = listeningTo[ids[i]];
  
          if (!listening) break;
  
          listening.obj.off(name, callback, this);
        }
        if (lang.isEmpty(listeningTo)) {
          this._listeningTo = void 0;
        }
  
        return this;
      },
  
      once: function(name, callback, context) {
        var events = eventsApi(eventOnceMap, {}, name, callback, lang.bind(this.off, this));
        return this.on(events, void 0, context);
      },
  
      listenToOnce: function(obj, name, callback) {
        var events = eventsApi(eventOnceMap, {}, name, callback, lang.bind(this.stopListening, this, obj));
        return this.listenTo(obj, events);
      },
  
      trigger: function(name) {
        if (!this._events) return this;
  
        var length = Math.max(0, arguments.length - 1);
        var args = Array(length);
        for (var i = 0; i < length; i++) {
          args[i] = arguments[i + 1];
        }
  
        eventsApi(eventTriggerApi, this._events, name, void 0, args);
        return this;
      }
  
    };
  
    module.exports = Events;
  
  });

  define('mob/http', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var Error = require('mob/error');
  
    var isFunction = lang.isFunction;
  
    var makeErrorByStatus = function(statusCode, content) {
      var MAX_LENGTH = 500;
  
      var truncate = function(str, length) {
        return str.length > length ? str.slice(0, length) + '...' : str;
      };
  
      var contentToCheck = lang.isString(content) ? content : content.toString();
  
      var message = 'failed [' + statusCode + ']';
  
      if (contentToCheck) {
        message += ' ' + truncate(contentToCheck.replace(/\n/g, ' '), MAX_LENGTH);
      }
  
      return new Error(message);
    };
  
    var populateData = function(response) {
      // Read Content-Type header, up to a ';' if there is one.
      // A typical header might be "application/json; charset=utf-8"
      // or just "application/json".
      var contentType = (response.headers['content-type'] || ';').split(';')[0];
  
      // Only try to parse data as JSON if server sets correct content type.
      if (lang.contains(['application/json', 'text/javascript', 'application/javascript', 'application/x-javascript'], contentType)) {
        try {
          response.data = JSON.parse(response.content);
        } catch (err) {
          response.data = null;
        }
      } else {
        response.data = null;
      }
    };
  
    var HTTP = {};
  
    HTTP.call = function(method, url, options, callback) {
  
      // support (method, url, callback) argument list
      if (!callback && isFunction(options)) {
        callback = options;
        options = null;
      }
  
      options = options || {};
  
      if (isFunction(callback)) {
        throw new Error('Can not make a blocking HTTP call from the client; callback required.');
      }
  
      method = (method || '').toUpperCase();
  
      var headers = {};
  
      var content = options.content;
      if (options.data) {
        content = JSON.stringify(options.data);
        headers['Content-Type'] = 'application/json';
      }
  
      var paramsForUrl, paramsForBody;
      if (content || method === 'GET' || method === 'HEAD') {
        paramsForUrl = options.params;
      } else {
        paramsForBody = options.params;
      }
  
      url = lang.constructUrl(url, options.query, paramsForUrl);
  
      var username, password, auth = options.auth;
      if (auth) {
        var colonLoc = auth.indexOf(':');
        if (colonLoc < 0) {
          throw new Error('auth option should be of the form "username:password"');
        }
        username = auth.substring(0, colonLoc);
        password = auth.substring(colonLoc + 1);
      }
  
      if (paramsForBody) {
        content = lang.encodeUrlParams(paramsForBody);
      }
  
      lang.extend(headers, options.headers || {});
  
      // wrap callback to add a 'response' property on an error, in case
      // we have both (http 4xx/5xx error, which has a response payload)
      callback = (function(callback) {
        return function(error, response) {
          if (error && response) {
            error.response = response;
          }
          callback(error, response);
        };
      })(callback);
  
      callback = lang.once(callback);
  
      try {
        var xhr = new XMLHttpRequest();
  
        xhr.open(method, url, true, username, password);
  
        for (var k in headers) {
          xhr.setRequestHeader(k, headers[k]);
        }
  
        var timedOut = false;
        var timer;
        if (options.timeout) {
          timer = setTimeout(function() {
            timedOut = true;
            xhr.abort();
          }, options.timeout);
        }
  
        // callback on complete
        xhr.onreadystatechange = function(evt) {
          if (xhr.readyState === 4) { // COMPLETE
  
            if (timer) {
              clearTimeout(timer);
            }
  
            if (timedOut) {
              callback(new Error('timeout'));
            } else if (!xhr.status) {
              // no HTTP response
              callback(new Error('network'));
            } else {
  
              var response = {};
              response.statusCode = xhr.status;
              response.content = xhr.responseText;
  
              response.headers = {};
              var headerStr = xhr.getAllResponseHeaders();
  
              if ('' === headerStr && xhr.getResponseHeader('content-type')) {
                headerStr = 'content-type: ' + xhr.getResponseHeader('content-type');
              }
  
              var headersRaw = headerStr.split(/\r?\n/);
              lang.each(headersRaw, function(h) {
                var m = /^(.*?):(?:\s+)(.*)$/.exec(h);
                if (m && m.length === 3)
                  response.headers[m[1].toLowerCase()] = m[2];
              });
  
              populateData(response);
  
              var error = null;
              if (response.statusCode >= 400) {
                error = makeErrorByStatus(response.statusCode, response.content);
              }
  
              callback(error, response);
            }
          }
        };
  
        // Allow custom control over XHR and abort early.
        if (options.beforeSend) {
          var beforeSend = lang.once(options.beforeSend);
  
          // Call the callback and check to see if the request was aborted
          if (false === beforeSend.call(null, xhr, options)) {
            return xhr.abort();
          }
        }
  
        xhr.send(content);
  
      } catch (err) {
        callback(err);
      }
  
    };
  
    HTTP.get = function( /* url, callOptions, asyncCallback */ ) {
      return HTTP.call.apply(this, ['GET'].concat(lang.toArray(arguments)));
    };
  
    HTTP.post = function( /* url, callOptions, asyncCallback */ ) {
      return HTTP.call.apply(this, ['POST'].concat(lang.toArray(arguments)));
    };
  
    HTTP.put = function( /* url, callOptions, asyncCallback */ ) {
      return HTTP.call.apply(this, ['PUT'].concat(lang.toArray(arguments)));
    };
  
    HTTP.del = function( /* url, callOptions, asyncCallback */ ) {
      return HTTP.call.apply(this, ['DELETE'].concat(lang.toArray(arguments)));
    };
  
    module.exports = HTTP;
  
  });

  define('mob/storage', function(require, exports, module) {
  
    var lang = require('mob/lang');
  
    var Storage = function(options) {
  
      this.options = options || {};
      this.name = this.options.name || 'store';
  
      this.type = this.options.type || 'memory';
      this.meta_key = this.options.meta_key || '__keys__';
      this.storage = new Storage[Storage.stores[this.type]](this.name, this.options);
    };
  
    Storage.stores = {
      'memory': 'Memory',
      'local': 'LocalStorage',
      'session': 'SessionStorage',
      'cookie': 'Cookie'
    };
  
    lang.extend(Storage.prototype, {
  
      isAvailable: function() {
        if (lang.isFunction(this.storage.isAvailable)) {
          return this.storage.isAvailable();
        } else {
          return true;
        }
      },
  
      exists: function(key) {
        return this.storage.exists(key);
      },
  
      set: function(key, value) {
        var stringValue = lang.isString(value) ? value : JSON.stringify(value);
        key = key.toString();
        this.storage.set(key, stringValue);
        if (key != this.meta_key) {
          this._addKey(key)
        }
        return value;
      },
  
      get: function(key) {
        var value = this.storage.get(key);
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      },
  
      clear: function(key) {
        this._removeKey(key);
        return this.storage.clear(key);
      },
  
      clearAll: function() {
        var self = this;
        this.each(function(key, value) {
          self.clear(key);
        });
      },
  
      keys: function() {
        return this.get(this.meta_key) || [];
      },
  
      each: function(callback) {
        var i = 0,
          keys = this.keys(),
          returned;
  
        for (i; i < keys.length; i++) {
          returned = callback(keys[i], this.get(keys[i]));
          if (returned === false) {
            return false;
          }
        }
      },
  
      fetch: function(key, callback) {
        if (!this.exists(key)) {
          return this.set(key, callback.apply(this));
        } else {
          return this.get(key);
        }
      },
  
      _addKey: function(key) {
        var keys = this.keys();
        if (lang.indexOf(keys, key) === -1) {
          keys.push(key);
        }
        this.set(this.meta_key, keys);
      },
      _removeKey: function(key) {
        var keys = this.keys();
        var index = lang.indexOf(keys, key);
        if (index !== -1) {
          keys.splice(index, 1);
        }
        this.set(this.meta_key, keys);
      }
  
    });
  
    Storage.isAvailable = function(type) {
      try {
        return Storage[Storage.stores[type]].prototype.isAvailable();
      } catch (e) {
        return false;
      }
    };
  
    Storage.Cookie = function(name, options) {
      this.name = name;
      this.options = options || {};
      this.path = this.options.path || '/';
      // set the expires in seconds or default 14 days
      this.expires_in = this.options.expires_in || (14 * 24 * 60 * 60);
    };
  
    lang.extend(Storage.Cookie.prototype, {
      isAvailable: function() {
        return ('cookie' in document) && (window.location.protocol != 'file:');
      },
      exists: function(key) {
        return (this.get(key) != null);
      },
      set: function(key, value) {
        return this._setCookie(key, value);
      },
      get: function(key) {
        return this._getCookie(key);
      },
      clear: function(key) {
        this._setCookie(key, '', -1);
      },
      _key: function(key) {
        return ['store', this.name, key].join('.');
      },
      _getCookie: function(key) {
        var escaped = this._key(key).replace(/(\.|\*|\(|\)|\[|\])/g, '\\$1');
        var match = document.cookie.match('(^|;\\s)' + escaped + '=([^;]*)(;|$)');
        return match ? match[2] : null;
      },
      _setCookie: function(key, value, expires) {
        if (!expires) {
          expires = (this.expires_in * 1000)
        }
        var date = new Date();
        date.setTime(date.getTime() + expires);
  
        document.cookie = [
          this._key(key), '=', value,
          '; expires=', date.toGMTString(),
          '; path=', this.path
        ].join('');
      }
    });
  
    Storage.LocalStorage = function(name) {
      this.name = name;
    };
  
    lang.extend(Storage.LocalStorage.prototype, {
  
      isAvailable: function() {
        return ('localStorage' in window) && (window.location.protocol != 'file:');
      },
      exists: function(key) {
        return (this.get(key) != null);
      },
      set: function(key, value) {
        return window.localStorage.setItem(this._key(key), value);
      },
      get: function(key) {
        return window.localStorage.getItem(this._key(key));
      },
      clear: function(key) {
        window.localStorage.removeItem(this._key(key));
      },
      _key: function(key) {
        return ['store', this.name, key].join('.');
      }
  
    });
  
    Storage.Memory = function(name) {
      this.name = name;
      Storage.Memory.store = Storage.Memory.store || {};
      Storage.Memory.store[this.name] = Storage.Memory.store[this.name] || {};
      this.store = Storage.Memory.store[this.name];
    };
  
    lang.extend(Storage.Memory.prototype, {
      isAvailable: function() {
        return true;
      },
      exists: function(key) {
        return !lang.isUndefined(this.store[key]);
      },
      set: function(key, value) {
        return this.store[key] = value;
      },
      get: function(key) {
        return this.store[key];
      },
      clear: function(key) {
        delete this.store[key];
      }
    });
  
    Storage.SessionStorage = function(name) {
      this.name = name;
    };
  
    lang.extend(Storage.SessionStorage.prototype, {
      isAvailable: function() {
        return ('sessionStorage' in window) &&
          (window.location.protocol != 'file:') &&
          lang.isFunction(window.sessionStorage.setItem);
      },
      exists: function(key) {
        return (this.get(key) != null);
      },
      set: function(key, value) {
        return window.sessionStorage.setItem(this._key(key), value);
      },
      get: function(key) {
        var value = window.sessionStorage.getItem(this._key(key));
        if (value && !lang.isUndefined(value.value)) {
          value = value.value;
        }
        return value;
      },
      clear: function(key) {
        window.sessionStorage.removeItem(this._key(key));
      },
      _key: function(key) {
        return ['store', this.name, key].join('.');
      }
    });
  
    module.exports = Storage;
  
  });

  define('mob/support', function(require, exports, module) {
  
    var elementStyle = document.createElement('div').style;
    var vendorCSS = (function() {
      var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'], transform, i = 0, l = vendors.length;
  
      for (; i < l; i++) {
        transform = vendors[i] + 'ransform';
        if (transform in elementStyle) {
          return vendors[i].substr(0, vendors[i].length - 1);
        }
      }
  
      return false;
    })();
  
    var prefixStyle = function(style) {
      if (vendorCSS === false) {
        return false;
      }
      if (vendorCSS === '') {
        return style;
      }
      return vendorCSS + style.charAt(0).toUpperCase() + style.substr(1);
    };
  
    var Support = {
  
      getPrefixStyle: prefixStyle,
  
      addEventListener: !!window.addEventListener,
  
      transitions: (function (temp) {
        var props = ['transformProperty', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform'];
        for (var i in props) {
          if (temp.style[props[i]] !== undefined) {
            return true;
          }
        }
        return false;
      })(document.createElement('swipe')),
  
      touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
  
      transform3d: function () {
  
        var head, body, style, div, result;
  
        head = document.getElementsByTagName('head')[0];
        body = document.body;
  
        style = document.createElement('style');
        style.textContent = '@media (transform-3d),(-o-transform-3d),(-moz-transform-3d),(-webkit-transform-3d){#mo-3dtest{height:3px}}';
  
        div = document.createElement('div');
        div.id = 'mo-3dtest';
  
        head.appendChild(style);
        body.appendChild(div);
  
        result = div.offsetHeight === 3;
  
        style.parentNode.removeChild(style);
        div.parentNode.removeChild(div);
  
        return result;
      },
  
      animationEvents: (typeof window.WebKitAnimationEvent !== 'undefined'),
  
      hasTransform: prefixStyle('transform') !== false,
  
      hasPerspective: prefixStyle('perspective') in elementStyle,
  
      hasTouch: 'ontouchstart' in window,
  
      hasPointer: window.PointerEvent || window.MSPointerEvent,
  
      hasTransition: prefixStyle('transition') in elementStyle
  
    };
  
    module.exports = Support;
  
  });

  define('mob/view', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var $ = require('mob/jqlite');
    var Events = require('mob/events');
    var base = require('mob/base');
    var Error = require('mob/error');
    var Template = require('mob/template');
  
    var delegateEventSplitter = /^(\S+)\s*(.*)$/;
  
    var viewOptions = ['data', 'options', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];
  
    var View = function(options) {
      this.cid = lang.uniqueId('view');
      lang.extend(this, lang.pick(options, viewOptions));
      this._ensureElement();
      this.initialize.apply(this, arguments);
    };
  
    lang.extend(View.prototype, Events, {
  
      isDestroyed: false,
  
      tagName: 'div',
  
      $: function(selector) {
        return this.$el.find(selector);
      },
  
      super: function(fn) {
  
        var caller = View.prototype.super.caller;
        var found;
        for (var child = this; child && lang.isFunction(child[fn]); child = child.constructor.__super__) {
          if (!found) {
            found = true;
          } else if (child[fn] != caller) {
            return child[fn].apply(this, [].slice.call(arguments, 1));
          }
        }
  
      },
  
      initialize: function() {},
  
      render: function() {
        return this;
      },
  
      getTemplate: function() {
        return this.getOption('template');
      },
  
      registerTemplateHelpers: function() {
        var templateHelpers = this.getOption('templateHelpers');
  
        if (lang.isObject(templateHelpers)) {
          Template.registerHelpers(templateHelpers);
        }
  
      },
  
      remove: function() {
        this._removeElement();
        this.stopListening();
        return this;
      },
  
      _removeElement: function() {
        this.$el.remove();
      },
  
      setElement: function(element) {
        this.undelegateEvents();
        this._setElement(element);
        this.delegateEvents();
        return this;
      },
  
      _setElement: function(el) {
        this.$el = $(el);
        this.el = this.$el[0];
      },
  
      delegateEvents: function(events) {
        events || (events = lang.result(this, 'events'));
        if (!events) {
          return this;
        }
        this.undelegateEvents();
        for (var key in events) {
          var method = events[key];
          if (!lang.isFunction(method)) {
            method = this[method];
          }
          if (!method) {
            continue;
          }
          var match = key.match(delegateEventSplitter);
          this.delegate(match[1], match[2], lang.bind(method, this));
        }
        return this;
      },
  
      delegate: function(eventName, selector, listener) {
        this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);
        return this;
      },
  
      undelegateEvents: function() {
        if (this.$el) {
          this.$el.off('.delegateEvents' + this.cid);
        }
        return this;
      },
  
      undelegate: function(eventName, selector, listener) {
        this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);
        return this;
      },
  
      _createElement: function(tagName) {
        return document.createElement(tagName);
      },
  
      _ensureElement: function() {
        if (!this.el) {
          var attrs = lang.extend({}, lang.result(this, 'attributes'));
          if (this.id) {
            attrs.id = lang.result(this, 'id');
          }
          if (this.className) {
            attrs['class'] = lang.result(this, 'className');
          }
          this.setElement(this._createElement(lang.result(this, 'tagName')));
          this._setAttributes(attrs);
        } else {
          this.setElement(lang.result(this, 'el'));
        }
      },
  
      _setAttributes: function(attributes) {
        this.$el.attr(attributes);
      },
  
      _ensureViewIsIntact: function() {
        if (this.isDestroyed) {
          throw new Error('View (cid: "' + this.cid + '") has already been destroyed and cannot be used.');
        }
      },
  
      destroy: function() {
  
        if (this.isDestroyed) {
          return this;
        }
  
        this.isDestroyed = true;
  
        this.remove();
  
        return this;
      },
  
      triggerMethod: function() {
        return base._triggerMethod(this, arguments);
      },
  
      mergeOptions: base.mergeOptions,
  
      getOption: base.proxyGetOption,
  
      bindEntityEvents: base.proxyBindEntityEvents,
  
      unbindEntityEvents: base.proxyUnbindEntityEvents
  
    });
  
    View.extend = lang.inherits;
  
    module.exports = View;
  
  });

  define('mob/platform', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var $ = require('mob/jqlite');
  
    var IOS = 'ios';
    var ANDROID = 'android';
    var WINDOWS_PHONE = 'windowsphone';
    var requestAnimationFrame = lang.requestAnimationFrame;
    var $body = $('body');
  
    var platformName = null,
      platformVersion = null,
      readyCallbacks = [],
      windowLoadListenderAttached;
  
    function onPlatformReady() {
      // the device is all set to go, init our own stuff then fire off our event
      Platform.isReady = true;
      Platform.detect();
      for (var x = 0; x < readyCallbacks.length; x++) {
        // fire off all the callbacks that were added before the platform was ready
        readyCallbacks[x]();
      }
      readyCallbacks = [];
  
      requestAnimationFrame(function() {
        $body.addClass('platform-ready');
      });
    }
  
    function onWindowLoad() {
      if (Platform.isWebView()) {
        document.addEventListener('deviceready', onPlatformReady, false);
      } else {
        onPlatformReady();
      }
      if (windowLoadListenderAttached) {
        window.removeEventListener('load', onWindowLoad, false);
      }
    }
  
    var Platform = {
  
      navigator: window.navigator,
  
      isReady: false,
  
      isFullScreen: false,
  
      platforms: null,
  
      grade: null,
  
      ua: navigator.userAgent,
  
      ready: function(cb) {
        // run through tasks to complete now that the device is ready
        if (Platform.isReady) {
          cb();
        } else {
          readyCallbacks.push(cb);
        }
      },
  
      detect: function() {
        Platform._checkPlatforms();
  
        requestAnimationFrame(function() {
          for (var i = 0; i < Platform.platforms.length; i++) {
            $body.addClass('platform-' + Platform.platforms[i]);
          }
        });
      },
  
      setGrade: function(grade) {
        var oldGrade = Platform.grade;
        Platform.grade = grade;
        requestAnimationFrame(function() {
          if (oldGrade) {
            $body.removeClass('grade-' + oldGrade);
          }
          $body.addClass('grade-' + grade);
        });
      },
  
      device: function() {
        return window.device || {};
      },
  
      _checkPlatforms: function() {
        Platform.platforms = [];
        var grade = 'a';
  
        if (Platform.isWebView()) {
          Platform.platforms.push('webview');
          if (!(!window.cordova && !window.PhoneGap && !window.phonegap)) {
            Platform.platforms.push('cordova');
          } else if (window.forge) {
            Platform.platforms.push('trigger');
          }
        } else {
          Platform.platforms.push('browser');
        }
        if (Platform.isIPad()) {
          Platform.platforms.push('ipad');
        }
  
        var platform = Platform.platform();
        if (platform) {
          Platform.platforms.push(platform);
  
          var version = Platform.version();
          if (version) {
            var v = version.toString();
            if (v.indexOf('.') > 0) {
              v = v.replace('.', '_');
            } else {
              v += '_0';
            }
            Platform.platforms.push(platform + v.split('_')[0]);
            Platform.platforms.push(platform + v);
  
            if (Platform.isAndroid() && version < 4.4) {
              grade = (version < 4 ? 'c' : 'b');
            } else if (Platform.isWindowsPhone()) {
              grade = 'b';
            }
          }
        }
  
        Platform.setGrade(grade);
      },
  
      isWebView: function() {
        return !(!window.cordova && !window.PhoneGap && !window.phonegap && !window.forge);
      },
  
      isIPad: function() {
        if (/iPad/i.test(Platform.navigator.platform)) {
          return true;
        }
        return /iPad/i.test(Platform.ua);
      },
  
      isIOS: function() {
        return Platform.is(IOS);
      },
  
      isAndroid: function() {
        return Platform.is(ANDROID);
      },
  
      isWindowsPhone: function() {
        return Platform.is(WINDOWS_PHONE);
      },
  
      isMobile: function() {
        return !!Platform.ua.match(/android|webos|ip(hone|ad|od)|opera (mini|mobi|tablet)|iemobile|windows.+(phone|touch)|mobile|fennec|kindle (Fire)|Silk|maemo|blackberry|playbook|bb10\; (touch|kbd)|Symbian(OS)|Ubuntu Touch/i);
      },
  
      platform: function() {
        // singleton to get the platform name
        if (platformName === null) {
          Platform.setPlatform(Platform.device().platform);
        }
        return platformName;
      },
  
      setPlatform: function(n) {
        if (typeof n != 'undefined' && n !== null && n.length) {
          platformName = n.toLowerCase();
        } else if (lang.getParameterByName('mobplatform')) {
          platformName = lang.getParameterByName('mobplatform');
        } else if (Platform.ua.indexOf('Android') > 0) {
          platformName = ANDROID;
        } else if (/iPhone|iPad|iPod/.test(Platform.ua)) {
          platformName = IOS;
        } else if (Platform.ua.indexOf('Windows Phone') > -1) {
          platformName = WINDOWS_PHONE;
        } else {
          platformName = Platform.navigator.platform && navigator.platform.toLowerCase().split(' ')[0] || '';
        }
      },
  
      version: function() {
        if (platformVersion === null) {
          Platform.setVersion(Platform.device().version);
        }
        return platformVersion;
      },
  
      setVersion: function(v) {
        if (typeof v != 'undefined' && v !== null) {
          v = v.split('.');
          v = parseFloat(v[0] + '.' + (v.length > 1 ? v[1] : 0));
          if (!isNaN(v)) {
            platformVersion = v;
            return;
          }
        }
  
        platformVersion = 0;
  
        // fallback to user-agent checking
        var pName = Platform.platform();
        var versionMatch = {
          'android': /Android (\d+).(\d+)?/,
          'ios': /OS (\d+)_(\d+)?/,
          'windowsphone': /Windows Phone (\d+).(\d+)?/
        };
        if (versionMatch[pName]) {
          v = Platform.ua.match(versionMatch[pName]);
          if (v && v.length > 2) {
            platformVersion = parseFloat(v[1] + '.' + v[2]);
          }
        }
      },
  
      is: function(type) {
        type = type.toLowerCase();
        // check if it has an array of platforms
        if (Platform.platforms) {
          for (var x = 0; x < Platform.platforms.length; x++) {
            if (Platform.platforms[x] === type) return true;
          }
        }
        // exact match
        var pName = Platform.platform();
        if (pName) {
          return pName === type.toLowerCase();
        }
  
        // A quick hack for to check userAgent
        return Platform.ua.toLowerCase().indexOf(type) >= 0;
      },
  
      exitApp: function() {
        Platform.ready(function() {
          navigator.app && navigator.app.exitApp && navigator.app.exitApp();
        });
      },
  
      showStatusBar: function(val) {
        // Only useful when run within cordova
        Platform._showStatusBar = val;
        Platform.ready(function() {
          // run this only when or if the platform (cordova) is ready
          requestAnimationFrame(function() {
            if (Platform._showStatusBar) {
              // they do not want it to be full screen
              window.StatusBar && window.StatusBar.show();
              $body.removeClass('status-bar-hide');
            } else {
              // it should be full screen
              window.StatusBar && window.StatusBar.hide();
              $body.addClass('status-bar-hide');
            }
          });
        });
      },
  
      fullScreen: function(showFullScreen, showStatusBar) {
        // showFullScreen: default is true if no param provided
        Platform.isFullScreen = (showFullScreen !== false);
  
        // add/remove the fullscreen classname to the body
        $(document).ready(function() {
          // run this only when or if the DOM is ready
          requestAnimationFrame(function() {
            if (Platform.isFullScreen) {
              $body.addClass('fullscreen');
            } else {
              $body.removeClass('fullscreen');
            }
          });
          // showStatusBar: default is false if no param provided
          Platform.showStatusBar((showStatusBar === true));
        });
  
      }
  
    };
  
    Platform.initialize = function() {
      if (document.readyState === 'complete') {
        onWindowLoad();
      } else {
        windowLoadListenderAttached = true;
        window.addEventListener('load', onWindowLoad, false);
      }
    };
  
    module.exports = Platform;
  
  });

  define('mob/touch', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var $ = require('mob/jqlite');
    var Platform = require('mob/platform');
  
    var deviceIsWindowsPhone = Platform.isWindowsPhone();
    var deviceIsAndroid = Platform.isAndroid() && !deviceIsWindowsPhone;
    var deviceIsIOS = Platform.isIOS() && !deviceIsWindowsPhone;
    var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);
  
    function TouchEvent(layer, options) {
  
      options = options || {};
  
      this.trackingClick = false;
      this.trackingClickStart = 0;
      this.targetElement = null;
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.lastTouchIdentifier = 0;
      this.touchBoundary = options.touchBoundary || 10;
      this.layer = layer;
      this.tapDelay = options.tapDelay || 200;
      this.tapTimeout = options.tapTimeout || 700;
  
      if (TouchEvent.notNeeded(layer)) {
        return;
      }
  
      var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
      var context = this;
      for (var i = 0, l = methods.length; i < l; i++) {
        context[methods[i]] = lang.bind(context[methods[i]], context);
      }
  
      if (deviceIsAndroid) {
        layer.addEventListener('mouseover', this.onMouse, true);
        layer.addEventListener('mousedown', this.onMouse, true);
        layer.addEventListener('mouseup', this.onMouse, true);
      }
  
      layer.addEventListener('click', this.onClick, true);
      layer.addEventListener('touchstart', this.onTouchStart, false);
      layer.addEventListener('touchmove', this.onTouchMove, false);
      layer.addEventListener('touchend', this.onTouchEnd, false);
      layer.addEventListener('touchcancel', this.onTouchCancel, false);
  
    }
  
    TouchEvent.prototype.needsClick = function(target) {
      switch (target.nodeName.toLowerCase()) {
        case 'button':
        case 'select':
        case 'textarea':
          if (target.disabled) {
            return true;
          }
          break;
        case 'input':
          if ((deviceIsIOS && target.type === 'file') || target.disabled) {
            return true;
          }
          break;
        case 'label':
        case 'iframe':
        case 'video':
          return true;
      }
  
      return (/\bneedsclick\b/).test(target.className);
    };
  
    TouchEvent.prototype.needsFocus = function(target) {
      switch (target.nodeName.toLowerCase()) {
        case 'textarea':
          return true;
        case 'select':
          return !deviceIsAndroid;
        case 'input':
          switch (target.type) {
            case 'button':
            case 'checkbox':
            case 'file':
            case 'image':
            case 'radio':
            case 'submit':
              return false;
          }
          return !target.disabled && !target.readOnly;
        default:
          return (/\bneedsfocus\b/).test(target.className);
      }
    };
  
    TouchEvent.prototype.sendClick = function(targetElement, event) {
      var clickEvent, touch;
  
      if (document.activeElement && document.activeElement !== targetElement) {
        document.activeElement.blur();
      }
  
      touch = event.changedTouches[0];
  
      clickEvent = document.createEvent('MouseEvents');
      clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
      clickEvent.forwardedTouchEvent = true;
      targetElement.dispatchEvent(clickEvent);
    };
  
    TouchEvent.prototype.determineEventType = function(targetElement) {
  
      if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
        return 'mousedown';
      }
  
      return 'click';
    };
  
    TouchEvent.prototype.focus = function(targetElement) {
      var length;
  
      if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
        length = targetElement.value.length;
        targetElement.setSelectionRange(length, length);
      } else {
        targetElement.focus();
      }
    };
  
    TouchEvent.prototype.updateScrollParent = function(targetElement) {
      var scrollParent, parentElement;
  
      scrollParent = targetElement.touchEventScrollParent;
  
      if (!scrollParent || !scrollParent.contains(targetElement)) {
        parentElement = targetElement;
        do {
          if (parentElement.scrollHeight > parentElement.offsetHeight) {
            scrollParent = parentElement;
            targetElement.touchEventScrollParent = parentElement;
            break;
          }
  
          parentElement = parentElement.parentElement;
        } while (parentElement);
      }
  
      if (scrollParent) {
        scrollParent.touchEventLastScrollTop = scrollParent.scrollTop;
      }
    };
  
    TouchEvent.prototype.getTargetElementFromEventTarget = function(eventTarget) {
  
      if (eventTarget.nodeType === Node.TEXT_NODE) {
        return eventTarget.parentNode;
      }
  
      return eventTarget;
    };
  
    TouchEvent.prototype.onTouchStart = function(event) {
      var targetElement, touch, selection;
  
      if (event.targetTouches.length > 1) {
        return true;
      }
  
      targetElement = this.getTargetElementFromEventTarget(event.target);
      touch = event.targetTouches[0];
  
      if (deviceIsIOS) {
  
        selection = window.getSelection();
        if (selection.rangeCount && !selection.isCollapsed) {
          return true;
        }
  
        if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
          event.preventDefault();
          return false;
        }
  
        this.lastTouchIdentifier = touch.identifier;
  
        this.updateScrollParent(targetElement);
      }
  
      this.trackingClick = true;
      this.trackingClickStart = event.timeStamp;
      this.targetElement = targetElement;
  
      this.touchStartX = touch.pageX;
      this.touchStartY = touch.pageY;
  
      if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
        event.preventDefault();
      }
  
      return true;
    };
  
    TouchEvent.prototype.touchHasMoved = function(event) {
      var touch = event.changedTouches[0],
        boundary = this.touchBoundary;
  
      if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
        return true;
      }
  
      return false;
    };
  
    TouchEvent.prototype.onTouchMove = function(event) {
      if (!this.trackingClick) {
        return true;
      }
  
      if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
        this.trackingClick = false;
        this.targetElement = null;
      }
  
      return true;
    };
  
    TouchEvent.prototype.findControl = function(labelElement) {
  
      if (!lang.isUndefined(labelElement.control)) {
        return labelElement.control;
      }
  
      if (labelElement.htmlFor) {
        return document.getElementById(labelElement.htmlFor);
      }
  
      return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
    };
  
    TouchEvent.prototype.onTouchEnd = function(event) {
      var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;
  
      if (!this.trackingClick) {
        return true;
      }
  
      if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
        this.cancelNextClick = true;
        return true;
      }
  
      if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
        return true;
      }
  
      this.cancelNextClick = false;
  
      this.lastClickTime = event.timeStamp;
  
      trackingClickStart = this.trackingClickStart;
      this.trackingClick = false;
      this.trackingClickStart = 0;
  
      if (deviceIsIOSWithBadTarget) {
        touch = event.changedTouches[0];
  
        targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
        targetElement.touchEventScrollParent = this.targetElement.touchEventScrollParent;
      }
  
      targetTagName = targetElement.tagName.toLowerCase();
      if (targetTagName === 'label') {
        forElement = this.findControl(targetElement);
        if (forElement) {
          this.focus(targetElement);
          if (deviceIsAndroid) {
            return false;
          }
  
          targetElement = forElement;
        }
      } else if (this.needsFocus(targetElement)) {
  
        if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
          this.targetElement = null;
          return false;
        }
  
        this.focus(targetElement);
        this.sendClick(targetElement, event);
  
        if (!deviceIsIOS || targetTagName !== 'select') {
          this.targetElement = null;
          event.preventDefault();
        }
  
        return false;
      }
  
      if (deviceIsIOS) {
  
        scrollParent = targetElement.touchEventScrollParent;
        if (scrollParent && scrollParent.touchEventLastScrollTop !== scrollParent.scrollTop) {
          return true;
        }
      }
  
      if (!this.needsClick(targetElement)) {
        event.preventDefault();
        this.sendClick(targetElement, event);
      }
  
      return false;
    };
  
    TouchEvent.prototype.onTouchCancel = function() {
      this.trackingClick = false;
      this.targetElement = null;
    };
  
    TouchEvent.prototype.onMouse = function(event) {
  
      if (!this.targetElement || event.forwardedTouchEvent || !event.cancelable) {
        return true;
      }
  
      if (!this.needsClick(this.targetElement) || this.cancelNextClick) {
  
        if (event.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        }
  
        event.stopPropagation();
        event.preventDefault();
  
        return false;
      }
  
      return true;
    };
  
    TouchEvent.prototype.onClick = function(event) {
      var permitted;
  
      if (this.trackingClick) {
        this.targetElement = null;
        this.trackingClick = false;
        return true;
      }
  
      if (event.target.type === 'submit' && event.detail === 0) {
        return true;
      }
  
      permitted = this.onMouse(event);
  
      if (!permitted) {
        this.targetElement = null;
      }
  
      return permitted;
    };
  
    TouchEvent.prototype.destroy = function() {
      var layer = this.layer;
  
      if (deviceIsAndroid) {
        layer.removeEventListener('mouseover', this.onMouse, true);
        layer.removeEventListener('mousedown', this.onMouse, true);
        layer.removeEventListener('mouseup', this.onMouse, true);
      }
  
      layer.removeEventListener('click', this.onClick, true);
      layer.removeEventListener('touchstart', this.onTouchStart, false);
      layer.removeEventListener('touchmove', this.onTouchMove, false);
      layer.removeEventListener('touchend', this.onTouchEnd, false);
      layer.removeEventListener('touchcancel', this.onTouchCancel, false);
    };
  
    TouchEvent.notNeeded = function(layer) {
  
      var metaViewport;
      var chromeVersion;
  
      if (lang.isUndefined(window.ontouchstart)) {
        return true;
      }
  
      chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];
  
      if (chromeVersion) {
  
        if (deviceIsAndroid) {
          metaViewport = document.querySelector('meta[name=viewport]');
  
          if (metaViewport) {
            if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
              return true;
            }
            if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
              return true;
            }
          }
  
        } else {
          return true;
        }
      }
  
      if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
        return true;
      }
  
      return false;
    };
  
    TouchEvent.initialize = function(options, layer) {
      layer = layer || $('body');
      return new TouchEvent($(layer).get(0), options);
    };
  
    module.exports = TouchEvent;
  
  });

  define('mob/scroller', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var Support = require('mob/support');
    var $ = require('mob/jqlite');
    var Error = require('mob/error');
  
    var requestAnimationFrame = lang.requestAnimationFrame;
    var nowFn = lang.now;
    var prefixStyle = Support.getPrefixStyle;
  
    var addEventFn = function(el, type, fn, capture) {
      el.addEventListener(type, fn, !!capture);
    };
    var removeEventFn = function(el, type, fn, capture) {
      el.removeEventListener(type, fn, !!capture);
    };
    var prefixPointerEventFn = function(pointerEvent) {
      return window.MSPointerEvent ? 'MSPointer' + pointerEvent.charAt(9).toUpperCase() + pointerEvent.substr(10) : pointerEvent;
    };
  
    var isBadAndroid = /Android /.test(window.navigator.appVersion) && !(/Chrome\/\d/.test(window.navigator.appVersion));
    var transStyle = {
      transform: prefixStyle('transform'),
      transitionTimingFunction: prefixStyle('transitionTimingFunction'),
      transitionDuration: prefixStyle('transitionDuration'),
      transitionDelay: prefixStyle('transitionDelay'),
      transformOrigin: prefixStyle('transformOrigin')
    };
    var supportEventType = {
      touchstart: 1,
      touchmove: 1,
      touchend: 1,
  
      mousedown: 2,
      mousemove: 2,
      mouseup: 2,
  
      pointerdown: 3,
      pointermove: 3,
      pointerup: 3,
  
      MSPointerDown: 3,
      MSPointerMove: 3,
      MSPointerUp: 3
    };
  
    var easeEffect = {
      quadratic: {
        style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fn: function(k) {
          return k * (2 - k);
        }
      },
      circular: {
        style: 'cubic-bezier(0.1, 0.57, 0.1, 1)', // Not properly 'circular' but this looks better, it should be (0.075, 0.82, 0.165, 1)
        fn: function(k) {
          return Math.sqrt(1 - (--k * k));
        }
      },
      back: {
        style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        fn: function(k) {
          var b = 4;
          return (k = k - 1) * k * ((b + 1) * k + b) + 1;
        }
      },
      bounce: {
        style: '',
        fn: function(k) {
          if ((k /= 1) < (1 / 2.75)) {
            return 7.5625 * k * k;
          } else if (k < (2 / 2.75)) {
            return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
          } else if (k < (2.5 / 2.75)) {
            return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
          } else {
            return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
          }
        }
      },
      elastic: {
        style: '',
        fn: function(k) {
          var f = 0.22,
            e = 0.4;
  
          if (k === 0) {
            return 0;
          }
          if (k == 1) {
            return 1;
          }
  
          return (e * Math.pow(2, -10 * k) * Math.sin((k - f / 4) * (2 * Math.PI) / f) + 1);
        }
      }
    };
  
    var momentumFn = function(current, start, time, lowerMargin, wrapperSize, deceleration) {
      var distance = current - start,
        speed = Math.abs(distance) / time,
        destination, duration;
  
      deceleration = deceleration === undefined ? 0.0006 : deceleration;
  
      destination = current + (speed * speed) / (2 * deceleration) * (distance < 0 ? -1 : 1);
      duration = speed / deceleration;
  
      if (destination < lowerMargin) {
        destination = wrapperSize ? lowerMargin - (wrapperSize / 2.5 * (speed / 8)) : lowerMargin;
        distance = Math.abs(destination - current);
        duration = distance / speed;
      } else if (destination > 0) {
        destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0;
        distance = Math.abs(current) + destination;
        duration = distance / speed;
      }
  
      return {
        destination: Math.round(destination),
        duration: duration
      };
    };
  
    var offsetFn = function(el) {
      var left = -el.offsetLeft,
        top = -el.offsetTop;
  
      while (el = el.offsetParent) {
        left -= el.offsetLeft;
        top -= el.offsetTop;
      }
  
      return {
        left: left,
        top: top
      };
    };
  
    var preventDefaultExceptionFn = function(el, exceptions) {
      for (var i in exceptions) {
        if (exceptions[i].test(el[i])) {
          return true;
        }
      }
  
      return false;
    };
  
    var doTapEvent = function(e, eventName) {
      var ev = document.createEvent('Event');
      ev.initEvent(eventName, true, true);
      ev.pageX = e.pageX;
      ev.pageY = e.pageY;
      e.target.dispatchEvent(ev);
    };
  
    var doClickEvent = function(e) {
      var target = e.target, ev;
  
      if (!(/(SELECT|INPUT|TEXTAREA)/i).test(target.tagName)) {
        ev = document.createEvent('MouseEvents');
        ev.initMouseEvent('click', true, true, e.view, 1,
          target.screenX, target.screenY, target.clientX, target.clientY,
          e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
          0, null);
  
        ev._constructed = true;
        target.dispatchEvent(ev);
      }
    };
  
    function Scroller(el, options) {
      this.wrapper = lang.isString(el) ? document.querySelector(el) : el;
      this.scroller = this.wrapper.children[0];
      this.scrollerStyle = this.scroller.style; // cache style for better performance
  
      this.options = {
  
        startX: 0,
        startY: 0,
        scrollY: true,
        directionLockThreshold: 5,
        momentum: true,
  
        bounce: true,
        bounceTime: 600,
        bounceEasing: '',
  
        preventDefault: true,
        preventDefaultException: {
          tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/
        },
  
        HWCompositing: true,
        useTransition: true,
        useTransform: true
      };
  
      for (var i in options) {
        this.options[i] = options[i];
      }
  
      // Normalize options
      this.translateZ = this.options.HWCompositing && Support.hasPerspective ? ' translateZ(0)' : '';
  
      this.options.useTransition = Support.hasTransition && this.options.useTransition;
      this.options.useTransform = Support.hasTransform && this.options.useTransform;
  
      this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
      this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;
  
      // If you want eventPassthrough I have to lock one of the axes
      this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
      this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;
  
      // With eventPassthrough we also need lockDirection mechanism
      this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough;
      this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;
  
      this.options.bounceEasing = lang.isString(this.options.bounceEasing) ? easeEffect[this.options.bounceEasing] || easeEffect.circular : this.options.bounceEasing;
  
      this.options.resizePolling = lang.isUndefined(this.options.resizePolling) ? 60 : this.options.resizePolling;
  
      if (this.options.tap === true) {
        this.options.tap = 'tap';
      }
  
      this.x = 0;
      this.y = 0;
      this.directionX = 0;
      this.directionY = 0;
      this._events = {};
  
      this._init();
      this.refresh();
  
      this.scrollTo(this.options.startX, this.options.startY);
      this.enable();
    }
  
    Scroller.prototype = {
  
      _init: function() {
        this._initEvents();
      },
  
      destroy: function() {
        this._initEvents(true);
  
        this._execEvent('destroy');
      },
  
      _transitionEnd: function(e) {
        if (e.target != this.scroller || !this.isInTransition) {
          return;
        }
  
        this._transitionTime();
        if (!this.resetPosition(this.options.bounceTime)) {
          this.isInTransition = false;
          this._execEvent('scrollEnd');
        }
      },
  
      _start: function(e) {
        if (supportEventType[e.type] != 1) {
          if (e.button !== 0) {
            return;
          }
        }
  
        if (!this.enabled || (this.initiated && supportEventType[e.type] !== this.initiated)) {
          return;
        }
  
        if (this.options.preventDefault && !isBadAndroid && !preventDefaultExceptionFn(e.target, this.options.preventDefaultException)) {
          e.preventDefault();
        }
  
        var point = e.touches ? e.touches[0] : e, pos;
  
        this.initiated = supportEventType[e.type];
        this.moved = false;
        this.distX = 0;
        this.distY = 0;
        this.directionX = 0;
        this.directionY = 0;
        this.directionLocked = 0;
  
        this._transitionTime();
  
        this.startTime = nowFn();
  
        if (this.options.useTransition && this.isInTransition) {
          this.isInTransition = false;
          pos = this.getComputedPosition();
          this._translate(Math.round(pos.x), Math.round(pos.y));
          this._execEvent('scrollEnd');
        } else if (!this.options.useTransition && this.isAnimating) {
          this.isAnimating = false;
          this._execEvent('scrollEnd');
        }
  
        this.startX = this.x;
        this.startY = this.y;
        this.absStartX = this.x;
        this.absStartY = this.y;
        this.pointX = point.pageX;
        this.pointY = point.pageY;
  
        this._execEvent('beforeScrollStart');
      },
  
      _move: function(e) {
        if (!this.enabled || supportEventType[e.type] !== this.initiated) {
          return;
        }
  
        if (this.options.preventDefault) { // increases performance on Android? TODO: check!
          e.preventDefault();
        }
  
        var point = e.touches ? e.touches[0] : e,
          deltaX = point.pageX - this.pointX, deltaY = point.pageY - this.pointY,
          timestamp = nowFn(), newX, newY, absDistX, absDistY;
  
        this.pointX = point.pageX;
        this.pointY = point.pageY;
  
        this.distX += deltaX;
        this.distY += deltaY;
        absDistX = Math.abs(this.distX);
        absDistY = Math.abs(this.distY);
  
        // We need to move at least 10 pixels for the scrolling to initiate
        if (timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10)) {
          return;
        }
  
        // If you are scrolling in one direction lock the other
        if (!this.directionLocked && !this.options.freeScroll) {
          if (absDistX > absDistY + this.options.directionLockThreshold) {
            this.directionLocked = 'h'; // lock horizontally
          } else if (absDistY >= absDistX + this.options.directionLockThreshold) {
            this.directionLocked = 'v'; // lock vertically
          } else {
            this.directionLocked = 'n'; // no lock
          }
        }
  
        if (this.directionLocked == 'h') {
          if (this.options.eventPassthrough == 'vertical') {
            e.preventDefault();
          } else if (this.options.eventPassthrough == 'horizontal') {
            this.initiated = false;
            return;
          }
  
          deltaY = 0;
        } else if (this.directionLocked == 'v') {
          if (this.options.eventPassthrough == 'horizontal') {
            e.preventDefault();
          } else if (this.options.eventPassthrough == 'vertical') {
            this.initiated = false;
            return;
          }
  
          deltaX = 0;
        }
  
        deltaX = this.hasHorizontalScroll ? deltaX : 0;
        deltaY = this.hasVerticalScroll ? deltaY : 0;
  
        newX = this.x + deltaX;
        newY = this.y + deltaY;
  
        // Slow down if outside of the boundaries
        if (newX > 0 || newX < this.maxScrollX) {
          newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
        }
        if (newY > 0 || newY < this.maxScrollY) {
          newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
        }
  
        this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
        this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;
  
        if (!this.moved) {
          this._execEvent('scrollStart');
        }
  
        this.moved = true;
  
        this._translate(newX, newY);
  
        if (timestamp - this.startTime > 300) {
          this.startTime = timestamp;
          this.startX = this.x;
          this.startY = this.y;
        }
  
      },
  
      _end: function(e) {
        if (!this.enabled || supportEventType[e.type] !== this.initiated) {
          return;
        }
  
        if (this.options.preventDefault && !preventDefaultExceptionFn(e.target, this.options.preventDefaultException)) {
          e.preventDefault();
        }
  
        var momentumX, momentumY,
          duration = nowFn() - this.startTime,
          newX = Math.round(this.x), newY = Math.round(this.y),
          distanceX = Math.abs(newX - this.startX), distanceY = Math.abs(newY - this.startY),
          time = 0, easing = '';
  
        this.isInTransition = 0;
        this.initiated = 0;
        this.endTime = nowFn();
  
        // reset if we are outside of the boundaries
        if (this.resetPosition(this.options.bounceTime)) {
          return;
        }
  
        this.scrollTo(newX, newY); // ensures self the last position is rounded
  
        // we scrolled less than 10 pixels
        if (!this.moved) {
          if (this.options.tap) {
            doTapEvent(e, this.options.tap);
          }
  
          if (this.options.click) {
            doClickEvent(e);
          }
  
          this._execEvent('scrollCancel');
          return;
        }
  
        if (this._events.flick && duration < 200 && distanceX < 100 && distanceY < 100) {
          this._execEvent('flick');
          return;
        }
  
        // start momentum animation if needed
        if (this.options.momentum && duration < 300) {
          momentumX = this.hasHorizontalScroll ? momentumFn(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : {
            destination: newX,
            duration: 0
          };
          momentumY = this.hasVerticalScroll ? momentumFn(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : {
            destination: newY,
            duration: 0
          };
          newX = momentumX.destination;
          newY = momentumY.destination;
          time = Math.max(momentumX.duration, momentumY.duration);
          this.isInTransition = 1;
        }
  
        if (newX != this.x || newY != this.y) {
          // change easing function when scroller goes out of the boundaries
          if (newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY) {
            easing = easeEffect.quadratic;
          }
  
          this.scrollTo(newX, newY, time, easing);
          return;
        }
  
        this._execEvent('scrollEnd');
      },
  
      _resize: function() {
        var self = this;
  
        clearTimeout(this.resizeTimeout);
  
        this.resizeTimeout = setTimeout(function() {
          self.refresh();
        }, this.options.resizePolling);
      },
  
      resetPosition: function(time) {
        var x = this.x, y = this.y;
  
        time = time || 0;
  
        if (!this.hasHorizontalScroll || this.x > 0) {
          x = 0;
        } else if (this.x < this.maxScrollX) {
          x = this.maxScrollX;
        }
  
        if (!this.hasVerticalScroll || this.y > 0) {
          y = 0;
        } else if (this.y < this.maxScrollY) {
          y = this.maxScrollY;
        }
  
        if (x == this.x && y == this.y) {
          return false;
        }
  
        this.scrollTo(x, y, time, this.options.bounceEasing);
  
        return true;
      },
  
      disable: function() {
        this.enabled = false;
      },
  
      enable: function() {
        this.enabled = true;
      },
  
      refresh: function() {
  
        this.wrapperWidth = this.wrapper.clientWidth;
        this.wrapperHeight = this.wrapper.clientHeight;
  
        this.scrollerWidth = this.scroller.offsetWidth;
        this.scrollerHeight = this.scroller.offsetHeight;
  
        this.maxScrollX = this.wrapperWidth - this.scrollerWidth;
        this.maxScrollY = this.wrapperHeight - this.scrollerHeight;
  
        this.hasHorizontalScroll = this.options.scrollX && this.maxScrollX < 0;
        this.hasVerticalScroll = this.options.scrollY && this.maxScrollY < 0;
  
        if (!this.hasHorizontalScroll) {
          this.maxScrollX = 0;
          this.scrollerWidth = this.wrapperWidth;
        }
  
        if (!this.hasVerticalScroll) {
          this.maxScrollY = 0;
          this.scrollerHeight = this.wrapperHeight;
        }
  
        this.endTime = 0;
        this.directionX = 0;
        this.directionY = 0;
  
        this.wrapperOffset = offsetFn(this.wrapper);
  
        this._execEvent('refresh');
  
        this.resetPosition();
  
      },
  
      on: function(type, fn) {
        if (!this._events[type]) {
          this._events[type] = [];
        }
  
        this._events[type].push(fn);
      },
  
      off: function(type, fn) {
        if (!this._events[type]) {
          return;
        }
  
        var index = this._events[type].indexOf(fn);
  
        if (index > -1) {
          this._events[type].splice(index, 1);
        }
      },
  
      _execEvent: function(type) {
        if (!this._events[type]) {
          return;
        }
  
        var i = 0, l = this._events[type].length;
  
        if (!l) {
          return;
        }
  
        for (; i < l; i++) {
          this._events[type][i].apply(this, [].slice.call(arguments, 1));
        }
      },
  
      scrollBy: function(x, y, time, easing) {
        x = this.x + x;
        y = this.y + y;
        time = time || 0;
  
        this.scrollTo(x, y, time, easing);
      },
  
      scrollTo: function(x, y, time, easing) {
        easing = easing || easeEffect.circular;
  
        this.isInTransition = this.options.useTransition && time > 0;
  
        if (!time || (this.options.useTransition && easing.style)) {
          this._transitionTimingFunction(easing.style);
          this._transitionTime(time);
          this._translate(x, y);
        } else {
          this._animate(x, y, time, easing.fn);
        }
      },
  
      scrollToElement: function(el, time, offsetX, offsetY, easing) {
        el = el.nodeType ? el : this.scroller.querySelector(el);
  
        if (!el) {
          return;
        }
  
        var pos = offsetFn(el);
  
        pos.left -= this.wrapperOffset.left;
        pos.top -= this.wrapperOffset.top;
  
        // if offsetX/Y are true we center the element to the screen
        if (offsetX === true) {
          offsetX = Math.round(el.offsetWidth / 2 - this.wrapper.offsetWidth / 2);
        }
        if (offsetY === true) {
          offsetY = Math.round(el.offsetHeight / 2 - this.wrapper.offsetHeight / 2);
        }
  
        pos.left -= offsetX || 0;
        pos.top -= offsetY || 0;
  
        pos.left = pos.left > 0 ? 0 : pos.left < this.maxScrollX ? this.maxScrollX : pos.left;
        pos.top = pos.top > 0 ? 0 : pos.top < this.maxScrollY ? this.maxScrollY : pos.top;
  
        time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(this.x - pos.left), Math.abs(this.y - pos.top)) : time;
  
        this.scrollTo(pos.left, pos.top, time, easing);
      },
  
      _transitionTime: function(time) {
        time = time || 0;
  
        this.scrollerStyle[transStyle.transitionDuration] = time + 'ms';
  
        if (!time && isBadAndroid) {
          this.scrollerStyle[transStyle.transitionDuration] = '0.001s';
        }
  
      },
  
      _transitionTimingFunction: function(easing) {
        this.scrollerStyle[transStyle.transitionTimingFunction] = easing;
      },
  
      _translate: function(x, y) {
        if (this.options.useTransform) {
  
          this.scrollerStyle[transStyle.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;
  
        } else {
          x = Math.round(x);
          y = Math.round(y);
          this.scrollerStyle.left = x + 'px';
          this.scrollerStyle.top = y + 'px';
        }
  
        this.x = x;
        this.y = y;
  
      },
  
      _initEvents: function(remove) {
        var eventType = remove ? removeEventFn : addEventFn, target = this.options.bindToWrapper ? this.wrapper : window;
  
        eventType(window, 'orientationchange', this);
        eventType(window, 'resize', this);
  
        if (this.options.click) {
          eventType(this.wrapper, 'click', this, true);
        }
  
        if (!this.options.disableMouse) {
          eventType(this.wrapper, 'mousedown', this);
          eventType(target, 'mousemove', this);
          eventType(target, 'mousecancel', this);
          eventType(target, 'mouseup', this);
        }
  
        if (Support.hasPointer && !this.options.disablePointer) {
          eventType(this.wrapper, prefixPointerEventFn('pointerdown'), this);
          eventType(target, prefixPointerEventFn('pointermove'), this);
          eventType(target, prefixPointerEventFn('pointercancel'), this);
          eventType(target, prefixPointerEventFn('pointerup'), this);
        }
  
        if (Support.hasTouch && !this.options.disableTouch) {
          eventType(this.wrapper, 'touchstart', this);
          eventType(target, 'touchmove', this);
          eventType(target, 'touchcancel', this);
          eventType(target, 'touchend', this);
        }
  
        eventType(this.scroller, 'transitionend', this);
        eventType(this.scroller, 'webkitTransitionEnd', this);
        eventType(this.scroller, 'oTransitionEnd', this);
        eventType(this.scroller, 'MSTransitionEnd', this);
      },
  
      getComputedPosition: function() {
        var matrix = window.getComputedStyle(this.scroller, null), x, y;
  
        if (this.options.useTransform) {
          matrix = matrix[transStyle.transform].split(')')[0].split(', ');
          x = +(matrix[12] || matrix[4]);
          y = +(matrix[13] || matrix[5]);
        } else {
          x = +matrix.left.replace(/[^-\d.]/g, '');
          y = +matrix.top.replace(/[^-\d.]/g, '');
        }
  
        return {
          x: x,
          y: y
        };
      },
  
      _animate: function(destX, destY, duration, easingFn) {
        var self = this, startX = this.x, startY = this.y, startTime = nowFn(), destTime = startTime + duration;
  
        function step() {
          var now = nowFn(), newX, newY, easing;
  
          if (now >= destTime) {
            self.isAnimating = false;
            self._translate(destX, destY);
  
            if (!self.resetPosition(self.options.bounceTime)) {
              self._execEvent('scrollEnd');
            }
  
            return;
          }
  
          now = (now - startTime) / duration;
          easing = easingFn(now);
          newX = (destX - startX) * easing + startX;
          newY = (destY - startY) * easing + startY;
          self._translate(newX, newY);
  
          if (self.isAnimating) {
            requestAnimationFrame(step);
          }
        }
  
        this.isAnimating = true;
        step();
      },
      handleEvent: function(e) {
        switch (e.type) {
          case 'touchstart':
          case 'pointerdown':
          case 'MSPointerDown':
          case 'mousedown':
            this._start(e);
            break;
          case 'touchmove':
          case 'pointermove':
          case 'MSPointerMove':
          case 'mousemove':
            this._move(e);
            break;
          case 'touchend':
          case 'pointerup':
          case 'MSPointerUp':
          case 'mouseup':
          case 'touchcancel':
          case 'pointercancel':
          case 'MSPointerCancel':
          case 'mousecancel':
            this._end(e);
            break;
          case 'orientationchange':
          case 'resize':
            this._resize();
            break;
          case 'transitionend':
          case 'webkitTransitionEnd':
          case 'oTransitionEnd':
          case 'MSTransitionEnd':
            this._transitionEnd(e);
            break;
          case 'wheel':
          case 'DOMMouseScroll':
          case 'mousewheel':
            this._wheel(e);
            break;
          case 'keydown':
            this._key(e);
            break;
          case 'click':
            if (!e._constructed) {
              e.preventDefault();
              e.stopPropagation();
            }
            break;
        }
      }
    };
  
    Scroller.createScroller = function(el, options) {
  
      if (lang.isUndefined(el)) {
        throw Error('`el` is empty.');
      }
  
      return new Scroller($(el).get(0), lang.extend({
        mouseWheel: true
      }, options || {}));
    };
  
    module.exports = Scroller;
  
  });

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

  define('mob/viewport', function(require, exports, module) {
  
    var Platform = require('mob/platform');
  
    var viewportTag;
    var viewportProperties = {};
  
    function viewportLoadTag() {
      var x;
  
      for (x = 0; x < document.head.children.length; x++) {
        if (document.head.children[x].name == 'viewport') {
          viewportTag = document.head.children[x];
          break;
        }
      }
  
      if (viewportTag) {
        var props = viewportTag.content.toLowerCase().replace(/\s+/g, '').split(',');
        var keyValue;
        for (x = 0; x < props.length; x++) {
          if (props[x]) {
            keyValue = props[x].split('=');
            viewportProperties[keyValue[0]] = (keyValue.length > 1 ? keyValue[1] : '_');
          }
        }
        viewportUpdate();
      }
    }
  
    function viewportUpdate() {
  
      var initWidth = viewportProperties.width;
      var initHeight = viewportProperties.height;
      var version = Platform.version();
      var DEVICE_WIDTH = 'device-width';
      var DEVICE_HEIGHT = 'device-height';
      var orientation = Viewport.orientation();
  
      // Most times we're removing the height and adding the width
      // So this is the default to start with, then modify per platform/version/oreintation
      delete viewportProperties.height;
      viewportProperties.width = DEVICE_WIDTH;
  
      if (Platform.isIPad()) {
        // iPad
  
        if (version > 7) {
          // iPad >= 7.1
          // https://issues.apache.org/jira/browse/CB-4323
          delete viewportProperties.width;
  
        } else {
          // iPad <= 7.0
  
          if (Platform.isWebView()) {
            // iPad <= 7.0 WebView
  
            if (orientation == 90) {
              // iPad <= 7.0 WebView Landscape
              viewportProperties.height = '0';
  
            } else if (version == 7) {
              // iPad <= 7.0 WebView Portait
              viewportProperties.height = DEVICE_HEIGHT;
            }
          } else {
            // iPad <= 6.1 Browser
            if (version < 7) {
              viewportProperties.height = '0';
            }
          }
        }
  
      } else if (Platform.isIOS()) {
        // iPhone
  
        if (Platform.isWebView()) {
          // iPhone WebView
  
          if (version > 7) {
            // iPhone >= 7.1 WebView
            delete viewportProperties.width;
  
          } else if (version < 7) {
            // iPhone <= 6.1 WebView
            // if height was set it needs to get removed with this hack for <= 6.1
            if (initHeight) viewportProperties.height = '0';
  
          } else if (version == 7) {
            //iPhone == 7.0 WebView
            viewportProperties.height = DEVICE_HEIGHT;
          }
  
        } else {
          // iPhone Browser
  
          if (version < 7) {
            // iPhone <= 6.1 Browser
            // if height was set it needs to get removed with this hack for <= 6.1
            if (initHeight) viewportProperties.height = '0';
          }
        }
  
      }
  
      // only update the viewport tag if there was a change
      if (initWidth !== viewportProperties.width || initHeight !== viewportProperties.height) {
        viewportTagUpdate();
      }
    }
  
    function viewportTagUpdate() {
      var key, props = [];
      for (key in viewportProperties) {
        if (viewportProperties[key]) {
          props.push(key + (viewportProperties[key] == '_' ? '' : '=' + viewportProperties[key]));
        }
      }
  
      viewportTag.content = props.join(', ');
    }
  
  
    var Viewport = {
  
      orientation: function() {
        // 0 = Portrait
        // 90 = Landscape
        // not using window.orientation because each device has a different implementation
        return (window.innerWidth > window.innerHeight ? 90 : 0);
      },
  
      initialize: function() {
        Platform.ready(function() {
          viewportLoadTag();
  
          window.addEventListener('orientationchange', function() {
            setTimeout(viewportUpdate, 1000);
          }, false);
        });
      },
  
      _viewportLoadTag: viewportLoadTag
  
    };
  
    module.exports = Viewport;
  
  });

  define('mob/swipe', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var Support = require('mob/support');
  
    function Swipe(container, options) {
  
      var offloadFn = function (fn) {
        setTimeout(fn || lang.noop, 0);
      };
  
      // quit if no root element
      if (!container) {
        return;
      }
      var element = container.children[0];
      var slides, slidePos, width;
      options = options || {};
      var index = parseInt(options.startSlide, 10) || 0;
      var speed = options.speed || 300;
  
      function setup() {
  
        // cache slides
        slides = element.children;
  
        // create an array to store current positions of each slide
        slidePos = new Array(slides.length);
  
        // determine width of each slide
        width = container.getBoundingClientRect().width || container.offsetWidth;
  
        element.style.width = (slides.length * width) + 'px';
  
        // stack elements
        var pos = slides.length;
        while (pos--) {
  
          var slide = slides[pos];
  
          slide.style.width = width + 'px';
          slide.setAttribute('data-index', pos);
  
          if (Support.transitions) {
            slide.style.left = (pos * -width) + 'px';
            move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
          }
  
        }
  
        if (!Support.transitions) {
          element.style.left = (index * -width) + 'px';
        }
  
        container.style.visibility = 'visible';
  
      }
  
      function prev() {
  
        if (index) {
          slide(index - 1);
        } else if (options.continuous) {
          slide(slides.length - 1);
        }
  
      }
  
      function next() {
  
        if (index < slides.length - 1) {
          slide(index + 1);
        } else if (options.continuous) {
          slide(0);
        }
  
      }
  
      function slide(to, slideSpeed) {
  
        // do nothing if already on requested slide
        if (index == to) {
          return;
        }
  
        if (Support.transitions) {
  
          var diff = Math.abs(index - to) - 1;
          var direction = Math.abs(index - to) / (index - to); // 1:right -1:left
  
          while (diff--) {
            move((to > index ? to : index) - diff - 1, width * direction, 0);
          }
  
          move(index, width * direction, slideSpeed || speed);
          move(to, 0, slideSpeed || speed);
  
        } else {
  
          animate(index * -width, to * -width, slideSpeed || speed);
  
        }
  
        index = to;
  
        offloadFn(options.callback && options.callback(index, slides[index]));
  
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
  
        style.webkitTransitionDuration =
          style.MozTransitionDuration =
            style.msTransitionDuration =
              style.OTransitionDuration =
                style.transitionDuration = speed + 'ms';
  
        style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
        style.msTransform =
          style.MozTransform =
            style.OTransform = 'translateX(' + dist + 'px)';
  
      }
  
      function animate(from, to, speed) {
  
        // if not an animation, just reposition
        if (!speed) {
  
          element.style.left = to + 'px';
          return;
  
        }
  
        var start = +new Date;
  
        var timer = setInterval(function () {
  
          var timeElap = +new Date - start;
  
          if (timeElap > speed) {
  
            element.style.left = to + 'px';
  
            if (delay) begin();
  
            options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);
  
            clearInterval(timer);
            return;
  
          }
  
          element.style.left = (((to - from) * (Math.floor((timeElap / speed) * 100) / 100)) + from) + 'px';
  
        }, 4);
  
      }
  
      // setup auto slideshow
      var delay = options.auto || 0;
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
  
        handleEvent: function (event) {
  
          switch (event.type) {
            case 'touchstart':
              this.start(event);
              break;
            case 'touchmove':
              this.move(event);
              break;
            case 'touchend':
              offloadFn(this.end(event));
              break;
            case 'webkitTransitionEnd':
            case 'msTransitionEnd':
            case 'oTransitionEnd':
            case 'otransitionend':
            case 'transitionend':
              offloadFn(this.transitionEnd(event));
              break;
            case 'resize':
              offloadFn(setup.call());
              break;
          }
  
          if (options.stopPropagation) {
            event.stopPropagation();
          }
  
        },
        start: function (event) {
  
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
        move: function (event) {
  
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
          if (typeof isScrolling == 'undefined') {
            isScrolling = !!(isScrolling || Math.abs(delta.x) < Math.abs(delta.y));
          }
  
          // if user is not trying to scroll vertically
          if (!isScrolling) {
  
            // prevent native scrolling
            event.preventDefault();
  
            // stop slideshow
            stop();
  
            // increase resistance if first or last slide
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
  
        },
        end: function (event) {
  
          // measure duration
          var duration = +new Date - start.time;
  
          // determine if slide attempt triggers next/prev slide
          var isValidSlide =
            Number(duration) < 250 // if slide duration is less than 250ms
            && Math.abs(delta.x) > 20 // and if slide amt is greater than 20px
            || Math.abs(delta.x) > width / 2; // or if slide amt is greater than half the width
  
          // determine if slide attempt is past start and end
          var isPastBounds = !index && delta.x > 0 // if first slide and slide amt is greater than 0
            || index == slides.length - 1 && delta.x < 0; // or if last slide and slide amt is less than 0
  
          // determine direction of swipe (true:right, false:left)
          var direction = delta.x < 0;
  
          // if not scrolling vertically
          if (!isScrolling) {
  
            if (isValidSlide && !isPastBounds) {
  
              if (direction) {
  
                move(index - 1, -width, 0);
                move(index, slidePos[index] - width, speed);
                move(index + 1, slidePos[index + 1] - width, speed);
                index += 1;
  
              } else {
  
                move(index + 1, width, 0);
                move(index, slidePos[index] + width, speed);
                move(index - 1, slidePos[index - 1] + width, speed);
                index += -1;
  
              }
  
              options.callback && options.callback(index, slides[index]);
  
            } else {
  
              move(index - 1, -width, speed);
              move(index, 0, speed);
              move(index + 1, width, speed);
  
            }
  
          }
  
          // kill touchmove and touchend event listeners until touchstart called again
          element.removeEventListener('touchmove', events, false);
          element.removeEventListener('touchend', events, false);
  
        },
        transitionEnd: function (event) {
  
          if (parseInt(event.target.getAttribute('data-index'), 10) == index) {
  
            if (delay) begin();
  
            options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);
  
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
      if (Support.addEventListener) {
  
        // set touchstart event on element
        if (Support.touch) element.addEventListener('touchstart', events, false);
  
        if (Support.transitions) {
          element.addEventListener('webkitTransitionEnd', events, false);
          element.addEventListener('msTransitionEnd', events, false);
          element.addEventListener('oTransitionEnd', events, false);
          element.addEventListener('otransitionend', events, false);
          element.addEventListener('transitionend', events, false);
        }
  
        // set resize event on window
        window.addEventListener('resize', events, false);
  
      } else {
  
        window.onresize = function () {
          setup()
        }; // to play nice with old IE
  
      }
  
      // expose the Swipe API
      return {
        setup: function () {
  
          setup();
  
        },
        slide: function (to, speed) {
  
          slide(to, speed);
  
        },
        prev: function () {
  
          // cancel slideshow
          stop();
  
          prev();
  
        },
        next: function () {
  
          stop();
  
          next();
  
        },
        getPos: function () {
  
          // return current index position
          return index;
  
        },
        kill: function () {
  
          // cancel slideshow
          stop();
  
          // reset element
          element.style.width = 'auto';
          element.style.left = 0;
  
          // reset slides
          var pos = slides.length;
          while (pos--) {
  
            var slide = slides[pos];
            slide.style.width = '100%';
            slide.style.left = 0;
  
            if (Support.transitions) translate(pos, 0, 0);
  
          }
  
          // removed event listeners
          if (Support.addEventListener) {
  
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

  define('mob/template', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var Error = require('mob/error');
  
    var Template = {};
    var templateHelpers = {
      insertComponent: function(componentName) {
        return '<div mo-component="' + componentName + '"></div>';
      }
    };
  
    var noMatch = /(.)^/;
  
    var escapes = {
      "'": "'",
      '\\': '\\',
      '\r': 'r',
      '\n': 'n',
      '\u2028': 'u2028',
      '\u2029': 'u2029'
    };
  
    var escaper = /\\|'|\r|\n|\u2028|\u2029/g;
  
    Template._settings = {
      evaluate: /<%([\s\S]+?)%>/g,
      interpolate: /<%=([\s\S]+?)%>/g,
      escape: /<%-([\s\S]+?)%>/g
    };
  
    Template.config = function(options) {
      return lang.extend(Template._settings, options || {});
    };
  
    Template.registerHelpers = function(newHelpers) {
  
      lang.each(newHelpers, function(helper, name) {
        Template.registerHelper(name, helper);
      });
  
    };
  
    Template.registerHelper = function(name, helper) {
      if (lang.isFunction(templateHelpers[name])) {
        throw new Error('Helper "' + name + '" already defined.');
      }
  
      if (!lang.isFunction(helper)) {
        throw new Error('Typeof helper "' + helper + '" is not a function.');
      }
  
      templateHelpers[name] = helper;
  
    };
  
    var escapeChar = function(match) {
      return '\\' + escapes[match];
    };
  
    function template(text, settings, oldSettings) {
      if (!settings && oldSettings) {
        settings = oldSettings;
      }
  
      settings = lang.defaults({}, settings, Template._settings);
  
      // Combine delimiters into one regular expression via alternation.
      var matcher = RegExp([
          (settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source
        ].join('|') + '|$', 'g');
  
      // Compile the template source, escaping string literals appropriately.
      var index = 0;
      var source = "__p+='";
      text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
        source += text.slice(index, offset).replace(escaper, escapeChar);
        index = offset + match.length;
  
        if (escape) {
          source += "'+\n((__t=(" + escape + "))==null?'':Mob.escape(__t))+\n'";
        } else if (interpolate) {
          source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
        } else if (evaluate) {
          source += "';\n" + evaluate + "\n__p+='";
        }
  
        // Adobe VMs need the match returned to produce the correct offest.
        return match;
      });
  
      source += "';\n";
  
      // If a variable is not specified, place data values in local scope.
      if (!settings.variable) {
        source = 'with(obj||{}){\n' + source + '}\n';
      }
  
      source = "var __t,__p='',__j=Array.prototype.join," +
        "print=function(){__p+=__j.call(arguments,'');};\n" +
        source + 'return __p;\n';
  
      try {
        var render = new Function(settings.variable || 'obj', 'Mob', source);
      } catch (e) {
        e.source = source;
        throw e;
      }
  
      var template = function(data) {
        return render.call(this, data, Mob);
      };
  
      // Provide the compiled source as a convenience for precompilation.
      var argument = settings.variable || 'obj';
      template.source = 'function(' + argument + '){\n' + source + '}';
  
      return template;
    }
  
    Template.compile = function(text, data, settings) {
  
      if (data) {
        lang.defaults(data, templateHelpers);
        return template.apply(this, arguments);
      }
  
      var originalTemplate = template.apply(this, arguments);
  
      var wrappedTemplate = function(data) {
        data = lang.defaults({}, data, templateHelpers);
        return originalTemplate.call(this, data);
      };
  
      return wrappedTemplate;
    };
  
    module.exports = Template;
  
  });

  define('mob/component', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var View = require('mob/view');
    var Error = require('mob/error');
    var Template = require('mob/template');
  
    var Component = View.extend({
  
      tagName: 'div',
  
      className: 'mo-component',
  
      serializeData: function() {
        if (lang.isFunction(this.data)) {
          var serializeData = this.data();
          if (lang.isObject(serializeData)) {
            this.data = serializeData;
          }
        }
  
        return {
          data: this.data || {}
        };
      },
  
      render: function() {
        this._ensureViewIsIntact();
  
        this.triggerMethod('before:render', this);
  
        this._renderTemplate();
        this.isRendered = true;
  
        this.triggerMethod('render', this);
  
        return this;
      },
  
      _renderTemplate: function() {
        var template = this.getTemplate();
  
        if (template === false) {
          return;
        }
  
        if (!template) {
          throw new Error('Cannot render the template since it is null or undefined.');
        }
  
        this.registerTemplateHelpers();
        var data = this.serializeData();
  
        var compileHtml = Template.compile(template, data);
  
        // Render and add to el
        this.attachElContent(compileHtml);
  
        return this;
      },
  
      attachElContent: function(html) {
        this.$el.html(html);
  
        return this;
      }
  
    });
  
    module.exports = Component;
  
  });

  define('mob/screen', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var $ = require('mob/jqlite');
    var base = require('mob/base');
    var Class = require('mob/class');
    var Error = require('mob/error');
  
    var Screen = Class.extend({
  
      constructor: function(options) {
  
        this.options = options || {};
        this.el = this.getOption('el');
  
        this.el = $(this.el).get(0);
  
        if (!this.el) {
          throw new Error('An "el" must be specified for a screen.');
        }
  
        this.$el = this.getEl(this.el);
        Class.call(this, options);
      },
  
      // Displays a Mob view instance inside of the screen.
      // Handles calling the `render` method for you. Reads content
      // directly from the `el` attribute. Also calls an optional
      // `onShow` and `onDestroy` method on your view, just after showing
      // or just before destroying the view, respectively.
      // The `preventDestroy` option can be used to prevent a view from
      // the old view being destroyed on show.
      // The `forceShow` option can be used to force a view to be
      // re-rendered if it's already shown in the screen.
      show: function(view, options) {
        if (!this._ensureElement()) {
          return;
        }
  
        this._ensureViewIsIntact(view);
        base.monitorDOMRefresh(view);
  
        var showOptions = options || {};
        var isDifferentView = view !== this.currentView;
        var preventDestroy = !!showOptions.preventDestroy;
        var forceShow = !!showOptions.forceShow;
  
        // We are only changing the view if there is a current view to change to begin with
        var isChangingView = !!this.currentView;
  
        // Only destroy the current view if we don't want to `preventDestroy` and if
        // the view given in the first argument is different than `currentView`
        var _shouldDestroyView = isDifferentView && !preventDestroy;
  
        // Only show the view given in the first argument if it is different than
        // the current view or if we want to re-show the view. Note that if
        // `_shouldDestroyView` is true, then `_shouldShowView` is also necessarily true.
        var _shouldShowView = isDifferentView || forceShow;
  
        if (isChangingView) {
          this.triggerMethod('before:swapOut', this.currentView, this, options);
        }
  
        if (this.currentView) {
          delete this.currentView._parent;
        }
  
        if (_shouldDestroyView) {
          this.empty();
        } else if (isChangingView && _shouldShowView) {
          this.currentView.off('destroy', this.empty, this);
        }
  
        if (_shouldShowView) {
  
          // We need to listen for if a view is destroyed
          // in a way other than through the screen.
          // If this happens we need to remove the reference
          // to the currentView since once a view has been destroyed
          // we can not reuse it.
          view.once('destroy', this.empty, this);
  
          view.render();
  
          view._parent = this;
  
          if (isChangingView) {
            this.triggerMethod('before:swap', view, this, options);
          }
  
          this.triggerMethod('before:show', view, this, options);
          base.triggerMethodOn(view, 'before:show', view, this, options);
  
          if (isChangingView) {
            this.triggerMethod('swapOut', this.currentView, this, options);
          }
  
          // An array of views that we're about to display
          var attachedScreen = base.isNodeAttached(this.el);
  
          // The views that we're about to attach to the document
          // It's important that we prevent _getNestedViews from being executed unnecessarily
          // as it's a potentially-slow method
          var displayedViews = [];
  
          var attachOptions = lang.extend({
            triggerBeforeAttach: this.triggerBeforeAttach,
            triggerAttach: this.triggerAttach
          }, showOptions);
  
          if (attachedScreen && attachOptions.triggerBeforeAttach) {
            displayedViews = this._displayedViews(view);
            this._triggerAttach(displayedViews, 'before:');
          }
  
          this.attachHtml(view);
          this.currentView = view;
  
          if (attachedScreen && attachOptions.triggerAttach) {
            displayedViews = this._displayedViews(view);
            this._triggerAttach(displayedViews);
          }
  
          if (isChangingView) {
            this.triggerMethod('swap', view, this, options);
          }
  
          this.triggerMethod('show', view, this, options);
          base.triggerMethodOn(view, 'show', view, this, options);
  
          return this;
        }
  
        return this;
      },
  
      triggerBeforeAttach: true,
      triggerAttach: true,
  
      _triggerAttach: function(views, prefix) {
        var eventName = (prefix || '') + 'attach';
        lang.each(views, function(view) {
          base.triggerMethodOn(view, eventName, view, this);
        }, this);
      },
  
      _displayedViews: function(view) {
        return lang.union([view], lang.result(view, '_getNestedViews') || []);
      },
  
      _ensureElement: function() {
        if (!lang.isObject(this.el)) {
          this.$el = this.getEl(this.el);
          this.el = this.$el[0];
        }
  
        if (!this.$el || this.$el.length === 0) {
          if (this.getOption('allowMissingEl')) {
            return false;
          } else {
            throw new Error('An "el" ' + this.$el.selector + ' must exist in DOM');
          }
        }
        return true;
      },
  
      _ensureViewIsIntact: function(view) {
        if (!view) {
          throw new Error('The view passed is undefined and therefore invalid. You must pass a view instance to show.');
        }
  
        if (view.isDestroyed) {
          throw new Error('View (cid: "' + view.cid + '") has already been destroyed and cannot be used.');
        }
      },
  
      // Override this method to change how the screen finds the DOM
      // element that it manages. Return a jQuery selector object scoped
      // to a provided parent el or the document if none exists.
      getEl: function(el) {
        return $(el, base._getValue(this.options.parentEl, this));
      },
  
      // Override this method to change how the new view is
      // appended to the `$el` that the screen is managing
      attachHtml: function(view) {
        this.$el.contents().detach();
  
        this.el.appendChild(view.el);
      },
  
      empty: function(options) {
        var view = this.currentView;
  
        var emptyOptions = options || {};
        var preventDestroy = !!emptyOptions.preventDestroy;
        // If there is no view in the screen
        // we should not remove anything
        if (!view) {
          return;
        }
  
        view.off('destroy', this.empty, this);
        this.triggerMethod('before:empty', view);
        if (!preventDestroy) {
          this._destroyView();
        }
        this.triggerMethod('empty', view);
  
        // Remove screen pointer to the currentView
        delete this.currentView;
  
        if (preventDestroy) {
          this.$el.contents().detach();
        }
  
        return this;
      },
  
      // call 'destroy' or 'remove', depending on which is found on the view (if showing a raw View)
      _destroyView: function() {
        var view = this.currentView;
        if (view.isDestroyed) {
          return;
        }
  
        if (view.destroy) {
          view.destroy();
        } else {
          view.remove();
  
          // appending isDestroyed to raw Backbone View allows screens
          // to throw a ViewDestroyedError for this view
          view.isDestroyed = true;
        }
      },
  
      // Attach an existing view to the screen. This
      // will not call `render` or `onShow` for the new view,
      // and will not replace the current HTML for the `el`
      // of the screen.
      attachView: function(view) {
        if (this.currentView) {
          delete this.currentView._parent;
        }
        view._parent = this;
        this.currentView = view;
        return this;
      },
  
      // Checks whether a view is currently present within
      // the screen. Returns `true` if there is and `false` if
      // no view is present.
      hasView: function() {
        return !!this.currentView;
      },
  
      // Reset the screen by destroying any existing view and
      // clearing out the cached `$el`. The next time a view
      // is shown via this screen, the screen will re-query the
      // DOM for the screen's `el`.
      reset: function() {
        this.empty();
  
        if (this.$el) {
          this.el = this.$el.selector;
        }
  
        delete this.$el;
        return this;
      }
  
    }, {
  
      buildScreen: function(screenConfig, DefaultScreenClass) {
        if (lang.isString(screenConfig)) {
          return this._buildScreenFromSelector(screenConfig, DefaultScreenClass);
        }
  
        if (screenConfig.selector || screenConfig.el || screenConfig.screenClass) {
          return this._buildScreenFromObject(screenConfig, DefaultScreenClass);
        }
  
        if (lang.isFunction(screenConfig)) {
          return this._buildScreenFromScreenClass(screenConfig);
        }
  
        throw new Error('Improper screen configuration type.');
      },
  
      // Build the screen from a string selector like '#foo-screen'
      _buildScreenFromSelector: function(selector, DefaultScreenClass) {
        return new DefaultScreenClass({
          el: selector
        });
      },
  
      // Build the screen from a configuration object
      // { selector: '#foo', screenClass: FooScreen, allowMissingEl: false }
      _buildScreenFromObject: function(screenConfig, DefaultScreenClass) {
        var ScreenClass = screenConfig.screenClass || DefaultScreenClass;
        var options = lang.omit(screenConfig, 'selector', 'screenClass');
  
        if (screenConfig.selector && !options.el) {
          options.el = screenConfig.selector;
        }
  
        return new ScreenClass(options);
      },
  
      // Build the screen directly from a given `ScreenClass`
      _buildScreenFromScreenClass: function(ScreenClass) {
        return new ScreenClass();
      }
  
    });
  
    module.exports = Screen;
  
  });

  define('mob/screenComponent', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var $ = require('mob/jqlite');
    var Error = require('mob/error');
  
    var ScreenComponent = {};
  
    ScreenComponent.add = function(view) {
  
      var overriddenViewMethods = {
        render: view.render,
        remove: view.remove
      };
  
      view.render = function() {
        var args = Array.prototype.slice.call(arguments);
  
        prerender.call(this);
        var returnValue = overriddenViewMethods.render.apply(this, args);
        postrender.call(this);
  
        return returnValue;
      };
  
      // 当 render 方式为异步调用的时候，可以手动调用 `renderComponents` 初始化组件
      view.renderComponents = function() {
        if (!lang.isEmpty(this.components)) {
          lang.info('Components have already rendered!');
        } else {
          postrender.call(this);
        }
      };
  
      view.remove = function() {
        this.removeComponents();
        return overriddenViewMethods.remove.call(this);
      };
  
      view.removeComponents = function() {
        // Removes all components and cleans up references in this.components.
  
        if (this.components) {
  
          lang.each(this.components, function(component) {
            component.remove();
          });
  
          delete this.components;
        }
      };
  
      view._createComponent = function(componentName, placeHolderDiv) {
        var componentCreator = this.componentCreators[componentName];
        if (lang.isUndefined(componentCreator)) {
          throw new Error('Can not find component creator for component named: ' + componentName);
        }
  
        return componentCreator.apply(this);
      };
    };
  
    function prerender() {
      if (!this.components) {
        this.components = {};
      }
  
      lang.each(this.components, function(component) {
        component.$el.detach();
      });
    }
  
    function postrender() {
      var self = this;
      this.componentCreators = this.componentCreators || {};
  
      // Support componentCreators as both objects and functions.
      this.componentCreators = lang.result(this, 'componentCreators');
  
      this.$('[mo-component]').each(function() {
        var $this = $(this);
        var componentName = $this.attr('mo-component');
        var newComponent;
  
        if (lang.isUndefined(self.components[componentName])) {
          newComponent = self._createComponent(componentName, $this);
          if (newComponent === null) {
            return;
          }
          self.components[componentName] = newComponent;
        } else {
          newComponent = self.components[componentName];
        }
  
        $this.replaceWith(newComponent.$el);
      });
  
      // Now that all components have been created, render them one at a time, in the
      // order they occur in the DOM.
      lang.each(this.components, function(component) {
        component.render();
      });
  
      if(lang.isFunction(this.onComponentsRendered)) {
        this.onComponentsRendered.call(this);
      }
  
    }
  
    module.exports = ScreenComponent;
  
  });

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
  
      // Add multiple screens using an object literal or a
      // function that returns an object literal, where
      // each key becomes the screen name, and each value is
      // the screen definition.
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
  
      // Add an individual screen to the screen manager,
      // and return the screen instance
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
  
      // Get a screen by name
      get: function(name) {
        return this._screens[name];
      },
  
      // Gets all the screens contained within
      // the `screenManager` instance.
      getScreens: function() {
        return lang.clone(this._screens);
      },
  
      // Remove a screen by name
      removeScreen: function(name) {
        var screen = this._screens[name];
        this._remove(name, screen);
  
        return screen;
      },
  
      // Empty all screens in the screen manager, and
      // remove them
      removeScreens: function() {
        var screens = this.getScreens();
        lang.each(this._screens, function(screen, name) {
          this._remove(name, screen);
        }, this);
  
        return screens;
      },
  
      // Empty all screens in the screen manager, but
      // leave them attached
      emptyScreens: function() {
        var screens = this.getScreens();
        lang.invoke(screens, 'empty');
        return screens;
      },
  
      destroy: function() {
        this.removeScreens();
  
        base._triggerMethod(this, 'before:destroy', arguments);
        base._triggerMethod(this, 'destroy', arguments);
  
        this.stopListening();
        this.off();
        return this;
      },
  
      // internal method to store screens
      _store: function(name, screen) {
        if (!this._screens[name]) {
          this.length++;
        }
  
        this._screens[name] = screen;
      },
  
      // internal method to remove a screen
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

  define('mob/screenView', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var $ = require('mob/jqlite');
    var base = require('mob/base');
    var Logger = require('mob/logger');
    var View = require('mob/view');
    var ScreenComponent = require('mob/screenComponent');
    var Scroller = require('mob/scroller');
  
    var ScreenView = View.extend({
  
      tagName: 'div',
  
      className: 'mo-screen-view',
  
      constructor: function(options) {
        this.render = lang.bind(this.render, this);
  
        options = base._getValue(options, this);
  
        View.call(this, options);
  
        ScreenComponent.add(this);
        base.monitorDOMRefresh(this);
  
      },
  
      initScroller: function() {
  
        if (this.$('.mo-scroll-content').length === 0 || this.$('.mo-scroll').length === 0) {
          Logger.error('Can not find both ".mo-scroll-content" and ".mo-scroll" elements.');
          return;
        }
  
        if (!this.scroller) {
          this.scroller = new Scroller(this.$('.mo-scroll-content').get(0), {
            mouseWheel: true
          });
  
          $(document).unbind('touchmove.scroller').bind('touchmove.scroller', function (e) {
            e.preventDefault();
          });
  
        }
      },
  
      refreshScroller: function() {
        var self = this;
        setTimeout(function() {
          self.scroller && self.scroller.refresh();
        }, 300);
      },
  
      destroy: function() {
  
        if (this.isDestroyed) {
          return this;
        }
  
        var args = lang.toArray(arguments);
  
        this.triggerMethod.apply(this, ['before:destroy'].concat(args));
  
        this.isDestroyed = true;
        this.triggerMethod.apply(this, ['destroy'].concat(args));
  
        this.isRendered = false;
  
        this.remove();
  
        return this;
      }
  
    });
  
    module.exports = ScreenView;
  
  });

  define('mob/router', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var Logger = require('mob/logger');
    var $ = require('mob/jqlite');
    var Error = require('mob/error');
  
    var isUndefined = lang.isUndefined;
  
    var hashchangeEvtName = 'hashchange.router';
  
    var ROUTER_PATH_REPLACER = '([^\/\\?]+)',
      ROUTER_PATH_NAME_MATCHER = /:([\w\d]+)/g,
      ROUTER_PATH_EVERY_MATCHER = /\/\*(?!\*)/,
      ROUTER_PATH_EVERY_REPLACER = '\/([^\/\\?]+)',
      ROUTER_PATH_EVERY_GLOBAL_MATCHER = /\*{2}/,
      ROUTER_PATH_EVERY_GLOBAL_REPLACER = '(.*?)\\??',
      ROUTER_LEADING_BACKSLASHES_MATCH = /\/*$/;
  
    var RouterRequest = function(href) {
      this.href = href;
      this.params;
      this.query;
      this.splat;
      this.hasNext = false;
    };
  
    RouterRequest.prototype.get = function(key, defaultValue) {
      return (this.params && !isUndefined(this.params[key])) ?
        this.params[key] : (this.query && !isUndefined(this.query[key])) ?
        this.query[key] : !isUndefined(defaultValue) ? defaultValue : undefined;
    };
  
    var Router = function(options) {
  
      this._options = lang.extend({
        ignorecase: true
      }, options);
  
      this._routes = [];
      this._befores = [];
      this._errors = {
        '_': function( /* err, url, httpCode */ ) {},
        '_404': function(err, url) {
          Logger.warn('404! Unmatched route for url ' + url);
        },
        '_500': function(err, url) {
          Logger.error('500! Internal error route for url ' + url);
        }
      };
      this._paused = false;
  
      var hasChangeHandler = lang.bind(this._onHashChange, this);
  
      $(window).unbind(hashchangeEvtName).bind(hashchangeEvtName, hasChangeHandler);
    };
  
    Router.prototype._onHashChange = function(e) {
      if (!this._paused) {
        this._route(this._extractFragment(window.location.href));
      }
      return true;
    };
  
    Router.prototype._extractFragment = function(url) {
      var hashIndex = url.indexOf('#');
      return hashIndex >= 0 ? url.substring(hashIndex) : '#/';
    };
  
    Router.prototype._throwsRouteError = function(httpCode, err, url) {
      if (lang.isFunction(this._errors['_' + httpCode])) {
        this._errors['_' + httpCode](err, url, httpCode);
      } else {
        this._errors._(err, url, httpCode);
      }
      return false;
    };
  
    Router.prototype._buildRequestObject = function(fragmentUrl, params, splat, hasNext) {
      if (!fragmentUrl) {
        throw new Error('Unable to compile request object');
      }
      var request = new RouterRequest(fragmentUrl);
      if (params) {
        request.params = params;
      }
      var completeFragment = fragmentUrl.split('?');
      if (completeFragment.length == 2) {
        var queryKeyValue = null;
        var queryString = completeFragment[1].split('&');
        request.query = {};
        for (var i = 0, qLen = queryString.length; i < qLen; i++) {
          queryKeyValue = queryString[i].split('=');
          request.query[decodeURI(queryKeyValue[0])] = decodeURI(queryKeyValue[1].replace(/\+/g, '%20'));
        }
        request.query;
      }
      if (splat && splat.length > 0) {
        request.splats = splat;
      }
      if (hasNext === true) {
        request.hasNext = true;
      }
      return request;
    };
  
    Router.prototype._followRoute = function(fragmentUrl, url, matchedIndexes) {
      var index = matchedIndexes.splice(0, 1),
        route = this._routes[index],
        match = url.match(route.path),
        request,
        params = {},
        splat = [];
      if (!route) {
        return this._throwsRouteError(500, new Error('Internal error'), fragmentUrl);
      }
      for (var i = 0, len = route.paramNames.length; i < len; i++) {
        params[route.paramNames[i]] = match[i + 1];
      }
      i = i + 1;
  
      if (match && i < match.length) {
        for (var j = i; j < match.length; j++) {
          splat.push(match[j]);
        }
      }
  
      var hasNext = (matchedIndexes.length !== 0);
  
      var next = lang.bind(function(uO, u, mI, hasNext) {
  
        return lang.bind(function(hasNext, err, error_code) {
          if (!hasNext && !err) {
            return this._throwsRouteError(500, 'Cannot call "next" without an error if request.hasNext is false', fragmentUrl);
          }
          if (err) {
            return this._throwsRouteError(error_code || 500, err, fragmentUrl);
          }
          this._followRoute(uO, u, mI);
        }, this, hasNext);
  
      }, this)(fragmentUrl, url, matchedIndexes, hasNext);
  
      request = this._buildRequestObject(fragmentUrl, params, splat, hasNext);
      route.routeAction(request, next);
    };
  
    Router.prototype._routeBefores = function(befores, before, fragmentUrl, url, matchedIndexes) {
      var next;
      if (befores.length > 0) {
        var nextBefore = befores.splice(0, 1);
        nextBefore = nextBefore[0];
        next = lang.bind(function(err, error_code) {
          if (err) {
            return this._throwsRouteError(error_code || 500, err, fragmentUrl);
          }
          this._routeBefores(befores, nextBefore, fragmentUrl, url, matchedIndexes);
        }, this);
  
      } else {
        next = lang.bind(function(err, error_code) {
          if (err) {
            return this._throwsRouteError(error_code || 500, err, fragmentUrl);
          }
          this._followRoute(fragmentUrl, url, matchedIndexes);
        }, this);
  
      }
      before(this._buildRequestObject(fragmentUrl, null, null, true), next);
    };
  
    Router.prototype._route = function(fragmentUrl) {
      var route = '',
        befores = this._befores.slice(),
        matchedIndexes = [],
        urlToTest;
      var url = fragmentUrl;
      if (url.length === 0) {
        return true;
      }
      url = url.replace(ROUTER_LEADING_BACKSLASHES_MATCH, '');
      urlToTest = (url.split('?'))[0].replace(ROUTER_LEADING_BACKSLASHES_MATCH, '');
  
      for (var p in this._routes) {
        if (this._routes.hasOwnProperty(p)) {
          route = this._routes[p];
          if (route.path.test(urlToTest)) {
            matchedIndexes.push(p);
          }
        }
      }
  
      if (matchedIndexes.length > 0) {
        if (befores.length > 0) {
          var before = befores.splice(0, 1);
          before = before[0];
          this._routeBefores(befores, before, fragmentUrl, url, matchedIndexes);
        } else {
          this._followRoute(fragmentUrl, url, matchedIndexes);
        }
      } else {
        return this._throwsRouteError(404, null, fragmentUrl);
      }
    };
  
    Router.prototype.pause = function() {
      this._paused = true;
      return this;
    };
  
    Router.prototype.play = function(triggerNow) {
      triggerNow = isUndefined(triggerNow) ? false : triggerNow;
      this._paused = false;
      if (triggerNow) {
        this._route(this._extractFragment(window.location.href));
      }
      return this;
    };
  
    Router.prototype.setLocation = function(url) {
      window.history.pushState(null, '', url);
      return this;
    };
  
    Router.prototype.redirect = function(url) {
      this.setLocation(url);
      if (!this._paused) {
        this._route(this._extractFragment(url));
      }
      return this;
    };
  
    Router.prototype.addRoute = function(path, callback) {
      var match,
        modifiers = (this._options.ignorecase ? 'i' : ''),
        paramNames = [];
      if (lang.isString(path)) {
        path = path.replace(ROUTER_LEADING_BACKSLASHES_MATCH, '');
        while ((match = ROUTER_PATH_NAME_MATCHER.exec(path)) !== null) {
          paramNames.push(match[1]);
        }
        path = new RegExp(path
            .replace(ROUTER_PATH_NAME_MATCHER, ROUTER_PATH_REPLACER)
            .replace(ROUTER_PATH_EVERY_MATCHER, ROUTER_PATH_EVERY_REPLACER)
            .replace(ROUTER_PATH_EVERY_GLOBAL_MATCHER, ROUTER_PATH_EVERY_GLOBAL_REPLACER) + '(?:\\?.+)?$', modifiers);
      }
  
      this._routes.push({
        'path': path,
        'paramNames': paramNames,
        'routeAction': callback
      });
      return this;
    };
  
    Router.prototype.before = function(callback) {
      this._befores.push(callback);
      return this;
    };
  
    Router.prototype.errors = function(httpCode, callback) {
      if (lang.isNaN(httpCode)) {
        throw new Error('Invalid code for routes error handling');
      }
      if (!lang.isFunction(callback)) {
        throw new Error('Invalid callback for routes error handling');
      }
      httpCode = '_' + httpCode;
      this._errors[httpCode] = callback;
      return this;
    };
  
    Router.prototype.run = function(startUrl) {
      if (!startUrl) {
        startUrl = this._extractFragment(window.location.href);
      }
      startUrl = startUrl.indexOf('#') === 0 ? startUrl : '#' + startUrl;
      this.redirect(startUrl);
      return this;
    };
  
    Router.prototype.destroy = function() {
      $(window).unbind(hashchangeEvtName);
      return this;
    };
  
    module.exports = Router;
  
  });

  define('mob/application', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var base = require('mob/base');
    var Class = require('mob/class');
    var Router = require('mob/router');
    var ScreenManager = require('mob/screenManager');
    var Storage = require('mob/storage');
  
    var Application = Class.extend({
  
      constructor: function(options) {
        this._initScreens(options);
  
        this.appRouter = new Router();
        this.appCache = new Storage({
          name: 'appCache',
          type: 'memory'
        });
  
        this._initRouters(options);
  
        lang.extend(this, options);
        Class.apply(this, arguments);
      },
  
      // kick off all of the application's processes.
      // initializes all of the screens that have been added
      // to the app, and runs all of the initializer functions
      start: function(options) {
  
        options = lang.extend({
          autoRunRouter: true
        }, options || {});
  
        this.triggerMethod('before:start', options);
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
  
        var routers = lang.isFunction(this.routers) ? this.routers(options) : this.routers || {};
  
        var optionRouters = base.getOption(options, 'routers');
  
        if (lang.isFunction(optionRouters)) {
          optionRouters = optionRouters.call(this, options);
        }
  
        lang.extend(routers, optionRouters);
  
        this.addRouters(routers);
  
        return this;
      },
  
      // Internal method to initialize the screens that have been defined in a
      // `screens` attribute on the application instance
      _initScreens: function(options) {
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

  var lang = require('mob/lang');
  lang.extend(Mob, lang);
  
  Mob.Logger = require('mob/logger');
  Mob.each(['debug', 'time', 'timeEnd', 'info', 'warn', 'error', 'log'], function(method) {
    Mob[method] = Mob.Logger[method];
  });
  
  Mob.Error = require('mob/error');
  
  if (Mob.isUndefined(Mob.$)) {
    Mob.$ = require('mob/jqlite');
  }
  
  Mob.Class = require('mob/class');
  Mob.Events = require('mob/events');
  Mob.HTTP = require('mob/http');
  Mob.Storage = require('mob/storage');
  Mob.View = require('mob/view');
  Mob.Support = require('mob/support');
  
  Mob.Platform = require('mob/platform');
  Mob.initializePlatform = Mob.Platform.initialize;
  Mob.Touch = require('mob/touch');
  Mob.initializeTouchEvent = Mob.Touch.initialize;
  Mob.Scroller = require('mob/scroller');
  Mob.Viewport = require('mob/viewport');
  Mob.initializeViewport = Mob.Viewport.initialize;
  Mob.Transition = require('mob/transition');
  
  Mob.Swipe = require('mob/swipe');
  
  Mob.Template = require('mob/template');
  Mob.Component = require('mob/component');
  Mob.Screen = require('mob/screen');
  Mob.ScreenView = require('mob/screenView');
  Mob.ScreenComponent = require('mob/screenComponent');
  Mob.Router = require('mob/router');
  Mob.Application = require('mob/application');
  Mob.createApplication = function(options) {
    return new Mob.Application(options);
  };
  
  Mob.require = Mob.requireModule = require;
  Mob.define = Mob.defineModule = define;

  return Mob;

}));