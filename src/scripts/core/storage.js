define('mob/storage', function(require, exports, module) {

  var lang = require('mob/lang');

  var Storage = function(options) {

    var store = this;
    this.options = options || {};
    this.name = this.options.name || 'store';

    if (lang.isArray(this.options.type)) {
      lang.each(this.options.type, function(type, i) {
        if (Storage.isAvailable(type)) {
          store.type = type;
          return false;
        }
      });
    } else {
      this.type = this.options.type || 'memory';
    }
    this.meta_key = this.options.meta_key || '__keys__';
    this.storage = new Storage[Storage.stores[this.type]](this.name, this.options);
  };

  Storage.stores = {
    'memory': 'Memory',
    'data': 'Data',
    'local': 'LocalStorage',
    'session': 'SessionStorage',
    'cookie': 'Cookie'
  };

  lang.extend(Storage.prototype, {

    isAvailable: function() {
      if (lang.isFunction(this.storage.isAvailable)) {
        return this.storage.isAvailable();
      } else {
        return true;
      }
    },

    exists: function(key) {
      return this.storage.exists(key);
    },

    set: function(key, value) {
      var string_value = (typeof value == 'string') ? value : JSON.stringify(value);
      key = key.toString();
      this.storage.set(key, string_value);
      if (key != this.meta_key) {
        this._addKey(key)
      }
      // always return the original value
      return value;
    },

    get: function(key) {
      var value = this.storage.get(key);
      if (typeof value == 'undefined' || value == null || value == '') {
        return value;
      }
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    },

    clear: function(key) {
      this._removeKey(key);
      return this.storage.clear(key);
    },

    clearAll: function() {
      var self = this;
      this.each(function(key, value) {
        self.clear(key);
      });
    },

    keys: function() {
      return this.get(this.meta_key) || [];
    },

    each: function(callback) {
      var i = 0,
        keys = this.keys(),
        returned;

      for (i; i < keys.length; i++) {
        returned = callback(keys[i], this.get(keys[i]));
        if (returned === false) {
          return false;
        }
      }
    },

    filter: function(callback) {
      var found = [];
      this.each(function(key, value) {
        if (callback(key, value)) {
          found.push([key, value]);
        }
        return true;
      });
      return found;
    },

    first: function(callback) {
      var found = false;
      this.each(function(key, value) {
        if (callback(key, value)) {
          found = [key, value];
          return false;
        }
      });
      return found;
    },

    fetch: function(key, callback) {
      if (!this.exists(key)) {
        return this.set(key, callback.apply(this));
      } else {
        return this.get(key);
      }
    },

    _addKey: function(key) {
      var keys = this.keys();
      if (lang.indexOf(keys, key) == -1) {
        keys.push(key);
      }
      this.set(this.meta_key, keys);
    },
    _removeKey: function(key) {
      var keys = this.keys();
      var index = lang.indexOf(keys, key);
      if (index != -1) {
        keys.splice(index, 1);
      }
      this.set(this.meta_key, keys);
    }
  });

  Storage.isAvailable = function(type) {
    try {
      return Storage[Storage.stores[type]].prototype.isAvailable();
    } catch (e) {
      return false;
    }
  };

  // ==================== Cookie ====================

  Storage.Cookie = function(name, options) {
    this.name = name;
    this.options = options || {};
    this.path = this.options.path || '/';
    // set the expires in seconds or default 14 days
    this.expires_in = this.options.expires_in || (14 * 24 * 60 * 60);
  };

  lang.extend(Storage.Cookie.prototype, {
    isAvailable: function() {
      return ('cookie' in document) && (window.location.protocol != 'file:');
    },
    exists: function(key) {
      return (this.get(key) != null);
    },
    set: function(key, value) {
      return this._setCookie(key, value);
    },
    get: function(key) {
      return this._getCookie(key);
    },
    clear: function(key) {
      this._setCookie(key, "", -1);
    },
    _key: function(key) {
      return ['store', this.name, key].join('.');
    },
    _getCookie: function(key) {
      var escaped = this._key(key).replace(/(\.|\*|\(|\)|\[|\])/g, '\\$1');
      var match = document.cookie.match("(^|;\\s)" + escaped + "=([^;]*)(;|$)");
      return (match ? match[2] : null);
    },
    _setCookie: function(key, value, expires) {
      if (!expires) {
        expires = (this.expires_in * 1000)
      }
      var date = new Date();
      date.setTime(date.getTime() + expires);
      var set_cookie = [
        this._key(key), "=", value,
        "; expires=", date.toGMTString(),
        "; path=", this.path
      ].join('');
      document.cookie = set_cookie;
    }
  });

  // ==================== Local ====================

  Storage.LocalStorage = function(name) {
    this.name = name;
  };

  lang.extend(Storage.LocalStorage.prototype, {

    isAvailable: function() {
      return ('localStorage' in window) && (window.location.protocol != 'file:');
    },
    exists: function(key) {
      return (this.get(key) != null);
    },
    set: function(key, value) {
      return window.localStorage.setItem(this._key(key), value);
    },
    get: function(key) {
      return window.localStorage.getItem(this._key(key));
    },
    clear: function(key) {
      window.localStorage.removeItem(this._key(key));
    },
    _key: function(key) {
      return ['store', this.name, key].join('.');
    }

  });

  // ==================== Memory ====================

  Storage.Memory = function(name) {
    this.name = name;
    this.namespace = this.name;
    Storage.Memory.store = Storage.Memory.store || {};
    Storage.Memory.store[this.namespace] = Storage.Memory.store[this.namespace] || {};
    this.store = Storage.Memory.store[this.namespace];
  };

  lang.extend(Storage.Memory.prototype, {
    isAvailable: function() {
      return true;
    },
    exists: function(key) {
      return (typeof this.store[key] != 'undefined');
    },
    set: function(key, value) {
      return this.store[key] = value;
    },
    get: function(key) {
      return this.store[key];
    },
    clear: function(key) {
      delete this.store[key];
    }
  });

  // ==================== Session ====================

  Storage.SessionStorage = function(name) {
    this.name = name;
  };

  lang.extend(Storage.SessionStorage.prototype, {
    isAvailable: function() {
      return ('sessionStorage' in window) &&
        (window.location.protocol != 'file:') &&
        (lang.isFunction(window.sessionStorage.setItem));
    },
    exists: function(key) {
      return (this.get(key) != null);
    },
    set: function(key, value) {
      return window.sessionStorage.setItem(this._key(key), value);
    },
    get: function(key) {
      var value = window.sessionStorage.getItem(this._key(key));
      if (value && typeof value.value != 'undefined') {
        value = value.value
      }
      return value;
    },
    clear: function(key) {
      window.sessionStorage.removeItem(this._key(key));
    },
    _key: function(key) {
      return ['store', this.name, key].join('.');
    }
  });

  module.exports = Storage;

});