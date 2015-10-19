(function() {

  QUnit.module('mob/error', {
    beforeEach: function() {

    }
  });

  QUnit.test('should be subclass of native Error', function(assert) {

    var error = new Mob.Error();
    assert.ok(error instanceof Error);

  });

  QUnit.test('when passed a message', function(assert) {

    var error = new Mob.Error('Foo');

    assert.equal('Error', error.name);
    assert.equal('Foo', error.message);

    assert.equal(error.toString(), 'Error: Foo');

  });

  QUnit.test('when passed a message and options', function(assert) {

    var error = new Mob.Error('Foo', {
      name: 'Bar'
    });

    assert.equal('Bar', error.name);
    assert.equal('Foo', error.message);

    assert.equal(error.toString(), 'Bar: Foo');
  });

  QUnit.test('when passed a message and options with a url', function(assert) {

    var error = new Mob.Error('Foo', {
      name: 'Bar',
      url: 'Baz'
    });

    assert.equal('Bar', error.name);
    assert.equal('Foo', error.message);
    assert.equal('http://xscripter.com/mobjs/docs/v' + Mob.VERSION + '/Baz', error.url);

    assert.equal(error.toString(), 'Bar: Foo See: http://xscripter.com/mobjs/docs/v' + Mob.VERSION + '/Baz');
  });

  QUnit.test('when passed valid error properties', function(assert) {

    var props = {
      description: 'myDescription',
      fileName: 'myFileName',
      lineNumber: 'myLineNumber',
      name: 'myName',
      message: 'myMessage',
      number: 'myNumber'
    };
    var error = new Mob.Error(props);

    assert.equal(error.description, 'myDescription');
    assert.equal(error.fileName, 'myFileName');
    assert.equal(error.lineNumber, 'myLineNumber');
    assert.equal(error.name, 'myName');
    assert.equal(error.message, 'myMessage');
    assert.equal(error.number, 'myNumber');

  });

  QUnit.test('when passed invalid error properties', function(assert) {

    var props = {
      foo : 'myFoo',
      bar : 'myBar',
      baz : 'myBaz'
    };
    var error = new Mob.Error(props);

    assert.ok(!error.foo);
    assert.ok(!error.bar);
    assert.ok(!error.baz);

  });

  QUnit.test('when extended', function(assert) {

    var TypeError = Mob.Error.extend();
    var typeError = new TypeError('Foo');

    assert.ok(typeError instanceof Error);
    assert.ok(typeError instanceof Mob.Error);
    assert.ok(typeError instanceof TypeError);

  });

})();