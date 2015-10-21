define('mob/class', function(require, exports, module) {

  var lang = require('mob/lang');
  var base = require('mob/base');
  var Events = require('mob/events');

  var extendFn = lang.extend;

  var Class = function(options) {
    this.options = extendFn({}, lang.result(this, 'options'), options);

    this.initialize.apply(this, arguments);
  };

  Class.extend = lang.inherits;

  extendFn(Class.prototype, Events, {

    initialize: function() {},

    destroy: function() {
      this.triggerMethod('before:destroy');
      this.triggerMethod('destroy');
      this.stopListening();

      return this;
    },

    triggerMethod: base.triggerMethod,

    mergeOptions: base.mergeOptions,

    getOption: base.proxyGetOption,

    bindEntityEvents: base.proxyBindEntityEvents,

    unbindEntityEvents: base.proxyUnbindEntityEvents
  });

  module.exports = Class;

});