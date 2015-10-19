(function() {

  var promise = function() {
    this.on = null;
  };

  promise.prototype.solve = function() {
    if (this.on instanceof Function) {
      this.on.apply(this.on, Array.prototype.slice.call(arguments));
    }
  };

  promise.prototype.reject = function(err) {
    err = err || 'generic error';
    if (this.on instanceof Function) {
      this.on(err);
    }
  };

  var router;
  var href = '#/user/jhon';

  QUnit.module('mob/router', {

    beforeEach: function() {
      router = new Mob.Router();
      router.run('#/');
    },

    afterEach: function() {
      if (router && router.destroy) {
        router.destroy();
      }
      router = null;
    }

  });

  QUnit.asyncTest('Navigating runs "befores"', function(assert) {

    var bp = new promise();
    router
      .before(function(req, next) {
        assert.ok(req.href);
        bp.solve();
        next();
      }).addRoute('/user/:username', function() {});
    bp.on = function() {
      start();
    };

    window.document.location.href = href;

  });

  QUnit.asyncTest('Navigating reachs /user/:username route, and :username is "jhon"', function(assert) {

    var p = new promise();
    router.addRoute('/user/:username', function(req, next) {
      p.solve(null, req);
    });

    p.on = function(err, req) {
      assert.equal(req.href, '#/user/jhon');
      assert.equal(req.params.username, 'jhon');

      start();
    };
    window.document.location.href = href;

  });

  QUnit.asyncTest('query exists in req and its property "a" has value "b"', function(assert) {

    var p = new promise();
    router.addRoute('#/user', function(req, next) {
      p.solve(null, req);
    });

    p.on = function(err, req) {
      assert.ok(req.query);
      assert.equal(req.query.a, 'b');
      start();
    };
    window.document.location.href = '#/user?a=b&other=value';

  });

  QUnit.asyncTest('ignore #/user calling #/User', function(assert) {

    var p = new promise();
    router = new Mob.Router({
      ignorecase: false
    })
      .addRoute('#/user', function() {
        p.solve();
      })
      .errors(404, function(err, href) {
        p.reject(err);
      });

    p.on = function(err) {
      assert.ok(err);
      start();
    };
    window.document.location.href = '#/User';

  });

  QUnit.asyncTest('req has "get" property and is a Function', function(assert) {

    var p = new promise();

    router.addRoute('#/user/:name', function(req, next) {
      p.solve(null, req, next);
    });

    p.on = function(err, req) {
      assert.equal(req.get('surname'), 'snow');
      start();
    };
    window.document.location.href = '#/user/jhon?surname=snow';

  });

  QUnit.asyncTest('req.get("name") is jhon', function(assert) {

    var p = new promise();

    router.addRoute('#/user/:name', function(req, next) {
      p.solve(null, req, next);
    });

    p.on = function(err, req) {
      assert.equal(req.get('name'), 'jhon');
      start();
    };
    window.document.location.href = '#/user/jhon?surname=snow';

  });

  QUnit.asyncTest('req.get("address","fourth street") return the default value "fourth street"', function(assert) {

    var p = new promise();

    router.addRoute('#/user/:name', function(req, next) {
      p.solve(null, req, next);
    });

    p.on = function(err, req) {
      assert.equal(req.get('address', 'fourth street'), 'fourth street');
      start();
    };
    window.document.location.href = '#/user/jhon?surname=snow';

  });

  QUnit.asyncTest('but will not match #/user/jhon/snow', function(assert) {

    var p = new promise(),
      multi = new promise(),
      errp = new promise();

    router
      .addRoute('#/user/*', function(req, next) {
        p.solve(null, req, next);
      })
      .addRoute('#/multi/**', function(req, next) {
        multi.solve(null, req, next);
      })
      .errors(404, function(err, href) {
        errp.solve(err, href);
      });

    errp.on = function(err, href) {
      assert.ok(Mob.isString(href));
      start();
    };

    window.document.location.href = '#/user/jhon/snow';

  });

  QUnit.asyncTest('next', function(assert) {

    var first = new promise(),
      second = new promise(),
      bef = new promise(),
      errp = new promise();

    router
      .before(function(req, next) {
        bef.solve(null, req, next);
        next();
      })
      .addRoute('#/user/:username', function(req, next) {
        if (req.get('username') == 'admin') {
          next('Invalid username', 500);
        }
        first.solve(null, req, next);
        next();
      })
      .addRoute('#/user/*', function(req, next) {
        second.solve(null, req, next);
        next();
      })
      .errors(500, function(err, href) {
        errp.solve(err, href, 500);
      });

    bef.on = function(err, req, next) {

      assert.ok(Mob.isFunction(next));
      assert.ok(req.hasNext);

      start();
    };
    window.document.location.href = '#/user/jhon';

  });

  QUnit.asyncTest('next', function(assert) {

    var first = new promise(),
      second = new promise(),
      bef = new promise(),
      errp = new promise();

    router
      .before(function(req, next) {
        bef.solve(null, req, next);
        next();
      })
      .addRoute('#/user/:username', function(req, next) {
        if (req.get('username') == 'admin') {
          next('Invalid username', 500);
        }
        first.solve(null, req, next);
        next();
      })
      .addRoute('#/user/*', function(req, next) {
        second.solve(null, req, next);
        next();
      })
      .errors(500, function(err, href) {
        errp.solve(err, href, 500);
      });

    first.on = function(err, req, next) {

      assert.ok(Mob.isFunction(next));
      assert.ok(req.hasNext);

      start();
    };
    window.document.location.href = '#/user/jhon';

  });

  QUnit.asyncTest('next', function(assert) {

    var first = new promise(),
      second = new promise(),
      bef = new promise(),
      errp = new promise();

    router
      .before(function(req, next) {
        bef.solve(null, req, next);
        next();
      })
      .addRoute('#/user/:username', function(req, next) {
        if (req.get('username') == 'admin') {
          next('Invalid username', 500);
        }
        first.solve(null, req, next);
        next();
      })
      .addRoute('#/user/*', function(req, next) {
        second.solve(null, req, next);
        next();
      })
      .errors(500, function(err, href) {
        errp.solve(err, href, 500);
      });

    second.on = function(err, req, next) {
      assert.ok(Mob.isFunction(next));
      assert.ok(!req.hasNext);
      start();
    };
    window.document.location.href = '#/user/jhon';

  });

  QUnit.asyncTest('next', function(assert) {

    var first = new promise(),
      second = new promise(),
      bef = new promise(),
      errp = new promise();

    router
      .before(function(req, next) {
        bef.solve(null, req, next);
        next();
      })
      .addRoute('#/user/:username', function(req, next) {
        if (req.get('username') == 'admin') {
          next('Invalid username', 500);
        }
        first.solve(null, req, next);
        next();
      })
      .addRoute('#/user/*', function(req, next) {
        second.solve(null, req, next);
        next();
      })
      .errors(500, function(err, href) {
        errp.solve(err, href, 500);
      });

    errp.on = function(err, href, code) {
      assert.equal(href, '#/user/jhon');
      assert.equal(code, 500);
      start();
    };
    window.document.location.href = '#/user/jhon';

  });

  QUnit.asyncTest('error handling', function(assert) {

    var first = new promise(),
      second = new promise(),
      bef = new promise(),
      errp = new promise();

    router
      .before(function(req, next) {
        if (req.href == '#/user/fireerror') {
          next('error message', 500);
        }
        next();
      })
      .addRoute('#/user/:username', function(req, next) {
        if (req.get('username') == 'admin') {
          next('error message', 500);
        }
        first.solve(null, req, next);
        next();
      })
      .addRoute('#/user/*', function(req, next) {
        second.solve(null, req, next)
      })
      .errors(500, function(err, href) {
        errp.solve(err, href);
      });

    errp.on = function(err, href) {

      assert.equal(err, 'error message');
      assert.equal(href, '#/user/admin');

      start();
    };
    window.document.location.href = '#/user/admin';

  });

  QUnit.asyncTest('error handling 1', function(assert) {

    var first = new promise(),
      second = new promise(),
      bef = new promise(),
      errp = new promise();

    router
      .before(function(req, next) {
        if (req.href == '#/user/fireerror') {
          next('error message', 500);
        }
        next();
      })
      .addRoute('#/user/:username', function(req, next) {
        if (req.get('username') == 'admin') {
          next('error message', 500);
        }
        first.solve(null, req, next);
        next();
      })
      .addRoute('#/user/*', function(req, next) {
        second.solve(null, req, next)
      })
      .errors(500, function(err, href) {
        errp.solve(err, href);
      });

    errp.on = function(err, href) {

      assert.equal(err, 'error message');
      assert.equal(href, '#/user/fireerror');

      start();
    };
    window.document.location.href = '#/user/fireerror';

  });

  QUnit.asyncTest('methods', function(assert) {

    var first, second;

    second = new promise();
    first = new promise();
    router
      .addRoute('#/path/first', function(req, next) {
        first.solve('fired', req, next);
      })
      .addRoute('#/path/second', function(req, next) {
        assert.equal(req.href, '#/path/second');
        second.solve(null, req, next)
      });
    router.pause();

    router.play();
    second.on = function() {
      start();
    };
    window.document.location.href = '#/path/second';

  });

  QUnit.asyncTest('redirect should', function(assert) {

    var first, second;

    second = new promise();
    first = new promise();
    router
      .addRoute('#/path/first', function(req, next) {
        first.solve('fired', req, next);
      })
      .addRoute('#/path/second', function(req, next) {
        assert.equal(req.href, '#/path/second');
        second.solve(null, req, next)
      });
    router.pause();

    router.play();
    second.on = function() {
      assert.ok(/#\/path\/second$/.test(window.document.location.href));
      start();
    };
    router.redirect('#/path/second');

  });

  QUnit.asyncTest('redirect should', function(assert) {

    var first, second;

    second = new promise();
    first = new promise();
    router
      .addRoute('#/path/first', function(req, next) {
        first.solve('fired', req, next);
      })
      .addRoute('#/path/second', function(req, next) {
        assert.equal(req.href, '#/path/second?q=hi');
        second.solve(null, req, next)
      });
    router.pause();

    router.play();
    second.on = function() {
      assert.ok(/#\/path\/second\?q=hi$/.test(window.document.location.href));
      start();
    };
    router.redirect('#/path/second?q=hi');

  });

}());