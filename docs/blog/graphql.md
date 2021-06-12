# graphql

## 特点

一种 API 查询语句，会返回与 query 模板相同结构的数据，减少字段冗余和合并多个请求

**协议而非存储**
GraphQL 本身并不直接提供后端存储的能力，它不绑定任何的数据库或者存储引擎。它利用已有的代码和技术进行数据源的管理。比如作为在 BFF 层使用 GraphQL, 这一层的 BFF 并不需要任何的数据库或者存储媒介。GraphQL 只是解析客户端请求，知道客户端的“意图”之后，再通过对微服务 API 的访问获取到数据，对数据进行一系列的组装或者过滤。

## 使用场景

如移动端需要 User 的 a、b、c 三个字段，PC 端需要 b、c、d 三个字段；对于此场景，要么开多个定制化 API 接口,会造成代码冗余，要么一个全信息 API 接口,有接口信息冗余。

造成了不止以下三个痛点：

1. 移动端需要高效的数据加载，被接口冗余字段拖累
2. 多端产品下，API 维护困难
3. 前端新产品快速开发困难，需要大量的后端配合写业务定制化 API

解决以上问题，2012 年 Facebook 在开发中形成了一套规范，就诞生了 GraphQL，并于 2016 年将此规范开源。

## 和 apollo 的区别

apollo 是基于 graphql 的，为了在生产环境快速搭建 graphql 而诞生，它可以配合 Express, Connect, Hapi, Koa 等。

## 和 restful 区别

Request:

```
GET http://localhost/api/users
```

Response:

```
[
  {
    "id": 1,
    "name": "abc",
    "avatar": "http://cdn.image.com/image_avatar1"
  },
  ...
]
```

对于同样的请求如果用 GraphQL 来访问，过程如下：
Request:

```
POST http://localhost/graphql
```

Body:

```
query {users { id, name, avatar } }
```

Response:

```
{
  "data": {
    "users": [
      {
        "id": 1,
        "name": "abc",
        "avatar": "http://cdn.image.com/image_avatar1"
      },
      ...
    ]
  }
}
```

## 和 BFF 的区别

https://zhuanlan.zhihu.com/p/35108457

BFF 是为了接口的裁剪和组装，graphql 算是一种具体实现吧

## 优点

1. 没有字段冗余，查询结果根据 query 模板结构而定，比如：

```js
// 请求
{
    hero {
        name,
        height
    }
}
```

```js
// 返回
{
    hero {
        name:'Luke',
        height:1.72
    }
}
```

2. 获取多个资源只用一个请求

比如有 3 个资源需要获取，用户、产品、订单，那么只需要组装成一个 query 请求模板即可：

```js
query {
    user: getUserInfoByID(userId:1890) {
        userName
        userAge
        mailbox
    }
    products: getProducts(device:web) {
        productName
        productid
        sppu
        price
    }
    orders: getOrdersByUserId(userId:1890) {
        orderId
        orderNo
    }
}
```

3. 代码即文档

graphql 的 schema 语法有清晰的类型系统。

4. 方便的调试工具 GraphiQL

5. 较低的迁移成本

很多人由于考虑到庞大的老系统，从 REST 迁移到 GraphQL 过程中有很高的迁移成本，导致放弃使用 GrqphQL。

这一点是多虑了，第一，graphql 和 rest 是可以两种形式并存的，并不是说使用 graphql 后必须放弃之前的 REST 方式，其实有一部分的场景还是 REST 实现更方便；第二，只要选择或者设计好 graphql 的实现方式，完全可以使用现有的业务代码，可以很快开发出一套 graphql 的版本。

6. 系统可以无感升级

对于 API 的升级，只要不是删字段的情况，服务端的接口增加字段，增加 API 方法对于客户端的使用是没有任何影响的，既不会改变 URI，也不会造成 API 升级带来字段冗余的情况。

## 参考

https://blog.csdn.net/xplan5/article/details/108716321
