# CORS

:::tip
[参考一](https://stackoverflow.com/questions/10636611/how-does-access-control-allow-origin-header-work/10636765#10636765)
[参考二](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
:::

## 引言

CORS 全称是"跨域资源共享"（Cross-origin resource sharing）。跨域问题是浏览器的同源策略导致的，不是 HTTP 协议的一部分，所以它只存在于浏览器。

## 同源策略

同源表示域名（或 IP）、协议、端口都相同，并且只适用于如下 protocol schemes：

- http
- https
- data
- chrome
- chrome-extension

:::tip
file 协议访问 file 协议无论如何都跨域。
:::

## 浏览器判定跨域的流程

1. Browser 请求 Server
2. Server 按需在响应头中返回 Access-Control-Allow-Origin
3. Browser 根据 Access-Control-Allow-Origin 判断当前 origin 是否被包含在内，是则允许此次请求，反之 trigger the XMLHttpRequest's error event and deny the response data to the requesting

### CSRF Tokens

注意 images、scripts、stylesheets、iframes、form submissions 不会触发浏览器的跨域判定，不过我们可以通过 CSRF Tokens 的手段实现跨域拦截。

例子

```html
<img src="third-part website" />
```

Browser 尝试向 url 加载图片，它会发送 GET 请求并发送所有 cookies，为了阻止这种行为，我们需要服务端进行防护措施。通常的做法是，服务端生成一个随机唯一的 token 放到用户 session 中，并发送给 browser，页面请求图片时附带上此 token，最后服务端验证 token 的有效性。

## Node 中的跨域代理 proxyTable

- vue-cli 的 proxyTable 用的是 http-proxy-middleware 中间件
- create-react-app 用的是 webpack-dev-server 内部也是用的 http-proxy-middleware
- http-proxy-middleware 内部用的 http-proxy
