define('mob/platform', function(require, exports, module) {

  var lang = require('mob/lang');
  var $ = require('mob/jqlite');

  var $body = $('body');

  var IOS = 'ios';
  var ANDROID = 'android';
  var WINDOWS_PHONE = 'windowsphone';
  var requestAnimationFrame = lang.requestAnimationFrame;

  var Platform = {

    navigator: window.navigator,

    isReady: false,

    isFullScreen: false,

    platforms: null,

    grade: null,

    ua: navigator.userAgent,

    ready: function(cb) {
      // run through tasks to complete now that the device is ready
      if (Platform.isReady) {
        cb();
      } else {
        // the platform isn't ready yet, add it to this array
        // which will be called once the platform is ready
        readyCallbacks.push(cb);
      }
    },

    detect: function() {
      Platform._checkPlatforms();

      requestAnimationFrame(function() {
        // only add to the body class if we got platform info
        for (var i = 0; i < Platform.platforms.length; i++) {
          $body.addClass('platform-' + Platform.platforms[i]);
        }
      });
    },

    setGrade: function(grade) {
      var oldGrade = Platform.grade;
      Platform.grade = grade;
      requestAnimationFrame(function() {
        if (oldGrade) {
          $body.removeClass('grade-' + oldGrade);
        }
        $body.addClass('grade-' + grade);
      });
    },

    device: function() {
      return window.device || {};
    },

    _checkPlatforms: function() {
      Platform.platforms = [];
      var grade = 'a';

      if (Platform.isWebView()) {
        Platform.platforms.push('webview');
        if (!(!window.cordova && !window.PhoneGap && !window.phonegap)) {
          Platform.platforms.push('cordova');
        } else if (window.forge) {
          Platform.platforms.push('trigger');
        }
      } else {
        Platform.platforms.push('browser');
      }
      if (Platform.isIPad()) Platform.platforms.push('ipad');

      var platform = Platform.platform();
      if (platform) {
        Platform.platforms.push(platform);

        var version = Platform.version();
        if (version) {
          var v = version.toString();
          if (v.indexOf('.') > 0) {
            v = v.replace('.', '_');
          } else {
            v += '_0';
          }
          Platform.platforms.push(platform + v.split('_')[0]);
          Platform.platforms.push(platform + v);

          if (Platform.isAndroid() && version < 4.4) {
            grade = (version < 4 ? 'c' : 'b');
          } else if (Platform.isWindowsPhone()) {
            grade = 'b';
          }
        }
      }

      Platform.setGrade(grade);
    },

    isWebView: function() {
      return !(!window.cordova && !window.PhoneGap && !window.phonegap && !window.forge);
    },

    isIPad: function() {
      if (/iPad/i.test(Platform.navigator.platform)) {
        return true;
      }
      return /iPad/i.test(Platform.ua);
    },

    isIOS: function() {
      return Platform.is(IOS);
    },

    isAndroid: function() {
      return Platform.is(ANDROID);
    },

    isWindowsPhone: function() {
      return Platform.is(WINDOWS_PHONE);
    },

    isMobile: function() {
      return !!Platform.ua.match(/android|webos|ip(hone|ad|od)|opera (mini|mobi|tablet)|iemobile|windows.+(phone|touch)|mobile|fennec|kindle (Fire)|Silk|maemo|blackberry|playbook|bb10\; (touch|kbd)|Symbian(OS)|Ubuntu Touch/i);
    },

    platform: function() {
      // singleton to get the platform name
      if (platformName === null) Platform.setPlatform(Platform.device().platform);
      return platformName;
    },

    setPlatform: function(n) {
      if (typeof n != 'undefined' && n !== null && n.length) {
        platformName = n.toLowerCase();
      } else if (lang.getParameterByName('ionicplatform')) {
        platformName = lang.getParameterByName('ionicplatform');
      } else if (Platform.ua.indexOf('Android') > 0) {
        platformName = ANDROID;
      } else if (/iPhone|iPad|iPod/.test(Platform.ua)) {
        platformName = IOS;
      } else if (Platform.ua.indexOf('Windows Phone') > -1) {
        platformName = WINDOWS_PHONE;
      } else {
        platformName = Platform.navigator.platform && navigator.platform.toLowerCase().split(' ')[0] || '';
      }
    },

    version: function() {
      // singleton to get the platform version
      if (platformVersion === null) Platform.setVersion(Platform.device().version);
      return platformVersion;
    },

    setVersion: function(v) {
      if (typeof v != 'undefined' && v !== null) {
        v = v.split('.');
        v = parseFloat(v[0] + '.' + (v.length > 1 ? v[1] : 0));
        if (!isNaN(v)) {
          platformVersion = v;
          return;
        }
      }

      platformVersion = 0;

      // fallback to user-agent checking
      var pName = Platform.platform();
      var versionMatch = {
        'android': /Android (\d+).(\d+)?/,
        'ios': /OS (\d+)_(\d+)?/,
        'windowsphone': /Windows Phone (\d+).(\d+)?/
      };
      if (versionMatch[pName]) {
        v = Platform.ua.match(versionMatch[pName]);
        if (v && v.length > 2) {
          platformVersion = parseFloat(v[1] + '.' + v[2]);
        }
      }
    },

    is: function(type) {
      type = type.toLowerCase();
      // check if it has an array of platforms
      if (Platform.platforms) {
        for (var x = 0; x < Platform.platforms.length; x++) {
          if (Platform.platforms[x] === type) return true;
        }
      }
      // exact match
      var pName = Platform.platform();
      if (pName) {
        return pName === type.toLowerCase();
      }

      // A quick hack for to check userAgent
      return Platform.ua.toLowerCase().indexOf(type) >= 0;
    },

    exitApp: function() {
      Platform.ready(function() {
        navigator.app && navigator.app.exitApp && navigator.app.exitApp();
      });
    },

    showStatusBar: function(val) {
      // Only useful when run within cordova
      Platform._showStatusBar = val;
      Platform.ready(function() {
        // run this only when or if the platform (cordova) is ready
        requestAnimationFrame(function() {
          if (Platform._showStatusBar) {
            // they do not want it to be full screen
            window.StatusBar && window.StatusBar.show();
            $body.removeClass('status-bar-hide');
          } else {
            // it should be full screen
            window.StatusBar && window.StatusBar.hide();
            $body.addClass('status-bar-hide');
          }
        });
      });
    },

    fullScreen: function(showFullScreen, showStatusBar) {
      // showFullScreen: default is true if no param provided
      Platform.isFullScreen = (showFullScreen !== false);

      // add/remove the fullscreen classname to the body
      $(document).ready(function() {
        // run this only when or if the DOM is ready
        requestAnimationFrame(function() {
          if (Platform.isFullScreen) {
            $body.addClass('fullscreen');
          } else {
            $body.removeClass('fullscreen');
          }
        });
        // showStatusBar: default is false if no param provided
        Platform.showStatusBar((showStatusBar === true));
      });

    }

  };

  var platformName = null, // just the name, like iOS or Android
    platformVersion = null, // a float of the major and minor, like 7.1
    readyCallbacks = [],
    windowLoadListenderAttached;

  // setup listeners to know when the device is ready to go
  function onWindowLoad() {
    if (Platform.isWebView()) {
      // the window and scripts are fully loaded, and a cordova/phonegap
      // object exists then let's listen for the deviceready
      document.addEventListener('deviceready', onPlatformReady, false);
    } else {
      // the window and scripts are fully loaded, but the window object doesn't have the
      // cordova/phonegap object, so its just a browser, not a webview wrapped w/ cordova
      onPlatformReady();
    }
    if (windowLoadListenderAttached) {
      window.removeEventListener('load', onWindowLoad, false);
    }
  }

  Platform.initialize = function() {
    if (document.readyState === 'complete') {
      onWindowLoad();
    } else {
      windowLoadListenderAttached = true;
      window.addEventListener('load', onWindowLoad, false);
    }
  };

  function onPlatformReady() {
    // the device is all set to go, init our own stuff then fire off our event
    Platform.isReady = true;
    Platform.detect();
    for (var x = 0; x < readyCallbacks.length; x++) {
      // fire off all the callbacks that were added before the platform was ready
      readyCallbacks[x]();
    }
    readyCallbacks = [];

    requestAnimationFrame(function() {
      $body.addClass('platform-ready');
    });
  }

  module.exports = Platform;

});