define('mob/router', function(require, exports, module) {

  var lang = require('mob/lang');
  var Logger = require('mob/logger');
  var $ = require('mob/jqlite');
  var Error = require('mob/error');

  var isUndefinedFn = lang.isUndefined;
  var bindFn = lang.bind;
  var isFunctionFn = lang.isFunction;

  var hashchangeEvtName = 'hashchange.router';

  var ROUTER_PATH_REPLACER = '([^\/\\?]+)',
    ROUTER_PATH_NAME_MATCHER = /:([\w\d]+)/g,
    ROUTER_PATH_EVERY_MATCHER = /\/\*(?!\*)/,
    ROUTER_PATH_EVERY_REPLACER = '\/([^\/\\?]+)',
    ROUTER_PATH_EVERY_GLOBAL_MATCHER = /\*{2}/,
    ROUTER_PATH_EVERY_GLOBAL_REPLACER = '(.*?)\\??',
    ROUTER_LEADING_BACKSLASHES_MATCH = /\/*$/;

  var RouterRequest = function(href) {
    this.href = href;
    this.params;
    this.query;
    this.splat;
    this.hasNext = false;
  };

  RouterRequest.prototype.get = function(key, defaultValue) {
    return (this.params && !isUndefinedFn(this.params[key])) ?
      this.params[key] : (this.query && !isUndefinedFn(this.query[key])) ?
      this.query[key] : !isUndefinedFn(defaultValue) ? defaultValue : undefined;
  };

  var Router = function(options) {

    this._options = lang.extend({
      ignorecase: true
    }, options);

    this._routes = [];
    this._befores = [];
    this._errors = {
      '_': function( /* err, url, httpCode */ ) {},
      '_404': function(err, url) {
        Logger.warn('404! Unmatched route for url ' + url);
      },
      '_500': function(err, url) {
        Logger.error('500! Internal error route for url ' + url);
      }
    };
    this._paused = false;

    var hasChangeHandler = bindFn(this._onHashChange, this);

    $(window).unbind(hashchangeEvtName).bind(hashchangeEvtName, hasChangeHandler);
  };

  Router.prototype._onHashChange = function(e) {
    if (!this._paused) {
      this._route(this._extractFragment(window.location.href));
    }
    return true;
  };

  Router.prototype._extractFragment = function(url) {
    var hashIndex = url.indexOf('#');
    return hashIndex >= 0 ? url.substring(hashIndex) : '#/';
  };

  Router.prototype._throwsRouteError = function(httpCode, err, url) {
    if (isFunctionFn(this._errors['_' + httpCode])) {
      this._errors['_' + httpCode](err, url, httpCode);
    } else {
      this._errors._(err, url, httpCode);
    }
    return false;
  };

  Router.prototype._buildRequestObject = function(fragmentUrl, params, splat, hasNext) {
    if (!fragmentUrl) {
      throw new Error('Unable to compile request object');
    }
    var request = new RouterRequest(fragmentUrl);
    if (params) {
      request.params = params;
    }
    var completeFragment = fragmentUrl.split('?');
    if (completeFragment.length == 2) {
      var queryKeyValue = null;
      var queryString = completeFragment[1].split('&');
      request.query = {};
      for (var i = 0, qLen = queryString.length; i < qLen; i++) {
        queryKeyValue = queryString[i].split('=');
        request.query[decodeURI(queryKeyValue[0])] = decodeURI(queryKeyValue[1].replace(/\+/g, '%20'));
      }
      request.query;
    }
    if (splat && splat.length > 0) {
      request.splats = splat;
    }
    if (hasNext === true) {
      request.hasNext = true;
    }
    return request;
  };

  Router.prototype._followRoute = function(fragmentUrl, url, matchedIndexes) {
    var index = matchedIndexes.splice(0, 1),
      route = this._routes[index],
      match = url.match(route.path),
      request,
      params = {},
      splat = [];
    if (!route) {
      return this._throwsRouteError(500, new Error('Internal error'), fragmentUrl);
    }
    for (var i = 0, len = route.paramNames.length; i < len; i++) {
      params[route.paramNames[i]] = match[i + 1];
    }
    i = i + 1;

    if (match && i < match.length) {
      for (var j = i; j < match.length; j++) {
        splat.push(match[j]);
      }
    }

    var hasNext = (matchedIndexes.length !== 0);

    var next = bindFn(function(uO, u, mI, hasNext) {

      return bindFn(function(hasNext, err, error_code) {
        if (!hasNext && !err) {
          return this._throwsRouteError(500, 'Cannot call "next" without an error if request.hasNext is false', fragmentUrl);
        }
        if (err) {
          return this._throwsRouteError(error_code || 500, err, fragmentUrl);
        }
        this._followRoute(uO, u, mI);
      }, this, hasNext);

    }, this)(fragmentUrl, url, matchedIndexes, hasNext);

    request = this._buildRequestObject(fragmentUrl, params, splat, hasNext);
    route.routeAction(request, next);
  };

  Router.prototype._routeBefores = function(befores, before, fragmentUrl, url, matchedIndexes) {
    var next;
    if (befores.length > 0) {
      var nextBefore = befores.splice(0, 1);
      nextBefore = nextBefore[0];
      next = bindFn(function(err, error_code) {
        if (err) {
          return this._throwsRouteError(error_code || 500, err, fragmentUrl);
        }
        this._routeBefores(befores, nextBefore, fragmentUrl, url, matchedIndexes);
      }, this);

    } else {
      next = bindFn(function(err, error_code) {
        if (err) {
          return this._throwsRouteError(error_code || 500, err, fragmentUrl);
        }
        this._followRoute(fragmentUrl, url, matchedIndexes);
      }, this);

    }
    before(this._buildRequestObject(fragmentUrl, null, null, true), next);
  };

  Router.prototype._route = function(fragmentUrl) {
    var route = '',
      befores = this._befores.slice(),
      matchedIndexes = [],
      urlToTest;
    var url = fragmentUrl;
    if (url.length === 0) {
      return true;
    }
    url = url.replace(ROUTER_LEADING_BACKSLASHES_MATCH, '');
    urlToTest = (url.split('?'))[0].replace(ROUTER_LEADING_BACKSLASHES_MATCH, '');

    for (var p in this._routes) {
      if (this._routes.hasOwnProperty(p)) {
        route = this._routes[p];
        if (route.path.test(urlToTest)) {
          matchedIndexes.push(p);
        }
      }
    }

    if (matchedIndexes.length > 0) {
      if (befores.length > 0) {
        var before = befores.splice(0, 1);
        before = before[0];
        this._routeBefores(befores, before, fragmentUrl, url, matchedIndexes);
      } else {
        this._followRoute(fragmentUrl, url, matchedIndexes);
      }
    } else {
      return this._throwsRouteError(404, null, fragmentUrl);
    }
  };

  Router.prototype.pause = function() {
    this._paused = true;
    return this;
  };

  Router.prototype.play = function(triggerNow) {
    triggerNow = isUndefinedFn(triggerNow) ? false : triggerNow;
    this._paused = false;
    if (triggerNow) {
      this._route(this._extractFragment(window.location.href));
    }
    return this;
  };

  Router.prototype.setLocation = function(url) {
    window.history.pushState(null, '', url);
    return this;
  };

  Router.prototype.redirect = function(url) {
    this.setLocation(url);
    if (!this._paused) {
      this._route(this._extractFragment(url));
    }
    return this;
  };

  Router.prototype.addRoute = function(path, callback) {
    var match,
      modifiers = (this._options.ignorecase ? 'i' : ''),
      paramNames = [];
    if (lang.isString(path)) {
      path = path.replace(ROUTER_LEADING_BACKSLASHES_MATCH, '');
      while ((match = ROUTER_PATH_NAME_MATCHER.exec(path)) !== null) {
        paramNames.push(match[1]);
      }
      path = new RegExp(path
          .replace(ROUTER_PATH_NAME_MATCHER, ROUTER_PATH_REPLACER)
          .replace(ROUTER_PATH_EVERY_MATCHER, ROUTER_PATH_EVERY_REPLACER)
          .replace(ROUTER_PATH_EVERY_GLOBAL_MATCHER, ROUTER_PATH_EVERY_GLOBAL_REPLACER) + '(?:\\?.+)?$', modifiers);
    }

    this._routes.push({
      'path': path,
      'paramNames': paramNames,
      'routeAction': callback
    });
    return this;
  };

  Router.prototype.before = function(callback) {
    this._befores.push(callback);
    return this;
  };

  Router.prototype.errors = function(httpCode, callback) {
    if (lang.isNaN(httpCode)) {
      throw new Error('Invalid code for routes error handling');
    }
    if (!isFunctionFn(callback)) {
      throw new Error('Invalid callback for routes error handling');
    }
    httpCode = '_' + httpCode;
    this._errors[httpCode] = callback;
    return this;
  };

  Router.prototype.run = function(startUrl) {
    if (!startUrl) {
      startUrl = this._extractFragment(window.location.href);
    }
    startUrl = startUrl.indexOf('#') === 0 ? startUrl : '#' + startUrl;
    this.redirect(startUrl);
    return this;
  };

  Router.prototype.destroy = function() {
    $(window).unbind(hashchangeEvtName);
    return this;
  };

  module.exports = Router;

});