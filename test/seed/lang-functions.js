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

  QUnit.asyncTest('Mob .throttle arguments', 2, function(assert) {
    var value = 0;
    var update = function(val) {
      value = val;
    };
    var throttledUpdate = Mob.throttle(update, 32);
    throttledUpdate(1);
    throttledUpdate(2);
    Mob.delay(function() {
      throttledUpdate(3);
    }, 64);
    assert.equal(value, 1, 'updated to latest value');
    Mob.delay(function() {
      assert.equal(value, 3, 'updated to latest value');
      start();
    }, 96);
  });

  QUnit.asyncTest('Mob .throttle once', 2, function(assert) {
    var counter = 0;
    var incr = function() {
      return ++counter;
    };
    var throttledIncr = Mob.throttle(incr, 32);
    var result = throttledIncr();
    Mob.delay(function() {
      assert.equal(result, 1, 'throttled functions return their value');
      assert.equal(counter, 1, 'incr was called once');
      start();
    }, 64);
  });

  QUnit.asyncTest('Mob .throttle twice', 1, function(assert) {
    var counter = 0;
    var incr = function() {
      counter++;
    };
    var throttledIncr = Mob.throttle(incr, 32);
    throttledIncr();
    throttledIncr();
    Mob.delay(function() {
      assert.equal(counter, 2, 'incr was called twice');
      start();
    }, 64);
  });

  QUnit.asyncTest('Mob .more throttling', 3, function(assert) {
    var counter = 0;
    var incr = function() {
      counter++;
    };
    var throttledIncr = Mob.throttle(incr, 30);
    throttledIncr();
    throttledIncr();
    assert.equal(counter, 1);
    Mob.delay(function() {
      assert.equal(counter, 2);
      throttledIncr();
      assert.equal(counter, 3);
      start();
    }, 85);
  });

  QUnit.asyncTest('Mob .throttle repeatedly with results', 6, function(assert) {
    var counter = 0;
    var incr = function() {
      return ++counter;
    };
    var throttledIncr = Mob.throttle(incr, 100);
    var results = [];
    var saveResult = function() {
      results.push(throttledIncr());
    };
    saveResult();
    saveResult();
    Mob.delay(saveResult, 50);
    Mob.delay(saveResult, 150);
    Mob.delay(saveResult, 160);
    Mob.delay(saveResult, 230);
    Mob.delay(function() {
      assert.equal(results[0], 1, 'incr was called once');
      assert.equal(results[1], 1, 'incr was throttled');
      assert.equal(results[2], 1, 'incr was throttled');
      assert.equal(results[3], 2, 'incr was called twice');
      assert.equal(results[4], 2, 'incr was throttled');
      assert.equal(results[5], 3, 'incr was called trailing');
      start();
    }, 300);
  });

  QUnit.asyncTest('Mob .throttle triggers trailing call when invoked repeatedly', 2, function(assert) {
    var counter = 0;
    var limit = 48;
    var incr = function() {
      counter++;
    };
    var throttledIncr = Mob.throttle(incr, 32);

    var stamp = new Date;
    while (new Date - stamp < limit) {
      throttledIncr();
    }
    var lastCount = counter;
    assert.ok(counter > 1);

    Mob.delay(function() {
      assert.ok(counter > lastCount);
      start();
    }, 96);
  });

  QUnit.asyncTest('Mob .throttle does not trigger leading call when leading is set to false', 2, function(assert) {
    var counter = 0;
    var incr = function() {
      counter++;
    };
    var throttledIncr = Mob.throttle(incr, 60, {
      leading: false
    });

    throttledIncr();
    throttledIncr();
    assert.equal(counter, 0);

    Mob.delay(function() {
      assert.equal(counter, 1);
      start();
    }, 96);
  });

  QUnit.asyncTest('Mob .more throttle does not trigger leading call when leading is set to false', 3, function(assert) {
    var counter = 0;
    var incr = function() {
      counter++;
    };
    var throttledIncr = Mob.throttle(incr, 100, {
      leading: false
    });

    throttledIncr();
    Mob.delay(throttledIncr, 50);
    Mob.delay(throttledIncr, 60);
    Mob.delay(throttledIncr, 200);
    assert.equal(counter, 0);

    Mob.delay(function() {
      assert.equal(counter, 1);
    }, 250);

    Mob.delay(function() {
      assert.equal(counter, 2);
      start();
    }, 350);
  });

  QUnit.asyncTest('Mob .one more throttle with leading: false test', 2, function(assert) {
    var counter = 0;
    var incr = function() {
      counter++;
    };
    var throttledIncr = Mob.throttle(incr, 100, {
      leading: false
    });

    var time = new Date;
    while (new Date - time < 350) throttledIncr();
    assert.ok(counter <= 3);

    Mob.delay(function() {
      assert.ok(counter <= 4);
      start();
    }, 200);
  });

  QUnit.asyncTest('Mob .throttle does not trigger trailing call when trailing is set to false', 4, function(assert) {
    var counter = 0;
    var incr = function() {
      counter++;
    };
    var throttledIncr = Mob.throttle(incr, 60, {
      trailing: false
    });

    throttledIncr();
    throttledIncr();
    throttledIncr();
    assert.equal(counter, 1);

    Mob.delay(function() {
      assert.equal(counter, 1);

      throttledIncr();
      throttledIncr();
      assert.equal(counter, 2);

      Mob.delay(function() {
        assert.equal(counter, 2);
        start();
      }, 96);
    }, 96);
  });

  QUnit.asyncTest('Mob .throttle continues to function after system time is set backwards', 2, function(assert) {
    var counter = 0;
    var incr = function() {
      counter++;
    };
    var throttledIncr = Mob.throttle(incr, 100);
    var origNowFunc = Mob.now;

    throttledIncr();
    assert.equal(counter, 1);
    Mob.now = function() {
      return new Date(2013, 0, 1, 1, 1, 1);
    };

    Mob.delay(function() {
      throttledIncr();
      assert.equal(counter, 2);
      start();
      Mob.now = origNowFunc;
    }, 200);
  });

  QUnit.asyncTest('Mob .throttle re-entrant', 2, function(assert) {
    var sequence = [
      ['b1', 'b2'],
      ['c1', 'c2']
    ];
    var value = '';
    var throttledAppend;
    var append = function(arg) {
      value += this + arg;
      var args = sequence.pop();
      if (args) {
        throttledAppend.call(args[0], args[1]);
      }
    };
    throttledAppend = Mob.throttle(append, 32);
    throttledAppend.call('a1', 'a2');
    assert.equal(value, 'a1a2');
    Mob.delay(function() {
      assert.equal(value, 'a1a2c1c2b1b2', 'append was throttled successfully');
      start();
    }, 100);
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

  QUnit.asyncTest('Mob .debounce asap', 4, function(assert) {
    var a, b;
    var counter = 0;
    var incr = function() {
      return ++counter;
    };
    var debouncedIncr = Mob.debounce(incr, 64, true);
    a = debouncedIncr();
    b = debouncedIncr();
    assert.equal(a, 1);
    assert.equal(b, 1);
    assert.equal(counter, 1, 'incr was called immediately');
    Mob.delay(debouncedIncr, 16);
    Mob.delay(debouncedIncr, 32);
    Mob.delay(debouncedIncr, 48);
    Mob.delay(function() {
      assert.equal(counter, 1, 'incr was debounced');
      start();
    }, 128);
  });

  QUnit.asyncTest('Mob .debounce asap recursively', 2, function(assert) {
    var counter = 0;
    var debouncedIncr = Mob.debounce(function() {
      counter++;
      if (counter < 10) debouncedIncr();
    }, 32, true);
    debouncedIncr();
    assert.equal(counter, 1, 'incr was called immediately');
    Mob.delay(function() {
      assert.equal(counter, 1, 'incr was debounced');
      start();
    }, 96);
  });

  QUnit.asyncTest('Mob .debounce after system time is set backwards', 2, function(assert) {
    var counter = 0;
    var origNowFunc = Mob.now;
    var debouncedIncr = Mob.debounce(function() {
      counter++;
    }, 100, true);

    debouncedIncr();
    assert.equal(counter, 1, 'incr was called immediately');

    Mob.now = function() {
      return new Date(2013, 0, 1, 1, 1, 1);
    };

    Mob.delay(function() {
      debouncedIncr();
      assert.equal(counter, 2, 'incr was debounced successfully');
      start();
      Mob.now = origNowFunc;
    }, 200);
  });

  QUnit.asyncTest('Mob .debounce re-entrant', 2, function(assert) {
    var sequence = [
      ['b1', 'b2']
    ];
    var value = '';
    var debouncedAppend;
    var append = function(arg) {
      value += this + arg;
      var args = sequence.pop();
      if (args) {
        debouncedAppend.call(args[0], args[1]);
      }
    };
    debouncedAppend = Mob.debounce(append, 32);
    debouncedAppend.call('a1', 'a2');
    assert.equal(value, '');
    Mob.delay(function() {
      assert.equal(value, 'a1a2b1b2', 'append was debounced successfully');
      start();
    }, 100);
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