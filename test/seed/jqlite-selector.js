(function() {

  var $ = Mob.$;

  QUnit.module('mob/jqlite/selector');

  QUnit.test('Mob first', function(assert) {
    var li = $('#fixtures-selector #list li:first');
    assert.equal(1, li.size());
    assert.equal('one', li.text());
    assert.equal('two', $('#fixtures-selector #list li:eq(1)').text());
  });

  QUnit.test('Mob last', function(assert) {
    var li = $('#fixtures-selector #list li:last');
    assert.equal(1, li.size());
    assert.equal('two', li.text());
  });

  QUnit.test('Mob parent', function(assert) {
    var list = $('#fixtures-selector #list li:parent');
    assert.equal(1, list.size());
    assert.equal('list', list.attr('id'));
  });

  QUnit.test('Mob contains', function(assert) {
    assert.equal('two', $('#fixtures-selector #list li:contains("two")').text());
  });

  QUnit.test('Mob visibility', function(assert) {
    assert.equal('vis', $('#fixtures-selector .visibility:visible').attr('id'));
    assert.equal('invis', $('#fixtures-selector .visibility:hidden').attr('id'));
  });

  QUnit.test('Mob child', function(assert) {
    var items = $('#fixtures-selector #child').find('> li'),
      results = items.map(function() {
        return $(this).find('> span').text();
      }).get();

    assert.equal('child1 child2', results.join(' '));
    assert.equal('test', $('#fixtures-selector #child').prop('class'));
  });

  QUnit.test('Mob childHas', function(assert) {
    var items = $('#fixtures-selector #child').find('> li:has(ul)'),
      results = items.map(function() {
        return $(this).find('> span').text();
      }).get();

    assert.equal('child2', results.join(' '));
  });

  QUnit.test('Mob emptyHref', function(assert) {
    var result, el = $('<div><a href="#">one</a><a href="#">two</a></div>');
    result = el.find('a[href=#]');
    assert.equal('one two', result.map(function() {
      return $(this).text();
    }).get().join(' '));
  });

})();