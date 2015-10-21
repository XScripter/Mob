var Logger = Mob.Logger = require('mob/logger');
Mob.Error = require('mob/error');

Mob.$ = Mob.$ || require('mob/jqlite');

Mob.Class = require('mob/class');
Mob.Events = require('mob/events');
Mob.HTTP = require('mob/http');
Mob.Storage = require('mob/storage');
Mob.View = require('mob/view');
Mob.Support = require('mob/support');

var Platform = Mob.Platform = require('mob/platform');
Mob.initializePlatform = Platform.initialize;
var Touch = Mob.Touch = require('mob/touch');
Mob.initializeTouchEvent = Touch.initialize;
Mob.Scroller = require('mob/scroller');
var Viewport = Mob.Viewport = require('mob/viewport');
Mob.initializeViewport = Viewport.initialize;
Mob.Transition = require('mob/transition');

Mob.Swipe = require('mob/swipe');

Mob.Template = require('mob/template');
Mob.Component = require('mob/component');
Mob.Screen = require('mob/screen');
Mob.ScreenView = require('mob/screenView');
Mob.ScreenComponent = require('mob/screenComponent');
Mob.Router = require('mob/router');
var Application = Mob.Application = require('mob/application');
Mob.createApplication = function(options) {
  return new Application(options);
};

Mob.require = Mob.requireModule = require;
Mob.define = Mob.defineModule = define;

var lang = require('mob/lang');
lang.extend(Mob, lang);
lang.each(['debug', 'time', 'timeEnd', 'info', 'warn', 'error', 'log'], function(method) {
  Mob[method] = Logger[method];
});