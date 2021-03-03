# RESTful 实践总结

> 在 RESTful api 中强调一切皆资源，对资源的操作通过请求头的 method 表示。

## Methods

- GET：读取（Read），成功应返回 200
- POST：新建（Create），成功应返回 201
- PUT：更新（Update），全量更新，成功应返回 200
- PATCH：更新（Update），部分更新，成功应返回 200
- DELETE：删除（Delete），成功应返回 204

## 状态码

- 1xx：相关信息
- 2xx：操作成功
- 3xx：重定向
- 4xx：客户端错误
- 5xx：服务器错误

## 接口错误如何返回

- 方案一：响应头的状态码返回真实值，响应体返回裸数据
- 方案二：响应头的状态码返回 200，在响应体中返回自定义状态码，把数据挂在 data 变量上

```ts
interface ResponseBody {
  code: number;
  message: string;
  data: object;
}
```

两种方案都可以，方案一更符合 RESTful，方案二能够细化状态码应对更多自定义场景。

个人更推荐方案一，因为响应体中的数据就是最终数据，否则还需要在 axios 等请求框架的拦截器中对响应数据作解析，并且 umi 框架会统一处理错误状态码的返回信息并统一弹窗提示。

## 如何声明 API 版本

- 方案一：将版本信息放在 URL 中，虽然破坏了 REST 的架构风格，但是因版本不同而带来的变化在 URL 中就能体现，更加直观。
- 方案二：将版本信息方在 HTTP 请求头、URL 参数甚至消息体中，好处是保持 URL 不变，但是 API 实现者需要解析传递的版本参数调用不同的实现方法。

## 常见问题

- 资源使用单数还是复数？

没有统一的规定，根据实际场景的语义决定，如果可单可复的场景，统一使用复数。

- 多级资源 vs 查询字符串

多级资源：GET /authors/:id/categories/:id，查询字符串：GET /authors/:id?categories=id，后者查询字符串比多级资源更直观和更便于扩展。

- 如何设计不在规范动词中的场景？

如果有 findById(),findByName(),findByFilter()这些场景，那么可以使用查询字符串作补充说明，比如?id=,?name=,?filter=；

如果有个场景要表达 refresh 的语义，比如后端有个 service 是去网上拉取最新的疫情数据，现在要由前端发起这个请求命令，可以是 POST /api/covid19?action=refresh，或是 POST /api/covid19/refresh，或是 POST /api/covid19/action-refresh。

RESTful 是一种风格而不是一个规约，有些动作确实无法转换成名词的形式，用动词也无妨。
