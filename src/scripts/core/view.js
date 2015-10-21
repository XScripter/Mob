define('mob/view', function(require, exports, module) {

  var lang = require('mob/lang');
  var $ = require('mob/jqlite');
  var Events = require('mob/events');
  var base = require('mob/base');

  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  var viewOptions = ['data', 'options', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  var View = function(options) {
    this.cid = lang.uniqueId('view');
    lang.extend(this, lang.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
  };

  lang.extend(View.prototype, Events, {

    tagName: 'div',

    $: function(selector) {
      return this.$el.find(selector);
    },

    super: function(fn) {

      var caller = View.prototype.super.caller;
      var found;
      for (var child = this; child && lang.isFunction(child[fn]); child = child.constructor.__super__) {
        if (!found) {
          found = true;
        } else if (child[fn] != caller) {
          return child[fn].apply(this, [].slice.call(arguments, 1));
        }
      }

    },

    initialize: function() {},

    render: function() {
      return this;
    },

    remove: function() {
      this._removeElement();
      this.stopListening();
      return this;
    },

    _removeElement: function() {
      this.$el.remove();
    },

    setElement: function(element) {
      this.undelegateEvents();
      this._setElement(element);
      this.delegateEvents();
      return this;
    },

    _setElement: function(el) {
      this.$el = $(el);
      this.el = this.$el[0];
    },

    delegateEvents: function(events) {
      events || (events = lang.result(this, 'events'));
      if (!events) {
        return this;
      }
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!lang.isFunction(method)) {
          method = this[method];
        }
        if (!method) {
          continue;
        }
        var match = key.match(delegateEventSplitter);
        this.delegate(match[1], match[2], lang.bind(method, this));
      }
      return this;
    },

    delegate: function(eventName, selector, listener) {
      this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);
      return this;
    },

    undelegateEvents: function() {
      if (this.$el) {
        this.$el.off('.delegateEvents' + this.cid);
      }
      return this;
    },

    undelegate: function(eventName, selector, listener) {
      this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);
      return this;
    },

    _createElement: function(tagName) {
      return document.createElement(tagName);
    },

    _ensureElement: function() {
      if (!this.el) {
        var attrs = lang.extend({}, lang.result(this, 'attributes'));
        if (this.id) {
          attrs.id = lang.result(this, 'id');
        }
        if (this.className) {
          attrs['class'] = lang.result(this, 'className');
        }
        this.setElement(this._createElement(lang.result(this, 'tagName')));
        this._setAttributes(attrs);
      } else {
        this.setElement(lang.result(this, 'el'));
      }
    },

    _setAttributes: function(attributes) {
      this.$el.attr(attributes);
    }

  });

  View.extend = lang.inherits;

  module.exports = View;

});