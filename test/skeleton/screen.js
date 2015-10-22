(function() {

  var $ = Mob.$;

  QUnit.module('mob/screen');

  QUnit.test('when creating a new screen and no configuration has been provided', function(assert) {

    assert.throws(function() {
      return new Mob.Screen();
    }, 'An "el" must be specified for a screen.');

  });

  QUnit.test('when passing an el DOM reference in directly', function(assert) {

    var el = $('#screen')[0];

    var customScreen = new(Mob.Screen.extend({
      el: el
    }))();
    var optionScreen = new Mob.Screen({
      el: el
    });
    var optionScreenJquery = new Mob.Screen({
      el: $(el)
    });

    assert.deepEqual(optionScreenJquery.$el[0], el);
    assert.deepEqual(optionScreenJquery.el, el);

    assert.deepEqual(optionScreen.$el[0], el);

    assert.deepEqual(customScreen.$el[0], el);

    assert.equal(customScreen.hasView(), false);
    assert.equal(optionScreen.hasView(), false);

    assert.throws(function() {
      Mob.Screen({
        el: $('the-ghost-of-lechuck')[0]
      });
    });

    assert.throws(function() {
      (Mob.Screen.extend({
        el: $('the-ghost-of-lechuck')[0]
      }))();
    });
  });

  QUnit.test('when showing an initial view', function(assert) {

    var MyScreen = Mob.Screen.extend({
      el: '#screen',
      onBeforeShow: function() {},
      onShow: function() {},
      onSwap: function() {},
      onBeforeSwapOut: function() {},
      onSwapOut: function() {}
    });

    var MyView = Mob.View.extend({
      events: {
        'click': function() {}
      },
      render: function() {
        $(this.el).html('some content');
      },
      destroy: function() {},
      onBeforeShow: function() {},
      onShow: function() {
        $(this.el).addClass('onShowClass');
      }
    });

    var screenShowSpy = sinon.spy();
    var screenBeforeShowSpy = sinon.spy();
    var screenBeforeSwapSpy = sinon.spy();
    var screenSwapSpy = sinon.spy();
    var viewBeforeShowSpy = sinon.spy();
    var viewShowSpy = sinon.spy();
    var screenEmptySpy = sinon.spy();
    var screenBeforeEmptySpy = sinon.spy();

    var view = new MyView();
    var viewRenderSpy = sinon.spy(view, 'render');
    var viewOnBeforeShowSpy = sinon.spy(view, 'onBeforeShow');
    var viewOnShowSpy = sinon.spy(view, 'onShow');

    var myScreen = new MyScreen();
    var screenOnBeforeShowSpy = sinon.spy(myScreen, 'onBeforeShow');
    var screenOnShowSpy = sinon.spy(myScreen, 'onShow');
    var screenOnAttachHtmlSpy = sinon.spy(myScreen, 'attachHtml');
    var screenOnSwapSpy = sinon.spy(myScreen, 'onSwap');
    var screenOnBeforeSwapOutSpy = sinon.spy(myScreen, 'onBeforeSwapOut');
    var screenOnSwapOutSpy = sinon.spy(myScreen, 'onSwapOut');

    myScreen.on('show', screenShowSpy);
    myScreen.on('before:show', screenBeforeShowSpy);
    myScreen.on('before:swap', screenBeforeSwapSpy);
    myScreen.on('swap', screenSwapSpy);
    myScreen.on('empty', screenEmptySpy);
    myScreen.on('before:empty', screenBeforeEmptySpy);
    view.on('before:show', viewBeforeShowSpy);
    view.on('show', viewShowSpy);

    sinon.spy(myScreen, 'show');

    var showOptions = {
      foo: 'bar'
    };
    myScreen.show(view, showOptions);

    assert.ok(viewRenderSpy.called);
    assert.ok(myScreen.hasView());
    assert.deepEqual(view._parent, myScreen);
    assert.deepEqual(myScreen.$el[0], myScreen.el);
    assert.ok(screenOnAttachHtmlSpy.called);

    assert.ok(viewOnShowSpy.called);
    assert.ok($(view.el).hasClass('onShowClass'));

    assert.ok(viewOnShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(screenOnShowSpy.called);

    assert.ok(screenOnShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(screenShowSpy.called);

    assert.ok(screenShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(screenBeforeShowSpy.called);

    assert.ok(screenBeforeShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(screenOnBeforeShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(viewBeforeShowSpy.called);

    assert.ok(viewBeforeShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(viewOnBeforeShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(viewShowSpy.calledOnce);

    assert.ok(viewShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(screenBeforeShowSpy.calledBefore(screenOnAttachHtmlSpy));

    assert.ok(screenShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(screenShowSpy.calledOn(myScreen));

    assert.ok(!screenBeforeSwapSpy.called);

    assert.ok(!screenOnBeforeSwapOutSpy.called);

    assert.ok(!screenOnSwapOutSpy.called);

    assert.ok(!screenSwapSpy.called);

    assert.ok(!screenOnSwapSpy.called);

  });

  QUnit.test('when showing an initial view .', function(assert) {

    var MyScreen = Mob.Screen.extend({
      el: '#screen',
      onBeforeShow: function() {},
      onShow: function() {},
      onSwap: function() {},
      onBeforeSwapOut: function() {},
      onSwapOut: function() {}
    });

    var MyView = Mob.View.extend({
      events: {
        'click': function() {}
      },
      render: function() {
        $(this.el).html('some content');
      },
      destroy: function() {},
      onBeforeShow: function() {},
      onShow: function() {
        $(this.el).addClass('onShowClass');
      }
    });

    var screenShowSpy = sinon.spy();
    var screenBeforeShowSpy = sinon.spy();
    var screenBeforeSwapSpy = sinon.spy();
    var screenSwapSpy = sinon.spy();
    var viewBeforeShowSpy = sinon.spy();
    var viewShowSpy = sinon.spy();
    var screenEmptySpy = sinon.spy();
    var screenBeforeEmptySpy = sinon.spy();

    var view = new MyView();
    var viewRenderSpy = sinon.spy(view, 'render');
    var viewOnBeforeShowSpy = sinon.spy(view, 'onBeforeShow');
    var viewOnShowSpy = sinon.spy(view, 'onShow');

    var myScreen = new MyScreen();
    var screenOnBeforeShowSpy = sinon.spy(myScreen, 'onBeforeShow');
    var screenOnShowSpy = sinon.spy(myScreen, 'onShow');
    var screenOnAttachHtmlSpy = sinon.spy(myScreen, 'attachHtml');
    var screenOnSwapSpy = sinon.spy(myScreen, 'onSwap');
    var screenOnBeforeSwapOutSpy = sinon.spy(myScreen, 'onBeforeSwapOut');
    var screenOnSwapOutSpy = sinon.spy(myScreen, 'onSwapOut');

    myScreen.on('show', screenShowSpy);
    myScreen.on('before:show', screenBeforeShowSpy);
    myScreen.on('before:swap', screenBeforeSwapSpy);
    myScreen.on('swap', screenSwapSpy);
    myScreen.on('empty', screenEmptySpy);
    myScreen.on('before:empty', screenBeforeEmptySpy);
    view.on('before:show', viewBeforeShowSpy);
    view.on('show', viewShowSpy);

    sinon.spy(myScreen, 'show');

    var showOptions = {
      foo: 'bar'
    };
    myScreen.show(view, showOptions);


    var view = myScreen.currentView;

    screenEmptySpy.reset();
    screenBeforeEmptySpy.reset();
    screenOnBeforeSwapOutSpy.reset();
    screenOnSwapOutSpy.reset();

    var view2 = new MyView();
    var otherOptions = {
      bar: 'foo'
    };
    myScreen.show(view2, otherOptions);

    assert.ok(screenBeforeSwapSpy.called);

    assert.ok(screenBeforeSwapSpy.calledWith(view2, myScreen, otherOptions));

    assert.ok(screenEmptySpy.calledOnce);
    assert.ok(screenBeforeEmptySpy.calledOnce);

    assert.ok(screenSwapSpy.called);

    assert.ok(screenSwapSpy.calledWith(view2, myScreen, otherOptions));

    assert.ok(screenOnSwapSpy.called);

    assert.ok(screenOnSwapSpy.calledWith(view2, myScreen, otherOptions));

    assert.ok(screenOnSwapSpy.calledOn(myScreen));

    assert.ok(myScreen.hasView());

    assert.deepEqual(view2._parent, myScreen);

    assert.ok(!view._parent);

    assert.ok(screenOnBeforeSwapOutSpy.calledOnce);
    assert.ok(screenOnBeforeSwapOutSpy.calledOn(myScreen));
    assert.ok(screenOnBeforeSwapOutSpy.calledWith(view, myScreen, otherOptions));

    assert.ok(screenOnSwapOutSpy.calledOnce);
    assert.ok(screenOnSwapOutSpy.calledOn(myScreen));
    assert.ok(screenOnSwapOutSpy.calledWith(undefined, myScreen, otherOptions));

  });

  QUnit.test('when showing an initial view ..', function(assert) {

    var MyScreen = Mob.Screen.extend({
      el: '#screen',
      onBeforeShow: function() {},
      onShow: function() {},
      onSwap: function() {},
      onBeforeSwapOut: function() {},
      onSwapOut: function() {}
    });

    var MyView = Mob.View.extend({
      events: {
        'click': function() {}
      },
      render: function() {
        $(this.el).html('some content');
      },
      destroy: function() {},
      onBeforeShow: function() {},
      onShow: function() {
        $(this.el).addClass('onShowClass');
      }
    });

    var screenShowSpy = sinon.spy();
    var screenBeforeShowSpy = sinon.spy();
    var screenBeforeSwapSpy = sinon.spy();
    var screenSwapSpy = sinon.spy();
    var viewBeforeShowSpy = sinon.spy();
    var viewShowSpy = sinon.spy();
    var screenEmptySpy = sinon.spy();
    var screenBeforeEmptySpy = sinon.spy();

    var view = new MyView();
    var viewRenderSpy = sinon.spy(view, 'render');
    var viewOnBeforeShowSpy = sinon.spy(view, 'onBeforeShow');
    var viewOnShowSpy = sinon.spy(view, 'onShow');

    var myScreen = new MyScreen();
    var screenOnBeforeShowSpy = sinon.spy(myScreen, 'onBeforeShow');
    var screenOnShowSpy = sinon.spy(myScreen, 'onShow');
    var screenOnAttachHtmlSpy = sinon.spy(myScreen, 'attachHtml');
    var screenOnSwapSpy = sinon.spy(myScreen, 'onSwap');
    var screenOnBeforeSwapOutSpy = sinon.spy(myScreen, 'onBeforeSwapOut');
    var screenOnSwapOutSpy = sinon.spy(myScreen, 'onSwapOut');

    myScreen.on('show', screenShowSpy);
    myScreen.on('before:show', screenBeforeShowSpy);
    myScreen.on('before:swap', screenBeforeSwapSpy);
    myScreen.on('swap', screenSwapSpy);
    myScreen.on('empty', screenEmptySpy);
    myScreen.on('before:empty', screenBeforeEmptySpy);
    view.on('before:show', viewBeforeShowSpy);
    view.on('show', viewShowSpy);

    sinon.spy(myScreen, 'show');

    var showOptions = {
      foo: 'bar'
    };
    myScreen.show(view, showOptions);

    var MyScreen = Mob.Screen.extend({
      el: '#screen',
      onShow: function() {},
      onSwap: function() {}
    });

    var MyView2 = Mob.View.extend({
      render: function() {
        $(this.el).html('some more content');
      },

      destroy: function() {},

      onShow: function() {
        $(this.el).addClass('onShowClass');
      }
    });

    var view1 = new MyView();
    var view2 = new MyView2();
    var myScreen = new MyScreen();

    sinon.spy(view1, 'destroy');
    sinon.spy(view1, 'off');
    sinon.spy(view2, 'destroy');

    myScreen.show(view1);

    myScreen.show(view2, {
      preventDestroy: true
    });
    assert.equal(view1.destroy.callCount, (0));
    assert.equal(view1._parent, undefined);
    assert.ok(view1.off.calledOnce);

    assert.ok(view1.off.calledOnce);
    view1.destroy();

  });

  QUnit.test('when showing an initial view ...', function(assert) {

    var MyScreen = Mob.Screen.extend({
      el: '#screen',
      onBeforeShow: function() {},
      onShow: function() {},
      onSwap: function() {},
      onBeforeSwapOut: function() {},
      onSwapOut: function() {}
    });

    var MyView = Mob.View.extend({
      events: {
        'click': function() {}
      },
      render: function() {
        $(this.el).html('some content');
      },
      destroy: function() {},
      onBeforeShow: function() {},
      onShow: function() {
        $(this.el).addClass('onShowClass');
      }
    });

    var screenShowSpy = sinon.spy();
    var screenBeforeShowSpy = sinon.spy();
    var screenBeforeSwapSpy = sinon.spy();
    var screenSwapSpy = sinon.spy();
    var viewBeforeShowSpy = sinon.spy();
    var viewShowSpy = sinon.spy();
    var screenEmptySpy = sinon.spy();
    var screenBeforeEmptySpy = sinon.spy();

    var view = new MyView();
    var viewRenderSpy = sinon.spy(view, 'render');
    var viewOnBeforeShowSpy = sinon.spy(view, 'onBeforeShow');
    var viewOnShowSpy = sinon.spy(view, 'onShow');

    var myScreen = new MyScreen();
    var screenOnBeforeShowSpy = sinon.spy(myScreen, 'onBeforeShow');
    var screenOnShowSpy = sinon.spy(myScreen, 'onShow');
    var screenOnAttachHtmlSpy = sinon.spy(myScreen, 'attachHtml');
    var screenOnSwapSpy = sinon.spy(myScreen, 'onSwap');
    var screenOnBeforeSwapOutSpy = sinon.spy(myScreen, 'onBeforeSwapOut');
    var screenOnSwapOutSpy = sinon.spy(myScreen, 'onSwapOut');

    myScreen.on('show', screenShowSpy);
    myScreen.on('before:show', screenBeforeShowSpy);
    myScreen.on('before:swap', screenBeforeSwapSpy);
    myScreen.on('swap', screenSwapSpy);
    myScreen.on('empty', screenEmptySpy);
    myScreen.on('before:empty', screenBeforeEmptySpy);
    view.on('before:show', viewBeforeShowSpy);
    view.on('show', viewShowSpy);

    sinon.spy(myScreen, 'show');

    var showOptions = {
      foo: 'bar'
    };
    myScreen.show(view, showOptions);


    var MyScreen = Mob.Screen.extend({
      el: '#screen',
      onShow: function() {},
      onSwap: function() {}
    });

    var MyView2 = Mob.View.extend({
      render: function() {
        $(this.el).html('some more content');
      },

      destroy: function() {},

      onShow: function() {
        $(this.el).addClass('onShowClass');
      }
    });

    var view1 = new MyView();
    var view2 = new MyView2();
    var myScreen = new MyScreen();

    sinon.spy(view1, 'destroy');
    sinon.spy(view1, 'off');
    sinon.spy(view2, 'destroy');

    myScreen.show(view1);

    myScreen.show(view2, {
      preventDestroy: false
    });
    assert.ok(view1.destroy.called);
    assert.equal(view1._parent, undefined);

  });

  QUnit.test('when a view is already shown and showing another', function(assert) {

    var MyScreen = Mob.Screen.extend({
      el: '#screen'
    });

    var MyView = Mob.View.extend({
      render: function() {
        $(this.el).html('some content');
      },

      destroy: function() {}
    });

    var view1 = new MyView();
    var view2 = new MyView();
    var myScreen = new MyScreen();

    sinon.spy(view1, 'destroy');

    myScreen.show(view1);
    myScreen.show(view2);

    assert.ok(view1.destroy.called);
    assert.deepEqual(myScreen.currentView, view2);

  });

  QUnit.test('when a view is already shown and showing the same one with a forceShow flag', function(assert) {

    var MyScreen = Mob.Screen.extend({
      el: '#screen'
    });

    var MyView = Mob.View.extend({
      render: function() {
        $(this.el).html('some content');
      },

      destroy: function() {},
      attachHtml: function() {}
    });

    var view = new MyView();
    var myScreen = new MyScreen();
    myScreen.show(view);

    sinon.spy(view, 'destroy');
    sinon.spy(myScreen, 'attachHtml');
    sinon.spy(view, 'render');
    myScreen.show(view, {
      forceShow: true
    });

    assert.ok(myScreen.attachHtml.calledWith(view));
    assert.ok(view.render.called);

  });

  // build-screen

  QUnit.test('buildScreen with a selector string', function(assert) {

    var DefaultScreenClass = Mob.Screen.extend();

    var fooSelector = '#foo-screen';
    var fooScreen = new DefaultScreenClass({
      el: fooSelector
    });
    var barSelector = '#bar-screen';
    var BarScreen = Mob.Screen.extend({
      el: barSelector
    });
    var barScreen = new BarScreen();
    var BazScreen = Mob.Screen.extend();

    var screen = Mob.Screen.buildScreen(fooSelector, DefaultScreenClass);

    assert.deepEqual(screen, fooScreen);

    assert.ok(screen instanceof DefaultScreenClass);

    assert.deepEqual(screen.el, $(fooSelector)[0]);

  });

  QUnit.test('buildScreen with a screen class', function(assert) {

    var DefaultScreenClass = Mob.Screen.extend();

    var fooSelector = '#foo-screen';
    var fooScreen = new DefaultScreenClass({
      el: fooSelector
    });
    var barSelector = '#bar-screen';
    var BarScreen = Mob.Screen.extend({
      el: barSelector
    });
    var barScreen = new BarScreen();
    var BazScreen = Mob.Screen.extend();

    var screen = Mob.Screen.buildScreen(BarScreen, DefaultScreenClass);

    assert.deepEqual(screen, barScreen);

    assert.ok(screen instanceof BarScreen);

    assert.deepEqual(screen.el, $(barSelector)[0]);

  });

  QUnit.test('buildScreen with an object literal', function(assert) {

    var DefaultScreenClass = Mob.Screen.extend();

    var fooSelector = '#foo-screen';
    var fooScreen = new DefaultScreenClass({
      el: fooSelector
    });
    var barSelector = '#bar-screen';
    var BarScreen = Mob.Screen.extend({
      el: barSelector
    });
    var barScreen = new BarScreen();
    var BazScreen = Mob.Screen.extend();

    var definition = {
      selector: fooSelector
    };
    var screen = Mob.Screen.buildScreen(definition, DefaultScreenClass);

    assert.deepEqual(screen, fooScreen);

    assert.ok(screen instanceof DefaultScreenClass);

    assert.deepEqual(screen.el, $(fooSelector)[0]);

  });

  QUnit.test('buildScreen with an object literal .', function(assert) {

    var DefaultScreenClass = Mob.Screen.extend();

    var fooSelector = '#foo-screen';
    var fooScreen = new DefaultScreenClass({
      el: fooSelector
    });
    var barSelector = '#bar-screen';
    var BarScreen = Mob.Screen.extend({
      el: barSelector
    });
    var barScreen = new BarScreen();
    var BazScreen = Mob.Screen.extend();

    var definition = {
      el: fooSelector
    };
    var screen = Mob.Screen.buildScreen(definition, DefaultScreenClass);

    assert.deepEqual(screen, fooScreen);

    assert.ok(screen instanceof DefaultScreenClass);

    assert.deepEqual(screen.el, $(fooSelector)[0]);

  });

  QUnit.test('buildScreen with an object literal .', function(assert) {

    var DefaultScreenClass = Mob.Screen.extend();

    var fooSelector = '#foo-screen';
    var fooScreen = new DefaultScreenClass({
      el: fooSelector
    });
    var barSelector = '#bar-screen';
    var BarScreen = Mob.Screen.extend({
      el: barSelector
    });
    var barScreen = new BarScreen();
    var BazScreen = Mob.Screen.extend();

    var el = $('<div id="baz-screen">')[0];
    var bazScreen = new DefaultScreenClass({
      el: el
    });
    var definition = {
      el: el
    };
    var screen = Mob.Screen.buildScreen(definition, DefaultScreenClass);

    assert.deepEqual(screen, bazScreen);

    assert.ok(screen instanceof DefaultScreenClass);

    assert.deepEqual(screen.el, el);

    var parentEl = $('<div id="not-actual-parent"></div>');
    definition = Mob.defaults({
      parentEl: parentEl
    }, definition);
    screen = Mob.Screen.buildScreen(definition, DefaultScreenClass);

    assert.deepEqual(screen.getEl(el), $(el));

  });

  QUnit.test('buildScreen with an object literal .', function(assert) {

    var DefaultScreenClass = Mob.Screen.extend();

    var fooSelector = '#foo-screen';
    var fooScreen = new DefaultScreenClass({
      el: fooSelector
    });
    var barSelector = '#bar-screen';
    var BarScreen = Mob.Screen.extend({
      el: barSelector
    });
    var barScreen = new BarScreen();
    var BazScreen = Mob.Screen.extend();

    var el = $('<div id="baz-screen">');
    var bazScreen = new DefaultScreenClass({
      el: el
    });
    var definition = {
      el: el
    };
    var screen = Mob.Screen.buildScreen(definition, DefaultScreenClass);

    assert.deepEqual(screen, bazScreen);

    assert.ok(screen instanceof DefaultScreenClass);

    assert.deepEqual(screen.el, el[0]);

  });


}());