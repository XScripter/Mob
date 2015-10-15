(function() {

  QUnit.module('mob/lang/utility');

  QUnit.test('Mob .noop', function(assert) {
    assert.strictEqual(Mob.noop('curly', 'larry', 'moe'), void 0, 'should always return undefined');
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
    assert.ok(allEscaped.indexOf(joiner) >= 0, 'can escape multiple escape characters at the same time');

    // test & -> &amp;
    var str = 'some string & another string & yet another';
    var escaped = Mob.escape(str);

    assert.ok(escaped.indexOf('&') !== -1, 'handles & aka &amp;');
    assert.equal(Mob.unescape(str), str, 'can unescape &amp;');
  });

})();