define('mob/screen', function(require, exports, module) {

  var lang = require('mob/lang');
  var $ = require('mob/jqlite');
  var base = require('mob/base');
  var Class = require('mob/class');
  var Error = require('mob/error');

  var Screen = Class.extend({

    constructor: function(options) {

      this.options = options || {};
      this.el = this.getOption('el');

      this.el = $(this.el).get(0);

      if (!this.el) {
        throw new Error('An "el" must be specified for a screen.');
      }

      this.$el = this.getEl(this.el);
      Class.call(this, options);
    },

    // Displays a Mob view instance inside of the screen.
    // Handles calling the `render` method for you. Reads content
    // directly from the `el` attribute. Also calls an optional
    // `onShow` and `onDestroy` method on your view, just after showing
    // or just before destroying the view, respectively.
    // The `preventDestroy` option can be used to prevent a view from
    // the old view being destroyed on show.
    // The `forceShow` option can be used to force a view to be
    // re-rendered if it's already shown in the screen.
    show: function(view, options) {
      if (!this._ensureElement()) {
        return;
      }

      this._ensureViewIsIntact(view);
      base.monitorDOMRefresh(view);

      var showOptions = options || {};
      var isDifferentView = view !== this.currentView;
      var preventDestroy = !!showOptions.preventDestroy;
      var forceShow = !!showOptions.forceShow;

      // We are only changing the view if there is a current view to change to begin with
      var isChangingView = !!this.currentView;

      // Only destroy the current view if we don't want to `preventDestroy` and if
      // the view given in the first argument is different than `currentView`
      var _shouldDestroyView = isDifferentView && !preventDestroy;

      // Only show the view given in the first argument if it is different than
      // the current view or if we want to re-show the view. Note that if
      // `_shouldDestroyView` is true, then `_shouldShowView` is also necessarily true.
      var _shouldShowView = isDifferentView || forceShow;

      if (isChangingView) {
        this.triggerMethod('before:swapOut', this.currentView, this, options);
      }

      if (this.currentView) {
        delete this.currentView._parent;
      }

      if (_shouldDestroyView) {
        this.empty();
      } else if (isChangingView && _shouldShowView) {
        this.currentView.off('destroy', this.empty, this);
      }

      if (_shouldShowView) {

        // We need to listen for if a view is destroyed
        // in a way other than through the screen.
        // If this happens we need to remove the reference
        // to the currentView since once a view has been destroyed
        // we can not reuse it.
        view.once('destroy', this.empty, this);

        view.render();

        view._parent = this;

        if (isChangingView) {
          this.triggerMethod('before:swap', view, this, options);
        }

        this.triggerMethod('before:show', view, this, options);
        base.triggerMethodOn(view, 'before:show', view, this, options);

        if (isChangingView) {
          this.triggerMethod('swapOut', this.currentView, this, options);
        }

        // An array of views that we're about to display
        var attachedScreen = base.isNodeAttached(this.el);

        // The views that we're about to attach to the document
        // It's important that we prevent _getNestedViews from being executed unnecessarily
        // as it's a potentially-slow method
        var displayedViews = [];

        var attachOptions = lang.extend({
          triggerBeforeAttach: this.triggerBeforeAttach,
          triggerAttach: this.triggerAttach
        }, showOptions);

        if (attachedScreen && attachOptions.triggerBeforeAttach) {
          displayedViews = this._displayedViews(view);
          this._triggerAttach(displayedViews, 'before:');
        }

        this.attachHtml(view);
        this.currentView = view;

        if (attachedScreen && attachOptions.triggerAttach) {
          displayedViews = this._displayedViews(view);
          this._triggerAttach(displayedViews);
        }

        if (isChangingView) {
          this.triggerMethod('swap', view, this, options);
        }

        this.triggerMethod('show', view, this, options);
        base.triggerMethodOn(view, 'show', view, this, options);

        return this;
      }

      return this;
    },

    triggerBeforeAttach: true,
    triggerAttach: true,

    _triggerAttach: function(views, prefix) {
      var eventName = (prefix || '') + 'attach';
      lang.each(views, function(view) {
        base.triggerMethodOn(view, eventName, view, this);
      }, this);
    },

    _displayedViews: function(view) {
      return lang.union([view], lang.result(view, '_getNestedViews') || []);
    },

    _ensureElement: function() {
      if (!lang.isObject(this.el)) {
        this.$el = this.getEl(this.el);
        this.el = this.$el[0];
      }

      if (!this.$el || this.$el.length === 0) {
        if (this.getOption('allowMissingEl')) {
          return false;
        } else {
          throw new Error('An "el" ' + this.$el.selector + ' must exist in DOM');
        }
      }
      return true;
    },

    _ensureViewIsIntact: function(view) {
      if (!view) {
        throw new Error('The view passed is undefined and therefore invalid. You must pass a view instance to show.');
      }

      if (view.isDestroyed) {
        throw new Error('View (cid: "' + view.cid + '") has already been destroyed and cannot be used.');
      }
    },

    // Override this method to change how the screen finds the DOM
    // element that it manages. Return a jQuery selector object scoped
    // to a provided parent el or the document if none exists.
    getEl: function(el) {
      return $(el, base._getValue(this.options.parentEl, this));
    },

    // Override this method to change how the new view is
    // appended to the `$el` that the screen is managing
    attachHtml: function(view) {
      this.$el.contents().detach();

      this.el.appendChild(view.el);
    },

    empty: function(options) {
      var view = this.currentView;

      var emptyOptions = options || {};
      var preventDestroy = !!emptyOptions.preventDestroy;
      // If there is no view in the screen
      // we should not remove anything
      if (!view) {
        return;
      }

      view.off('destroy', this.empty, this);
      this.triggerMethod('before:empty', view);
      if (!preventDestroy) {
        this._destroyView();
      }
      this.triggerMethod('empty', view);

      // Remove screen pointer to the currentView
      delete this.currentView;

      if (preventDestroy) {
        this.$el.contents().detach();
      }

      return this;
    },

    // call 'destroy' or 'remove', depending on which is found on the view (if showing a raw View)
    _destroyView: function() {
      var view = this.currentView;
      if (view.isDestroyed) {
        return;
      }

      if (view.destroy) {
        view.destroy();
      } else {
        view.remove();

        // appending isDestroyed to raw Backbone View allows screens
        // to throw a ViewDestroyedError for this view
        view.isDestroyed = true;
      }
    },

    // Attach an existing view to the screen. This
    // will not call `render` or `onShow` for the new view,
    // and will not replace the current HTML for the `el`
    // of the screen.
    attachView: function(view) {
      if (this.currentView) {
        delete this.currentView._parent;
      }
      view._parent = this;
      this.currentView = view;
      return this;
    },

    // Checks whether a view is currently present within
    // the screen. Returns `true` if there is and `false` if
    // no view is present.
    hasView: function() {
      return !!this.currentView;
    },

    // Reset the screen by destroying any existing view and
    // clearing out the cached `$el`. The next time a view
    // is shown via this screen, the screen will re-query the
    // DOM for the screen's `el`.
    reset: function() {
      this.empty();

      if (this.$el) {
        this.el = this.$el.selector;
      }

      delete this.$el;
      return this;
    }

  }, {

    buildScreen: function(screenConfig, DefaultScreenClass) {
      if (lang.isString(screenConfig)) {
        return this._buildScreenFromSelector(screenConfig, DefaultScreenClass);
      }

      if (screenConfig.selector || screenConfig.el || screenConfig.screenClass) {
        return this._buildScreenFromObject(screenConfig, DefaultScreenClass);
      }

      if (lang.isFunction(screenConfig)) {
        return this._buildScreenFromScreenClass(screenConfig);
      }

      throw new Error('Improper screen configuration type.');
    },

    // Build the screen from a string selector like '#foo-screen'
    _buildScreenFromSelector: function(selector, DefaultScreenClass) {
      return new DefaultScreenClass({
        el: selector
      });
    },

    // Build the screen from a configuration object
    // { selector: '#foo', screenClass: FooScreen, allowMissingEl: false }
    _buildScreenFromObject: function(screenConfig, DefaultScreenClass) {
      var ScreenClass = screenConfig.screenClass || DefaultScreenClass;
      var options = lang.omit(screenConfig, 'selector', 'screenClass');

      if (screenConfig.selector && !options.el) {
        options.el = screenConfig.selector;
      }

      return new ScreenClass(options);
    },

    // Build the screen directly from a given `ScreenClass`
    _buildScreenFromScreenClass: function(ScreenClass) {
      return new ScreenClass();
    }

  });

  module.exports = Screen;

});