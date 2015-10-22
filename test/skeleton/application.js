(function() {

  var initializeStub = sinon.stub(Mob.Application.prototype, 'initialize');

  QUnit.module('mob/application');

  QUnit.test('when registering an initializer and starting the application', function(assert) {

    var fooOptions = {
      foo: 'bar'
    };
    var appOptions = {
      baz: 'tah'
    };

    var app = new Mob.Application(appOptions);


    app.start(fooOptions);

    assert.ok(initializeStub.calledOn(app));
    assert.ok(initializeStub.calledWith(appOptions));

  });

  QUnit.test('when instantiating an app with options specified', function(assert) {

    var fooOption = 'bar';
    var appOptions = {
      fooOption: fooOption
    };
    var app = new Mob.Application(appOptions, 'fooArg');

    assert.deepEqual(app.fooOption, fooOption);
    assert.ok(initializeStub.calledOn(app));
    assert.ok(initializeStub.calledWith(appOptions, 'fooArg'));
  });

  QUnit.test('when specifying an on start callback, and starting the app', function(assert) {

    var fooOptions = {
      foo: 'bar'
    };
    var appOptions = {
      baz: 'tah'
    };

    var app = new Mob.Application(appOptions);

    var initializerStub = sinon.stub();
    app.on('start', initializerStub);

    app.start(fooOptions);

    assert.ok(initializerStub.calledOnce);

    assert.ok(initializerStub.calledWith(fooOptions));

    assert.ok(initializerStub.calledOn(app));

  });

  QUnit.test('when adding screen selectors to an app, and starting the app', function(assert) {

    var app = new Mob.Application();

    var beforeAddScreenStub = sinon.stub();
    var addScreenStub = sinon.stub();
    app.on('before:add:screen', beforeAddScreenStub);
    app.on('add:screen', addScreenStub);

    var fooScreen = new Mob.Screen({
      el: '#foo-screen1'
    });
    var barScreen = new Mob.Screen({
      el: '#bar-screen1'
    });

    fooScreen._parent = app._screenManager;
    barScreen._parent = app._screenManager;

    app.addScreens({
      fooScreen: '#foo-screen1',
      barScreen: '#bar-screen1'
    });
    app.start();

    assert.deepEqual(app.fooScreen, fooScreen);
    assert.deepEqual(app.barScreen, barScreen);
    assert.deepEqual(app._screenManager._parent, app);
    assert.ok(beforeAddScreenStub.calledWith('fooScreen', fooScreen));
    assert.ok(addScreenStub.calledWith('barScreen', barScreen));

  });

  QUnit.test('when adding screen objects to an app', function(assert) {

    var app = new Mob.Application();
    var FooScreen = Mob.Screen.extend({
      el: '#foo-screen'
    });
    var BarScreen = Mob.Screen.extend({
      el: '#bar-screen'
    });

    app.addScreens({
      fooScreen: FooScreen,
      barScreen: BarScreen
    });

    assert.ok(app.fooScreen instanceof FooScreen);
    assert.ok(app.barScreen instanceof BarScreen);

  });

  QUnit.test('when adding custom screen classes to an app, with selectors', function(assert) {
    var fooOption = 'bar';
    var fooSelector = '#foo-screen';
    var app = new Mob.Application();
    var FooScreen = Mob.Screen.extend();

    var fooScreen = new FooScreen({
      el: fooSelector,
      fooOption: fooOption
    });

    fooScreen._parent = app._screenManager;

    app.addScreens({
      fooScreen: {
        selector: fooSelector,
        screenClass: FooScreen,
        fooOption: fooOption
      }
    });

    assert.deepEqual(app.fooScreen, fooScreen);
    assert.ok(app.fooScreen instanceof FooScreen);
    assert.equal(app.fooScreen.$el.attr('id'), 'foo-screen');

  });

  QUnit.test('when adding screens as an option .', function(assert) {
    var fooSelector = '#foo-screen';
    var barSelector = '#bar-screen';
    var bazSelector = '#baz-screen';
    var quuxSelector = '#quux-selector';

    var BarScreen = Mob.Screen.extend();
    var BazScreen = Mob.Screen.extend({
      el: bazSelector
    });

    var app = new Mob.Application({
      screens: {
        fooScreen: fooSelector,
        barScreen: {
          selector: barSelector,
          screenClass: BarScreen
        },
        bazScreen: BazScreen
      }
    });

    assert.ok(app.fooScreen);
    assert.ok(app.barScreen);
    assert.ok(app.bazScreen);

    assert.ok(app.barScreen instanceof BarScreen);
    assert.ok(app.bazScreen instanceof BazScreen);
  });

  QUnit.test('when adding screens as an option ..', function(assert) {
    var fooSelector = '#foo-screen';
    var barSelector = '#bar-screen';
    var bazSelector = '#baz-screen';
    var quuxSelector = '#quux-selector';

    var BarScreen = Mob.Screen.extend();
    var BazScreen = Mob.Screen.extend({
      el: bazSelector
    });

    var App = Mob.Application.extend({
      screens: {
        fooScreen: fooSelector,
        barScreen: {
          selector: barSelector,
          screenClass: BarScreen
        }
      }
    });

    var app = new App({
      screens: {
        barScreen: BazScreen,
        quuxScreen: quuxSelector
      }
    });

    assert.ok(app.fooScreen);
    assert.ok(app.barScreen);
    assert.ok(app.quuxScreen);

    assert.ok(app.barScreen instanceof BazScreen);
    assert.deepEqual(app.quuxScreen.el, Mob.$(quuxSelector)[0]);
  });

  QUnit.test('when adding screens as an option ...', function(assert) {
    var fooSelector = '#foo-screen';
    var barSelector = '#bar-screen';
    var bazSelector = '#baz-screen';
    var quuxSelector = '#quux-selector';

    var BarScreen = Mob.Screen.extend();
    var BazScreen = Mob.Screen.extend({
      el: bazSelector
    });

    var screenOptionsStub = sinon.stub().returns({
      fooScreen: fooSelector,
      barScreen: {
        selector: barSelector,
        screenClass: BarScreen
      },
      bazScreen: BazScreen
    });

    var options = {
      screens: screenOptionsStub
    };

    var app = new Mob.Application(options);

    assert.ok(app.fooScreen);
    assert.ok(app.barScreen);
    assert.ok(app.bazScreen);

    assert.ok(app.barScreen instanceof BarScreen);
    assert.ok(app.bazScreen instanceof BazScreen);

    assert.ok(screenOptionsStub.calledOnce);
    assert.ok(screenOptionsStub.calledOn(app));

    assert.ok(screenOptionsStub.calledWith(options));
  });

  QUnit.test('when adding screens as an option ....', function(assert) {
    var fooSelector = '#foo-screen';
    var barSelector = '#bar-screen';
    var bazSelector = '#baz-screen';
    var quuxSelector = '#quux-selector';

    var BarScreen = Mob.Screen.extend();
    var BazScreen = Mob.Screen.extend({
      el: bazSelector
    });

    var App = Mob.Application.extend({
      screens: {
        fooScreen: fooSelector,
        barScreen: {
          selector: barSelector,
          screenClass: BarScreen
        }
      }
    });

    var screenOptionsStub = sinon.stub().returns({
      barScreen: BazScreen,
      quuxScreen: quuxSelector
    });

    var options = {
      screens: screenOptionsStub
    };

    var app = new App(options);

    assert.ok(app.fooScreen);
    assert.ok(app.barScreen);
    assert.ok(app.quuxScreen);

    assert.ok(app.barScreen instanceof BazScreen);
    assert.deepEqual(app.quuxScreen.el, Mob.$(quuxSelector).get(0));

    assert.ok(screenOptionsStub.calledOnce);
    assert.ok(screenOptionsStub.calledOn(app));

    assert.ok(screenOptionsStub.calledWith(options));

  });

  QUnit.test('when defining screens in a class definition .', function(assert) {
    var fooSelector = '#foo-screen';
    var barSelector = '#bar-screen';
    var bazSelector = '#baz-screen';

    var BarScreen = Mob.Screen.extend();
    var BazScreen = Mob.Screen.extend({
      el: bazSelector
    });

    var screens = {
      fooScreen: fooSelector,
      barScreen: {
        selector: barSelector,
        screenClass: BarScreen
      },
      bazScreen: BazScreen
    };

    var App = Mob.Application.extend({
      screens: screens
    });

    var app = new App();

    assert.ok(app.fooScreen);
    assert.ok(app.barScreen);
    assert.ok(app.bazScreen);

    assert.ok(app.barScreen instanceof BarScreen);
    assert.ok(app.bazScreen instanceof BazScreen);

  });

  QUnit.test('when defining screens in a class definition ..', function(assert) {
    var fooSelector = '#foo-screen';
    var barSelector = '#bar-screen';
    var bazSelector = '#baz-screen';

    var BarScreen = Mob.Screen.extend();
    var BazScreen = Mob.Screen.extend({
      el: bazSelector
    });

    var screens = {
      fooScreen: fooSelector,
      barScreen: {
        selector: barSelector,
        screenClass: BarScreen
      },
      bazScreen: BazScreen
    };

    var screenOptionsStub = sinon.stub().returns(screens);

    var options = {
      foo: 'bar'
    };

    var App = Mob.Application.extend({
      screens: screenOptionsStub
    });

    var app = new App(options);

    assert.ok(app.fooScreen);
    assert.ok(app.barScreen);
    assert.ok(app.bazScreen);

    assert.ok(app.barScreen instanceof BarScreen);
    assert.ok(app.bazScreen instanceof BazScreen);

    assert.ok(screenOptionsStub.calledOnce);
    assert.ok(screenOptionsStub.calledOn(app));

    assert.ok(screenOptionsStub.calledWith(options));

  });

  QUnit.test('when adding custom screen classes to an app', function(assert) {
    var fooSelector = '#foo-screen';
    var app = new Mob.Application();
    var FooScreen = Mob.Screen.extend({
      el: fooSelector
    });

    var fooScreen = new FooScreen();
    fooScreen._parent = app._screenManager;

    app.addScreens({
      fooScreen: FooScreen
    });

    assert.deepEqual(app.fooScreen, fooScreen);

    assert.ok(app.fooScreen instanceof FooScreen);

    assert.deepEqual(app.fooScreen.$el, Mob.$('#foo-screen'));
  });

  QUnit.test('when adding screens with a function', function(assert) {
    var app = new Mob.Application();

    var fooSelector = '#foo-screen';
    var barSelector = '#bar-screen';

    var fooScreen = new Mob.Screen({
      el: fooSelector
    });
    fooScreen._parent = app._screenManager;

    var BarScreen = Mob.Screen.extend();
    var barScreen = new BarScreen({
      el: barSelector
    });
    barScreen._parent = app._screenManager;

    var screenDefinition = sinon.stub().returns({
      fooScreen: fooSelector,
      barScreen: {
        selector: barSelector,
        screenClass: BarScreen
      }
    });

    var screens = app.addScreens(screenDefinition);

    assert.ok(screenDefinition.calledOnce);
    assert.ok(screenDefinition.calledWith(screenDefinition));

    assert.deepEqual(app.fooScreen, fooScreen);
    assert.deepEqual(app.barScreen, barScreen);

    assert.deepEqual(app.getScreen('fooScreen'), fooScreen);
    assert.deepEqual(app.getScreen('barScreen'), barScreen);

    assert.ok(app.getScreen('barScreen') instanceof BarScreen);
  });

  QUnit.test('when an app has a screen', function(assert) {
    var app = new Mob.Application();
    var fooScreen = new Mob.Screen({
      el: '#foo-screen'
    });
    fooScreen._parent = app._screenManager;

    app.addScreens({
      fooScreen: '#foo-screen'
    });

    assert.deepEqual(app.fooScreen, fooScreen);
    assert.deepEqual(app.getScreen('fooScreen'), app.fooScreen);
  });

  QUnit.test('when destroying all screens in the app', function(assert) {
    var app = new Mob.Application();
    app.addScreens({
      fooScreen: '#foo-screen',
      barScreen: '#bar-screen'
    });
    var screens = app.getScreens();

    sinon.spy(app.fooScreen, 'empty');
    sinon.spy(app.barScreen, 'empty');

    sinon.spy(app, 'emptyScreens');
    app.emptyScreens();

    assert.ok(app.fooScreen.empty.called);
    assert.ok(app.barScreen.empty.called);
  });

  QUnit.test('when an app has multiple screens', function(assert) {
    var App = new Mob.Application();
    App.addScreens({
      r1: '#foo-screen',
      r2: '#bar-screen'
    });

    var screens = App.getScreens();

    assert.deepEqual(screens.r1, App.getScreen('r1'));
    assert.deepEqual(screens.r2, App.getScreen('r2'));
  });

  QUnit.test('when removing a screen', function(assert) {
    var app = new Mob.Application();
    app.addScreens({
      fooScreen: '#foo-screen',
      barScreen: '#bar-screen'
    });
    var fooScreen = app.fooScreen;

    var beforeRemoveScreenStub = sinon.stub();
    var removeScreenStub = sinon.stub();
    app.on('before:remove:screen', beforeRemoveScreenStub);
    app.on('remove:screen', removeScreenStub);

    app.start();

    sinon.spy(app, 'removeScreen');
    app.removeScreen('fooScreen');

    assert.ok(!app.fooScreen);

    assert.ok(beforeRemoveScreenStub.calledWith('fooScreen', fooScreen));

    assert.ok(removeScreenStub.calledWith('fooScreen', fooScreen));

  });

  QUnit.test('overriding default screenManager', function(assert) {
    var getScreenManagerStub = sinon.stub().returns(new Mob.ScreenManager());

    var App = Mob.Application.extend({
      getScreenManager: getScreenManagerStub
    });

    var app = new App();

    assert.ok(app.getScreenManager.calledOnce);
    assert.ok(app.getScreenManager.calledOn(app));
  });

}());