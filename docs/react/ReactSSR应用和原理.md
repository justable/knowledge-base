# ReactSSR 原理及应用

## 引言

在单页应用中，通常在第一次加载时会出现较长白屏时间，主要原因有：

1. 单页应用顾名思义整个应用只有一个页面，因此第一次需要加载较多资源，这个问题可以通过动态导入资源缓解；
2. 大多数单页应用的 dom 是通过 MVVM 框架基于虚拟 dom 渲染出来的，也就是说页面资源加载完毕后还有一个运行时渲染的过程才会产生真实的 dom 节点。

除白屏问题外，单页应用的 html 源代码是不存在应用信息的（因为是运行时渲染出来的），因此搜索引擎的爬虫无法抓取网页有效信息，不利于 SEO。要注意通过配置网页的 title 和 description 并不会提高搜索排名，这两个字段只是向用户提供了更多信息增加用户点击概率，间接作用搜索排名。

服务端渲染（Server Side Rendering）的出现就是为了解决如上问题的。

## 服务端渲染基本思路

单页应用每次刷新页面时，在服务端事先渲染出真实 dom，这样返回浏览器的第一时间用户就能看到网站信息。此时 MVVM 框架的运行时依然会被执行，因为之后应用的交互渲染还是需要 MVVM 框架控制。

以 React 为例，React 为了支持服务端渲染提供了 renderToString、renderToStream 和 hydrate 方法。

- renderToString：能够将 ReactElement 树渲染成 html 字符串，这就解决了在服务端渲染 dom 的问题；
- renderToStream：能够将 ReactElement 树渲染成 html Stream，这样服务端就可以基于流式传输给浏览器，减少 TTFB（浏览器开始收到服务器响应数据的时间） 时长；
- hydrate：会对服务端生成的 dom 结构进行 hydrate 渲染，hydrate 渲染过程会尝试对已有标记（renderToString 会在需要绑定事件的节点做标记）的 dom 节点绑定事件监听器，节省渲染开销，这也是不使用 render 渲染的原因所在，因为 render 会清空容器节点的内容，但在该场景中是不需要的（服务端以生成了 dom 节点）。

**注意点：**在浏览器端使用 hydrate 渲染出来的预期 dom 结构必须和服务端生成的 dom 结构保持一致，否则 React 内部的虚拟 dom 会和真实 dom 不匹配造成 bug。如果执意要在服务端与客户端渲染不同内容，React 提供了两种方法（不建议使用）：

1. 在差异元素上添加`suppressHydrationWarning={true}`标记；
2. 采用双重（two-pass）渲染，在客户端渲染组件时可以读取类似于 this.state.isClient 的 state 变量，然后在 componentDidMount() 里将它设置为 true，不过这种方式会进行额外的渲染操作，因为进行了两次渲染，第一次渲染依然和服务端结构一致，第二次发生变化。

## 如何在服务端得到需要渲染的 ReactElement 树

这可是服务端渲染的基础。

在服务端是可以拿到 routes 文件的，然后根据当前的资源请求匹配得到需要渲染的节点树就可以了，比如使用 react-router-config 库：

```js
import { renderRoutes } from 'react-router-config';
// StaticRouter是react-router-dom提供的在服务端渲染路由的方式
import { StaticRouter } from 'react-router-dom';

const html = renderToString(
  <StaticRouter location={req.path}>{renderRoutes(routes)}</StaticRouter>,
);
```

要注意如果当前的请求路由会触发 redirect，比如`/`redirect 到`/welcome`，那么应该返回`/welcome`的渲染结果。

## 如何在服务端渲染时加载异步数据

传统客户端渲染通常会在 componentDidMount 中加载异步数据，但在服务端渲染场景中，这种方式似乎可以优化了，本身就在服务端了为什么不干脆把异步数据也一并加载了并填充进组件呢？这种优化思路是可行的，我们只需要在组件对象中挂载一个静态的异步加载数据的方法，比如：

```js
Home.getInitialProps = async ctx => {
  return Promise.resolve({
    data: {
      title: 'Hello World',
    },
  });
};
```

然后执行所有命中当前请求的组件的 getInitialProps 方法，所有异步请求都完毕后再将结果以 props 的方式传递给对应组件。

## 如何使用 redux 之类的中央状态库

```js
import { Provider } from 'react-redux';

const store = createStore(reducer);
const html = renderToString(
  <Provider store={store}>
    <StaticRouter location={req.path}>{renderRoutes(routes)}</StaticRouter>
  </Provider>,
);
```

但有个问题，在上一节中我们通过 getInitialProps 提前执行了原本在 componentDidMount 执行的数据请求，那如果原本的逻辑是 componentDidMount 执行数据请求后将结果保存到了 redux 中呢？那么就需要将 getInitialProps 请求得到的数据作为 initialState 传给 redux。我就不想那么多了，这是服务端渲染框架应该考虑的。。。

## 使用 umi3 的 ssr 功能

前文只是对服务端渲染原理进行初步的了解，实际项目中还是使用成熟的框架吧，比如 next.js 和 umi，我这里以 umi3 为例，增加如下配置：

```js
// .umirc.js
export default {
  ssr: {
    devServerRender: false,
  },
};
```

之后构建就会生成 umi.server.js 文件，umi.server.js 文件就是 umi 对服务端渲染的实现（就是我上文讲的那些内容，当然还有其他扩展功能），以下是我基于 Koa 的部分代码：

```js
const staticPath = path.resolve(__dirname, config.ssr.path);
let render: IServerRender;

app.use(async (ctx, next) => {
  const ext = path.extname(ctx.request.path);
  // 符合要求的路由才进行服务端渲染，否则走静态文件逻辑
  if (!ext) {
    if (!render) {
      render = require(path.join(staticPath, 'umi.server.js'));
    }
    const { html, error, rootContainer } = await render({
      // 比如 foo，不能带斜杠
      basename: config.ssr.basename,
      path: ctx.request.url,
    });
    if (error) {
      console.log('----------------服务端报错-------------------', error);
      ctx.throw(500, error);
    } else {
      ctx.status = 200;
      ctx.type = 'text/html';
    }
    if (html instanceof Stream) {
      // 流渲染
      ctx.body = html.on('error', ctx.onerror).pipe(new PassThrough());
    } else {
      ctx.body = html;
    }
  } else {
    await next();
  }
});

app.use(mount(`/${config.ssr.basename}`, require('koa-static')(staticPath)));
```

umi 提供了`isBrower()`方法可以基于执行环境做不同处理。

更多指引可以参考[umi 服务端渲染](https://umijs.org/zh-CN/docs/ssr)。

## 注意点

要注意在服务端会执行的代码不能使用浏览器专属环境变量，比如 window 和 document，可以基于`isBrower()`方法判断处理或把涉及浏览器变量的代码放到 componentDidMount 中执行。

如果是第三方库使用到了浏览器变量，那就需要把第三方库以动态加载的方式引入，这样就不会在服务端执行了，举个例子：

```js
// @/components/CustomScrollbars
import { dynamic } from 'umi';
import { Spin } from 'antd';

export const renderLoading = () => (
  <div style={{ width: '100%', textAlign: 'center', paddingTop: 30 }}>
    <Spin />
  </div>
);

export default dynamic({
  loader: async () => {
    // 这里的注释 webpackChunkName 可以指导 webpack 将 react-custom-scrollbars 组件以这个名字的chunk单独拆分出去
    const { Scrollbars } = await import(
      /* webpackChunkName: "react-custom-scrollbars" */ 'react-custom-scrollbars'
    );
    return Scrollbars;
  },
  loading: () => renderLoading(),
});
```

然后这样使用：

```js
import { isBrowser } from 'umi';
import Scrollbars, { renderLoading } from '@/components/CustomScrollbars';

// 这步判断是必要的，上文讲述hydrate时已经说明服务端渲染结果和客户端渲染结果要保持一致
// Scrollbars由于是动态加载，hydrate执行它时预期渲染的就是renderLoading()的结果
<div>{isBrowser() ? <Scrollbars></Scrollbars> : renderLoading()}</div>;
```

**其他报错信息：**

- Prop dangerouslySetInnerHTML did not match

只有 div 标签 dangerouslySetInnerHTML 属性才能被 SSR 渲染，正常的写法应该是：

```js
// error
<p dangerouslySetInnerHTML={{ __html: '<p>Hello</p>' }} />
// ok
<div dangerouslySetInnerHTML={{ __html: '<p>Hello</p>' }} />
```

- xxx is not defined

这通常就是服务端执行了浏览器专属变量，可以根据错误信息提供的行/列信息，然后在 VSCode 中根据行列查找 umi.server.js 的出错位置。

- [已知 bug](https://github.com/umijs/umi/issues/6653)：不能同时开启 hash，在 pages 下的自定义 document.ejs 的容器节点不能包含子节点，否则不能正常服务端渲染。

- 如果路由不在根目录，除了需要在 umi 中配置 base 路径，还得在 Koa 中执行 render 时添加 basename，参照上文代码。

## 总结

服务端渲染具有 SEO 和增加首屏加载速度的优点，但也会有副作用：

1. 增加项目复杂度，代码参杂了多处执行环境判断逻辑，尤其不适合中后台等业务复杂的项目；
2. 增加了 node 中间层，出现问题不易排查。

因此在不需要 SEO 的项目或对不追求极限首屏加载速度（通过合理的资源拆分和延迟加载已经可以很好的解决该问题了）的项目不建议服务端渲染。

## FAQ

- 如果我希望匹配的路径进入 ssr 渲染，其余静态资源直接托管 nginx 转发，应该怎么做？即替代上述代码的 koa-static 处。

## 参考

https://juejin.cn/post/6844904017487724557
https://github.com/yjdjiayou/react-ssr-demo/blob/master/src/server/render.js
https://umijs.org/zh-CN/docs/ssr
https://github.com/umijs/umi/blob/master/examples/ssr-koa/.umirc.ts
https://github.com/allan2coder/react-ssr
https://www.cnblogs.com/xunxing/p/39481f7f8b0afea05b78fff25529f005.html
https://reactjs.org/docs/react-dom-server.html
https://zhuanlan.zhihu.com/p/47044039
https://www.fullstackacademy.com/
[可以参考 umi.server.js 的实现源码](https://github.com/umijs/umi/pull/4499)
https://github.com/koajs/koa/pull/612
