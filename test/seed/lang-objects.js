(function() {

  QUnit.module('mob/lang/objects');

  var testElement = typeof document === 'object' ? document.createElement('div') : void 0;

  QUnit.test('Mob .keys', function(assert) {
    assert.deepEqual(Mob.keys({
      one: 1,
      two: 2
    }), ['one', 'two'], 'can extract the keys from an object');
    // the test above is not safe because it relies on for-in enumeration order
    var a = [];
    a[1] = 0;
    assert.deepEqual(Mob.keys(a), ['1'], 'is not fooled by sparse arrays; see issue #95');
    assert.deepEqual(Mob.keys(null), []);
    assert.deepEqual(Mob.keys(void 0), []);
    assert.deepEqual(Mob.keys(1), []);
    assert.deepEqual(Mob.keys('a'), []);
    assert.deepEqual(Mob.keys(true), []);

    // keys that may be missed if the implementation isn't careful
    var trouble = {
      constructor: Object,
      valueOf: Mob.noop,
      hasOwnProperty: null,
      toString: 5,
      toLocaleString: void 0,
      propertyIsEnumerable: /a/,
      isPrototypeOf: this,
      __defineGetter__: Boolean,
      __defineSetter__: {},
      __lookupSetter__: false,
      __lookupGetter__: []
    };
    var troubleKeys = ['constructor', 'valueOf', 'hasOwnProperty', 'toString', 'toLocaleString', 'propertyIsEnumerable',
      'isPrototypeOf', '__defineGetter__', '__defineSetter__', '__lookupSetter__', '__lookupGetter__'
    ].sort();
    assert.deepEqual(Mob.keys(trouble).sort(), troubleKeys, 'matches non-enumerable properties');
  });

  QUnit.test('Mob .allKeys', function(assert) {
    assert.deepEqual(Mob.allKeys({
      one: 1,
      two: 2
    }), ['one', 'two'], 'can extract the allKeys from an object');
    // the test above is not safe because it relies on for-in enumeration order
    var a = [];
    a[1] = 0;
    assert.deepEqual(Mob.allKeys(a), ['1'], 'is not fooled by sparse arrays; see issue #95');

    a.a = a;
    assert.deepEqual(Mob.allKeys(a), ['1', 'a'], 'is not fooled by sparse arrays with additional properties');

    Mob.each([null, void 0, 1, 'a', true, NaN, {},
      [], new Number(5), new Date(0)
    ], function(val) {
      assert.deepEqual(Mob.allKeys(val), []);
    });

    // allKeys that may be missed if the implementation isn't careful
    var trouble = {
      constructor: Object,
      valueOf: Mob.noop,
      hasOwnProperty: null,
      toString: 5,
      toLocaleString: void 0,
      propertyIsEnumerable: /a/,
      isPrototypeOf: this
    };
    var troubleKeys = ['constructor', 'valueOf', 'hasOwnProperty', 'toString', 'toLocaleString', 'propertyIsEnumerable',
      'isPrototypeOf'
    ].sort();
    assert.deepEqual(Mob.allKeys(trouble).sort(), troubleKeys, 'matches non-enumerable properties');

    function A() {}
    A.prototype.foo = 'foo';
    var b = new A();
    b.bar = 'bar';
    assert.deepEqual(Mob.allKeys(b).sort(), ['bar', 'foo'], 'should include inherited keys');

  });

  QUnit.test('Mob .values', function(assert) {
    assert.deepEqual(Mob.values({
      one: 1,
      two: 2
    }), [1, 2], 'can extract the values from an object');
    assert.deepEqual(Mob.values({
      one: 1,
      two: 2,
      length: 3
    }), [1, 2, 3], '... even when one of them is "length"');
  });

  QUnit.test('Mob .invert', function(assert) {
    var obj = {
      first: 'Moe',
      second: 'Larry',
      third: 'Curly'
    };
    assert.deepEqual(Mob.keys(Mob.invert(obj)), ['Moe', 'Larry', 'Curly'], 'can invert an object');
    assert.deepEqual(Mob.invert(Mob.invert(obj)), obj, 'two inverts gets you back where you started');

    obj = {
      length: 3
    };
    assert.equal(Mob.invert(obj)['3'], 'length', 'can invert an object with "length"');
  });

  QUnit.test('Mob .extend', function(assert) {
    var result;
    assert.equal(Mob.extend({}, {
      a: 'b'
    }).a, 'b', 'can extend an object with the attributes of another');
    assert.equal(Mob.extend({
      a: 'x'
    }, {
      a: 'b'
    }).a, 'b', 'properties in source override destination');
    assert.equal(Mob.extend({
      x: 'x'
    }, {
      a: 'b'
    }).x, 'x', "properties not in source don't get overriden");
    result = Mob.extend({
      x: 'x'
    }, {
      a: 'a'
    }, {
      b: 'b'
    });
    assert.deepEqual(result, {
      x: 'x',
      a: 'a',
      b: 'b'
    }, 'can extend from multiple source objects');
    result = Mob.extend({
      x: 'x'
    }, {
      a: 'a',
      x: 2
    }, {
      a: 'b'
    });
    assert.deepEqual(result, {
      x: 2,
      a: 'b'
    }, 'extending from multiple source objects last property trumps');
    result = Mob.extend({}, {
      a: void 0,
      b: null
    });
    assert.deepEqual(Mob.keys(result), ['a', 'b'], 'extend copies undefined values');

    var F = function() {};
    F.prototype = {
      a: 'b'
    };
    var subObj = new F();
    subObj.c = 'd';
    assert.deepEqual(Mob.extend({}, subObj), {
      a: 'b',
      c: 'd'
    }, 'extend copies all properties from source');
    Mob.extend(subObj, {});
    assert.ok(!subObj.hasOwnProperty('a'), "extend does not convert destination object's 'in' properties to 'own' properties");

    try {
      result = {};
      Mob.extend(result, null, void 0, {
        a: 1
      });
    } catch (e) { /* ignored */ }

    assert.equal(result.a, 1, 'should not error on `null` or `undefined` sources');

    assert.strictEqual(Mob.extend(null, {
      a: 1
    }), null, 'extending null results in null');
    assert.strictEqual(Mob.extend(void 0, {
      a: 1
    }), void 0, 'extending undefined results in undefined');
  });

  QUnit.test('Mob .assign', function(assert) {
    var result;
    assert.equal(Mob.assign({}, {
      a: 'b'
    }).a, 'b', 'can assign an object with the attributes of another');
    assert.equal(Mob.assign({
      a: 'x'
    }, {
      a: 'b'
    }).a, 'b', 'properties in source override destination');
    assert.equal(Mob.assign({
      x: 'x'
    }, {
      a: 'b'
    }).x, 'x', "properties not in source don't get overriden");
    result = Mob.assign({
      x: 'x'
    }, {
      a: 'a'
    }, {
      b: 'b'
    });
    assert.deepEqual(result, {
      x: 'x',
      a: 'a',
      b: 'b'
    }, 'can assign from multiple source objects');
    result = Mob.assign({
      x: 'x'
    }, {
      a: 'a',
      x: 2
    }, {
      a: 'b'
    });
    assert.deepEqual(result, {
      x: 2,
      a: 'b'
    }, 'assigning from multiple source objects last property trumps');
    assert.deepEqual(Mob.assign({}, {
      a: void 0,
      b: null
    }), {
      a: void 0,
      b: null
    }, 'assign copies undefined values');

    var F = function() {};
    F.prototype = {
      a: 'b'
    };
    var subObj = new F();
    subObj.c = 'd';
    assert.deepEqual(Mob.assign({}, subObj), {
      c: 'd'
    }, 'assign copies own properties from source');

    result = {};
    assert.deepEqual(Mob.assign(result, null, void 0, {
      a: 1
    }), {
      a: 1
    }, 'should not error on `null` or `undefined` sources');

    Mob.each(['a', 5, null, false], function(val) {
      assert.strictEqual(Mob.assign(val, {
        a: 1
      }), val, 'assigning non-objects results in returning the non-object value');
    });

    assert.strictEqual(Mob.assign(void 0, {
      a: 1
    }), void 0, 'assigning undefined results in undefined');

    result = Mob.assign({
      a: 1,
      0: 2,
      1: '5',
      length: 6
    }, {
      0: 1,
      1: 2,
      length: 2
    });
    assert.deepEqual(result, {
      a: 1,
      0: 1,
      1: 2,
      length: 2
    }, 'assign should treat array-like objects like normal objects');
  });

  QUnit.test('Mob .pick', function(assert) {
    var result;
    result = Mob.pick({
      a: 1,
      b: 2,
      c: 3
    }, 'a', 'c');
    assert.deepEqual(result, {
      a: 1,
      c: 3
    }, 'can restrict properties to those named');
    result = Mob.pick({
      a: 1,
      b: 2,
      c: 3
    }, ['b', 'c']);
    assert.deepEqual(result, {
      b: 2,
      c: 3
    }, 'can restrict properties to those named in an array');
    result = Mob.pick({
      a: 1,
      b: 2,
      c: 3
    }, ['a'], 'b');
    assert.deepEqual(result, {
      a: 1,
      b: 2
    }, 'can restrict properties to those named in mixed args');
    result = Mob.pick(['a', 'b'], 1);
    assert.deepEqual(result, {
      1: 'b'
    }, 'can pick numeric properties');

    Mob.each([null, void 0], function(val) {
      assert.deepEqual(Mob.pick(val, 'hasOwnProperty'), {}, 'Called with null/undefined');
    });
    assert.deepEqual(Mob.pick(5, 'toString', 'b'), {
      toString: Number.prototype.toString
    }, 'can iterate primitives');

    var data = {
      a: 1,
      b: 2,
      c: 3
    };
    var callback = function(value, key, object) {
      assert.strictEqual(key, {
        1: 'a',
        2: 'b',
        3: 'c'
      }[value]);
      assert.strictEqual(object, data);
      return value !== this.value;
    };
    result = Mob.pick(data, callback, {
      value: 2
    });
    assert.deepEqual(result, {
      a: 1,
      c: 3
    }, 'can accept a predicate and context');

    var Obj = function() {};
    Obj.prototype = {
      a: 1,
      b: 2,
      c: 3
    };
    var instance = new Obj();
    assert.deepEqual(Mob.pick(instance, 'a', 'c'), {
      a: 1,
      c: 3
    }, 'include prototype props');

    assert.deepEqual(Mob.pick(data, function(val, key) {
      return this[key] === 3 && this === instance;
    }, instance), {
      c: 3
    }, 'function is given context');

    assert.ok(!Mob.has(Mob.pick({}, 'foo'), 'foo'), 'does not set own property if property not in object');
    Mob.pick(data, function(value, key, obj) {
      assert.equal(obj, data, 'passes same object as third parameter of iteratee');
    });
  });

  QUnit.test('Mob .omit', function(assert) {
    var result;
    result = Mob.omit({
      a: 1,
      b: 2,
      c: 3
    }, 'b');
    assert.deepEqual(result, {
      a: 1,
      c: 3
    }, 'can omit a single named property');
    result = Mob.omit({
      a: 1,
      b: 2,
      c: 3
    }, 'a', 'c');
    assert.deepEqual(result, {
      b: 2
    }, 'can omit several named properties');
    result = Mob.omit({
      a: 1,
      b: 2,
      c: 3
    }, ['b', 'c']);
    assert.deepEqual(result, {
      a: 1
    }, 'can omit properties named in an array');
    result = Mob.omit(['a', 'b'], 0);
    assert.deepEqual(result, {
      1: 'b'
    }, 'can omit numeric properties');

    assert.deepEqual(Mob.omit(null, 'a', 'b'), {}, 'non objects return empty object');
    assert.deepEqual(Mob.omit(void 0, 'toString'), {}, 'null/undefined return empty object');
    assert.deepEqual(Mob.omit(5, 'toString', 'b'), {}, 'returns empty object for primitives');

    var data = {
      a: 1,
      b: 2,
      c: 3
    };
    var callback = function(value, key, object) {
      assert.strictEqual(key, {
        1: 'a',
        2: 'b',
        3: 'c'
      }[value]);
      assert.strictEqual(object, data);
      return value !== this.value;
    };
    result = Mob.omit(data, callback, {
      value: 2
    });
    assert.deepEqual(result, {
      b: 2
    }, 'can accept a predicate');

    var Obj = function() {};
    Obj.prototype = {
      a: 1,
      b: 2,
      c: 3
    };
    var instance = new Obj();
    assert.deepEqual(Mob.omit(instance, 'b'), {
      a: 1,
      c: 3
    }, 'include prototype props');

    assert.deepEqual(Mob.omit(data, function(val, key) {
      return this[key] === 3 && this === instance;
    }, instance), {
      a: 1,
      b: 2
    }, 'function is given context');
  });

  QUnit.test('Mob .defaults', function(assert) {
    var options = {
      zero: 0,
      one: 1,
      empty: '',
      nan: NaN,
      nothing: null
    };

    Mob.defaults(options, {
      zero: 1,
      one: 10,
      twenty: 20,
      nothing: 'str'
    });
    assert.equal(options.zero, 0, 'value exists');
    assert.equal(options.one, 1, 'value exists');
    assert.equal(options.twenty, 20, 'default applied');
    assert.equal(options.nothing, null, "null isn't overridden");

    Mob.defaults(options, {
      empty: 'full'
    }, {
      nan: 'nan'
    }, {
      word: 'word'
    }, {
      word: 'dog'
    });
    assert.equal(options.empty, '', 'value exists');
    assert.ok(Mob.isNaN(options.nan), "NaN isn't overridden");
    assert.equal(options.word, 'word', 'new value is added, first one wins');

    try {
      options = {};
      Mob.defaults(options, null, void 0, {
        a: 1
      });
    } catch (e) { /* ignored */ }

    assert.equal(options.a, 1, 'should not error on `null` or `undefined` sources');

  });

  QUnit.test('Mob .clone', function(assert) {
    var moe = {
      name: 'moe',
      lucky: [13, 27, 34]
    };
    var clone = Mob.clone(moe);
    assert.equal(clone.name, 'moe', 'the clone as the attributes of the original');

    clone.name = 'curly';
    assert.ok(clone.name === 'curly' && moe.name === 'moe', 'clones can change shallow attributes without affecting the original');

    assert.equal(Mob.clone(void 0), void 0, 'non objects should not be changed by clone');
    assert.equal(Mob.clone(1), 1, 'non objects should not be changed by clone');
    assert.equal(Mob.clone(null), null, 'non objects should not be changed by clone');
  });

  QUnit.test('Mob .isEmpty', function(assert) {
    assert.ok(Mob.isEmpty([]), '[] is empty');
    assert.ok(!Mob.isEmpty({
      one: 1
    }), '{one: 1} is not empty');
    assert.ok(Mob.isEmpty({}), '{} is empty');
    assert.ok(Mob.isEmpty(new RegExp('')), 'objects with prototype properties are empty');
    assert.ok(Mob.isEmpty(null), 'null is empty');
    assert.ok(Mob.isEmpty(), 'undefined is empty');
    assert.ok(Mob.isEmpty(''), 'the empty string is empty');
    assert.ok(!Mob.isEmpty('moe'), 'but other strings are not');

    var obj = {
      one: 1
    };
    delete obj.one;
    assert.ok(Mob.isEmpty(obj), 'deleting all the keys from an object empties it');

    var args = function() {
      return arguments;
    };
    assert.ok(Mob.isEmpty(args()), 'empty arguments object is empty');
    assert.ok(!Mob.isEmpty(args('')), 'non-empty arguments object is not empty');

    // covers collecting non-enumerable properties in IE < 9
    var nonEnumProp = {
      toString: 5
    };
    assert.ok(!Mob.isEmpty(nonEnumProp), 'non-enumerable property is not empty');
  });

  if (typeof document === 'object') {
    QUnit.test('Mob .isElement', function(assert) {
      assert.ok(!Mob.isElement('div'), 'strings are not dom elements');
      assert.ok(Mob.isElement(testElement), 'an element is a DOM element');
    });
  }

  QUnit.test('Mob .isArguments', function(assert) {
    var args = (function() {
      return arguments;
    }(1, 2, 3));
    assert.ok(!Mob.isArguments('string'), 'a string is not an arguments object');
    assert.ok(!Mob.isArguments(Mob.isArguments), 'a function is not an arguments object');
    assert.ok(Mob.isArguments(args), 'but the arguments object is an arguments object');
    assert.ok(!Mob.isArguments(Mob.toArray(args)), 'but not when it\'s converted into an array');
    assert.ok(!Mob.isArguments([1, 2, 3]), 'and not vanilla arrays.');
  });

  QUnit.test('Mob .isObject', function(assert) {
    assert.ok(Mob.isObject(arguments), 'the arguments object is object');
    assert.ok(Mob.isObject([1, 2, 3]), 'and arrays');
    if (testElement) {
      assert.ok(Mob.isObject(testElement), 'and DOM element');
    }
    assert.ok(Mob.isObject(function() {}), 'and functions');
    assert.ok(!Mob.isObject(null), 'but not null');
    assert.ok(!Mob.isObject(void 0), 'and not undefined');
    assert.ok(!Mob.isObject('string'), 'and not string');
    assert.ok(!Mob.isObject(12), 'and not number');
    assert.ok(!Mob.isObject(true), 'and not boolean');
    assert.ok(Mob.isObject(new String('string')), 'but new String()');
  });

  QUnit.test('Mob .isArray', function(assert) {
    assert.ok(!Mob.isArray(void 0), 'undefined vars are not arrays');
    assert.ok(!Mob.isArray(arguments), 'the arguments object is not an array');
    assert.ok(Mob.isArray([1, 2, 3]), 'but arrays are');
  });

  QUnit.test('Mob .isString', function(assert) {
    var obj = new String('I am a string object');
    if (testElement) {
      assert.ok(!Mob.isString(testElement), 'an element is not a string');
    }
    assert.ok(Mob.isString([1, 2, 3].join(', ')), 'but strings are');
    assert.strictEqual(Mob.isString('I am a string literal'), true, 'string literals are');
    assert.ok(Mob.isString(obj), 'so are String objects');
    assert.strictEqual(Mob.isString(1), false);
  });

  QUnit.test('Mob .isNumber', function(assert) {
    assert.ok(!Mob.isNumber('string'), 'a string is not a number');
    assert.ok(!Mob.isNumber(arguments), 'the arguments object is not a number');
    assert.ok(!Mob.isNumber(void 0), 'undefined is not a number');
    assert.ok(Mob.isNumber(3 * 4 - 7 / 10), 'but numbers are');
    assert.ok(Mob.isNumber(NaN), 'NaN *is* a number');
    assert.ok(Mob.isNumber(Infinity), 'Infinity is a number');
    assert.ok(!Mob.isNumber('1'), 'numeric strings are not numbers');
  });

  QUnit.test('Mob .isBoolean', function(assert) {
    assert.ok(!Mob.isBoolean(2), 'a number is not a boolean');
    assert.ok(!Mob.isBoolean('string'), 'a string is not a boolean');
    assert.ok(!Mob.isBoolean('false'), 'the string "false" is not a boolean');
    assert.ok(!Mob.isBoolean('true'), 'the string "true" is not a boolean');
    assert.ok(!Mob.isBoolean(arguments), 'the arguments object is not a boolean');
    assert.ok(!Mob.isBoolean(void 0), 'undefined is not a boolean');
    assert.ok(!Mob.isBoolean(NaN), 'NaN is not a boolean');
    assert.ok(!Mob.isBoolean(null), 'null is not a boolean');
    assert.ok(Mob.isBoolean(true), 'but true is');
    assert.ok(Mob.isBoolean(false), 'and so is false');
  });

  QUnit.test('Mob .isFunction', function(assert) {
    assert.ok(!Mob.isFunction(void 0), 'undefined vars are not functions');
    assert.ok(!Mob.isFunction([1, 2, 3]), 'arrays are not functions');
    assert.ok(!Mob.isFunction('moe'), 'strings are not functions');
    assert.ok(Mob.isFunction(Mob.isFunction), 'but functions are');
    assert.ok(Mob.isFunction(function() {}), 'even anonymous ones');

    if (testElement) {
      assert.ok(!Mob.isFunction(testElement), 'elements are not functions');
    }

    var nodelist = typeof document != 'undefined' && document.childNodes;
    if (nodelist) {
      assert.ok(!Mob.isFunction(nodelist));
    }
  });

  QUnit.test('Mob .isDate', function(assert) {
    assert.ok(!Mob.isDate(100), 'numbers are not dates');
    assert.ok(!Mob.isDate({}), 'objects are not dates');
    assert.ok(Mob.isDate(new Date()), 'but dates are');
  });

  QUnit.test('Mob .isRegExp', function(assert) {
    assert.ok(!Mob.isRegExp(Mob.identity), 'functions are not RegExps');
    assert.ok(Mob.isRegExp(/identity/), 'but RegExps are');
  });

  QUnit.test('Mob .isNaN', function(assert) {
    assert.ok(!Mob.isNaN(void 0), 'undefined is not NaN');
    assert.ok(!Mob.isNaN(null), 'null is not NaN');
    assert.ok(!Mob.isNaN(0), '0 is not NaN');
    assert.ok(Mob.isNaN(NaN), 'but NaN is');
    assert.ok(Mob.isNaN(new Number(NaN)), 'wrapped NaN is still NaN');
  });

  QUnit.test('Mob .isNull', function(assert) {
    assert.ok(!Mob.isNull(void 0), 'undefined is not null');
    assert.ok(!Mob.isNull(NaN), 'NaN is not null');
    assert.ok(Mob.isNull(null), 'but null is');
  });

  QUnit.test('Mob .isUndefined', function(assert) {
    assert.ok(!Mob.isUndefined(1), 'numbers are defined');
    assert.ok(!Mob.isUndefined(null), 'null is defined');
    assert.ok(!Mob.isUndefined(false), 'false is defined');
    assert.ok(!Mob.isUndefined(NaN), 'NaN is defined');
    assert.ok(Mob.isUndefined(), 'nothing is undefined');
    assert.ok(Mob.isUndefined(void 0), 'undefined is undefined');
  });

  QUnit.test('Mob .isError', function(assert) {
    assert.ok(!Mob.isError(1), 'numbers are not Errors');
    assert.ok(!Mob.isError(null), 'null is not an Error');
    assert.ok(!Mob.isError(Error), 'functions are not Errors');
    assert.ok(Mob.isError(new Error()), 'Errors are Errors');
    assert.ok(Mob.isError(new EvalError()), 'EvalErrors are Errors');
    assert.ok(Mob.isError(new RangeError()), 'RangeErrors are Errors');
    assert.ok(Mob.isError(new ReferenceError()), 'ReferenceErrors are Errors');
    assert.ok(Mob.isError(new SyntaxError()), 'SyntaxErrors are Errors');
    assert.ok(Mob.isError(new TypeError()), 'TypeErrors are Errors');
    assert.ok(Mob.isError(new URIError()), 'URIErrors are Errors');
  });

  QUnit.test('Mob .has', function(assert) {
    var obj = {
      foo: 'bar',
      func: function() {}
    };
    assert.ok(Mob.has(obj, 'foo'), 'has() checks that the object has a property.');
    assert.ok(!Mob.has(obj, 'baz'), "has() returns false if the object doesn't have the property.");
    assert.ok(Mob.has(obj, 'func'), 'has() works for functions too.');
    obj.hasOwnProperty = null;
    assert.ok(Mob.has(obj, 'foo'), 'has() works even when the hasOwnProperty method is deleted.');
    var child = {};
    child.prototype = obj;
    assert.ok(!Mob.has(child, 'foo'), 'has() does not check the prototype chain for a property.');
    assert.strictEqual(Mob.has(null, 'foo'), false, 'has() returns false for null');
    assert.strictEqual(Mob.has(void 0, 'foo'), false, 'has() returns false for undefined');
  });

  QUnit.test('Mob .isMatch', function(assert) {
    var moe = {
      name: 'Moe Howard',
      hair: true
    };
    var curly = {
      name: 'Curly Howard',
      hair: false
    };

    assert.equal(Mob.isMatch(moe, {
      hair: true
    }), true, 'Returns a boolean');
    assert.equal(Mob.isMatch(curly, {
      hair: true
    }), false, 'Returns a boolean');

    assert.equal(Mob.isMatch(5, {
      __x__: void 0
    }), false, 'can match undefined props on primitives');
    assert.equal(Mob.isMatch({
      __x__: void 0
    }, {
      __x__: void 0
    }), true, 'can match undefined props');

    assert.equal(Mob.isMatch(null, {}), true, 'Empty spec called with null object returns true');
    assert.equal(Mob.isMatch(null, {
      a: 1
    }), false, 'Non-empty spec called with null object returns false');

    Mob.each([null, void 0], function(item) {
      assert.strictEqual(Mob.isMatch(item, null), true, 'null matches null');
    });
    Mob.each([null, void 0], function(item) {
      assert.strictEqual(Mob.isMatch(item, null), true, 'null matches {}');
    });
    assert.strictEqual(Mob.isMatch({
      b: 1
    }, {
      a: void 0
    }), false, 'handles undefined values (1683)');

    Mob.each([true, 5, NaN, null, void 0], function(item) {
      assert.strictEqual(Mob.isMatch({
        a: 1
      }, item), true, 'treats primitives as empty');
    });

    function Prototest() {}
    Prototest.prototype.x = 1;
    var specObj = new Prototest;
    assert.equal(Mob.isMatch({
      x: 2
    }, specObj), true, 'spec is restricted to own properties');

    specObj.y = 5;
    assert.equal(Mob.isMatch({
      x: 1,
      y: 5
    }, specObj), true);
    assert.equal(Mob.isMatch({
      x: 1,
      y: 4
    }, specObj), false);

    assert.ok(Mob.isMatch(specObj, {
      x: 1,
      y: 5
    }), 'inherited and own properties are checked on the test object');

    Prototest.x = 5;
    assert.ok(Mob.isMatch({
      x: 5,
      y: 1
    }, Prototest), 'spec can be a function');

  });

  QUnit.test('Mob .matcher', function(assert) {
    var moe = {
      name: 'Moe Howard',
      hair: true
    };
    var curly = {
      name: 'Curly Howard',
      hair: false
    };
    var stooges = [moe, curly];

    assert.equal(Mob.matcher({
      hair: true
    })(moe), true, 'Returns a boolean');
    assert.equal(Mob.matcher({
      hair: true
    })(curly), false, 'Returns a boolean');

    assert.equal(Mob.matcher({
      __x__: void 0
    })(5), false, 'can match undefined props on primitives');
    assert.equal(Mob.matcher({
      __x__: void 0
    })({
      __x__: void 0
    }), true, 'can match undefined props');

    assert.equal(Mob.matcher({})(null), true, 'Empty spec called with null object returns true');
    assert.equal(Mob.matcher({
      a: 1
    })(null), false, 'Non-empty spec called with null object returns false');

    assert.ok(Mob.find(stooges, Mob.matcher({
        hair: false
      })) === curly, 'returns a predicate that can be used by finding functions.');
    assert.ok(Mob.find(stooges, Mob.matcher(moe)) === moe, 'can be used to locate an object exists in a collection.');

    function Prototest() {}
    Prototest.prototype.x = 1;
    var specObj = new Prototest;
    var protospec = Mob.matcher(specObj);
    assert.equal(protospec({
      x: 2
    }), true, 'spec is restricted to own properties');

    specObj.y = 5;
    protospec = Mob.matcher(specObj);
    assert.equal(protospec({
      x: 1,
      y: 5
    }), true);
    assert.equal(protospec({
      x: 1,
      y: 4
    }), false);

    assert.ok(Mob.matcher({
      x: 1,
      y: 5
    })(specObj), 'inherited and own properties are checked on the test object');

    Prototest.x = 5;
    assert.ok(Mob.matcher(Prototest)({
      x: 5,
      y: 1
    }), 'spec can be a function');

    // #1729
    var o = {
      b: 1
    };
    var m = Mob.matcher(o);

    assert.equal(m({
      b: 1
    }), true);
    o.b = 2;
    o.a = 1;
    assert.equal(m({
      b: 1
    }), true, 'changing spec object doesnt change matches result');


    //null edge cases
    var oCon = Mob.matcher({
      constructor: Object
    });
    assert.deepEqual(Mob.map([null, void 0, 5, {}], oCon), [false, false, false, true], 'doesnt falsey match constructor on undefined/null');
  });

  QUnit.test('Mob .findKey', function(assert) {
    var objects = {
      a: {
        a: 0,
        b: 0
      },
      b: {
        a: 1,
        b: 1
      },
      c: {
        a: 2,
        b: 2
      }
    };

    assert.equal(Mob.findKey(objects, function(obj) {
      return obj.a === 0;
    }), 'a');

    assert.equal(Mob.findKey(objects, function(obj) {
      return obj.b * obj.a === 4;
    }), 'c');

    assert.equal(Mob.findKey(objects, 'a'), 'b', 'Uses lookupIterator');

    assert.equal(Mob.findKey(objects, function(obj) {
      return obj.b * obj.a === 5;
    }), void 0);

    assert.strictEqual(Mob.findKey([1, 2, 3, 4, 5, 6], function(obj) {
      return obj === 3;
    }), '2', 'Keys are strings');

    assert.strictEqual(Mob.findKey(objects, function(a) {
      return a.foo === null;
    }), void 0);

    Mob.findKey({
      a: {
        a: 1
      }
    }, function(a, key, obj) {
      assert.equal(key, 'a');
      assert.deepEqual(obj, {
        a: {
          a: 1
        }
      });
      assert.strictEqual(this, objects, 'called with context');
    }, objects);

    var array = [1, 2, 3, 4];
    array.match = 55;
    assert.strictEqual(Mob.findKey(array, function(x) {
      return x === 55;
    }), 'match', 'matches array-likes keys');
  });

})();