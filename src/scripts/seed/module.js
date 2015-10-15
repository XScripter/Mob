var require, define;

Mob.Module = function() {

  var modules = {};
  var requireStack = [];
  var inProgressModules = {};

  function moduleBuild(module) {
    var factory = module.factory,
      SEPERATOR = '.',
      localRequire = function(id) {
        var resultantId = id;
        //Its a relative path, so lop off the last portion and add the id (minus './')
        if (id.charAt(0) === SEPERATOR) {
          resultantId = module.id.slice(0, module.id.lastIndexOf(SEPERATOR)) + SEPERATOR + id.slice(2);
        }
        return require(resultantId);
      };

    module.exports = {};
    delete module.factory;
    factory(localRequire, module.exports, module);
    return module.exports;
  }

  require = function(id) {
    if (!modules[id]) {
      throw '模块【' + id + '】没有定义！';
    } else if (id in inProgressModules) {
      var cycle = requireStack.slice(inProgressModules[id]).join('->') + '->' + id;
      throw '模块与模块不能同时相互依赖: ' + cycle;
    }
    if (modules[id].factory) {
      try {
        inProgressModules[id] = requireStack.length;
        requireStack.push(id);
        return moduleBuild(modules[id]);
      } finally {
        delete inProgressModules[id];
        requireStack.pop();
      }
    }
    return modules[id].exports;
  };

  define = function(id, factory) {
    if (modules[id]) {
      throw '模块【' + id + '】已经存在，不能重复定义！';
    }
    modules[id] = {
      id: id,
      factory: factory
    };
  };

  return {
    require: require,
    define: define,
    remove: function(id) {
      delete modules[id];
    },
    map: function() {
      return modules;
    }
  };

}();