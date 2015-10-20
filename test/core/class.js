(function() {

  QUnit.module("mob/class");

  QUnit.test("when creating an object", function(assert) {

    var ClassObj = Mob.Class.extend({

      modelEvents: {
        'bar': 'onBar'
      },

      initialize: function(options) {
        this.bindEntityEvents(options.dataObj, this.modelEvents);
      },

      onBar: function() {}
    });

    var dataObj = {};

    Mob.extend(dataObj, Mob.Events);

    var options = {
      dataObj: dataObj
    };

    var object = new ClassObj(options);

    object.on('foo', function() {
      assert.ok(true);
    });

    dataObj.on('bar', function() {
      assert.ok(true);
    });

    object.trigger('foo', options);
    dataObj.trigger('bar', options);

    assert.deepEqual(object.options, options);
  });

  QUnit.test("when destroying a object", function(assert) {

    var object = new Mob.Class();

    var beforeDestroyHandler = function() {
      assert.ok(true);
    };
    object.on('before:destroy', beforeDestroyHandler);
    var destroyed = object.destroy();

    assert.deepEqual(destroyed, object);
  });

})();