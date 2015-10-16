(function() {

  var $ = Mob.$;

  var $el = $('#fixtures-event div');

  QUnit.module('mob/jqlite/event', {

    beforeEach: function() {
      $('*').unbind();
    },

    tearDown: function() {
      $el.off().remove();
      $([document, document.body]).off();
    }

  });

  function click(el) {
    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, true, document.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    $(el).get(0).dispatchEvent(event);
  }

  QUnit.test('Mob testProxyFnContext', function(assert) {
    var a = {
        name: 'A',
        fn: function(n, o) {
          return this.name + n + o
        }
      },
      b = {
        name: 'B'
      };

    assert.equal('A13', a.fn(1, 3));
    assert.equal('B52', $.proxy(a.fn, b)(5, 2));
  });

  QUnit.test('Mob testProxyInvalidFn', function(assert) {
    try {
      $.proxy(null);
    } catch (e) {
      assert.equal('TypeError', e.name);
      assert.equal("expected function", e.message);
    }
  });

  QUnit.test('Mob testProxyContextName', function(assert) {
    var b = {
        name: 'B',
        fn: function(n, o) {
          return this.name + n + o
        }
      },
      oldFn = b.fn;

    assert.equal('B52', $.proxy(b, 'fn')(5, 2));
    assert.deepEqual(oldFn, b.fn);
  });

  QUnit.test('Mob testProxyUndefinedProperty', function(assert) {
    try {
      $.proxy({}, 'nonexistent');
    } catch (e) {
      assert.equal('TypeError', e.name);
      assert.equal("expected function", e.message);
    }
  });

  QUnit.test('Mob testProxyAdditionalArguments', function(assert) {
    var a = {
      name: 'A',
      fn: function() {
        return this.name + [].slice.call(arguments).join('');
      }
    };
    assert.equal('A123', $.proxy(a.fn, a)(1, 2, 3));
    assert.equal('A456', $.proxy(a.fn, a, 4, 5, 6)());
    assert.equal('A456123', $.proxy(a.fn, a, 4, 5, 6)(1, 2, 3));
  });

  QUnit.test('Mob testProxyContextNameAdditionalArguments', function(assert) {
    var a = {
      name: 'A',
      fn: function() {
        return this.name + [].slice.call(arguments).join('');
      }
    };
    assert.equal('A123', $.proxy(a, 'fn')(1, 2, 3));
    assert.equal('A456', $.proxy(a, 'fn', 4, 5, 6)());
    assert.equal('A456123', $.proxy(a, 'fn', 4, 5, 6)(1, 2, 3));
  });

  QUnit.test('Mob testProxyInvalidProperty', function(assert) {
    try {
      $.proxy({
        num: 3
      }, 'num');
    } catch (e) {
      assert.equal('TypeError', e.name);
      assert.equal("expected function", e.message);
    }
  });

  QUnit.test('Mob testProxiedHandlerCanBeUnboundWithOriginal', function(assert) {
    var obj = {
      times: 0,
      fn: function() {
        this.times++;
      }
    };

    $el.on('click', $.proxy(obj, 'fn'));
    click($el);
    assert.equal(1, obj.times);

    $el.off('click', obj.fn);
    click($el)
    assert.equal(1, obj.times);
  });

  QUnit.test('Mob testOneHandlerCanBeUnboundWithOriginal', function(assert) {
    var count = 0,
      fn = function() {
        count++;
      };

    $el.one('click', fn);
    $el.off('click', fn);
    click($el);
    assert.equal(0, count);
  });

  QUnit.test('Mob testOneDelegation', function(assert) {
    var context, count = 0;
    $(document).one('click', 'div', function() {
      context = this;
      count++;
    });

    click($el);
    click($el);
    assert.equal(1, count);
    assert.deepEqual($el.get(0), context);
  });

  QUnit.test('Mob testOneWithData', function(assert) {
    var obj = {},
      gotObj, count = 0;
    $(document).one('click', obj, function(e) {
      gotObj = e.data;
      count++;
    });

    click($el);
    click($el);
    assert.equal(1, count);
    assert.deepEqual(obj, gotObj);
  });

  QUnit.test('Mob testHandlerArity', function(assert) {
    var numArgs;
    $el.on('click', function() {
      numArgs = arguments.length;
    });

    click($el);
    assert.equal(1, numArgs);
  });

  QUnit.test('Mob testOnWithObject', function(assert) {
    var log = [];
    $el.on({
      click: function() {
        log.push('a');
      }
    }).
      on({
        click: function() {
          log.push('b');
        }
      }, null);

    click($el);
    assert.equal('a b', log.sort().join(' '));
  });

  QUnit.test('Mob testOnWithBlankData', function(assert) {
    var log = [],
      fn = function(e) {
        log.push(e.data);
      };
    $el
      .on('click', null, fn)
      .on('click', undefined, fn);

    click($el);
    assert.equal(2, log.length);
    assert.deepEqual(null, log[0]);
    assert.deepEqual(undefined, log[1]);
  });

  QUnit.test('Mob testOffWithObject', function(assert) {
    var log = [],
      fn = function() {
        log.push('a');
      },
      fn2 = function() {
        log.push('b');
      },
      fn3 = function() {
        log.push('c');
      };

    $el.on('click', fn).on('click', fn2).on('click', fn3);
    click($el);
    assert.equal('a b c', log.sort().join(' '));

    $el.off({
      click: fn
    }).off({
      click: fn2
    }, null);
    click($el);
    assert.equal('a b c c', log.sort().join(' '));
  });

  QUnit.test('Mob testEventsOnPlainObjects', function(assert) {
    var obj = {},
      log = [],
      fn1 = function() {
        log.push('a');
      },
      fn2 = function(evt, value) {
        log.push(value);
      },
      fn3 = function(evt, value) {
        log.push("event2");
      };
    $(obj)
      .on('event', fn1)
      .on('event', fn2)
      .on('event2', fn3);

    $(obj).trigger('event', 'b');
    assert.equal('a b', log.join(' '));

    log = [];
    $(obj).trigger('event', 'c');
    assert.equal('a c', log.join(' '));

    log = [];
    $(obj).off('event', fn1);
    $(obj).trigger('event', 'd');
    assert.equal('d', log.join(' '));

    log = [];
    $(obj).trigger('event2');
    assert.equal('event2', log.join(' '));
  });

  QUnit.test('Mob testHandlerWithoutData', function(assert) {
    var gotData;

    $(document).on('click', function(event) {
      gotData = event.data;
    });
    assert.equal(undefined, gotData);

    click($el);
    assert.equal(undefined, gotData);
  });

  QUnit.test('Mob testHandlerWithData', function(assert) {
    var data = {},
      gotData, numArgs;

    $(document).on('click', data, function(event) {
      gotData = event.data;
      numArgs = arguments.length;
    });
    assert.equal(undefined, gotData);

    click($el);
    assert.equal(1, numArgs);
    assert.deepEqual(data, gotData);
  });

  QUnit.test('Mob testDelegatedWithData', function(assert) {
    var data = {},
      gotData, numArgs;

    $(document).on('click', 'div', data, function(event) {
      gotData = event.data;
      numArgs = arguments.length;
    });
    assert.equal(undefined, gotData);

    click($el);
    assert.equal(1, numArgs);
    assert.deepEqual(data, gotData);
  });

  QUnit.test('Mob testTriggerWithData', function(assert) {
    var data = {},
      gotData;

    $(document).on('myevent', data, function(event) {
      gotData = event.data;
    });
    assert.equal(undefined, gotData);

    $el.trigger('myevent');
    assert.deepEqual(data, gotData);
  });

  QUnit.test('Mob testStopImmediatePropagation', function(assert) {
    var log = '';

    $el
      .on('click', function(e) {
        log += 'A';
      })
      .on('click', function(e) {
        log += 'B';
        e.stopImmediatePropagation();
      })
      .on('click', function(e) {
        log += 'C';
      });

    $(document).on('click', function(e) {
      log += 'D';
    });

    click($el);

    assert.equal('AB', log);
  });

  QUnit.test('Mob testDelegateSelectorLookupDoesNotIncludeParent', function(assert) {
    var fired = false;

    $el
      .addClass('offender')
      .on('click', '.offender', function() {
        fired = true;
      });

    click($el);

    assert.equal(false, fired);
  });

  QUnit.test('Mob testFalseLiteralAsCallback', function(assert) {
    var event = $.Event('click');

    $el.on('click', false);

    $el.trigger(event);
    assert.equal(true, event.isDefaultPrevented());
    assert.equal(true, event.isPropagationStopped());
  });

  QUnit.test('Mob testFalseLiteralAsCallbackWithDataArgument', function(assert) {
    var event = $.Event('click');

    $el.on('click', null, false);

    $el.trigger(event);
    assert.equal(true, event.isDefaultPrevented());
    assert.equal(true, event.isPropagationStopped());
  });

})();