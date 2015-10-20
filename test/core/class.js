(function() {

  QUnit.module("mob/class");

  QUnit.test("when creating an object", function(assert) {

    var Object = Mob.Class.extend({

      modelEvents: {
        'bar': 'onBar'
      },

      initialize: function(options) {
        this.bindEntityEvents(options.model, this.modelEvents);
      },

      onBar: function() {}
    });

    var model = Mob.extend({}, Mob.Events);

    var options = {
      model: model
    };

    var object = new Object(options);

    var fooHandler = sinon.spy();
    object.on('foo', fooHandler);

    var barHandler = sinon.spy();
    model.on('bar', barHandler);

    object.trigger('foo', options);
    model.trigger('bar', options);

    assert.ok(fooHandler.calledWith(options));
    assert.ok(barHandler.calledWith(options));
    assert.deepEqual(object.options, options);

  });

  QUnit.test("when destroying a object", function(assert) {

    var object = new Mob.Class();

    sinon.spy(object, 'destroy');
    var beforeDestroyHandler = sinon.spy();
    object.on('before:destroy', beforeDestroyHandler);
    var returned = object.destroy();

    assert.ok(beforeDestroyHandler.calledOnce);

    assert.deepEqual(returned, object);

  });

})();