(function() {

  var templateSettings;

  QUnit.module('mob/template', {

    setup: function() {
      templateSettings = Mob.clone(Mob.Template.settings);
    },

    teardown: function() {
      Mob.Template.settings = templateSettings;
    }

  });

  QUnit.test('template', function(assert) {
    var basicTemplate = Mob.Template.compile("<%= thing %> is gettin' on my noives!");
    var result = basicTemplate({
      thing: 'This'
    });
    assert.equal(result, "This is gettin' on my noives!", 'can do basic attribute interpolation');

    var sansSemicolonTemplate = Mob.Template.compile('A <% this %> B');
    assert.equal(sansSemicolonTemplate(), 'A  B');

    var backslashTemplate = Mob.Template.compile('<%= thing %> is \\ridanculous');
    assert.equal(backslashTemplate({
      thing: 'This'
    }), 'This is \\ridanculous');

    var escapeTemplate = Mob.Template.compile('<%= a ? "checked=\\"checked\\"" : "" %>');
    assert.equal(escapeTemplate({
      a: true
    }), 'checked="checked"', 'can handle slash escapes in interpolations.');

    var fancyTemplate = Mob.Template.compile('<ul><% ' +
      '  for (var key in people) { ' +
      '%><li><%= people[key] %></li><% } %></ul>');
    result = fancyTemplate({
      people: {
        moe: 'Moe',
        larry: 'Larry',
        curly: 'Curly'
      }
    });
    assert.equal(result, '<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>', 'can run arbitrary javascript in templates');

    var escapedCharsInJavascriptTemplate = Mob.Template.compile('<ul><% Mob.each(numbers.split("\\n"), function(item) { %><li><%= item %></li><% }) %></ul>');
    result = escapedCharsInJavascriptTemplate({
      numbers: 'one\ntwo\nthree\nfour'
    });
    assert.equal(result, '<ul><li>one</li><li>two</li><li>three</li><li>four</li></ul>', 'Can use escaped characters (e.g. \\n) in JavaScript');

    var namespaceCollisionTemplate = Mob.Template.compile('<%= pageCount %> <%= thumbnails[pageCount] %> <% Mob.each(thumbnails, function(p) { %><div class="thumbnail" rel="<%= p %>"></div><% }); %>');
    result = namespaceCollisionTemplate({
      pageCount: 3,
      thumbnails: {
        1: 'p1-thumbnail.gif',
        2: 'p2-thumbnail.gif',
        3: 'p3-thumbnail.gif'
      }
    });
    assert.equal(result, '3 p3-thumbnail.gif <div class="thumbnail" rel="p1-thumbnail.gif"></div><div class="thumbnail" rel="p2-thumbnail.gif"></div><div class="thumbnail" rel="p3-thumbnail.gif"></div>');

    var noInterpolateTemplate = Mob.Template.compile('<div><p>Just some text. Hey, I know this is silly but it aids consistency.</p></div>');
    result = noInterpolateTemplate();
    assert.equal(result, '<div><p>Just some text. Hey, I know this is silly but it aids consistency.</p></div>');

    var quoteTemplate = Mob.Template.compile("It's its, not it's");
    assert.equal(quoteTemplate({}), "It's its, not it's");

    var quoteInStatementAndBody = Mob.Template.compile('<% ' +
      "  if(foo == 'bar'){ " +
      "%>Statement quotes and 'quotes'.<% } %>");
    assert.equal(quoteInStatementAndBody({
      foo: 'bar'
    }), "Statement quotes and 'quotes'.");

    var withNewlinesAndTabs = Mob.Template.compile('This\n\t\tis: <%= x %>.\n\tassert.ok.\nend.');
    assert.equal(withNewlinesAndTabs({
      x: 'that'
    }), 'This\n\t\tis: that.\n\tassert.ok.\nend.');

    var template = Mob.Template.compile('<i><%- value %></i>');
    result = template({
      value: '<script>'
    });
    assert.equal(result, '<i>&lt;script&gt;</i>');

    var stooge = {
      name: 'Moe',
      template: Mob.Template.compile("I'm <%= this.name %>")
    };
    assert.equal(stooge.template(), "I'm Moe");

    template = Mob.Template.compile('\n ' +
      '  <%\n ' +
      '  // a comment\n ' +
      '  if (data) { data += 12345; }; %>\n ' +
      '  <li><%= data %></li>\n '
    );
    assert.equal(template({
      data: 12345
    }).replace(/\s/g, ''), '<li>24690</li>');

    Mob.Template.settings = {
      evaluate: /\{\{([\s\S]+?)\}\}/g,
      interpolate: /\{\{=([\s\S]+?)\}\}/g
    };

    var custom = Mob.Template.compile('<ul>{{ for (var key in people) { }}<li>{{= people[key] }}</li>{{ } }}</ul>');
    result = custom({
      people: {
        moe: 'Moe',
        larry: 'Larry',
        curly: 'Curly'
      }
    });
    assert.equal(result, '<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>', 'can run arbitrary javascript in templates');

    var customQuote = Mob.Template.compile("It's its, not it's");
    assert.equal(customQuote({}), "It's its, not it's");

    quoteInStatementAndBody = Mob.Template.compile("{{ if(foo == 'bar'){ }}Statement quotes and 'quotes'.{{ } }}");
    assert.equal(quoteInStatementAndBody({
      foo: 'bar'
    }), "Statement quotes and 'quotes'.");

    Mob.Template.settings = {
      evaluate: /<\?([\s\S]+?)\?>/g,
      interpolate: /<\?=([\s\S]+?)\?>/g
    };

    var customWithSpecialChars = Mob.Template.compile('<ul><? for (var key in people) { ?><li><?= people[key] ?></li><? } ?></ul>');
    result = customWithSpecialChars({
      people: {
        moe: 'Moe',
        larry: 'Larry',
        curly: 'Curly'
      }
    });
    assert.equal(result, '<ul><li>Moe</li><li>Larry</li><li>Curly</li></ul>', 'can run arbitrary javascript in templates');

    var customWithSpecialCharsQuote = Mob.Template.compile("It's its, not it's");
    assert.equal(customWithSpecialCharsQuote({}), "It's its, not it's");

    quoteInStatementAndBody = Mob.Template.compile("<? if(foo == 'bar'){ ?>Statement quotes and 'quotes'.<? } ?>");
    assert.equal(quoteInStatementAndBody({
      foo: 'bar'
    }), "Statement quotes and 'quotes'.");

    Mob.Template.settings = {
      interpolate: /\{\{(.+?)\}\}/g
    };

    var mustache = Mob.Template.compile('Hello {{planet}}!');
    assert.equal(mustache({
      planet: 'World'
    }), 'Hello World!', 'can mimic mustache.js');

    var templateWithNull = Mob.Template.compile('a null undefined {{planet}}');
    assert.equal(templateWithNull({
      planet: 'world'
    }), 'a null undefined world', 'can handle missing escape and evaluate settings');
  });

  QUnit.test('Mob.Template.compile provides the generated function source, when a SyntaxError occurs', function(assert) {
    try {
      Mob.Template.compile('<b><%= if x %></b>');
    } catch (ex) {
      var source = ex.source;
    }
    assert.ok(/__p/.test(source));
  });

  QUnit.test('Mob.Template.compile handles \\u2028 & \\u2029', function(assert) {
    var tmpl = Mob.Template.compile('<p>\u2028<%= "\\u2028\\u2029" %>\u2029</p>');
    assert.strictEqual(tmpl(), '<p>\u2028\u2028\u2029\u2029</p>');
  });

  QUnit.test('Mob.Template.settings.variable', function(assert) {
    var s = '<%=data.x%>';
    var data = {
      x: 'x'
    };
    var tmp = Mob.Template.compile(s, {
      variable: 'data'
    });
    assert.strictEqual(tmp(data), 'x');
    Mob.Template.settings.variable = 'data';
    assert.strictEqual(Mob.Template.compile(s)(data), 'x');
  });

  QUnit.test('#547 - Mob.Template.settings is unchanged by custom settings.', function(assert) {
    assert.ok(!Mob.Template.settings.variable);
    Mob.Template.compile('', {}, {
      variable: 'x'
    });
    assert.ok(!Mob.Template.settings.variable);
  });

  QUnit.test('#556 - undefined template variables.', function(assert) {
    var template = Mob.Template.compile('<%=x%>');
    assert.strictEqual(template({
      x: null
    }), '');
    assert.strictEqual(template({
      x: undefined
    }), '');

    var templateEscaped = Mob.Template.compile('<%-x%>');
    assert.strictEqual(templateEscaped({
      x: null
    }), '');
    assert.strictEqual(templateEscaped({
      x: undefined
    }), '');

    var templateWithProperty = Mob.Template.compile('<%=x.foo%>');
    assert.strictEqual(templateWithProperty({
      x: {}
    }), '');
    assert.strictEqual(templateWithProperty({
      x: {}
    }), '');

    var templateWithPropertyEscaped = Mob.Template.compile('<%-x.foo%>');
    assert.strictEqual(templateWithPropertyEscaped({
      x: {}
    }), '');
    assert.strictEqual(templateWithPropertyEscaped({
      x: {}
    }), '');
  });

  QUnit.test('interpolate evaluates code only once.', 2, function(assert) {
    var count = 0;
    var template = Mob.Template.compile('<%= f() %>');
    template({
      f: function() {
        assert.ok(!count++);
      }
    });

    var countEscaped = 0;
    var templateEscaped = Mob.Template.compile('<%- f() %>');
    templateEscaped({
      f: function() {
        assert.ok(!countEscaped++);
      }
    });
  });

  QUnit.test('#746 - Mob.Template.compile settings are not modified.', 1, function(assert) {
    var settings = {};
    Mob.Template.compile('', null, settings);
    assert.deepEqual(settings, {});
  });

  QUnit.test('#779 - delimeters are applied to unescaped text.', 1, function(assert) {
    var template = Mob.Template.compile('<<\nx\n>>', null, {
      evaluate: /<<(.*?)>>/g
    });
    assert.strictEqual(template(), '<<\nx\n>>');
  });

  QUnit.test('Mob.Template.addHelpers', function(assert) {

    Mob.Template.addHelpers({
      add: function(a, b) {
        return a + b;
      },
      subview: function(subviewName) {
        return "<div data-subview='" + subviewName + "'></div>";
      }
    });

    var s = '<%=add(a, b)%>';
    var data = {
      a: 1,
      b: 4
    };
    assert.strictEqual(Mob.Template.compile(s)(data), '5');

    var s1 = '<%=subview("test")%>';
    assert.strictEqual(Mob.Template.compile(s1)(), '<div data-subview=\'test\'></div>');
  });

}());