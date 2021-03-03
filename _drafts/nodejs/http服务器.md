# http 服务器

在 Node 中可以通过 http、https、http2 三个内置包创建服务器，以 http 包为例。

```javascript
function compose(middleware) {
  if (!Array.isArray(middleware))
    throw new TypeError('Middleware stack must be an array!');
  for (const fn of middleware) {
    if (typeof fn !== 'function')
      throw new TypeError('Middleware must be composed of functions!');
  }
  return function(context, next) {
    // last called middleware #
    let index = -1;
    return dispatch(0);
    function dispatch(i) {
      if (i <= index)
        return Promise.reject(new Error('next() called multiple times'));
      index = i;
      let fn = middleware[i];
      if (i === middleware.length) fn = next;
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}
```

```javascript
import http from 'http';
import compose from 'koa-compose';

const port = 3000;
const middleware = [];
const handleRequest = (ctx, fnMiddleware) => {
  // handle request, like express or koa
  fnMiddleware(ctx);
};
const requestListener = (req, res) => {
  // encapsulates own context for per requrest
  const fn = compose(middleware);
  const ctx = createContext(req, res);
  handleRequest(ctx, fn);
};
const use = fn => {
  middleware.push(fn);
};
const server = http.createServer(requestListener);
server.listen(port, () => console.log(`now listening on port ` + port));
```

以上就是很简单的 http 服务器的创建流程，我简单模拟了 Koa 的结构，通常 Koa 是这么使用的，

```javascript
import Koa from 'koa';

const port = 3000;
const app = new Koa();
// push middleware
app.use((ctx, next) => {});
http
  .createServer(app.callback())
  .listen(port, () => console.log(`now listening on port ` + port));
// below is a syntactic sugar
app.listen(port, () => console.log(`now listening on port ` + port));
```

最后再来看看 express 的用法，

```javascript
import express from 'express';

const port = 3000;
const app = express();

app.get('/', (req, res) => res.send('Hello World!'));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
```

总的来讲，Koa 或 express 至少对内置 http 的封装，主要封装了 requestListener 部分，并提供了 middleware 来进行扩展。
