(function() {

  var base = Mob.require('mob/base');

  var fooStub;
  var barStub;
  var stopListeningStub;
  var target;
  var entity;

  QUnit.module("mob/base", {

    beforeEach: function() {
      fooStub = sinon.stub();
      barStub = sinon.stub();
      stopListeningStub = sinon.stub();

      target = {
        foo: fooStub,
        bar: barStub,
        stopListening: stopListeningStub
      };

      entity = sinon.spy();
    }

  });

  QUnit.test("when entity isnt passed, shouldnt unbind any events", function(assert) {

    base.unbindEntityEvents(target, false, {'foo': 'foo'});

    assert.ok(!stopListeningStub.called);

  });

  QUnit.test("when bindings isnt passed, shouldnt unbind any events", function(assert) {

    base.unbindEntityEvents(this.target, entity, null);

    assert.ok(!stopListeningStub.called);

  });

  QUnit.test("when binding is a function", function(assert) {

    var bindingsSpy = sinon.spy(function() {
      return {'foo': 'foo'};
    });

    base.unbindEntityEvents(target, entity, bindingsSpy);

    assert.ok(bindingsSpy.calledOnce);
    assert.ok(bindingsSpy.calledOn(target));
    assert.ok(stopListeningStub.calledOnce);
    assert.ok(stopListeningStub.calledWith(entity, 'foo', target.foo));

  });

  QUnit.test("when handler is a function", function(assert) {

    base.unbindEntityEvents(target, entity, {'foo': target.foo});

    assert.ok(stopListeningStub.calledOnce);
    assert.ok(stopListeningStub.calledWith(entity, 'foo', target.foo));

  });

  QUnit.test("when one handler is passed", function(assert) {

    base.unbindEntityEvents(target, entity, {'foo': 'foo'});

    assert.ok(stopListeningStub.calledOnce);
    assert.ok(stopListeningStub.calledWith(entity, 'foo', target.foo));

  });

  QUnit.test("when multiple handlers are passed", function(assert) {

    base.unbindEntityEvents(target, entity, {'baz': 'foo bar'});

    assert.ok(stopListeningStub.calledWith(entity, 'baz', target.foo));
    assert.ok(stopListeningStub.calledWith(entity, 'baz', target.bar));

  });

  QUnit.test("when bindings is an object with multiple event-handler pairs", function(assert) {

    base.unbindEntityEvents(target, entity, {
      'foo': 'foo',
      'bar': 'bar'
    });

    assert.ok(stopListeningStub.calledWith(entity, 'foo', target.foo));
    assert.ok(stopListeningStub.calledWith(entity, 'bar', target.bar));

  });

  QUnit.test("when unbindEntityEvents is proxied", function(assert) {

    target.unbindEntityEvents = base.proxyUnbindEntityEvents;
    target.unbindEntityEvents(entity, {'foo': target.foo});

    assert.ok(stopListeningStub.calledOnce);
    assert.ok(stopListeningStub.calledWith(entity, 'foo', target.foo));

  });

  QUnit.test('when an object only has the option set on the definition', function(assert) {
    var target = {foo: 'bar'};
    var value = base.getOption(target, 'foo');

    assert.deepEqual(value, target.foo);
  });

  QUnit.test('when an object only has the option set on the options', function(assert) {
    var target = {options: {foo: 'bar'}};
    var value = base.getOption(target, 'foo');

    assert.deepEqual(value, target.options.foo);
  });

  QUnit.test('when an object has the option set on the options, and it is a "falsey" value', function(assert) {
    var target = {options: {foo: false}};
    var value = base.getOption(target, 'foo');

    assert.deepEqual(value, target.options.foo);
  });

  QUnit.test('when an object has the option set on the options, and it is a "undefined" value', function(assert) {
    var target = {foo: 'bar', options: {foo: undefined}};
    var value = base.getOption(target, 'foo');

    assert.deepEqual(value, target.foo);
  });

  QUnit.test('when an object has the option set on both the defininition and options', function(assert) {
    var target = {foo: 'bar', options: {foo: 'baz'}};
    var value = base.getOption(target, 'foo');

    assert.deepEqual(value, target.options.foo);
  });

  QUnit.test('when proxying getOption', function(assert) {
    var target = {foo: 'bar'};
    target.getOption = base.proxyGetOption;
    var value = target.getOption('foo');

    assert.deepEqual(value, target.foo);
  });

})();