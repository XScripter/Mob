(function() {

  QUnit.module('mob/jqlite/data', {

    beforeEach: function() {
      $('*').unbind();
    }

  });

  var $ = Mob.$;

  QUnit.test('Mob testEmptyCollection', function(assert) {
    var el = $('#fixtures-data #does_not_exist');
    assert.equal(undefined, el.data('one'));
  });

  QUnit.test('Mob testAttributeDoesNotExist', function(assert) {
    var el = $('#fixtures-data #data_attr');
    assert.equal(undefined, el.data('missing'));
  });

  QUnit.test('Mob testReadingAttribute', function(assert) {
    var el = $('#fixtures-data #data_attr');
    assert.equal('uno', el.data('one'));
  });

  QUnit.test('Mob testCamelized', function(assert) {
    var el = $('#fixtures-data #data_attr');
    assert.equal('baz', el.data('foo-bar'));
    assert.equal('baz', el.data('fooBar'));

    el.data('fooBar', 'bam');
    assert.equal('bam', el.data('foo-bar'));
    assert.equal('bam', el.data('fooBar'));

    el.data('a-b', 'c');
    assert.equal('c', el.data().aB);
    assert.equal(undefined, el.data()['a-b']);
  });

  QUnit.test('Mob testUnderscore', function(assert) {
    var el = $('#fixtures-data #data_attr');
    assert.equal('kuuq', el.data('under_score'));
    assert.equal(undefined, el.data('under-score'));
    assert.equal(undefined, el.data('underScore'));
  });

  QUnit.test('Mob testNotChangingAttribute', function(assert) {
    var el = $('#fixtures-data #data_attr');
    assert.equal('due', el.data('two'));
    el.data('two', 'changed');
    assert.equal('due', el.attr('data-two'));
  });

  QUnit.test('Mob testExtendedData', function(assert) {
    var els = $('#fixtures-data #data_attr'),
      els2 = $('#fixtures-data #data_attr'),
      obj = {
        a: 'A',
        b: 'B'
      };

    els.data('obj', obj);
    assert.deepEqual(obj, els.data('obj'));
    assert.deepEqual(obj, els2.data('obj'));

    els2.data('els', els);
    assert.deepEqual(els, els.data('els'));
  });

  QUnit.test('Mob testMultipleElements', function(assert) {
    var items = $('#fixtures-data #data_list li');

    items.data('each', 'mark');

    var values = items.map(function() {
      return $(this).data('each')
    }).get();
    assert.equal('mark, mark', values.join(', '));
  });

  QUnit.test('Mob testFunctionArg', function(assert) {
    var els = $('#fixtures-data #data_attr');

    var data = "hello";

    els.data("addio", function() {
      data = "goodbye";
    });

    assert.equal('hello', data);

    els.data("addio")();

    assert.equal('goodbye', data);
  });

  QUnit.test('Mob testAllData', function(assert) {
    var el = $('#fixtures-data #data_full');

    el.data().samurai = 7;
    el.data('one', 'ichi').data('two', 'ni');
    el.data('person', {
      name: 'Kurosawa'
    });

    var all = el.data();
    assert.equal(7, all.samurai);
    assert.equal('ichi', all.one);
    assert.equal('ni', all.two);
    assert.equal('Kurosawa', all.person.name);
  });

  QUnit.test('Mob testInitialDataFromAttributes', function(assert) {
    var el = $('<div data-foo=bar data-foo-bar=baz data-empty data-num=42 />'),
      store = el.data();

    assert.equal('bar', store.foo);
    assert.equal('baz', store.fooBar);
    assert.equal(undefined, store['foo-bar']);
    assert.equal('', store.empty);
    assert.equal(42, store.num);
  });

  QUnit.test('Mob testGettingBlanks', function(assert) {
    var el = $('#fixtures-data #data_attr'),
      store = el.data();

    store.nil = null;
    store.undef = undefined;
    store.blank = '';
    store.bool = false;

    assert.equal(null, el.data('nil'));
    assert.equal(undefined, el.data('undef'));
    assert.equal('', el.data('blank'));
    assert.equal(false, el.data('bool'));
  });

  QUnit.test('Mob testRemoveData', function(assert) {
    var el = $('<div data-foo=bar />');

    el.data('foo', 'bam').data('bar', 'baz');
    el.removeData('foo').removeData('bar');
    assert.equal('bar', el.data('foo'));
    assert.equal(undefined, el.data('bar'));

    el.data('uno', 'one').data('due', 'two');
    el.removeData('uno due');
    assert.equal(undefined, el.data('uno'));
    assert.equal(undefined, el.data('due'));

    el.data('one', 1).data('twoThree', 23);
    el.removeData(['one', 'two-three']);
    assert.equal(undefined, el.data('one'));
    assert.equal(undefined, el.data('twoThree'));
  });

  QUnit.test('Mob testRemoveAllData', function(assert) {
    var el = $('<div data-attr-test=val />');

    el.data('one', {
      foo: 'bar'
    });
    el.data('two', 'two').data('three', 3);
    el.removeData();

    assert.equal('val', el.data('attrTest'));
    assert.equal(undefined, el.data('one'));
    assert.equal(undefined, el.data('two'));
    assert.equal(undefined, el.data('three'));
  });

  QUnit.test('Mob testRemoveDataNoop', function(assert) {
    var empty = $(),
      vanilla = $('<div />');

    assert.deepEqual(empty, empty.removeData('foo'));
    assert.deepEqual(vanilla, vanilla.removeData('foo'));
  });

  QUnit.test('Mob testRemoveDataOnElementRemoval', function(assert) {
    var el = $('<div data-attr-test=val />'),
      childEl = $('<span />').appendTo(el),
      elData = {
        foo: 'bar'
      };

    el.data('test', elData);
    childEl.data('test', 1);

    el.remove();
    assert.equal('val', el.data('attrTest'));
    assert.equal(undefined, el.data('test'));
    assert.equal(undefined, childEl.data('test'));
  });

  QUnit.test('Mob testRemoveDataOnElementEmpty', function(assert) {
    var el = $('<div data-attr-test=val />'),
      childEl = $('<span />').appendTo(el),
      elData = {
        foo: 'bar'
      };

    el.data('test', elData);
    childEl.data('test', 1);

    el.empty();
    assert.equal('val', el.data('attrTest'));
    assert.deepEqual(elData, el.data('test'));
    assert.equal(undefined, childEl.data('test'));
  });

  QUnit.test('Mob testRemoveDataOnElementReplacement', function(assert) {
    var el = $('<div data-attr-test=val />'),
      childEl = $('<span />').appendTo(el),
      elData = {
        foo: 'bar'
      };

    el.data('test', elData);
    childEl.data('test', 1);

    el.replaceWith('<div />');
    assert.equal('val', el.data('attrTest'));
    assert.equal(undefined, el.data('test'));
    assert.equal(undefined, childEl.data('test'));
  });

  QUnit.test('Mob testRemoveDataOnElementReplacementHtml', function(assert) {
    var el = $('<div data-attr-test=val />'),
      childEl = $('<span />').appendTo(el),
      wrapper = $('<div />'),
      elData = {
        foo: 'bar'
      };

    el.wrap(wrapper).data('test', elData);
    childEl.data('test', 1);

    wrapper.html('<b>New content</b>');
    assert.equal('val', el.data('attrTest'));
    assert.equal(undefined, el.data('test'));
    assert.equal(undefined, childEl.data('test'));
  });

  QUnit.test('Mob testKeepDataOnElementDetach', function(assert) {
    var el = $('<div data-attr-test=val />'),
      childEl = $('<span />').appendTo(el),
      elData = {
        foo: 'bar'
      };

    el.data('test', elData);
    childEl.data('test', 1);

    el.detach();
    assert.equal('val', el.data('attrTest'));
  });

  QUnit.test('Mob testSettingDataWithObj', function(assert) {
    var el = $('#fixtures-data #data_obj');

    el.data({
      'foo': 'bar',
      'answer': 42,
      'color': 'blue'
    });

    var all = el.data();

    assert.equal(all.answer, 42);
    assert.equal(all.color, 'blue');
    assert.equal(all.foo, 'bar');

    el.data('foo', 'baz');

    assert.equal(all.foo, 'baz');
    assert.equal(all.answer, 42)
  });

  QUnit.test('Mob testSettingDataWithObjOnManyElements', function(assert) {
    var items = $('#fixtures-data #data_list2 li');

    items.data({
      'foo': 'bar',
      'answer': 42,
      'color': 'purple'
    });

    var values = items.map(function() {
      return $(this).data('foo');
    }).get();
    assert.equal('bar, bar', values.join(', '));

    var values2 = items.map(function() {
      return $(this).data('answer');
    }).get();
    assert.equal('42, 42', values2.join(', '));
  });

  QUnit.test('Mob testSettingDataOnObjectWithoutAttributes', function(assert) {
    var el = $(window);

    assert.equal(undefined, el.data('foo'));
    el.data('foo', 'bar');
    assert.equal(el.data('foo'), 'bar');
  });

})();