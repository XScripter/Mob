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



  module.exports = lang;

});