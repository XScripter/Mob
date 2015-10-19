define('mob/error', function(require, exports, module) {

  var lang = require('mob/lang');

  var errorProps = ['description', 'fileName', 'lineNumber', 'name', 'message', 'number'];

  var MoError = lang.inherits.call(Error, {

    urlRoot: 'http://xscripter.com/mobjs/docs/v' + Mob.VERSION + '/',

    constructor: function(message, options) {
      if (lang.isObject(message)) {
        options = message;
        message = options.message;
      } else if (!options) {
        options = {};
      }

      var error = Error.call(this, message);
      lang.extend(this, lang.pick(error, errorProps), lang.pick(options, errorProps));

      this.captureStackTrace();

      if (options.url) {
        this.url = this.urlRoot + options.url;
      }
    },

    captureStackTrace: function() {
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, MoError);
      }
    },

    toString: function() {
      return this.name + ': ' + this.message + (this.url ? ' See: ' + this.url : '');
    }
  });

  MoError.extend = lang.inherits;

  module.exports = MoError;

});