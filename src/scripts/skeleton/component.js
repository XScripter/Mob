define('mob/component', function(require, exports, module) {

  var lang = require('mob/lang');
  var View = require('mob/view');
  var Error = require('mob/error');
  var Template = require('mob/template');

  var Component = View.extend({

    tagName: 'div',

    className: 'mo-component',

    serializeData: function() {
      if (lang.isFunction(this.data)) {
        var serializeData = this.data();
        if (lang.isObject(serializeData)) {
          this.data = serializeData;
        }
      }

      return {
        data: this.data || {}
      };
    },

    render: function() {
      this._ensureViewIsIntact();

      this.triggerMethod('before:render', this);

      this._renderTemplate();
      this.isRendered = true;

      this.triggerMethod('render', this);

      return this;
    },

    _renderTemplate: function() {
      var template = this.getTemplate();

      if (template === false) {
        return;
      }

      if (!template) {
        throw new Error('Cannot render the template since it is null or undefined.');
      }

      this.registerTemplateHelpers();
      var data = this.serializeData();

      var compileHtml = Template.compile(template, data);

      // Render and add to el
      this.attachElContent(compileHtml);

      return this;
    },

    attachElContent: function(html) {
      this.$el.html(html);

      return this;
    }

  });

  module.exports = Component;

});