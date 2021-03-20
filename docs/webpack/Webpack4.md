# Webpack4

## mode option

对比 2 种 mode(development/production)下的[默认配置](https://medium.com/webpack/webpack-4-mode-and-optimization-5423a6bc597a)

## CommonsChunkPlugin 变为 SplitChunksPlugin

Webpack4 之前依靠 CommonsChunkPlugin 实现 code spilting，现在变为 SplitChunksPlugin。SplitChunksPlugin 的核心思想是，把代码分成一个个 cache group，最终打包好的每个文件就是这些 cache group（optimization.splitChunks.cacheGroups）的组合，所以对 cache group 的粒度控制是有讲究的，这样最大的达到代码利用率，且利于自定义配置。

## hooks

Webpack 的 Compiler 有内置的 hooks，webpack 在 compile 的各个阶段会去调用这些 hooks。当开发一个 webpack plugin 时，可以扩展 compiler 内置 hooks 的执行内容：

```js
compiler.hooks.afterCompile.tap('输出编译后的时间点', compilation => {
  console.log(new Date());
});
```

也可以在 plugin 中定义自己的 hooks，在内部代码去调用这些 hooks：

```js
const { SyncHook } = require("tapable");
class Car {
  constructor() {
    this.hooks = {
      accelerate: new SyncHook(["newSpeed"])
    };
  }
  setSpeed(newSpeed) {
    this.hooks.accelerate.call(newSpeed);
  }
}
const myCar = new Car();
myCar.hooks.accelerate.tap("加速", () => accelerate()));
myCar.setSpeed()
```

可以参考[tapable](https://github.com/webpack/tapable)和 [Compiler](https://github.com/webpack/webpack/blob/master/lib/Compiler.js)。

## tree shaking

Webpack 在编译时会根据 ES 模块语法产生依赖树，当 bundler 遍历整个依赖树时，可以检查使用了什么依赖，并移除无用的。在 webpack 中，tree-shaking 在没有 minifier（内置 UglifyJsPlugin）的情况下是不会起作用的。
