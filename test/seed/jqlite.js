(function() {

  QUnit.module('mob/jqlite', {

    beforeEach: function() {
      $('*').unbind();
    }

  });

  function outerHTML(node) {
    return node.outerHTML || (function(n) {
        var div = document.createElement('div');
        div.appendChild(n.cloneNode(true));
        var html = div.innerHTML;
        div = null;
        return html;
      })(node);
  }

  function mousedown(el){
    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('mousedown', true, true, document.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    el.dispatchEvent(event);
  }

  function click(el){
    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, true, document.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
    el.dispatchEvent(event);
  }

  var $ = Mob.$;

  var globalVarSetFromReady = '';
  $(document).ready(function() {
    globalVarSetFromReady = 'hi!';
  });

  var globalVarSetFromReady2 = '';
  $(function() {
    globalVarSetFromReady2 = 'hi!';
  });

  var globalVarSetFromReady3 = '';
  $(document).on('ready', function() {
    globalVarSetFromReady3 = 'hi!';
  });

  var globalVarSetFromReady4 = '';
  $(document).on('foo ready bar', function() {
    globalVarSetFromReady4 = 'hi!';
  });

  QUnit.test('Mob extension API', function(assert) {

    assert.ok('init' in $.jqlite);
    assert.ok('fragment' in $.jqlite);
    assert.ok('jQ' in $.jqlite);
    assert.ok('isJQ' in $.jqlite);

    var oldZ = $.jqlite.jQ,
      calls = [];
    $.jqlite.jQ = function jQ(dom, selector) {
      var value = oldZ(dom, selector);
      calls.push(dom);
      return value;
    };

    var jQ1 = $(''),
      jQ2 = $('#find1 .findme');

    assert.ok('pluck' in jQ1);
    assert.ok('width' in jQ2);

    assert.equal(2, calls.length);

    $.jqlite.jQ = oldZ;

    assert.ok(!$.jqlite.isJQ());
    assert.ok(!$.jqlite.isJQ([]));
    assert.ok($.jqlite.isJQ($('body')));

  });

  QUnit.test('Mob $', function(assert) {

    var expectedElement = document.getElementById('some_element');

    assert.equal(1, $('#some_element').length);
    assert.deepEqual(expectedElement, $('#some_element').get(0));
    assert.deepEqual(expectedElement, $(expectedElement).get(0));
    assert.equal(3, $('#fixtures p').length);
    assert.equal(1, $('#fixtures p > span.yay').length);

    assert.deepEqual($('#some_element'), $('#some_element'));
    assert.deepEqual($('#nonexistent'), $('#nonexistent'));

    assert.equal(0, $(null).length);
    assert.equal(0, $(undefined).length);
    assert.equal(0, $(false).length);
    assert.equal(0, $('').length);
    assert.equal(0, $('#').length);

    var jQ1 = $(null),
      jQ2 = $(null);
    assert.ok(jQ1 !== jQ2);

    var jqlite = $(['a', 'b', 'c']);
    assert.equal(3, jqlite.length);
    assert.deepEqual(['a', 'b', 'c'], jqlite);

    assert.ok($({}) !== null);
    assert.ok($({
      a: true
    })[0].a);

    // Plain objects wrapped by a Zepto collection
    // should still refer to the original object
    // This is required for events on plain objects
    var plainObject = {
      a: 1
    };
    $(plainObject).get(0).a = 2;
    assert.equal(2, plainObject.a);
    assert.equal(2, $(plainObject).get(0).a);

  });

  QUnit.test('Mob $ more ...', function(assert) {
    var instance1 = $('#some_element'),
      instance2 = $('#fixtures p');

    assert.equal(1, instance1.length);
    assert.equal(3, instance2.length);

    var element = document.getElementById('some_element');

    var z1 = $([element]);
    assert.equal(1, z1.length);
    assert.deepEqual(element, z1.get(0));

    var z2 = $([element, null, undefined]);
    assert.equal(1, z2.length);
    assert.deepEqual(element, z2.get(0));

    var z3 = $([null, element, null]);
    assert.equal(1, z3.length);
    assert.deepEqual(element, z3.get(0));

    var jqlite = $('#fixtures p#find1, #find2');
    assert.equal(11, $('#fixtures span', jqlite).length);

    // DOM Element
    var domElement = document.getElementById('find1');
    assert.equal(4, $('#fixtures span.findme', domElement).length);

    // Selector with DOM Element Context
    var domElement = document.getElementById('find1');
    assert.equal(4, $('#fixtures span.findme', domElement).length);

    // DOM Element with DOM Element Context
    assert.equal(1, $(domElement, domElement).length);

    var z = $(document);
    assert.equal(1, z.length);
    assert.equal('', z.selector);

    if ('applicationCache' in window) {
      var z = $(window.applicationCache);
      assert.equal(1, z.length);
      assert.deepEqual(window.applicationCache, z.get(0));
      assert.equal('', z.selector);
    }

    var documentFragment = $(document.createDocumentFragment());
    assert.equal(1, documentFragment.length);
    assert.deepEqual(Node.DOCUMENT_FRAGMENT_NODE, documentFragment.get(0).nodeType);

    var iframe = $('#fixtures iframe').get(0),
      iframeWin = iframe.contentWindow,
      iframeDoc = iframe.contentDocument,
      iframeBody = iframeDoc.body,
      iframeEl = $(iframeBody).find('b');

    assert.deepEqual(iframeWin, $(iframeWin).get(0));
    assert.deepEqual(iframeDoc, $(iframeDoc).get(0));
    assert.deepEqual(iframeBody, $(iframeBody).get(0));
    assert.equal('B', iframeEl.pluck('tagName').join(','));
    assert.equal('Hello from iframe!', iframeEl.text());

    var fragment = $('<div>');
    assert.equal(1, fragment.length);
    assert.deepEqual('<div></div>', outerHTML(fragment.get(0)));
    assert.equal('', fragment.selector);
    assert.ok(!fragment.get(0).parentNode);

    fragment = $('<div>hello world</div>');
    assert.equal(1, fragment.length);
    assert.equal('<div>hello world</div>', outerHTML(fragment.get(0)));
    assert.equal('', fragment.selector);

    fragment = $('<div>hello</div> <span>world</span>');
    assert.equal(3, fragment.length);
    assert.equal('<div>hello</div>', outerHTML(fragment.get(0)));
    assert.equal(Node.TEXT_NODE, fragment.get(1).nodeType);
    assert.equal('<span>world</span>', outerHTML(fragment.get(2)));
    assert.equal('', fragment.selector);

    fragment = $('<div>\nhello</div> \n<span>world</span>');
    assert.equal(3, fragment.length);
    assert.equal('<div>\nhello</div>', outerHTML(fragment.get(0)));
    assert.equal(Node.TEXT_NODE, fragment.get(1).nodeType);
    assert.equal('<span>world</span>', outerHTML(fragment.get(2)));
    assert.equal('', fragment.selector);

    fragment = $('<div /><div />');
    assert.equal(2, fragment.length);

    fragment = $('<div>hello</div> ');
    assert.equal(1, fragment.length);

  });

  QUnit.test('Mob .get', function(assert) {

    var jqlite = $('#find1 .findme');
    var array = jqlite.get();
    assert.ok(jqlite !== array);
    assert.ok(array.pop === ([]).pop);

    var jqlite = $('#find1 .findme');
    assert.deepEqual(jqlite[0], jqlite.get(0));
    assert.deepEqual(jqlite[jqlite.length - 1], jqlite.get(-1));
    assert.equal(null, jqlite.get(jqlite.length));

  });

  QUnit.test('Mob .size', function(assert) {
    assert.equal(4, $('#find1 .findme').size());
  });

  QUnit.test('Mob properties', function(assert) {

    var el = $('<p id=hi />', {
      id: 'hello',
      'class': 'one two',
      text: 'world',
      css: {
        color: 'red'
      }
    });

    assert.equal('hello', el.attr('id'));
    assert.ok(el.hasClass('one'));
    assert.ok(el.hasClass('two'));
    assert.equal('world', el.text());
    assert.equal('red', el.css('color'));

    var jqlite = $('<a>Goodbye</a>', {
      text: 'Hello',
      href: 'http://jQlitejs.com'
    });
    assert.equal(1, jqlite.length);
    assert.equal('Hello', jqlite.text());
    assert.equal('http://jQlitejs.com', jqlite.attr('href'));

    var textNode = $(document.createTextNode('hi there'));
    assert.equal(1, textNode.length);
    assert.equal(Node.TEXT_NODE, textNode.get(0).nodeType);

    var comment = $('<!-- -->');
    assert.equal(1, comment.length);
    assert.equal(Node.COMMENT_NODE, comment.get(0).nodeType);

  });

  QUnit.test('Mob Node Creation', function(assert) {

    assert.equal('<div></div>', outerHTML($('<div></div>').get(0)));
    assert.equal('<div></div>', outerHTML($('<div/>').get(0)));
    assert.equal('<div><div></div></div>', outerHTML($('<div><div></div></div>').get(0)));
    assert.equal('<div><div></div></div>', outerHTML($('<div><div/></div>').get(0)));
    assert.equal('<div><div></div><div></div></div>', outerHTML($('<div><div></div><div></div></div>').get(0)));

    assert.equal('TD', $('<td></td>').pluck('nodeName').join(','));

    assert.equal('TH', $('<th></th>').pluck('nodeName').join(','));

    assert.equal('TR', $('<tr></tr>').pluck('nodeName').join(','));

    assert.equal('THEAD', $('<thead></thead>').pluck('nodeName').join(','));

    assert.equal('TBODY', $('<tbody></tbody>').pluck('nodeName').join(','));

    assert.equal('TFOOT', $('<tfoot></tfoot>').pluck('nodeName').join(','));

    assert.equal('OPTGROUP', $('<optgroup></optgroup>').pluck('nodeName').join(','));

    assert.equal('OPTION', $('<option></option>').pluck('nodeName').join(','));

  });

  QUnit.test('Mob .ready', function(assert) {
    assert.equal('hi!', globalVarSetFromReady);
    assert.equal('hi!', globalVarSetFromReady2);
    assert.equal('hi!', globalVarSetFromReady3);
    assert.equal('hi!', globalVarSetFromReady4);
  });

  QUnit.test('Mob .next', function(assert) {
    assert.equal('P', $('#some_element').next().get(0).tagName);
    assert.equal('DIV', $('#fixtures p').next().get(0).tagName);

    assert.equal(0, $('#fixtures span.yay').next('.nay').size());
    assert.equal(1, $('#fixtures span.yay').next().size());
    assert.equal(1, $('#fixtures span.yay').next().next('.nay').size());
  });

  QUnit.test('Mob .prev', function(assert) {
    assert.equal('DIV', $('#fixtures p').prev().get(0).tagName);
    assert.equal('DIV', $('#fixtures ul').prev().get(0).tagName);

    assert.equal(0, $('#fixtures span.nay').prev('.yay').size());
    assert.equal(1, $('#fixtures span.nay').prev().size());
    assert.equal(1, $('#fixtures span.nay').prev().prev('.yay').size());
  });

  QUnit.test('Mob .each', function(assert) {
    var index, tagnames = [];
    $('#eachtest > *').each(function(idx, el) {
      index = idx;
      assert.deepEqual(el, this);
      tagnames.push(el.tagName.toUpperCase());
    });
    assert.equal('SPAN, B, BR', tagnames.join(', '));
    assert.equal(2, index);

    var index, tagnames = [];
    $('#eachtest > *').each(function(idx, el) {
      index = idx;
      assert.deepEqual(el, this);
      tagnames.push(el.tagName.toUpperCase());
      if (idx == 1) {
        return false;
      }
    });
    assert.equal('SPAN, B', tagnames.join(', '));
    assert.equal(1, index);
  });

  QUnit.test('Mob .map', function(assert) {
    var results = $('#eachtest > *').map(function(idx, el) {
      assert.deepEqual(el, this);
      return idx + ':' + this.nodeName.toUpperCase();
    });
    assert.equal(3, results.size());
    assert.equal('0:SPAN, 1:B, 2:BR', results.get().join(', '));

    var fruits = ['apples', 'oranges', 'pineapple', 'peach', ['grape', 'melon']];
    var results = $.map(fruits, function(item, i) {
      if (item instanceof Array) {
        return item;
      } else if (!/apple/.test(item)) {
        return i + ':' + item;
      }
    });
    assert.equal('1:oranges,3:peach,grape,melon', results.join(','));

    var fruit = {
      name: 'banana',
      taste: 'sweet'
    };
    var results = $.map(fruit, function(value, key) {
      return key + '=' + value
    });
    assert.equal('name=banana,taste=sweet', results.sort().join(','));
  });

  QUnit.test('Mob .each', function(assert) {

    var array = ['a', 'b', 'c'],
      object = {
        a: 1,
        b: 2,
        c: 3
      },
      result;

    result = [];
    $.each(array, function(idx, val) {
      result.push(idx);
      result.push(val);
    });
    assert.equal('0a1b2c', result.join(''));

    result = [];
    $.each(object, function(key, val) {
      result.push(key);
      result.push(val);
    });
    assert.equal('a1b2c3', result.join(''));

    result = [];
    $.each(array, function(idx, val) {
      result.push(idx);
      result.push(val);
      return idx < 1;
    });
    assert.equal('0a1b', result.join(''));

    assert.equal('abc', $.each(array, function() {}).join(''));

    $.each(['a'], function(key, val) {
      assert.deepEqual(this, val);
    });
    $.each({
      a: 'b'
    }, function(key, val) {
      assert.deepEqual(this, val);
    });
  });

  QUnit.test('Mob .eq', function(assert) {
    var $els = $('#eq_test div');
    assert.equal(1, $els.eq(0).length);
    assert.equal(1, $els.eq(-1).length);
    assert.equal($els.eq(-1)[0].className, 'eq2');
    assert.ok(!$els.eq(-1).tagName);

    assert.equal(0, $('nonexistent').eq(0).length);
  });

  QUnit.test('Mob .first', function(assert) {
    var jqlite = $('#fixtures h1,p');
    assert.equal(4, jqlite.length);

    var jQlite2 = jqlite.first();
    assert.ok(jqlite !== jQlite2);
    assert.equal(4, jqlite.length);

    assert.equal(1, jQlite2.length);
    assert.equal('P', jQlite2.get(0).tagName);

    assert.equal(0, $('nonexistent').first().length);

    assert.equal('a', $(['a', 'b', 'c']).first());
  });

  QUnit.test('Mob .pluck', function(assert) {
    assert.equal('DIVDIV', $('#fixtures h1,div.htmltest').pluck('tagName').join(''));
  });

  QUnit.test('Mob .show', function(assert) {
    $('#show_hide_div1').show();
    assert.equal('inline-block', getComputedStyle($('#show_hide_div1').get(0)).display);

    $('#show_hide_div2').show();
    assert.equal('block', getComputedStyle($('#show_hide_div2').get(0)).display);

    $('#show_hide_div3').show();
    assert.equal('block', getComputedStyle($('#show_hide_div3').get(0)).display);

    $('#show_hide_span1').show();
    assert.equal('block', getComputedStyle($('#show_hide_span1').get(0)).display);

    $('#show_hide_span2').show();
    assert.equal('block', getComputedStyle($('#show_hide_span2').get(0)).display);

    $('#show_hide_span3').show();
    assert.equal('inline', getComputedStyle($('#show_hide_span3').get(0)).display);
  });

  QUnit.test('Mob .hide', function(assert) {
    $('#show_hide_div1').hide();
    assert.equal('none', $('#show_hide_div1').get(0).style.display);

    $('#show_hide_div2').hide();
    assert.equal('none', $('#show_hide_div2').get(0).style.display);

    $('#show_hide_div3').hide();
    assert.equal('none', $('#show_hide_div3').get(0).style.display);

    $('#show_hide_span1').hide();
    assert.equal('none', $('#show_hide_span1').get(0).style.display);

    $('#show_hide_span2').hide();
    assert.equal('none', $('#show_hide_span2').get(0).style.display);

    $('#show_hide_span3').hide();
    assert.equal('none', $('#show_hide_span3').get(0).style.display);
  });

  QUnit.test('Mob .toggle', function(assert) {
    var el = $('#show_hide_div1').hide(),
      domStyle = el.get(0).style;

    assert.equal('none', domStyle.display);

    var result = el.toggle();
    assert.deepEqual(el, result, 'expected toggle() to return self');
    assert.deepEqual('', domStyle.display);

    el.toggle();
    assert.equal('none', domStyle.display);

    el.toggle(true);
    assert.deepEqual('', domStyle.display);

    el.toggle(true);
    assert.deepEqual('', domStyle.display);

    el.toggle(false);
    assert.equal('none', domStyle.display);

    el.toggle(false);
    assert.equal('none', domStyle.display);

    var el1 = $('#show_hide_div1').hide(),
      el2 = $('#show_hide_div2').show(),
      both = $('#show_hide_div1, #show_hide_div2');

    both.toggle();
    assert.deepEqual('', el1.get(0).style.display);
    assert.equal('none', el2.get(0).style.display);

    both.toggle();
    assert.equal('none', el1.get(0).style.display);
    assert.equal('block', el2.get(0).style.display);
  });

  QUnit.test('Mob .offset', function(assert) {
    assert.equal(null, $('#doesnotexist').offset());
    var el = $('#some_element');
    assert.deepEqual(el, el.offset({}));
  });

  QUnit.test('Mob .width', function(assert) {
    assert.equal(null, $('#doesnotexist').width());
    // can't check values here, but make sure it doesn't error out
    var viewportWidth = $(window).width();
    assert.ok(viewportWidth > 0 || viewportWidth === 0);
    assert.ok($(document).width());

    assert.deepEqual(100, $('#offset').width());
    $('#offset').width('90px');
    assert.deepEqual(90, $('#offset').width());
    $('#offset').width(110);
    assert.deepEqual(110, $('#offset').width());
    $('#offset').width(function(i, oldWidth) {
      return oldWidth + 5;
    });
    assert.deepEqual(115, $('#offset').width());
  });

  QUnit.test('Mob .height', function(assert) {
    assert.equal(null, $('#doesnotexist').height());
    // can't check values here, but make sure it doesn't error out
    var viewportHeight = $(window).height();
    assert.ok(viewportHeight > 0 || viewportHeight === 0);
    assert.ok($(document).height());

    // with a tall element on the page,
    // the window (viewport) should be shorter than the total
    // document height
    $('<div style="height:9999px" id="very_high"></div>').appendTo('body');
    assert.ok($(window).height() < $(document).height(), 'window height was not smaller than document height?');
    $('#very_high').remove();

    assert.deepEqual(50, $('#offset').height());
    $('#offset').height('60px');
    assert.deepEqual(60, $('#offset').height());
    $('#offset').height(70);
    assert.deepEqual(70, $('#offset').height());
    $('#offset').height(function(i, oldHeight) {
      return oldHeight + 5;
    });
    assert.deepEqual(75, $('#offset').height());
  });

  QUnit.test('Mob .closest', function(assert) {
    var el = $('#li2');
    assert.deepEqual(el, el.closest('li'));
    assert.deepEqual($('#nested'), el.closest('ul'));
    // with context
    assert.deepEqual($('#nested'), el.closest('ul', $('#li1').get(0)));
    assert.equal(0, el.closest('#parents', $('#li1').get(0)).length);
    // no ancestor matched
    assert.equal(0, el.closest('form').length);

    var targets = $('#parents > li');
    var result = $('#li2').closest(targets);
    assert.equal(1, result.length);
    assert.equal('li1', result.get(0).id);

    assert.equal(0, $('#li1').closest('#li2').length);

    var target = $('#li1').get(0);
    var result = $('#li2').closest(target);
    assert.equal(1, result.length);
    assert.deepEqual(target, result.get(0));

    assert.equal(0, $('#li1').closest($('#li2').get(0)).length);

    var el = $('<div><p><a></a></p></div>'),
      para = el.children(),
      link = para.children();

    assert.deepEqual(para, link.closest('p'));
    assert.deepEqual(el, link.closest('div'));
    assert.deepEqual(el, el.closest('div'));
  });

  QUnit.test('Mob .contains', function(assert) {
    var el1 = $('#li1'),
      el2 = $('#li2');

    assert.ok($.contains(el1.get(0), el2.get(0)));
    assert.ok(!$.contains(el1.get(0), $('#parents').get(0)));

    var el = $('<div><p><a></a></p></div>'),
      para = el.children(),
      link = para.children();

    assert.ok($.contains(para.get(0), link.get(0)));
    assert.ok(!$.contains(document.body, el.get(0)));
  });

  QUnit.test('Mob .parents', function(assert) {
    var body = document.body,
      html = body.parentNode,
      container = $('#parents'),
      wrapper = $('#fixtures').get(0);
    assert.deepEqual($([wrapper, body, html]), container.parents());

    var expected = $('#li1 > ul').get();
    expected.push($('#li1').get(0));
    expected.push(container.get(0));
    expected = expected.concat([wrapper, body, html]);
    assert.deepEqual($(expected), $('#li1').find('li').parents());

    expected = [$('#nested').get(0), $('#parents').get(0)];
    assert.deepEqual($(expected), $('#li2').parents('ul'));

    var iframeBody = $('#fixtures iframe').get(0).contentDocument.body;
    assert.deepEqual([iframeBody, iframeBody.parentNode], $(iframeBody).find('b').first().parents());
  });

  QUnit.test('Mob .parent', function(assert) {
    var el = $('#li1');
    assert.deepEqual($('#parents'), el.parent());
    assert.deepEqual($('#li1 > ul'), el.find('li').parent());
    assert.equal(0, $(document.createElement('div')).parent().length);

    assert.equal(0, $('<ul />').parent().length);
  });

  QUnit.test('Mob .children', function(assert) {
    var el = $('#childrenTest'),
      lis = $('#fixtures li.child', el);

    //basic form
    assert.deepEqual(lis, el.children());
    //filtered by selector
    assert.deepEqual(lis.filter('.two'), el.children('.two'));
    //children == null
    assert.equal(4, lis.children(null).length);
    //across multiple parents
    assert.deepEqual(el.find('li a'), lis.children('a'));
    //chainabilty
    assert.equal(el.find('li a.childOfTwo').text(), lis.children('.childOfTwo').text());
    //non-existent children
    assert.equal(0, lis.children('.childOfTwo').children().length);
  });

  QUnit.test('Mob .contents', function(assert) {
    var $contents = $('#contentsTest').contents();
    assert.equal(3, $contents.length);
    assert.equal(2, $contents.filter('span').length);
    assert.equal(0, $('#contentsEmptyTest').contents().length);
  });

  QUnit.test('Mob .siblings', function(assert) {
    var el = $('#siblingsTest');

    //basic form
    assert.deepEqual($('li.one,li.three,li.four', el), $('li.two', el).siblings());
    //filtered by selector
    assert.deepEqual($('li.three', el), $('li.two', el).siblings('.three'));
    //across multiple parents
    assert.deepEqual(el.find('li b'), $('li em', el).siblings('b'));
    assert.equal(6, $('li span', el).siblings().length);
    //non-existent siblings
    assert.equal(0, $('li span.e', el).siblings().length);
  });

  QUnit.test('Mob .not', function(assert) {
    var el = $('#notTest');

    //selector form
    assert.deepEqual($('li.one,li.three,li.four', el), $('li', el).not('.two'));
    //element or NodeList form
    assert.deepEqual($('span.b,span.c,span.e', el), $('span', el).not(document.getElementById('notTestExclude')));
    assert.deepEqual($('li', el), $('li, span', el).not(document.getElementsByTagName('span')));
    //function form
    assert.deepEqual($('span.b,span.c', el), $('span', el).not(function(i) {
      var $this = $(this);
      $this.html(i);
      return ($this.hasClass('d') || $this.hasClass('e')) ? true : false;
    }));
    //test the index was passed in properly in previous test
    assert.equal('0', $('span.b', el).text());
    assert.equal('1', $('span.c', el).text());
  });

  QUnit.test('Mob .replaceWith', function(assert) {
    $('div.first').replaceWith('<h2 id="replace_test">New heading</h2>');
    assert.ok(!$('div.first').get(0));
    assert.ok(document.getElementById('replace_test').nodeType);
    assert.deepEqual($('.replacewith h2#replace_test').get(0), document.getElementById('replace_test'));

    $('#replace_test').replaceWith($('.replace_test_div'));
    assert.ok(!$('#replace_test').get(0));
    assert.ok(document.getElementsByClassName('replace_test_div')[0].nodeType);
    assert.deepEqual($('.replacewith h2#replace_test').get(0), document.getElementsByClassName('replace_test')[0]);

    //Multiple elements
    $('.replacewith .replace_test_div').replaceWith('<div class="inner first">hi</div><div class="inner fourth">hello</div>');
    assert.equal(4, $('.replacewith div').length);
    assert.equal('inner first', $('.replacewith div')[0].className);
    assert.equal('inner fourth', $('.replacewith div')[1].className);

    var orphanDiv = $('<div />');
    orphanDiv.replaceWith($('<div class="different" />'));
    assert.ok(!orphanDiv.hasClass('different'));
  });

  QUnit.test('Mob .wrap', function(assert) {
    var el = $('#wrap_test');
    el.find('span').wrap('<p><i/></p>');
    assert.equal('<p><i><span>hi</span></i></p><a></a><p><i><span>hello</span></i></p>', el.html());

    // avoids unnecessary cloning of dom structure for wrapping
    el = $('<div><a/></div>');
    var structure = $('<span/>');
    el.find('a').wrap(structure);
    assert.deepEqual(structure.get(0), el.find('span').get(0));

    var el = $('<div><b>A</b><b>B</b></div>');
    el.find('b').wrap(function(index) {
      return '<a class=link' + index + $(this).text() + ' />';
    });
    assert.equal('<a class="link0A"><b>A</b></a><a class="link1B"><b>B</b></a>', el.html());
  });

  QUnit.test('Mob .wrapAll', function(assert) {
    var el = $('#wrapall_test');
    el.find('span').wrapAll('<p><a/></p>');
    assert.equal('<b></b><p><a><span>hi</span><span>hello</span></a></p><i></i>', el.html());

    var fragment = $('<div id="fragment" />');
    fragment.wrapAll('<div id="wrap_test" />');
    assert.equal('wrap_test', fragment.parent().attr('id'));
    assert.equal(0, fragment.children().length);

    fragment = $('<div id="fragment" />');
    fragment.wrap('<div id="wrap_test" />');
    assert.equal('wrap_test', fragment.parent().attr('id'));
    assert.equal(0, fragment.children().length);
  });

  QUnit.test('Mob .clone', function(assert) {
    var el = $('<div class=sheep><span></span></div>'),
      el2 = el.clone();

    assert.ok(el2.hasClass('sheep'));
    el2.addClass('black');
    assert.ok(!el.hasClass('black'));

    el2.find('span').text('baa');
    assert.deepEqual('', el.find('span').text());
  });

  QUnit.test('Mob .find', function(assert) {
    var found = $('p#find1').find('span.findme');
    assert.equal(4, found.length);
    assert.equal('1', found.get(0).innerHTML);
    assert.equal('2', found.get(1).innerHTML);
    assert.equal('4', found.get(2).innerHTML);
    assert.equal('5<span>6</span>', found.get(3).innerHTML);

    var found = $('p#find1, #find2').find('span');
    assert.equal(11, found.length);

    var targets = $('#find1 span span, #find1 b, #find2 span');
    var found = $('p#find1').find(targets);
    assert.equal(2, found.length);
    assert.equal('B', found.get(0).tagName);
    assert.equal('6', found.get(1).innerHTML);

    var target = $('#find1 span span').get(0);
    var found = $('p#find1').find(target);
    assert.equal(1, found.length);
    assert.equal('6', found.get(0).innerHTML);

    found = $('p#find1').find(document.body);
    assert.equal(0, found.length, 'no elements should have matched');

    var found = $('<div><a>1</a></div>\n<div></div>').find('a');
    assert.equal(1, found.length);
    assert.equal('1', found.get(0).innerHTML);

    var element = '<div><a>1</a></div>';
    assert.equal(0, $(element).find(undefined).length);
    assert.equal(0, $(element).find(false).length);
    assert.equal(0, $(element).find(0).length);
    assert.equal(0, $(element).find('').length);
  });

  QUnit.test('Mob .filter', function(assert) {
    var found = $('div');
    assert.equal(2, found.filter('.filtertest').length);
    assert.equal(0, found.filter('.doesnotexist').length);
    assert.equal(1, found.filter('.filtertest').filter(':nth-child(2n)').length);

    var nodes = $('<select><option value=1>test1</option><option value=2>test2</option><option value=1>test1</option></select>');
    assert.equal(2, nodes.find('option').filter(function() {
      return this.value == '1';
    }).length);

    var indexes = [];
    nodes.find('option').filter(function(index) {
      if (this.value == '1') {
        indexes.push(index);
      }
    });
    assert.deepEqual([0, 2], indexes);

    var nativeFilter = Array.prototype.filter;
    try {
      // apply broken filter
      Array.prototype.filter = function() {
        return [];
      };
      assert.equal(2, $('div').filter('.filtertest').length);
    } finally {
      Array.prototype.filter = nativeFilter;
    }
  });

  QUnit.test('Mob .add', function(assert) {
    var lis = $('li'),
      spans = $('span'),
      together = lis.add('span'),
      duplicates = spans.add('span'),
      disconnected = $('<div></div>').add('<span></span>'),
      mainContext = $('#addTest');

    //uniquness of collection
    assert.equal(spans.length, duplicates.length);

    //selector only
    assert.equal((lis.length + spans.length), together.length);

    //selector with context
    assert.deepEqual($('span', mainContext), $('.add_span').add('.add_span_exclude', mainContext));

    //DOM Element + Chaining test
    assert.deepEqual(mainContext.children(), $('.add_span').add('.add_span_exclude').add(document.getElementById('addTestDiv')));

    //Disconnected
    assert.ok(!disconnected.get(0).parentNode);

    $('#addTestDiv').append(disconnected);
    assert.equal('<div></div><span></span>', document.getElementById('addTestDiv').innerHTML);
  });

  QUnit.test('Mob .css', function(assert) {
    var el = $('#some_element').get(0);

    // single assignments
    $('#some_element').css('color', '#f00');
    $('#some_element').css('margin-top', '10px');
    $('#some_element').css('marginBottom', '5px');
    $('#some_element').css('left', 42);
    $('#some_element').css('z-index', 10);
    $('#some_element').css('fontWeight', 300);
    $('#some_element').css('border', '1px solid rgba(255,0,0,0)');
    assert.equal('rgb(255, 0, 0)', el.style.color);
    assert.equal('rgba(255, 0, 0, 0)', el.style.borderLeftColor);
    assert.equal('1px', el.style.borderLeftWidth);
    assert.equal('10px', el.style.marginTop);
    assert.equal('5px', el.style.marginBottom);
    assert.equal('42px', el.style.left);
    assert.equal(300, el.style.fontWeight);
    assert.equal(10, el.style.zIndex);

    // read single values, including shorthands
    assert.equal('rgb(255, 0, 0)', $('#some_element').css('color'));
    assert.equal('1px solid rgba(255, 0, 0, 0)', $('#some_element').css('border'));

    // multiple assignments
    $('#some_element').css({
      'border': '2px solid #000',
      'color': 'rgb(0,255,0)',
      'padding-left': '2px'
    });
    assert.equal('2px', $('#some_element').css('borderLeftWidth'));
    assert.equal('solid', $('#some_element').css('borderLeftStyle'));
    assert.equal('rgb(0, 0, 0)', $('#some_element').css('borderLeftColor'));
    assert.equal('rgb(0, 255, 0)', $('#some_element').css('color'));
    assert.equal('2px', $('#some_element').css('paddingLeft'));
    assert.equal('2px', $('#some_element').css('border-left-width'));
    assert.equal('solid', $('#some_element').css('border-left-style'));
    assert.equal('rgb(0, 0, 0)', $('#some_element').css('border-left-color'));
    assert.equal('rgb(0, 255, 0)', $('#some_element').css('color'));
    assert.equal('2px', $('#some_element').css('padding-left'));

    // read multiple values, camelCased CSS
    var arrCamelCss = $('#some_element').css(['borderLeftWidth', 'borderLeftStyle', 'borderLeftColor', 'color']);
    assert.equal('2px', arrCamelCss['borderLeftWidth']);
    assert.equal('solid', arrCamelCss['borderLeftStyle']);
    assert.equal('rgb(0, 0, 0)', arrCamelCss['borderLeftColor']);
    assert.equal('rgb(0, 255, 0)', arrCamelCss['color']);
    assert.ok(!arrCamelCss['paddingLeft']);

    // read multiple values, dashed CSS property names
    var arrDashedCss = $('#some_element').css(['border-left-width', 'border-left-style', 'border-left-color', 'color']);
    assert.equal('2px', arrDashedCss['border-left-width']);
    assert.equal('solid', arrDashedCss['border-left-style']);
    assert.equal('rgb(0, 0, 0)', arrDashedCss['border-left-color']);
    assert.equal('rgb(0, 255, 0)', arrDashedCss['color']);
    assert.ok(!arrDashedCss['padding-left']);

    // make sure reads from empty Zepto collections just return undefined
    assert.ok(!$().css(['border-left-width']));

    var div = $('#get_style_element');
    assert.equal('48px', div.css('font-size'));
    assert.equal('rgb(0, 0, 0)', div.css('color'));

    var el = $('#some_element').css({
        'margin-top': '1px',
        'margin-bottom': '1px'
      }),
      dom = el.get(0);

    el.css('color', '#000');
    el.css('color', '');
    assert.deepEqual('', dom.style.color);

    el.css('color', '#000');
    el.css('color', undefined);
    assert.deepEqual('', dom.style.color);

    el.css('color', '#000');
    el.css('color', null);
    assert.deepEqual('', dom.style.color);

    el.css('color', '#000');
    el.css({
      color: '',
      'margin-top': undefined,
      'marginBottom': null
    });
    assert.deepEqual('', dom.style.color);
    assert.deepEqual('', dom.style.marginTop);
    assert.deepEqual('', dom.style.marginBottom);

    var el = $('#some_element'),
      dom = el.get(0);
    el.css('opacity', 0);
    assert.deepEqual('0', dom.style.opacity);

    el.css('opacity', 1);
    el.css({
      opacity: 0
    });
    assert.deepEqual('0', dom.style.opacity);

    var errorWasRaised = false;
    try {
      var color = $('.some-non-exist-elm').css('color');
    } catch (e) {
      errorWasRaised = true;
    }
    assert.ok(!errorWasRaised);
  });

  QUnit.test('Mob .html', function(assert) {
    var div = $('div.htmltest');

    div.text(undefined);
    assert.equal('', div.html());

    assert.deepEqual(div, div.html('yowza'));
    assert.equal('yowza', document.getElementById('htmltest1').innerHTML);
    assert.equal('yowza', document.getElementById('htmltest2').innerHTML);

    assert.equal('yowza', $('div.htmltest').html());

    div.html('');
    assert.equal('', document.getElementById('htmltest2').innerHTML);

    assert.equal('', $('#htmltest3').html());

    assert.equal(null, $('doesnotexist').html());

    div.html('yowza');
    div.html(function(idx, html) {
      return html.toUpperCase();
    });
    assert.equal('YOWZA', div.html());

    div.html('<u>a</u><u>b</u><u>c</u>');

    $('u').html(function(idx, html) {
      return idx + html;
    });
    assert.equal('<u>0a</u><u>1b</u><u>2c</u>', div.html());

    var table = $('#htmltest4'),
      html = '<tbody><tr><td>ok</td></tr></tbody>';
    table.html('<tbody><tr><td>ok</td></tr></tbody>');
    assert.equal(html, table.html());
  });

  QUnit.test('Mob .text', function(assert) {
    // test basics with Zepto-created DOM elements
    assert.equal('', $('<h1/>').text());
    assert.equal('', $('<h1/>').text('').text());
    assert.equal('', $('<h1/>').text(undefined).text());
    assert.equal('', $('<h1/>').text(null).text());
    assert.equal('false', $('<h1/>').text(false).text());
    assert.equal('1', $('<h1/>').text(1).text());
    assert.equal('<b>a</b>', $('<h1/>').text('<b>a</b>').text());

    assert.equal('&lt;b&gt;a&lt;/b&gt;', $('<h1/>').text('<b>a</b>').html());

    // now test with some existing DOM elements
    $('#texttest3').text(undefined);
    assert.equal('', $('#texttest3').text());

    assert.equal('Here is some text', $('div.texttest').text());
    assert.equal('And some more', $('#texttest2').text());

    $('div.texttest').text('Let\'s set it');
    assert.equal('Let\'s set it', $('#texttest1').text());
    assert.equal('Let\'s set it', $('#texttest2').text());

    $('#texttest2').text('');
    assert.equal('Let\'s set it', $('div.texttest').text());
    assert.equal('', $('#texttest2').text());

    var el = $('<div><span>hello</span> <span></span> <span>world</span> <span>again</span></div>'),
      els = el.find('span');

    els.text(function(idx, oldText) {
      if (idx > 2) {
        return null;
      }
      if (oldText) {
        return oldText.toUpperCase() + ' ' + idx;
      }
    });

    assert.equal('HELLO 0', els[0].textContent);
    assert.equal('', els[1].textContent);
    assert.equal('WORLD 2', els[2].textContent);
    assert.equal('', els[3].textContent);
  });

  QUnit.test('Mob .empty', function(assert) {
    $('#empty_test').empty();

    assert.equal(document.getElementById('empty_1'), null);
    assert.equal(document.getElementById('empty_2'), null);
    assert.equal(document.getElementById('empty_3'), null);
    assert.equal(document.getElementById('empty_4'), null);
  });

  QUnit.test('Mob .attr', function(assert) {
    var els = $('#attr_1, #attr_2');

    assert.equal('someId1', els.attr('data-id'));
    assert.equal('someName1', els.attr('data-name'));

    els.attr('data-id', 'someOtherId');
    els.attr('data-name', 'someOtherName');

    assert.equal('someOtherId', els.attr('data-id'));
    assert.equal('someOtherName', els.attr('data-name'));
    assert.equal('someOtherId', $('#attr_2').attr('data-id'));

    assert.equal(null, els.attr('nonExistentAttribute'));

    els.attr('data-id', false);
    assert.equal('false', els.attr('data-id'));

    els.attr('data-id', 0);
    assert.equal('0', els.attr('data-id'));

    els.attr({
      'data-id': 'id',
      'data-name': 'name'
    });
    assert.equal('id', els.attr('data-id'));
    assert.equal('name', els.attr('data-name'));
    assert.equal('id', $('#attr_2').attr('data-id'));

    els.attr('data-id', function(idx, oldvalue) {
      return idx + oldvalue;
    });
    assert.equal('0id', els.attr('data-id'));
    assert.equal('1id', $('#attr_2').attr('data-id'));

    var el = $('<div data-name="foo">');
    assert.deepEqual(el, el.attr('data-name', undefined), 'setter should return self');
    assert.equal(null, el.get(0).getAttribute('data-name'), 'attribute should be erased');
    assert.equal(null, el.attr('data-name'), 'attr should reflect erased attribute');
  });

  QUnit.test('Mob .prop', function(assert) {
    var label = $('#prop_test1');
    var input = $('#prop_test2');
    var table = $('#prop_test3');
    var td1 = $('#prop_test4');
    var td2 = $('#prop_test5');
    var img = $('#prop_test6');
    var div = $('#prop_test7');

    assert.equal(input.prop('tabindex'), -1);
    assert.equal(input.prop('readonly'), true);
    assert.equal(label.prop('for'), 'prop_test2');
    assert.equal(input.prop('class'), 'propTest');
    assert.equal(input.prop('maxlength'), 10);
    assert.equal(table.prop('cellspacing'), 10);
    assert.equal(table.prop('cellpadding'), 5);
    assert.equal(td1.prop('rowspan'), 2);
    assert.equal(td2.prop('colspan'), 2);
    assert.equal(img.prop('usemap'), '#imgMap');
    assert.equal(div.prop('contenteditable'), 'true');

    var input = $('<input readonly>');
    assert.deepEqual(input, input.prop('readonly', false));
    assert.ok(!input.prop('readonly'));

    input.get(0)._foo = 'bar';
    assert.deepEqual(input, input.prop('_foo', undefined));
    assert.ok(!input.get(0)._foo, 'custom property should be cleared');
    assert.ok(!input.prop('_foo'), 'prop should reflect cleared property');
  });

  QUnit.test('Mob .attr', function(assert) {
    assert.ok(!$().attr('yo'));
    assert.ok(!$(document.createTextNode('')).attr('yo'));
    assert.ok(!$(document.createComment('')).attr('yo'));

    var els = $('<b></b> <i></i>').attr('id', function(i) {
      return this.nodeName + i;
    });
    assert.equal('B0', els.eq(0).attr('id'));
    assert.equal('I2', els.eq(2).attr('id'));
    assert.ok(!els.eq(1).attr('id'));

    var el = $('#data_attr');
    assert.deepEqual('', el.attr('data-empty'));

    var inputs, values;

    // HTML is set here because IE does not reset
    // values of input fields on page reload
    document.getElementById('attr_with_text_input').innerHTML =
      '<input value="Default input">' +
      '<input type="text" value="Text input">' +
      '<input type="email" value="Email input">' +
      '<input type="search" value="Search input">';

    inputs = $('#attr_with_text_input input');

    values = $.map(inputs, function(i) {
      return $(i).attr('value');
    });
    assert.equal('Default input, Text input, Email input, Search input', values.join(', '));

    // Only .attr('value', v) changes .attr('value')
    // rather than .val(v)
    inputs.attr('value', function(i, value) {
      return value.replace('input', 'changed');
    });

    values = $.map(inputs, function(i) {
      return $(i).attr('value');
    });
    assert.equal('Default changed, Text changed, Email changed, Search changed', values.join(', '));

    var el = $('<div id=hi>');
    el.attr('id', null);
    assert.deepEqual('', el.attr('id'));

    el.attr('id', 'hello');
    el.attr({
      id: null
    });
    assert.deepEqual('', el.attr('id'));

  });

  QUnit.test('Mob .removeAttr', function(assert) {
    var el = $('#attr_remove');
    assert.equal('boom', el.attr('data-name'));
    el.removeAttr('data-name');
    assert.equal(null, el.attr('data-name'));

    var el = $('#attr_remove_multi');
    assert.equal('someId1', el.attr('data-id'));
    assert.equal('someName1', el.attr('data-name'));

    el.removeAttr('data-id data-name');
    assert.equal(null, el.attr('data-id'));
    assert.equal(null, el.attr('data-name'));

    assert.ok($().removeAttr('rel'));
    assert.ok($(document.createTextNode('')).removeAttr('rel'));

    var els = $('<b rel=up></b> <i rel=next></i>');
    assert.deepEqual(els, els.removeAttr('rel'));
    assert.equal(null, els.eq(0).attr('rel'));
    assert.ok(!els.eq(1).attr('rel'));
    assert.equal(null, els.eq(2).attr('rel'));
  });

  QUnit.test('Mob .data', function(assert) {
    var el = $('#data_attr');
    // existing attribute
    assert.equal('bar', el.data('foo'));
    assert.equal('baz', el.data('foo-bar'));
    assert.equal('baz', el.data('fooBar'));

    // camelCase
    el.data('fooBar', 'bam');
    assert.equal('bam', el.data('fooBar'));
    assert.equal('bam', el.data('foo-bar'));

    // new attribute
    el.data('fun', 'hello');
    //assert.equal('hello', el.attr('data-fun'))
    assert.equal('hello', el.data('fun'));

    // blank values
    assert.deepEqual('', el.data('empty'));
    assert.ok(!el.data('does-not-exist'));

    var el = $('<div data-num=42 />');
    assert.deepEqual(42, el.data('num'));

    assert.deepEqual(42.5, $('<div data-float=42.5 />').data('float'));

    assert.deepEqual('08', $('<div data-notnum=08 />').data('notnum'));

    assert.deepEqual('5903509451651483504', $('<div data-bignum="5903509451651483504" />').data('bignum'));

    var el = $('<div data-true=true data-false=false />');
    assert.ok(el.data('true'));
    assert.ok(!el.data('false'));

    var el = $('<div data-nil=null />');
    assert.equal(null, el.data('nil'));

    var el = $('<div data-json=\'["one", "two"]\' data-invalid=\'[boom]\' />');
    var json = el.data('json');
    assert.equal(2, json.length);
    assert.equal('one', json[0]);
    assert.equal('two', json[1]);
    assert.equal('[boom]', el.data('invalid'));
  });

  QUnit.test('Mob .val', function(assert) {
    var input = $('#attr_val');

    // some browsers like IE don't reset input values on reload
    // which messes up repeated test runs, so set the start value
    // directly via the DOM API
    document.getElementById('attr_val').value = 'Hello World';

    assert.equal('Hello World', input.val());

    input.val(undefined);
    assert.equal('undefined', input.val());

    input.val('');
    assert.equal('', input.val());

    input.get(0).value = 'Hello again';
    assert.equal('Hello again', input.val());

    input.val(function(i, val) {
      return val.replace('Hello', 'Bye');
    });
    assert.equal('Bye again', input.val());

    assert.ok(!$('non-existent').val());

    var multiple = $('<select multiple><option selected>1</option><option value=2 selected="selected">a</option><option>3</option></select>');
    assert.deepEqual(['1', '2'], multiple.val());

    // FIXME
    // This is the "approved" way of de-selecting an option
    // Unfortunately, this fails on Chrome 29 for Android
    multiple.find('option')[0].selected = false;

    assert.deepEqual(['2'], multiple.val());

    var input;

    input = $('<input type="text" value="Original">');
    input.val('By .val(v)');
    assert.equal('Original', input.attr('value'));
    assert.equal('By .val(v)', input.val());

    input.attr('value', 'By .attr("value", v)');
    assert.equal('By .attr("value", v)', input.attr('value'));
    assert.equal('By .val(v)', input.val());

    // .attr('value', v) will change both
    // without applying .val(v) first
    input = $('<input type="text" value="Original">');
    input.attr('value', 'By .attr("value", v)');
    assert.equal('By .attr("value", v)', input.attr('value'));
    assert.equal('By .attr("value", v)', input.val());
  });

  QUnit.test('Mob chaining', function(assert) {
    assert.ok(document.getElementById('nay').innerHTML == 'nay');
    $('span.nay').css('color', 'red').html('test');
    assert.ok(document.getElementById('nay').innerHTML == 'test');
  });

  QUnit.test('Mob cachingForLater', function(assert) {
    var one = $('div');
    var two = $('span');

    assert.ok(one.get(0) !== two.get(0));
  });

  QUnit.test('Mob plugins', function(assert) {
    var el = $('#some_element').get(0);

    $.fn.plugin = function() {
      return this.each(function() {
        this.innerHTML = 'plugin!';
      });
    };
    $('#some_element').plugin();
    assert.equal('plugin!', el.innerHTML);

    // test if existing Zepto objects receive new plugins
    if ('__proto__' in {}) {
      var $some_element = $('#some_element');
      $.fn.anotherplugin = function() {
        return this.each(function() {
          this.innerHTML = 'anotherplugin!';
        });
      };
      assert.ok(typeof $some_element.anotherplugin == 'function');
      $some_element.anotherplugin();
      assert.equal('anotherplugin!', el.innerHTML);
    }
  });

  QUnit.test('Mob AppendPrependBeforeAfter', function(assert) {
    $('#beforeafter').append('append');
    $('#beforeafter').prepend('prepend');
    $('#beforeafter').before('before');
    $('#beforeafter').after('after');

    assert.equal('before<div id="beforeafter">prependappend</div>after', $('#beforeafter_container').html());

    //testing with TextNode as parameter
    $('#beforeafter_container').html('<div id="beforeafter"></div>');

    function text(contents) {
      return document.createTextNode(contents);
    }

    $('#beforeafter').append(text('append'));
    $('#beforeafter').prepend(text('prepend'));
    $('#beforeafter').before(text('before'));
    $('#beforeafter').after(text('after'));

    assert.equal('before<div id="beforeafter">prependappend</div>after', $('#beforeafter_container').html());

    $('#beforeafter_container').html('<div id="beforeafter"></div>');

    function div(contents) {
      var el = document.createElement('div');
      el.innerHTML = contents;
      return el;
    }

    $('#beforeafter').append(div('append'));
    $('#beforeafter').prepend(div('prepend'));
    $('#beforeafter').before(div('before'));
    $('#beforeafter').after(div('after'));

    assert.equal(
      '<div>before</div><div id="beforeafter"><div>prepend</div>' +
      '<div>append</div></div><div>after</div>',
      $('#beforeafter_container').html()
    );

    //testing with Zepto object as parameter
    $('#beforeafter_container').html('<div id="beforeafter"></div>');

    $('#beforeafter').append($(div('append')));
    $('#beforeafter').prepend($(div('prepend')));
    $('#beforeafter').before($(div('before')));
    $('#beforeafter').after($(div('after')));

    assert.equal(
      '<div>before</div><div id="beforeafter"><div>prepend</div>' +
      '<div>append</div></div><div>after</div>',
      $('#beforeafter_container').html()
    );

    //testing with a jqlite object of more than one element as parameter
    $(document.body).append('<div class="append">append1</div><div class="append">append2</div>');
    $(document.body).append('<div class="prepend">prepend1</div><div class="prepend">prepend2</div>');
    $(document.body).append('<div class="before">before1</div><div class="before">before2</div>');
    $(document.body).append('<div class="after">after1</div><div class="after">after2</div>');

    $('#beforeafter_container').html('<div id="beforeafter"></div>');

    $('#beforeafter').append($('.append'));
    $('#beforeafter').prepend($('.prepend'));
    $('#beforeafter').before($('.before'));
    $('#beforeafter').after($('.after'));

    assert.equal(
      '<div class="before">before1</div><div class="before">before2</div><div id="beforeafter"><div class="prepend">prepend1</div><div class="prepend">prepend2</div>' +
      '<div class="append">append1</div><div class="append">append2</div></div><div class="after">after1</div><div class="after">after2</div>',
      $('#beforeafter_container').html()
    );

    //

    var helloWorlds = [],
      appendContainer1 = $('<div> <div>Hello</div> <div>Hello</div> </div>'),
      helloDivs = appendContainer1.find('div');

    helloDivs.append(' world!');
    helloDivs.each(function() {
      helloWorlds.push($(this).text());
    });
    assert.equal('Hello world!,Hello world!', helloWorlds.join(','));

    //

    var spans = [],
      appendContainer2 = $('<div> <div></div> <div></div> </div>'),
      appendDivs = appendContainer2.find('div');

    appendDivs.append($('<span>Test</span>'));
    appendDivs.each(function() {
      spans.push($(this).html());
    });
    assert.equal('<span>Test</span>,<span>Test</span>', spans.join(','));

    var el = $(document.body);
    assert.deepEqual(el, el.append(null));

    var fragment = $('<div class=fragment />');
    fragment.before('before').after('after');
    assert.equal(1, fragment.length);
    assert.ok(fragment.hasClass('fragment'));

    var el = $('<div><span>original</span></div>');
    el.append(
      $('<b>one</b>').get(0),
      $('<b>two</b><b>three</b>').get(),
      $('<b>four</b><b>five</b>'),
      '<b>six</b>'
    );
    assert.equal('original one two three four five six',
      $.map(el.children(), function(c) {
        return $(c).text();
      }).join(' '));
  });

  QUnit.test('Mob AppendPrependBeforeAfter ...', function(assert) {
    function div(contents) {
      var el = document.createElement('div');
      el.innerHTML = contents;
      return el;
    }

    var ap = $(div('appendto'));
    var pr = $(div('prependto'));

    var ap2 = ap.appendTo($('#appendtoprependto'));
    var pr2 = pr.prependTo($('#appendtoprependto'));

    // the object returned is the correct one for method chaining
    assert.deepEqual(ap, ap2);
    assert.deepEqual(pr, pr2);

    assert.equal(
      '<div id="appendtoprependto"><div>prependto</div>' +
      '<div>appendto</div></div>',
      $('#appendtoprependto_container').html()
    );

    // jqlite object with more than one element
    $(document.body).append('<div class="appendto">appendto1</div><div class="appendto">appendto2</div>');
    $(document.body).append('<div class="prependto">prependto1</div><div class="prependto">prependto2</div>');

    // selector

    // Note that on IE resetting the parent element to be empty will
    // cause inserted elements to be emptied out, so we have to re-create
    // them. This is the same behavior as on jQuery.
    // (Other browsers don't exhibit this problem.)
    ap = $(div('appendto'));
    pr = $(div('prependto'));

    $('#appendtoprependto_container').html('<div id="appendtoprependto"></div>');
    ap.appendTo('#appendtoprependto');
    pr.prependTo('#appendtoprependto');
    assert.equal(
      '<div id="appendtoprependto"><div>prependto</div>' +
      '<div>appendto</div></div>',
      $('#appendtoprependto_container').html()
    );

    // reset test elements
    ap = $(div('appendto'));
    pr = $(div('prependto'));
    $('#appendtoprependto_container').html('<div id="appendtoprependto"></div>');
    $('.appendto').appendTo($('#appendtoprependto'));
    $('.prependto').prependTo($('#appendtoprependto'));

    assert.equal(
      '<div id="appendtoprependto"><div class="prependto">prependto1</div><div class="prependto">prependto2</div><div class="appendto">appendto1</div><div class="appendto">appendto2</div></div>',
      $('#appendtoprependto_container').html()
    );

    function div(contents) {
      var el = document.createElement('div');
      el.innerHTML = contents;
      return el;
    }

    var ib = $(div('insertbefore'));
    var ia = $(div('insertafter'));

    var ibia = $('#insertbeforeinsertafter');
    var ib2 = ib.insertBefore(ibia);
    var ia2 = ia.insertAfter(ibia);

    // test the object returned is correct for method chaining
    assert.equal(
      '<div>insertbefore</div><div id="insertbeforeinsertafter">' +
      '</div><div>insertafter</div>',
      $('#insertbeforeinsertafter_container').html()
    );

    // testing with a jqlite object of more than one element as parameter
    $(document.body).append('<div class="insertbefore">insertbefore1</div><div class="insertbefore">insertbefore2</div>');
    $(document.body).append('<div class="insertafter">insertafter1</div><div class="insertafter">insertafter2</div>');

    $('#insertbeforeinsertafter_container').html('<div id="insertbeforeinsertafter"></div>');

    $('.insertbefore').insertBefore($('#insertbeforeinsertafter'));
    $('.insertafter').insertAfter($('#insertbeforeinsertafter'));

    assert.equal(
      '<div class="insertbefore">insertbefore1</div><div class="insertbefore">insertbefore2</div>' +
      '<div id="insertbeforeinsertafter"></div><div class="insertafter">insertafter1</div>' +
      '<div class="insertafter">insertafter2</div>',
      $('#insertbeforeinsertafter_container').html()
    );

    // testing with a selector as parameter
    $('#insertbeforeinsertafter_container').html('<div id="insertbeforeinsertafter"></div>');

    // reset test elements
    ib = $(div('insertbefore'));
    ia = $(div('insertafter'));
    ib.insertBefore('#insertbeforeinsertafter');
    ia.insertAfter('#insertbeforeinsertafter');

    assert.equal(
      '<div>insertbefore</div><div id="insertbeforeinsertafter">' +
      '</div><div>insertafter</div>',
      $('#insertbeforeinsertafter_container').html()
    );

    window.someGlobalVariable = 0;
    try {
      $('#fixtures').append(
        '<div><b id="newByAppend">Hi</b>' +
        '<\script>this.someGlobalVariable += Mob.$("#newByAppend").size()<\/script></div>'
      );
      assert.deepEqual(1, window.someGlobalVariable);
    } finally {
      delete window.someGlobalVariable;
    }

    window.someGlobalVariable = 0;
    try {
      $('<div>').appendTo('#fixtures').html(
        '<div><b id="newByHtml">Hi</b>' +
        '<\script>this.someGlobalVariable += Mob.$("#newByHtml").size()<\/script></div>'
      );
      assert.deepEqual(1, window.someGlobalVariable);
    } finally {
      delete window.someGlobalVariable;
    }

    window.someGlobalVariable = 0;
    try {
      $('<div>').appendTo('#fixtures').prepend(
        '<b id="newByPrepend">Hi</b>' +
        '<\script>this.someGlobalVariable += Mob.$("#newByPrepend").size()<\/script>'
      );
      assert.deepEqual(1, window.someGlobalVariable);
    } finally {
      delete window.someGlobalVariable;
    }

    try {
      window.someGlobalVariable = true;
      $('<' + 'script type="text/template">window.someGlobalVariable = false</script' + '>').appendTo('body');
      assert.ok(window.someGlobalVariable);

      window.someGlobalVariable = true;
      $('<' + 'script type="text/template">this.someGlobalVariable = false</script' + '>').appendTo('body');
      assert.ok(window.someGlobalVariable);
    } finally {
      delete window.someGlobalVariable;
    }

  });

  QUnit.test('Mob .remove', function(assert) {
    var el = $('<div>').appendTo(document.body);
    assert.equal(1, el.parent().length);
    assert.deepEqual(el, el.remove());
    assert.equal(0, el.parent().length);
    assert.deepEqual(el, el.remove());
  });

  QUnit.test('Mob .html', function(assert) {
    try {
      window.someGlobalVariable = true;
      $('<div></div>').appendTo('body')
        .html('<' + 'script type="text/template">window.someGlobalVariable = false</script' + '>');
      assert.ok(window.someGlobalVariable);
    } finally {
      delete window.someGlobalVariable;
    }

    try {
      window.someGlobalVariable = 0;
      $('<div></div>')
        .html('<\script>window.someGlobalVariable += 1<\/script>')
        .appendTo('body');
      assert.deepEqual(1, window.someGlobalVariable);
    } finally {
      delete window.someGlobalVariable;
    }

  });

  QUnit.test('Mob .addClass .removeClass', function(assert) {
    var el = $('#some_element').get(0);

    $('#some_element').addClass('green');
    assert.equal('green', el.className);
    $('#some_element').addClass('green');
    assert.equal('green', el.className);
    $('#some_element').addClass('red');
    assert.equal('green red', el.className);
    $('#some_element').addClass('blue red');
    assert.equal('green red blue', el.className);
    $('#some_element').removeClass('green blue');
    assert.equal('red', el.className);

    $('#some_element').attr('class', ' red green blue ');
    assert.equal(' red green blue ', el.className); // sanity check that WebKit doesn't change original input
    $('#some_element').removeClass('green');
    assert.equal('red blue', el.className);

    //addClass with function argument
    $('#some_element').addClass(function(idx, classes) {
      //test the value of "this"
      assert.deepEqual($('#some_element'), $(this));
      //test original classes are being passed
      assert.equal('red blue', this.className);
      return 'green';
    });
    assert.equal('red blue green', el.className);

    // addClass with no argument
    assert.deepEqual($('#some_element'), $('#some_element').addClass());
    assert.equal('red blue green', el.className);
    assert.deepEqual($('#some_element'), $('#some_element').addClass(''));
    assert.equal('red blue green', el.className);

    //removeClass with function argument
    $('#some_element').removeClass(function(idx, classes) {
      //test the value of 'this'
      assert.deepEqual($('#some_element'), $(this));
      //test original classes are being passed
      assert.equal('red blue green', this.className);
      return 'blue';
    });
    assert.equal('red green', el.className);

    $('#some_element').removeClass();
    assert.equal('', el.className);
  });

  QUnit.test('Mob .addClass .removeClass ...', function(assert) {
    $(window).removeClass('non-existing-class');
    assert.ok(!('className' in window));
    $(window).addClass('some-class');
    assert.ok(!('className' in window));
    assert.ok(!$(window).hasClass('some-class'));
    $(window).toggleClass('some-class');
    assert.ok(!('className' in window));
  });

  QUnit.test('Mob .hasClass', function(assert) {
    var el = $('#some_element');
    el.addClass('green');

    assert.ok(el.hasClass('green'));
    assert.ok(!el.hasClass('orange'));

    el.addClass('orange');
    assert.ok(el.hasClass('green'));
    assert.ok(el.hasClass('orange'));

    el = $(document.body);
    assert.ok(!el.hasClass('orange'), 'body shouldn\'t have the class');
    el = el.add('#some_element');
    assert.ok(el.hasClass('orange'), 'an element in collection has the class');

    assert.ok(!el.hasClass());
    assert.ok(!el.hasClass(''));

    var z = $('#doesnotexist');
    assert.equal(0, z.size());
    assert.ok(!z.hasClass('a'));
  });

  QUnit.test('Mob .toggleClass', function(assert) {
    var el = $('#toggle_element').removeClass();

    assert.deepEqual(el, el.toggleClass('green'));
    assert.ok(el.hasClass('green'));
    assert.ok(!el.hasClass('orange'));

    el.toggleClass('orange');
    assert.ok(el.hasClass('green'));
    assert.ok(el.hasClass('orange'));

    el.toggleClass('green');
    assert.ok(!el.hasClass('green'));
    assert.ok(el.hasClass('orange'));

    el.toggleClass('orange');
    assert.ok(!el.hasClass('green'));
    assert.ok(!el.hasClass('orange'));

    el.toggleClass('orange green');
    assert.ok(el.hasClass('orange'));
    assert.ok(el.hasClass('green'));

    el.toggleClass('orange green blue');
    assert.ok(!el.hasClass('orange'));
    assert.ok(!el.hasClass('green'));
    assert.ok(el.hasClass('blue'));

    el.removeClass();

    el.toggleClass('orange', false);
    assert.ok(!el.hasClass('orange'));
    el.toggleClass('orange', false);
    assert.ok(!el.hasClass('orange'));

    el.toggleClass('orange', true);
    assert.ok(el.hasClass('orange'));
    el.toggleClass('orange', true);
    assert.ok(el.hasClass('orange'));

    //function argument
    el.toggleClass(function(idx, classes) {
      assert.deepEqual(el.get(0), this);
      //test original classes are being passed
      assert.equal('orange', this.className);
      return 'brown';
    });
    assert.ok(el.hasClass('brown'));

    el.toggleClass(function(idx, classes) {
      return 'yellow';
    }, false);
    assert.ok(!el.hasClass('yellow'));

    el.toggleClass(function(idx, classes) {
      return 'yellow';
    }, true);
    assert.ok(el.hasClass('yellow'));

    // no/empty argument
    assert.deepEqual(el, el.toggleClass());
    assert.equal('orange brown yellow', el.get(0).className);
    assert.deepEqual(el, el.toggleClass(''));
    assert.equal('orange brown yellow', el.get(0).className);

    var svg = $('svg');
    assert.ok(!svg.hasClass('foo'));
    svg.addClass('foo bar');
    assert.ok(svg.hasClass('foo'));
    assert.ok(svg.hasClass('bar'));
    svg.removeClass('foo');
    assert.ok(!svg.hasClass('foo'));
    assert.ok(svg.hasClass('bar'));
    svg.toggleClass('bar');
    assert.ok(!svg.hasClass('foo'));
    assert.ok(!svg.hasClass('bar'));
  });

  QUnit.test('Mob .attr', function(assert) {
    assert.equal($('#BooleanInput').attr('required'), true);
    assert.equal($('#BooleanInput').attr('non_existant_attr'), undefined);
  });

  QUnit.test('Mob .ready', function(assert) {
    var arg1, arg2, arg3, arg4, fired = false;
    $(function(jQ1) {
      arg1 = jQ1;
      $(document).ready(function(jQ2) {
        arg2 = jQ2;
        $(document).on('ready', function(jQ3) {
          arg3 = jQ3;
          $(document).on('foo ready bar', function(Z4) {
            arg4 = Z4;
            fired = true;
          });
        });
      });
    });
    assert.ok(fired);
    assert.deepEqual($, arg1);
    assert.deepEqual($, arg2);
    assert.deepEqual($, arg3);
    assert.deepEqual($, arg4);
  });

  QUnit.test('Mob .slice', function(assert) {
    var $els = $('#slice_test div');
    assert.equal($els.slice().length, 3);
    assert.equal(typeof $els.slice().ready, 'function');
    assert.equal($els.slice(-1)[0].className, 'slice3');
  });

  QUnit.test('Mob .bind', function(assert) {
    var counter = 0;
    $(document.body).bind('click', function() {
      counter++;
    });
    click($('#some_element').get(0));
    assert.equal(1, counter);

    counter = 0;
    $('#some_element').bind('click mousedown', function() {
      counter++;
    });
    click($('#some_element').get(0));
    mousedown($('#some_element').get(0));
    assert.equal(3, counter);
  });

  QUnit.test('Mob .bind .', function(assert) {
    var counter = 0,
      keyCounter = 0,
      el = $('#some_element'),
      eventData = {
        click: function() {
          counter++;
        },
        keypress: function() {
          keyCounter++;
        }
      };

    $(document.body).bind(eventData);

    el.trigger('click');
    el.trigger('click');
    assert.equal(2, counter);
    el.trigger('keypress');
    assert.equal(1, keyCounter);

    $(document.body).unbind({
      keypress: eventData.keypress
    });

    el.trigger('click');
    assert.equal(3, counter);
    el.trigger('keypress');
    assert.equal(1, keyCounter);

  });

  QUnit.test('Mob .bind ..', function(assert) {

    var context, handler = function() {
      context = $(this);
    };
    $('#empty_test').bind('click', handler);
    $('#empty_test').bind('mousedown', handler);
    click($('#empty_test').get(0));
    assert.deepEqual($('#empty_test'), context);
    context = null;
    mousedown($('#empty_test').get(0));
    assert.deepEqual($('#empty_test'), context);

    var data, numArgs, counter = 0,
      handler = function(ev, arg) {
        numArgs = arguments.length,
          data = ev.data;
        counter = arg.counter;
      };

    $('#some_element').bind('custom', handler);
    $('#some_element').trigger('custom', {
      counter: 10
    });
    assert.equal(10, counter);
    assert.equal(2, numArgs);
    assert.ok(!data);

    var link = $('<a href="#"></a>'),
      prevented = false;

    link
      .appendTo('body')
      .bind('click', function() {
        return false;
      })
      .bind('click', function(e) {
        prevented = e.isDefaultPrevented();
      })
      .trigger('click');

    assert.ok(prevented);
  });

  QUnit.test('Mob CreateEventObject', function(assert) {
    var e = $.Event('custom');
    assert.equal('custom', e.type);

    var e2 = new $.Event('custom');
    assert.equal('custom', e2.type);

    var e3 = $.Event('custom', {
      customKey: 'customValue'
    });
    assert.equal('custom', e3.type);
    assert.equal('customValue', e3.customKey);

    var e4 = $.Event('custom', {
      bubbles: false
    });
    assert.ok(!e4.bubbles);

    var e5 = $.Event({
      type: 'keyup',
      keyCode: 40
    });
    assert.equal('keyup', e5.type);
    assert.equal(40, e5.keyCode);
  });

  QUnit.test('Mob .trigger', function(assert) {
    var el = $('#some_element'),
      eventType, eventCode;

    el.on('keyup', function(e) {
      eventType = e.type;
      eventCode = e.keyCode;
    });
    el.trigger({
      type: 'keyup',
      keyCode: 40
    });

    assert.equal('keyup', eventType);
    assert.equal(40, eventCode);

    var data, counter = 0,
      customEventKey = 0;

    var handler = function(ev, customData) {
      data = ev.data;
      counter = customData.counter;
      customEventKey = ev.customKey;
    };

    var customEventObject = $.Event('custom', {
      customKey: 20
    });

    $('#some_element').bind('custom', handler);
    $('#some_element').trigger(customEventObject, {
      counter: 10
    });

    assert.equal(10, counter);
    assert.equal(20, customEventKey);
    assert.ok(!data);

    var event = $.Event('custom'),
      element = $('<div/>'),
      isDefaultPrevented = false;

    assert.ok(!event.isDefaultPrevented());

    element.bind('custom', function(e) {
      e.preventDefault();
      isDefaultPrevented = e.isDefaultPrevented();
    });

    element.trigger(event);

    assert.ok(event.isDefaultPrevented());
    assert.ok(isDefaultPrevented);

    assert.ok(!$('doesnotexist').triggerHandler('submit'));

    var form = $('#trigger_handler form').get(0);
    $('#trigger_handler').bind('submit', function(e) {
      t.fail('triggerHandler shouldn\'t bubble');
    });

    var executed = [];
    $(form).bind('submit', function(e) {
      executed.push('1');
      assert.equal(form, e.target);
      return 1;
    });
    $(form).bind('submit', function(e) {
      executed.push('2');
      assert.equal(form, e.target);
      e.stopImmediatePropagation();
      return 2;
    });
    $(form).bind('submit', function(e) {
      t.fail('triggerHandler shouldn\'t continue after stopImmediatePropagation');
    });
    assert.deepEqual(2, $(form).triggerHandler('submit'));
    assert.equal('1 2', executed.join(' '));
  });

  QUnit.test('Mob .unbind', function(assert) {
    var counter = 0,
      el = $('#another_element').get(0);
    var handler = function() {
      counter++;
    };
    $('#another_element').bind('click mousedown', handler);
    click(el);
    mousedown(el);
    assert.equal(2, counter);

    $('#another_element').unbind('click', handler);
    click(el);
    assert.equal(2, counter);
    mousedown(el);
    assert.equal(3, counter);

    $('#another_element').unbind('mousedown');
    mousedown(el);
    assert.equal(3, counter);

    $('#another_element').bind('click mousedown', handler);
    click(el);
    mousedown(el);
    assert.equal(5, counter);

    $('#another_element').unbind();
    click(el);
    mousedown(el);
    assert.equal(5, counter);

    var count = 0;
    $('#namespace_test').bind('click.bar', function() {
      count++;
    });
    $('#namespace_test').bind('click.foo', function() {
      count++;
    });
    $('#namespace_test').bind('mousedown.foo.bar', function() {
      count++;
    });

    $('#namespace_test').trigger('click');
    assert.equal(2, count);

    $('#namespace_test').unbind('click.baz');
    $('#namespace_test').trigger('click');
    assert.equal(4, count);

    $('#namespace_test').unbind('click.foo');
    $('#namespace_test').trigger('click');
    assert.equal(5, count);

    $('#namespace_test').trigger('mousedown');
    assert.equal(6, count);

    $('#namespace_test').unbind('.bar');
    $('#namespace_test').trigger('click').trigger('mousedown');
    assert.equal(6, count);
  });

  QUnit.test('Mob .on', function(assert) {
    var el = $('#some_element'),
      node = el.get(0),
      ret,
      bindTriggered = 0,
      delegateTriggered = 0;

    ret = el.on('click', function(e) {
      bindTriggered++;
      assert.deepEqual(node, this);
    })
      .on({
        click: function() {
          bindTriggered++;
        }
      });
    assert.deepEqual(el, ret);

    ret = $(document.body).on('click', 'div', function(e) {
      delegateTriggered++;
      assert.deepEqual(node, this);
    })
      .on({
        click: function() {
          delegateTriggered++;
        }
      }, '*[id^=some]');
    assert.deepEqual(document.body, ret.get(0));

    click(node);
    assert.equal(2, bindTriggered, 'bind handlers');
    assert.equal(2, delegateTriggered, 'delegate handlers');

    var el = $('#some_element');

    el.on('click', function() {
      assert.ok(true, 'should have been called');
      return false;
    });
    $(document.body).on('click', function() {
      assert.ok(!true, 'the event should have been stopped');
    });

    click(el.get(0));

  });

  QUnit.test('Mob .off', function(assert) {
    var el = $('#some_element'),
      bindTriggered = 0,
      delegateTriggered = 0,
      handler = function() {
        bindTriggered++;
      };

    el.bind('click', handler).bind('click', function() {
      bindTriggered++;
    });

    click(el.get(0));
    assert.equal(2, bindTriggered, 'bind handlers before unbind');

    el.off('click', handler);
    $(document.body).off('click', '#some_element');

    click(el.get(0));
    assert.equal(3, bindTriggered, 'bind handlers');
  });

  QUnit.test('Mob .one', function(assert) {
    var counter = 0,
      context, received, el = $('#some_element');
    $(document.body).one('click', function(e, arg, more) {
      context = this;
      counter++;
      received = arg + more;
      assert.ok('preventDefault' in e);
      return false;
    });

    var evt = $.Event('click');
    el.trigger(evt, ['one', 'two']);
    assert.equal(1, counter);
    assert.equal('onetwo', received);
    assert.deepEqual(document.body, context);
    assert.ok(evt.isDefaultPrevented());

    el.trigger('click');
    assert.equal(1, counter, 'the event handler didn\'t unbind itself');

    var counter = 0,
      el = $('#some_element');
    $(document.body).one({
      click: function() {
        counter++;
      },
      custom: function() {
        counter--;
      }
    });

    el.trigger('click');
    assert.equal(1, counter);
    el.trigger('click');
    assert.equal(1, counter);

    el.trigger('custom');
    assert.equal(0, counter);
    el.trigger('custom');
    assert.equal(0, counter);
  });

  QUnit.test('Mob CustomEvents', function(assert) {
    var el = $(document.body);

    el.bind('custom', function(evt, a, b) {
      assert.equal(a, 1);
      assert.equal(b, 2);
      el.unbind();
    });
    el.trigger('custom', [1, 2]);

    el.bind('custom', function(evt, a) {
      assert.equal(a, 1);
      el.unbind();
    });
    el.trigger('custom', 1);

    var eventData = {
      z: 1
    };
    el.bind('custom', function(evt, a) {
      assert.deepEqual(a, eventData);
      el.unbind();
    });
    el.trigger('custom', eventData);
  });

  QUnit.test('Mob SpecialEvent', function(assert) {
    var clickEvent = $.Event('click'),
      mouseDownEvent = $.Event('mousedown'),
      mouseUpEvent = $.Event('mouseup'),
      mouseMoveEvent = $.Event('mousemove'),
      submitEvent = $.Event('submit');

    assert.deepEqual(MouseEvent, clickEvent.constructor);
    assert.deepEqual(MouseEvent, mouseDownEvent.constructor);
    assert.deepEqual(MouseEvent, mouseUpEvent.constructor);
    assert.deepEqual(MouseEvent, mouseMoveEvent.constructor);
    assert.deepEqual(Event, submitEvent.constructor);
  });

})();