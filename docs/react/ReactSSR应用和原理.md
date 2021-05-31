# ReactSSR 应用和原理

## 引言

SSR(Server Side Rendering) 是

## React SSR 渲染

对比 renderToString 和 renderToStream

https://umijs.org/zh-CN/docs/ssr
https://github.com/umijs/umi/blob/master/examples/ssr-koa/.umirc.ts
https://github.com/allan2coder/react-ssr
https://www.cnblogs.com/xunxing/p/39481f7f8b0afea05b78fff25529f005.html
https://reactjs.org/docs/react-dom-server.html
https://zhuanlan.zhihu.com/p/47044039
https://www.fullstackacademy.com/

开坑 SSR，结合 umi 探索原理。

## React Router 的 StaticRouter 和 BrowserRouter

可以参考 umi.server.js 的实现源码，
https://github.com/umijs/umi/pull/4499

## 如果路由发生了 redirect，React.renderToString()会怎么做？

访问 www.demo.com/会 redirect www.demo.com/welcome

## 已知问题

不支持 hash，不支持自定义 document.ejs 模板中挂载点不为空的情况
https://github.com/umijs/umi/issues/6653

## 如果是第三方库可以通过 umi 提供的 dynamic 动态加载组件

```js
import React from 'react';
import { dynamic } from 'umi';

const renderLoading = () => <p>组件动态加载中...</p>;

export default dynamic({
  loader: async () => {
    // 动态加载第三方组件
    const { default: DynamicComponent } = await import(
      /* webpackChunkName: "dynamic-component" */ 'dynamic-component'
    );
    return DynamicComponent;
  },
  loading: () => renderLoading(),
});
```

避免 ssr 渲染时报 did not match.警告，使用时候 ssr 应当渲染相同 loading 组件（React.renderToString()会做服务端渲染结果和客户端渲染结果差异检查，不同就报错？）

```js
import React from 'react';
import { isBrowser } from 'umi';
import DynamicComponent from 'DynamicComponent';

export default () => {
  if (isBrowser()) return <DynamicComponent />;
  return renderLoading();
};
```

## Prop dangerouslySetInnerHTML did not match

只有 div 标签 dangerouslySetInnerHTML 属性才能被 SSR 渲染，正常的写法应该是：

```js
// error
<p dangerouslySetInnerHTML={{ __html: '<p>Hello</p>' }} />
// ok
<div dangerouslySetInnerHTML={{ __html: '<p>Hello</p>' }} />
```

## umi3 的 ssr 配置

- 第一次请求会报 navigator is not defined，再刷新一次就好了；

根据报错指示的行列信息找到 umi.server.js 对应的报错点，vscode 支持行列搜索

- umi3 的配置文件配置 dynamic 参数后，实际请求的资源地址没有 chunk 指纹，但 build 生成的资源是有 chunk 指纹的，导致 404;

- 由于我的资源是挂载在二级路由下的，nodejs 这边是否需要额外配置 router 的 base 参数？我暂时配了 basename 参数，但没在官网找到相关说明。我在.umirc 中是已经配置了 base 参数的；
- 如果我希望匹配的路径进入 ssr 渲染，其余静态资源直接托管 nginx 转发，应该怎么做？即替代上述代码的 koa-static 处。

## Koa 的流响应

https://github.com/koajs/koa/pull/612

React.hybirdRender()

isBrowser()
