(function() {

  QUnit.module('mob/http');

  var XHR_URL_PREFIX = '/MobJS/test/assets';

  QUnit.asyncTest('http', function(assert) {

    var basic_get = function(url, options, expected_url) {

      Mob.HTTP.request('GET', XHR_URL_PREFIX + url, options, function(error, result) {

        assert.ok(!error);

        if (!error) {
          assert.equal(typeof result, 'object');
          assert.equal(result.statusCode, 200);

          var data = result.data;

          var allowed = [expected_url];
          if (expected_url.slice(-1) === '?') {
            allowed.push(expected_url.slice(0, -1));
          }

          assert.ok(Mob.contains(allowed, expected_url));
        }

      });

    };

    basic_get('/foo', null, '/foo');
    basic_get('/foo?', null, '/foo?');
    basic_get('/foo?a=b', null, '/foo?a=b');
    basic_get('/foo', {
      params: {
        fruit: 'apple'
      }
    }, '/foo?fruit=apple');
    basic_get('/foo', {
      params: {
        fruit: 'apple',
        dog: 'Spot the dog'
      }
    }, '/foo?fruit=apple&dog=Spot+the+dog');
    basic_get('/foo?', {
      params: {
        fruit: 'apple',
        dog: 'Spot the dog'
      }
    }, '/foo?fruit=apple&dog=Spot+the+dog');
    basic_get('/foo?bar', {
      params: {
        fruit: 'apple',
        dog: 'Spot the dog'
      }
    }, '/foo?bar&fruit=apple&dog=Spot+the+dog');
    basic_get('/foo?bar', {
      params: {
        fruit: 'apple',
        dog: 'Spot the dog'
      },
      query: 'baz'
    }, '/foo?baz&fruit=apple&dog=Spot+the+dog');
    basic_get('/foo', {
      params: {
        fruit: 'apple',
        dog: 'Spot the dog'
      },
      query: 'baz'
    }, '/foo?baz&fruit=apple&dog=Spot+the+dog');
    basic_get('/foo?', {
      params: {
        fruit: 'apple',
        dog: 'Spot the dog'
      },
      query: 'baz'
    }, '/foo?baz&fruit=apple&dog=Spot+the+dog');
    basic_get('/foo?bar', {
      query: ''
    }, '/foo?');
    basic_get('/foo?bar', {
      params: {
        fruit: 'apple',
        dog: 'Spot the dog'
      },
      query: ''
    }, '/foo?fruit=apple&dog=Spot+the+dog');

    var unknownServerCallback = function(error, result) {
      assert.ok(error);
      assert.ok(!result);
      assert.ok(!error.response);
    };

    Mob.HTTP.request('GET', 'http://0.0.0.0/', unknownServerCallback);

    var error404Callback = function(error, result) {
      assert.ok(error);
      assert.ok(error.message.indexOf('404') !== -1);
      assert.ok(error.message.indexOf(error.response.content.substring(0, 10)) !== -1);
      assert.ok(result);
      assert.ok(error.response);
      assert.deepEqual(result, error.response);
      assert.equal(error.response.statusCode, 404);
      assert.ok(error.message.length < 404);
    };

    Mob.HTTP.request('GET', XHR_URL_PREFIX + '/fail', error404Callback);

    var fired = false;
    var bSend = function(xhr){
      assert.ok(!fired);
      fired = true;
      assert.ok(xhr instanceof XMLHttpRequest);
    };

    Mob.HTTP.get(XHR_URL_PREFIX + "/", {beforeSend: bSend}, function () {
      assert.ok(fired);
    });

  });

})();