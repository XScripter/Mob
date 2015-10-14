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

    function y() {}
    y.x = 'z';
    assert.deepEqual(Mob.allKeys(y), ['x'], 'should get keys from constructor');
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

  QUnit.test('Mob .pairs', function(assert) {
    assert.deepEqual(Mob.pairs({
      one: 1,
      two: 2
    }), [
      ['one', 1],
      ['two', 2]
    ], 'can convert an object into pairs');
    assert.deepEqual(Mob.pairs({
      one: 1,
      two: 2,
      length: 3
    }), [
      ['one', 1],
      ['two', 2],
      ['length', 3]
    ], '... even when one of them is "length"');
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

  QUnit.test('Mob .functions', function(assert) {
    var obj = {
      a: 'dash',
      b: Mob.map,
      c: /yo/,
      d: Mob.reduce
    };
    assert.deepEqual(['b', 'd'], Mob.functions(obj), 'can grab the function names of any passed-in object');

    var Animal = function() {};
    Animal.prototype.run = function() {};
    assert.deepEqual(Mob.functions(new Animal), ['run'], 'also looks up functions on the prototype');
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
      assert.deepEqual(Mob.pick(val, Mob.constant(true)), {});
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

    clone.lucky.push(101);
    assert.equal(Mob.last(moe.lucky), 101, 'changes to deep attributes are shared with the original');

    assert.equal(Mob.clone(void 0), void 0, 'non objects should not be changed by clone');
    assert.equal(Mob.clone(1), 1, 'non objects should not be changed by clone');
    assert.equal(Mob.clone(null), null, 'non objects should not be changed by clone');
  });

  QUnit.test('Mob .create', function(assert) {
    var Parent = function() {};
    Parent.prototype = {
      foo: function() {},
      bar: 2
    };

    Mob.each(['foo', null, void 0, 1], function(val) {
      assert.deepEqual(Mob.create(val), {}, 'should return empty object when a non-object is provided');
    });

    assert.ok(Mob.create([]) instanceof Array, 'should return new instance of array when array is provided');

    var Child = function() {};
    Child.prototype = Mob.create(Parent.prototype);
    assert.ok(new Child instanceof Parent, 'object should inherit prototype');

    var func = function() {};
    Child.prototype = Mob.create(Parent.prototype, {
      func: func
    });
    assert.strictEqual(Child.prototype.func, func, 'properties should be added to object');

    Child.prototype = Mob.create(Parent.prototype, {
      constructor: Child
    });
    assert.strictEqual(Child.prototype.constructor, Child);

    Child.prototype.foo = 'foo';
    var created = Mob.create(Child.prototype, new Child);
    assert.ok(!created.hasOwnProperty('foo'), 'should only add own properties');
  });

  QUnit.test('Mob .isEqual', function(assert) {
    function First() {
      this.value = 1;
    }
    First.prototype.value = 1;

    function Second() {
      this.value = 1;
    }
    Second.prototype.value = 2;

    // Basic equality and identity comparisons.
    assert.ok(Mob.isEqual(null, null), '`null` is equal to `null`');
    assert.ok(Mob.isEqual(), '`undefined` is equal to `undefined`');

    assert.ok(!Mob.isEqual(0, -0), '`0` is not equal to `-0`');
    assert.ok(!Mob.isEqual(-0, 0), 'Commutative equality is implemented for `0` and `-0`');
    assert.ok(!Mob.isEqual(null, void 0), '`null` is not equal to `undefined`');
    assert.ok(!Mob.isEqual(void 0, null), 'Commutative equality is implemented for `null` and `undefined`');

    // String object and primitive comparisons.
    assert.ok(Mob.isEqual('Curly', 'Curly'), 'Identical string primitives are equal');
    assert.ok(Mob.isEqual(new String('Curly'), new String('Curly')), 'String objects with identical primitive values are equal');
    assert.ok(Mob.isEqual(new String('Curly'), 'Curly'), 'String primitives and their corresponding object wrappers are equal');
    assert.ok(Mob.isEqual('Curly', new String('Curly')), 'Commutative equality is implemented for string objects and primitives');

    assert.ok(!Mob.isEqual('Curly', 'Larry'), 'String primitives with different values are not equal');
    assert.ok(!Mob.isEqual(new String('Curly'), new String('Larry')), 'String objects with different primitive values are not equal');
    assert.ok(!Mob.isEqual(new String('Curly'), {
      toString: function() {
        return 'Curly';
      }
    }), 'String objects and objects with a custom `toString` method are not equal');

    // Number object and primitive comparisons.
    assert.ok(Mob.isEqual(75, 75), 'Identical number primitives are equal');
    assert.ok(Mob.isEqual(new Number(75), new Number(75)), 'Number objects with identical primitive values are equal');
    assert.ok(Mob.isEqual(75, new Number(75)), 'Number primitives and their corresponding object wrappers are equal');
    assert.ok(Mob.isEqual(new Number(75), 75), 'Commutative equality is implemented for number objects and primitives');
    assert.ok(!Mob.isEqual(new Number(0), -0), '`new Number(0)` and `-0` are not equal');
    assert.ok(!Mob.isEqual(0, new Number(-0)), 'Commutative equality is implemented for `new Number(0)` and `-0`');

    assert.ok(!Mob.isEqual(new Number(75), new Number(63)), 'Number objects with different primitive values are not equal');
    assert.ok(!Mob.isEqual(new Number(63), {
      valueOf: function() {
        return 63;
      }
    }), 'Number objects and objects with a `valueOf` method are not equal');

    // Comparisons involving `NaN`.
    assert.ok(Mob.isEqual(NaN, NaN), '`NaN` is equal to `NaN`');
    assert.ok(Mob.isEqual(new Number(NaN), NaN), 'Object(`NaN`) is equal to `NaN`');
    assert.ok(!Mob.isEqual(61, NaN), 'A number primitive is not equal to `NaN`');
    assert.ok(!Mob.isEqual(new Number(79), NaN), 'A number object is not equal to `NaN`');
    assert.ok(!Mob.isEqual(Infinity, NaN), '`Infinity` is not equal to `NaN`');

    // Boolean object and primitive comparisons.
    assert.ok(Mob.isEqual(true, true), 'Identical boolean primitives are equal');
    assert.ok(Mob.isEqual(new Boolean, new Boolean), 'Boolean objects with identical primitive values are equal');
    assert.ok(Mob.isEqual(true, new Boolean(true)), 'Boolean primitives and their corresponding object wrappers are equal');
    assert.ok(Mob.isEqual(new Boolean(true), true), 'Commutative equality is implemented for booleans');
    assert.ok(!Mob.isEqual(new Boolean(true), new Boolean), 'Boolean objects with different primitive values are not equal');

    // Common type coercions.
    assert.ok(!Mob.isEqual(new Boolean(false), true), '`new Boolean(false)` is not equal to `true`');
    assert.ok(!Mob.isEqual('75', 75), 'String and number primitives with like values are not equal');
    assert.ok(!Mob.isEqual(new Number(63), new String(63)), 'String and number objects with like values are not equal');
    assert.ok(!Mob.isEqual(75, '75'), 'Commutative equality is implemented for like string and number values');
    assert.ok(!Mob.isEqual(0, ''), 'Number and string primitives with like values are not equal');
    assert.ok(!Mob.isEqual(1, true), 'Number and boolean primitives with like values are not equal');
    assert.ok(!Mob.isEqual(new Boolean(false), new Number(0)), 'Boolean and number objects with like values are not equal');
    assert.ok(!Mob.isEqual(false, new String('')), 'Boolean primitives and string objects with like values are not equal');
    assert.ok(!Mob.isEqual(12564504e5, new Date(2009, 9, 25)), 'Dates and their corresponding numeric primitive values are not equal');

    // Dates.
    assert.ok(Mob.isEqual(new Date(2009, 9, 25), new Date(2009, 9, 25)), 'Date objects referencing identical times are equal');
    assert.ok(!Mob.isEqual(new Date(2009, 9, 25), new Date(2009, 11, 13)), 'Date objects referencing different times are not equal');
    assert.ok(!Mob.isEqual(new Date(2009, 11, 13), {
      getTime: function() {
        return 12606876e5;
      }
    }), 'Date objects and objects with a `getTime` method are not equal');
    assert.ok(!Mob.isEqual(new Date('Curly'), new Date('Curly')), 'Invalid dates are not equal');

    // Functions.
    assert.ok(!Mob.isEqual(First, Second), 'Different functions with identical bodies and source code representations are not equal');

    // RegExps.
    assert.ok(Mob.isEqual(/(?:)/gim, /(?:)/gim), 'RegExps with equivalent patterns and flags are equal');
    assert.ok(Mob.isEqual(/(?:)/gi, /(?:)/ig), 'Flag order is not significant');
    assert.ok(!Mob.isEqual(/(?:)/g, /(?:)/gi), 'RegExps with equivalent patterns and different flags are not equal');
    assert.ok(!Mob.isEqual(/Moe/gim, /Curly/gim), 'RegExps with different patterns and equivalent flags are not equal');
    assert.ok(!Mob.isEqual(/(?:)/gi, /(?:)/g), 'Commutative equality is implemented for RegExps');
    assert.ok(!Mob.isEqual(/Curly/g, {
      source: 'Larry',
      global: true,
      ignoreCase: false,
      multiline: false
    }), 'RegExps and RegExp-like objects are not equal');

    // Empty arrays, array-like objects, and object literals.
    assert.ok(Mob.isEqual({}, {}), 'Empty object literals are equal');
    assert.ok(Mob.isEqual([], []), 'Empty array literals are equal');
    assert.ok(Mob.isEqual([{}], [{}]), 'Empty nested arrays and objects are equal');
    assert.ok(!Mob.isEqual({
      length: 0
    }, []), 'Array-like objects and arrays are not equal.');
    assert.ok(!Mob.isEqual([], {
      length: 0
    }), 'Commutative equality is implemented for array-like objects');

    assert.ok(!Mob.isEqual({}, []), 'Object literals and array literals are not equal');
    assert.ok(!Mob.isEqual([], {}), 'Commutative equality is implemented for objects and arrays');

    // Arrays with primitive and object values.
    assert.ok(Mob.isEqual([1, 'Larry', true], [1, 'Larry', true]), 'Arrays containing identical primitives are equal');
    assert.ok(Mob.isEqual([/Moe/g, new Date(2009, 9, 25)], [/Moe/g, new Date(2009, 9, 25)]), 'Arrays containing equivalent elements are equal');

    // Multi-dimensional arrays.
    var a = [new Number(47), false, 'Larry', /Moe/, new Date(2009, 11, 13), ['running', 'biking', new String('programming')], {
      a: 47
    }];
    var b = [new Number(47), false, 'Larry', /Moe/, new Date(2009, 11, 13), ['running', 'biking', new String('programming')], {
      a: 47
    }];
    assert.ok(Mob.isEqual(a, b), 'Arrays containing nested arrays and objects are recursively compared');

    // Overwrite the methods defined in ES 5.1 section 15.4.4.
    a.forEach = a.map = a.filter = a.every = a.indexOf = a.lastIndexOf = a.some = a.reduce = a.reduceRight = null;
    b.join = b.pop = b.reverse = b.shift = b.slice = b.splice = b.concat = b.sort = b.unshift = null;

    // Array elements and properties.
    assert.ok(Mob.isEqual(a, b), 'Arrays containing equivalent elements and different non-numeric properties are equal');
    a.push('White Rocks');
    assert.ok(!Mob.isEqual(a, b), 'Arrays of different lengths are not equal');
    a.push('East Boulder');
    b.push('Gunbarrel Ranch', 'Teller Farm');
    assert.ok(!Mob.isEqual(a, b), 'Arrays of identical lengths containing different elements are not equal');

    // Sparse arrays.
    assert.ok(Mob.isEqual(Array(3), Array(3)), 'Sparse arrays of identical lengths are equal');
    assert.ok(!Mob.isEqual(Array(3), Array(6)), 'Sparse arrays of different lengths are not equal when both are empty');

    var sparse = [];
    sparse[1] = 5;
    assert.ok(Mob.isEqual(sparse, [void 0, 5]), 'Handles sparse arrays as dense');

    // Simple objects.
    assert.ok(Mob.isEqual({
      a: 'Curly',
      b: 1,
      c: true
    }, {
      a: 'Curly',
      b: 1,
      c: true
    }), 'Objects containing identical primitives are equal');
    assert.ok(Mob.isEqual({
      a: /Curly/g,
      b: new Date(2009, 11, 13)
    }, {
      a: /Curly/g,
      b: new Date(2009, 11, 13)
    }), 'Objects containing equivalent members are equal');
    assert.ok(!Mob.isEqual({
      a: 63,
      b: 75
    }, {
      a: 61,
      b: 55
    }), 'Objects of identical sizes with different values are not equal');
    assert.ok(!Mob.isEqual({
      a: 63,
      b: 75
    }, {
      a: 61,
      c: 55
    }), 'Objects of identical sizes with different property names are not equal');
    assert.ok(!Mob.isEqual({
      a: 1,
      b: 2
    }, {
      a: 1
    }), 'Objects of different sizes are not equal');
    assert.ok(!Mob.isEqual({
      a: 1
    }, {
      a: 1,
      b: 2
    }), 'Commutative equality is implemented for objects');
    assert.ok(!Mob.isEqual({
      x: 1,
      y: void 0
    }, {
      x: 1,
      z: 2
    }), 'Objects with identical keys and different values are not equivalent');

    // `A` contains nested objects and arrays.
    a = {
      name: new String('Moe Howard'),
      age: new Number(77),
      stooge: true,
      hobbies: ['acting'],
      film: {
        name: 'Sing a Song of Six Pants',
        release: new Date(1947, 9, 30),
        stars: [new String('Larry Fine'), 'Shemp Howard'],
        minutes: new Number(16),
        seconds: 54
      }
    };

    // `B` contains equivalent nested objects and arrays.
    b = {
      name: new String('Moe Howard'),
      age: new Number(77),
      stooge: true,
      hobbies: ['acting'],
      film: {
        name: 'Sing a Song of Six Pants',
        release: new Date(1947, 9, 30),
        stars: [new String('Larry Fine'), 'Shemp Howard'],
        minutes: new Number(16),
        seconds: 54
      }
    };
    assert.ok(Mob.isEqual(a, b), 'Objects with nested equivalent members are recursively compared');

    // Instances.
    assert.ok(Mob.isEqual(new First, new First), 'Object instances are equal');
    assert.ok(!Mob.isEqual(new First, new Second), 'Objects with different constructors and identical own properties are not equal');
    assert.ok(!Mob.isEqual({
      value: 1
    }, new First), 'Object instances and objects sharing equivalent properties are not equal');
    assert.ok(!Mob.isEqual({
      value: 2
    }, new Second), 'The prototype chain of objects should not be examined');

    // Circular Arrays.
    (a = []).push(a);
    (b = []).push(b);
    assert.ok(Mob.isEqual(a, b), 'Arrays containing circular references are equal');
    a.push(new String('Larry'));
    b.push(new String('Larry'));
    assert.ok(Mob.isEqual(a, b), 'Arrays containing circular references and equivalent properties are equal');
    a.push('Shemp');
    b.push('Curly');
    assert.ok(!Mob.isEqual(a, b), 'Arrays containing circular references and different properties are not equal');

    // More circular arrays #767.
    a = ['everything is checked but', 'this', 'is not'];
    a[1] = a;
    b = ['everything is checked but', ['this', 'array'], 'is not'];
    assert.ok(!Mob.isEqual(a, b), 'Comparison of circular references with non-circular references are not equal');

    // Circular Objects.
    a = {
      abc: null
    };
    b = {
      abc: null
    };
    a.abc = a;
    b.abc = b;
    assert.ok(Mob.isEqual(a, b), 'Objects containing circular references are equal');
    a.def = 75;
    b.def = 75;
    assert.ok(Mob.isEqual(a, b), 'Objects containing circular references and equivalent properties are equal');
    a.def = new Number(75);
    b.def = new Number(63);
    assert.ok(!Mob.isEqual(a, b), 'Objects containing circular references and different properties are not equal');

    // More circular objects #767.
    a = {
      everything: 'is checked',
      but: 'this',
      is: 'not'
    };
    a.but = a;
    b = {
      everything: 'is checked',
      but: {
        that: 'object'
      },
      is: 'not'
    };
    assert.ok(!Mob.isEqual(a, b), 'Comparison of circular references with non-circular object references are not equal');

    // Cyclic Structures.
    a = [{
      abc: null
    }];
    b = [{
      abc: null
    }];
    (a[0].abc = a).push(a);
    (b[0].abc = b).push(b);
    assert.ok(Mob.isEqual(a, b), 'Cyclic structures are equal');
    a[0].def = 'Larry';
    b[0].def = 'Larry';
    assert.ok(Mob.isEqual(a, b), 'Cyclic structures containing equivalent properties are equal');
    a[0].def = new String('Larry');
    b[0].def = new String('Curly');
    assert.ok(!Mob.isEqual(a, b), 'Cyclic structures containing different properties are not equal');

    // Complex Circular References.
    a = {
      foo: {
        b: {
          foo: {
            c: {
              foo: null
            }
          }
        }
      }
    };
    b = {
      foo: {
        b: {
          foo: {
            c: {
              foo: null
            }
          }
        }
      }
    };
    a.foo.b.foo.c.foo = a;
    b.foo.b.foo.c.foo = b;
    assert.ok(Mob.isEqual(a, b), 'Cyclic structures with nested and identically-named properties are equal');

    // Objects without a `constructor` property
    if (Object.create) {
      a = Object.create(null, {
        x: {
          value: 1,
          enumerable: true
        }
      });
      b = {
        x: 1
      };
      assert.ok(Mob.isEqual(a, b), 'Handles objects without a constructor (e.g. from Object.create');
    }

    function Foo() {
      this.a = 1;
    }
    Foo.prototype.constructor = null;

    var other = {
      a: 1
    };
    assert.strictEqual(Mob.isEqual(new Foo, other), false, 'Objects from different constructors are not equal');


    // Tricky object cases val comparisions
    assert.equal(Mob.isEqual([0], [-0]), false);
    assert.equal(Mob.isEqual({
      a: 0
    }, {
      a: -0
    }), false);
    assert.equal(Mob.isEqual([NaN], [NaN]), true);
    assert.equal(Mob.isEqual({
      a: NaN
    }, {
      a: NaN
    }), true);
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

  QUnit.test('Mob .isFinite', function(assert) {
    assert.ok(!Mob.isFinite(void 0), 'undefined is not finite');
    assert.ok(!Mob.isFinite(null), 'null is not finite');
    assert.ok(!Mob.isFinite(NaN), 'NaN is not finite');
    assert.ok(!Mob.isFinite(Infinity), 'Infinity is not finite');
    assert.ok(!Mob.isFinite(-Infinity), '-Infinity is not finite');
    assert.ok(Mob.isFinite('12'), 'Numeric strings are numbers');
    assert.ok(!Mob.isFinite('1a'), 'Non numeric strings are not numbers');
    assert.ok(!Mob.isFinite(''), 'Empty strings are not numbers');
    var obj = new Number(5);
    assert.ok(Mob.isFinite(obj), 'Number instances can be finite');
    assert.ok(Mob.isFinite(0), '0 is finite');
    assert.ok(Mob.isFinite(123), 'Ints are finite');
    assert.ok(Mob.isFinite(-12.44), 'Floats are finite');
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

  QUnit.test('Mob .tap', function(assert) {
    var intercepted = null;
    var interceptor = function(obj) {
      intercepted = obj;
    };
    var returned = Mob.tap(1, interceptor);
    assert.equal(intercepted, 1, 'passes tapped object to interceptor');
    assert.equal(returned, 1, 'returns tapped object');
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

    //null edge cases
    var oCon = {
      constructor: Object
    };
    assert.deepEqual(Mob.map([null, void 0, 5, {}], Mob.partial(Mob.isMatch, Mob, oCon)), [false, false, false, true], 'doesnt falsey match constructor on undefined/null');
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
    assert.deepEqual(Mob.where([null, void 0], {
      a: 1
    }), [], 'Do not throw on null values.');

    assert.deepEqual(Mob.where([null, void 0], null), [null, void 0], 'null matches null');
    assert.deepEqual(Mob.where([null, void 0], {}), [null, void 0], 'null matches {}');
    assert.deepEqual(Mob.where([{
      b: 1
    }], {
      a: void 0
    }), [], 'handles undefined values (1683)');

    Mob.each([true, 5, NaN, null, void 0], function(item) {
      assert.deepEqual(Mob.where([{
        a: 1
      }], item), [{
        a: 1
      }], 'treats primitives as empty');
    });

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


  QUnit.test('Mob .mapObject', function(assert) {
    var obj = {
      a: 1,
      b: 2
    };
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

    assert.deepEqual(Mob.mapObject(obj, function(val) {
      return val * 2;
    }), {
      a: 2,
      b: 4
    }, 'simple objects');

    assert.deepEqual(Mob.mapObject(objects, function(val) {
      return Mob.reduce(val, function(memo, v) {
        return memo + v;
      }, 0);
    }), {
      a: 0,
      b: 2,
      c: 4
    }, 'nested objects');

    assert.deepEqual(Mob.mapObject(obj, function(val, key, o) {
      return o[key] * 2;
    }), {
      a: 2,
      b: 4
    }, 'correct keys');

    assert.deepEqual(Mob.mapObject([1, 2], function(val) {
      return val * 2;
    }), {
      0: 2,
      1: 4
    }, 'check behavior for arrays');

    assert.deepEqual(Mob.mapObject(obj, function(val) {
      return val * this.multiplier;
    }, {
      multiplier: 3
    }), {
      a: 3,
      b: 6
    }, 'keep context');

    assert.deepEqual(Mob.mapObject({
      a: 1
    }, function() {
      return this.length;
    }, [1, 2]), {
      a: 2
    }, 'called with context');

    var ids = Mob.mapObject({
      length: 2,
      0: {
        id: '1'
      },
      1: {
        id: '2'
      }
    }, function(n) {
      return n.id;
    });
    assert.deepEqual(ids, {
      length: void 0,
      0: '1',
      1: '2'
    }, 'Check with array-like objects');

    // Passing a property name like Mob.pluck.
    var people = {
      a: {
        name: 'moe',
        age: 30
      },
      b: {
        name: 'curly',
        age: 50
      }
    };
    assert.deepEqual(Mob.mapObject(people, 'name'), {
      a: 'moe',
      b: 'curly'
    }, 'predicate string map to object properties');

    Mob.each([null, void 0, 1, 'abc', [], {}, void 0], function(val) {
      assert.deepEqual(Mob.mapObject(val, Mob.identity), {}, 'mapValue identity');
    });

    var Proto = function() {
      this.a = 1;
    };
    Proto.prototype.b = 1;
    var protoObj = new Proto();
    assert.deepEqual(Mob.mapObject(protoObj, Mob.identity), {
      a: 1
    }, 'ignore inherited values from prototypes');

  });

})();