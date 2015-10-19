(function() {

  var vportTag, _activeElement, viewportProperties;

  QUnit.module('mob/viewport', {

    beforeEach: function() {

      window.setTimeout = function() {};
      _activeElement = null; // the element which has focus
      window.cordova = undefined;
      window.device = undefined;
      window.navigator = {};
      window.innerWidth = 1;
      window.innerHeight = 2;
      Mob.Platform.ua = '';
      Mob.Platform.platforms = null;
      Mob.Platform.setPlatform('');
      Mob.Platform.setVersion('');
      viewportProperties = {};

      vportTag = document.createElement('meta');
      vportTag.setAttribute('name', 'viewport');
      document.head.appendChild(vportTag);

    },

    afterEach: function() {
      if (vportTag) {
        vportTag.parentNode.removeChild(vportTag);
      }
    }

  });

  QUnit.test('Should remove width and height from viewport for iOS >= 7.1, iPad, WebView', function(assert) {

    Mob.Platform.setPlatform('ios');
    Mob.Platform.ua = 'ipad';
    Mob.Platform.setVersion('7.1');
    window.cordova = {};

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no');

  });

  QUnit.test('Should remove width and height from viewport for iOS >= 7.1, iPad, Browser', function(assert) {

    Mob.Platform.setPlatform('ios');
    Mob.Platform.ua = 'ipad';
    Mob.Platform.setVersion('7.1');

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no');

  });

  QUnit.test('Should keep width and height in viewport for iOS 7.0, iPad, WebView, Portrait', function(assert) {

    Mob.Platform.setPlatform('ios');
    Mob.Platform.ua = 'ipad';
    Mob.Platform.setVersion('7.0');
    window.cordova = {};
    window.innerWidth = 1;
    window.innerHeight = 2;

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width, height=device-height');

  });

  QUnit.test('Should add width and height to viewport for iOS 7.0, iPad, WebView, Landscape', function(assert) {

    Mob.Platform.setPlatform('ios');
    Mob.Platform.ua = 'ipad';
    Mob.Platform.setVersion('7.0');
    window.cordova = {};
    window.innerWidth = 2;
    window.innerHeight = 1;

    vportTag.content = 'user-scalable=no';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width, height=0');

  });

  QUnit.test('Should keep width reset height to 0 in viewport for iOS 7.0, iPad, WebView, Landscape', function(assert) {
    Mob.Platform.setPlatform('ios');
    Mob.Platform.ua = 'ipad';
    Mob.Platform.setVersion('7.0');
    window.cordova = {};
    window.innerWidth = 2;
    window.innerHeight = 1;

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width, height=0');
  });


  // iOS 7.0, iPad, Browser

  QUnit.test('Should keep width, but remove height from viewport for iOS 7.0, iPad, Browser', function(assert) {
    Mob.Platform.setPlatform('ios');
    Mob.Platform.ua = 'ipad';
    Mob.Platform.setVersion('7.0');

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width');
  });


  // iOS 6.1, iPad, WebView

  QUnit.test('Should keep width, but remove height from viewport for iOS 6.1, iPad, WebView, Portrait', function(assert) {
    Mob.Platform.setPlatform('ios');
    Mob.Platform.ua = 'ipad';
    Mob.Platform.setVersion('6.1');
    window.cordova = {};
    window.innerWidth = 1;
    window.innerHeight = 2;

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width');
  });

  QUnit.test('Should keep width, but replace height with 0 in viewport for iOS 6.1, iPad, WebView, Landscape', function(assert) {
    Mob.Platform.setPlatform('ios');
    Mob.Platform.ua = 'ipad';
    Mob.Platform.setVersion('6.1');
    window.cordova = {};
    window.innerWidth = 2;
    window.innerHeight = 1;

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width, height=0');
  });


  // iOS 6.1, iPad, Browser

  QUnit.test('Should keep width, and set height=0 for viewport for iOS 6.1, iPad, Browser, Portrait', function(assert) {
    Mob.Platform.setPlatform('ios');
    Mob.Platform.ua = 'ipad';
    Mob.Platform.setVersion('6.1');

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width, height=0');
  });


  // iOS 7.1, iPhone, WebView

  QUnit.test('Should remove width and height from viewport for iOS 7.1, iPhone, WebView', function(assert) {
    Mob.Platform.setPlatform('ios');
    Mob.Platform.setVersion('7.1');
    window.cordova = {};

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no');
  });


  // iOS 7.1, iPhone, Browser

  QUnit.test('Should keep width, but remove height from viewport for iOS >= 7.1, iPhone, Browser', function(assert) {
    Mob.Platform.setPlatform('iOS');
    Mob.Platform.setVersion('7.1');

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width');
  });


  // iOS 7.0, iPhone, WebView

  QUnit.test('Should keep width, but not height in viewport for iOS 7.0, iPhone, WebView', function(assert) {
    Mob.Platform.setPlatform('iOS');
    Mob.Platform.setVersion('7.0');
    window.cordova = {};

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width, height=device-height');
  });


  // iOS 7.0, iPhone, Browser

  QUnit.test('Should keep width but remove height from viewport for iOS 7.0, iPhone, Browser', function(assert) {
    Mob.Platform.setPlatform('iOS');
    Mob.Platform.setVersion('7.0');

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width');
  });


  // iOS 6.1, iPhone, WebView

  QUnit.test('Should keep width but replace height=device-height with height=0 in viewport for iOS 6.1, iPhone, WebView', function(assert) {
    Mob.Platform.setPlatform('iOS');
    Mob.Platform.setVersion('6.1');
    window.cordova = {};

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width, height=0');
  });


  // iOS 6.1, iPhone, Browser
  QUnit.test('Should keep width but remove height from viewport for iOS 6.1, iPhone, Browser', function(assert) {
    Mob.Platform.setPlatform('iOS');
    Mob.Platform.setVersion('6.1');

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width, height=0');
  });


  // Android 4.4, WebView

  QUnit.test('Should add width, but not height to viewport for Android 4.4, WebView', function(assert) {
    Mob.Platform.setPlatform('android');
    Mob.Platform.setVersion('4.4');
    window.cordova = {};

    vportTag.content = 'user-scalable=no';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width');
  });

  QUnit.test('Should keep width, but remove height from viewport for Android 4.4, WebView', function(assert) {
    Mob.Platform.setPlatform('android');
    Mob.Platform.setVersion('4.4');
    window.cordova = {};

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width');
  });


  // Android 4.4, Browser

  QUnit.test('Should keep width, but remove height from viewport for Android 4.4, Browser', function(assert) {
    Mob.Platform.setPlatform('android');
    Mob.Platform.setVersion('4.4');

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width');
  });


  // Standard Browser

  QUnit.test('Should keep width, but remove height from viewport for Standard Browser', function(assert) {
    Mob.Platform.setPlatform('android');
    Mob.Platform.setVersion('4.4');

    vportTag.content = 'user-scalable=no, width=device-width, height=device-height';
    Mob.Viewport._viewportLoadTag();

    assert.equal(vportTag.content, 'user-scalable=no, width=device-width');
  });

}());