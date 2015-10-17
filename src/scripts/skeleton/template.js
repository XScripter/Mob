define('mob/template', function(require, exports, module) {

  var lang = require('mob/lang');

  var Template = {};
  var templateHelpers = {
    insertComponent: function(componentName) {
      return '<div mo-component="' + componentName + '"></div>';
    }
  };

  var noMatch = /(.)^/;

  var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  Template._settings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  };

  Template.config = function(options) {
    lang.extend(Template._settings, options || {});
  };

  Template.registerHelpers = function(newHelpers) {
    lang.extend(templateHelpers, newHelpers);
  };

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  function template(text, settings, oldSettings) {
    if (!settings && oldSettings) {
      settings = oldSettings;
    }

    settings = lang.defaults({}, settings, Template._settings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
        (settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source
      ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':Mob.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });

    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) {
      source = 'with(obj||{}){\n' + source + '}\n';
    }

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', 'Mob', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, Mob);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  }

  Template.compile = function(text, data, settings) {

    if (data) {
      lang.defaults(data, templateHelpers);
      return template.apply(this, arguments);
    }

    var originalTemplate = template.apply(this, arguments);

    var wrappedTemplate = function(data) {
      data = lang.defaults({}, data, templateHelpers);
      return originalTemplate.call(this, data);
    };

    return wrappedTemplate;
  };

  module.exports = Template;

});