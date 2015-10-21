(function() {

  var $ = Mob.$;

  QUnit.module('mob/screenManager');

  QUnit.test('instantiating a screenManager', function(assert) {

    var context = $('<div><div id="thor"></div><div id="eos"></div></div>');
    var parentElHandler = sinon.stub().returns(context);

    var screens = {
      'aScreen': '#thor',
      'bScreen': '#eos'
    };

    var addScreenSpy = sinon.stub();

    var ScreenManager = Mob.ScreenManager.extend({
      addScreens: addScreenSpy
    });

    var screenManager = new ScreenManager({
      screens: screens
    });

    assert.ok(addScreenSpy.calledWith(screens));
    assert.ok(addScreenSpy.calledOn(screenManager));

  });

  QUnit.test('Mob .addScreen', function(assert) {

    var addHandler = sinon.spy();
    var beforeAddHandler = sinon.spy();

    var screenManager = new Mob.ScreenManager();
    screenManager.on('add:screen', addHandler);
    screenManager.on('before:add:screen', beforeAddHandler);

    var screen = screenManager.addScreen('foo', '#foo');

    assert.ok(screen);
    assert.deepEqual(screenManager.get('foo'), screen);
    assert.ok(beforeAddHandler.calledWith('foo', screen));
    assert.ok(addHandler.calledWith('foo', screen));
    assert.equal(screenManager.length, 1);

  });

  QUnit.test('Mob .addScreens with no options', function(assert) {

    var screenManager = new Mob.ScreenManager();

    var screens = screenManager.addScreens({
      foo: '#bar',
      baz: '#quux'
    });

    assert.ok(screenManager.get('foo'));
    assert.ok(screenManager.get('baz'));

    assert.deepEqual(screens.foo, screenManager.get('foo'));
    assert.deepEqual(screens.baz, screenManager.get('baz'));

  });

  QUnit.test('Mob .addScreens with screen instance', function(assert) {

    var fooScreen = new Mob.Screen({
      el: '#foo'
    });
    var screenManager = new Mob.ScreenManager();

    var screens = screenManager.addScreens({
      foo: fooScreen
    });

    assert.deepEqual(screenManager.get('foo'), fooScreen);

    assert.deepEqual(screens.foo, fooScreen);

  });

  QUnit.test('Mob .addScreens with defaults', function(assert) {

    var screenManager = new Mob.ScreenManager();

    var parent = $('<div></div>');

    var defaults = {
      parentEl: parent
    };

    var screens = screenManager.addScreens({
      foo: '#bar',
      baz: '#quux'
    }, defaults);

    assert.ok(screenManager.get('foo'));
    assert.ok(screenManager.get('baz'));

  });

  QUnit.test('Mob .addScreens with a function .', function(assert) {

    var screenManager = new Mob.ScreenManager();

    var fooSelector = '#foo-screen';
    var barSelector = '#bar-screen';
    var bazSelector = '#baz-screen';

    var fooScreen = new Mob.Screen({
      el: fooSelector
    });
    fooScreen._parent = screenManager;

    var barScreen = new Mob.Screen({
      el: barSelector
    });
    barScreen._parent = screenManager;

    var BazScreen = Mob.Screen.extend();
    var bazScreen = new BazScreen({
      el: bazSelector
    });
    bazScreen._parent = screenManager;

    var screenDefinition = sinon.stub().returns({
      fooScreen: fooSelector,
      barScreen: barScreen,
      bazScreen: {
        selector: bazSelector,
        screenClass: BazScreen
      }
    });

    var screens = screenManager.addScreens(screenDefinition);

    assert.ok(screenDefinition.calledOnce);
    assert.ok(screenDefinition.calledOn(screenManager));
    assert.ok(screenDefinition.calledWith(screenDefinition));

    assert.deepEqual(screens.fooScreen, fooScreen);
    assert.deepEqual(screens.barScreen, barScreen);
    assert.deepEqual(screens.bazScreen, bazScreen);

    assert.deepEqual(screenManager.get('fooScreen'), fooScreen);
    assert.deepEqual(screenManager.get('barScreen'), barScreen);
    assert.deepEqual(screenManager.get('bazScreen'), bazScreen);

    assert.ok(screenManager.get('bazScreen') instanceof BazScreen);

  });

  QUnit.test('Mob .addScreens with a function ..', function(assert) {

    var screenManager = new Mob.ScreenManager();

    var fooSelector = '#foo-screen';
    var barSelector = '#bar-screen';
    var bazSelector = '#baz-screen';

    var BazScreen = Mob.Screen.extend();
    var defaults = {
      screenClass: BazScreen
    };

    var fooScreen = new BazScreen({
      el: fooSelector
    });
    fooScreen._parent = screenManager;

    var barScreen = new BazScreen({
      el: barSelector
    });
    barScreen._parent = screenManager;

    var screenDefinition = sinon.stub().returns({
      fooScreen: fooSelector,
      barScreen: barSelector,
      bazScreen: {
        selector: bazSelector,
        screenClass: BazScreen
      }
    });

    var screens = screenManager.addScreens(screenDefinition, defaults);

    assert.ok(screenDefinition.calledOnce);
    assert.ok(screenDefinition.calledOn(screenManager));
    assert.ok(screenDefinition.calledWith(screenDefinition, defaults));

    assert.deepEqual(screenManager.get('fooScreen'), fooScreen);
    assert.deepEqual(screenManager.get('barScreen'), barScreen);

    assert.deepEqual(screenManager.get('fooScreen'), fooScreen);
    assert.deepEqual(screenManager.get('barScreen'), barScreen);

    assert.ok(screenManager.get('fooScreen') instanceof BazScreen);
    assert.ok(screenManager.get('barScreen') instanceof BazScreen);

  });

  QUnit.test('Mob .getScreens', function(assert) {

    var screenManager = new Mob.ScreenManager();
    var r = screenManager.addScreen('foo', '#foo');
    var r2 = screenManager.addScreen('bar', '#bar');

    var screens = screenManager.getScreens();

    assert.deepEqual(screens.foo, r);
    assert.deepEqual(screens.bar, r2);

  });

  QUnit.test('Mob .removeScreen', function(assert) {

    var emptyHandler = sinon.spy();
    var beforeRemoveHandler = sinon.spy();
    var removeHandler = sinon.spy();

    var screenManager = new Mob.ScreenManager();
    var screen = screenManager.addScreen('foo', '#foo');
    screen.show(new Mob.View());

    screen.on('empty', emptyHandler);
    screenManager.on('before:remove:screen', beforeRemoveHandler);
    screenManager.on('remove:screen', removeHandler);
    sinon.spy(screen, 'stopListening');

    sinon.spy(screenManager, 'removeScreen');
    screenManager.removeScreen('foo');

    assert.ok(emptyHandler.called);

    assert.ok(screen.stopListening.calledWith());

    assert.equal(screenManager.get('foo'), undefined);

    assert.ok(beforeRemoveHandler.calledWith('foo', screen));

    assert.ok(removeHandler.calledWith('foo', screen));

    assert.equal(screenManager.length, 0);

    assert.ok(!screen._parent);

  });

  QUnit.test('Mob .removeScreens', function(assert) {

    var emptyHandler = sinon.stub();
    var emptyHandler2 = sinon.stub();
    var removeHandler = sinon.stub();

    var screenManager = new Mob.ScreenManager();
    var screen = screenManager.addScreen('foo', '#foo');
    var r2 = screenManager.addScreen('bar', '#bar');
    var screens = screenManager.getScreens();

    screen.show(new Mob.View());
    r2.show(new Mob.View());

    screen.on('empty', emptyHandler);
    r2.on('empty', emptyHandler2);

    screenManager.on('remove:screen', removeHandler);

    sinon.spy(screen, 'stopListening');
    sinon.spy(r2, 'stopListening');

    sinon.spy(screenManager, 'removeScreens');
    screenManager.removeScreens();

    assert.ok(emptyHandler.called);
    assert.ok(emptyHandler2.called);

    assert.ok(screen.stopListening.calledWith());
    assert.ok(r2.stopListening.calledWith());

    assert.ok(!screenManager.get('foo'));
    assert.ok(!screenManager.get('bar'));

    assert.ok(removeHandler.calledWith('foo', screen));
    assert.ok(removeHandler.calledWith('bar', r2));

  });

  QUnit.test('Mob .emptyScreens', function(assert) {

    var emptyHandler = sinon.stub();
    var destroyManagerHandler = sinon.stub();

    var screenManager = new Mob.ScreenManager();
    var screen = screenManager.addScreen('foo', '#foo');
    var screens = screenManager.getScreens();
    screen.show(new Mob.View());

    screen.on('empty', emptyHandler);

    sinon.spy(screenManager, 'emptyScreens');
    screenManager.emptyScreens();

    assert.ok(emptyHandler.called);

    assert.deepEqual(screenManager.get('foo'), screen);

  });

  QUnit.test('Mob .destroy', function(assert) {

    var emptyHandler = sinon.stub();
    var destroyManagerHandler = sinon.stub();

    var screenManager = new Mob.ScreenManager();
    var screen = screenManager.addScreen('foo', '#foo');
    screen.show(new Mob.View());

    screen.on('empty', emptyHandler);
    screenManager.on('destroy', destroyManagerHandler);

    sinon.spy(screen, 'stopListening');

    sinon.spy(screenManager, 'destroy');
    screenManager.destroy();

    assert.ok(emptyHandler.called);

    assert.ok(screen.stopListening.calledWith());

    assert.ok(!screenManager.get('foo'));

    assert.ok(destroyManagerHandler.called);

  });

}());