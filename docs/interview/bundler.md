---
title: Bundler
---

## 什么是 webpack

webpack 是一款打包工具，它的主要目的是把工程化的 JS 代码打包编译成可直接在浏览器运行的文件。也支持处理其他资源。

loader:

webpack 在读取文件时会经过对应的 loader 处理，比如语法转换等。

plugin:

webpack 抽象出了多个生命周期函数，会在打包编译的各个阶段执行，我们可以通过 plugin 扩展 webpack 内部打包时的行为。

## 简述 HMR 的原理 <Badge>我的语雀</Badge>

启动本地开发服务器时，向浏览器注入运行时文件，该文件负责在 import.meta.hot 上部署相关方法，所以我们才能在代码中像这样使用：

```js
// 包裹在if条件判断是为了code spilting
if (import.meta.hot) {
  import.meta.hot.accept('foo.js', mod => {
    render(mod);
  });
}
```

当服务器监测到文件变更，会分析该资源的依赖图谱，根据分析结果来决定发送何种信号给浏览器的运行时文件（使用 websocket 通信）。

分析依赖图谱过程：寻找 HMR boundary，HMR boundary 是指调用了 import.meta.hot API 的文件，如果没有找到则认为是 dead end；如果找到了则只进行局部热更新，即执行 import.meta.hot 中的代码；CSS 的更新则简单很多，只需修改对应 link 标签 href 的时间戳来重新获取资源即可。

浏览器的运行时文件根据不同的信号作不同的处理，信号主要可以分为页面重载、JS 局部更新、CSS 更新。当信号是 JS 局部更新时，向变更后的文件发起请求，将老的模块替换成新的（我们知道 webpack 会将所有模块封装在运行时中，代码 import 某个模块对于 webpack 来说就是执行对应的模块），最后执行 import.meta.hot 中的代码。

## treeshaking 的原理

> 详见[文章](https://www.cnblogs.com/sexintercourse/p/11901425.html)。

treeshaking 是 DCE（dead code elimination）的一种实现，DCE 的理想目标是把所有不影响运行逻辑的代码去除掉。这就需要静态分析，所谓静态分析就是不执行代码，从字面量上对代码进行分析，而在 ES6 之前的模块化是可以动态 require 依赖的，这就不能通过静态分析来优化了，这也是 treeshaking 依赖 ES6 模块的原因。

ES6 模块有如下特点：

- 只能作为模块顶层的语句出现
- import 的模块名只能是字符串常量
- import binding 是 immutable 的

即使有了 ES6 模块，一些副作用的代码依然无法静态分析其是否影响逻辑代码，因为它可能间接影响，看下面这个例子：

```js
var person = (function() {
  var Person = function() {};
  Person.prototype.run = function run() {
    console.log('run');
  };
  Person.prototype.jump = function jump() {
    console.log('jump');
  };
  return Person;
})();
var p = new Person();
p[Math.random() > 0.5 ? 'run' : 'jump']();
```

从静态分析角度来看 run 和 jump 都没有使用到，但是运行时依然会使用。

总结来看，treeshaking 只能作如下优化：

1. 只处理函数和顶层的 import/export 变量，不能把没用到的类的方法消除掉
2. 无法消除副作用代码

## webpack-chain 的工作原理