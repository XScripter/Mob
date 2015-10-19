(function() {

  var itemViewInstance;

  var MyComponentClass = Mob.Component.extend({

    initialize: function() {

    },

    render: function() {
      this.$el.html('rendered');
    }

  });

  QUnit.module('mob/screenComponent', {

    teardown: function() {
      //itemViewInstance.remove();
    }

  });

  QUnit.asyncTest('Component creator methods are called when parent is rendered', function(assert) {

    var MyItemViewClass = Mob.View.extend({

      el: '#container-component',

      initialize: function() {
        Mob.ScreenComponent.add(this);
        stop();
        this.render();
      },

      render: function() {
        this.$el.html('<div mo-component="myComponent"></div>');
        this.$el.append('<div mo-component="mySecondComponent"></div>');
      },

      componentCreators: {

        myComponent: function() {

          assert.ok(true, 'First component creator method called');

          start();
          return new MyComponentClass();
        },

        mySecondComponent: function() {

          assert.ok(true, 'Second component creator method called');

          start();
          return new MyComponentClass();
        }
      }

    });

    assert.expect(2);
    itemViewInstance = new MyItemViewClass();

  });

  QUnit.asyncTest('Components are accessible through `components` hash', function(assert) {

    var MyItemViewClass = Mob.View.extend({

      el: '#container-component',

      initialize: function() {
        Mob.ScreenComponent.add(this);
        this.render();
      },

      componentCreators: {
        myComponent: function() {
          return new MyComponentClass();
        }
      },

      render: function() {
        this.$el.html('<div mo-component="myComponent"></div>');
      },

      onComponentsRendered: function() {
        assert.ok(this.components.myComponent.cid, 'Component is in component hash');
        start();
      }

    });

    assert.expect(1);
    itemViewInstance = new MyItemViewClass();

  });

  QUnit.asyncTest('Components can be specified on on non-DIV elements', function(assert) {

    var MyItemViewClass = Mob.View.extend({
      el: "#container-component",

      initialize: function() {
        Mob.ScreenComponent.add(this);
        this.render();
      },

      render: function() {
        this.$el.html("<table><head><tr mo-component=\"myComponent\"></tr></thead></table>");
      },

      componentCreators: {
        myComponent: function() {
          assert.ok(true, "Component creator method called");
          start();
          return new MyComponentClass();
        }
      }

    });

    expect(1);
    itemViewInstance = new MyItemViewClass();

  });

  QUnit.asyncTest("Components are rendered when parent is rendered", function() {

    var MyItemViewClass = Mob.View.extend({

      el: "#container-component",

      initialize: function() {
        Mob.ScreenComponent.add(this);
        this.render();
      },

      render: function() {
        this.$el.html("<div mo-component=\"myComponent\"></div>");
      },

      componentCreators: {
        myComponent: function() {
          return new MyComponentClass();
        }
      },

      onComponentsRendered: function() {
        start();
        ok(true, "onComponentsRendered is called");
        equal(Mob.$("#container-component div").html(), "rendered", "component is rendered");
      }

    });


    expect(4);

    stop();

    itemViewInstance = new MyItemViewClass();
    itemViewInstance.render();

  });

  QUnit.test("Components replace placeholder divs", function() {

    var MyItemViewClass = Mob.View.extend({

      el: "#container-component",

      initialize: function() {
        Mob.ScreenComponent.add(this);
        this.render();
      },

      render: function() {
        this.$el.html("<span><div mo-component=\"myComponent\"></div></span>");
      },

      componentCreators: {
        myComponent: function() {
          return new MyComponentClass();
        },
        mySecondComponent: function() {
          return new MyComponentClass();
        }
      }

    });

    expect(1);
    itemViewInstance = new MyItemViewClass();

    var componentInstance = itemViewInstance.components.myComponent;

    equal(componentInstance.$el.parent().prop("tagName"), "SPAN", "Component replaces corresponding placeholder");

  });

  QUnit.asyncTest("Components mantain state when parent view is rerended", function() {

    var renderCount = 0;

    var MyItemViewClass = Mob.View.extend({

      el: "#container-component",

      initialize: function() {
        Mob.ScreenComponent.add(this);
        this.render();
      },

      render: function() {
        this.$el.html("<div mo-component=\"myComponent\"></div>");
      },

      componentCreators: {
        myComponent: function() {

          return new MyComponentClass();
        }
      },

      onComponentsRendered: function() {
        renderCount++;
        if (renderCount === 2) {
          ok(this.components.myComponent.state, "Component state is perserved");
        }
        start();
      }

    });

    expect(1);

    stop();

    itemViewInstance = new MyItemViewClass();

    var Component = itemViewInstance.components.myComponent;
    Component.state = true;

    itemViewInstance.render();

  });

}());