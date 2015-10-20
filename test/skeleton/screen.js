(function() {

  var $ = Mob.$;

  QUnit.module('mob/screen');

  QUnit.test('when creating a new region and no configuration has been provided', function(assert) {

    assert.throws(function() {
      return new Mob.Screen();
    }, 'An "el" must be specified for a region.');

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

    var regionShowSpy = sinon.spy();
    var regionBeforeShowSpy = sinon.spy();
    var regionBeforeSwapSpy = sinon.spy();
    var regionSwapSpy = sinon.spy();
    var viewBeforeShowSpy = sinon.spy();
    var viewShowSpy = sinon.spy();
    var regionEmptySpy = sinon.spy();
    var regionBeforeEmptySpy = sinon.spy();

    var view = new MyView();
    var viewRenderSpy = sinon.spy(view, 'render');
    var viewOnBeforeShowSpy = sinon.spy(view, 'onBeforeShow');
    var viewOnShowSpy = sinon.spy(view, 'onShow');

    var myScreen = new MyScreen();
    var regionOnBeforeShowSpy = sinon.spy(myScreen, 'onBeforeShow');
    var regionOnShowSpy = sinon.spy(myScreen, 'onShow');
    var regionOnAttachHtmlSpy = sinon.spy(myScreen, 'attachHtml');
    var regionOnSwapSpy = sinon.spy(myScreen, 'onSwap');
    var regionOnBeforeSwapOutSpy = sinon.spy(myScreen, 'onBeforeSwapOut');
    var regionOnSwapOutSpy = sinon.spy(myScreen, 'onSwapOut');

    myScreen.on('show', regionShowSpy);
    myScreen.on('before:show', regionBeforeShowSpy);
    myScreen.on('before:swap', regionBeforeSwapSpy);
    myScreen.on('swap', regionSwapSpy);
    myScreen.on('empty', regionEmptySpy);
    myScreen.on('before:empty', regionBeforeEmptySpy);
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
    assert.ok(regionOnAttachHtmlSpy.called);

    assert.ok(viewOnShowSpy.called);
    assert.ok($(view.el).hasClass('onShowClass'));

    assert.ok(viewOnShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(regionOnShowSpy.called);

    assert.ok(regionOnShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(regionShowSpy.called);

    assert.ok(regionShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(regionBeforeShowSpy.called);

    assert.ok(regionBeforeShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(regionOnBeforeShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(viewBeforeShowSpy.called);

    assert.ok(viewBeforeShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(viewOnBeforeShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(viewShowSpy.calledOnce);

    assert.ok(viewShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(regionBeforeShowSpy.calledBefore(regionOnAttachHtmlSpy));

    assert.ok(regionShowSpy.calledWith(view, myScreen, showOptions));

    assert.ok(regionShowSpy.calledOn(myScreen));

    assert.ok(!regionBeforeSwapSpy.called);

    assert.ok(!regionOnBeforeSwapOutSpy.called);

    assert.ok(!regionOnSwapOutSpy.called);

    assert.ok(!regionSwapSpy.called);

    assert.ok(!regionOnSwapSpy.called);

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

    var regionShowSpy = sinon.spy();
    var regionBeforeShowSpy = sinon.spy();
    var regionBeforeSwapSpy = sinon.spy();
    var regionSwapSpy = sinon.spy();
    var viewBeforeShowSpy = sinon.spy();
    var viewShowSpy = sinon.spy();
    var regionEmptySpy = sinon.spy();
    var regionBeforeEmptySpy = sinon.spy();

    var view = new MyView();
    var viewRenderSpy = sinon.spy(view, 'render');
    var viewOnBeforeShowSpy = sinon.spy(view, 'onBeforeShow');
    var viewOnShowSpy = sinon.spy(view, 'onShow');

    var myScreen = new MyScreen();
    var regionOnBeforeShowSpy = sinon.spy(myScreen, 'onBeforeShow');
    var regionOnShowSpy = sinon.spy(myScreen, 'onShow');
    var regionOnAttachHtmlSpy = sinon.spy(myScreen, 'attachHtml');
    var regionOnSwapSpy = sinon.spy(myScreen, 'onSwap');
    var regionOnBeforeSwapOutSpy = sinon.spy(myScreen, 'onBeforeSwapOut');
    var regionOnSwapOutSpy = sinon.spy(myScreen, 'onSwapOut');

    myScreen.on('show', regionShowSpy);
    myScreen.on('before:show', regionBeforeShowSpy);
    myScreen.on('before:swap', regionBeforeSwapSpy);
    myScreen.on('swap', regionSwapSpy);
    myScreen.on('empty', regionEmptySpy);
    myScreen.on('before:empty', regionBeforeEmptySpy);
    view.on('before:show', viewBeforeShowSpy);
    view.on('show', viewShowSpy);

    sinon.spy(myScreen, 'show');

    var showOptions = {
      foo: 'bar'
    };
    myScreen.show(view, showOptions);


    var view = myScreen.currentView;

    regionEmptySpy.reset();
    regionBeforeEmptySpy.reset();
    regionOnBeforeSwapOutSpy.reset();
    regionOnSwapOutSpy.reset();

    var view2 = new MyView();
    var otherOptions = {
      bar: 'foo'
    };
    myScreen.show(view2, otherOptions);

    assert.ok(regionBeforeSwapSpy.called);

    assert.ok(regionBeforeSwapSpy.calledWith(view2, myScreen, otherOptions));

    assert.ok(regionEmptySpy.calledOnce);
    assert.ok(regionBeforeEmptySpy.calledOnce);

    assert.ok(regionSwapSpy.called);

    assert.ok(regionSwapSpy.calledWith(view2, myScreen, otherOptions));

    assert.ok(regionOnSwapSpy.called);

    assert.ok(regionOnSwapSpy.calledWith(view2, myScreen, otherOptions));

    assert.ok(regionOnSwapSpy.calledOn(myScreen));

    assert.ok(myScreen.hasView());

    assert.deepEqual(view2._parent, myScreen);

    assert.ok(!view._parent);

    assert.ok(regionOnBeforeSwapOutSpy.calledOnce);
    assert.ok(regionOnBeforeSwapOutSpy.calledOn(myScreen));
    assert.ok(regionOnBeforeSwapOutSpy.calledWith(view, myScreen, otherOptions));

    assert.ok(regionOnSwapOutSpy.calledOnce);
    assert.ok(regionOnSwapOutSpy.calledOn(myScreen));
    assert.ok(regionOnSwapOutSpy.calledWith(undefined, myScreen, otherOptions));

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

    var regionShowSpy = sinon.spy();
    var regionBeforeShowSpy = sinon.spy();
    var regionBeforeSwapSpy = sinon.spy();
    var regionSwapSpy = sinon.spy();
    var viewBeforeShowSpy = sinon.spy();
    var viewShowSpy = sinon.spy();
    var regionEmptySpy = sinon.spy();
    var regionBeforeEmptySpy = sinon.spy();

    var view = new MyView();
    var viewRenderSpy = sinon.spy(view, 'render');
    var viewOnBeforeShowSpy = sinon.spy(view, 'onBeforeShow');
    var viewOnShowSpy = sinon.spy(view, 'onShow');

    var myScreen = new MyScreen();
    var regionOnBeforeShowSpy = sinon.spy(myScreen, 'onBeforeShow');
    var regionOnShowSpy = sinon.spy(myScreen, 'onShow');
    var regionOnAttachHtmlSpy = sinon.spy(myScreen, 'attachHtml');
    var regionOnSwapSpy = sinon.spy(myScreen, 'onSwap');
    var regionOnBeforeSwapOutSpy = sinon.spy(myScreen, 'onBeforeSwapOut');
    var regionOnSwapOutSpy = sinon.spy(myScreen, 'onSwapOut');

    myScreen.on('show', regionShowSpy);
    myScreen.on('before:show', regionBeforeShowSpy);
    myScreen.on('before:swap', regionBeforeSwapSpy);
    myScreen.on('swap', regionSwapSpy);
    myScreen.on('empty', regionEmptySpy);
    myScreen.on('before:empty', regionBeforeEmptySpy);
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
      render: function () {
        $(this.el).html('some more content');
      },

      destroy: function () {
      },

      onShow: function () {
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

    myScreen.show(view2, {preventDestroy: true});
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

    var regionShowSpy = sinon.spy();
    var regionBeforeShowSpy = sinon.spy();
    var regionBeforeSwapSpy = sinon.spy();
    var regionSwapSpy = sinon.spy();
    var viewBeforeShowSpy = sinon.spy();
    var viewShowSpy = sinon.spy();
    var regionEmptySpy = sinon.spy();
    var regionBeforeEmptySpy = sinon.spy();

    var view = new MyView();
    var viewRenderSpy = sinon.spy(view, 'render');
    var viewOnBeforeShowSpy = sinon.spy(view, 'onBeforeShow');
    var viewOnShowSpy = sinon.spy(view, 'onShow');

    var myScreen = new MyScreen();
    var regionOnBeforeShowSpy = sinon.spy(myScreen, 'onBeforeShow');
    var regionOnShowSpy = sinon.spy(myScreen, 'onShow');
    var regionOnAttachHtmlSpy = sinon.spy(myScreen, 'attachHtml');
    var regionOnSwapSpy = sinon.spy(myScreen, 'onSwap');
    var regionOnBeforeSwapOutSpy = sinon.spy(myScreen, 'onBeforeSwapOut');
    var regionOnSwapOutSpy = sinon.spy(myScreen, 'onSwapOut');

    myScreen.on('show', regionShowSpy);
    myScreen.on('before:show', regionBeforeShowSpy);
    myScreen.on('before:swap', regionBeforeSwapSpy);
    myScreen.on('swap', regionSwapSpy);
    myScreen.on('empty', regionEmptySpy);
    myScreen.on('before:empty', regionBeforeEmptySpy);
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
      render: function () {
        $(this.el).html('some more content');
      },

      destroy: function () {
      },

      onShow: function () {
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

    myScreen.show(view2, {preventDestroy: false});
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
    myScreen.show(view, {forceShow: true});

    assert.ok(myScreen.attachHtml.calledWith(view));
    assert.ok(view.render.called);

  });

}());