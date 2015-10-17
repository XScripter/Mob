define('mob/screenComponent', function(require, exports, module) {

  var lang = require('mob/lang');
  var $ = require('mob/jqlite');
  var Error = require('mob/error');

  var ScreenComponent = {};

  ScreenComponent.add = function(view) {

    var overriddenViewMethods = {
      render: view.render,
      remove: view.remove
    };

    view.render = function() {
      var args = Array.prototype.slice.call(arguments);

      prerender.call(this);
      var returnValue = overriddenViewMethods.render.apply(this, args);
      postrender.call(this);

      return returnValue;
    };

    // 当 render 方式为异步调用的时候，可以手动调用 `renderComponents` 初始化组件
    view.renderComponents = function() {
      if (!lang.isEmpty(this.components)) {
        lang.info('Components have already rendered!');
      } else {
        postrender.call(this);
      }
    };

    view.remove = function() {
      this.removeComponents();
      return overriddenViewMethods.remove.call(this);
    };

    view.removeComponents = function() {
      // Removes all components and cleans up references in this.components.

      if (this.components) {

        lang.each(this.components, function(component) {
          component.remove();
        });

        delete this.components;
      }
    };

    view._createComponent = function(componentName, placeHolderDiv) {
      var componentCreator = this.componentCreators[componentName];
      if (lang.isUndefined(componentCreator)) {
        throw new Error('Can not find component creator for component named: ' + componentName);
      }

      return componentCreator.apply(this);
    };
  };

  function prerender() {
    if (!this.components) {
      this.components = {};
    }

    lang.each(this.components, function(component) {
      component.$el.detach();
    });
  }

  function postrender() {
    var self = this;
    this.componentCreators = this.componentCreators || {};

    // Support componentCreators as both objects and functions.
    this.componentCreators = lang.result(this, 'componentCreators');

    this.$('[mo-component]').each(function() {
      var $this = $(this);
      var componentName = $this.attr('mo-component');
      var newComponent;

      if (lang.isUndefined(self.components[componentName])) {
        newComponent = self._createComponent(componentName, $this);
        if (newComponent === null) {
          return;
        }
        self.components[componentName] = newComponent;
      } else {
        newComponent = self.components[componentName];
      }

      $this.replaceWith(newComponent.$el);
    });

    // Now that all components have been created, render them one at a time, in the
    // order they occur in the DOM.
    lang.each(this.components, function(component) {
      component.render();
    });

    if(lang.isFunction(this.onComponentsRendered)) {
      this.onComponentsRendered.call(this);
    }

  }

  module.exports = ScreenComponent;

});