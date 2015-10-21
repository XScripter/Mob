define('mob/touch', function(require, exports, module) {

  var lang = require('mob/lang');
  var $ = require('mob/jqlite');
  var Platform = require('mob/platform');

  var isUndefinedFn = lang.isUndefined;

  var deviceIsWindowsPhone = Platform.isWindowsPhone();
  var deviceIsAndroid = Platform.isAndroid() && !deviceIsWindowsPhone;
  var deviceIsIOS = Platform.isIOS() && !deviceIsWindowsPhone;
  var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

  function TouchEvent(layer, options) {

    options = options || {};

    this.trackingClick = false;
    this.trackingClickStart = 0;
    this.targetElement = null;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.lastTouchIdentifier = 0;
    this.touchBoundary = options.touchBoundary || 10;
    this.layer = layer;
    this.tapDelay = options.tapDelay || 200;
    this.tapTimeout = options.tapTimeout || 700;

    if (TouchEvent.notNeeded(layer)) {
      return;
    }

    var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
    var context = this;
    for (var i = 0, l = methods.length; i < l; i++) {
      context[methods[i]] = lang.bind(context[methods[i]], context);
    }

    if (deviceIsAndroid) {
      layer.addEventListener('mouseover', this.onMouse, true);
      layer.addEventListener('mousedown', this.onMouse, true);
      layer.addEventListener('mouseup', this.onMouse, true);
    }

    layer.addEventListener('click', this.onClick, true);
    layer.addEventListener('touchstart', this.onTouchStart, false);
    layer.addEventListener('touchmove', this.onTouchMove, false);
    layer.addEventListener('touchend', this.onTouchEnd, false);
    layer.addEventListener('touchcancel', this.onTouchCancel, false);

  }

  TouchEvent.prototype.needsClick = function(target) {
    switch (target.nodeName.toLowerCase()) {
      case 'button':
      case 'select':
      case 'textarea':
        if (target.disabled) {
          return true;
        }
        break;
      case 'input':
        if ((deviceIsIOS && target.type === 'file') || target.disabled) {
          return true;
        }
        break;
      case 'label':
      case 'iframe':
      case 'video':
        return true;
    }

    return (/\bneedsclick\b/).test(target.className);
  };

  TouchEvent.prototype.needsFocus = function(target) {
    switch (target.nodeName.toLowerCase()) {
      case 'textarea':
        return true;
      case 'select':
        return !deviceIsAndroid;
      case 'input':
        switch (target.type) {
          case 'button':
          case 'checkbox':
          case 'file':
          case 'image':
          case 'radio':
          case 'submit':
            return false;
        }
        return !target.disabled && !target.readOnly;
      default:
        return (/\bneedsfocus\b/).test(target.className);
    }
  };

  TouchEvent.prototype.sendClick = function(targetElement, event) {
    var clickEvent, touch;

    if (document.activeElement && document.activeElement !== targetElement) {
      document.activeElement.blur();
    }

    touch = event.changedTouches[0];

    clickEvent = document.createEvent('MouseEvents');
    clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
    clickEvent.forwardedTouchEvent = true;
    targetElement.dispatchEvent(clickEvent);
  };

  TouchEvent.prototype.determineEventType = function(targetElement) {

    if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
      return 'mousedown';
    }

    return 'click';
  };

  TouchEvent.prototype.focus = function(targetElement) {
    var length;

    if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
      length = targetElement.value.length;
      targetElement.setSelectionRange(length, length);
    } else {
      targetElement.focus();
    }
  };

  TouchEvent.prototype.updateScrollParent = function(targetElement) {
    var scrollParent, parentElement;

    scrollParent = targetElement.touchEventScrollParent;

    if (!scrollParent || !scrollParent.contains(targetElement)) {
      parentElement = targetElement;
      do {
        if (parentElement.scrollHeight > parentElement.offsetHeight) {
          scrollParent = parentElement;
          targetElement.touchEventScrollParent = parentElement;
          break;
        }

        parentElement = parentElement.parentElement;
      } while (parentElement);
    }

    if (scrollParent) {
      scrollParent.touchEventLastScrollTop = scrollParent.scrollTop;
    }
  };

  TouchEvent.prototype.getTargetElementFromEventTarget = function(eventTarget) {

    if (eventTarget.nodeType === Node.TEXT_NODE) {
      return eventTarget.parentNode;
    }

    return eventTarget;
  };

  TouchEvent.prototype.onTouchStart = function(event) {
    var targetElement, touch, selection;

    if (event.targetTouches.length > 1) {
      return true;
    }

    targetElement = this.getTargetElementFromEventTarget(event.target);
    touch = event.targetTouches[0];

    if (deviceIsIOS) {

      selection = window.getSelection();
      if (selection.rangeCount && !selection.isCollapsed) {
        return true;
      }

      if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
        event.preventDefault();
        return false;
      }

      this.lastTouchIdentifier = touch.identifier;

      this.updateScrollParent(targetElement);
    }

    this.trackingClick = true;
    this.trackingClickStart = event.timeStamp;
    this.targetElement = targetElement;

    this.touchStartX = touch.pageX;
    this.touchStartY = touch.pageY;

    if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
      event.preventDefault();
    }

    return true;
  };

  TouchEvent.prototype.touchHasMoved = function(event) {
    var touch = event.changedTouches[0],
      boundary = this.touchBoundary;

    if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
      return true;
    }

    return false;
  };

  TouchEvent.prototype.onTouchMove = function(event) {
    if (!this.trackingClick) {
      return true;
    }

    if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
      this.trackingClick = false;
      this.targetElement = null;
    }

    return true;
  };

  TouchEvent.prototype.findControl = function(labelElement) {

    if (!isUndefinedFn(labelElement.control)) {
      return labelElement.control;
    }

    if (labelElement.htmlFor) {
      return document.getElementById(labelElement.htmlFor);
    }

    return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
  };

  TouchEvent.prototype.onTouchEnd = function(event) {
    var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

    if (!this.trackingClick) {
      return true;
    }

    if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
      this.cancelNextClick = true;
      return true;
    }

    if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
      return true;
    }

    this.cancelNextClick = false;

    this.lastClickTime = event.timeStamp;

    trackingClickStart = this.trackingClickStart;
    this.trackingClick = false;
    this.trackingClickStart = 0;

    if (deviceIsIOSWithBadTarget) {
      touch = event.changedTouches[0];

      targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
      targetElement.touchEventScrollParent = this.targetElement.touchEventScrollParent;
    }

    targetTagName = targetElement.tagName.toLowerCase();
    if (targetTagName === 'label') {
      forElement = this.findControl(targetElement);
      if (forElement) {
        this.focus(targetElement);
        if (deviceIsAndroid) {
          return false;
        }

        targetElement = forElement;
      }
    } else if (this.needsFocus(targetElement)) {

      if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
        this.targetElement = null;
        return false;
      }

      this.focus(targetElement);
      this.sendClick(targetElement, event);

      if (!deviceIsIOS || targetTagName !== 'select') {
        this.targetElement = null;
        event.preventDefault();
      }

      return false;
    }

    if (deviceIsIOS) {

      scrollParent = targetElement.touchEventScrollParent;
      if (scrollParent && scrollParent.touchEventLastScrollTop !== scrollParent.scrollTop) {
        return true;
      }
    }

    if (!this.needsClick(targetElement)) {
      event.preventDefault();
      this.sendClick(targetElement, event);
    }

    return false;
  };

  TouchEvent.prototype.onTouchCancel = function() {
    this.trackingClick = false;
    this.targetElement = null;
  };

  TouchEvent.prototype.onMouse = function(event) {

    if (!this.targetElement || event.forwardedTouchEvent || !event.cancelable) {
      return true;
    }

    if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

      if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }

      event.stopPropagation();
      event.preventDefault();

      return false;
    }

    return true;
  };

  TouchEvent.prototype.onClick = function(event) {
    var permitted;

    if (this.trackingClick) {
      this.targetElement = null;
      this.trackingClick = false;
      return true;
    }

    if (event.target.type === 'submit' && event.detail === 0) {
      return true;
    }

    permitted = this.onMouse(event);

    if (!permitted) {
      this.targetElement = null;
    }

    return permitted;
  };

  TouchEvent.prototype.destroy = function() {
    var layer = this.layer;

    if (deviceIsAndroid) {
      layer.removeEventListener('mouseover', this.onMouse, true);
      layer.removeEventListener('mousedown', this.onMouse, true);
      layer.removeEventListener('mouseup', this.onMouse, true);
    }

    layer.removeEventListener('click', this.onClick, true);
    layer.removeEventListener('touchstart', this.onTouchStart, false);
    layer.removeEventListener('touchmove', this.onTouchMove, false);
    layer.removeEventListener('touchend', this.onTouchEnd, false);
    layer.removeEventListener('touchcancel', this.onTouchCancel, false);
  };

  TouchEvent.notNeeded = function(layer) {

    var metaViewport;
    var chromeVersion;

    if (isUndefinedFn(window.ontouchstart)) {
      return true;
    }

    chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

    if (chromeVersion) {

      if (deviceIsAndroid) {
        metaViewport = document.querySelector('meta[name=viewport]');

        if (metaViewport) {
          if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
            return true;
          }
          if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
            return true;
          }
        }

      } else {
        return true;
      }
    }

    if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
      return true;
    }

    return false;
  };

  TouchEvent.initialize = function(options, layer) {
    layer = layer || $('body');
    return new TouchEvent($(layer).get(0), options);
  };

  module.exports = TouchEvent;

});