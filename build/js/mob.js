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
  
  var M$ = Mob.$ = $;
  
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
  
    var Ctor = function() {};
  
    var optimizeCb = function(func, context, argCount) {
      if (context === void 0) return func;
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
      if (value == null) return lang.identity;
      if (lang.isFunction(value)) return optimizeCb(value, context, argCount);
      if (lang.isObject(value)) return lang.matcher(value);
      return lang.property(value);
    };
    lang.iteratee = function(value, context) {
      return cb(value, context, Infinity);
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
            if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
          }
        }
        return obj;
      };
    };
  
    var baseCreate = function(prototype) {
      if (!lang.isObject(prototype)) return {};
      if (nativeCreate) return nativeCreate(prototype);
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
  
    // Collection Functions
    // --------------------
  
    lang.each = function(obj, iteratee, context) {
      iteratee = optimizeCb(iteratee, context);
      var i, length;
      if (isArrayLike(obj)) {
        for (i = 0, length = obj.length; i < length; i++) {
          iteratee(obj[i], i, obj);
        }
      } else {
        var keys = lang.keys(obj);
        for (i = 0, length = keys.length; i < length; i++) {
          iteratee(obj[keys[i]], keys[i], obj);
        }
      }
      return obj;
    };
  
    lang.map = function(obj, iteratee, context) {
      iteratee = cb(iteratee, context);
      var keys = !isArrayLike(obj) && lang.keys(obj),
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
        var keys = !isArrayLike(obj) && lang.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
        // Determine the initial value if none is provided.
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
        key = lang.findIndex(obj, predicate, context);
      } else {
        key = lang.findKey(obj, predicate, context);
      }
      if (key !== void 0 && key !== -1) return obj[key];
    };
  
    lang.filter = function(obj, predicate, context) {
      var results = [];
      predicate = cb(predicate, context);
      lang.each(obj, function(value, index, list) {
        if (predicate(value, index, list)) results.push(value);
      });
      return results;
    };
  
    lang.reject = function(obj, predicate, context) {
      return lang.filter(obj, lang.negate(cb(predicate)), context);
    };
  
    lang.every = function(obj, predicate, context) {
      predicate = cb(predicate, context);
      var keys = !isArrayLike(obj) && lang.keys(obj),
        length = (keys || obj).length;
      for (var index = 0; index < length; index++) {
        var currentKey = keys ? keys[index] : index;
        if (!predicate(obj[currentKey], currentKey, obj)) return false;
      }
      return true;
    };
  
    lang.some = function(obj, predicate, context) {
      predicate = cb(predicate, context);
      var keys = !isArrayLike(obj) && lang.keys(obj),
        length = (keys || obj).length;
      for (var index = 0; index < length; index++) {
        var currentKey = keys ? keys[index] : index;
        if (predicate(obj[currentKey], currentKey, obj)) return true;
      }
      return false;
    };
  
    lang.contains = function(obj, item, fromIndex, guard) {
      if (!isArrayLike(obj)) obj = lang.values(obj);
      if (typeof fromIndex != 'number' || guard) fromIndex = 0;
      return lang.indexOf(obj, item, fromIndex) >= 0;
    };
  
    lang.invoke = function(obj, method) {
      var args = slice.call(arguments, 2);
      var isFunc = lang.isFunction(method);
      return lang.map(obj, function(value) {
        var func = isFunc ? method : value[method];
        return func == null ? func : func.apply(value, args);
      });
    };
  
    lang.pluck = function(obj, key) {
      return lang.map(obj, lang.property(key));
    };
  
    lang.where = function(obj, attrs) {
      return lang.filter(obj, lang.matcher(attrs));
    };
  
    lang.findWhere = function(obj, attrs) {
      return lang.find(obj, lang.matcher(attrs));
    };
  
    lang.shuffle = function(obj) {
      var set = isArrayLike(obj) ? obj : lang.values(obj);
      var length = set.length;
      var shuffled = Array(length);
      for (var index = 0, rand; index < length; index++) {
        rand = lang.random(0, index);
        if (rand !== index) shuffled[index] = shuffled[rand];
        shuffled[rand] = set[index];
      }
      return shuffled;
    };
  
    lang.sample = function(obj, n, guard) {
      if (n == null || guard) {
        if (!isArrayLike(obj)) obj = lang.values(obj);
        return obj[lang.random(obj.length - 1)];
      }
      return lang.shuffle(obj).slice(0, Math.max(0, n));
    };
  
    lang.sortBy = function(obj, iteratee, context) {
      iteratee = cb(iteratee, context);
      return lang.pluck(lang.map(obj, function(value, index, list) {
        return {
          value: value,
          index: index,
          criteria: iteratee(value, index, list)
        };
      }).sort(function(left, right) {
        var a = left.criteria;
        var b = right.criteria;
        if (a !== b) {
          if (a > b || a === void 0) return 1;
          if (a < b || b === void 0) return -1;
        }
        return left.index - right.index;
      }), 'value');
    };
  
    var group = function(behavior) {
      return function(obj, iteratee, context) {
        var result = {};
        iteratee = cb(iteratee, context);
        lang.each(obj, function(value, index) {
          var key = iteratee(value, index, obj);
          behavior(result, value, key);
        });
        return result;
      };
    };
  
    lang.groupBy = group(function(result, value, key) {
      if (lang.has(result, key)) result[key].push(value);
      else result[key] = [value];
    });
  
    lang.indexBy = group(function(result, value, key) {
      result[key] = value;
    });
  
    lang.countBy = group(function(result, value, key) {
      if (lang.has(result, key)) result[key]++;
      else result[key] = 1;
    });
  
    lang.toArray = function(obj) {
      if (!obj) return [];
      if (lang.isArray(obj)) return slice.call(obj);
      if (isArrayLike(obj)) return lang.map(obj, lang.identity);
      return lang.values(obj);
    };
  
    lang.size = function(obj) {
      if (obj == null) return 0;
      return isArrayLike(obj) ? obj.length : lang.keys(obj).length;
    };
  
    lang.partition = function(obj, predicate, context) {
      predicate = cb(predicate, context);
      var pass = [],
        fail = [];
      lang.each(obj, function(value, key, obj) {
        (predicate(value, key, obj) ? pass : fail).push(value);
      });
      return [pass, fail];
    };
  
    // Array Functions
    // ---------------
  
    lang.first = function(array, n, guard) {
      if (array == null) return void 0;
      if (n == null || guard) return array[0];
      return lang.initial(array, array.length - n);
    };
  
    lang.initial = function(array, n, guard) {
      return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
    };
  
    lang.last = function(array, n, guard) {
      if (array == null) return void 0;
      if (n == null || guard) return array[array.length - 1];
      return lang.rest(array, Math.max(0, array.length - n));
    };
  
    lang.rest = function(array, n, guard) {
      return slice.call(array, n == null || guard ? 1 : n);
    };
  
    lang.compact = function(array) {
      return lang.filter(array, lang.identity);
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
  
    lang.without = function(array) {
      return lang.difference(array, slice.call(arguments, 1));
    };
  
    lang.uniq = function(array, isSorted, iteratee, context) {
      if (!lang.isBoolean(isSorted)) {
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
          if (!lang.contains(seen, computed)) {
            seen.push(computed);
            result.push(value);
          }
        } else if (!lang.contains(result, value)) {
          result.push(value);
        }
      }
      return result;
    };
  
    lang.union = function() {
      return lang.uniq(flatten(arguments, true, true));
    };
  
    lang.intersection = function(array) {
      var result = [];
      var argsLength = arguments.length;
      for (var i = 0, length = getLength(array); i < length; i++) {
        var item = array[i];
        if (lang.contains(result, item)) continue;
        for (var j = 1; j < argsLength; j++) {
          if (!lang.contains(arguments[j], item)) break;
        }
        if (j === argsLength) result.push(item);
      }
      return result;
    };
  
    lang.difference = function(array) {
      var rest = flatten(arguments, true, true, 1);
      return lang.filter(array, function(value) {
        return !lang.contains(rest, value);
      });
    };
  
    lang.object = function(list, values) {
      var result = {};
      for (var i = 0, length = getLength(list); i < length; i++) {
        if (values) {
          result[list[i]] = values[i];
        } else {
          result[list[i][0]] = list[i][1];
        }
      }
      return result;
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
  
    lang.findIndex = createPredicateIndexFinder(1);
    lang.findLastIndex = createPredicateIndexFinder(-1);
  
    lang.sortedIndex = function(array, obj, iteratee, context) {
      iteratee = cb(iteratee, context, 1);
      var value = iteratee(obj);
      var low = 0,
        high = getLength(array);
      while (low < high) {
        var mid = Math.floor((low + high) / 2);
        if (iteratee(array[mid]) < value) low = mid + 1;
        else high = mid;
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
          idx = predicateFind(slice.call(array, i, length), lang.isNaN);
          return idx >= 0 ? idx + i : -1;
        }
        for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
          if (array[idx] === item) return idx;
        }
        return -1;
      };
    }
  
    lang.indexOf = createIndexFinder(1, lang.findIndex, lang.sortedIndex);
    lang.lastIndexOf = createIndexFinder(-1, lang.findLastIndex);
  
    lang.range = function(start, stop, step) {
      if (stop == null) {
        stop = start || 0;
        start = 0;
      }
      step = step || 1;
  
      var length = Math.max(Math.ceil((stop - start) / step), 0);
      var range = Array(length);
  
      for (var idx = 0; idx < length; idx++, start += step) {
        range[idx] = start;
      }
  
      return range;
    };
  
    // Function (ahem) Functions
    // ------------------
  
    var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
      if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
      var self = baseCreate(sourceFunc.prototype);
      var result = sourceFunc.apply(self, args);
      if (lang.isObject(result)) return result;
      return self;
    };
  
    lang.bind = function(func, context) {
      if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
      if (!lang.isFunction(func)) throw new TypeError('Bind must be called on a function');
      var args = slice.call(arguments, 2);
      var bound = function() {
        return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
      };
      return bound;
    };
  
    lang.partial = function(func) {
      var boundArgs = slice.call(arguments, 1);
      var bound = function() {
        var position = 0,
          length = boundArgs.length;
        var args = Array(length);
        for (var i = 0; i < length; i++) {
          args[i] = boundArgs[i] === Mob ? arguments[position++] : boundArgs[i];
        }
        while (position < arguments.length) args.push(arguments[position++]);
        return executeBound(func, bound, this, this, args);
      };
      return bound;
    };
  
    lang.bindAll = function(obj) {
      var i, length = arguments.length,
        key;
      if (length <= 1) throw new Error('bindAll must be passed function names');
      for (i = 1; i < length; i++) {
        key = arguments[i];
        obj[key] = lang.bind(obj[key], obj);
      }
      return obj;
    };
  
    lang.memoize = function(func, hasher) {
      var memoize = function(key) {
        var cache = memoize.cache;
        var address = '' + (hasher ? hasher.apply(this, arguments) : key);
        if (!lang.has(cache, address)) cache[address] = func.apply(this, arguments);
        return cache[address];
      };
      memoize.cache = {};
      return memoize;
    };
  
    lang.delay = function(func, wait) {
      var args = slice.call(arguments, 2);
      return setTimeout(function() {
        return func.apply(null, args);
      }, wait);
    };
  
    lang.defer = lang.partial(lang.delay, Mob, 1);
  
    lang.throttle = function(func, wait, options) {
      var context, args, result;
      var timeout = null;
      var previous = 0;
      if (!options) options = {};
      var later = function() {
        previous = options.leading === false ? 0 : lang.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      };
      return function() {
        var now = lang.now();
        if (!previous && options.leading === false) previous = now;
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
          if (!timeout) context = args = null;
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    };
  
    lang.debounce = function(func, wait, immediate) {
      var timeout, args, context, timestamp, result;
  
      var later = function() {
        var last = lang.now() - timestamp;
  
        if (last < wait && last >= 0) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) {
            result = func.apply(context, args);
            if (!timeout) context = args = null;
          }
        }
      };
  
      return function() {
        context = this;
        args = arguments;
        timestamp = lang.now();
        var callNow = immediate && !timeout;
        if (!timeout) timeout = setTimeout(later, wait);
        if (callNow) {
          result = func.apply(context, args);
          context = args = null;
        }
  
        return result;
      };
    };
  
    lang.wrap = function(func, wrapper) {
      return lang.partial(wrapper, func);
    };
  
    lang.negate = function(predicate) {
      return function() {
        return !predicate.apply(this, arguments);
      };
    };
  
    lang.compose = function() {
      var args = arguments;
      var start = args.length - 1;
      return function() {
        var i = start;
        var result = args[start].apply(this, arguments);
        while (i--) result = args[i].call(this, result);
        return result;
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
  
    lang.once = lang.partial(lang.before, 2);
  
    // Object Functions
    // ----------------
  
    lang.keys = function(obj) {
      if (!lang.isObject(obj)) return [];
      if (nativeKeys) return nativeKeys(obj);
      var keys = [];
      for (var key in obj)
        if (lang.has(obj, key)) keys.push(key);
      return keys;
    };
  
    lang.allKeys = function(obj) {
      if (!lang.isObject(obj)) return [];
      var keys = [];
      for (var key in obj) keys.push(key);
      return keys;
    };
  
    lang.values = function(obj) {
      var keys = lang.keys(obj);
      var length = keys.length;
      var values = Array(length);
      for (var i = 0; i < length; i++) {
        values[i] = obj[keys[i]];
      }
      return values;
    };
  
    lang.mapObject = function(obj, iteratee, context) {
      iteratee = cb(iteratee, context);
      var keys = lang.keys(obj),
        length = keys.length,
        results = {},
        currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
    };
  
    lang.pairs = function(obj) {
      var keys = lang.keys(obj);
      var length = keys.length;
      var pairs = Array(length);
      for (var i = 0; i < length; i++) {
        pairs[i] = [keys[i], obj[keys[i]]];
      }
      return pairs;
    };
  
    lang.invert = function(obj) {
      var result = {};
      var keys = lang.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        result[obj[keys[i]]] = keys[i];
      }
      return result;
    };
  
    lang.functions = function(obj) {
      var names = [];
      for (var key in obj) {
        if (lang.isFunction(obj[key])) names.push(key);
      }
      return names.sort();
    };
  
    lang.extend = createAssigner(lang.allKeys);
  
    lang.assign = createAssigner(lang.keys);
  
    lang.findKey = function(obj, predicate, context) {
      predicate = cb(predicate, context);
      var keys = lang.keys(obj),
        key;
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (predicate(obj[key], key, obj)) return key;
      }
    };
  
    lang.pick = function(object, oiteratee, context) {
      var result = {},
        obj = object,
        iteratee, keys;
      if (obj == null) return result;
      if (lang.isFunction(oiteratee)) {
        keys = lang.allKeys(obj);
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
        if (iteratee(value, key, obj)) result[key] = value;
      }
      return result;
    };
  
    lang.omit = function(obj, iteratee, context) {
      if (lang.isFunction(iteratee)) {
        iteratee = lang.negate(iteratee);
      } else {
        var keys = lang.map(flatten(arguments, false, false, 1), String);
        iteratee = function(value, key) {
          return !lang.contains(keys, key);
        };
      }
      return lang.pick(obj, iteratee, context);
    };
  
    lang.defaults = createAssigner(lang.allKeys, true);
  
    lang.create = function(prototype, props) {
      var result = baseCreate(prototype);
      if (props) lang.assign(result, props);
      return result;
    };
  
    lang.clone = function(obj) {
      if (!lang.isObject(obj)) return obj;
      return lang.isArray(obj) ? obj.slice() : lang.extend({}, obj);
    };
  
    lang.tap = function(obj, interceptor) {
      interceptor(obj);
      return obj;
    };
  
    lang.isMatch = function(object, attrs) {
      var keys = lang.keys(attrs),
        length = keys.length;
      if (object == null) return !length;
      var obj = Object(object);
      for (var i = 0; i < length; i++) {
        var key = keys[i];
        if (attrs[key] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };
  
  
    var eq = function(a, b, aStack, bStack) {
      // Identical objects are equal. `0 === -0`, but they aren't identical.
      // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
      if (a === b) return a !== 0 || 1 / a === 1 / b;
      // A strict comparison is necessary because `null == undefined`.
      if (a == null || b == null) return a === b;
      // Compare `[[Class]]` names.
      var className = toString.call(a);
      if (className !== toString.call(b)) return false;
      switch (className) {
        // Strings, numbers, regular expressions, dates, and booleans are compared by value.
        case '[object RegExp]':
        // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
        case '[object String]':
          // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
          // equivalent to `new String("5")`.
          return '' + a === '' + b;
        case '[object Number]':
          // `NaN`s are equivalent, but non-reflexive.
          // Object(NaN) is equivalent to NaN
          if (+a !== +a) return +b !== +b;
          // An `egal` comparison is performed for other numeric values.
          return +a === 0 ? 1 / +a === 1 / b : +a === +b;
        case '[object Date]':
        case '[object Boolean]':
          // Coerce dates and booleans to numeric primitive values. Dates are compared by their
          // millisecond representations. Note that invalid dates with millisecond representations
          // of `NaN` are not equivalent.
          return +a === +b;
      }
  
      var areArrays = className === '[object Array]';
      if (!areArrays) {
        if (typeof a != 'object' || typeof b != 'object') return false;
  
        // Objects with different constructors are not equivalent, but `Object`s or `Array`s
        // from different frames are.
        var aCtor = a.constructor,
          bCtor = b.constructor;
        if (aCtor !== bCtor && !(lang.isFunction(aCtor) && aCtor instanceof aCtor &&
          lang.isFunction(bCtor) && bCtor instanceof bCtor) && ('constructor' in a && 'constructor' in b)) {
          return false;
        }
      }
      // Assume equality for cyclic structures. The algorithm for detecting cyclic
      // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
  
      // Initializing stack of traversed objects.
      // It's done here since we only need them for objects and arrays comparison.
      aStack = aStack || [];
      bStack = bStack || [];
      var length = aStack.length;
      while (length--) {
        // Linear search. Performance is inversely proportional to the number of
        // unique nested structures.
        if (aStack[length] === a) return bStack[length] === b;
      }
  
      // Add the first object to the stack of traversed objects.
      aStack.push(a);
      bStack.push(b);
  
      // Recursively compare objects and arrays.
      if (areArrays) {
        // Compare array lengths to determine if a deep comparison is necessary.
        length = a.length;
        if (length !== b.length) return false;
        // Deep compare the contents, ignoring non-numeric properties.
        while (length--) {
          if (!eq(a[length], b[length], aStack, bStack)) return false;
        }
      } else {
        // Deep compare objects.
        var keys = lang.keys(a),
          key;
        length = keys.length;
        // Ensure that both objects contain the same number of properties before comparing deep equality.
        if (lang.keys(b).length !== length) return false;
        while (length--) {
          // Deep compare each member
          key = keys[length];
          if (!(lang.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
        }
      }
      // Remove the first object from the stack of traversed objects.
      aStack.pop();
      bStack.pop();
      return true;
    };
  
    lang.isEqual = function(a, b) {
      return eq(a, b);
    };
  
    lang.isEmpty = function(obj) {
      if (obj == null) return true;
      if (isArrayLike(obj) && (lang.isArray(obj) || lang.isString(obj) || lang.isArguments(obj))) return obj.length === 0;
      return lang.keys(obj).length === 0;
    };
  
    lang.isElement = function(obj) {
      return !!(obj && obj.nodeType === 1);
    };
  
    lang.isArray = nativeIsArray || function(obj) {
        return toString.call(obj) === '[object Array]';
      };
  
    lang.isObject = function(obj) {
      var type = typeof obj;
      return type === 'function' || type === 'object' && !!obj;
    };
  
    lang.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
      lang['is' + name] = function(obj) {
        return toString.call(obj) === '[object ' + name + ']';
      };
    });
  
    if (!lang.isArguments(arguments)) {
      lang.isArguments = function(obj) {
        return lang.has(obj, 'callee');
      };
    }
  
    if (typeof /./ != 'function' && typeof Int8Array != 'object') {
      lang.isFunction = function(obj) {
        return typeof obj == 'function' || false;
      };
    }
  
    lang.isFinite = function(obj) {
      return isFinite(obj) && !isNaN(parseFloat(obj));
    };
  
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
  
    lang.has = function(obj, key) {
      return obj != null && hasOwnProperty.call(obj, key);
    };
  
    // Utility Functions
    // -----------------
  
    lang.identity = function(value) {
      return value;
    };
  
    lang.constant = function(value) {
      return function() {
        return value;
      };
    };
  
    lang.noop = function() {};
  
    lang.property = property;
  
    lang.propertyOf = function(obj) {
      return obj == null ? function() {} : function(key) {
        return obj[key];
      };
    };
  
    lang.matcher = function(attrs) {
      attrs = lang.assign({}, attrs);
      return function(obj) {
        return lang.isMatch(obj, attrs);
      };
    };
  
    lang.times = function(n, iteratee, context) {
      var accum = Array(Math.max(0, n));
      iteratee = optimizeCb(iteratee, context, 1);
      for (var i = 0; i < n; i++) accum[i] = iteratee(i);
      return accum;
    };
  
    lang.random = function(min, max) {
      if (max == null) {
        max = min;
        min = 0;
      }
      return min + Math.floor(Math.random() * (max - min + 1));
    };
  
    lang.now = Date.now || function() {
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
    var unescapeMap = lang.invert(escapeMap);
  
    var createEscaper = function(map) {
      var escaper = function(match) {
        return map[match];
      };
      // Regexes for identifying a key that needs to be escaped
      var source = '(?:' + lang.keys(map).join('|') + ')';
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

  define('mob/template', function(require, exports, module) {
  
    var lang = require('mob/lang');
  
    var Template = {};
    var templateHelpers = {
      insertComponent : function(componentName) {
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
  
    Template.settings = {
      evaluate: /<%([\s\S]+?)%>/g,
      interpolate: /<%=([\s\S]+?)%>/g,
      escape: /<%-([\s\S]+?)%>/g
    };
  
    Template.addHelpers = function(newHelpers) {
      lang.extend(templateHelpers, newHelpers);
    };
  
    var escapeChar = function(match) {
      return '\\' + escapes[match];
    };
  
    function template(text, settings, oldSettings) {
      if (!settings && oldSettings) settings = oldSettings;
      settings = lang.defaults({}, settings, Template.settings);
  
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
      if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';
  
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
  
  Mob.Template = require('mob/template');

  return Mob;

}));