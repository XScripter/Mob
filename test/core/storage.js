(function() {

  var store_type = 'memory';
  var store, store_attributes, other_store;

  QUnit.module('mob/storage/memory', {

    beforeEach: function() {
      store_attributes = {
        name: 'test_store',
        type: store_type
      };
      store = new Mob.Storage(store_attributes);

      other_store = new Mob.Storage({
        name: 'other_test_store',
        type: store_type
      });
      store.clearAll();
      other_store.clearAll();
    }

  });

  QUnit.test('Mob sets the store type', function(assert) {
    assert.equal(store.type, store_type);
    assert.equal(store.name, 'test_store');
  });

  QUnit.test('Mob checks if a key exists', function(assert) {
    assert.equal(store.exists('foo'), false);
    store.set('foo', 'bar');
    assert.equal(store.exists('foo'), true);
    assert.equal(other_store.exists('foo'), false);
  });

  QUnit.test('Mob sets and retrieves the value as a string', function(assert) {
    store.set('foo', 'bar');
    assert.equal(store.get('foo'), 'bar');
    assert.ok(!other_store.get('foo'));
  });

  QUnit.test('Mob sets and retrieves the value as JSON', function(assert) {
    var obj = {'obj': 'is json'};
    assert.equal(store.set('foo', obj), obj);
    assert.equal(store.get('foo').obj, 'is json');
  });

  QUnit.test('Mob stores in global space accessible by name', function(assert) {
    store.set('foo', 'bar');
    var new_store = new Mob.Storage(store_attributes);
    assert.equal(new_store.get('foo'), 'bar');
  });

  QUnit.test('Mob clear the value', function(assert) {
    store.set('foo', 'bar');
    other_store.set('foo', 'bar');
    store.clear('foo');
    assert.equal(store.exists('foo'), false);
    assert.equal(other_store.exists('foo'), true);
  });

  QUnit.test('Mob returns a list of keys', function(assert) {
    store.set('foo', 'bar');
    store.set('blurgh', {boosh: 'blurgh'});
    store.set(123, {boosh: 'blurgh'});
    assert.deepEqual(store.keys(), ['foo', 'blurgh', '123']);
    assert.deepEqual(other_store.keys(), []);
  });

  QUnit.test('Mob iterates over keys and values', function(assert) {
    var keys = [], values = [];
    store.set('foo', 'bar');
    store.set('blurgh', {boosh: 'blurgh'});
    store.each(function(key, value) {
      keys.push(key);
      values.push(value);
    });
    assert.deepEqual(keys, ['foo', 'blurgh']);
    assert.deepEqual(values, ['bar', {boosh: 'blurgh'}]);

  });

  QUnit.test('Mob clears all values', function(assert) {
    store.set('foo', 'bar');
    store.set('blurgh', {boosh: 'blurgh'});
    store.set(123, {boosh: 'blurgh'});
    assert.equal(store.keys().length, 3);
    store.clearAll();
    assert.equal(store.keys().length, 0);
    assert.equal(store.exists('blurgh'), false);

  });

  QUnit.test('Mob fetches a value or runs the callback', function(assert) {
    assert.ok(!store.get('foo'));

    store.fetch('foo', function() {
      return 'bar';
    });

    assert.equal(store.get('foo'), 'bar');
    assert.equal(store.fetch('foo', function() {
      return 'baz';
    }), 'bar');
    assert.equal(store.get('foo'), 'bar');

  });

})();