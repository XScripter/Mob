var lang = require('mob/lang');
lang.extend(Mob, lang);

Mob.Logger = require('mob/logger');
Mob.each(['debug', 'time', 'timeEnd', 'info', 'warn', 'error', 'log'], function(method) {
  Mob[method] = Mob.Logger[method];
});

if (Mob.isUndefined(M$)) {
  M$ = require('mob/jqlite');
}

Mob.Class = require('mob/class');
Mob.Events = require('mob/events');
Mob.HTTP = require('mob/http');
Mob.Storage = require('mob/storage');
Mob.View = require('mob/view');
Mob.Support = require('mob/support');

Mob.Platform = require('mob/platform');
Mob.initializePlatform = Mob.Platform.initialize;
Mob.Touch = require('mob/touch');
Mob.initializeTouchEvent = Mob.Touch.initialize;
Mob.Scroller = require('mob/scroller');
Mob.Viewport = require('mob/viewport');
Mob.initializeViewport = Mob.Viewport.initialize;
Mob.Transition = require('mob/transition');

Mob.Swipe = require('mob/swipe');

Mob.Template = require('mob/template');
Mob.Component = require('mob/component');
Mob.Screen = require('mob/screen');
Mob.ScreenView = require('mob/screenView');
Mob.Router = require('mob/router');
Mob.Application = require('mob/application');
Mob.createApplication = function(options) {
  return new Mob.Application(options);
};

Mob.require = Mob.requireModule = require;
Mob.define = Mob.defineModule = define;