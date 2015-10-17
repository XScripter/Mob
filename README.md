# Mob 框架

> 轻量级、稳定、可配置 HTML5 框架。

## 安装
Mob 不依赖任何第三方框架，可以按照 AMD 和 CommonJS 模块化方式引入。当然你也可以通过直接引用下面链接的方式引入：

  <script src="https://raw.githubusercontent.com/XScripter/Mob/master/build/js/mob.min.js"></script>

## 使用

## 文档

### 模块（`Mob.Module`）

#### define（`Mob.defineModule`）
定义模块。

```js
Mob.Module.define('mo/forTest1', function(require, exports, module) {

  // 可以使用 exports ，导出单个方法
  exports.add = function(a, b) {
    return a + b;
  };

});

Mob.Module.define('mo/forTest2', function(require, exports, module) {

  var helpers = {};

  helpers.sayHi = function() {
    return 'hi';
  };

  // 可以使用 module.exports ，导出对象
  module.exports = helpers;

});

```

#### require
引入模块。

在模块外引入某个模块。

```js
// 在模块外引入
Mob.Module.define('mo/here', function(require, exports, module) {

  exports.print = function() {
    return '-';
  };

});

var here = Mob.Module.require('mo/here');
here.print();
```

在某个模块内部引入其他已定义的模块。

```js
Mob.Module.define('mo/forTest2', function(require, exports, module) {

  // 直接通过 require 引入
  var here = require('mo/here');

  var helpers = {};

  helpers.doublePrint = function() {

    return here.print() + here.print();

  };

  module.exports = helpers;

});
```

#### remove
删除模块。

```js
Mob.Module.remove('mo/forTest2');
```

#### map
查询模块

```js
var moduleMap = Mob.Module.map();
```

### 日志打印（`Mob.Logger`）

#### useDefaults
使用默认方式（将日志打印到控制台）打印日志。

```js
// 日志信息会关联到 window.console
Mob.Logger.useDefaults();

// 同样可以配置
Mob.Logger.useDefaults({
  logLevel: Logger.WARN,
  formatter: function (messages, context) {
    messages.unshift('[Application]');
    if (context.name) {
      messages.unshift('[' + context.name + ']');
    }
  }
});
```

#### log
打印 log 信息。

```js
Mob.log('第一个 log 信息'); // 等价于 Mob.Logger.log
Mob.Logger.log('第一个 log 信息');
```

#### debug
打印调试信息。

```js
Mob.debug('第一个 debug 信息'); // 等价于 Mob.Logger.debug
Mob.Logger.debug('第一个 debug 信息');
```

#### info
打印提示信息。

```js
Mob.info('第一个 info 信息'); // 等价于 Mob.Logger.info
Mob.Logger.info('第一个 info 信息');
```

#### warn
打印警告信息。

```js
Mob.warn('第一个 warn 信息'); // 等价于 Mob.Logger.warn
Mob.Logger.warn('第一个 warn 信息');
```

#### error
打印错误信息。

```js
Mob.error('第一个 error 信息'); // 等价于 Mob.Logger.error
Mob.Logger.error('第一个 error 信息');
```

#### time & timeEnd
当需要统计一段代码的执行时间时，可以使用 `Mob.time` 方法与 `Mob.timeEnd` 方法，其中 `Mob.time` 方法用于标记开始时间， `Mob.timeEnd` 方法用于标记结束时间，并且将结束时间与开始时间之间经过的毫秒数在控制台中输出。

```js
Mob.time('登录系统'); // 等价于 Mob.Logger.time
Mob.Logger.time('退出系统');

Mob.timeEnd('登录系统'); // 等价于 Mob.Logger.timeEnd
Mob.Logger.timeEnd('退出系统');

// 登录系统: 5420.593ms
// 退出系统: 5620.593ms
```

#### setLevel
设置日志打印级别，分为`DEBUG` `INFO` `TIME` `WARN` `ERROR` `OFF`。

```js
// 不打印任何日志信息
Mob.Logger.setLevel(Mob.Logger.OFF);
```

#### get
`Mob.Logger` 提供了 `Named Loggers` 用于为不同模块设置相应的配置。

```js
// 为 ModuleA 实例化一个日志打印对象 moduleALogger
var moduleALogger = Mob.Logger.get('ModuleA');
moduleALogger.info('FizzWozz starting up');

// 单独为 moduleALogger 设置日志打印级别，不影响其它日志打印对象
moduleALogger.setLevel(Mob.Logger.WARN);

// 同样也可以直接使用下面方式打印日志
Mob.Logger.get('ModuleA').warn('打印警告日志');

```

需要注意的是 `Mob.Logger.setLevel()` 同样也会作用于所有 `Named Logger` 实例，所以一般你可以使用下面的方式配置日志打印级别：

```js
var loggerA = Mob.Logger.get('LoggerA');
var loggerB = Mob.Logger.get('LoggerB');

Mob.Logger.setLevel(Mob.Logger.WARN);
Mob.Logger.get('LoggerB').setLevel(Mob.Logger.DEBUG);

```

#### setHandler
自定义日志信息处理方式。

```js
Mob.Logger.setHandler(function (messages, context) {
  // 发送自定义日志信息到服务端，用于分析  
  Mob.HTTP.post('/logs', {
    message: messages[0],
    evel: context.level
  });
});
```

### 模板（`Mob.Template`）

#### registerHelpers
给模板添加帮助函数，可以直接在 <% … %> 调用帮助函数。

```js
Mob.Template.registerHelpers({
  add: function(a, b) {
    return a + b;
  },
  subview: function(subviewName) {
    return "<div data-subview='" + subviewName + "'></div>";
  }
});

var s = '<%=add(a, b)%>';
var data = {
  a: 1,
  b: 4
};

Mob.Template.compile(s)(data); // 5

var s1 = '<%=subview("test")%>';
Mob.Template.compile(s1)(); // <div data-subview=\'test\'></div>
```

#### compile
模板函数可以使用 <%= … %> 插入变量, 也可以用 <% … %> 执行任意的 JavaScript 代码。 如果您希望插入一个值, 并让其进行HTML转义,请使用<%- … %>。 当你要给模板函数赋值的时候，可以传递一个含有与模板对应属性的 data 对象。

```js
var compiled = Mob.Template.compile('hello: <%= name %>');
compiled({name: 'moe'}); // "hello: moe"

var compiled1 = Mob.Template.compile('<b><%- value %></b>');
compiled1({value: 'script'}); //"<b>script</b>"
```

同样也可以在 JavaScript 代码中使用 print . 有时候这会比使用 <%= ... %> 更方便。

```js
var compiled = Mob.Template.compile('<% print("Hello " + epithet); %>');
compiled({epithet: 'stooge'});
=> "Hello stooge"
```

#### config
更改模板设置。

```js
Mob.Template.config({
  interpolate: /\{\{(.+?)\}\}/g
});

var compiled = Mob.Template.compile('Hello {{ name }}!');
compiled({name: 'Mustache'}); // "Hello Mustache!"
```


















