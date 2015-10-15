define('mob/support', function(require, exports, module) {

  var Support = {

    addEventListener: !!window.addEventListener,

    transitions: (function (temp) {
      var props = ['transformProperty', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform'];
      for (var i in props) {
        if (temp.style[props[i]] !== undefined) {
          return true;
        }
      }
      return false;
    })(document.createElement('swipe')),

    touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,

    transform3d: function () {

      var head, body, style, div, result;

      head = document.getElementsByTagName('head')[0];
      body = document.body;

      style = document.createElement('style');
      style.textContent = '@media (transform-3d),(-o-transform-3d),(-moz-transform-3d),(-webkit-transform-3d){#mo-3dtest{height:3px}}';

      div = document.createElement('div');
      div.id = 'mo-3dtest';

      head.appendChild(style);
      body.appendChild(div);

      result = div.offsetHeight === 3;

      style.parentNode.removeChild(style);
      div.parentNode.removeChild(div);

      return result;
    },

    animationEvents: (typeof window.WebKitAnimationEvent !== 'undefined')

  };

  module.exports = Support;

});