define('mob/http', function(require, exports, module) {

  var lang = require('mob/lang');
  var Error = require('mob/error');

  var isFunction = lang.isFunction;

  var makeErrorByStatus = function(statusCode, content) {
    var MAX_LENGTH = 500;

    var truncate = function(str, length) {
      return str.length > length ? str.slice(0, length) + '...' : str;
    };

    var contentToCheck = lang.isString(content) ? content : content.toString();

    var message = 'failed [' + statusCode + ']';

    if (contentToCheck) {
      message += ' ' + truncate(contentToCheck.replace(/\n/g, ' '), MAX_LENGTH);
    }

    return new Error(message);
  };

  var populateData = function(response) {
    // Read Content-Type header, up to a ';' if there is one.
    // A typical header might be "application/json; charset=utf-8"
    // or just "application/json".
    var contentType = (response.headers['content-type'] || ';').split(';')[0];

    // Only try to parse data as JSON if server sets correct content type.
    if (lang.contains(['application/json', 'text/javascript', 'application/javascript', 'application/x-javascript'], contentType)) {
      try {
        response.data = JSON.parse(response.content);
      } catch (err) {
        response.data = null;
      }
    } else {
      response.data = null;
    }
  };

  var HTTP = {};

  HTTP.call = function(method, url, options, callback) {

    // support (method, url, callback) argument list
    if (!callback && isFunction(options)) {
      callback = options;
      options = null;
    }

    options = options || {};

    if (isFunction(callback)) {
      throw new Error('Can not make a blocking HTTP call from the client; callback required.');
    }

    method = (method || '').toUpperCase();

    var headers = {};

    var content = options.content;
    if (options.data) {
      content = JSON.stringify(options.data);
      headers['Content-Type'] = 'application/json';
    }

    var paramsForUrl, paramsForBody;
    if (content || method === 'GET' || method === 'HEAD') {
      paramsForUrl = options.params;
    } else {
      paramsForBody = options.params;
    }

    url = lang.constructUrl(url, options.query, paramsForUrl);

    var username, password, auth = options.auth;
    if (auth) {
      var colonLoc = auth.indexOf(':');
      if (colonLoc < 0) {
        throw new Error('auth option should be of the form "username:password"');
      }
      username = auth.substring(0, colonLoc);
      password = auth.substring(colonLoc + 1);
    }

    if (paramsForBody) {
      content = lang.encodeUrlParams(paramsForBody);
    }

    lang.extend(headers, options.headers || {});

    // wrap callback to add a 'response' property on an error, in case
    // we have both (http 4xx/5xx error, which has a response payload)
    callback = (function(callback) {
      return function(error, response) {
        if (error && response) {
          error.response = response;
        }
        callback(error, response);
      };
    })(callback);

    callback = lang.once(callback);

    try {
      var xhr = new XMLHttpRequest();

      xhr.open(method, url, true, username, password);

      for (var k in headers) {
        xhr.setRequestHeader(k, headers[k]);
      }

      var timedOut = false;
      var timer;
      if (options.timeout) {
        timer = setTimeout(function() {
          timedOut = true;
          xhr.abort();
        }, options.timeout);
      }

      // callback on complete
      xhr.onreadystatechange = function(evt) {
        if (xhr.readyState === 4) { // COMPLETE

          if (timer) {
            clearTimeout(timer);
          }

          if (timedOut) {
            callback(new Error('timeout'));
          } else if (!xhr.status) {
            // no HTTP response
            callback(new Error('network'));
          } else {

            var response = {};
            response.statusCode = xhr.status;
            response.content = xhr.responseText;

            response.headers = {};
            var headerStr = xhr.getAllResponseHeaders();

            if ('' === headerStr && xhr.getResponseHeader('content-type')) {
              headerStr = 'content-type: ' + xhr.getResponseHeader('content-type');
            }

            var headersRaw = headerStr.split(/\r?\n/);
            lang.each(headersRaw, function(h) {
              var m = /^(.*?):(?:\s+)(.*)$/.exec(h);
              if (m && m.length === 3)
                response.headers[m[1].toLowerCase()] = m[2];
            });

            populateData(response);

            var error = null;
            if (response.statusCode >= 400) {
              error = makeErrorByStatus(response.statusCode, response.content);
            }

            callback(error, response);
          }
        }
      };

      // Allow custom control over XHR and abort early.
      if (options.beforeSend) {
        var beforeSend = lang.once(options.beforeSend);

        // Call the callback and check to see if the request was aborted
        if (false === beforeSend.call(null, xhr, options)) {
          return xhr.abort();
        }
      }

      xhr.send(content);

    } catch (err) {
      callback(err);
    }

  };

  HTTP.get = function( /* url, callOptions, asyncCallback */ ) {
    return HTTP.call.apply(this, ['GET'].concat(lang.toArray(arguments)));
  };

  HTTP.post = function( /* url, callOptions, asyncCallback */ ) {
    return HTTP.call.apply(this, ['POST'].concat(lang.toArray(arguments)));
  };

  HTTP.put = function( /* url, callOptions, asyncCallback */ ) {
    return HTTP.call.apply(this, ['PUT'].concat(lang.toArray(arguments)));
  };

  HTTP.del = function( /* url, callOptions, asyncCallback */ ) {
    return HTTP.call.apply(this, ['DELETE'].concat(lang.toArray(arguments)));
  };

  module.exports = HTTP;

});