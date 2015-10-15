(function() {

  QUnit.module('mob/lang/collections');

  QUnit.test('Mob .each', function(assert) {
    Mob.each([1, 2, 3], function(num, i) {
      assert.equal(num, i + 1, 'each iterators provide value and iteration count');
    });

    var answers = [];
    Mob.each([1, 2, 3], function(num){ answers.push(num * this.multiplier); }, {multiplier: 5});
    assert.deepEqual(answers, [5, 10, 15], 'context object property accessed');

    answers = [];
    Mob.each([1, 2, 3], function(num){ answers.push(num); });

    answers = [];
    var obj = {one: 1, two: 2, three: 3};
    obj.constructor.prototype.four = 4;
    Mob.each(obj, function(value, key){ answers.push(key); });
    assert.deepEqual(answers, ['one', 'two', 'three'], 'iterating over objects works, and ignores the object prototype.');
    delete obj.constructor.prototype.four;

    // ensure the each function is JITed
    var count = 0;
    obj = {1: 'foo', 2: 'bar', 3: 'baz'};
    Mob.each(obj, function(){ count++; });
    assert.equal(count, 3, 'the fun should be called only 3 times');

    var answer = null;
    Mob.each([1, 2, 3], function(num, index, arr){ if (Mob.contains(arr, num)) answer = true; });
    assert.ok(answer, 'can reference the original collection from inside the iterator');

    answers = 0;
    Mob.each(null, function(){ ++answers; });
    assert.equal(answers, 0, 'handles a null properly');

    Mob.each(false, function(){});

    var a = [1, 2, 3];
    assert.strictEqual(Mob.each(a, function(){}), a);
    assert.strictEqual(Mob.each(null, function(){}), null);
  });

  QUnit.test('Mob .lookupIterator with contexts', function(assert) {
    Mob.each([true, false, 'yes', '', 0, 1, {}], function(context) {
      Mob.each([1], function() {
        assert.equal(this, context);
      }, context);
    });
  });

  QUnit.test('Mob .map', function(assert) {
    var doubled = Mob.map([1, 2, 3], function(num){ return num * 2; });
    assert.deepEqual(doubled, [2, 4, 6], 'doubled numbers');

    var tripled = Mob.map([1, 2, 3], function(num){ return num * this.multiplier; }, {multiplier: 3});
    assert.deepEqual(tripled, [3, 6, 9], 'tripled numbers with context');

    var ids = Mob.map({length: 2, 0: {id: '1'}, 1: {id: '2'}}, function(n){
      return n.id;
    });
    assert.deepEqual(ids, ['1', '2'], 'Can use collection methods on Array-likes.');

    assert.deepEqual(Mob.map(null, Mob.noop), [], 'handles a null properly');

    assert.deepEqual(Mob.map([1], function() {
      return this.length;
    }, [5]), [1], 'called with context');

    // Passing a property name like Mob.pluck.
    var people = [{name: 'moe', age: 30}, {name: 'curly', age: 50}];
    assert.deepEqual(Mob.map(people, 'name'), ['moe', 'curly'], 'predicate string map to object properties');
  });

  QUnit.test('Mob .reduce', function(assert) {
    var sum = Mob.reduce([1, 2, 3], function(memo, num){ return memo + num; }, 0);
    assert.equal(sum, 6, 'can sum up an array');

    var context = {multiplier: 3};
    sum = Mob.reduce([1, 2, 3], function(memo, num){ return memo + num * this.multiplier; }, 0, context);
    assert.equal(sum, 18, 'can reduce with a context object');

    sum = Mob.reduce([1, 2, 3], function(memo, num){ return memo + num; });
    assert.equal(sum, 6, 'default initial value');

    var prod = Mob.reduce([1, 2, 3, 4], function(memo, num){ return memo * num; });
    assert.equal(prod, 24, 'can reduce via multiplication');

    assert.ok(Mob.reduce(null, Mob.noop, 138) === 138, 'handles a null (with initial value) properly');
    assert.equal(Mob.reduce([], Mob.noop, void 0), void 0, 'undefined can be passed as a special case');
    assert.equal(Mob.reduce([Mob], Mob.noop), Mob, 'collection of length one with no initial value returns the first item');
    assert.equal(Mob.reduce([], Mob.noop), void 0, 'returns undefined when collection is empty and no initial value');
  });

  QUnit.test('Mob .reduceRight', function(assert) {
    var list = Mob.reduceRight(['foo', 'bar', 'baz'], function(memo, str){ return memo + str; }, '');
    assert.equal(list, 'bazbarfoo', 'can perform right folds');

    list = Mob.reduceRight(['foo', 'bar', 'baz'], function(memo, str){ return memo + str; });
    assert.equal(list, 'bazbarfoo', 'default initial value');

    var sum = Mob.reduceRight({a: 1, b: 2, c: 3}, function(memo, num){ return memo + num; });
    assert.equal(sum, 6, 'default initial value on object');

    assert.ok(Mob.reduceRight(null, Mob.noop, 138) === 138, 'handles a null (with initial value) properly');
    assert.equal(Mob.reduceRight([Mob], Mob.noop), Mob, 'collection of length one with no initial value returns the first item');

    assert.equal(Mob.reduceRight([], Mob.noop, void 0), void 0, 'undefined can be passed as a special case');
    assert.equal(Mob.reduceRight([], Mob.noop), void 0, 'returns undefined when collection is empty and no initial value');

    // Assert that the correct arguments are being passed.

    var args,
      init = {},
      object = {a: 1, b: 2},
      lastKey = Mob.keys(object).pop();

    var expected = lastKey === 'a'
      ? [init, 1, 'a', object]
      : [init, 2, 'b', object];

    Mob.reduceRight(object, function() {
      if (!args) args = Mob.toArray(arguments);
    }, init);

    assert.deepEqual(args, expected);

    // And again, with numeric keys.

    object = {2: 'a', 1: 'b'};
    lastKey = Mob.keys(object).pop();
    args = null;

    expected = lastKey === '2'
      ? [init, 'a', '2', object]
      : [init, 'b', '1', object];

    Mob.reduceRight(object, function() {
      if (!args) args = Mob.toArray(arguments);
    }, init);

    assert.deepEqual(args, expected);
  });

  QUnit.test('Mob .find', function(assert) {
    var array = [1, 2, 3, 4];
    assert.strictEqual(Mob.find(array, function(n) { return n > 2; }), 3, 'should return first found `value`');
    assert.strictEqual(Mob.find(array, function() { return false; }), void 0, 'should return `undefined` if `value` is not found');

    array.dontmatch = 55;
    assert.strictEqual(Mob.find(array, function(x) { return x === 55; }), void 0, 'iterates array-likes correctly');

    // Matching an object like Mob.findWhere.
    var list = [{a: 1, b: 2}, {a: 2, b: 2}, {a: 1, b: 3}, {a: 1, b: 4}, {a: 2, b: 4}];
    assert.deepEqual(Mob.find(list, {a: 1}), {a: 1, b: 2}, 'can be used as findWhere');
    assert.deepEqual(Mob.find(list, {b: 4}), {a: 1, b: 4});
    assert.ok(!Mob.find(list, {c: 1}), 'undefined when not found');
    assert.ok(!Mob.find([], {c: 1}), 'undefined when searching empty list');

    var result = Mob.find([1, 2, 3], function(num){ return num * 2 === 4; });
    assert.equal(result, 2, 'found the first "2" and broke the loop');

    var obj = {
      a: {x: 1, z: 3},
      b: {x: 2, z: 2},
      c: {x: 3, z: 4},
      d: {x: 4, z: 1}
    };

    assert.deepEqual(Mob.find(obj, {x: 2}), {x: 2, z: 2}, 'works on objects');
    assert.deepEqual(Mob.find(obj, {x: 2, z: 1}), void 0);
    assert.deepEqual(Mob.find(obj, function(x) {
      return x.x === 4;
    }), {x: 4, z: 1});

    Mob.findIndex([{a: 1}], function(a, key, o) {
      assert.equal(key, 0);
      assert.deepEqual(o, [{a: 1}]);
      assert.strictEqual(this, Mob, 'called with context');
    }, Mob);
  });

  QUnit.test('Mob .filter', function(assert) {
    var evenArray = [1, 2, 3, 4, 5, 6];
    var evenObject = {one: 1, two: 2, three: 3};
    var isEven = function(num){ return num % 2 === 0; };

    assert.deepEqual(Mob.filter(evenArray, isEven), [2, 4, 6]);
    assert.deepEqual(Mob.filter(evenObject, isEven), [2], 'can filter objects');
    assert.deepEqual(Mob.filter([{}, evenObject, []], 'two'), [evenObject], 'predicate string map to object properties');

    Mob.filter([1], function() {
      assert.equal(this, evenObject, 'given context');
    }, evenObject);

    // Can be used like Mob.where.
    var list = [{a: 1, b: 2}, {a: 2, b: 2}, {a: 1, b: 3}, {a: 1, b: 4}];
    assert.deepEqual(Mob.filter(list, {a: 1}), [{a: 1, b: 2}, {a: 1, b: 3}, {a: 1, b: 4}]);
    assert.deepEqual(Mob.filter(list, {b: 2}), [{a: 1, b: 2}, {a: 2, b: 2}]);
    assert.deepEqual(Mob.filter(list, {}), list, 'Empty object accepts all items');
  });

  QUnit.test('Mob .contains', function(assert) {
    Mob.each([null, void 0, 0, 1, NaN, {}, []], function(val) {
      assert.strictEqual(Mob.contains(val, 'hasOwnProperty'), false);
    });
    assert.strictEqual(Mob.contains([1, 2, 3], 2), true, 'two is in the array');
    assert.ok(!Mob.contains([1, 3, 9], 2), 'two is not in the array');

    assert.strictEqual(Mob.contains([5, 4, 3, 2, 1], 5, true), true, 'doesn\'t delegate to binary search');

    assert.ok(Mob.contains({moe: 1, larry: 3, curly: 9}, 3) === true, 'Mob.contains on objects checks their values');
  });

  QUnit.test('Mob .contains', function(assert) {

    var numbers = [1, 2, 3, 1, 2, 3, 1, 2, 3];
    assert.strictEqual(Mob.contains(numbers, 1, 1), true, 'contains takes a fromIndex');
    assert.strictEqual(Mob.contains(numbers, 1, -1), false, 'contains takes a fromIndex');
    assert.strictEqual(Mob.contains(numbers, 1, -2), false, 'contains takes a fromIndex');
    assert.strictEqual(Mob.contains(numbers, 1, -3), true, 'contains takes a fromIndex');
    assert.strictEqual(Mob.contains(numbers, 1, 6), true, 'contains takes a fromIndex');
    assert.strictEqual(Mob.contains(numbers, 1, 7), false, 'contains takes a fromIndex');

  });

  QUnit.test('Mob .contains with NaN', function(assert) {
    assert.strictEqual(Mob.contains([1, 2, NaN, NaN], NaN), true, 'Expected [1, 2, NaN] to contain NaN');
    assert.strictEqual(Mob.contains([1, 2, Infinity], NaN), false, 'Expected [1, 2, NaN] to contain NaN');
  });

  QUnit.test('Mob .contains with +- 0', function(assert) {
    Mob.each([-0, +0], function(val) {
      assert.strictEqual(Mob.contains([1, 2, val, val], val), true);
      assert.strictEqual(Mob.contains([1, 2, val, val], -val), true);
      assert.strictEqual(Mob.contains([-1, 1, 2], -val), false);
    });
  });


  QUnit.test('Mob .invoke', function(assert) {
    var list = [[5, 1, 7], [3, 2, 1]];
    var result = Mob.invoke(list, 'sort');
    assert.deepEqual(result[0], [1, 5, 7], 'first array sorted');
    assert.deepEqual(result[1], [1, 2, 3], 'second array sorted');

    Mob.invoke([{
      method: function() {
        assert.deepEqual(Mob.toArray(arguments), [1, 2, 3], 'called with arguments');
      }
    }], 'method', 1, 2, 3);

    assert.throws(function() {
      Mob.invoke([{a: 1}], 'a');
    }, TypeError, 'throws for non-functions');
  });

  QUnit.test('Mob .invoke w/ function reference', function(assert) {
    var list = [[5, 1, 7], [3, 2, 1]];
    var result = Mob.invoke(list, Array.prototype.sort);
    assert.deepEqual(result[0], [1, 5, 7], 'first array sorted');
    assert.deepEqual(result[1], [1, 2, 3], 'second array sorted');

    assert.deepEqual(Mob.invoke([1, 2, 3], function(a) {
      return a + this;
    }, 5), [6, 7, 8], 'receives params from invoke');
  });

  // Relevant when using ClojureScript
  QUnit.test('Mob .invoke when strings have a call method', function(assert) {
    String.prototype.call = function() {
      return 42;
    };
    var list = [[5, 1, 7], [3, 2, 1]];
    var s = 'foo';
    assert.equal(s.call(), 42, 'call function exists');
    var result = Mob.invoke(list, 'sort');
    assert.deepEqual(result[0], [1, 5, 7], 'first array sorted');
    assert.deepEqual(result[1], [1, 2, 3], 'second array sorted');
    delete String.prototype.call;
    assert.equal(s.call, void 0, 'call function removed');
  });

  QUnit.test('Mob .pluck', function(assert) {
    var people = [{name: 'moe', age: 30}, {name: 'curly', age: 50}];
    assert.deepEqual(Mob.pluck(people, 'name'), ['moe', 'curly'], 'pulls names out of objects');
    assert.deepEqual(Mob.pluck(people, 'address'), [void 0, void 0], 'missing properties are returned as undefined');
    //compat: most flexible handling of edge cases
    assert.deepEqual(Mob.pluck([{'[object Object]': 1}], {}), [1]);
  });

  QUnit.test('Mob .sortBy', function(assert) {
    var people = [{name: 'curly', age: 50}, {name: 'moe', age: 30}];
    people = Mob.sortBy(people, function(person){ return person.age; });
    assert.deepEqual(Mob.pluck(people, 'name'), ['moe', 'curly'], 'stooges sorted by age');

    var list = [void 0, 4, 1, void 0, 3, 2];
    assert.deepEqual(Mob.sortBy(list, Mob.identity), [1, 2, 3, 4, void 0, void 0], 'sortBy with undefined values');

    list = ['one', 'two', 'three', 'four', 'five'];
    var sorted = Mob.sortBy(list, 'length');
    assert.deepEqual(sorted, ['one', 'two', 'four', 'five', 'three'], 'sorted by length');

    function Pair(x, y) {
      this.x = x;
      this.y = y;
    }

    var stableArray = [
      new Pair(1, 1), new Pair(1, 2),
      new Pair(1, 3), new Pair(1, 4),
      new Pair(1, 5), new Pair(1, 6),
      new Pair(2, 1), new Pair(2, 2),
      new Pair(2, 3), new Pair(2, 4),
      new Pair(2, 5), new Pair(2, 6),
      new Pair(void 0, 1), new Pair(void 0, 2),
      new Pair(void 0, 3), new Pair(void 0, 4),
      new Pair(void 0, 5), new Pair(void 0, 6)
    ];

    var actual = Mob.sortBy(stableArray, function(pair) {
      return pair.x;
    });

    assert.deepEqual(actual, stableArray, 'sortBy should be stable for arrays');
    assert.deepEqual(Mob.sortBy(stableArray, 'x'), stableArray, 'sortBy accepts property string');

    list = ['q', 'w', 'e', 'r', 't', 'y'];
    assert.deepEqual(Mob.sortBy(list), ['e', 'q', 'r', 't', 'w', 'y'], 'uses Mob.identity if iterator is not specified');
  });

  QUnit.test('Mob .groupBy', function(assert) {
    var parity = Mob.groupBy([1, 2, 3, 4, 5, 6], function(num){ return num % 2; });
    assert.ok('0' in parity && '1' in parity, 'created a group for each value');
    assert.deepEqual(parity[0], [2, 4, 6], 'put each even number in the right group');

    var list = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    var grouped = Mob.groupBy(list, 'length');
    assert.deepEqual(grouped['3'], ['one', 'two', 'six', 'ten']);
    assert.deepEqual(grouped['4'], ['four', 'five', 'nine']);
    assert.deepEqual(grouped['5'], ['three', 'seven', 'eight']);

    var context = {};
    Mob.groupBy([{}], function(){ assert.ok(this === context); }, context);

    grouped = Mob.groupBy([4.2, 6.1, 6.4], function(num) {
      return Math.floor(num) > 4 ? 'hasOwnProperty' : 'constructor';
    });
    assert.equal(grouped.constructor.length, 1);
    assert.equal(grouped.hasOwnProperty.length, 2);

    var array = [{}];
    Mob.groupBy(array, function(value, index, obj){ assert.ok(obj === array); });

    array = [1, 2, 1, 2, 3];
    grouped = Mob.groupBy(array);
    assert.equal(grouped['1'].length, 2);
    assert.equal(grouped['3'].length, 1);

    var matrix = [
      [1, 2],
      [1, 3],
      [2, 3]
    ];
    assert.deepEqual(Mob.groupBy(matrix, 0), {1: [[1, 2], [1, 3]], 2: [[2, 3]]});
    assert.deepEqual(Mob.groupBy(matrix, 1), {2: [[1, 2]], 3: [[1, 3], [2, 3]]});
  });

  QUnit.test('Mob .indexBy', function(assert) {
    var parity = Mob.indexBy([1, 2, 3, 4, 5], function(num){ return num % 2 === 0; });
    assert.equal(parity['true'], 4);
    assert.equal(parity['false'], 5);

    var list = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    var grouped = Mob.indexBy(list, 'length');
    assert.equal(grouped['3'], 'ten');
    assert.equal(grouped['4'], 'nine');
    assert.equal(grouped['5'], 'eight');

    var array = [1, 2, 1, 2, 3];
    grouped = Mob.indexBy(array);
    assert.equal(grouped['1'], 1);
    assert.equal(grouped['2'], 2);
    assert.equal(grouped['3'], 3);
  });

  QUnit.test('Mob .countBy', function(assert) {
    var parity = Mob.countBy([1, 2, 3, 4, 5], function(num){ return num % 2 === 0; });
    assert.equal(parity['true'], 2);
    assert.equal(parity['false'], 3);

    var list = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    var grouped = Mob.countBy(list, 'length');
    assert.equal(grouped['3'], 4);
    assert.equal(grouped['4'], 3);
    assert.equal(grouped['5'], 3);

    var context = {};
    Mob.countBy([{}], function(){ assert.ok(this === context); }, context);

    grouped = Mob.countBy([4.2, 6.1, 6.4], function(num) {
      return Math.floor(num) > 4 ? 'hasOwnProperty' : 'constructor';
    });
    assert.equal(grouped.constructor, 1);
    assert.equal(grouped.hasOwnProperty, 2);

    var array = [{}];
    Mob.countBy(array, function(value, index, obj){ assert.ok(obj === array); });

    array = [1, 2, 1, 2, 3];
    grouped = Mob.countBy(array);
    assert.equal(grouped['1'], 2);
    assert.equal(grouped['3'], 1);
  });

  QUnit.test('Mob .toArray', function(assert) {
    assert.ok(!Mob.isArray(arguments), 'arguments object is not an array');
    assert.ok(Mob.isArray(Mob.toArray(arguments)), 'arguments object converted into array');
    var a = [1, 2, 3];
    assert.ok(Mob.toArray(a) !== a, 'array is cloned');
    assert.deepEqual(Mob.toArray(a), [1, 2, 3], 'cloned array contains same elements');

    var numbers = Mob.toArray({one: 1, two: 2, three: 3});
    assert.deepEqual(numbers, [1, 2, 3], 'object flattened into array');

    assert.deepEqual(Mob.toArray(''), [], 'empty string into empty array');

    if (typeof document != 'undefined') {
      // test in IE < 9
      var actual;
      try {
        actual = Mob.toArray(document.childNodes);
      } catch(e) { /* ignored */ }
      assert.deepEqual(actual, Mob.map(document.childNodes, Mob.identity), 'works on NodeList');
    }
  });

  QUnit.test('Mob .size', function(assert) {
    assert.equal(Mob.size({one: 1, two: 2, three: 3}), 3, 'can compute the size of an object');
    assert.equal(Mob.size([1, 2, 3]), 3, 'can compute the size of an array');
    assert.equal(Mob.size({length: 3, 0: 0, 1: 0, 2: 0}), 3, 'can compute the size of Array-likes');

    var func = function() {
      return Mob.size(arguments);
    };

    assert.equal(func(1, 2, 3, 4), 4, 'can test the size of the arguments object');

    assert.equal(Mob.size('hello'), 5, 'can compute the size of a string literal');
    assert.equal(Mob.size(new String('hello')), 5, 'can compute the size of string object');

    assert.equal(Mob.size(null), 0, 'handles nulls');
    assert.equal(Mob.size(0), 0, 'handles numbers');
  });

  if (typeof document != 'undefined') {
    QUnit.test('Mob .Can use various collection methods on NodeLists', function(assert) {
      var parent = document.createElement('div');
      parent.innerHTML = '<span id=id1></span>textnode<span id=id2></span>';

      var elementChildren = Mob.filter(parent.childNodes, Mob.isElement);
      assert.equal(elementChildren.length, 2);

      assert.deepEqual(Mob.map(elementChildren, 'id'), ['id1', 'id2']);
      assert.deepEqual(Mob.map(parent.childNodes, 'nodeType'), [1, 3, 1]);

    });
  }

})();