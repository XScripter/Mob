(function() {

  var $ = Mob.$;
  var view;

  QUnit.module('mob/view', {

    beforeEach: function(assert) {
      $('#qunit-fixture').append(
        '<div id="testElement"><h1>Test</h1></div>'
      );

      view = new Mob.View({
        id: 'test-view',
        className: 'test-view',
        other: 'non-special-option'
      });
    }

  });

  QUnit.test('constructor', function(assert) {
    assert.expect(3);
    assert.equal(view.el.id, 'test-view');
    assert.equal(view.el.className, 'test-view');
    assert.equal(view.el.other, void 0);
  });

  QUnit.test('$', function(assert) {
    assert.expect(2);
    var view = new Mob.View;
    view.setElement('<p><a><b>test</b></a></p>');
    var result = view.$('a b');

    assert.strictEqual(result[0].innerHTML, 'test');
    assert.ok(result.length === +result.length);
  });

  QUnit.test('$el', function(assert) {
    assert.expect(2);
    var view = new Mob.View;
    view.setElement('<p><a><b>test</b></a></p>');
    assert.strictEqual(view.el.nodeType, 1);

    assert.strictEqual(view.$el[0], view.el);
  });

  QUnit.test('initialize', function(assert) {
    assert.expect(1);
    var View = Mob.View.extend({
      initialize: function() {
        this.one = 1;
      }
    });

    assert.strictEqual(new View().one, 1);
  });

  QUnit.test('render', function(assert) {
    assert.expect(1);
    var view = new Mob.View;
    assert.equal(view.render(), view, '#render returns the view instance');
  });

  QUnit.test('delegateEvents', function(assert) {
    assert.expect(6);
    var counter1 = 0,
      counter2 = 0;

    var view = new Mob.View({
      el: '#testElement'
    });
    view.increment = function() {
      counter1++;
    };
    view.$el.on('click', function() {
      counter2++;
    });

    var events = {
      'click h1': 'increment'
    };

    view.delegateEvents(events);
    view.$('h1').trigger('click');
    assert.equal(counter1, 1);
    assert.equal(counter2, 1);

    view.$('h1').trigger('click');
    assert.equal(counter1, 2);
    assert.equal(counter2, 2);

    view.delegateEvents(events);
    view.$('h1').trigger('click');
    assert.equal(counter1, 3);
    assert.equal(counter2, 3);
  });

  QUnit.test('delegate', function(assert) {
    assert.expect(3);
    var view = new Mob.View({
      el: '#testElement'
    });
    view.delegate('click', 'h1', function() {
      assert.ok(true);
    });
    view.delegate('click', function() {
      assert.ok(true);
    });
    view.$('h1').trigger('click');

    assert.equal(view.delegate(), view, '#delegate returns the view instance');
  });

  QUnit.test('delegateEvents allows functions for callbacks', function(assert) {
    assert.expect(3);
    var view = new Mob.View({
      el: '<p></p>'
    });
    view.counter = 0;

    var events = {
      click: function() {
        this.counter++;
      }
    };

    view.delegateEvents(events);
    view.$el.trigger('click');
    assert.equal(view.counter, 1);

    view.$el.trigger('click');
    assert.equal(view.counter, 2);

    view.delegateEvents(events);
    view.$el.trigger('click');
    assert.equal(view.counter, 3);
  });

  QUnit.test('delegateEvents ignore undefined methods', function(assert) {
    assert.expect(0);
    var view = new Mob.View({
      el: '<p></p>'
    });
    view.delegateEvents({
      'click': 'undefinedMethod'
    });
    view.$el.trigger('click');
  });

  QUnit.test('undelegateEvents', function(assert) {
    assert.expect(7);
    var counter1 = 0,
      counter2 = 0;

    var view = new Mob.View({
      el: '#testElement'
    });
    view.increment = function() {
      counter1++;
    };
    view.$el.on('click', function() {
      counter2++;
    });

    var events = {
      'click h1': 'increment'
    };

    view.delegateEvents(events);
    view.$('h1').trigger('click');
    assert.equal(counter1, 1);
    assert.equal(counter2, 1);

    view.undelegateEvents();
    view.$('h1').trigger('click');
    assert.equal(counter1, 1);
    assert.equal(counter2, 2);

    view.delegateEvents(events);
    view.$('h1').trigger('click');
    assert.equal(counter1, 2);
    assert.equal(counter2, 3);

    assert.equal(view.undelegateEvents(), view, '#undelegateEvents returns the view instance');
  });

  QUnit.test('undelegate', function(assert) {
    assert.expect(1);
    view = new Mob.View({
      el: '#testElement'
    });
    view.delegate('click', function() {
      assert.ok(false);
    });
    view.delegate('click', 'h1', function() {
      assert.ok(false);
    });

    view.undelegate('click');

    view.$('h1').trigger('click');
    view.$el.trigger('click');

    assert.equal(view.undelegate(), view, '#undelegate returns the view instance');
  });

  QUnit.test('undelegate with passed handler', function(assert) {
    assert.expect(1);
    view = new Mob.View({
      el: '#testElement'
    });
    var listener = function() {
      assert.ok(false);
    };
    view.delegate('click', listener);
    view.delegate('click', function() {
      assert.ok(true);
    });
    view.undelegate('click', listener);
    view.$el.trigger('click');
  });

  QUnit.test('undelegate with selector', function(assert) {
    assert.expect(2);
    view = new Mob.View({
      el: '#testElement'
    });
    view.delegate('click', function() {
      assert.ok(true);
    });
    view.delegate('click', 'h1', function() {
      assert.ok(false);
    });
    view.undelegate('click', 'h1');
    view.$('h1').trigger('click');
    view.$el.trigger('click');
  });

  QUnit.test('undelegate with handler and selector', function(assert) {
    assert.expect(2);
    view = new Mob.View({
      el: '#testElement'
    });
    view.delegate('click', function() {
      assert.ok(true);
    });
    var handler = function() {
      assert.ok(false);
    };
    view.delegate('click', 'h1', handler);
    view.undelegate('click', 'h1', handler);
    view.$('h1').trigger('click');
    view.$el.trigger('click');
  });

  QUnit.test('tagName can be provided as a string', function(assert) {
    assert.expect(1);
    var View = Mob.View.extend({
      tagName: 'span'
    });

    assert.equal(new View().el.tagName, 'SPAN');
  });

  QUnit.test('tagName can be provided as a function', function(assert) {
    assert.expect(1);
    var View = Mob.View.extend({
      tagName: function() {
        return 'p';
      }
    });

    assert.ok(new View().$el.get(0).tagName === 'P');
  });

  QUnit.test('_ensureElement with DOM node el', function(assert) {
    assert.expect(1);
    var View = Mob.View.extend({
      el: document.body
    });

    assert.equal(new View().el, document.body);
  });

  QUnit.test('_ensureElement with string el', function(assert) {
    assert.expect(3);
    var View = Mob.View.extend({
      el: 'body'
    });
    assert.strictEqual(new View().el, document.body);

    View = Mob.View.extend({
      el: '#testElement > h1'
    });
    assert.strictEqual(new View().el, $('#testElement > h1').get(0));

    View = Mob.View.extend({
      el: '#nonexistent'
    });
    assert.ok(!new View().el);
  });

  QUnit.test('with className and id functions', function(assert) {
    assert.expect(2);
    var View = Mob.View.extend({
      className: function() {
        return 'className';
      },
      id: function() {
        return 'id';
      }
    });

    assert.strictEqual(new View().el.className, 'className');
    assert.strictEqual(new View().el.id, 'id');
  });

  QUnit.test('with attributes', function(assert) {
    assert.expect(2);
    var View = Mob.View.extend({
      attributes: {
        id: 'id',
        'class': 'class'
      }
    });

    assert.strictEqual(new View().el.className, 'class');
    assert.strictEqual(new View().el.id, 'id');
  });

  QUnit.test('with attributes as a function', function(assert) {
    assert.expect(1);
    var View = Mob.View.extend({
      attributes: function() {
        return {
          'class': 'dynamic'
        };
      }
    });

    assert.strictEqual(new View().el.className, 'dynamic');
  });

  QUnit.test('should default to className/id properties', function(assert) {
    assert.expect(4);
    var View = Mob.View.extend({
      className: 'backboneClass',
      id: 'backboneId',
      attributes: {
        'class': 'attributeClass',
        'id': 'attributeId'
      }
    });

    var view = new View;
    assert.strictEqual(view.el.className, 'backboneClass');
    assert.strictEqual(view.el.id, 'backboneId');
    assert.strictEqual(view.$el.attr('class'), 'backboneClass');
    assert.strictEqual(view.$el.attr('id'), 'backboneId');
  });

  QUnit.test('multiple views per element', function(assert) {
    assert.expect(3);
    var count = 0;
    var $el = $('<p></p>');

    var View = Mob.View.extend({
      el: $el,
      events: {
        click: function() {
          count++;
        }
      }
    });

    var view1 = new View;
    $el.trigger('click');
    assert.equal(1, count);

    var view2 = new View;
    $el.trigger('click');
    assert.equal(3, count);

    view1.delegateEvents();
    $el.trigger('click');
    assert.equal(5, count);
  });

  QUnit.test('custom events', function(assert) {
    assert.expect(2);
    var View = Mob.View.extend({
      el: $('body'),
      events: {
        'fake$event': function() {
          assert.ok(true);
        }
      }
    });

    var view = new View;
    $('body').trigger('fake$event').trigger('fake$event');

    $('body').off('fake$event');
    $('body').trigger('fake$event');
  });

  QUnit.test('setElement uses provided object.', function(assert) {
    assert.expect(2);
    var $el = $('body');

    var view = new Mob.View({
      el: $el
    });
    assert.ok(view.$el === $el);

    view.setElement($el = $($el));
    assert.ok(view.$el === $el);
  });

  QUnit.test('Undelegate before changing element.', function(assert) {
    assert.expect(1);
    var button1 = $('<button></button>');
    var button2 = $('<button></button>');

    var View = Mob.View.extend({
      events: {
        click: function(e) {
          assert.ok(view.el === e.target);
        }
      }
    });

    var view = new View({
      el: button1
    });
    view.setElement(button2);

    button1.trigger('click');
    button2.trigger('click');
  });

  QUnit.test('Clone attributes object', function(assert) {
    assert.expect(2);
    var View = Mob.View.extend({
      attributes: {
        foo: 'bar'
      }
    });

    var view1 = new View({
      id: 'foo'
    });
    assert.strictEqual(view1.el.id, 'foo');

    var view2 = new View();
    assert.ok(!view2.el.id);
  });

  QUnit.test('Provide function for el.', function(assert) {
    assert.expect(1);
    var View = Mob.View.extend({
      el: function() {
        return '<p><a></a></p>';
      }
    });

    var view = new View;
    assert.ok(view.$el.get(0).tagName === 'P');
  });

  QUnit.test('events passed in options', function(assert) {
    assert.expect(1);
    var counter = 0;

    var View = Mob.View.extend({
      el: '#testElement',
      increment: function() {
        counter++;
      }
    });

    var view = new View({
      events: {
        'click h1': 'increment'
      }
    });

    view.$('h1').trigger('click').trigger('click');
    assert.equal(counter, 2);
  });

  QUnit.test('remove', function(assert) {
    assert.expect(3);
    var view = new Mob.View();
    document.body.appendChild(view.el);

    view.delegate('click', function() {
      assert.ok(true);
    });
    view.listenTo(view, 'all x', function() {
      assert.ok(false);
    });

    assert.equal(view.remove(), view, '#remove returns the view instance');
    view.$el.trigger('click');
    view.trigger('x');

    assert.notEqual(view.el.parentNode, document.body);
  });

  QUnit.test('setElement', function(assert) {
    assert.expect(3);
    var view = new Mob.View({
      events: {
        click: function() {
          assert.ok(false);
        }
      }
    });
    view.events = {
      click: function() {
        assert.ok(true);
      }
    };
    var oldEl = view.el;
    var $oldEl = view.$el;

    view.setElement(document.createElement('div'));

    $oldEl.trigger('click');
    view.$el.trigger('click');

    assert.notEqual(oldEl, view.el);
    assert.notEqual($oldEl, view.$el);
  });

})();