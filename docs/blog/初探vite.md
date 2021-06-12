# 初探 vite

## 传统打包器

在讲 vite 前先谈谈传统的打包工具，比如 webpack，通常包含两大块功能：

1. 本地开发服务器
2. 生产环境构建

工作原理简单来讲就是以入口文件为单位，在构建期间打包成能够在浏览器中直接运行的代码，然后依靠运行时文件来管理模块依赖问题。

这种模式的一个问题是需要经历漫长的打包过程，这对于生产环境构建倒是没有什么大的影响，但对于本地开发服务器来讲，会影响开发人员的效率，从第一次启动和之后的文件更新两方面来讲：

**第一次冷启动：**

在第一次冷启动时需要从零开始打包整个项目，即使启动后的首页并不需要使用到所有文件，这效率会随着应用体积增长而直线下降。

一些打包器选择使用 dll 缓存技术缓建该现状，就是把常用构建时间长且相对静态的代码打包成 dll（比如 react）作为缓存，之后就不需要再重新打包了。

> 维基百科：所谓 dll 动态链接库，就是把一些经常会共享的代码制作成 DLL 档，当可执行文件调用到 DLL 档内的函数时，Windows 操作系统才会把 DLL 档加载存储器内，DLL 档本身的结构就是可执行档，当程序有需求时函数才进行链接。透过动态链接方式，存储器浪费的情形将可大幅降低。

**文件变更后的更新过程：**

一些打包器的开发服务器将构建内容存入内存，这样它们只需要在文件更改时替换模块图谱的一部分，但它也仍需要整个重新构建并重载页面。这样代价很高，并且重新加载页面会消除应用的当前状态。

因此才有了动态模块热重载（HMR），允许一个模块 “热替换” 它自己，而对页面其余部分没有影响。但这依然需要打包当前修改的文件并 merge 到内存的模块图谱中，并通知运行时文件执行 HMR 的注册函数，类似下面这样：

```javascript
// 包裹在if条件判断是为了code spilting
if (import.meta.hot) {
  import.meta.hot.accept('foo.js', mod => {
    render(mod);
  });
}
```

实践中证明这种模式下的 HMR 更新速度也会随着应用规模的增长而显著下降。

## vite 的理念

> 拥抱原生新特性

基于上述的效率问题，我们试想一下：

如果本地开发服务器启动时不进行打包，而是在首页请求入口文件资源时实时的进行代码转译，记录文件的模块依赖图谱，这不就解决了启动慢的问题吗，并且天然的只会转译入口文件直接依赖到的文件，避免了很多无谓的打包过程。

vite 就是这么做的，vite 基于原生的 ESM 特性来加载入口文件，比如：

```html
<div id="app"></div>
<script type="module" src="/main.js"></script>
```

```js
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

浏览器就会发起网络请求比如`./App.vue`，vite 的本地服务器会拦截请求并做一系列处理（比如分析依赖链，语法转译，寻找 HMR 边界等等），最终返回可执行代码。

vite 内部会有一个 moduleResolver 模块，专门负责处理请求路径到实际文件位置（反之亦然）的映射关系，如何实现的就去看源码吧。

原生 ESM 目前的浏览器支持情况如下所示：

![image.png](@images/1603073373210-f755024d-56dc-4b49-a32e-146dcd0fe086.png)

## vite 对 HMR 的实现

按照资源热重载的类型可以分为：页面重载，JS 局部更新，CSS 更新。

在启动本地开发服务器之后，向浏览器注入运行时文件，该文件负责在 import.meta.hot 上部署相关 HMR 钩子方法，在实际代码中注册回调函数，

```javascript
// 包裹在if条件判断是为了code spilting
if (import.meta.hot) {
  import.meta.hot.accept('foo.js', mod => {
    render(mod);
  });
}
```

当浏览器发起资源请求，分析该次资源的依赖链，寻找 HMR boundary，HMR boundary 是指调用了 import.meta.hot API 的文件，如果没有找到则认为是 dead end，触发**页面重载**；如果找到了则只进行 **JS 局部更新**，热更新的逻辑取决于在 import.meta.hot 中的逻辑;**CSS 更新**则简单很多，只需修改对应 link 标签 href 的时间戳来重新获取资源即可。

触发热更新的时机是监听到代码文件发生变化那一刻，服务器通过 websocket 发送信号到浏览器的运行时文件，继而按上述不同场景处理热更新逻辑。

Vite 同时利用 HTTP 头来加速整个页面的重新加载（再次让浏览器为我们做更多事情）：源码模块的请求会根据 304 Not Modified 进行协商缓存，而依赖模块请求则会通过 Cache-Control: max-age=31536000,immutable 进行强缓存，因此一旦被缓存它们将不需要再次请求。

## vite 的生产环境构建

> 为什么不使用 ESBuild 打包？虽然 esbuild 快得惊人，并且已经是一个在构建库方面比较出色的工具，但一些针对构建 应用 的重要功能仍然还在持续开发中 —— 特别是代码分割和 CSS 处理方面。就目前来说，Rollup 在应用打包方面更加成熟和灵活。尽管如此，当未来这些功能稳定后，我们也不排除使用 esbuild 作为生产构建器的可能。

vite 使用 rollup 进行生产环境打包。

可以看到 vite 的生产环境构建并没有使用本地开发服务器的思路，这是因为尽管原生 ESM 现在得到了广泛支持，但由于嵌套导入会导致额外的网络往返，在生产环境中发布未打包的 ESM 仍然效率低下（即使使用 HTTP/2）。为了在生产环境中获得最佳的加载性能，最好还是将代码进行 tree-shaking、懒加载和 chunk 分割（以获得更好的缓存）。

## 补充

- vite 需要项目所有的依赖模块是 ESM 格式的，我当时看的是 v1.0 源码，那时需要使用 react 的 ESM 版本 `@pika/react` 和 `@pika/react-dom`来替换原本的 react，v2.0 后增加了[依赖于构建过程](https://cn.vitejs.dev/guide/dep-pre-bundling.html)，预处理的将其他格式转为 ESM 格式，具体可以看官网描述。

- 当时看的 v1.0 本地开发服务器是基于 koa 开发的，v2.0 变为 [connect](https://github.com/senchalabs/connect)，官方的解释是 v2.0 使用了一套完全重定义的，扩展了 Rollup 插件的接口，由于大多数逻辑通过插件钩子实现，而无需使用中间件，因此对中间件的需求大大减少，所以不再使用 Koa。下面是 v1.0 基于 Koa 的部分代码：

```ts
// 创建Koa实例
const app = new Koa<State, Context>();
// 基于配置创建http/https/http2服务器
const server = resolveServer(config, app.callback());
// 文件变更监听器
const watcher = chokidar.watch(root, {
  // ...
}) as HMRWatcher;
const resolver = createResolver(root, resolvers, alias);

// 创建本地开发服务器的上下文
const context: ServerPluginContext = {
  root,
  app,
  server,
  watcher,
  resolver,
  config,
  port: config.port || 3000,
};

// 将本地开发服务器的上下文merge到Koa的请求上下文中
app.use((ctx, next) => {
  Object.assign(ctx, context);
  ctx.read = cachedRead.bind(null, ctx);
  return next();
});

// 内部中间件，比如处理HMR的、处理模块路径的、静态资源代理的等等
const resolvedPlugins = [
  // ...
];
// 将本地开发服务器的上下文传递给中间件
resolvedPlugins.forEach(m => m && m(context));

// 监听启动服务器
const listen = server.listen.bind(server);
server.listen = (async (port: number, ...args: any[]) => {
  const listener = listen(port, ...args);
  context.port = server.address().port;
  return listener;
}) as any;
```

## 参考

[构建优化](https://cn.vitejs.dev/guide/features.html#build-optimizations)
[构建命令](https://cn.vitejs.dev/guide/build.html)
[插件开发指南](https://cn.vitejs.dev/guide/api-plugin.html)
