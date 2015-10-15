define('mob/jqlite', function(require, exports, module) {

  var lang = require('mob/lang');

  // ====================== jqlite(core) ======================

  var undefined,
    key,
    $,
    jqlite = {},
    emptyArray = [],
    slice = emptyArray.slice,
    filter = emptyArray.filter,
    document = window.document;

  $ = function(selector, context) {
    return jqlite.init(selector, context);
  };

  $.uuid = 0;
  $.support = {};
  $.expr = {};

  var uniq = function(array) {
    return filter.call(array, function(item, idx) {
      return array.indexOf(item) == idx;
    })
  };

  function likeArray(obj) {
    return typeof obj.length == 'number';
  }

  function compact(array) {
    return filter.call(array, function(item) {
      return item != null;
    });
  }

  function flatten(array) {
    return array.length > 0 ? $.fn.concat.apply([], array) : array;
  }

  $.contains = document.documentElement.contains ?
    function(parent, node) {
      return parent !== node && parent.contains(node);
    } :
    function(parent, node) {
      while (node && (node = node.parentNode))
        if (node === parent) {
          return true;
        }
      return false;
    };

  $.isEmptyObject = function(obj) {
    var name;
    for (name in obj) {
      return false;
    }
    return true;
  };

  $.trim = function(str) {
    return str == null ? '' : String.prototype.trim.call(str);
  };

  $.map = function(elements, callback) {
    var value,
      values = [],
      i,
      key;
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i);
        if (value != null) {
          values.push(value);
        }
      }
    } else {
      for (key in elements) {
        value = callback(elements[key], key);
        if (value != null) {
          values.push(value);
        }
      }
    }

    return flatten(values);
  };

  $.each = function(elements, callback) {
    var i,
      key;
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++) {
        if (callback.call(elements[i], i, elements[i]) === false) {
          return elements;
        }
      }
    } else {
      for (key in elements) {
        if (callback.call(elements[key], key, elements[key]) === false) {
          return elements;
        }
      }
    }

    return elements;
  };

  $.grep = function(elements, callback) {
    return filter.call(elements, callback);
  };

  if (window.JSON) {
    $.parseJSON = JSON.parse;
  }

  ///////////////////////////////////////////////////////////////////////////////////////

  var filters = $.expr[':'] = {
      visible: function() {
        if (visible(this)) {
          return this;
        }
      },
      hidden: function() {
        if (!visible(this)) {
          return this;
        }
      },
      selected: function() {
        if (this.selected) {
          return this;
        }
      },
      checked: function() {
        if (this.checked) {
          return this;
        }
      },
      parent: function() {
        return this.parentNode;
      },
      first: function(idx) {
        if (idx === 0) {
          return this;
        }
      },
      last: function(idx, nodes) {
        if (idx === nodes.length - 1) {
          return this;
        }
      },
      eq: function(idx, _, value) {
        if (idx === value) {
          return this;
        }
      },
      contains: function(idx, _, text) {
        if ($(this).text().indexOf(text) > -1) {
          return this;
        }
      },
      has: function(idx, _, sel) {
        if (jqlite.qsa(this, sel).length) {
          return this;
        }
      }
    },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    filterRe = new RegExp('(.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*'),
    childRe = /^\s*>/,
    classTag = 'JQLite' + (+new Date()),
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table,
      'thead': table,
      'tfoot': table,
      'td': tableRow,
      'th': tableRow,
      '*': document.createElement('div')
    },
    simpleSelectorRE = /^[\w-]*$/,
    tempParent = document.createElement('div');

  function process(sel, fn) {
    sel = sel.replace(/=#\]/g, '="#"]');
    var filter,
      arg,
      match = filterRe.exec(sel);
    if (match && match[2] in filters) {
      filter = filters[match[2]];
      arg = match[3];
      sel = match[1];
      if (arg) {
        var num = Number(arg);
        if (isNaN(num)) {
          arg = arg.replace(/^["']|["']$/g, '');
        } else {
          arg = num;
        }
      }
    }
    return fn(sel, filter, arg);
  }

  function visible(elem) {
    elem = $(elem);
    return !!(elem.width() || elem.height()) && elem.css('display') !== 'none';
  }

  var doMatches = function(element, selector) {

    if (!selector || !element || element.nodeType !== 1) {
      return false;
    }

    var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
        element.oMatchesSelector || element.matchesSelector,
      match,
      parent = element.parentNode,
      temp = !parent;

    if (matchesSelector) {
      return matchesSelector.call(element, selector);
    }

    if (temp) {
      (parent = tempParent).appendChild(element);
    }

    match = ~jqlite.qsa(parent, selector).indexOf(element);
    temp && tempParent.removeChild(element);
    return match;

  };

  var doQsa = function(element, selector) {
    var found,
      maybeID = selector[0] == '#',
      maybeClass = !maybeID && selector[0] == '.',
      nameOnly = maybeID || maybeClass ? selector.slice(1) : selector,
      isSimple = simpleSelectorRE.test(nameOnly);

    return (lang.isDocument(element) && isSimple && maybeID) ?
      ((found = element.getElementById(nameOnly)) ? [found] : []) :
      (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
        slice.call(
          isSimple && !maybeID ?
            maybeClass ? element.getElementsByClassName(nameOnly) :
              element.getElementsByTagName(selector) :
            element.querySelectorAll(selector)
        );
  };

  jqlite.jQ = function(dom, selector) {
    dom = dom || [];
    dom.__proto__ = $.fn;
    dom.selector = selector || '';
    return dom;
  };

  jqlite.isJQ = function(object) {
    return object instanceof jqlite.jQ;
  };

  jqlite.qsa = function(node, selector) {
    return process(selector, function(sel, filter, arg) {
      try {
        var taggedParent;
        if (!sel && filter) {
          sel = '*';
        } else if (childRe.test(sel)) {
          taggedParent = $(node).addClass(classTag);
          sel = '.' + classTag + ' ' + sel;
        }

        var nodes = doQsa(node, sel);
      } catch (e) {
        lang.error('error performing selector: %o', selector);
        throw e;
      } finally {
        if (taggedParent) {
          taggedParent.removeClass(classTag);
        }
      }
      return !filter ? nodes :
        jqlite.uniq($.map(nodes, function(n, i) {
          return filter.call(n, i, nodes, arg);
        }));
    });
  };

  jqlite.matches = function(node, selector) {
    return process(selector, function(sel, filter, arg) {
      return (!sel || doMatches(node, sel)) && (!filter || filter.call(node, null, arg) === node);
    });
  };

  jqlite.fragment = function(html, name, properties) {
    var dom,
      nodes,
      container;

    if (singleTagRE.test(html)) {
      dom = $(document.createElement(RegExp.$1));
    }

    if (!dom) {
      if (html.replace) {
        html = html.replace(tagExpanderRE, '<$1></$2>');
      }
      if (name === undefined) {
        name = fragmentRE.test(html) && RegExp.$1;
      }
      if (!(name in containers)) {
        name = '*';
      }

      container = containers[name];
      container.innerHTML = '' + html;
      dom = $.each(slice.call(container.childNodes), function() {
        container.removeChild(this);
      });
    }

    if (lang.isPlainObject(properties)) {
      nodes = $(dom);
      $.each(properties, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) {
          nodes[key](value);
        } else {
          nodes.attr(key, value);
        }
      });
    }

    return dom;
  };

  jqlite.init = function(selector, context) {
    var dom;
    if (!selector) {

      return jqlite.jQ();

    } else if (typeof selector == 'string') {

      selector = selector.trim();
      if (selector[0] == '<' && fragmentRE.test(selector)) {
        dom = jqlite.fragment(selector, RegExp.$1, context);
        selector = null;
      } else if (context !== undefined) {
        return $(context).find(selector);
      } else {
        dom = jqlite.qsa(document, selector);
      }
    } else if (lang.isFunction(selector)) {
      return $(document).ready(selector);
    } else if (jqlite.isJQ(selector)) {
      return selector;
    } else {
      if (lang.isArray(selector)) {
        dom = compact(selector);
      } else if (lang.isObject(selector)) {
        dom = [selector];
        selector = null;
      } else if (fragmentRE.test(selector)) {
        dom = jqlite.fragment(selector.trim(), RegExp.$1, context);
        selector = null;
      } else if (context !== undefined) {
        return $(context).find(selector);
      } else {
        dom = jqlite.qsa(document, selector);
      }
    }
    return jqlite.jQ(dom, selector);
  };

  ///////////////////////////////////////////////////////////////////////////////////////

  var elementDisplay = {},
    classCache = {},
    cssNumber = {
      'column-count': 1,
      'columns': 1,
      'font-weight': 1,
      'line-height': 1,
      'opacity': 1,
      'z-index': 1,
      'zoom': 1
    },
    classList,
    capitalRE = /([A-Z])/g,
    adjacencyOperators = ['after', 'prepend', 'before', 'append'],
    readyRE = /complete|loaded|interactive/,
    rootNodeRE = /^(?:body|html)$/i,
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    };

  function dasherize(str) {
    return str.replace(/::/g, '/')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z\d])([A-Z])/g, '$1_$2')
      .replace(/_/g, '-')
      .toLowerCase();
  }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'));
  }

  function maybeAddPx(name, value) {
    return (typeof value == 'number' && !cssNumber[dasherize(name)]) ? value + 'px' : value;
  }

  function defaultDisplay(nodeName) {
    var element, display;
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName);
      document.body.appendChild(element);
      display = getComputedStyle(element, '').getPropertyValue('display');
      element.parentNode.removeChild(element);
      display == 'none' && (display = 'block');
      elementDisplay[nodeName] = display;
    }
    return elementDisplay[nodeName];
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node) {
        if (node.nodeType == 1) {
          return node;
        }
      });
  }

  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector);
  }

  function funcArg(context, arg, idx, payload) {
    return lang.isFunction(arg) ? arg.call(context, idx, payload) : arg;
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value);
  }

  function className(node, value) {
    var klass = node.className || '',
      svg = klass && klass.baseVal !== undefined;

    if (value === undefined) {
      return svg ? klass.baseVal : klass;
    }
    svg ? (klass.baseVal = value) : (node.className = value);
  }

  function deserializeValue(value) {
    try {
      return value ?
      value == 'true' ||
      (value == 'false' ? false :
        value == 'null' ? null :
          +value + '' == value ? +value :
            /^[\[\{]/.test(value) ? $.parseJSON(value) :
              value) : value;
    } catch (e) {
      return value;
    }
  }

  function traverseNode(node, fun) {
    fun(node);
    for (var i = 0, len = node.childNodes.length; i < len; i++) {
      traverseNode(node.childNodes[i], fun);
    }
  }

  $.fn = {

    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    indexOf: emptyArray.indexOf,
    concat: emptyArray.concat,

    map: function(fn) {
      return $($.map(this, function(el, i) {
        return fn.call(el, i, el);
      }));
    },
    slice: function() {
      return $(slice.apply(this, arguments));
    },

    ready: function(callback) {
      if (readyRE.test(document.readyState) && document.body) {
        callback($);
      } else {
        document.addEventListener('DOMContentLoaded', function() {
          callback($);
        }, false);
      }
      return this;
    },
    get: function(idx) {
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length];
    },

    size: function() {
      return this.length;
    },

    remove: function() {
      return this.each(function() {
        if (this.parentNode != null) {
          this.parentNode.removeChild(this);
        }
      });
    },

    each: function(callback) {
      emptyArray.every.call(this, function(el, idx) {
        return callback.call(el, idx, el) !== false;
      });
      return this;
    },

    filter: function(selector) {
      if (lang.isFunction(selector)) {
        return this.not(this.not(selector));
      }
      return $(filter.call(this, function(element) {
        return jqlite.matches(element, selector);
      }));
    },

    add: function(selector, context) {
      return $(uniq(this.concat($(selector, context))));
    },

    is: function(selector) {
      return this.length > 0 && jqlite.matches(this[0], selector);
    },

    not: function(selector) {
      var nodes = [];
      if (lang.isFunction(selector) && selector.call !== undefined) {
        this.each(function(idx) {
          if (!selector.call(this, idx)) {
            nodes.push(this);
          }
        });
      } else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && lang.isFunction(selector.item)) ? slice.call(selector) : $(selector);
        this.forEach(function(el) {
          if (excludes.indexOf(el) < 0) {
            nodes.push(el);
          }
        });
      }
      return $(nodes);
    },

    has: function(selector) {
      return this.filter(function() {
        return lang.isObject(selector) ? $.contains(this, selector) : $(this).find(selector).size();
      });
    },

    eq: function(idx) {
      return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1);
    },

    first: function() {
      var el = this[0];
      return el && !lang.isObject(el) ? el : $(el);
    },

    last: function() {
      var el = this[this.length - 1];
      return el && !lang.isObject(el) ? el : $(el);
    },

    find: function(selector) {
      var result,
        $this = this;
      if (!selector) {
        result = $();
      } else if (typeof selector == 'object') {
        result = $(selector).filter(function() {
          var node = this;
          return emptyArray.some.call($this, function(parent) {
            return $.contains(parent, node);
          });
        });
      } else if (this.length == 1) {
        result = $(jqlite.qsa(this[0], selector));
      } else {
        result = this.map(function() {
          return jqlite.qsa(this, selector);
        });
      }
      return result;
    },

    closest: function(selector, context) {
      var node = this[0],
        collection = false;
      if (typeof selector == 'object') {
        collection = $(selector);
      }
      while (node && !(collection ? collection.indexOf(node) >= 0 : jqlite.matches(node, selector))) {
        node = node !== context && !lang.isDocument(node) && node.parentNode;
      }
      return $(node);
    },

    parents: function(selector) {
      var ancestors = [],
        nodes = this;
      while (nodes.length > 0) {
        nodes = $.map(nodes, function(node) {
          if ((node = node.parentNode) && !lang.isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node);
            return node;
          }
        });
      }

      return filtered(ancestors, selector);
    },

    parent: function(selector) {
      return filtered(uniq(this.pluck('parentNode')), selector);
    },

    children: function(selector) {
      return filtered(this.map(function() {
        return children(this);
      }), selector);
    },

    contents: function() {
      return this.map(function() {
        return slice.call(this.childNodes);
      });
    },

    siblings: function(selector) {
      return filtered(this.map(function(i, el) {
        return filter.call(children(el.parentNode), function(child) {
          return child !== el;
        });
      }), selector);
    },

    empty: function() {
      return this.each(function() {
        this.innerHTML = '';
      });
    },

    // `pluck` is borrowed from Prototype.js
    pluck: function(property) {
      return $.map(this, function(el) {
        return el[property];
      });
    },

    show: function() {
      return this.each(function() {
        this.style.display == 'none' && (this.style.display = '');
        if (getComputedStyle(this, '').getPropertyValue('display') == 'none') {
          this.style.display = defaultDisplay(this.nodeName);
        }
      });
    },

    replaceWith: function(newContent) {
      return this.before(newContent).remove();
    },

    wrap: function(structure) {
      var func = lang.isFunction(structure);
      if (this[0] && !func) {
        var dom = $(structure).get(0),
          clone = dom.parentNode || this.length > 1;
      }

      return this.each(function(index) {
        $(this).wrapAll(func ? structure.call(this, index) : clone ? dom.cloneNode(true) : dom);
      });
    },

    wrapAll: function(structure) {
      if (this[0]) {
        $(this[0]).before(structure = $(structure));
        var children;

        while ((children = structure.children()).length) {
          structure = children.first();
        }

        $(structure).append(this);
      }
      return this;
    },
    wrapInner: function(structure) {
      var func = lang.isFunction(structure);

      return this.each(function(index) {
        var self = $(this),
          contents = self.contents(),
          dom = func ? structure.call(this, index) : structure;
        contents.length ? contents.wrapAll(dom) : self.append(dom);
      });
    },

    unwrap: function() {
      this.parent().each(function() {
        $(this).replaceWith($(this).children());
      });
      return this;
    },

    clone: function() {
      return this.map(function() {
        return this.cloneNode(true);
      });
    },

    hide: function() {
      return this.css('display', 'none');
    },

    toggle: function(setting) {
      return this.each(function() {
        var el = $(this);
        (setting === undefined ? el.css('display') == 'none' : setting) ? el.show(): el.hide();
      });
    },

    prev: function(selector) {
      return $(this.pluck('previousElementSibling')).filter(selector || '*');
    },

    next: function(selector) {
      return $(this.pluck('nextElementSibling')).filter(selector || '*');
    },

    html: function(html) {
      return 0 in arguments ?
        this.each(function(idx) {
          var originHtml = this.innerHTML;
          $(this).empty().append(funcArg(this, html, idx, originHtml));
        }) :
        (0 in this ? this[0].innerHTML : null);
    },

    text: function(text) {
      return 0 in arguments ?
        this.each(function(idx) {
          var newText = funcArg(this, text, idx, this.textContent);
          this.textContent = newText == null ? '' : '' + newText;
        }) :
        (0 in this ? this[0].textContent : null);
    },

    attr: function(name, value) {
      var result;
      return (typeof name == 'string' && !(1 in arguments)) ?
        (!this.length || this[0].nodeType !== 1 ? undefined :
            (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
        ) :
        this.each(function(idx) {
          if (this.nodeType !== 1) {
            return;
          }
          if (lang.isObject(name)) {
            for (key in name) {
              setAttribute(this, key, name[key]);
            }
          } else {
            setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)));
          }
        });
    },

    removeAttr: function(name) {
      return this.each(function() {
        this.nodeType === 1 && name.split(' ').forEach(function(attribute) {
          setAttribute(this, attribute);
        }, this);
      });
    },

    prop: function(name, value) {
      name = propMap[name] || name;
      return (1 in arguments) ?
        this.each(function(idx) {
          this[name] = funcArg(this, value, idx, this[name]);
        }) :
        (this[0] && this[0][name]);
    },

    val: function(value) {
      return 0 in arguments ?
        this.each(function(idx) {
          this.value = funcArg(this, value, idx, this.value);
        }) :
        (this[0] && (this[0].multiple ?
          $(this[0]).find('option').filter(function() {
            return this.selected;
          }).pluck('value') :
          this[0].value));
    },

    offset: function(coordinates) {
      if (coordinates) return this.each(function(index) {
        var $this = $(this),
          coords = funcArg(this, coordinates, index, $this.offset()),
          parentOffset = $this.offsetParent().offset(),
          props = {
            top: coords.top - parentOffset.top,
            left: coords.left - parentOffset.left
          };

        if ($this.css('position') == 'static') {
          props['position'] = 'relative';
        }
        $this.css(props);
      });

      if (!this.length) {
        return null;
      }
      var obj = this[0].getBoundingClientRect();
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      };
    },

    css: function(property, value) {
      if (arguments.length < 2) {
        var computedStyle,
          element = this[0];
        if (!element) {
          return;
        }
        computedStyle = getComputedStyle(element, '');
        if (typeof property == 'string') {
          return element.style[lang.camelize(property)] || computedStyle.getPropertyValue(property);
        } else if (lang.isArray(property)) {
          var props = {};
          $.each(property, function(_, prop) {
            props[prop] = (element.style[lang.camelize(prop)] || computedStyle.getPropertyValue(prop));
          });
          return props;
        }
      }

      var css = '';
      if (lang.isString(property)) {
        if (!value && value !== 0) {
          this.each(function() {
            this.style.removeProperty(dasherize(property));
          });
        } else {
          css = dasherize(property) + ':' + maybeAddPx(property, value);
        }
      } else {
        for (key in property) {
          if (!property[key] && property[key] !== 0) {
            this.each(function() {
              this.style.removeProperty(dasherize(key));
            });
          } else {
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';';
          }
        }
      }

      return this.each(function() {
        this.style.cssText += ';' + css;
      });
    },

    index: function(element) {
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0]);
    },

    hasClass: function(name) {
      if (!name) {
        return false;
      }
      return emptyArray.some.call(this, function(el) {
        return this.test(className(el));
      }, classRE(name));
    },

    addClass: function(name) {
      if (!name) {
        return this;
      }
      return this.each(function(idx) {
        if (!('className' in this)) {
          return;
        }
        classList = [];
        var cls = className(this),
          newName = funcArg(this, name, idx, cls);
        newName.split(/\s+/g).forEach(function(klass) {
          if (!$(this).hasClass(klass)) {
            classList.push(klass);
          }
        }, this);
        classList.length && className(this, cls + (cls ? ' ' : '') + classList.join(' '));
      });
    },

    removeClass: function(name) {
      return this.each(function(idx) {
        if (!('className' in this)) {
          return;
        }
        if (name === undefined) {
          return className(this, '');
        }
        classList = className(this);
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass) {
          classList = classList.replace(classRE(klass), ' ');
        });
        className(this, classList.trim());
      });
    },
    toggleClass: function(name, when) {
      if (!name) {
        return this;
      }
      return this.each(function(idx) {
        var $this = $(this),
          names = funcArg(this, name, idx, className(this));
        names.split(/\s+/g).forEach(function(klass) {
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass): $this.removeClass(klass);
        });
      });
    },

    scrollTop: function(value) {
      if (!this.length) {
        return;
      }
      var hasScrollTop = 'scrollTop' in this[0];
      if (value === undefined) {
        return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset;
      }
      return this.each(hasScrollTop ?
        function() {
          this.scrollTop = value;
        } :
        function() {
          this.scrollTo(this.scrollX, value);
        });
    },

    scrollLeft: function(value) {
      if (!this.length) {
        return;
      }
      var hasScrollLeft = 'scrollLeft' in this[0];
      if (value === undefined) {
        return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset;
      }

      return this.each(hasScrollLeft ?
        function() {
          this.scrollLeft = value;
        } :
        function() {
          this.scrollTo(value, this.scrollY);
        });
    },

    position: function() {
      if (!this.length) {
        return;
      }

      var elem = this[0],
        offsetParent = this.offsetParent(),
        offset = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? {
          top: 0,
          left: 0
        } : offsetParent.offset();

      offset.top -= parseFloat($(elem).css('margin-top')) || 0;
      offset.left -= parseFloat($(elem).css('margin-left')) || 0;

      // Add offsetParent borders
      parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0;
      parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0;

      // Subtract the two offsets
      return {
        top: offset.top - parentOffset.top,
        left: offset.left - parentOffset.left
      };
    },

    offsetParent: function() {
      return this.map(function() {
        var parent = this.offsetParent || document.body;
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css('position') == 'static') {
          parent = parent.offsetParent;
        }
        return parent;
      });
    }
  };

  $.fn.detach = $.fn.remove;

  ['width', 'height'].forEach(function(dimension) {
    var dimensionProperty =
      dimension.replace(/./, function(m) {
        return m[0].toUpperCase()
      });

    $.fn[dimension] = function(value) {
      var offset, el = this[0];
      if (value === undefined) {
        return lang.isWindow(el) ? el['inner' + dimensionProperty] :
          lang.isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
          (offset = this.offset()) && offset[dimension];
      } else {
        return this.each(function(idx) {
          el = $(this);
          el.css(dimension, funcArg(this, value, idx, el[dimension]()));
        });
      }
    };
  });

  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2;

    $.fn[operator] = function() {
      var nodes = $.map(arguments, function(arg) {
          return lang.isObject(arg) || lang.isArray(arg) || arg == null ? arg : jqlite.fragment(arg);
        }),
        parent,
        copyByClone = this.length > 1;

      if (nodes.length < 1) {
        return this;
      }

      return this.each(function(_, target) {
        parent = inside ? target : target.parentNode;

        target = operatorIndex == 0 ? target.nextSibling :
          operatorIndex == 1 ? target.firstChild :
            operatorIndex == 2 ? target :
              null;

        var parentInDocument = $.contains(document.documentElement, parent);

        nodes.forEach(function(node) {
          if (copyByClone) {
            node = node.cloneNode(true);
          } else if (!parent) {
            return $(node).remove();
          }

          parent.insertBefore(node, target);
          if (parentInDocument) {
            traverseNode(node, function(el) {
              if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
                (!el.type || el.type === 'text/javascript') && !el.src)
                window['eval'].call(window, el.innerHTML);
            });
          }
        });
      });
    };

    $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function(html) {
      $(html)[operator](this);
      return this;
    };
  });

  ///////////////////////////////////////////////////////////////////////////////////////

  var data = {},
    dataAttr = function(name, value) {
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase();
      var data = (1 in arguments) ? this.attr(attrName, value) : this.attr(attrName);
      return data !== null ? deserializeValue(data) : undefined;
    },
    exp = $.expando = 'JQLite' + (+new Date());

  function getData(node, name) {
    var id = node[exp],
      store = id && data[id];
    if (name === undefined) {
      return store || setData(node);
    } else {
      if (store) {
        if (name in store) {
          return store[name];
        }
        var camelName = lang.camelize(name);
        if (camelName in store) {
          return store[camelName];
        }
      }
      return dataAttr.call($(node), name);
    }
  }

  function setData(node, name, value) {
    var id = node[exp] || (node[exp] = ++$.uuid),
      store = data[id] || (data[id] = attributeData(node));
    if (name !== undefined) {
      store[lang.camelize(name)] = value;
    }
    return store;
  }

  function attributeData(node) {
    var store = {};
    $.each(node.attributes || emptyArray, function(i, attr) {
      if (attr.name.indexOf('data-') == 0) {
        store[lang.camelize(attr.name.replace('data-', ''))] = $.jqlite.deserializeValue(attr.value);
      }
    });
    return store;
  }

  $.fn.data = function(name, value) {
    return value === undefined ?
      lang.isPlainObject(name) ?
        this.each(function(i, node) {
          $.each(name, function(key, value) {
            setData(node, key, value);
          });
        }) :
        (0 in this ? getData(this[0], name) : undefined) :
      this.each(function() {
        setData(this, name, value);
      });
  };

  $.fn.removeData = function(names) {
    if (typeof names == 'string') {
      names = names.split(/\s+/);
    }
    return this.each(function() {
      var id = this[exp],
        store = id && data[id];
      if (store) {
        $.each(names || store, function(key) {
          delete store[names ? lang.camelize(this) : key];
        });
      }
    });
  };

  ['remove', 'empty'].forEach(function(methodName) {
    var origFn = $.fn[methodName];
    $.fn[methodName] = function() {
      var elements = this.find('*');
      if (methodName === 'remove') {
        elements = elements.add(this);
      }
      elements.removeData();
      return origFn.call(this);
    };
  });

  ///////////////////////////////////////////////////////////////////////////////////////

  jqlite.jQ.prototype = $.fn;

  jqlite.uniq = uniq;
  jqlite.deserializeValue = deserializeValue;

  $.jqlite = jqlite;

  // ====================== jqlite(event) ======================

  var _jqid = 1,
    undefined,
    slice = Array.prototype.slice,
    handlers = {},
    specialEvents = {},
    focusinSupported = 'onfocusin' in window,
    focus = {
      focus: 'focusin',
      blur: 'focusout'
    },
    hover = {
      mouseenter: 'mouseover',
      mouseleave: 'mouseout'
    };

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents';

  function jqid(element) {
    return element._jqid || (element._jqid = _jqid++);
  }

  function findHandlers(element, event, fn, selector) {
    event = parse(event);
    if (event.ns) {
      var matcher = matcherFor(event.ns);
    }
    return (handlers[jqid(element)] || []).filter(function(handler) {
      return handler && (!event.e || handler.e == event.e) && (!event.ns || matcher.test(handler.ns)) && (!fn || jqid(handler.fn) === jqid(fn)) && (!selector || handler.sel == selector);
    });
  }

  function parse(event) {
    var parts = ('' + event).split('.');
    return {
      e: parts[0],
      ns: parts.slice(1).sort().join(' ')
    };
  }

  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)');
  }

  function eventCapture(handler, captureSetting) {
    return handler.del && (!focusinSupported && (handler.e in focus)) || !!captureSetting;
  }

  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type;
  }

  function add(element, events, fn, data, selector, delegator, capture) {
    var id = jqid(element),
      set = (handlers[id] || (handlers[id] = []));

    events.split(/\s/).forEach(function(event) {
      if (event == 'ready') {
        return $(document).ready(fn);
      }
      var handler = parse(event);
      handler.fn = fn;
      handler.sel = selector;

      if (handler.e in hover) {
        fn = function(e) {
          var related = e.relatedTarget;
          if (!related || (related !== this && !$.contains(this, related))) {
            return handler.fn.apply(this, arguments);
          }
        };
      }
      handler.del = delegator;
      var callback = delegator || fn;
      handler.proxy = function(e) {
        e = compatible(e);
        if (e.isImmediatePropagationStopped()) {
          return;
        }
        e.data = data;
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args));
        if (result === false) {
          e.preventDefault();
          e.stopPropagation();
        }
        return result;
      };

      handler.i = set.length;
      set.push(handler);
      if ('addEventListener' in element) {
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
      }
    });
  }

  function remove(element, events, fn, selector, capture) {
    var id = jqid(element);
    (events || '').split(/\s/).forEach(function(event) {
      findHandlers(element, event, fn, selector).forEach(function(handler) {
        delete handlers[id][handler.i];
        if ('removeEventListener' in element) {
          element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture));
        }
      });
    });
  }

  $.event = {
    add: add,
    remove: remove
  };

  $.proxy = function(fn, context) {

    var args = (2 in arguments) && slice.call(arguments, 2);
    if (lang.isFunction(fn)) {
      var proxyFn = function() {
        return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments);
      };
      proxyFn._jqid = jqid(fn);
      return proxyFn;
    } else if (lang.isString(context)) {
      if (args) {
        args.unshift(fn[context], fn);
        return $.proxy.apply(null, args);
      } else {
        return $.proxy(fn[context], fn);
      }
    } else {
      throw new TypeError('expected function');
    }
  };

  $.fn.bind = function(event, data, callback) {
    return this.on(event, data, callback);
  };
  $.fn.unbind = function(event, callback) {
    return this.off(event, callback);
  };
  $.fn.one = function(event, selector, data, callback) {
    return this.on(event, selector, data, callback, 1);
  };

  var returnTrue = function() {
      return true
    },
    returnFalse = function() {
      return false
    },
    ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
    eventMethods = {
      preventDefault: 'isDefaultPrevented',
      stopImmediatePropagation: 'isImmediatePropagationStopped',
      stopPropagation: 'isPropagationStopped'
    };

  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event);

      $.each(eventMethods, function(name, predicate) {
        var sourceMethod = source[name];
        event[name] = function() {
          this[predicate] = returnTrue;
          return sourceMethod && sourceMethod.apply(source, arguments);
        };
        event[predicate] = returnFalse;
      });

      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault()) {
        event.isDefaultPrevented = returnTrue;
      }
    }
    return event;
  }

  function createProxy(event) {
    var key, proxy = {
      originalEvent: event
    };

    for (key in event) {
      if (!ignoreProperties.test(key) && event[key] !== undefined) {
        proxy[key] = event[key];
      }
    }

    return compatible(proxy, event);
  }

  $.fn.on = function(event, selector, data, callback, one) {
    var autoRemove,
      delegator,
      $this = this;
    if (event && !lang.isString(event)) {
      $.each(event, function(type, fn) {
        $this.on(type, selector, data, fn, one);
      });
      return $this;
    }

    if (!lang.isString(selector) && !lang.isFunction(callback) && callback !== false) {
      callback = data;
      data = selector;
      selector = undefined;
    }
    if (lang.isFunction(data) || data === false) {
      callback = data;
      data = undefined;
    }

    if (callback === false) {
      callback = returnFalse;
    }

    return $this.each(function(_, element) {
      if (one) {
        autoRemove = function(e) {
          remove(element, e.type, callback);
          return callback.apply(this, arguments);
        };
      }

      if (selector) {
        delegator = function(e) {
          var evt,
            match = $(e.target).closest(selector, element).get(0);
          if (match && match !== element) {
            evt = lang.extend(createProxy(e), {
              currentTarget: match,
              liveFired: element
            });
            return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)));
          }
        };
      }

      add(element, event, callback, data, selector, delegator || autoRemove);
    })
  };

  $.fn.off = function(event, selector, callback) {
    var $this = this;
    if (event && !lang.isString(event)) {
      $.each(event, function(type, fn) {
        $this.off(type, selector, fn);
      });
      return $this;
    }

    if (!lang.isString(selector) && !lang.isFunction(callback) && callback !== false) {
      callback = selector;
      selector = undefined;
    }

    if (callback === false) {
      callback = returnFalse;
    }

    return $this.each(function() {
      remove(this, event, callback, selector);
    });
  };

  $.fn.trigger = function(event, args) {
    event = (lang.isString(event) || lang.isPlainObject(event)) ? $.Event(event) : compatible(event);
    event._args = args;
    return this.each(function() {
      if (event.type in focus && typeof this[event.type] == 'function') {
        this[event.type]();
      } else if ('dispatchEvent' in this) {
        this.dispatchEvent(event);
      } else {
        $(this).triggerHandler(event, args);
      }
    });
  };

  $.fn.triggerHandler = function(event, args) {
    var e,
      result;
    this.each(function(i, element) {
      e = createProxy(lang.isString(event) ? $.Event(event) : event);
      e._args = args;
      e.target = element;
      $.each(findHandlers(element, event.type || event), function(i, handler) {
        result = handler.proxy(e);
        if (e.isImmediatePropagationStopped()) {
          return false;
        }
      });
    });
    return result;
  };

  ('focusin focusout focus blur load resize scroll unload click dblclick ' +
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
      $.fn[event] = function(callback) {
        return (0 in arguments) ?
          this.bind(event, callback) :
          this.trigger(event);
      };
    });

  $.Event = function(type, props) {
    if (!lang.isString(type)) {
      props = type;
      type = props.type;
    }
    var event = document.createEvent(specialEvents[type] || 'Events'),
      bubbles = true;
    if (props) {
      for (var name in props) {
        (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name]);
      }
    }
    event.initEvent(type, bubbles, true);
    return compatible(event);
  };

  // ====================== jqlite(fx) ======================

  var prefix = '',
    eventPrefix,
    vendors = {
      Webkit: 'webkit',
      Moz: '',
      O: 'o'
    },
    document = window.document,
    testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    transform,
    transitionProperty,
    transitionDuration,
    transitionTiming,
    transitionDelay,
    animationName,
    animationDuration,
    animationTiming,
    animationDelay,
    cssReset = {};

  function dasherize(str) {
    return str.replace(/([a-z])([A-Z])/, '$1-$2').toLowerCase();
  }

  function normalizeEvent(name) {
    return eventPrefix ? eventPrefix + name : name.toLowerCase();
  }

  $.each(vendors, function(vendor, event) {
    if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
      prefix = '-' + vendor.toLowerCase() + '-';
      eventPrefix = event;
      return false;
    }
  });

  transform = prefix + 'transform';
  cssReset[transitionProperty = prefix + 'transition-property'] =
    cssReset[transitionDuration = prefix + 'transition-duration'] =
      cssReset[transitionDelay = prefix + 'transition-delay'] =
        cssReset[transitionTiming = prefix + 'transition-timing-function'] =
          cssReset[animationName = prefix + 'animation-name'] =
            cssReset[animationDuration = prefix + 'animation-duration'] =
              cssReset[animationDelay = prefix + 'animation-delay'] =
                cssReset[animationTiming = prefix + 'animation-timing-function'] = '';

  $.fx = {
    off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
    speeds: {
      _default: 400,
      fast: 200,
      slow: 600
    },
    cssPrefix: prefix,
    transitionEnd: normalizeEvent('TransitionEnd'),
    animationEnd: normalizeEvent('AnimationEnd')
  };

  $.fn.animate = function(properties, duration, ease, callback, delay) {
    if (lang.isFunction(duration)) {
      callback = duration;
      ease = undefined;
      duration = undefined;
    }
    if (lang.isFunction(ease)) {
      callback = ease;
      ease = undefined;
    }
    if (lang.isPlainObject(duration)) {
      ease = duration.easing;
      callback = duration.complete;
      delay = duration.delay;
      duration = duration.duration;
    }
    if (duration) {
      duration = (typeof duration == 'number' ? duration : ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000;
    }
    if (delay) {
      delay = parseFloat(delay) / 1000;
    }
    return this.anim(properties, duration, ease, callback, delay);
  };

  $.fn.anim = function(properties, duration, ease, callback, delay) {
    var key, cssValues = {},
      cssProperties, transforms = '',
      that = this,
      wrappedCallback, endEvent = $.fx.transitionEnd,
      fired = false;

    if (duration === undefined) {
      duration = $.fx.speeds._default / 1000;
    }
    if (delay === undefined) {
      delay = 0;
    }
    if ($.fx.off) {
      duration = 0;
    }

    if (typeof properties == 'string') {
      cssValues[animationName] = properties;
      cssValues[animationDuration] = duration + 's';
      cssValues[animationDelay] = delay + 's';
      cssValues[animationTiming] = (ease || 'linear');
      endEvent = $.fx.animationEnd;
    } else {
      cssProperties = [];
      for (key in properties) {
        if (supportedTransforms.test(key)) {
          transforms += key + '(' + properties[key] + ') ';
        } else {
          cssValues[key] = properties[key];
          cssProperties.push(dasherize(key));
        }
      }

      if (transforms) {
        cssValues[transform] = transforms;
        cssProperties.push(transform);
      }
      if (duration > 0 && typeof properties === 'object') {
        cssValues[transitionProperty] = cssProperties.join(', ');
        cssValues[transitionDuration] = duration + 's';
        cssValues[transitionDelay] = delay + 's';
        cssValues[transitionTiming] = (ease || 'linear');
      }
    }

    wrappedCallback = function(event) {
      if (typeof event !== 'undefined') {
        if (event.target !== event.currentTarget) {
          return;
        }
        $(event.target).unbind(endEvent, wrappedCallback);
      } else {
        $(this).unbind(endEvent, wrappedCallback);
      }

      fired = true;
      $(this).css(cssReset);
      callback && callback.call(this);
    };

    if (duration > 0) {
      this.bind(endEvent, wrappedCallback);
      setTimeout(function() {
        if (fired) {
          return;
        }
        wrappedCallback.call(that);
      }, ((duration + delay) * 1000) + 25);
    }

    this.size() && this.get(0).clientLeft;

    this.css(cssValues);

    if (duration <= 0) {
      setTimeout(function() {
        that.each(function() {
          wrappedCallback.call(this);
        });
      }, 0);
    }

    return this;
  };

  testEl = null;

  module.exports = $;

});