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
 * Released on: October 15, 2015
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
      FuncProto = Function.prototype;
  
    var push = ArrayProto.push,
      slice = ArrayProto.slice,
      toString = ObjProto.toString,
      hasOwnProperty = ObjProto.hasOwnProperty;
  
    var nativeIsArray = Array.isArray,
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
  
  // ================== collections ======================
  
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
  
  // Create a reducing function iterating left or right.
    function createReduce(dir) {
      // Optimized iterator function as using arguments.length
      // in the main function will deoptimize the, see #1991.
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
  
    lang.max = function(obj, iteratee, context) {
      var result = -Infinity,
        lastComputed = -Infinity,
        value, computed;
      if (iteratee == null && obj != null) {
        obj = isArrayLike(obj) ? obj : lang.values(obj);
        for (var i = 0, length = obj.length; i < length; i++) {
          value = obj[i];
          if (value > result) {
            result = value;
          }
        }
      } else {
        iteratee = cb(iteratee, context);
        lang.each(obj, function(value, index, list) {
          computed = iteratee(value, index, list);
          if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
            result = value;
            lastComputed = computed;
          }
        });
      }
      return result;
    };
  
    lang.min = function(obj, iteratee, context) {
      var result = Infinity,
        lastComputed = Infinity,
        value, computed;
      if (iteratee == null && obj != null) {
        obj = isArrayLike(obj) ? obj : lang.values(obj);
        for (var i = 0, length = obj.length; i < length; i++) {
          value = obj[i];
          if (value < result) {
            result = value;
          }
        }
      } else {
        iteratee = cb(iteratee, context);
        lang.each(obj, function(value, index, list) {
          computed = iteratee(value, index, list);
          if (computed < lastComputed || computed === Infinity && result === Infinity) {
            result = value;
            lastComputed = computed;
          }
        });
      }
      return result;
    };
  
  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
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
  
  // ================== arrays ======================
  
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
  
    lang.zip = function() {
      return lang.unzip(arguments);
    };
  
    lang.unzip = function(array) {
      var length = array && lang.max(array, getLength).length || 0;
      var result = Array(length);
  
      for (var index = 0; index < length; index++) {
        result[index] = lang.pluck(array, index);
      }
      return result;
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
  
    lang.inArray = function(elem, array, i) {
      return [].indexOf.call(array, elem, i);
    };
  
  // ================== objects ======================
  
    var hasEnumBug = !{
      toString: null
    }.propertyIsEnumerable('toString');
    var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'
    ];
  
    function collectNonEnumProps(obj, keys) {
      var nonEnumIdx = nonEnumerableProps.length;
      var constructor = obj.constructor;
      var proto = (lang.isFunction(constructor) && constructor.prototype) || ObjProto;
  
      // Constructor is a special case.
      var prop = 'constructor';
      if (lang.has(obj, prop) && !lang.contains(keys, prop)) keys.push(prop);
  
      while (nonEnumIdx--) {
        prop = nonEnumerableProps[nonEnumIdx];
        if (prop in obj && obj[prop] !== proto[prop] && !lang.contains(keys, prop)) {
          keys.push(prop);
        }
      }
    }
  
    lang.keys = function(obj) {
      if (!lang.isObject(obj)) return [];
      if (nativeKeys) return nativeKeys(obj);
      var keys = [];
      for (var key in obj)
        if (lang.has(obj, key)) keys.push(key);
      // Ahem, IE < 9.
      if (hasEnumBug) collectNonEnumProps(obj, keys);
      return keys;
    };
  
    lang.allKeys = function(obj) {
      if (!lang.isObject(obj)) return [];
      var keys = [];
      for (var key in obj) keys.push(key);
      // Ahem, IE < 9.
      if (hasEnumBug) collectNonEnumProps(obj, keys);
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
  
  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
    lang.extendOwn = lang.assign = createAssigner(lang.keys);
  
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
      if (props) lang.extendOwn(result, props);
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
  
  
  // Internal recursive comparison function for `isEqual`.
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
  
  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
    lang.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
      lang['is' + name] = function(obj) {
        return toString.call(obj) === '[object ' + name + ']';
      };
    });
  
  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
    (function() {
      if (!lang.isArguments(arguments)) {
        lang.isArguments = function(obj) {
          return lang.has(obj, 'callee');
        };
      }
    })();
  
  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
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
  
    lang.isWindow = function(obj) {
      return obj != null && obj == obj.window;
    };
  
    lang.isPlainObject = function(obj) {
      return lang.isObject(obj) && !lang.isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
    };
  
    lang.isDocument = function(obj) {
      return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
    };
  
    lang.has = function(obj, key) {
      return obj != null && hasOwnProperty.call(obj, key);
    };
  
  // Helper function to correctly set up the prototype chain for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
    lang.inherits = function(protoProps, staticProps) {
      var parent = this;
      var child;
  
      // The constructor function for the new subclass is either defined by you
      // (the "constructor" property in your `extend` definition), or defaulted
      // by us to simply call the parent constructor.
      if (protoProps && lang.has(protoProps, 'constructor')) {
        child = protoProps.constructor;
      } else {
        child = function() {
          return parent.apply(this, arguments);
        };
      }
  
      // Add static properties to the constructor function, if supplied.
      lang.extend(child, parent, staticProps);
  
      // Set the prototype chain to inherit from `parent`, without calling
      // `parent` constructor function.
      var Surrogate = function() {
        this.constructor = child;
      };
      Surrogate.prototype = parent.prototype;
      child.prototype = new Surrogate;
  
      // Add prototype properties (instance properties) to the subclass,
      // if supplied.
      if (protoProps) lang.extend(child.prototype, protoProps);
  
      // Set a convenience property in case the parent's prototype is needed
      // later.
      child.__super__ = parent.prototype;
  
      return child;
    };
  
    lang.inArray = function(elem, array, i) {
      return [].indexOf.call(array, elem, i);
    };
  
  // ================== functions ======================
  
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
          args[i] = boundArgs[i] === lang ? arguments[position++] : boundArgs[i];
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
  
    lang.defer = lang.partial(lang.delay, lang, 1);
  
  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
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
  
  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
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
  
  // ================== utility ======================
  
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
  
    lang.matcher = lang.matches = function(attrs) {
      attrs = lang.extendOwn({}, attrs);
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
  
  // List of HTML entities for escaping.
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
  
  // ================== dom ======================
  
    var _requestAnimationFrame = (function() {
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
      return _requestAnimationFrame(cb);
    };
  
    lang.cancelAnimationFrame = function(requestId) {
      cancelAnimationFrame(requestId);
    };
  
    lang.animationFrameThrottle = function(cb) {
      var args, isQueued, context;
      return function() {
        args = arguments;
        context = this;
        if (!isQueued) {
          isQueued = true;
          lang.requestAnimationFrame(function() {
            cb.apply(context, args);
            isQueued = false;
          });
        }
      };
    };
  
    lang.adjustTitle = function(title) {
      lang.requestAnimationFrame(function() {
        document.title = title;
      });
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

  define('mob/jqlite', function(require, exports, module) {
  
    var lang = require('mob/lang');
  
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
  
      return (lang.isDocument(element) && isSimple && maybeID) ?
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
          lang.error('error performing selector: %o', selector);
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
        } else if (context !== undefined) {
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
      return lang.isFunction(arg) ? arg.call(context, idx, payload) : arg;
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
  
      is: function(selector) {
        return this.length > 0 && jqlite.matches(this[0], selector);
      },
  
      not: function(selector) {
        var nodes = [];
        if (lang.isFunction(selector) && selector.call !== undefined) {
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
  
      has: function(selector) {
        return this.filter(function() {
          return lang.isObject(selector) ? $.contains(this, selector) : $(this).find(selector).size();
        });
      },
  
      eq: function(idx) {
        return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1);
      },
  
      first: function() {
        var el = this[0];
        return el && !lang.isObject(el) ? el : $(el);
      },
  
      last: function() {
        var el = this[this.length - 1];
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
      wrapInner: function(structure) {
        var func = lang.isFunction(structure);
  
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
            return element.style[lang.camelize(property)] || computedStyle.getPropertyValue(property);
          } else if (lang.isArray(property)) {
            var props = {};
            $.each(property, function(_, prop) {
              props[prop] = (element.style[lang.camelize(prop)] || computedStyle.getPropertyValue(prop));
            });
            return props;
          }
        }
  
        var css = '';
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
  
    adjacencyOperators.forEach(function(operator, operatorIndex) {
      var inside = operatorIndex % 2;
  
      $.fn[operator] = function() {
        var nodes = $.map(arguments, function(arg) {
            return lang.isObject(arg) || lang.isArray(arg) || arg == null ? arg : jqlite.fragment(arg);
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
          var camelName = lang.camelize(name);
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
        store[lang.camelize(name)] = value;
      }
      return store;
    }
  
    function attributeData(node) {
      var store = {};
      $.each(node.attributes || emptyArray, function(i, attr) {
        if (attr.name.indexOf('data-') == 0) {
          store[lang.camelize(attr.name.replace('data-', ''))] = $.jqlite.deserializeValue(attr.value);
        }
      });
      return store;
    }
  
    $.fn.data = function(name, value) {
      return value === undefined ?
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
            delete store[names ? lang.camelize(this) : key];
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
      if (lang.isFunction(fn)) {
        var proxyFn = function() {
          return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments);
        };
        proxyFn._jqid = jqid(fn);
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
            remove(element, e.type, callback);
            return callback.apply(this, arguments);
          };
        }
  
        if (selector) {
          delegator = function(e) {
            var evt,
              match = $(e.target).closest(selector, element).get(0);
            if (match && match !== element) {
              evt = lang.extend(createProxy(e), {
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
        remove(this, event, callback, selector);
      });
    };
  
    $.fn.trigger = function(event, args) {
      event = (lang.isString(event) || lang.isPlainObject(event)) ? $.Event(event) : compatible(event);
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
      if (lang.isFunction(duration)) {
        callback = duration;
        ease = undefined;
        duration = undefined;
      }
      if (lang.isFunction(ease)) {
        callback = ease;
        ease = undefined;
      }
      if (lang.isPlainObject(duration)) {
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
  
    module.exports = $;
  
  });

  define('mob/base', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var $ = require('mob/jqlite');
  
    function baseBindFromStrings(target, entity, evt, methods) {
      var methodNames = methods.split(/\s+/);
  
      lang.each(methodNames, function(methodName) {
  
        var method = target[methodName];
        if (!method) {
          throw new Error('Method "' + methodName + '" was configured as an event handler, but does not exist.');
        }
  
        target.listenTo(entity, evt, method);
      });
    }
  
    function baseBindToFunction(target, entity, evt, method) {
      target.listenTo(entity, evt, method);
    }
  
    function baseUnbindFromStrings(target, entity, evt, methods) {
      var methodNames = methods.split(/\s+/);
  
      lang.each(methodNames, function(methodName) {
        var method = target[methodName];
        target.stopListening(entity, evt, method);
      });
    }
  
    function baseUnbindToFunction(target, entity, evt, method) {
      target.stopListening(entity, evt, method);
    }
  
    function baseIterateEvents(target, entity, bindings, functionCallback, stringCallback) {
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
  
    exports.isNodeAttached = function(el) {
      return $.contains(document.documentElement, el);
    };
  
    var _triggerMethod = exports._triggerMethod = (function() {
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
  
        var methodName = 'on' + event.replace(splitter, getEventName);
        var method = context[methodName];
        var result;
  
        if (lang.isFunction(method)) {
          result = method.apply(context, noEventArg ? lang.rest(args) : args);
        }
  
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
  
    exports.triggerMethodOn = function(context) {
      var fnc = lang.isFunction(context.triggerMethod) ? context.triggerMethod : triggerMethod;
  
      return fnc.apply(context, lang.rest(arguments));
    };
  
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
      if (target.options && (target.options[optionName] !== undefined)) {
        return target.options[optionName];
      } else {
        return target[optionName];
      }
    };
  
    exports.proxyGetOption = function(optionName) {
      return getOption(this, optionName);
    };
  
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
      baseIterateEvents(target, entity, bindings, baseBindToFunction, baseBindFromStrings);
    };
  
    var unbindEntityEvents = exports.unbindEntityEvents = function(target, entity, bindings) {
      baseIterateEvents(target, entity, bindings, baseUnbindToFunction, baseUnbindFromStrings);
    };
  
    exports.proxyBindEntityEvents = function(entity, bindings) {
      return bindEntityEvents(this, entity, bindings);
    };
  
    exports.proxyUnbindEntityEvents = function(entity, bindings) {
      return unbindEntityEvents(this, entity, bindings);
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
    var $ = require('mob/jqlite');
  
    var HTTP = {};
  
    var document = window.document,
      key,
      name,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/,
      originAnchor = document.createElement('a');
  
    originAnchor.href = window.location.href;
  
    // trigger a custom event and return false if it was cancelled
    function triggerAndReturn(context, eventName, data) {
      var event = $.Event(eventName);
      $(context).trigger(event, data);
      return !event.isDefaultPrevented();
    }
  
    // trigger an Ajax 'global' event
    function triggerGlobal(settings, context, eventName, data) {
      if (settings.global) {
        return triggerAndReturn(context || document, eventName, data);
      }
    }
  
    // Number of active Ajax requests
    HTTP.active = 0;
  
    function ajaxStart(settings) {
      if (settings.global && HTTP.active++ === 0) {
        triggerGlobal(settings, null, 'ajaxStart');
      }
    }
  
    function ajaxStop(settings) {
      if (settings.global && !(--HTTP.active)) {
        triggerGlobal(settings, null, 'ajaxStop');
      }
    }
  
    // triggers an extra global event 'ajaxBeforeSend' that's like 'ajaxSend' but cancelable
    function ajaxBeforeSend(xhr, settings) {
      var context = settings.context;
  
      if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false) {
        return false;
      }
  
      triggerGlobal(settings, context, 'ajaxSend', [xhr, settings]);
    }
  
    function ajaxSuccess(data, xhr, settings) {
      var context = settings.context,
        status = 'success';
      settings.success.call(context, data, status, xhr);
      triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data]);
      ajaxComplete(status, xhr, settings);
    }
  
    // type: 'timeout', 'error', 'abort', 'parsererror'
    function ajaxError(error, type, xhr, settings) {
      var context = settings.context;
      settings.error.call(context, xhr, type, error);
      triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type]);
      ajaxComplete(type, xhr, settings);
    }
  
    // status: 'success', 'notmodified', 'error', 'timeout', 'abort', 'parsererror'
    function ajaxComplete(status, xhr, settings) {
      var context = settings.context;
      settings.complete.call(context, xhr, status);
      triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings]);
      ajaxStop(settings);
    }
  
    function mimeToDataType(mime) {
      if (mime) {
        mime = mime.split(';', 2)[0];
      }
      return mime && (mime == htmlType ? 'html' :
          mime == jsonType ? 'json' :
            scriptTypeRE.test(mime) ? 'script' :
            xmlTypeRE.test(mime) && 'xml') || 'text';
    }
  
    function appendQuery(url, query) {
      if (query == '') {
        return url;
      }
      return (url + '&' + query).replace(/[&?]{1,2}/, '?');
    }
  
    // serialize payload and append it to the URL for GET requests
    function serializeData(options) {
      if (options.processData && options.data && !lang.isString(options.data)) {
        options.data = param(options.data, options.traditional);
      }
      if (options.data && (!options.type || options.type.toUpperCase() == 'GET')) {
        options.url = appendQuery(options.url, options.data);
        options.data = undefined;
      }
    }
  
    var escape = encodeURIComponent;
  
    function serialize(params, obj, traditional, scope) {
      var array = lang.isArray(obj),
        hash = lang.isPlainObject(obj);
  
      lang.each(obj, function(value, key) {
  
        if (scope) {
          key = traditional ? scope : scope + '[' + (hash || lang.isObject(value) || lang.isArray(value) ? key : '') + ']';
        }
        // handle data in serializeArray() format
        if (!scope && array) {
          params.add(value.name, value.value);
        } else if (lang.isArray(value) || (!traditional && lang.isObject(value))) {
          serialize(params, value, traditional, key);
        } else {
          params.add(key, value);
        }
      });
    }
  
    var param = function(obj, traditional) {
      var params = [];
      params.add = function(key, value) {
        if (lang.isFunction(value)) {
          value = value();
        }
        if (value == null) {
          value = '';
        }
        this.push(escape(key) + '=' + escape(value));
      };
      serialize(params, obj, traditional);
      return params.join('&').replace(/%20/g, '+');
    };
  
    HTTP.ajaxSettings = {
      // Default type of request
      type: 'GET',
      // Callback that is executed before request
      beforeSend: lang.noop,
      // Callback that is executed if the request succeeds
      success: lang.noop,
      // Callback that is executed the the server drops error
      error: lang.noop,
      // Callback that is executed on request complete (both: error and success)
      complete: lang.noop,
      // The context for the callbacks
      context: null,
      // Whether to trigger 'global' Ajax events
      global: true,
      // Transport
      xhr: function() {
        return new window.XMLHttpRequest()
      },
      // MIME types mapping
      // IIS returns Javascript as 'application/x-javascript'
      accepts: {
        script: 'text/javascript, application/javascript, application/x-javascript',
        json: jsonType,
        xml: 'application/xml, text/xml',
        html: htmlType,
        text: 'text/plain'
      },
      // Whether the request is to another domain
      crossDomain: false,
      // Default timeout
      timeout: 0,
      // Whether data should be serialized to string
      processData: true,
      // Whether the browser should be allowed to cache GET responses
      cache: true
    };
  
    HTTP.ajax = function(options) {
      var settings = lang.extend({}, options || {}),
        urlAnchor;
      for (key in HTTP.ajaxSettings) {
        if (settings[key] === undefined) {
          settings[key] = HTTP.ajaxSettings[key];
        }
      }
  
      ajaxStart(settings);
  
      if (!settings.crossDomain) {
        urlAnchor = document.createElement('a');
        urlAnchor.href = settings.url;
        urlAnchor.href = urlAnchor.href;
        settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host);
      }
  
      if (!settings.url) {
        settings.url = window.location.toString();
      }
  
      serializeData(settings);
  
      var dataType = settings.dataType;
  
      if (settings.cache === false || (
          (!options || options.cache !== true) &&
          ('script' == dataType || 'jsonp' == dataType)
        )) {
        settings.url = appendQuery(settings.url, '_=' + Date.now());
      }
  
      var mime = settings.accepts[dataType],
        headers = {},
        setHeader = function(name, value) {
          headers[name.toLowerCase()] = [name, value];
        },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(),
        nativeSetHeader = xhr.setRequestHeader,
        abortTimeout;
  
      if (!settings.crossDomain) {
        setHeader('X-Requested-With', 'XMLHttpRequest');
      }
      setHeader('Accept', mime || '*/*');
      if (mime = settings.mimeType || mime) {
        if (mime.indexOf(',') > -1) {
          mime = mime.split(',', 2)[0];
        }
        xhr.overrideMimeType && xhr.overrideMimeType(mime);
      }
      if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET')) {
        setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded');
      }
  
      if (settings.headers) {
        for (name in settings.headers) {
          setHeader(name, settings.headers[name]);
        }
      }
      xhr.setRequestHeader = setHeader;
  
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          xhr.onreadystatechange = lang.noop;
          clearTimeout(abortTimeout);
          var result, error = false;
          if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
            dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'));
            result = xhr.responseText;
  
            try {
              // http://perfectionkills.com/global-eval-what-are-the-options/
              if (dataType == 'script') {
                (1, eval)(result);
              } else if (dataType == 'xml') {
                result = xhr.responseXML;
              } else if (dataType == 'json') {
                result = blankRE.test(result) ? null : JSON.parse(result);
              }
            } catch (e) {
              error = e;
            }
  
            if (error) {
              ajaxError(error, 'parsererror', xhr, settings);
            } else {
              ajaxSuccess(result, xhr, settings);
            }
          } else {
            ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings);
          }
        }
      };
  
      if (ajaxBeforeSend(xhr, settings) === false) {
        xhr.abort();
        ajaxError(null, 'abort', xhr, settings);
        return xhr;
      }
  
      if (settings.xhrFields) {
        for (name in settings.xhrFields) {
          xhr[name] = settings.xhrFields[name];
        }
      }
  
      var async = 'async' in settings ? settings.async : true;
      xhr.open(settings.type, settings.url, async, settings.username, settings.password);
  
      for (name in headers) {
        nativeSetHeader.apply(xhr, headers[name]);
      }
  
      if (settings.timeout > 0) {
        abortTimeout = setTimeout(function() {
          xhr.onreadystatechange = lang.noop;
          xhr.abort();
          ajaxError(null, 'timeout', xhr, settings);
        }, settings.timeout);
      }
  
      xhr.send(settings.data ? settings.data : null);
      return xhr;
    };
  
    function parseArguments(url, data, success, dataType) {
      if (lang.isFunction(data)) {
        dataType = success;
        success = data;
        data = undefined;
      }
      if (!lang.isFunction(success)) {
        dataType = success;
        success = undefined;
      }
      return {
        url: url,
        data: data,
        success: success,
        dataType: dataType
      };
    }
  
    HTTP.get = function( /* url, data, success, dataType */ ) {
      return HTTP.ajax(parseArguments.apply(null, arguments));
    };
  
    HTTP.post = function( /* url, data, success, dataType */ ) {
      var options = parseArguments.apply(null, arguments);
      options.type = 'POST';
      return HTTP.ajax(options);
    };
  
    module.exports = HTTP;
  
  });

  define('mob/storage', function(require, exports, module) {
  
    var lang = require('mob/lang');
  
    var Storage = function(options) {
  
      var store = this;
      this.options = options || {};
      this.name = this.options.name || 'store';
  
      if (lang.isArray(this.options.type)) {
        lang.each(this.options.type, function(type, i) {
          if (Storage.isAvailable(type)) {
            store.type = type;
            return false;
          }
        });
      } else {
        this.type = this.options.type || 'memory';
      }
      this.meta_key = this.options.meta_key || '__keys__';
      this.storage = new Storage[Storage.stores[this.type]](this.name, this.options);
    };
  
    Storage.stores = {
      'memory': 'Memory',
      'data': 'Data',
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
        var string_value = (typeof value == 'string') ? value : JSON.stringify(value);
        key = key.toString();
        this.storage.set(key, string_value);
        if (key != this.meta_key) {
          this._addKey(key)
        }
        // always return the original value
        return value;
      },
  
      get: function(key) {
        var value = this.storage.get(key);
        if (typeof value == 'undefined' || value == null || value == '') {
          return value;
        }
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
  
      filter: function(callback) {
        var found = [];
        this.each(function(key, value) {
          if (callback(key, value)) {
            found.push([key, value]);
          }
          return true;
        });
        return found;
      },
  
      first: function(callback) {
        var found = false;
        this.each(function(key, value) {
          if (callback(key, value)) {
            found = [key, value];
            return false;
          }
        });
        return found;
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
        if (lang.inArray(key, keys) == -1) {
          keys.push(key);
        }
        this.set(this.meta_key, keys);
      },
      _removeKey: function(key) {
        var keys = this.keys();
        var index = lang.inArray(key, keys);
        if (index != -1) {
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
  
    // ==================== Cookie ====================
  
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
        this._setCookie(key, "", -1);
      },
      _key: function(key) {
        return ['store', this.name, key].join('.');
      },
      _getCookie: function(key) {
        var escaped = this._key(key).replace(/(\.|\*|\(|\)|\[|\])/g, '\\$1');
        var match = document.cookie.match("(^|;\\s)" + escaped + "=([^;]*)(;|$)");
        return (match ? match[2] : null);
      },
      _setCookie: function(key, value, expires) {
        if (!expires) {
          expires = (this.expires_in * 1000)
        }
        var date = new Date();
        date.setTime(date.getTime() + expires);
        var set_cookie = [
          this._key(key), "=", value,
          "; expires=", date.toGMTString(),
          "; path=", this.path
        ].join('');
        document.cookie = set_cookie;
      }
    });
  
    // ==================== Local ====================
  
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
  
    // ==================== Memory ====================
  
    Storage.Memory = function(name) {
      this.name = name;
      this.namespace = this.name;
      Storage.Memory.store = Storage.Memory.store || {};
      Storage.Memory.store[this.namespace] = Storage.Memory.store[this.namespace] || {};
      this.store = Storage.Memory.store[this.namespace];
    };
  
    lang.extend(Storage.Memory.prototype, {
      isAvailable: function() {
        return true;
      },
      exists: function(key) {
        return (typeof this.store[key] != 'undefined');
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
  
    // ==================== Session ====================
  
    Storage.SessionStorage = function(name) {
      this.name = name;
    };
  
    lang.extend(Storage.SessionStorage.prototype, {
      isAvailable: function() {
        return ('sessionStorage' in window) &&
          (window.location.protocol != 'file:') &&
          (lang.isFunction(window.sessionStorage.setItem));
      },
      exists: function(key) {
        return (this.get(key) != null);
      },
      set: function(key, value) {
        return window.sessionStorage.setItem(this._key(key), value);
      },
      get: function(key) {
        var value = window.sessionStorage.getItem(this._key(key));
        if (value && typeof value.value != 'undefined') {
          value = value.value
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
  
    var Support = {
  
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
  
      animationEvents: (typeof window.WebKitAnimationEvent !== 'undefined')
  
    };
  
    module.exports = Support;
  
  });

  define('mob/view', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var $ = require('mob/jqlite');
    var Events = require('mob/events');
    var base = require('mob/base');
  
    var delegateEventSplitter = /^(\S+)\s*(.*)$/;
  
    var viewOptions = ['data', 'options', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];
  
    var View = function(options) {
      this.cid = lang.uniqueId('view');
      lang.extend(this, lang.pick(options, viewOptions));
      this._ensureElement();
      this.initialize.apply(this, arguments);
    };
  
    lang.extend(View.prototype, Events, {
  
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
  
      initialize: function(){},
  
      render: function() {
        return this;
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
      }
  
    });
  
    View.extend = lang.inherits;
  
    module.exports = View;
  
  });

  define('mob/platform', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var $ = require('mob/jqlite');
  
    var $body = $('body');
  
    var IOS = 'ios';
    var ANDROID = 'android';
    var WINDOWS_PHONE = 'windowsphone';
    var requestAnimationFrame = lang.requestAnimationFrame;
  
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
          // the platform isn't ready yet, add it to this array
          // which will be called once the platform is ready
          readyCallbacks.push(cb);
        }
      },
  
      detect: function() {
        Platform._checkPlatforms();
  
        requestAnimationFrame(function() {
          // only add to the body class if we got platform info
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
        if (Platform.isIPad()) Platform.platforms.push('ipad');
  
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
        if (platformName === null) Platform.setPlatform(Platform.device().platform);
        return platformName;
      },
  
      setPlatform: function(n) {
        if (typeof n != 'undefined' && n !== null && n.length) {
          platformName = n.toLowerCase();
        } else if (lang.getParameterByName('ionicplatform')) {
          platformName = lang.getParameterByName('ionicplatform');
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
        // singleton to get the platform version
        if (platformVersion === null) Platform.setVersion(Platform.device().version);
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
  
    var platformName = null, // just the name, like iOS or Android
      platformVersion = null, // a float of the major and minor, like 7.1
      readyCallbacks = [],
      windowLoadListenderAttached;
  
    // setup listeners to know when the device is ready to go
    function onWindowLoad() {
      if (Platform.isWebView()) {
        // the window and scripts are fully loaded, and a cordova/phonegap
        // object exists then let's listen for the deviceready
        document.addEventListener('deviceready', onPlatformReady, false);
      } else {
        // the window and scripts are fully loaded, but the window object doesn't have the
        // cordova/phonegap object, so its just a browser, not a webview wrapped w/ cordova
        onPlatformReady();
      }
      if (windowLoadListenderAttached) {
        window.removeEventListener('load', onWindowLoad, false);
      }
    }
  
    Platform.initialize = function() {
      if (document.readyState === 'complete') {
        onWindowLoad();
      } else {
        windowLoadListenderAttached = true;
        window.addEventListener('load', onWindowLoad, false);
      }
    };
  
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
  
    module.exports = Platform;
  
  });

  define('mob/touch', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var $ = require('mob/jqlite');
  
    function TouchClick(layer, options) {
      var oldOnClick;
  
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
  
      if (TouchClick.notNeeded(layer)) {
        return;
      }
  
      // Some old versions of Android don't have Function.prototype.bind
      function bind(method, context) {
        return function() { return method.apply(context, arguments); };
      }
  
  
      var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
      var context = this;
      for (var i = 0, l = methods.length; i < l; i++) {
        context[methods[i]] = bind(context[methods[i]], context);
      }
  
      // Set up event handlers as required
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
  
      // Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
      // which is how TouchClick normally stops click events bubbling to callbacks registered on the TouchClick
      // layer when they are cancelled.
      if (!Event.prototype.stopImmediatePropagation) {
        layer.removeEventListener = function(type, callback, capture) {
          var rmv = Node.prototype.removeEventListener;
          if (type === 'click') {
            rmv.call(layer, type, callback.hijacked || callback, capture);
          } else {
            rmv.call(layer, type, callback, capture);
          }
        };
  
        layer.addEventListener = function(type, callback, capture) {
          var adv = Node.prototype.addEventListener;
          if (type === 'click') {
            adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
                if (!event.propagationStopped) {
                  callback(event);
                }
              }), capture);
          } else {
            adv.call(layer, type, callback, capture);
          }
        };
      }
  
      // If a handler is already declared in the element's onclick attribute, it will be fired before
      // TouchClick's onClick handler. Fix this by pulling out the user-defined handler function and
      // adding it as listener.
      if (typeof layer.onclick === 'function') {
  
        // Android browser on at least 3.2 requires a new reference to the function in layer.onclick
        // - the old one won't work if passed to addEventListener directly.
        oldOnClick = layer.onclick;
        layer.addEventListener('click', function(event) {
          oldOnClick(event);
        }, false);
        layer.onclick = null;
      }
    }
  
    /**
     * Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
     *
     * @type boolean
     */
    var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;
  
    /**
     * Android requires exceptions.
     *
     * @type boolean
     */
    var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;
  
  
    /**
     * iOS requires exceptions.
     *
     * @type boolean
     */
    var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;
  
  
    /**
     * iOS 4 requires an exception for select elements.
     *
     * @type boolean
     */
    var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);
  
  
    /**
     * iOS 6.0-7.* requires the target element to be manually derived
     *
     * @type boolean
     */
    var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);
  
    /**
     * BlackBerry requires exceptions.
     *
     * @type boolean
     */
    var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;
  
    /**
     * Determine whether a given element requires a native click.
     *
     * @param {EventTarget|Element} target Target DOM element
     * @returns {boolean} Returns true if the element needs a native click
     */
    TouchClick.prototype.needsClick = function(target) {
      switch (target.nodeName.toLowerCase()) {
  
        // Don't send a synthetic click to disabled inputs (issue #62)
        case 'button':
        case 'select':
        case 'textarea':
          if (target.disabled) {
            return true;
          }
  
          break;
        case 'input':
  
          // File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
          if ((deviceIsIOS && target.type === 'file') || target.disabled) {
            return true;
          }
  
          break;
        case 'label':
        case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
        case 'video':
          return true;
      }
  
      return (/\bneedsclick\b/).test(target.className);
    };
  
  
    /**
     * Determine whether a given element requires a call to focus to simulate click into element.
     *
     * @param {EventTarget|Element} target Target DOM element
     * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
     */
    TouchClick.prototype.needsFocus = function(target) {
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
  
          // No point in attempting to focus disabled inputs
          return !target.disabled && !target.readOnly;
        default:
          return (/\bneedsfocus\b/).test(target.className);
      }
    };
  
  
    /**
     * Send a click event to the specified element.
     *
     * @param {EventTarget|Element} targetElement
     * @param {Event} event
     */
    TouchClick.prototype.sendClick = function(targetElement, event) {
      var clickEvent, touch;
  
      // On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
      if (document.activeElement && document.activeElement !== targetElement) {
        document.activeElement.blur();
      }
  
      touch = event.changedTouches[0];
  
      // Synthesise a click event, with an extra attribute so it can be tracked
      clickEvent = document.createEvent('MouseEvents');
      clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
      clickEvent.forwardedTouchEvent = true;
      targetElement.dispatchEvent(clickEvent);
    };
  
    TouchClick.prototype.determineEventType = function(targetElement) {
  
      //Issue #159: Android Chrome Select Box does not open with a synthetic click event
      if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
        return 'mousedown';
      }
  
      return 'click';
    };
  
  
    /**
     * @param {EventTarget|Element} targetElement
     */
    TouchClick.prototype.focus = function(targetElement) {
      var length;
  
      // Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
      if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
        length = targetElement.value.length;
        targetElement.setSelectionRange(length, length);
      } else {
        targetElement.focus();
      }
    };
  
  
    /**
     * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
     *
     * @param {EventTarget|Element} targetElement
     */
    TouchClick.prototype.updateScrollParent = function(targetElement) {
      var scrollParent, parentElement;
  
      scrollParent = targetElement.touchClickScrollParent;
  
      // Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
      // target element was moved to another parent.
      if (!scrollParent || !scrollParent.contains(targetElement)) {
        parentElement = targetElement;
        do {
          if (parentElement.scrollHeight > parentElement.offsetHeight) {
            scrollParent = parentElement;
            targetElement.touchClickScrollParent = parentElement;
            break;
          }
  
          parentElement = parentElement.parentElement;
        } while (parentElement);
      }
  
      // Always update the scroll top tracker if possible.
      if (scrollParent) {
        scrollParent.touchClickLastScrollTop = scrollParent.scrollTop;
      }
    };
  
  
    /**
     * @param {EventTarget} targetElement
     * @returns {Element|EventTarget}
     */
    TouchClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
  
      // On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
      if (eventTarget.nodeType === Node.TEXT_NODE) {
        return eventTarget.parentNode;
      }
  
      return eventTarget;
    };
  
  
    /**
     * On touch start, record the position and scroll offset.
     *
     * @param {Event} event
     * @returns {boolean}
     */
    TouchClick.prototype.onTouchStart = function(event) {
      var targetElement, touch, selection;
  
      // Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the TouchClick element (issue #111).
      if (event.targetTouches.length > 1) {
        return true;
      }
  
      targetElement = this.getTargetElementFromEventTarget(event.target);
      touch = event.targetTouches[0];
  
      if (deviceIsIOS) {
  
        // Only trusted events will deselect text on iOS (issue #49)
        selection = window.getSelection();
        if (selection.rangeCount && !selection.isCollapsed) {
          return true;
        }
  
        if (!deviceIsIOS4) {
  
          // Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
          // when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
          // with the same identifier as the touch event that previously triggered the click that triggered the alert.
          // Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
          // immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
          // Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
          // which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
          // random integers, it's safe to to continue if the identifier is 0 here.
          if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
            event.preventDefault();
            return false;
          }
  
          this.lastTouchIdentifier = touch.identifier;
  
          // If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
          // 1) the user does a fling scroll on the scrollable layer
          // 2) the user stops the fling scroll with another tap
          // then the event.target of the last 'touchend' event will be the element that was under the user's finger
          // when the fling scroll was started, causing TouchClick to send a click event to that layer - unless a check
          // is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
          this.updateScrollParent(targetElement);
        }
      }
  
      this.trackingClick = true;
      this.trackingClickStart = event.timeStamp;
      this.targetElement = targetElement;
  
      this.touchStartX = touch.pageX;
      this.touchStartY = touch.pageY;
  
      // Prevent phantom clicks on fast double-tap (issue #36)
      if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
        event.preventDefault();
      }
  
      return true;
    };
  
  
    /**
     * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
     *
     * @param {Event} event
     * @returns {boolean}
     */
    TouchClick.prototype.touchHasMoved = function(event) {
      var touch = event.changedTouches[0], boundary = this.touchBoundary;
  
      if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
        return true;
      }
  
      return false;
    };
  
  
    /**
     * Update the last position.
     *
     * @param {Event} event
     * @returns {boolean}
     */
    TouchClick.prototype.onTouchMove = function(event) {
      if (!this.trackingClick) {
        return true;
      }
  
      // If the touch has moved, cancel the click tracking
      if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
        this.trackingClick = false;
        this.targetElement = null;
      }
  
      return true;
    };
  
  
    /**
     * Attempt to find the labelled control for the given label element.
     *
     * @param {EventTarget|HTMLLabelElement} labelElement
     * @returns {Element|null}
     */
    TouchClick.prototype.findControl = function(labelElement) {
  
      // Fast path for newer browsers supporting the HTML5 control attribute
      if (labelElement.control !== undefined) {
        return labelElement.control;
      }
  
      // All browsers under test that support touch events also support the HTML5 htmlFor attribute
      if (labelElement.htmlFor) {
        return document.getElementById(labelElement.htmlFor);
      }
  
      // If no for attribute exists, attempt to retrieve the first labellable descendant element
      // the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
      return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
    };
  
  
    /**
     * On touch end, determine whether to send a click event at once.
     *
     * @param {Event} event
     * @returns {boolean}
     */
    TouchClick.prototype.onTouchEnd = function(event) {
      var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;
  
      if (!this.trackingClick) {
        return true;
      }
  
      // Prevent phantom clicks on fast double-tap (issue #36)
      if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
        this.cancelNextClick = true;
        return true;
      }
  
      if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
        return true;
      }
  
      // Reset to prevent wrong click cancel on input (issue #156).
      this.cancelNextClick = false;
  
      this.lastClickTime = event.timeStamp;
  
      trackingClickStart = this.trackingClickStart;
      this.trackingClick = false;
      this.trackingClickStart = 0;
  
      // On some iOS devices, the targetElement supplied with the event is invalid if the layer
      // is performing a transition or scroll, and has to be re-detected manually. Note that
      // for this to function correctly, it must be called *after* the event target is checked!
      // See issue #57; also filed as rdar://13048589 .
      if (deviceIsIOSWithBadTarget) {
        touch = event.changedTouches[0];
  
        // In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
        targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
        targetElement.touchClickScrollParent = this.targetElement.touchClickScrollParent;
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
  
        // Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
        // Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
        if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
          this.targetElement = null;
          return false;
        }
  
        this.focus(targetElement);
        this.sendClick(targetElement, event);
  
        // Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
        // Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
        if (!deviceIsIOS || targetTagName !== 'select') {
          this.targetElement = null;
          event.preventDefault();
        }
  
        return false;
      }
  
      if (deviceIsIOS && !deviceIsIOS4) {
  
        // Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
        // and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
        scrollParent = targetElement.touchClickScrollParent;
        if (scrollParent && scrollParent.touchClickLastScrollTop !== scrollParent.scrollTop) {
          return true;
        }
      }
  
      // Prevent the actual click from going though - unless the target node is marked as requiring
      // real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
      if (!this.needsClick(targetElement)) {
        event.preventDefault();
        this.sendClick(targetElement, event);
      }
  
      return false;
    };
  
  
    /**
     * On touch cancel, stop tracking the click.
     *
     * @returns {void}
     */
    TouchClick.prototype.onTouchCancel = function() {
      this.trackingClick = false;
      this.targetElement = null;
    };
  
  
    /**
     * Determine mouse events which should be permitted.
     *
     * @param {Event} event
     * @returns {boolean}
     */
    TouchClick.prototype.onMouse = function(event) {
  
      // If a target element was never set (because a touch event was never fired) allow the event
      if (!this.targetElement) {
        return true;
      }
  
      if (event.forwardedTouchEvent) {
        return true;
      }
  
      // Programmatically generated events targeting a specific element should be permitted
      if (!event.cancelable) {
        return true;
      }
  
      // Derive and check the target element to see whether the mouse event needs to be permitted;
      // unless explicitly enabled, prevent non-touch click events from triggering actions,
      // to prevent ghost/doubleclicks.
      if (!this.needsClick(this.targetElement) || this.cancelNextClick) {
  
        // Prevent any user-added listeners declared on TouchClick element from being fired.
        if (event.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        } else {
  
          // Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
          event.propagationStopped = true;
        }
  
        // Cancel the event
        event.stopPropagation();
        event.preventDefault();
  
        return false;
      }
  
      // If the mouse event is permitted, return true for the action to go through.
      return true;
    };
  
  
    /**
     * On actual clicks, determine whether this is a touch-generated click, a click action occurring
     * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
     * an actual click which should be permitted.
     *
     * @param {Event} event
     * @returns {boolean}
     */
    TouchClick.prototype.onClick = function(event) {
      var permitted;
  
      // It's possible for another TouchClick-like library delivered with third-party code to fire a click event before TouchClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
      if (this.trackingClick) {
        this.targetElement = null;
        this.trackingClick = false;
        return true;
      }
  
      // Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
      if (event.target.type === 'submit' && event.detail === 0) {
        return true;
      }
  
      permitted = this.onMouse(event);
  
      // Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
      if (!permitted) {
        this.targetElement = null;
      }
  
      // If clicks are permitted, return true for the action to go through.
      return permitted;
    };
  
  
    /**
     * Remove all TouchClick's event listeners.
     *
     * @returns {void}
     */
    TouchClick.prototype.destroy = function() {
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
  
  
    /**
     * Check whether TouchClick is needed.
     *
     * @param {Element} layer The layer to listen on
     */
    TouchClick.notNeeded = function(layer) {
      var metaViewport;
      var chromeVersion;
      var blackberryVersion;
      var firefoxVersion;
  
      // Devices that don't support touch don't need TouchClick
      if (typeof window.ontouchstart === 'undefined') {
        return true;
      }
  
      // Chrome version - zero for other browsers
      chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];
  
      if (chromeVersion) {
  
        if (deviceIsAndroid) {
          metaViewport = document.querySelector('meta[name=viewport]');
  
          if (metaViewport) {
            // Chrome on Android with user-scalable="no" doesn't need TouchClick (issue #89)
            if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
              return true;
            }
            // Chrome 32 and above with width=device-width or less don't need TouchClick
            if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
              return true;
            }
          }
  
          // Chrome desktop doesn't need TouchClick (issue #15)
        } else {
          return true;
        }
      }
  
      if (deviceIsBlackBerry10) {
        blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);
  
        // BlackBerry 10.3+ does not require Fastclick library.
        // https://github.com/ftlabs/fastclick/issues/251
        if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
          metaViewport = document.querySelector('meta[name=viewport]');
  
          if (metaViewport) {
            // user-scalable=no eliminates click delay.
            if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
              return true;
            }
            // width=device-width (or less than device-width) eliminates click delay.
            if (document.documentElement.scrollWidth <= window.outerWidth) {
              return true;
            }
          }
        }
      }
  
      // IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
      if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
        return true;
      }
  
      // Firefox version - zero for other browsers
      firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];
  
      if (firefoxVersion >= 27) {
        // Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896
  
        metaViewport = document.querySelector('meta[name=viewport]');
        if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
          return true;
        }
      }
  
      // IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
      // http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
      if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
        return true;
      }
  
      return false;
    };
  
  
    /**
     * Factory method for creating a TouchClick object
     *
     * @param {Element} layer The layer to listen on
     * @param {Object} [options={}] The options to override the defaults
     */
    TouchClick.attach = function(layer, options) {
      return new TouchClick(layer, options);
    };
  
    TouchClick.initialize = function(layer) {
      if (lang.isUndefined(layer)) {
        layer = document.body;
      }
  
      return TouchClick.attach($(layer).get(0));
    };
  
    module.exports = TouchClick;
  
  });

  define('mob/scroller', function(require, exports, module) {
  
    var lang = require('mob/lang');
  
    var utils = (function() {
      var me = {};
  
      var _elementStyle = document.createElement('div').style;
      var _vendor = (function() {
        var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
          transform,
          i = 0,
          l = vendors.length;
  
        for (; i < l; i++) {
          transform = vendors[i] + 'ransform';
          if (transform in _elementStyle) return vendors[i].substr(0, vendors[i].length - 1);
        }
  
        return false;
      })();
  
      function _prefixStyle(style) {
        if (_vendor === false) return false;
        if (_vendor === '') return style;
        return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
      }
  
      me.addEvent = function(el, type, fn, capture) {
        el.addEventListener(type, fn, !!capture);
      };
  
      me.removeEvent = function(el, type, fn, capture) {
        el.removeEventListener(type, fn, !!capture);
      };
  
      me.prefixPointerEvent = function(pointerEvent) {
        return window.MSPointerEvent ?
        'MSPointer' + pointerEvent.charAt(9).toUpperCase() + pointerEvent.substr(10) :
          pointerEvent;
      };
  
      me.momentum = function(current, start, time, lowerMargin, wrapperSize, deceleration) {
        var distance = current - start,
          speed = Math.abs(distance) / time,
          destination,
          duration;
  
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
  
      var _transform = _prefixStyle('transform');
  
      lang.extend(me, {
        hasTransform: _transform !== false,
        hasPerspective: _prefixStyle('perspective') in _elementStyle,
        hasTouch: 'ontouchstart' in window,
        hasPointer: window.PointerEvent || window.MSPointerEvent, // IE10 is prefixed
        hasTransition: _prefixStyle('transition') in _elementStyle
      });
  
      // This should find all Android browsers lower than build 535.19 (both stock browser and webview)
      me.isBadAndroid = /Android /.test(window.navigator.appVersion) && !(/Chrome\/\d/.test(window.navigator.appVersion));
  
      lang.extend(me.style = {}, {
        transform: _transform,
        transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
        transitionDuration: _prefixStyle('transitionDuration'),
        transitionDelay: _prefixStyle('transitionDelay'),
        transformOrigin: _prefixStyle('transformOrigin')
      });
  
      me.offset = function(el) {
        var left = -el.offsetLeft,
          top = -el.offsetTop;
  
        // jshint -W084
        while (el = el.offsetParent) {
          left -= el.offsetLeft;
          top -= el.offsetTop;
        }
        // jshint +W084
  
        return {
          left: left,
          top: top
        };
      };
  
      me.preventDefaultException = function(el, exceptions) {
        for (var i in exceptions) {
          if (exceptions[i].test(el[i])) {
            return true;
          }
        }
  
        return false;
      };
  
      lang.extend(me.eventType = {}, {
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
      });
  
      lang.extend(me.ease = {}, {
        quadratic: {
          style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          fn: function(k) {
            return k * (2 - k);
          }
        },
        circular: {
          style: 'cubic-bezier(0.1, 0.57, 0.1, 1)', // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
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
      });
  
      me.tap = function(e, eventName) {
        var ev = document.createEvent('Event');
        ev.initEvent(eventName, true, true);
        ev.pageX = e.pageX;
        ev.pageY = e.pageY;
        e.target.dispatchEvent(ev);
      };
  
      me.click = function(e) {
        var target = e.target,
          ev;
  
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
  
      return me;
    })();
  
    function Scroller(el, options) {
      this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
      this.scroller = this.wrapper.children[0];
      this.scrollerStyle = this.scroller.style; // cache style for better performance
  
      this.options = {
  
        // INSERT POINT: OPTIONS
  
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
      this.translateZ = this.options.HWCompositing && utils.hasPerspective ? ' translateZ(0)' : '';
  
      this.options.useTransition = utils.hasTransition && this.options.useTransition;
      this.options.useTransform = utils.hasTransform && this.options.useTransform;
  
      this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
      this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;
  
      // If you want eventPassthrough I have to lock one of the axes
      this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
      this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;
  
      // With eventPassthrough we also need lockDirection mechanism
      this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough;
      this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;
  
      this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? utils.ease[this.options.bounceEasing] || utils.ease.circular : this.options.bounceEasing;
  
      this.options.resizePolling = this.options.resizePolling === undefined ? 60 : this.options.resizePolling;
  
      if (this.options.tap === true) {
        this.options.tap = 'tap';
      }
  
      // INSERT POINT: NORMALIZATION
  
      // Some defaults
      this.x = 0;
      this.y = 0;
      this.directionX = 0;
      this.directionY = 0;
      this._events = {};
  
      // INSERT POINT: DEFAULTS
  
      this._init();
      this.refresh();
  
      this.scrollTo(this.options.startX, this.options.startY);
      this.enable();
    }
  
    Scroller.prototype = {
  
      _init: function() {
        this._initEvents();
  
        // INSERT POINT: _init
  
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
        // React to left mouse button only
        if (utils.eventType[e.type] != 1) {
          if (e.button !== 0) {
            return;
          }
        }
  
        if (!this.enabled || (this.initiated && utils.eventType[e.type] !== this.initiated)) {
          return;
        }
  
        if (this.options.preventDefault && !utils.isBadAndroid && !utils.preventDefaultException(e.target, this.options.preventDefaultException)) {
          e.preventDefault();
        }
  
        var point = e.touches ? e.touches[0] : e,
          pos;
  
        this.initiated = utils.eventType[e.type];
        this.moved = false;
        this.distX = 0;
        this.distY = 0;
        this.directionX = 0;
        this.directionY = 0;
        this.directionLocked = 0;
  
        this._transitionTime();
  
        this.startTime = lang.now();
  
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
        if (!this.enabled || utils.eventType[e.type] !== this.initiated) {
          return;
        }
  
        if (this.options.preventDefault) { // increases performance on Android? TODO: check!
          e.preventDefault();
        }
  
        var point = e.touches ? e.touches[0] : e,
          deltaX = point.pageX - this.pointX,
          deltaY = point.pageY - this.pointY,
          timestamp = lang.now(),
          newX, newY,
          absDistX, absDistY;
  
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
  
        /* REPLACE START: _move */
  
        if (timestamp - this.startTime > 300) {
          this.startTime = timestamp;
          this.startX = this.x;
          this.startY = this.y;
        }
  
        /* REPLACE END: _move */
  
      },
  
      _end: function(e) {
        if (!this.enabled || utils.eventType[e.type] !== this.initiated) {
          return;
        }
  
        if (this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException)) {
          e.preventDefault();
        }
  
        var point = e.changedTouches ? e.changedTouches[0] : e,
          momentumX,
          momentumY,
          duration = lang.now() - this.startTime,
          newX = Math.round(this.x),
          newY = Math.round(this.y),
          distanceX = Math.abs(newX - this.startX),
          distanceY = Math.abs(newY - this.startY),
          time = 0,
          easing = '';
  
        this.isInTransition = 0;
        this.initiated = 0;
        this.endTime = lang.now();
  
        // reset if we are outside of the boundaries
        if (this.resetPosition(this.options.bounceTime)) {
          return;
        }
  
        this.scrollTo(newX, newY); // ensures that the last position is rounded
  
        // we scrolled less than 10 pixels
        if (!this.moved) {
          if (this.options.tap) {
            utils.tap(e, this.options.tap);
          }
  
          if (this.options.click) {
            utils.click(e);
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
          momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : {
            destination: newX,
            duration: 0
          };
          momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : {
            destination: newY,
            duration: 0
          };
          newX = momentumX.destination;
          newY = momentumY.destination;
          time = Math.max(momentumX.duration, momentumY.duration);
          this.isInTransition = 1;
        }
  
        // INSERT POINT: _end
  
        if (newX != this.x || newY != this.y) {
          // change easing function when scroller goes out of the boundaries
          if (newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY) {
            easing = utils.ease.quadratic;
          }
  
          this.scrollTo(newX, newY, time, easing);
          return;
        }
  
        this._execEvent('scrollEnd');
      },
  
      _resize: function() {
        var that = this;
  
        clearTimeout(this.resizeTimeout);
  
        this.resizeTimeout = setTimeout(function() {
          that.refresh();
        }, this.options.resizePolling);
      },
  
      resetPosition: function(time) {
        var x = this.x,
          y = this.y;
  
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
        var rf = this.wrapper.offsetHeight; // Force reflow
  
        this.wrapperWidth = this.wrapper.clientWidth;
        this.wrapperHeight = this.wrapper.clientHeight;
  
        /* REPLACE START: refresh */
  
        this.scrollerWidth = this.scroller.offsetWidth;
        this.scrollerHeight = this.scroller.offsetHeight;
  
        this.maxScrollX = this.wrapperWidth - this.scrollerWidth;
        this.maxScrollY = this.wrapperHeight - this.scrollerHeight;
  
        /* REPLACE END: refresh */
  
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
  
        this.wrapperOffset = utils.offset(this.wrapper);
  
        this._execEvent('refresh');
  
        this.resetPosition();
  
        // INSERT POINT: _refresh
  
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
  
        var i = 0,
          l = this._events[type].length;
  
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
        easing = easing || utils.ease.circular;
  
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
  
        var pos = utils.offset(el);
  
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
  
        this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';
  
        if (!time && utils.isBadAndroid) {
          this.scrollerStyle[utils.style.transitionDuration] = '0.001s';
        }
  
        // INSERT POINT: _transitionTime
  
      },
  
      _transitionTimingFunction: function(easing) {
        this.scrollerStyle[utils.style.transitionTimingFunction] = easing;
  
        // INSERT POINT: _transitionTimingFunction
  
      },
  
      _translate: function(x, y) {
        if (this.options.useTransform) {
  
          /* REPLACE START: _translate */
  
          this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;
  
          /* REPLACE END: _translate */
  
        } else {
          x = Math.round(x);
          y = Math.round(y);
          this.scrollerStyle.left = x + 'px';
          this.scrollerStyle.top = y + 'px';
        }
  
        this.x = x;
        this.y = y;
  
        // INSERT POINT: _translate
  
      },
  
      _initEvents: function(remove) {
        var eventType = remove ? utils.removeEvent : utils.addEvent,
          target = this.options.bindToWrapper ? this.wrapper : window;
  
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
  
        if (utils.hasPointer && !this.options.disablePointer) {
          eventType(this.wrapper, utils.prefixPointerEvent('pointerdown'), this);
          eventType(target, utils.prefixPointerEvent('pointermove'), this);
          eventType(target, utils.prefixPointerEvent('pointercancel'), this);
          eventType(target, utils.prefixPointerEvent('pointerup'), this);
        }
  
        if (utils.hasTouch && !this.options.disableTouch) {
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
        var matrix = window.getComputedStyle(this.scroller, null),
          x, y;
  
        if (this.options.useTransform) {
          matrix = matrix[utils.style.transform].split(')')[0].split(', ');
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
        var that = this,
          startX = this.x,
          startY = this.y,
          startTime = lang.now(),
          destTime = startTime + duration;
  
        function step() {
          var now = lang.now(),
            newX, newY,
            easing;
  
          if (now >= destTime) {
            that.isAnimating = false;
            that._translate(destX, destY);
  
            if (!that.resetPosition(that.options.bounceTime)) {
              that._execEvent('scrollEnd');
            }
  
            return;
          }
  
          now = (now - startTime) / duration;
          easing = easingFn(now);
          newX = (destX - startX) * easing + startX;
          newY = (destY - startY) * easing + startY;
          that._translate(newX, newY);
  
          if (that.isAnimating) {
            lang.requestAnimationFrame(step);
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
      // unit tests in viewport.unit.js
  
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
      }
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

  define('mob/component', function(require, exports, module) {
  
    var View = require('mob/view');
  
    var Component = View.extend({
  
      tagName: 'div',
  
      className: 'mo-component'
  
    });
  
    module.exports = Component;
  
  });

  define('mob/screen', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var $ = require('mob/jqlite');
    var base = require('mob/base');
    var Class = require('mob/class');
    var Transition = require('mob/transition');
  
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
  
      adjustTitle: function(title) {
        title = title || this.$el.attr('mo-title');
  
        if (title) {
          lang.adjustTitle(title);
        }
  
      },
  
      _toggleScreen: function() {
        var transition = this.$el.attr('mo-transition');
        if (transition !== 'none') {
          Transition.goTo(this.$el, transition || 'slideleft', location.hash);
        } else {
          this.$el.siblings().removeClass('current');
          this.$el.addClass('current');
        }
      },
  
      show: function(view, options) {
        if (!this._ensureElement()) {
          return;
        }
  
        this._ensureViewIsIntact(view);
  
        this.adjustTitle();
        this._toggleScreen();
  
        var showOptions = options || {};
        var isDifferentView = view !== this.currentView;
        var preventDestroy = !!showOptions.preventDestroy;
        var forceShow = !!showOptions.forceShow;
  
        var isChangingView = !!this.currentView;
  
        var _shouldDestroyView = isDifferentView && !preventDestroy;
  
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
  
          var attachedScreen = base.isNodeAttached(this.el);
  
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
  
      getEl: function(el) {
        return $(el, base._getValue(this.options.parentEl, this));
      },
  
      attachHtml: function(view) {
        this.$el.contents().detach();
  
        this.el.appendChild(view.el);
      },
  
      empty: function(options) {
        var view = this.currentView;
  
        var preventDestroy = base._getValue(options, 'preventDestroy', this);
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
  
      _destroyView: function() {
        var view = this.currentView;
  
        if (view.destroy && !view.isDestroyed) {
          view.destroy();
        } else if (view.remove) {
          view.remove();
  
          view.isDestroyed = true;
        }
      },
  
      attachView: function(view) {
        this.currentView = view;
        return this;
      },
  
      hasView: function() {
        return !!this.currentView;
      },
  
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
  
      _buildScreenFromSelector: function(selector, DefaultScreenClass) {
        return new DefaultScreenClass({
          el: selector
        });
      },
  
      _buildScreenFromObject: function(screenConfig, DefaultScreenClass) {
        var ScreenClass = screenConfig.screenClass || DefaultScreenClass;
        var options = lang.omit(screenConfig, 'selector', 'screenClass');
  
        if (screenConfig.selector && !options.el) {
          options.el = screenConfig.selector;
        }
  
        return new ScreenClass(options);
      },
  
      _buildScreenFromScreenClass: function(ScreenClass) {
        return new ScreenClass();
      }
    });
  
    module.exports = Screen;
  
  });

  define('mob/screenComponent', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var $ = require('mob/jqlite');
  
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

  define('mob/screenView', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var $ = require('mob/jqlite');
    var Logger = require('mob/logger');
    var View = require('mob/view');
    var ScreenComponent = require('mob/screenComponent');
    var Scroller = require('mob/scroller');
  
    var ScreenView = View.extend({
  
      tagName: 'div',
  
      className: 'mo-screen-view',
  
      initialize : function() {
        ScreenComponent.add(this);
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
      }
  
    });
  
    module.exports = ScreenView;
  
  });

  define('mob/router', function(require, exports, module) {
  
    var lang = require('mob/lang');
    var Logger = require('mob/logger');
  
    if (!Function.prototype.bind) {
      Function.prototype.bind = function(object) {
        var originalFunction = this,
          args = Array.prototype.slice.call(arguments);
        object = args.shift();
        return function() {
          return originalFunction.apply(object, args.concat(Array.prototype.slice.call(arguments)));
        };
      };
    }
  
    function addHashchangeListener(el, listener) {
      if (el.addEventListener) {
        el.addEventListener('hashchange', listener, false);
      } else if (el.attachEvent) {
        el.attachEvent('hashchange', listener);
      }
    }
  
    function removeHashchangeListener(el, listener) {
      if (el.removeEventListener) {
        el.removeEventListener('hashchange', listener, false);
      } else if (el.detachEvent) {
        el.detachEvent('hashchange', listener);
      }
    }
  
    var ROUTER_PATH_REPLACER = "([^\/\\?]+)",
      ROUTER_PATH_NAME_MATCHER = /:([\w\d]+)/g,
      ROUTER_PATH_EVERY_MATCHER = /\/\*(?!\*)/,
      ROUTER_PATH_EVERY_REPLACER = "\/([^\/\\?]+)",
      ROUTER_PATH_EVERY_GLOBAL_MATCHER = /\*{2}/,
      ROUTER_PATH_EVERY_GLOBAL_REPLACER = "(.*?)\\??",
      ROUTER_LEADING_BACKSLASHES_MATCH = /\/*$/;
  
    var RouterRequest = function(href) {
  
      this.href = href;
  
      this.params;
  
      this.query;
  
      this.splat;
  
      this.hasNext = false;
    };
  
    RouterRequest.prototype.get = function(key, default_value) {
      return (this.params && this.params[key] !== undefined) ?
        this.params[key] : (this.query && this.query[key] !== undefined) ?
        this.query[key] : (default_value !== undefined) ?
        default_value : undefined;
    };
  
    var Router = function(options) {
      this._options = lang.extend({
        ignorecase: true
      }, options);
      this._routes = [];
      this._befores = [];
      this._errors = {
        '_': function(err, url, httpCode) {
          Logger.warn('Router : ' + httpCode);
        },
        '_404': function(err, url) {
          if (console && console.warn) console.warn('404! Unmatched route for url ' + url);
        },
        '_500': function(err, url) {
          if (console && console.error) console.error('500! Internal error route for url ' + url);
          else {
            throw new Error('500');
          }
        }
      };
      this._paused = false;
      this._hasChangeHandler = this._onHashChange.bind(this);
      addHashchangeListener(window, this._hasChangeHandler);
    };
  
    Router.prototype._onHashChange = function(e) {
      if (!this._paused) {
        this._route(this._extractFragment(window.location.href));
      }
      return true;
    };
  
    Router.prototype._extractFragment = function(url) {
      var hash_index = url.indexOf('#');
      return hash_index >= 0 ? url.substring(hash_index) : '#/';
    };
  
    Router.prototype._throwsRouteError = function(httpCode, err, url) {
      if (this._errors['_' + httpCode] instanceof Function)
        this._errors['_' + httpCode](err, url, httpCode);
      else {
        this._errors._(err, url, httpCode);
      }
      return false;
    };
  
    Router.prototype._buildRequestObject = function(fragmentUrl, params, splat, hasNext) {
      if (!fragmentUrl)
        throw new Error('Unable to compile request object');
      var request = new RouterRequest(fragmentUrl);
      if (params)
        request.params = params;
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
      /*Combine path parameter name with params passed if any*/
      for (var i = 0, len = route.paramNames.length; i < len; i++) {
        params[route.paramNames[i]] = match[i + 1];
      }
      i = i + 1;
      /*If any other match put them in request splat*/
      if (match && i < match.length) {
        for (var j = i; j < match.length; j++) {
          splat.push(match[j]);
        }
      }
      /*Build next callback*/
      var hasNext = (matchedIndexes.length !== 0);
      var next = (
        function(uO, u, mI, hasNext) {
          return function(hasNext, err, error_code) {
            if (!hasNext && !err) {
              return this._throwsRouteError(500, 'Cannot call "next" without an error if request.hasNext is false', fragmentUrl);
            }
            if (err)
              return this._throwsRouteError(error_code || 500, err, fragmentUrl);
            this._followRoute(uO, u, mI);
          }.bind(this, hasNext);
        }.bind(this)(fragmentUrl, url, matchedIndexes, hasNext)
      );
      request = this._buildRequestObject(fragmentUrl, params, splat, hasNext);
      route.routeAction(request, next);
    };
  
    Router.prototype._routeBefores = function(befores, before, fragmentUrl, url, matchedIndexes) {
      var next;
      if (befores.length > 0) {
        var nextBefore = befores.splice(0, 1);
        nextBefore = nextBefore[0];
        next = function(err, error_code) {
          if (err)
            return this._throwsRouteError(error_code || 500, err, fragmentUrl);
          this._routeBefores(befores, nextBefore, fragmentUrl, url, matchedIndexes);
        }.bind(this);
      } else {
        next = function(err, error_code) {
          if (err)
            return this._throwsRouteError(error_code || 500, err, fragmentUrl);
          this._followRoute(fragmentUrl, url, matchedIndexes);
        }.bind(this);
      }
      before(this._buildRequestObject(fragmentUrl, null, null, true), next);
    };
  
    Router.prototype._route = function(fragmentUrl) {
      var route = '',
        befores = this._befores.slice(),
      /*Take a copy of befores cause is nedeed to splice them*/
        matchedIndexes = [],
        urlToTest;
      var url = fragmentUrl;
      if (url.length === 0)
        return true;
      url = url.replace(ROUTER_LEADING_BACKSLASHES_MATCH, '');
      urlToTest = (url.split('?'))[0]
        .replace(ROUTER_LEADING_BACKSLASHES_MATCH, ''); /*Removes leading backslashes from the end of the url*/
      /*Check for all matching indexes*/
      for (var p in this._routes) {
        if (this._routes.hasOwnProperty(p)) {
          route = this._routes[p];
          if (route.path.test(urlToTest)) {
            matchedIndexes.push(p);
          }
        }
      }
  
      if (matchedIndexes.length > 0) {
        /*If befores were added call them in order*/
        if (befores.length > 0) {
          var before = befores.splice(0, 1);
          before = before[0];
          /*Execute all before consecutively*/
          this._routeBefores(befores, before, fragmentUrl, url, matchedIndexes);
        } else {
          /*Follow all routes*/
          this._followRoute(fragmentUrl, url, matchedIndexes);
        }
        /*If no route matched, then call 404 error*/
      } else {
        return this._throwsRouteError(404, null, fragmentUrl);
      }
    };
  
    Router.prototype.pause = function() {
      this._paused = true;
      return this;
    };
  
    Router.prototype.play = function(triggerNow) {
      triggerNow = 'undefined' == typeof triggerNow ? false : triggerNow;
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
      if (!this._paused)
        this._route(this._extractFragment(url));
      return this;
    };
  
    Router.prototype.addRoute = function(path, callback) {
      var match,
        modifiers = (this._options.ignorecase ? 'i' : ''),
        paramNames = [];
      if ('string' == typeof path) {
        /*Remove leading backslash from the end of the string*/
        path = path.replace(ROUTER_LEADING_BACKSLASHES_MATCH, '');
        /*Param Names are all the one defined as :param in the path*/
        while ((match = ROUTER_PATH_NAME_MATCHER.exec(path)) !== null) {
          paramNames.push(match[1]);
        }
        path = new RegExp(path
            .replace(ROUTER_PATH_NAME_MATCHER, ROUTER_PATH_REPLACER)
            .replace(ROUTER_PATH_EVERY_MATCHER, ROUTER_PATH_EVERY_REPLACER)
            .replace(ROUTER_PATH_EVERY_GLOBAL_MATCHER, ROUTER_PATH_EVERY_GLOBAL_REPLACER) + "(?:\\?.+)?$", modifiers);
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
      if (isNaN(httpCode)) {
        throw new Error('Invalid code for routes error handling');
      }
      if (!(callback instanceof Function)) {
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
      removeHashchangeListener(window, this._hasChangeHandler);
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

  var lang = require('mob/lang');
  lang.extend(Mob, lang);
  
  Mob.Logger = require('mob/logger');
  Mob.each(['debug', 'time', 'timeEnd', 'info', 'warn', 'error', 'log'], function(method) {
    Mob[method] = Mob.Logger[method];
  });
  
  if (Mob.isUndefined(M$)) {
    M$ = require('mob/jqlite');
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
  Mob.Router = require('mob/router');
  Mob.Application = require('mob/application');
  Mob.createApplication = function(options) {
    return new Mob.Application(options);
  };
  
  Mob.require = Mob.requireModule = require;
  Mob.define = Mob.defineModule = define;

  return Mob;

}));

Mobird = Mob;