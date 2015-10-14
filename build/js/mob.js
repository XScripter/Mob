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
  
    var isObject = lang.isObject = function(obj) {
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
  
    var isWindow = lang.isWindow = function(obj) {
      return obj != null && obj == obj.window;
    };
  
    lang.isPlainObject = function(obj) {
      return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
    };
  
    lang.isDocument = function(obj) {
      return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
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
  
    lang.camelize = function(str) {
      return str.replace(/-+(.)?/g, function(match, chr) {
        return chr ? chr.toUpperCase() : '';
      });
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

  if (Mob.isUndefined(Mob.$)) {
  
  
    (function() {
  
      // ====================== jqlite(core) ======================
  
      var undefined,
        key,
        $,
        jqlite = {},
        emptyArray = [],
        slice = emptyArray.slice,
        filter = emptyArray.filter,
        document = window.document;
  
      $ = function(selector, context) {
        return jqlite.init(selector, context);
      };
  
      $.uuid = 0;
      $.support = {};
      $.expr = {};
  
      var uniq = function(array) {
        return filter.call(array, function(item, idx) {
          return array.indexOf(item) == idx;
        })
      };
  
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
  
      $.isEmptyObject = function(obj) {
        var name;
        for (name in obj) {
          return false;
        }
        return true;
      };
  
      $.trim = function(str) {
        return str == null ? '' : String.prototype.trim.call(str);
      };
  
      $.map = function(elements, callback) {
        var value,
          values = [],
          i,
          key;
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
        var i,
          key;
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
  
      $.grep = function(elements, callback) {
        return filter.call(elements, callback);
      };
  
      if (window.JSON) {
        $.parseJSON = JSON.parse;
      }
  
      ///////////////////////////////////////////////////////////////////////////////////////
  
      var filters = $.expr[':'] = {
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
        },
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
        tempParent = document.createElement('div');
  
      function process(sel, fn) {
        sel = sel.replace(/=#\]/g, '="#"]');
        var filter,
          arg,
          match = filterRe.exec(sel);
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
  
      function visible(elem) {
        elem = $(elem);
        return !!(elem.width() || elem.height()) && elem.css('display') !== 'none';
      }
  
      var doMatches = function(element, selector) {
  
        if (!selector || !element || element.nodeType !== 1) {
          return false;
        }
  
        var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
            element.oMatchesSelector || element.matchesSelector,
          match,
          parent = element.parentNode,
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
  
      };
  
      var doQsa = function(element, selector) {
        var found,
          maybeID = selector[0] == '#',
          maybeClass = !maybeID && selector[0] == '.',
          nameOnly = maybeID || maybeClass ? selector.slice(1) : selector,
          isSimple = simpleSelectorRE.test(nameOnly);
  
        return (Mob.isDocument(element) && isSimple && maybeID) ?
          ((found = element.getElementById(nameOnly)) ? [found] : []) :
          (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
            slice.call(
              isSimple && !maybeID ?
                maybeClass ? element.getElementsByClassName(nameOnly) :
                  element.getElementsByTagName(selector) :
                element.querySelectorAll(selector)
            );
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
        return process(selector, function(sel, filter, arg) {
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
            Mob.error('error performing selector: %o', selector);
            throw e;
          } finally {
            if (taggedParent) {
              taggedParent.removeClass(classTag);
            }
          }
          return !filter ? nodes :
            jqlite.uniq($.map(nodes, function(n, i) {
              return filter.call(n, i, nodes, arg);
            }));
        });
      };
  
      jqlite.matches = function(node, selector) {
        return process(selector, function(sel, filter, arg) {
          return (!sel || doMatches(node, sel)) && (!filter || filter.call(node, null, arg) === node);
        });
      };
  
      jqlite.fragment = function(html, name, properties) {
        var dom,
          nodes,
          container;
  
        if (singleTagRE.test(html)) {
          dom = $(document.createElement(RegExp.$1));
        }
  
        if (!dom) {
          if (html.replace) {
            html = html.replace(tagExpanderRE, '<$1></$2>');
          }
          if (name === undefined) {
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
  
        if (Mob.isPlainObject(properties)) {
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
          } else if (context !== undefined) {
            return $(context).find(selector);
          } else {
            dom = jqlite.qsa(document, selector);
          }
        } else if (Mob.isFunction(selector)) {
          return $(document).ready(selector);
        } else if (jqlite.isJQ(selector)) {
          return selector;
        } else {
          if (Mob.isArray(selector)) {
            dom = compact(selector);
          } else if (Mob.isObject(selector)) {
            dom = [selector];
            selector = null;
          } else if (fragmentRE.test(selector)) {
            dom = jqlite.fragment(selector.trim(), RegExp.$1, context);
            selector = null;
          } else if (context !== undefined) {
            return $(context).find(selector);
          } else {
            dom = jqlite.qsa(document, selector);
          }
        }
        return jqlite.jQ(dom, selector);
      };
  
      ///////////////////////////////////////////////////////////////////////////////////////
  
      var elementDisplay = {},
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
        adjacencyOperators = ['after', 'prepend', 'before', 'append'],
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
        };
  
      function dasherize(str) {
        return str.replace(/::/g, '/')
          .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
          .replace(/([a-z\d])([A-Z])/g, '$1_$2')
          .replace(/_/g, '-')
          .toLowerCase();
      }
  
      function classRE(name) {
        return name in classCache ?
          classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'));
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
        return Mob.isFunction(arg) ? arg.call(context, idx, payload) : arg;
      }
  
      function setAttribute(node, name, value) {
        value == null ? node.removeAttribute(name) : node.setAttribute(name, value);
      }
  
      function className(node, value) {
        var klass = node.className || '',
          svg = klass && klass.baseVal !== undefined;
  
        if (value === undefined) {
          return svg ? klass.baseVal : klass;
        }
        svg ? (klass.baseVal = value) : (node.className = value);
      }
  
      function deserializeValue(value) {
        try {
          return value ?
          value == 'true' ||
          (value == 'false' ? false :
            value == 'null' ? null :
              +value + '' == value ? +value :
                /^[\[\{]/.test(value) ? $.parseJSON(value) :
                  value) : value;
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
  
      $.fn = {
  
        forEach: emptyArray.forEach,
        reduce: emptyArray.reduce,
        push: emptyArray.push,
        sort: emptyArray.sort,
        indexOf: emptyArray.indexOf,
        concat: emptyArray.concat,
  
        map: function(fn) {
          return $($.map(this, function(el, i) {
            return fn.call(el, i, el);
          }));
        },
        slice: function() {
          return $(slice.apply(this, arguments));
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
          return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length];
        },
  
        size: function() {
          return this.length;
        },
  
        remove: function() {
          return this.each(function() {
            if (this.parentNode != null) {
              this.parentNode.removeChild(this);
            }
          });
        },
  
        each: function(callback) {
          emptyArray.every.call(this, function(el, idx) {
            return callback.call(el, idx, el) !== false;
          });
          return this;
        },
  
        filter: function(selector) {
          if (Mob.isFunction(selector)) {
            return this.not(this.not(selector));
          }
          return $(filter.call(this, function(element) {
            return jqlite.matches(element, selector);
          }));
        },
  
        add: function(selector, context) {
          return $(uniq(this.concat($(selector, context))));
        },
  
        is: function(selector) {
          return this.length > 0 && jqlite.matches(this[0], selector);
        },
  
        not: function(selector) {
          var nodes = [];
          if (Mob.isFunction(selector) && selector.call !== undefined) {
            this.each(function(idx) {
              if (!selector.call(this, idx)) {
                nodes.push(this);
              }
            });
          } else {
            var excludes = typeof selector == 'string' ? this.filter(selector) :
              (likeArray(selector) && Mob.isFunction(selector.item)) ? slice.call(selector) : $(selector);
            this.forEach(function(el) {
              if (excludes.indexOf(el) < 0) {
                nodes.push(el);
              }
            });
          }
          return $(nodes);
        },
  
        has: function(selector) {
          return this.filter(function() {
            return Mob.isObject(selector) ? $.contains(this, selector) : $(this).find(selector).size();
          });
        },
  
        eq: function(idx) {
          return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1);
        },
  
        first: function() {
          var el = this[0];
          return el && !Mob.isObject(el) ? el : $(el);
        },
  
        last: function() {
          var el = this[this.length - 1];
          return el && !Mob.isObject(el) ? el : $(el);
        },
  
        find: function(selector) {
          var result,
            $this = this;
          if (!selector) {
            result = $();
          } else if (typeof selector == 'object') {
            result = $(selector).filter(function() {
              var node = this;
              return emptyArray.some.call($this, function(parent) {
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
            node = node !== context && !Mob.isDocument(node) && node.parentNode;
          }
          return $(node);
        },
  
        parents: function(selector) {
          var ancestors = [],
            nodes = this;
          while (nodes.length > 0) {
            nodes = $.map(nodes, function(node) {
              if ((node = node.parentNode) && !Mob.isDocument(node) && ancestors.indexOf(node) < 0) {
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
          return this.each(function() {
            this.innerHTML = '';
          });
        },
  
        // `pluck` is borrowed from Prototype.js
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
          var func = Mob.isFunction(structure);
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
        wrapInner: function(structure) {
          var func = Mob.isFunction(structure);
  
          return this.each(function(index) {
            var self = $(this),
              contents = self.contents(),
              dom = func ? structure.call(this, index) : structure;
            contents.length ? contents.wrapAll(dom) : self.append(dom);
          });
        },
  
        unwrap: function() {
          this.parent().each(function() {
            $(this).replaceWith($(this).children());
          });
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
            (setting === undefined ? el.css('display') == 'none' : setting) ? el.show(): el.hide();
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
            }) :
            (0 in this ? this[0].innerHTML : null);
        },
  
        text: function(text) {
          return 0 in arguments ?
            this.each(function(idx) {
              var newText = funcArg(this, text, idx, this.textContent);
              this.textContent = newText == null ? '' : '' + newText;
            }) :
            (0 in this ? this[0].textContent : null);
        },
  
        attr: function(name, value) {
          var result;
          return (typeof name == 'string' && !(1 in arguments)) ?
            (!this.length || this[0].nodeType !== 1 ? undefined :
                (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
            ) :
            this.each(function(idx) {
              if (this.nodeType !== 1) {
                return;
              }
              if (Mob.isObject(name)) {
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
            }) :
            (this[0] && this[0][name]);
        },
  
        val: function(value) {
          return 0 in arguments ?
            this.each(function(idx) {
              this.value = funcArg(this, value, idx, this.value);
            }) :
            (this[0] && (this[0].multiple ?
              $(this[0]).find('option').filter(function() {
                return this.selected;
              }).pluck('value') :
              this[0].value));
        },
  
        offset: function(coordinates) {
          if (coordinates) return this.each(function(index) {
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
            var computedStyle,
              element = this[0];
            if (!element) {
              return;
            }
            computedStyle = getComputedStyle(element, '');
            if (typeof property == 'string') {
              return element.style[Mob.camelize(property)] || computedStyle.getPropertyValue(property);
            } else if (Mob.isArray(property)) {
              var props = {};
              $.each(property, function(_, prop) {
                props[prop] = (element.style[Mob.camelize(prop)] || computedStyle.getPropertyValue(prop));
              });
              return props;
            }
          }
  
          var css = '';
          if (Mob.isString(property)) {
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
  
        index: function(element) {
          return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0]);
        },
  
        hasClass: function(name) {
          if (!name) {
            return false;
          }
          return emptyArray.some.call(this, function(el) {
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
            if (name === undefined) {
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
              (when === undefined ? !$this.hasClass(klass) : when) ?
                $this.addClass(klass): $this.removeClass(klass);
            });
          });
        },
  
        scrollTop: function(value) {
          if (!this.length) {
            return;
          }
          var hasScrollTop = 'scrollTop' in this[0];
          if (value === undefined) {
            return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset;
          }
          return this.each(hasScrollTop ?
            function() {
              this.scrollTop = value;
            } :
            function() {
              this.scrollTo(this.scrollX, value);
            });
        },
  
        scrollLeft: function(value) {
          if (!this.length) {
            return;
          }
          var hasScrollLeft = 'scrollLeft' in this[0];
          if (value === undefined) {
            return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset;
          }
  
          return this.each(hasScrollLeft ?
            function() {
              this.scrollLeft = value;
            } :
            function() {
              this.scrollTo(value, this.scrollY);
            });
        },
  
        position: function() {
          if (!this.length) {
            return;
          }
  
          var elem = this[0],
            offsetParent = this.offsetParent(),
            offset = this.offset(),
            parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? {
              top: 0,
              left: 0
            } : offsetParent.offset();
  
          offset.top -= parseFloat($(elem).css('margin-top')) || 0;
          offset.left -= parseFloat($(elem).css('margin-left')) || 0;
  
          // Add offsetParent borders
          parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0;
          parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0;
  
          // Subtract the two offsets
          return {
            top: offset.top - parentOffset.top,
            left: offset.left - parentOffset.left
          };
        },
  
        offsetParent: function() {
          return this.map(function() {
            var parent = this.offsetParent || document.body;
            while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css('position') == 'static') {
              parent = parent.offsetParent;
            }
            return parent;
          });
        }
      };
  
      $.fn.detach = $.fn.remove;
  
      ['width', 'height'].forEach(function(dimension) {
        var dimensionProperty =
          dimension.replace(/./, function(m) {
            return m[0].toUpperCase()
          });
  
        $.fn[dimension] = function(value) {
          var offset, el = this[0];
          if (value === undefined) {
            return Mob.isWindow(el) ? el['inner' + dimensionProperty] :
              Mob.isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
              (offset = this.offset()) && offset[dimension];
          } else {
            return this.each(function(idx) {
              el = $(this);
              el.css(dimension, funcArg(this, value, idx, el[dimension]()));
            });
          }
        };
      });
  
      adjacencyOperators.forEach(function(operator, operatorIndex) {
        var inside = operatorIndex % 2;
  
        $.fn[operator] = function() {
          var nodes = $.map(arguments, function(arg) {
              return Mob.isObject(arg) || Mob.isArray(arg) || arg == null ? arg : jqlite.fragment(arg);
            }),
            parent,
            copyByClone = this.length > 1;
  
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
  
      ///////////////////////////////////////////////////////////////////////////////////////
  
      var data = {},
        dataAttr = function(name, value) {
          var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase();
          var data = (1 in arguments) ? this.attr(attrName, value) : this.attr(attrName);
          return data !== null ? deserializeValue(data) : undefined;
        },
        exp = $.expando = 'JQLite' + (+new Date());
  
      function getData(node, name) {
        var id = node[exp],
          store = id && data[id];
        if (name === undefined) {
          return store || setData(node);
        } else {
          if (store) {
            if (name in store) {
              return store[name];
            }
            var camelName = Mob.camelize(name);
            if (camelName in store) {
              return store[camelName];
            }
          }
          return dataAttr.call($(node), name);
        }
      }
  
      function setData(node, name, value) {
        var id = node[exp] || (node[exp] = ++$.uuid),
          store = data[id] || (data[id] = attributeData(node));
        if (name !== undefined) {
          store[Mob.camelize(name)] = value;
        }
        return store;
      }
  
      function attributeData(node) {
        var store = {};
        $.each(node.attributes || emptyArray, function(i, attr) {
          if (attr.name.indexOf('data-') == 0) {
            store[Mob.camelize(attr.name.replace('data-', ''))] = $.jqlite.deserializeValue(attr.value);
          }
        });
        return store;
      }
  
      $.fn.data = function(name, value) {
        return value === undefined ?
          Mob.isPlainObject(name) ?
            this.each(function(i, node) {
              $.each(name, function(key, value) {
                setData(node, key, value);
              });
            }) :
            (0 in this ? getData(this[0], name) : undefined) :
          this.each(function() {
            setData(this, name, value);
          });
      };
  
      $.fn.removeData = function(names) {
        if (typeof names == 'string') {
          names = names.split(/\s+/);
        }
        return this.each(function() {
          var id = this[exp],
            store = id && data[id];
          if (store) {
            $.each(names || store, function(key) {
              delete store[names ? Mob.camelize(this) : key];
            });
          }
        });
      };
  
      ['remove', 'empty'].forEach(function(methodName) {
        var origFn = $.fn[methodName];
        $.fn[methodName] = function() {
          var elements = this.find('*');
          if (methodName === 'remove') {
            elements = elements.add(this);
          }
          elements.removeData();
          return origFn.call(this);
        };
      });
  
      ///////////////////////////////////////////////////////////////////////////////////////
  
      jqlite.jQ.prototype = $.fn;
  
      jqlite.uniq = uniq;
      jqlite.deserializeValue = deserializeValue;
  
      $.jqlite = jqlite;
  
      // ====================== jqlite(event) ======================
  
      var _jqid = 1,
        undefined,
        slice = Array.prototype.slice,
        handlers = {},
        specialEvents = {},
        focusinSupported = 'onfocusin' in window,
        focus = {
          focus: 'focusin',
          blur: 'focusout'
        },
        hover = {
          mouseenter: 'mouseover',
          mouseleave: 'mouseout'
        };
  
      specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents';
  
      function jqid(element) {
        return element._jqid || (element._jqid = _jqid++);
      }
  
      function findHandlers(element, event, fn, selector) {
        event = parse(event);
        if (event.ns) {
          var matcher = matcherFor(event.ns);
        }
        return (handlers[jqid(element)] || []).filter(function(handler) {
          return handler && (!event.e || handler.e == event.e) && (!event.ns || matcher.test(handler.ns)) && (!fn || jqid(handler.fn) === jqid(fn)) && (!selector || handler.sel == selector);
        });
      }
  
      function parse(event) {
        var parts = ('' + event).split('.');
        return {
          e: parts[0],
          ns: parts.slice(1).sort().join(' ')
        };
      }
  
      function matcherFor(ns) {
        return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)');
      }
  
      function eventCapture(handler, captureSetting) {
        return handler.del && (!focusinSupported && (handler.e in focus)) || !!captureSetting;
      }
  
      function realEvent(type) {
        return hover[type] || (focusinSupported && focus[type]) || type;
      }
  
      function add(element, events, fn, data, selector, delegator, capture) {
        var id = jqid(element),
          set = (handlers[id] || (handlers[id] = []));
  
        events.split(/\s/).forEach(function(event) {
          if (event == 'ready') {
            return $(document).ready(fn);
          }
          var handler = parse(event);
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
            e = compatible(e);
            if (e.isImmediatePropagationStopped()) {
              return;
            }
            e.data = data;
            var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args));
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
  
      function remove(element, events, fn, selector, capture) {
        var id = jqid(element);
        (events || '').split(/\s/).forEach(function(event) {
          findHandlers(element, event, fn, selector).forEach(function(handler) {
            delete handlers[id][handler.i];
            if ('removeEventListener' in element) {
              element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
            }
          });
        });
      }
  
      $.event = {
        add: add,
        remove: remove
      };
  
      $.proxy = function(fn, context) {
  
        var args = (2 in arguments) && slice.call(arguments, 2);
        if (Mob.isFunction(fn)) {
          var proxyFn = function() {
            return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments);
          };
          proxyFn._jqid = jqid(fn);
          return proxyFn;
        } else if (Mob.isString(context)) {
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
  
      $.fn.bind = function(event, data, callback) {
        return this.on(event, data, callback);
      };
      $.fn.unbind = function(event, callback) {
        return this.off(event, callback);
      };
      $.fn.one = function(event, selector, data, callback) {
        return this.on(event, selector, data, callback, 1);
      };
  
      var returnTrue = function() {
          return true
        },
        returnFalse = function() {
          return false
        },
        ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
        eventMethods = {
          preventDefault: 'isDefaultPrevented',
          stopImmediatePropagation: 'isImmediatePropagationStopped',
          stopPropagation: 'isPropagationStopped'
        };
  
      function compatible(event, source) {
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
  
          if (source.defaultPrevented !== undefined ? source.defaultPrevented :
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
          if (!ignoreProperties.test(key) && event[key] !== undefined) {
            proxy[key] = event[key];
          }
        }
  
        return compatible(proxy, event);
      }
  
      $.fn.on = function(event, selector, data, callback, one) {
        var autoRemove,
          delegator,
          $this = this;
        if (event && !Mob.isString(event)) {
          $.each(event, function(type, fn) {
            $this.on(type, selector, data, fn, one);
          });
          return $this;
        }
  
        if (!Mob.isString(selector) && !Mob.isFunction(callback) && callback !== false) {
          callback = data;
          data = selector;
          selector = undefined;
        }
        if (Mob.isFunction(data) || data === false) {
          callback = data;
          data = undefined;
        }
  
        if (callback === false) {
          callback = returnFalse;
        }
  
        return $this.each(function(_, element) {
          if (one) {
            autoRemove = function(e) {
              remove(element, e.type, callback);
              return callback.apply(this, arguments);
            };
          }
  
          if (selector) {
            delegator = function(e) {
              var evt,
                match = $(e.target).closest(selector, element).get(0);
              if (match && match !== element) {
                evt = Mob.extend(createProxy(e), {
                  currentTarget: match,
                  liveFired: element
                });
                return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)));
              }
            };
          }
  
          add(element, event, callback, data, selector, delegator || autoRemove);
        })
      };
  
      $.fn.off = function(event, selector, callback) {
        var $this = this;
        if (event && !Mob.isString(event)) {
          $.each(event, function(type, fn) {
            $this.off(type, selector, fn);
          });
          return $this;
        }
  
        if (!Mob.isString(selector) && !Mob.isFunction(callback) && callback !== false) {
          callback = selector;
          selector = undefined;
        }
  
        if (callback === false) {
          callback = returnFalse;
        }
  
        return $this.each(function() {
          remove(this, event, callback, selector);
        });
      };
  
      $.fn.trigger = function(event, args) {
        event = (Mob.isString(event) || Mob.isPlainObject(event)) ? $.Event(event) : compatible(event);
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
      };
  
      $.fn.triggerHandler = function(event, args) {
        var e,
          result;
        this.each(function(i, element) {
          e = createProxy(Mob.isString(event) ? $.Event(event) : event);
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
      };
  
      ('focusin focusout focus blur load resize scroll unload click dblclick ' +
      'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
      'change select keydown keypress keyup error').split(' ').forEach(function(event) {
          $.fn[event] = function(callback) {
            return (0 in arguments) ?
              this.bind(event, callback) :
              this.trigger(event);
          };
        });
  
      $.Event = function(type, props) {
        if (!Mob.isString(type)) {
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
        return compatible(event);
      };
  
      // ====================== jqlite(fx) ======================
  
      var prefix = '',
        eventPrefix,
        vendors = {
          Webkit: 'webkit',
          Moz: '',
          O: 'o'
        },
        document = window.document,
        testEl = document.createElement('div'),
        supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
        transform,
        transitionProperty,
        transitionDuration,
        transitionTiming,
        transitionDelay,
        animationName,
        animationDuration,
        animationTiming,
        animationDelay,
        cssReset = {};
  
      function dasherize(str) {
        return str.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase();
      }
  
      function normalizeEvent(name) {
        return eventPrefix ? eventPrefix + name : name.toLowerCase();
      }
  
      $.each(vendors, function(vendor, event) {
        if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
          prefix = '-' + vendor.toLowerCase() + '-';
          eventPrefix = event;
          return false;
        }
      });
  
      transform = prefix + 'transform';
      cssReset[transitionProperty = prefix + 'transition-property'] =
        cssReset[transitionDuration = prefix + 'transition-duration'] =
          cssReset[transitionDelay = prefix + 'transition-delay'] =
            cssReset[transitionTiming = prefix + 'transition-timing-function'] =
              cssReset[animationName = prefix + 'animation-name'] =
                cssReset[animationDuration = prefix + 'animation-duration'] =
                  cssReset[animationDelay = prefix + 'animation-delay'] =
                    cssReset[animationTiming = prefix + 'animation-timing-function'] = '';
  
      $.fx = {
        off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
        speeds: {
          _default: 400,
          fast: 200,
          slow: 600
        },
        cssPrefix: prefix,
        transitionEnd: normalizeEvent('TransitionEnd'),
        animationEnd: normalizeEvent('AnimationEnd')
      };
  
      $.fn.animate = function(properties, duration, ease, callback, delay) {
        if (Mob.isFunction(duration)) {
          callback = duration;
          ease = undefined;
          duration = undefined;
        }
        if (Mob.isFunction(ease)) {
          callback = ease;
          ease = undefined;
        }
        if (Mob.isPlainObject(duration)) {
          ease = duration.easing;
          callback = duration.complete;
          delay = duration.delay;
          duration = duration.duration;
        }
        if (duration) {
          duration = (typeof duration == 'number' ? duration : ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000;
        }
        if (delay) {
          delay = parseFloat(delay) / 1000;
        }
        return this.anim(properties, duration, ease, callback, delay);
      };
  
      $.fn.anim = function(properties, duration, ease, callback, delay) {
        var key, cssValues = {},
          cssProperties, transforms = '',
          that = this,
          wrappedCallback, endEvent = $.fx.transitionEnd,
          fired = false;
  
        if (duration === undefined) {
          duration = $.fx.speeds._default / 1000;
        }
        if (delay === undefined) {
          delay = 0;
        }
        if ($.fx.off) {
          duration = 0;
        }
  
        if (typeof properties == 'string') {
          cssValues[animationName] = properties;
          cssValues[animationDuration] = duration + 's';
          cssValues[animationDelay] = delay + 's';
          cssValues[animationTiming] = (ease || 'linear');
          endEvent = $.fx.animationEnd;
        } else {
          cssProperties = [];
          for (key in properties) {
            if (supportedTransforms.test(key)) {
              transforms += key + '(' + properties[key] + ') ';
            } else {
              cssValues[key] = properties[key];
              cssProperties.push(dasherize(key));
            }
          }
  
          if (transforms) {
            cssValues[transform] = transforms;
            cssProperties.push(transform);
          }
          if (duration > 0 && typeof properties === 'object') {
            cssValues[transitionProperty] = cssProperties.join(', ');
            cssValues[transitionDuration] = duration + 's';
            cssValues[transitionDelay] = delay + 's';
            cssValues[transitionTiming] = (ease || 'linear');
          }
        }
  
        wrappedCallback = function(event) {
          if (typeof event !== 'undefined') {
            if (event.target !== event.currentTarget) {
              return;
            }
            $(event.target).unbind(endEvent, wrappedCallback);
          } else {
            $(this).unbind(endEvent, wrappedCallback);
          }
  
          fired = true;
          $(this).css(cssReset);
          callback && callback.call(this);
        };
  
        if (duration > 0) {
          this.bind(endEvent, wrappedCallback);
          setTimeout(function() {
            if (fired) {
              return;
            }
            wrappedCallback.call(that);
          }, ((duration + delay) * 1000) + 25);
        }
  
        this.size() && this.get(0).clientLeft;
  
        this.css(cssValues);
  
        if (duration <= 0) {
          setTimeout(function() {
            that.each(function() {
              wrappedCallback.call(this);
            });
          }, 0);
        }
  
        return this;
      };
  
      testEl = null;
  
      Mob.$ = $;
  
    })();
  
  }

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