(function() {

  QUnit.module('mob/lang/functions');

  QUnit.config.asyncRetries = 3;

  QUnit.test('Mob .bind', function(assert) {
    var context = {
      name: 'moe'
    };
    var func = function(arg) {
      return 'name: ' + (this.name || arg);
    };
    var bound = Mob.bind(func, context);
    assert.equal(bound(), 'name: moe', 'can bind a function to a context');

    bound = Mob.bind(func, null, 'curly');
    var result = bound();
    // Work around a PhantomJS bug when applying a function with null|undefined.
    assert.ok(result === 'name: curly' || result === 'name: ' + window.name, 'can bind without specifying a context');

    func = function(salutation, name) {
      return salutation + ': ' + name;
    };
    func = Mob.bind(func, this, 'hello');
    assert.equal(func('moe'), 'hello: moe', 'the function was partially applied in advance');

    func = Mob.bind(func, this, 'curly');
    assert.equal(func(), 'hello: curly', 'the function was completely applied in advance');

    func = function(salutation, firstname, lastname) {
      return salutation + ': ' + firstname + ' ' + lastname;
    };
    func = Mob.bind(func, this, 'hello', 'moe', 'curly');
    assert.equal(func(), 'hello: moe curly', 'the function was partially applied in advance and can accept multiple arguments');

    func = function(ctx, message) {
      assert.equal(this, ctx, message);
    };
    Mob.bind(func, 0, 0, 'can bind a function to `0`')();
    Mob.bind(func, '', '', 'can bind a function to an empty string')();
    Mob.bind(func, false, false, 'can bind a function to `false`')();

    // These tests are only meaningful when using a browser without a native bind function
    // To test this with a modern browser, set underscore's nativeBind to undefined
    var F = function() {
      return this;
    };
    var boundf = Mob.bind(F, {
      hello: 'moe curly'
    });
    var Boundf = boundf; // make eslint happy.
    var newBoundf = new Boundf();
    assert.equal(newBoundf.hello, void 0, 'function should not be bound to the context, to comply with ECMAScript 5');
    assert.equal(boundf().hello, 'moe curly', "When called without the new operator, it's OK to be bound to the context");
    assert.ok(newBoundf instanceof F, 'a bound instance is an instance of the original function');

    assert.throws(function() {
      Mob.bind('notafunction');
    }, TypeError, 'throws an error when binding to a non-function');
  });

  QUnit.test('Mob .bindAll', function(assert) {
    var curly = {
        name: 'curly'
      },
      moe = {
        name: 'moe',
        getName: function() {
          return 'name: ' + this.name;
        },
        sayHi: function() {
          return 'hi: ' + this.name;
        }
      };
    curly.getName = moe.getName;
    Mob.bindAll(moe, 'getName', 'sayHi');
    curly.sayHi = moe.sayHi;
    assert.equal(curly.getName(), 'name: curly', 'unbound function is bound to current object');
    assert.equal(curly.sayHi(), 'hi: moe', 'bound function is still bound to original object');

    curly = {
      name: 'curly'
    };
    moe = {
      name: 'moe',
      getName: function() {
        return 'name: ' + this.name;
      },
      sayHi: function() {
        return 'hi: ' + this.name;
      },
      sayLast: function() {
        return this.sayHi();
      }
    };

    assert.throws(function() {
      Mob.bindAll(moe);
    }, Error, 'throws an error for bindAll with no functions named');
    assert.throws(function() {
      Mob.bindAll(moe, 'sayBye');
    }, TypeError, 'throws an error for bindAll if the given key is undefined');
    assert.throws(function() {
      Mob.bindAll(moe, 'name');
    }, TypeError, 'throws an error for bindAll if the given key is not a function');

    Mob.bindAll(moe, 'sayHi', 'sayLast');
    curly.sayHi = moe.sayHi;
    assert.equal(curly.sayHi(), 'hi: moe');

    var sayLast = moe.sayLast;
    assert.equal(sayLast(1, 2, 3, 4, 5, 6, 7, 'Tom'), 'hi: moe', 'createCallback works with any number of arguments');

    Mob.bindAll(moe, ['getName']);
    var getName = moe.getName;
    assert.equal(getName(), 'name: moe', 'flattens arguments into a single list');
  });

  QUnit.asyncTest('Mob .delay', 2, function(assert) {
    var delayed = false;
    Mob.delay(function() {
      delayed = true;
    }, 100);
    setTimeout(function() {
      assert.ok(!delayed, "didn't delay the function quite yet");
    }, 50);
    setTimeout(function() {
      assert.ok(delayed, 'delayed the function');
      start();
    }, 150);
  });

  QUnit.asyncTest('Mob .throttle', 2, function(assert) {
    var counter = 0;
    var incr = function() {
      counter++;
    };
    var throttledIncr = Mob.throttle(incr, 32);
    throttledIncr();
    throttledIncr();

    assert.equal(counter, 1, 'incr was called immediately');
    Mob.delay(function() {
      assert.equal(counter, 2, 'incr was throttled');
      start();
    }, 64);
  });

  QUnit.asyncTest('Mob .debounce', 1, function(assert) {
    var counter = 0;
    var incr = function() {
      counter++;
    };
    var debouncedIncr = Mob.debounce(incr, 32);
    debouncedIncr();
    debouncedIncr();
    Mob.delay(debouncedIncr, 16);
    Mob.delay(function() {
      assert.equal(counter, 1, 'incr was debounced');
      start();
    }, 96);
  });

  QUnit.test('Mob .once', function(assert) {
    var num = 0;
    var increment = Mob.once(function() {
      return ++num;
    });
    increment();
    increment();
    assert.equal(num, 1);

    assert.equal(increment(), 1, 'stores a memo to the last value');
  });

  QUnit.test('Mob .Recursive onced function.', 1, function(assert) {
    var f = Mob.once(function() {
      assert.ok(true);
      f();
    });
    f();
  });

  QUnit.test('Mob .negate', function(assert) {
    var isOdd = function(n) {
      return n & 1;
    };
    assert.equal(Mob.negate(isOdd)(2), true, 'should return the complement of the given function');
    assert.equal(Mob.negate(isOdd)(3), false, 'should return the complement of the given function');
  });

  QUnit.test('Mob .after', function(assert) {
    var testAfter = function(afterAmount, timesCalled) {
      var afterCalled = 0;
      var after = Mob.after(afterAmount, function() {
        afterCalled++;
      });
      while (timesCalled--) after();
      return afterCalled;
    };

    assert.equal(testAfter(5, 5), 1, 'after(N) should fire after being called N times');
    assert.equal(testAfter(5, 4), 0, 'after(N) should not fire unless called N times');
    assert.equal(testAfter(0, 0), 0, 'after(0) should not fire immediately');
    assert.equal(testAfter(0, 1), 1, 'after(0) should fire when first invoked');
  });

  QUnit.test('Mob .before', function(assert) {
    var testBefore = function(beforeAmount, timesCalled) {
      var beforeCalled = 0;
      var before = Mob.before(beforeAmount, function() {
        beforeCalled++;
      });
      while (timesCalled--) before();
      return beforeCalled;
    };

    assert.equal(testBefore(5, 5), 4, 'before(N) should not fire after being called N times');
    assert.equal(testBefore(5, 4), 4, 'before(N) should fire before being called N times');
    assert.equal(testBefore(0, 0), 0, 'before(0) should not fire immediately');
    assert.equal(testBefore(0, 1), 0, 'before(0) should not fire when first invoked');

  });

})();