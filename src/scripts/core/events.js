define('mob/events', function(require, exports, module) {

  var lang = require('mob/lang');

  var eventsApi = function(iteratee, events, name, callback, opts) {
    var i = 0,
      names,
      eventSplitter = /\s+/;
    if (name && typeof name === 'object') {
      // Handle event maps.
      if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
      for (names = lang.keys(name); i < names.length; i++) {
        events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
      }
    } else if (name && eventSplitter.test(name)) {
      // Handle space separated event names by delegating them individually.
      for (names = name.split(eventSplitter); i < names.length; i++) {
        events = iteratee(events, names[i], callback, opts);
      }
    } else {
      events = iteratee(events, name, callback, opts);
    }
    return events;
  };

  var eventInternalOn = function(obj, name, callback, context, listening) {
    obj._events = eventsApi(eventOnApi, obj._events || {}, name, callback, {
      context: context,
      ctx: obj,
      listening: listening
    });

    if (listening) {
      var listeners = obj._listeners || (obj._listeners = {});
      listeners[listening.id] = listening;
    }

    return obj;
  };

  var eventOnApi = function(events, name, callback, options) {
    if (callback) {
      var handlers = events[name] || (events[name] = []);
      var context = options.context,
        ctx = options.ctx,
        listening = options.listening;
      if (listening) listening.count++;

      handlers.push({
        callback: callback,
        context: context,
        ctx: context || ctx,
        listening: listening
      });
    }
    return events;
  };

  var eventOffApi = function(events, name, callback, options) {
    if (!events) return;

    var i = 0,
      listening;
    var context = options.context,
      listeners = options.listeners;

    if (!name && !callback && !context) {
      var ids = lang.keys(listeners);
      for (; i < ids.length; i++) {
        listening = listeners[ids[i]];
        delete listeners[listening.id];
        delete listening.listeningTo[listening.objId];
      }
      return;
    }

    var names = name ? [name] : lang.keys(events);
    for (; i < names.length; i++) {
      name = names[i];
      var handlers = events[name];

      if (!handlers) break;

      var remaining = [];
      for (var j = 0; j < handlers.length; j++) {
        var handler = handlers[j];
        if (
          callback && callback !== handler.callback &&
          callback !== handler.callback._callback ||
          context && context !== handler.context
        ) {
          remaining.push(handler);
        } else {
          listening = handler.listening;
          if (listening && --listening.count === 0) {
            delete listeners[listening.id];
            delete listening.listeningTo[listening.objId];
          }
        }
      }

      // Update tail event if the list has any events.  Otherwise, clean up.
      if (remaining.length) {
        events[name] = remaining;
      } else {
        delete events[name];
      }
    }
    if (lang.size(events)) {
      return events;
    }
  };

  var eventOnceMap = function(map, name, callback, offer) {
    if (callback) {
      var once = map[name] = lang.once(function() {
        offer(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
    }
    return map;
  };

  var eventTriggerApi = function(objEvents, name, cb, args) {
    if (objEvents) {
      var events = objEvents[name];
      var allEvents = objEvents.all;
      if (events && allEvents) allEvents = allEvents.slice();
      if (events) eventTriggerEvents(events, args);
      if (allEvents) eventTriggerEvents(allEvents, [name].concat(args));
    }
    return objEvents;
  };

  var eventTriggerEvents = function(events, args) {
    var ev, i = -1,
      l = events.length,
      a1 = args[0],
      a2 = args[1],
      a3 = args[2];
    switch (args.length) {
      case 0:
        while (++i < l)(ev = events[i]).callback.call(ev.ctx);
        return;
      case 1:
        while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1);
        return;
      case 2:
        while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1, a2);
        return;
      case 3:
        while (++i < l)(ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
        return;
      default:
        while (++i < l)(ev = events[i]).callback.apply(ev.ctx, args);
        return;
    }
  };

  var Events = {

    on: function(name, callback, context) {
      return eventInternalOn(this, name, callback, context);
    },

    listenTo: function(obj, name, callback) {
      if (!obj) return this;
      var id = obj._listenId || (obj._listenId = lang.uniqueId('l'));
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var listening = listeningTo[id];

      if (!listening) {
        var thisId = this._listenId || (this._listenId = lang.uniqueId('l'));
        listening = listeningTo[id] = {
          obj: obj,
          objId: id,
          id: thisId,
          listeningTo: listeningTo,
          count: 0
        };
      }

      // Bind callbacks on obj, and keep track of them on listening.
      eventInternalOn(obj, name, callback, this, listening);
      return this;
    },

    off: function(name, callback, context) {
      if (!this._events) return this;
      this._events = eventsApi(eventOffApi, this._events, name, callback, {
        context: context,
        listeners: this._listeners
      });
      return this;
    },

    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;

      var ids = obj ? [obj._listenId] : lang.keys(listeningTo);

      for (var i = 0; i < ids.length; i++) {
        var listening = listeningTo[ids[i]];

        if (!listening) break;

        listening.obj.off(name, callback, this);
      }
      if (lang.isEmpty(listeningTo)) {
        this._listeningTo = void 0;
      }

      return this;
    },

    once: function(name, callback, context) {
      var events = eventsApi(eventOnceMap, {}, name, callback, lang.bind(this.off, this));
      return this.on(events, void 0, context);
    },

    listenToOnce: function(obj, name, callback) {
      var events = eventsApi(eventOnceMap, {}, name, callback, lang.bind(this.stopListening, this, obj));
      return this.listenTo(obj, events);
    },

    trigger: function(name) {
      if (!this._events) return this;

      var length = Math.max(0, arguments.length - 1);
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = arguments[i + 1];
      }

      eventsApi(eventTriggerApi, this._events, name, void 0, args);
      return this;
    }

  };

  module.exports = Events;

});