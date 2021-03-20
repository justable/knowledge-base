# Koa

## 概述

Koa 的 Context 在每次请求时会重新创建，它其实是对 request 和 response 对象的封装，并且加入了些平时常用操作的 API。

那么 Koa.createServer 和 http.createServer 有什么区别呢？

```js
const app = new Koa();
app.listen(3000);
// 是下面的语法糖
const app = new Koa();
http.createServer(app.callback()).listen(3000);
```

## Koa 的剥洋葱架构

见[如何实现洋葱模型](./如何实现洋葱模型.md)。
