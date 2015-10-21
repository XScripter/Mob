define('mob/screenView', function(require, exports, module) {

  var lang = require('mob/lang');
  var $ = require('mob/jqlite');
  var base = require('mob/base');
  var Logger = require('mob/logger');
  var View = require('mob/view');
  var ScreenComponent = require('mob/screenComponent');
  var Scroller = require('mob/scroller');

  var ScreenView = View.extend({

    tagName: 'div',

    className: 'mo-screen-view',

    constructor: function(options) {
      this.render = lang.bind(this.render, this);

      options = base._getValue(options, this);

      View.call(this, options);

      ScreenComponent.add(this);
      base.monitorDOMRefresh(this);

    },

    initScroller: function() {

      if (this.$('.mo-scroll-content').length === 0 || this.$('.mo-scroll').length === 0) {
        Logger.error('Can not find both ".mo-scroll-content" and ".mo-scroll" elements.');
        return;
      }

      if (!this.scroller) {
        this.scroller = new Scroller(this.$('.mo-scroll-content').get(0), {
          mouseWheel: true
        });

        $(document).unbind('touchmove.scroller').bind('touchmove.scroller', function (e) {
          e.preventDefault();
        });

      }
    },

    refreshScroller: function() {
      var self = this;
      setTimeout(function() {
        self.scroller && self.scroller.refresh();
      }, 300);
    },

    destroy: function() {

      if (this.isDestroyed) {
        return this;
      }

      var args = lang.toArray(arguments);

      this.triggerMethod.apply(this, ['before:destroy'].concat(args));

      this.isDestroyed = true;
      this.triggerMethod.apply(this, ['destroy'].concat(args));

      this.isRendered = false;

      this.remove();

      return this;
    }

  });

  module.exports = ScreenView;

});