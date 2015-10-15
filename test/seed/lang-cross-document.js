(function() {

  QUnit.module('mob/lang/cross-document');

  var iframe = document.createElement('iframe');
  iframe.frameBorder = iframe.height = iframe.width = 0;
  document.body.appendChild(iframe);
  var iDoc = (iDoc = iframe.contentDocument || iframe.contentWindow).document || iDoc;
  iDoc.write(
    [
      '<script>',
      'parent.iElement = document.createElement("div");',
      'parent.iArguments = (function(){ return arguments; })(1, 2, 3);',
      'parent.iArray = [1, 2, 3];',
      'parent.iString = new String("hello");',
      'parent.iNumber = new Number(100);',
      'parent.iFunction = (function(){});',
      'parent.iDate = new Date();',
      'parent.iRegExp = /hi/;',
      'parent.iNaN = NaN;',
      'parent.iNull = null;',
      'parent.iBoolean = new Boolean(false);',
      'parent.iUndefined = undefined;',
      'parent.iObject = {};',
      'parent.iError = new Error();',
      '</script>'
    ].join('\n')
  );
  iDoc.close();

  QUnit.test('Mob .isEmpty', function(assert) {
    assert.ok(!Mob.isEmpty(iArray), '[] is empty');
    assert.ok(Mob.isEmpty(iObject), '{} is empty');
  });

  QUnit.test('Mob .isElement', function(assert) {
    assert.ok(!Mob.isElement('div'), 'strings are not dom elements');
    assert.ok(Mob.isElement(document.body), 'the body tag is a DOM element');
    assert.ok(Mob.isElement(iElement), 'even from another frame');
  });

  QUnit.test('Mob .isArguments', function(assert) {
    assert.ok(Mob.isArguments(iArguments), 'even from another frame');
  });

  QUnit.test('Mob .isObject', function(assert) {
    assert.ok(Mob.isObject(iElement), 'even from another frame');
    assert.ok(Mob.isObject(iFunction), 'even from another frame');
  });

  QUnit.test('Mob .isArray', function(assert) {
    assert.ok(Mob.isArray(iArray), 'even from another frame');
  });

  QUnit.test('Mob .isString', function(assert) {
    assert.ok(Mob.isString(iString), 'even from another frame');
  });

  QUnit.test('Mob .isNumber', function(assert) {
    assert.ok(Mob.isNumber(iNumber), 'even from another frame');
  });

  QUnit.test('Mob .isBoolean', function(assert) {
    assert.ok(Mob.isBoolean(iBoolean), 'even from another frame');
  });

  QUnit.test('Mob .isFunction', function(assert) {
    assert.ok(Mob.isFunction(iFunction), 'even from another frame');
  });

  QUnit.test('Mob .isDate', function(assert) {
    assert.ok(Mob.isDate(iDate), 'even from another frame');
  });

  QUnit.test('Mob .isRegExp', function(assert) {
    assert.ok(Mob.isRegExp(iRegExp), 'even from another frame');
  });

  QUnit.test('Mob .isNaN', function(assert) {
    assert.ok(Mob.isNaN(iNaN), 'even from another frame');
  });

  QUnit.test('Mob .isNull', function(assert) {
    assert.ok(Mob.isNull(iNull), 'even from another frame');
  });

  QUnit.test('Mob .isUndefined', function(assert) {
    assert.ok(Mob.isUndefined(iUndefined), 'even from another frame');
  });

  QUnit.test('Mob .isError', function(assert) {
    assert.ok(Mob.isError(iError), 'even from another frame');
  });

  if (typeof ActiveXObject != 'undefined') {
    QUnit.test('Mob .IE host objects', function(assert) {
      var xml = new ActiveXObject('Msxml2.DOMDocument.3.0');
      assert.ok(!Mob.isNumber(xml));
      assert.ok(!Mob.isBoolean(xml));
      assert.ok(!Mob.isNaN(xml));
      assert.ok(!Mob.isFunction(xml));
      assert.ok(!Mob.isNull(xml));
      assert.ok(!Mob.isUndefined(xml));
    });

    QUnit.test('Mob .#1621 IE 11 compat mode DOM elements are not functions', function(assert) {
      var fn = function() {};
      var xml = new ActiveXObject('Msxml2.DOMDocument.3.0');
      var div = document.createElement('div');

      // JIT the function
      var count = 200;
      while (count--) {
        Mob.isFunction(fn);
      }

      assert.equal(Mob.isFunction(xml), false);
      assert.equal(Mob.isFunction(div), false);
      assert.equal(Mob.isFunction(fn), true);
    });
  }

})();