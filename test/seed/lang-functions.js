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

  QUnit.test('Mob .partial', function(assert) {
    var obj = {
      name: 'moe'
    };
    var func = function() {
      return this.name + ' ' + Mob.toArray(arguments).join(' ');
    };

    obj.func = Mob.partial(func, 'a', 'b');
    assert.equal(obj.func('c', 'd'), 'moe a b c d', 'can partially apply');

    obj.func = Mob.partial(func, Mob, 'b', Mob, 'd');
    assert.equal(obj.func('a', 'c'), 'moe a b c d', 'can partially apply with placeholders');

    func = Mob.partial(function() {
      return arguments.length;
    }, Mob, 'b', Mob, 'd');
    assert.equal(func('a', 'c', 'e'), 5, 'accepts more arguments than the number of placeholders');
    assert.equal(func('a'), 4, 'accepts fewer arguments than the number of placeholders');

    func = Mob.partial(function() {
      return typeof arguments[2];
    }, Mob, 'b', Mob, 'd');
    assert.equal(func('a'), 'undefined', 'unfilled placeholders are undefined');

    // passes context
    function MyWidget(name, options) {
      this.name = name;
      this.options = options;
    }
    MyWidget.prototype.get = function() {
      return this.name;
    };
    var MyWidgetWithCoolOpts = Mob.partial(MyWidget, Mob, {
      a: 1
    });
    var widget = new MyWidgetWithCoolOpts('foo');
    assert.ok(widget instanceof MyWidget, 'Can partially bind a constructor');
    assert.equal(widget.get(), 'foo', 'keeps prototype');
    assert.deepEqual(widget.options, {
      a: 1
    });

    Mob.partial.placeholder = {};
    func = Mob.partial(function() {
      return arguments.length;
    }, obj, 'b', obj, 'd');
    assert.equal(func('a'), 5, 'swapping the placeholder preserves previously bound arguments');

    Mob.partial.placeholder = Mob;
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
        return this.sayHi(Mob.last(arguments));
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

  QUnit.test('Mob .memoize', function(assert) {
    var fib = function(n) {
      return n < 2 ? n : fib(n - 1) + fib(n - 2);
    };
    assert.equal(fib(10), 55, 'a memoized version of fibonacci produces identical results');
    fib = Mob.memoize(fib); // Redefine `fib` for memoization
    assert.equal(fib(10), 55, 'a memoized version of fibonacci produces identical results');

    var o = function(str) {
      return str;
    };
    var fastO = Mob.memoize(o);
    assert.equal(o('toString'), 'toString', 'checks hasOwnProperty');
    assert.equal(fastO('toString'), 'toString', 'checks hasOwnProperty');

    // Expose the cache.
    var upper = Mob.memoize(function(s) {
      return s.toUpperCase();
    });
    assert.equal(upper('foo'), 'FOO');
    assert.equal(upper('bar'), 'BAR');
    assert.deepEqual(upper.cache, {
      foo: 'FOO',
      bar: 'BAR'
    });
    upper.cache = {
      foo: 'BAR',
      bar: 'FOO'
    };
    assert.equal(upper('foo'), 'BAR');
    assert.equal(upper('bar'), 'FOO');

    var hashed = Mob.memoize(function(key) {
      //https://github.com/jashkenas/underscore/pull/1679#discussion_r13736209
      assert.ok(/[a-z]+/.test(key), 'hasher doesn\'t change keys');
      return key;
    }, function(key) {
      return key.toUpperCase();
    });
    hashed('yep');
    assert.deepEqual(hashed.cache, {
      YEP: 'yep'
    }, 'takes a hasher');

    // Test that the hash function can be used to swizzle the key.
    var objCacher = Mob.memoize(function(value, key) {
      return {
        key: key,
        value: value
      };
    }, function(value, key) {
      return key;
    });
    var myObj = objCacher('a', 'alpha');
    var myObjAlias = objCacher('b', 'alpha');
    assert.notStrictEqual(myObj, void 0, 'object is created if second argument used as key');
    assert.strictEqual(myObj, myObjAlias, 'object is cached if second argument used as key');
    assert.strictEqual(myObj.value, 'a', 'object is not modified if second argument used as key');
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

  QUnit.asyncTest('Mob .defer', 1, function(assert) {
    var deferred = false;
    Mob.defer(function(bool) {
      deferred = bool;
    }, true);
    Mob.delay(function() {
      assert.ok(deferred, 'deferred the function');
      start();
    }, 50);
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

  QUnit.test('Mob .wrap', function(assert) {
    var greet = function(name) {
      return 'hi: ' + name;
    };
    var backwards = Mob.wrap(greet, function(func, name) {
      return func(name) + ' ' + name.split('').reverse().join('');
    });
    assert.equal(backwards('moe'), 'hi: moe eom', 'wrapped the salutation function');

    var inner = function() {
      return 'Hello ';
    };
    var obj = {
      name: 'Moe'
    };
    obj.hi = Mob.wrap(inner, function(fn) {
      return fn() + this.name;
    });
    assert.equal(obj.hi(), 'Hello Moe');

    var noop = function() {};
    var wrapped = Mob.wrap(noop, function() {
      return Array.prototype.slice.call(arguments, 0);
    });
    var ret = wrapped(['whats', 'your'], 'vector', 'victor');
    assert.deepEqual(ret, [noop, ['whats', 'your'], 'vector', 'victor']);
  });

  QUnit.test('Mob .negate', function(assert) {
    var isOdd = function(n) {
      return n & 1;
    };
    assert.equal(Mob.negate(isOdd)(2), true, 'should return the complement of the given function');
    assert.equal(Mob.negate(isOdd)(3), false, 'should return the complement of the given function');
  });

  QUnit.test('Mob .compose', function(assert) {
    var greet = function(name) {
      return 'hi: ' + name;
    };
    var exclaim = function(sentence) {
      return sentence + '!';
    };
    var composed = Mob.compose(exclaim, greet);
    assert.equal(composed('moe'), 'hi: moe!', 'can compose a function that takes another');

    composed = Mob.compose(greet, exclaim);
    assert.equal(composed('moe'), 'hi: moe!', 'in this case, the functions are also commutative');

    // f(g(h(x, y, z)))
    function h(x, y, z) {
      assert.equal(arguments.length, 3, 'First function called with multiple args');
      return z * y;
    }

    function g(x) {
      assert.equal(arguments.length, 1, 'Composed function is called with 1 argument');
      return x;
    }

    function f(x) {
      assert.equal(arguments.length, 1, 'Composed function is called with 1 argument');
      return x * 2;
    }
    composed = Mob.compose(f, g, h);
    assert.equal(composed(1, 2, 3), 12);
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

    var context = {
      num: 0
    };
    var increment = Mob.before(3, function() {
      return ++this.num;
    });
    Mob.times(10, increment, context);
    assert.equal(increment(), 2, 'stores a memo to the last value');
    assert.equal(context.num, 2, 'provides context');
  });

  QUnit.test('Mob .iteratee', function(assert) {
    var identity = Mob.iteratee();
    assert.equal(identity, Mob.identity, 'Mob.iteratee is exposed as an external function.');

    function fn() {
      return arguments;
    }
    Mob.each([Mob.iteratee(fn), Mob.iteratee(fn, {})], function(cb) {
      assert.equal(cb().length, 0);
      assert.deepEqual(Mob.toArray(cb(1, 2, 3)), Mob.range(1, 4));
      assert.deepEqual(Mob.toArray(cb(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)), Mob.range(1, 11));
    });

  });

})();