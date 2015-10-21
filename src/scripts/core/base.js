define('mob/base', function(require, exports, module) {

  var lang = require('mob/lang');
  var $ = require('mob/jqlite');
  var Error = require('mob/error');

  var eachFn = lang.each;
  var isFunctionFn = lang.isFunction;
  var restFn = lang.rest;

  function bindFromStrings(target, entity, evt, methods) {
    var methodNames = methods.split(/\s+/);

    eachFn(methodNames, function(methodName) {

      var method = target[methodName];
      if (!method) {
        throw new Error('Method "' + methodName + '" was configured as an event handler, but does not exist.');
      }

      target.listenTo(entity, evt, method);
    });
  }

  function bindToFunction(target, entity, evt, method) {
    target.listenTo(entity, evt, method);
  }

  function unbindFromStrings(target, entity, evt, methods) {
    var methodNames = methods.split(/\s+/);

    eachFn(methodNames, function(methodName) {
      var method = target[methodName];
      target.stopListening(entity, evt, method);
    });
  }

  function unbindToFunction(target, entity, evt, method) {
    target.stopListening(entity, evt, method);
  }

  function iterateEvents(target, entity, bindings, functionCallback, stringCallback) {
    if (!entity || !bindings) {
      return;
    }

    if (!lang.isObject(bindings)) {
      throw new Error('Bindings must be an object or function.');
    }

    // allow the bindings to be a function
    bindings = _getValue(bindings, target);

    // iterate the bindings and bind them
    eachFn(bindings, function(methods, evt) {

      // allow for a function as the handler,
      // or a list of event names as a string
      if (isFunctionFn(methods)) {
        functionCallback(target, entity, evt, methods);
      } else {
        stringCallback(target, entity, evt, methods);
      }

    });
  }

  var isNodeAttached = exports.isNodeAttached = function(el) {
    return $.contains(document.documentElement, el);
  };

  var _triggerMethod = exports._triggerMethod = (function() {

    // split the event name on the ":"
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

      // get the method name from the event name
      var methodName = 'on' + event.replace(splitter, getEventName);
      var method = context[methodName];
      var result;

      if (isFunctionFn(method)) {
        // pass all args, except the event name
        result = method.apply(context, noEventArg ? restFn(args) : args);
      }

      // trigger the event, if a trigger method exists
      if (isFunctionFn(context.trigger)) {
        if (noEventArg + args.length > 1) {
          context.trigger.apply(context, noEventArg ? args : [event].concat(restFn(args, 0)));
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

  var triggerMethodOn = exports.triggerMethodOn = function(context) {
    var fnc = isFunctionFn(context.triggerMethod) ? context.triggerMethod : triggerMethod;

    return fnc.apply(context, restFn(arguments));
  };

  // Merge `keys` from `options` onto `this`
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
    if (target.options && (!lang.isUndefined(target.options[optionName]))) {
      return target.options[optionName];
    } else {
      return target[optionName];
    }
  };

  exports.proxyGetOption = function(optionName) {
    return getOption(this, optionName);
  };

  // If a function is provided we call it with context
  // otherwise just return the value. If the value is
  // undefined return a default value
  var _getValue = exports._getValue = function(value, context, params) {
    if (isFunctionFn(value)) {
      value = params ? value.apply(context, params) : value.call(context);
    }
    return value;
  };

  exports.getValue = function(object, prop) {
    if (!(object && object[prop])) {
      return null;
    }
    return isFunctionFn(object[prop]) ? object[prop]() : object[prop];
  };

  var bindEntityEvents = exports.bindEntityEvents = function(target, entity, bindings) {
    iterateEvents(target, entity, bindings, bindToFunction, bindFromStrings);
  };

  var unbindEntityEvents = exports.unbindEntityEvents = function(target, entity, bindings) {
    iterateEvents(target, entity, bindings, unbindToFunction, unbindFromStrings);
  };

  exports.proxyBindEntityEvents = function(entity, bindings) {
    return bindEntityEvents(this, entity, bindings);
  };

  exports.proxyUnbindEntityEvents = function(entity, bindings) {
    return unbindEntityEvents(this, entity, bindings);
  };

  // Monitor a view's state, and after it has been rendered and shown
  // in the DOM, trigger a "dom:refresh" event every time it is
  // re-rendered.
  exports.monitorDOMRefresh = function(view) {

    if (view._isDomRefreshMonitored) {
      return;
    }

    view._isDomRefreshMonitored = true;

    function handleShow() {
      view._isShown = true;
      triggerDOMRefresh();
    }

    function handleRender() {
      view._isRendered = true;
      triggerDOMRefresh();
    }

    function triggerDOMRefresh() {
      if (view._isShown && view._isRendered && isNodeAttached(view.el)) {
        triggerMethodOn(view, 'dom:refresh', view);
      }
    }

    view.on({
      show: handleShow,
      render: handleRender
    });
  };

});