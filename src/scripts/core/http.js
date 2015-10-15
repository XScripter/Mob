define('mob/http', function(require, exports, module) {

  var lang = require('mob/lang');
  var $ = require('mob/jqlite');

  var HTTP = {};

  var document = window.document,
    key,
    name,
    scriptTypeRE = /^(?:text|application)\/javascript/i,
    xmlTypeRE = /^(?:text|application)\/xml/i,
    jsonType = 'application/json',
    htmlType = 'text/html',
    blankRE = /^\s*$/,
    originAnchor = document.createElement('a');

  originAnchor.href = window.location.href;

  // trigger a custom event and return false if it was cancelled
  function triggerAndReturn(context, eventName, data) {
    var event = $.Event(eventName);
    $(context).trigger(event, data);
    return !event.isDefaultPrevented();
  }

  // trigger an Ajax 'global' event
  function triggerGlobal(settings, context, eventName, data) {
    if (settings.global) {
      return triggerAndReturn(context || document, eventName, data);
    }
  }

  // Number of active Ajax requests
  HTTP.active = 0;

  function ajaxStart(settings) {
    if (settings.global && HTTP.active++ === 0) {
      triggerGlobal(settings, null, 'ajaxStart');
    }
  }

  function ajaxStop(settings) {
    if (settings.global && !(--HTTP.active)) {
      triggerGlobal(settings, null, 'ajaxStop');
    }
  }

  // triggers an extra global event 'ajaxBeforeSend' that's like 'ajaxSend' but cancelable
  function ajaxBeforeSend(xhr, settings) {
    var context = settings.context;

    if (settings.beforeSend.call(context, xhr, settings) === false ||
      triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false) {
      return false;
    }

    triggerGlobal(settings, context, 'ajaxSend', [xhr, settings]);
  }

  function ajaxSuccess(data, xhr, settings) {
    var context = settings.context,
      status = 'success';
    settings.success.call(context, data, status, xhr);
    triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data]);
    ajaxComplete(status, xhr, settings);
  }

  // type: 'timeout', 'error', 'abort', 'parsererror'
  function ajaxError(error, type, xhr, settings) {
    var context = settings.context;
    settings.error.call(context, xhr, type, error);
    triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type]);
    ajaxComplete(type, xhr, settings);
  }

  // status: 'success', 'notmodified', 'error', 'timeout', 'abort', 'parsererror'
  function ajaxComplete(status, xhr, settings) {
    var context = settings.context;
    settings.complete.call(context, xhr, status);
    triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings]);
    ajaxStop(settings);
  }

  function mimeToDataType(mime) {
    if (mime) {
      mime = mime.split(';', 2)[0];
    }
    return mime && (mime == htmlType ? 'html' :
        mime == jsonType ? 'json' :
          scriptTypeRE.test(mime) ? 'script' :
          xmlTypeRE.test(mime) && 'xml') || 'text';
  }

  function appendQuery(url, query) {
    if (query == '') {
      return url;
    }
    return (url + '&' + query).replace(/[&?]{1,2}/, '?');
  }

  // serialize payload and append it to the URL for GET requests
  function serializeData(options) {
    if (options.processData && options.data && !lang.isString(options.data)) {
      options.data = param(options.data, options.traditional);
    }
    if (options.data && (!options.type || options.type.toUpperCase() == 'GET')) {
      options.url = appendQuery(options.url, options.data);
      options.data = undefined;
    }
  }

  var escape = encodeURIComponent;

  function serialize(params, obj, traditional, scope) {
    var array = lang.isArray(obj),
      hash = lang.isPlainObject(obj);

    lang.each(obj, function(value, key) {

      if (scope) {
        key = traditional ? scope : scope + '[' + (hash || lang.isObject(value) || lang.isArray(value) ? key : '') + ']';
      }
      // handle data in serializeArray() format
      if (!scope && array) {
        params.add(value.name, value.value);
      } else if (lang.isArray(value) || (!traditional && lang.isObject(value))) {
        serialize(params, value, traditional, key);
      } else {
        params.add(key, value);
      }
    });
  }

  var param = function(obj, traditional) {
    var params = [];
    params.add = function(key, value) {
      if (lang.isFunction(value)) {
        value = value();
      }
      if (value == null) {
        value = '';
      }
      this.push(escape(key) + '=' + escape(value));
    };
    serialize(params, obj, traditional);
    return params.join('&').replace(/%20/g, '+');
  };

  HTTP.ajaxSettings = {
    // Default type of request
    type: 'GET',
    // Callback that is executed before request
    beforeSend: lang.noop,
    // Callback that is executed if the request succeeds
    success: lang.noop,
    // Callback that is executed the the server drops error
    error: lang.noop,
    // Callback that is executed on request complete (both: error and success)
    complete: lang.noop,
    // The context for the callbacks
    context: null,
    // Whether to trigger 'global' Ajax events
    global: true,
    // Transport
    xhr: function() {
      return new window.XMLHttpRequest()
    },
    // MIME types mapping
    // IIS returns Javascript as 'application/x-javascript'
    accepts: {
      script: 'text/javascript, application/javascript, application/x-javascript',
      json: jsonType,
      xml: 'application/xml, text/xml',
      html: htmlType,
      text: 'text/plain'
    },
    // Whether the request is to another domain
    crossDomain: false,
    // Default timeout
    timeout: 0,
    // Whether data should be serialized to string
    processData: true,
    // Whether the browser should be allowed to cache GET responses
    cache: true
  };

  HTTP.ajax = function(options) {
    var settings = lang.extend({}, options || {}),
      urlAnchor;
    for (key in HTTP.ajaxSettings) {
      if (settings[key] === undefined) {
        settings[key] = HTTP.ajaxSettings[key];
      }
    }

    ajaxStart(settings);

    if (!settings.crossDomain) {
      urlAnchor = document.createElement('a');
      urlAnchor.href = settings.url;
      urlAnchor.href = urlAnchor.href;
      settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host);
    }

    if (!settings.url) {
      settings.url = window.location.toString();
    }

    serializeData(settings);

    var dataType = settings.dataType;

    if (settings.cache === false || (
        (!options || options.cache !== true) &&
        ('script' == dataType || 'jsonp' == dataType)
      )) {
      settings.url = appendQuery(settings.url, '_=' + Date.now());
    }

    var mime = settings.accepts[dataType],
      headers = {},
      setHeader = function(name, value) {
        headers[name.toLowerCase()] = [name, value];
      },
      protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
      xhr = settings.xhr(),
      nativeSetHeader = xhr.setRequestHeader,
      abortTimeout;

    if (!settings.crossDomain) {
      setHeader('X-Requested-With', 'XMLHttpRequest');
    }
    setHeader('Accept', mime || '*/*');
    if (mime = settings.mimeType || mime) {
      if (mime.indexOf(',') > -1) {
        mime = mime.split(',', 2)[0];
      }
      xhr.overrideMimeType && xhr.overrideMimeType(mime);
    }
    if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET')) {
      setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded');
    }

    if (settings.headers) {
      for (name in settings.headers) {
        setHeader(name, settings.headers[name]);
      }
    }
    xhr.setRequestHeader = setHeader;

    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        xhr.onreadystatechange = lang.noop;
        clearTimeout(abortTimeout);
        var result, error = false;
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
          dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'));
          result = xhr.responseText;

          try {
            // http://perfectionkills.com/global-eval-what-are-the-options/
            if (dataType == 'script') {
              (1, eval)(result);
            } else if (dataType == 'xml') {
              result = xhr.responseXML;
            } else if (dataType == 'json') {
              result = blankRE.test(result) ? null : JSON.parse(result);
            }
          } catch (e) {
            error = e;
          }

          if (error) {
            ajaxError(error, 'parsererror', xhr, settings);
          } else {
            ajaxSuccess(result, xhr, settings);
          }
        } else {
          ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings);
        }
      }
    };

    if (ajaxBeforeSend(xhr, settings) === false) {
      xhr.abort();
      ajaxError(null, 'abort', xhr, settings);
      return xhr;
    }

    if (settings.xhrFields) {
      for (name in settings.xhrFields) {
        xhr[name] = settings.xhrFields[name];
      }
    }

    var async = 'async' in settings ? settings.async : true;
    xhr.open(settings.type, settings.url, async, settings.username, settings.password);

    for (name in headers) {
      nativeSetHeader.apply(xhr, headers[name]);
    }

    if (settings.timeout > 0) {
      abortTimeout = setTimeout(function() {
        xhr.onreadystatechange = lang.noop;
        xhr.abort();
        ajaxError(null, 'timeout', xhr, settings);
      }, settings.timeout);
    }

    xhr.send(settings.data ? settings.data : null);
    return xhr;
  };

  function parseArguments(url, data, success, dataType) {
    if (lang.isFunction(data)) {
      dataType = success;
      success = data;
      data = undefined;
    }
    if (!lang.isFunction(success)) {
      dataType = success;
      success = undefined;
    }
    return {
      url: url,
      data: data,
      success: success,
      dataType: dataType
    };
  }

  HTTP.get = function( /* url, data, success, dataType */ ) {
    return HTTP.ajax(parseArguments.apply(null, arguments));
  };

  HTTP.post = function( /* url, data, success, dataType */ ) {
    var options = parseArguments.apply(null, arguments);
    options.type = 'POST';
    return HTTP.ajax(options);
  };

  module.exports = HTTP;

});