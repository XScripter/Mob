(function() {

  QUnit.module('mob/lang/arrays');

  QUnit.test('Mob .rest', function(assert) {
    var numbers = [1, 2, 3, 4];
    assert.deepEqual(Mob.rest(numbers), [2, 3, 4], 'working rest()');
    assert.deepEqual(Mob.rest(numbers, 0), [1, 2, 3, 4], 'working rest(0)');
    assert.deepEqual(Mob.rest(numbers, 2), [3, 4], 'rest can take an index');
    var result = Mob.map([
      [1, 2, 3],
      [1, 2, 3]
    ], Mob.rest);
    assert.deepEqual(Mob.flatten(result), [2, 3, 2, 3], 'works well with Mob.map');
  });

  QUnit.test('Mob .flatten', function(assert) {
    assert.deepEqual(Mob.flatten(null), [], 'Flattens supports null');
    assert.deepEqual(Mob.flatten(void 0), [], 'Flattens supports undefined');

    assert.deepEqual(Mob.flatten([
      [],
      [
        []
      ],
      []
    ]), [], 'Flattens empty arrays');
    assert.deepEqual(Mob.flatten([
      [],
      [
        []
      ],
      []
    ], true), [
      []
    ], 'Flattens empty arrays');

    var list = [1, [2],
      [3, [
        [
          [4]
        ]
      ]]
    ];
    assert.deepEqual(Mob.flatten(list), [1, 2, 3, 4], 'can flatten nested arrays');
    assert.deepEqual(Mob.flatten(list, true), [1, 2, 3, [
      [
        [4]
      ]
    ]], 'can shallowly flatten nested arrays');
    var result = (function() {
      return Mob.flatten(arguments);
    }(1, [2], [3, [
      [
        [4]
      ]
    ]]));
    assert.deepEqual(result, [1, 2, 3, 4], 'works on an arguments object');
    list = [
      [1],
      [2],
      [3],
      [
        [4]
      ]
    ];
    assert.deepEqual(Mob.flatten(list, true), [1, 2, 3, [4]], 'can shallowly flatten arrays containing only other arrays');

  });

  QUnit.test('Mob .sortedIndex', function(assert) {
    var numbers = [10, 20, 30, 40, 50],
      num = 35;
    var indexForNum = Mob.sortedIndex(numbers, num);
    assert.equal(indexForNum, 3, '35 should be inserted at index 3');

    var indexFor30 = Mob.sortedIndex(numbers, 30);
    assert.equal(indexFor30, 2, '30 should be inserted at index 2');

    var objects = [{
      x: 10
    }, {
      x: 20
    }, {
      x: 30
    }, {
      x: 40
    }];
    var iterator = function(obj) {
      return obj.x;
    };
    assert.strictEqual(Mob.sortedIndex(objects, {
      x: 25
    }, iterator), 2);
    assert.strictEqual(Mob.sortedIndex(objects, {
      x: 35
    }, 'x'), 3);

    var context = {
      1: 2,
      2: 3,
      3: 4
    };
    iterator = function(obj) {
      return this[obj];
    };
    assert.strictEqual(Mob.sortedIndex([1, 3], 2, iterator, context), 1);

    var values = [0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767, 65535, 131071, 262143, 524287, 1048575, 2097151, 4194303, 8388607, 16777215, 33554431, 67108863, 134217727, 268435455, 536870911, 1073741823, 2147483647];
    var array = Array(Math.pow(2, 32) - 1);
    var length = values.length;
    while (length--) {
      array[values[length]] = values[length];
    }
    assert.equal(Mob.sortedIndex(array, 2147483648), 2147483648, 'should work with large indexes');
  });

  QUnit.test('Mob .uniq', function(assert) {
    var list = [1, 2, 1, 3, 1, 4];
    assert.deepEqual(Mob.uniq(list), [1, 2, 3, 4], 'can find the unique values of an unsorted array');

    list = [1, 1, 1, 2, 2, 3];
    assert.deepEqual(Mob.uniq(list, true), [1, 2, 3], 'can find the unique values of a sorted array faster');

    list = [{
      name: 'moe'
    }, {
      name: 'curly'
    }, {
      name: 'larry'
    }, {
      name: 'curly'
    }];
    var iterator = function(value) {
      return value.name;
    };
    assert.deepEqual(Mob.map(Mob.uniq(list, false, iterator), iterator), ['moe', 'curly', 'larry'], 'can find the unique values of an array using a custom iterator');

    assert.deepEqual(Mob.map(Mob.uniq(list, iterator), iterator), ['moe', 'curly', 'larry'], 'can find the unique values of an array using a custom iterator without specifying whether array is sorted');

    iterator = function(value) {
      return value + 1;
    };
    list = [1, 2, 2, 3, 4, 4];
    assert.deepEqual(Mob.uniq(list, true, iterator), [1, 2, 3, 4], 'iterator works with sorted array');

    var kittens = [{
      kitten: 'Celery',
      cuteness: 8
    }, {
      kitten: 'Juniper',
      cuteness: 10
    }, {
      kitten: 'Spottis',
      cuteness: 10
    }];

    var expected = [{
      kitten: 'Celery',
      cuteness: 8
    }, {
      kitten: 'Juniper',
      cuteness: 10
    }];

    assert.deepEqual(Mob.uniq(kittens, true, 'cuteness'), expected, 'string iterator works with sorted array');


    var result = (function() {
      return Mob.uniq(arguments);
    }(1, 2, 1, 3, 1, 4));
    assert.deepEqual(result, [1, 2, 3, 4], 'works on an arguments object');

    var a = {},
      b = {},
      c = {};
    assert.deepEqual(Mob.uniq([a, b, a, b, c]), [a, b, c], 'works on values that can be tested for equivalency but not ordered');

    assert.deepEqual(Mob.uniq(null), []);

    var context = {};
    list = [3];
    Mob.uniq(list, function(value, index, array) {
      assert.strictEqual(this, context);
      assert.strictEqual(value, 3);
      assert.strictEqual(index, 0);
      assert.strictEqual(array, list);
    }, context);

    assert.deepEqual(Mob.uniq([{
      a: 1,
      b: 1
    }, {
      a: 1,
      b: 2
    }, {
      a: 1,
      b: 3
    }, {
      a: 2,
      b: 1
    }], 'a'), [{
      a: 1,
      b: 1
    }, {
      a: 2,
      b: 1
    }], 'can use pluck like iterator');
    assert.deepEqual(Mob.uniq([{
      0: 1,
      b: 1
    }, {
      0: 1,
      b: 2
    }, {
      0: 1,
      b: 3
    }, {
      0: 2,
      b: 1
    }], 0), [{
      0: 1,
      b: 1
    }, {
      0: 2,
      b: 1
    }], 'can use falsey pluck like iterator');
  });

  QUnit.test('Mob .union', function(assert) {
    var result = Mob.union([1, 2, 3], [2, 30, 1], [1, 40]);
    assert.deepEqual(result, [1, 2, 3, 30, 40], 'takes the union of a list of arrays');

    result = Mob.union([1, 2, 3], [2, 30, 1], [1, 40, [1]]);
    assert.deepEqual(result, [1, 2, 3, 30, 40, [1]], 'takes the union of a list of nested arrays');

    var args = null;
    (function() {
      args = arguments;
    }(1, 2, 3));
    result = Mob.union(args, [2, 30, 1], [1, 40]);
    assert.deepEqual(result, [1, 2, 3, 30, 40], 'takes the union of a list of arrays');

    result = Mob.union([1, 2, 3], 4);
    assert.deepEqual(result, [1, 2, 3], 'restrict the union to arrays only');
  });

  QUnit.test('Mob .difference', function(assert) {
    var result = Mob.difference([1, 2, 3], [2, 30, 40]);
    assert.deepEqual(result, [1, 3], 'takes the difference of two arrays');

    result = Mob.difference([1, 2, 3, 4], [2, 30, 40], [1, 11, 111]);
    assert.deepEqual(result, [3, 4], 'takes the difference of three arrays');

    result = Mob.difference([1, 2, 3], 1);
    assert.deepEqual(result, [1, 2, 3], 'restrict the difference to arrays only');
  });

  QUnit.test('Mob .indexOf', function(assert) {
    var numbers = [1, 2, 3];
    assert.equal(Mob.indexOf(numbers, 2), 1, 'can compute indexOf');
    var result = (function() {
      return Mob.indexOf(arguments, 2);
    }(1, 2, 3));
    assert.equal(result, 1, 'works on an arguments object');

    Mob.each([null, void 0, [], false], function(val) {
      var msg = 'Handles: ' + (Mob.isArray(val) ? '[]' : val);
      assert.equal(Mob.indexOf(val, 2), -1, msg);
      assert.equal(Mob.indexOf(val, 2, -1), -1, msg);
      assert.equal(Mob.indexOf(val, 2, -20), -1, msg);
      assert.equal(Mob.indexOf(val, 2, 15), -1, msg);
    });

    var num = 35;
    numbers = [10, 20, 30, 40, 50];
    var index = Mob.indexOf(numbers, num, true);
    assert.equal(index, -1, '35 is not in the list');

    numbers = [10, 20, 30, 40, 50];
    num = 40;
    index = Mob.indexOf(numbers, num, true);
    assert.equal(index, 3, '40 is in the list');

    numbers = [1, 40, 40, 40, 40, 40, 40, 40, 50, 60, 70];
    num = 40;
    assert.equal(Mob.indexOf(numbers, num, true), 1, '40 is in the list');
    assert.equal(Mob.indexOf(numbers, 6, true), -1, '6 isnt in the list');
    assert.equal(Mob.indexOf([1, 2, 5, 4, 6, 7], 5, true), -1, 'sorted indexOf doesn\'t uses binary search');

    numbers = [1, 2, 3, 1, 2, 3, 1, 2, 3];
    index = Mob.indexOf(numbers, 2, 5);
    assert.equal(index, 7, 'supports the fromIndex argument');

    index = Mob.indexOf([, , , 0], void 0);
    assert.equal(index, 0, 'treats sparse arrays as if they were dense');

    var array = [1, 2, 3, 1, 2, 3];
    assert.strictEqual(Mob.indexOf(array, 1, -3), 3, 'neg `fromIndex` starts at the right index');
    assert.strictEqual(Mob.indexOf(array, 1, -2), -1, 'neg `fromIndex` starts at the right index');
    assert.strictEqual(Mob.indexOf(array, 2, -3), 4);
    Mob.each([-6, -8, -Infinity], function(fromIndex) {
      assert.strictEqual(Mob.indexOf(array, 1, fromIndex), 0);
    });
    assert.strictEqual(Mob.indexOf([1, 2, 3], 1, true), 0);

    index = Mob.indexOf([], void 0, true);
    assert.equal(index, -1, 'empty array with truthy `isSorted` returns -1');
  });

  QUnit.test('Mob .indexOf with NaN', function(assert) {
    assert.strictEqual(Mob.indexOf([1, 2, NaN, NaN], NaN), 2, 'Expected [1, 2, NaN] to contain NaN');
    assert.strictEqual(Mob.indexOf([1, 2, Infinity], NaN), -1, 'Expected [1, 2, NaN] to contain NaN');

    assert.strictEqual(Mob.indexOf([1, 2, NaN, NaN], NaN, 1), 2, 'startIndex does not affect result');
    assert.strictEqual(Mob.indexOf([1, 2, NaN, NaN], NaN, -2), 2, 'startIndex does not affect result');

    (function() {
      assert.strictEqual(Mob.indexOf(arguments, NaN), 2, 'Expected arguments [1, 2, NaN] to contain NaN');
    }(1, 2, NaN, NaN));
  });

  QUnit.test('Mob .indexOf with +- 0', function(assert) {
    Mob.each([-0, +0], function(val) {
      assert.strictEqual(Mob.indexOf([1, 2, val, val], val), 2);
      assert.strictEqual(Mob.indexOf([1, 2, val, val], -val), 2);
    });
  });

  QUnit.test('Mob .lastIndexOf', function(assert) {
    var numbers = [1, 0, 1];
    var falsey = [void 0, '', 0, false, NaN, null, void 0];
    assert.equal(Mob.lastIndexOf(numbers, 1), 2);

    numbers = [1, 0, 1, 0, 0, 1, 0, 0, 0];
    numbers.lastIndexOf = null;
    assert.equal(Mob.lastIndexOf(numbers, 1), 5, 'can compute lastIndexOf, even without the native function');
    assert.equal(Mob.lastIndexOf(numbers, 0), 8, 'lastIndexOf the other element');
    var result = (function() {
      return Mob.lastIndexOf(arguments, 1);
    }(1, 0, 1, 0, 0, 1, 0, 0, 0));
    assert.equal(result, 5, 'works on an arguments object');

    Mob.each([null, void 0, [], false], function(val) {
      var msg = 'Handles: ' + (Mob.isArray(val) ? '[]' : val);
      assert.equal(Mob.lastIndexOf(val, 2), -1, msg);
      assert.equal(Mob.lastIndexOf(val, 2, -1), -1, msg);
      assert.equal(Mob.lastIndexOf(val, 2, -20), -1, msg);
      assert.equal(Mob.lastIndexOf(val, 2, 15), -1, msg);
    });

    numbers = [1, 2, 3, 1, 2, 3, 1, 2, 3];
    var index = Mob.lastIndexOf(numbers, 2, 2);
    assert.equal(index, 1, 'supports the fromIndex argument');

    var array = [1, 2, 3, 1, 2, 3];

    assert.strictEqual(Mob.lastIndexOf(array, 1, 0), 0, 'starts at the correct from idx');
    assert.strictEqual(Mob.lastIndexOf(array, 3), 5, 'should return the index of the last matched value');
    assert.strictEqual(Mob.lastIndexOf(array, 4), -1, 'should return `-1` for an unmatched value');

    assert.strictEqual(Mob.lastIndexOf(array, 1, 2), 0, 'should work with a positive `fromIndex`');

    Mob.each([6, 8, Math.pow(2, 32), Infinity], function(fromIndex) {
      assert.strictEqual(Mob.lastIndexOf(array, void 0, fromIndex), -1);
      assert.strictEqual(Mob.lastIndexOf(array, 1, fromIndex), 3);
      assert.strictEqual(Mob.lastIndexOf(array, '', fromIndex), -1);
    });

    var expected = Mob.map(falsey, function(value) {
      return typeof value == 'number' ? -1 : 5;
    });

    var actual = Mob.map(falsey, function(fromIndex) {
      return Mob.lastIndexOf(array, 3, fromIndex);
    });

    assert.deepEqual(actual, expected, 'should treat falsey `fromIndex` values, except `0` and `NaN`, as `array.length`');
    assert.strictEqual(Mob.lastIndexOf(array, 3, '1'), 5, 'should treat non-number `fromIndex` values as `array.length`');
    assert.strictEqual(Mob.lastIndexOf(array, 3, true), 5, 'should treat non-number `fromIndex` values as `array.length`');

    assert.strictEqual(Mob.lastIndexOf(array, 2, -3), 1, 'should work with a negative `fromIndex`');
    assert.strictEqual(Mob.lastIndexOf(array, 1, -3), 3, 'neg `fromIndex` starts at the right index');

    assert.deepEqual(Mob.map([-6, -8, -Infinity], function(fromIndex) {
      return Mob.lastIndexOf(array, 1, fromIndex);
    }), [0, -1, -1]);
  });

  QUnit.test('Mob .lastIndexOf with NaN', function(assert) {
    assert.strictEqual(Mob.lastIndexOf([1, 2, NaN, NaN], NaN), 3, 'Expected [1, 2, NaN] to contain NaN');
    assert.strictEqual(Mob.lastIndexOf([1, 2, Infinity], NaN), -1, 'Expected [1, 2, NaN] to contain NaN');

    assert.strictEqual(Mob.lastIndexOf([1, 2, NaN, NaN], NaN, 2), 2, 'fromIndex does not affect result');
    assert.strictEqual(Mob.lastIndexOf([1, 2, NaN, NaN], NaN, -2), 2, 'fromIndex does not affect result');

    (function() {
      assert.strictEqual(Mob.lastIndexOf(arguments, NaN), 3, 'Expected arguments [1, 2, NaN] to contain NaN');
    }(1, 2, NaN, NaN));
  });

  QUnit.test('Mob .lastIndexOf with +- 0', function(assert) {
    Mob.each([-0, +0], function(val) {
      assert.strictEqual(Mob.lastIndexOf([1, 2, val, val], val), 3);
      assert.strictEqual(Mob.lastIndexOf([1, 2, val, val], -val), 3);
      assert.strictEqual(Mob.lastIndexOf([-1, 1, 2], -val), -1);
    });
  });

  QUnit.test('Mob .findIndex', function(assert) {
    var objects = [{
      a: 0,
      b: 0
    }, {
      a: 1,
      b: 1
    }, {
      a: 2,
      b: 2
    }, {
      a: 0,
      b: 0
    }];

    assert.equal(Mob.findIndex(objects, function(obj) {
      return obj.a === 0;
    }), 0);

    assert.equal(Mob.findIndex(objects, function(obj) {
      return obj.b * obj.a === 4;
    }), 2);

    assert.equal(Mob.findIndex(objects, 'a'), 1, 'Uses lookupIterator');

    assert.equal(Mob.findIndex(objects, function(obj) {
      return obj.b * obj.a === 5;
    }), -1);

    assert.equal(Mob.findIndex(null, Mob.noop), -1);
    assert.strictEqual(Mob.findIndex(objects, function(a) {
      return a.foo === null;
    }), -1);
    Mob.findIndex([{
      a: 1
    }], function(a, key, obj) {
      assert.equal(key, 0);
      assert.deepEqual(obj, [{
        a: 1
      }]);
      assert.strictEqual(this, objects, 'called with context');
    }, objects);

    var sparse = [];
    sparse[20] = {
      a: 2,
      b: 2
    };
    assert.equal(Mob.findIndex(sparse, function(obj) {
      return obj && obj.b * obj.a === 4;
    }), 20, 'Works with sparse arrays');

    var array = [1, 2, 3, 4];
    array.match = 55;
    assert.strictEqual(Mob.findIndex(array, function(x) {
      return x === 55;
    }), -1, 'doesn\'t match array-likes keys');
  });

  QUnit.test('Mob .findLastIndex', function(assert) {
    var objects = [{
      a: 0,
      b: 0
    }, {
      a: 1,
      b: 1
    }, {
      a: 2,
      b: 2
    }, {
      a: 0,
      b: 0
    }];

    assert.equal(Mob.findLastIndex(objects, function(obj) {
      return obj.a === 0;
    }), 3);

    assert.equal(Mob.findLastIndex(objects, function(obj) {
      return obj.b * obj.a === 4;
    }), 2);

    assert.equal(Mob.findLastIndex(objects, 'a'), 2, 'Uses lookupIterator');

    assert.equal(Mob.findLastIndex(objects, function(obj) {
      return obj.b * obj.a === 5;
    }), -1);

    assert.equal(Mob.findLastIndex(null, Mob.noop), -1);
    assert.strictEqual(Mob.findLastIndex(objects, function(a) {
      return a.foo === null;
    }), -1);
    Mob.findLastIndex([{
      a: 1
    }], function(a, key, obj) {
      assert.equal(key, 0);
      assert.deepEqual(obj, [{
        a: 1
      }]);
      assert.strictEqual(this, objects, 'called with context');
    }, objects);

    var sparse = [];
    sparse[20] = {
      a: 2,
      b: 2
    };
    assert.equal(Mob.findLastIndex(sparse, function(obj) {
      return obj && obj.b * obj.a === 4;
    }), 20, 'Works with sparse arrays');

    var array = [1, 2, 3, 4];
    array.match = 55;
    assert.strictEqual(Mob.findLastIndex(array, function(x) {
      return x === 55;
    }), -1, 'doesn\'t match array-likes keys');
  });

})();