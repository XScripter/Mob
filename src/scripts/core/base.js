define('mob/base', function(require, exports, module) {

  var lang = require('mob/lang');
  var $ = require('mob/jqlite');

  function baseBindFromStrings(target, entity, evt, methods) {
    var methodNames = methods.split(/\s+/);

    lang.each(methodNames, function(methodName) {

      var method = target[methodName];
      if (!method) {
        throw new Error('Method "' + methodName + '" was configured as an event handler, but does not exist.');
      }

      target.listenTo(entity, evt, method);
    });
  }

  function baseBindToFunction(target, entity, evt, method) {
    target.listenTo(entity, evt, method);
  }

  function baseUnbindFromStrings(target, entity, evt, methods) {
    var methodNames = methods.split(/\s+/);

    lang.each(methodNames, function(methodName) {
      var method = target[methodName];
      target.stopListening(entity, evt, method);
    });
  }

  function baseUnbindToFunction(target, entity, evt, method) {
    target.stopListening(entity, evt, method);
  }

  function baseIterateEvents(target, entity, bindings, functionCallback, stringCallback) {
    if (!entity || !bindings) {
      return;
    }

    if (!lang.isObject(bindings)) {
      throw new Error('Bindings must be an object or function.');
    }

    // allow the bindings to be a function
    bindings = _getValue(bindings, target);

    // iterate the bindings and bind them
    lang.each(bindings, function(methods, evt) {

      // allow for a function as the handler,
      // or a list of event names as a string
      if (lang.isFunction(methods)) {
        functionCallback(target, entity, evt, methods);
      } else {
        stringCallback(target, entity, evt, methods);
      }

    });
  }

  exports.isNodeAttached = function(el) {
    return $.contains(document.documentElement, el);
  };

  var _triggerMethod = exports._triggerMethod = (function() {
    var splitter = /(^|:)(\w)/gi;

    function getEventName(match, prefix, eventName) {
      return eventName.toUpperCase();
    }

    return function(context, event, args) {
      var noEventArg = arguments.length < 3;
      if (noEventArg) {
        args = event;
        event = args[0];
      }

      var methodName = 'on' + event.replace(splitter, getEventName);
      var method = context[methodName];
      var result;

      if (lang.isFunction(method)) {
        result = method.apply(context, noEventArg ? lang.rest(args) : args);
      }

      if (lang.isFunction(context.trigger)) {
        if (noEventArg + args.length > 1) {
          context.trigger.apply(context, noEventArg ? args : [event].concat(lang.rest(args, 0)));
        } else {
          context.trigger(event);
        }
      }

      return result;
    };
  })();

  var triggerMethod = exports.triggerMethod = function(event) {
    return _triggerMethod(this, arguments);
  };

  exports.triggerMethodOn = function(context) {
    var fnc = lang.isFunction(context.triggerMethod) ? context.triggerMethod : triggerMethod;

    return fnc.apply(context, lang.rest(arguments));
  };

  exports.mergeOptions = function(options, keys) {
    if (!options) {
      return;
    }
    lang.extend(this, lang.pick(options, keys));
  };

  var getOption = exports.getOption = function(target, optionName) {
    if (!target || !optionName) {
      return;
    }
    if (target.options && (target.options[optionName] !== undefined)) {
      return target.options[optionName];
    } else {
      return target[optionName];
    }
  };

  exports.proxyGetOption = function(optionName) {
    return getOption(this, optionName);
  };

  var _getValue = exports._getValue = function(value, context, params) {
    if (lang.isFunction(value)) {
      value = params ? value.apply(context, params) : value.call(context);
    }
    return value;
  };

  exports.getValue = function(object, prop) {
    if (!(object && object[prop])) {
      return null;
    }
    return lang.isFunction(object[prop]) ? object[prop]() : object[prop];
  };

  var bindEntityEvents = exports.bindEntityEvents = function(target, entity, bindings) {
    baseIterateEvents(target, entity, bindings, baseBindToFunction, baseBindFromStrings);
  };

  var unbindEntityEvents = exports.unbindEntityEvents = function(target, entity, bindings) {
    baseIterateEvents(target, entity, bindings, baseUnbindToFunction, baseUnbindFromStrings);
  };

  exports.proxyBindEntityEvents = function(entity, bindings) {
    return bindEntityEvents(this, entity, bindings);
  };

  exports.proxyUnbindEntityEvents = function(entity, bindings) {
    return unbindEntityEvents(this, entity, bindings);
  };

});