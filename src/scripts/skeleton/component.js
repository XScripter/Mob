define('mob/component', function(require, exports, module) {

  var View = require('mob/view');

  var Component = View.extend({

    tagName: 'div',

    className: 'mo-component'

  });

  module.exports = Component;

});