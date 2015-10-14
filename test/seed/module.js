(function() {

  QUnit.module('mob/module', {
    beforeEach: function() {

      Mob.Module.remove('mo/forTest1');
      Mob.Module.remove('mo/forTest2');

      Mob.Module.define('mo/forTest1', function(require, exports, module) {

        exports.add = function(a, b) {
          return a + b;
        };

        exports.sub = function(a, b) {
          return a - b;
        };

      });

      Mob.Module.define('mo/forTest2', function(require, exports, module) {

        var forTest1 = require('mo/forTest1');

        var helpers = {};

        helpers.doubleAdd = function(a, b) {

          return 2 * forTest1.add(a, b);

        };

        helpers.sayHi = function() {
          return 'hi';
        };

        module.exports = helpers;

      });

    }
  });

  QUnit.test('Module methods', function(assert) {

    Mob.Module.define('.', function(require, exports, module) {

      var forTest2 = require('mo/forTest2');

      exports.print = function(a, b) {
        return '-' + forTest2.doubleAdd(a, b);
      };

    });

    var here = Mob.Module.require('.');
    assert.equal('-6', here.print(1, 2), 'test .define & .require');

    var moduleMap = Mob.Module.map();
    assert.ok(moduleMap['.'], 'test .map');
    assert.ok(moduleMap['mo/forTest1']);
    assert.ok(moduleMap['mo/forTest2']);

    Mob.Module.remove('.');
    assert.ok(!moduleMap['.'], 'test .remove');
    assert.ok(moduleMap['mo/forTest1']);
    assert.ok(moduleMap['mo/forTest2']);

  });

  QUnit.test('Mob .requireModule & .defineModule', function(assert) {
    assert.strictEqual(Mob.requireModule, Mob.Module.require);
    assert.strictEqual(Mob.defineModule, Mob.Module.define);
  });

})();