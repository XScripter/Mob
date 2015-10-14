(function() {

  QUnit.module('mob/lang/utility');

  QUnit.test('Mob .identity', function(assert) {
    var stooge = {
      name: 'moe'
    };
    assert.equal(Mob.identity(stooge), stooge, 'stooge is the same as his identity');
  });

  QUnit.test('Mob .constant', function(assert) {
    var stooge = {
      name: 'moe'
    };
    assert.equal(Mob.constant(stooge)(), stooge, 'should create a function that returns stooge');
  });

  QUnit.test('Mob .noop', function(assert) {
    assert.strictEqual(Mob.noop('curly', 'larry', 'moe'), void 0, 'should always return undefined');
  });

  QUnit.test('Mob .property', function(assert) {
    var stooge = {
      name: 'moe'
    };
    assert.equal(Mob.property('name')(stooge), 'moe', 'should return the property with the given name');
    assert.equal(Mob.property('name')(null), void 0, 'should return undefined for null values');
    assert.equal(Mob.property('name')(void 0), void 0, 'should return undefined for undefined values');
  });

  QUnit.test('Mob .propertyOf', function(assert) {
    var stoogeRanks = Mob.propertyOf({
      curly: 2,
      moe: 1,
      larry: 3
    });
    assert.equal(stoogeRanks('curly'), 2, 'should return the property with the given name');
    assert.equal(stoogeRanks(null), void 0, 'should return undefined for null values');
    assert.equal(stoogeRanks(void 0), void 0, 'should return undefined for undefined values');

    function MoreStooges() {
      this.shemp = 87;
    }
    MoreStooges.prototype = {
      curly: 2,
      moe: 1,
      larry: 3
    };
    var moreStoogeRanks = Mob.propertyOf(new MoreStooges());
    assert.equal(moreStoogeRanks('curly'), 2, 'should return properties from further up the prototype chain');

    var nullPropertyOf = Mob.propertyOf(null);
    assert.equal(nullPropertyOf('curly'), void 0, 'should return undefined when obj is null');

    var undefPropertyOf = Mob.propertyOf(void 0);
    assert.equal(undefPropertyOf('curly'), void 0, 'should return undefined when obj is undefined');
  });

  QUnit.test('Mob .random', function(assert) {
    var array = Mob.range(1000);
    var min = Math.pow(2, 31);
    var max = Math.pow(2, 62);

    assert.ok(Mob.every(array, function() {
      return Mob.random(min, max) >= min;
    }), 'should produce a random number greater than or equal to the minimum number');

    assert.ok(Mob.some(array, function() {
      return Mob.random(Number.MAX_VALUE) > 0;
    }), 'should produce a random number when passed `Number.MAX_VALUE`');
  });

  QUnit.test('Mob .now', function(assert) {
    var diff = Mob.now() - new Date().getTime();
    assert.ok(diff <= 0 && diff > -5, 'Produces the correct time in milliseconds'); //within 5ms
  });

  QUnit.test('Mob .uniqueId', function(assert) {
    var ids = [],
      i = 0;
    while (i++ < 100) ids.push(Mob.uniqueId());
    assert.equal(Mob.uniq(ids).length, ids.length, 'can generate a globally-unique stream of ids');
  });

  QUnit.test('Mob .times', function(assert) {
    var vals = [];
    Mob.times(3, function(i) {
      vals.push(i);
    });
    assert.deepEqual(vals, [0, 1, 2], 'is 0 indexed');

    // collects return values
    assert.deepEqual([0, 1, 2], Mob.times(3, function(i) {
      return i;
    }), 'collects return values');

    assert.deepEqual(Mob.times(0, Mob.identity), []);
    assert.deepEqual(Mob.times(-1, Mob.identity), []);
    assert.deepEqual(Mob.times(parseFloat('-Infinity'), Mob.identity), []);
  });

  QUnit.test('Mob .escape', function(assert) {
    assert.equal(Mob.escape(null), '');
  });

  QUnit.test('Mob .unescape', function(assert) {
    var string = 'Curly & Moe';
    assert.equal(Mob.unescape(null), '');
    assert.equal(Mob.unescape(Mob.escape(string)), string);
    assert.equal(Mob.unescape(string), string, 'don\'t unescape unnecessarily');
  });

  // Don't care what they escape them to just that they're escaped and can be unescaped
  QUnit.test('Mob .escape & unescape', function(assert) {
    // test & (&amp;) seperately obviously
    var escapeCharacters = ['<', '>', '"', '\'', '`'];

    Mob.each(escapeCharacters, function(escapeChar) {
      var s = 'a ' + escapeChar + ' string escaped';
      var e = Mob.escape(s);
      assert.notEqual(s, e, escapeChar + ' is escaped');
      assert.equal(s, Mob.unescape(e), escapeChar + ' can be unescaped');

      s = 'a ' + escapeChar + escapeChar + escapeChar + 'some more string' + escapeChar;
      e = Mob.escape(s);

      assert.equal(e.indexOf(escapeChar), -1, 'can escape multiple occurances of ' + escapeChar);
      assert.equal(Mob.unescape(e), s, 'multiple occurrences of ' + escapeChar + ' can be unescaped');
    });

    // handles multiple escape characters at once
    var joiner = ' other stuff ';
    var allEscaped = escapeCharacters.join(joiner);
    allEscaped += allEscaped;
    assert.ok(Mob.every(escapeCharacters, function(escapeChar) {
      return allEscaped.indexOf(escapeChar) !== -1;
    }), 'handles multiple characters');
    assert.ok(allEscaped.indexOf(joiner) >= 0, 'can escape multiple escape characters at the same time');

    // test & -> &amp;
    var str = 'some string & another string & yet another';
    var escaped = Mob.escape(str);

    assert.ok(escaped.indexOf('&') !== -1, 'handles & aka &amp;');
    assert.equal(Mob.unescape(str), str, 'can unescape &amp;');
  });

})();