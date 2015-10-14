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