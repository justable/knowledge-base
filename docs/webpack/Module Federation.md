# Module Federation

## 简介

Module Federation 是 Webpack5 的新特性，在[官方文档](https://webpack.js.org/concepts/module-federation/)有详细说明。它相对于传统的 webpack 项目来说，使得项目内部的资源或模块能够被其他项目所引言共享。我们知道，传统的 webpack 项目基于 entry 配置最终打包成能在浏览器中运行的代码，这个打包好的项目对于外部来讲是封闭的，它只是把工程化的代码结构转化成了生产环境可运行的代码。Module Federation 则是在这基础上，能够把项目中的资源按需 expose 出来，并能被另一个项目使用。

```jsx | pure
// app1/webpack.config.js
const ModuleFederationPlugin = require("webpack").container.ModuleFederationPlugin;
module.exports = {
  plugins: {
    new ModuleFederationPlugin({
      name: "app1",
      remotes: {
        app2: "app2@http://localhost:3002/remoteEntry.js",
      },
      shared: ["react", "react-dom"],
    }),
  }
}
// app.jsx
import * as React from "react";
// 加载远程组件
const RemoteButton = React.lazy(() => import("app2/Button"));
const App = () => (
  <div>
    <h1>Typescript</h1>
    <h2>App 1</h2>
    <React.Suspense fallback="Loading Button">
      <RemoteButton />
    </React.Suspense>
  </div>
);
export default App;
```

```jsx | pure
// app2/webpack.config.js
const ModuleFederationPlugin = require("webpack").container.ModuleFederationPlugin;
module.exports = {
  plugins: {
    new ModuleFederationPlugin({
      name: "app2",
      filename: "remoteEntry.js",
      exposes: {
        "./Button": "./src/Button",
      },
      shared: ["react", "react-dom"],
    }),
  }
}
// src/Button.jsx
import * as React from "react";
const Button = () => <button>App 2 Button</button>;
export default Button;
```

## ModuleFederationPlugin

- name: 当前应用名称，需要全局唯一。
- filename: 生成的依赖关系文件名。
- remotes: 可以将其他项目的 name 映射到当前项目中。
- exposes: 表示导出的模块，只有在此申明的模块才可以作为远程依赖被使用。
- shared: 比如项目 A 定义了这个参数为 react，当 A 远程加载项目 B 时，如果 B 也依赖 react 包，则会优先使用项目 A 的 react 包。

## ModuleFederation VS SystemJS VS Dynamic Import(ES6)

### 模块联邦(Module Federation)

> [https://webpack.js.org/concepts/module-federation/](https://webpack.js.org/concepts/module-federation/)

1. Webpack5 动态加载的模块可以是任何的打包格式，不局限于 UMD 模块
2. Webpack5 模块联邦的依赖关系是在编译时确定的，即读取编译时生成的 remoteEntry.js 来分析依赖
3. 只支持 Webpack5 项目

它使不同的 webpack5 项目之间能够运行时动态分享内部模块。

### SystemJS

> [https://zhuanlan.zhihu.com/p/234964127](https://zhuanlan.zhihu.com/p/234964127)

1. SystemJS 动态加载的模块必须是 SystemJS 模块或者 UMD 模块
2. SystemJS 的模块依赖关系是在运行时确定的，即通过 importMap
3. 对 Webpack4/5 都支持

它使不同的项目之间能够运行时动态分享内部模块。

### Dynamic Import(ES6)

> [https://webpack.js.org/api/module-methods/#dynamic-expressions-in-import](https://webpack.js.org/api/module-methods/#dynamic-expressions-in-import)

因为我们大多数项目都是基于 webpack 的，所以经常会使用到 import()，这是 webpack 对 es6 的 dynamic import 的自我实现，本质并不是一个东西，不过用法大多相同。webpack 的 import()具有以下额外特点：

1. webpack 会使用正则分析参数得到文件路径。
   a. 参数必须能被正则分析定位到准确的路径，import(foo)是不行的
   b. 通常使用相对路径或模块名，比如 import(`./locale/${language}.json`)和 import('lodash')
   c. 路径越精确越好
2. webpack 的动态加载目标文件会在编译期间被打包进去，在运行时执行到 import()时再去动态加载这些 chunks。
3. 动态加载的目标文件会经过 loader 处理。
4. ES6 要求目标文件符合 ES6 module 格式，而 webpack 的 import()不需要。
5. 能否直接加载远程链接？待确定。

## 感想

我在看文档学知识时，总是试图把新知识和脑中已有的知识体系关联起来，这对文档的作者是有要求的，通常的文档只会教我们如何使用，不会交代这项技术出现的前因后果（比如是解决什么问题的，为什么五年前没有出现这项技术，和其他同类技术的横行对比等），导致我很难把它和已有的知识体系联系起来。

了解 Webpack5 的 Module Federation 后，有个疑问是使用 webpack5 能否实现微前端？后来想了想，微前端，微前端框架 single-spa，SystemJS，Module Federation，这几个点有重叠的概念存在，就是**模块的运行时共享**。Module Federation 更多是和 SystemJS 概念并列，离实现微前端还差了很多步骤，比如如何运行时管理各子应用，也许未来会出现基于 Webpack5 的 Module Federation 开发的微前端框架。

## References

[https://webpack.js.org/concepts/module-federation/](https://webpack.js.org/concepts/module-federation/)

[https://indepth.dev/posts/1173/webpack-5-module-federation-a-game-changer-in-javascript-architecture](https://indepth.dev/posts/1173/webpack-5-module-federation-a-game-changer-in-javascript-architecture)

[https://github.com/module-federation/module-federation-examples/blob/master/typescript/app1/webpack.config.js](https://github.com/module-federation/module-federation-examples/blob/master/typescript/app1/webpack.config.js)

[https://zhuanlan.zhihu.com/p/234964127](https://zhuanlan.zhihu.com/p/234964127)
