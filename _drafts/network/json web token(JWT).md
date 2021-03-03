# json web token(JWT)

> [原文](http://www.ruanyifeng.com/blog/2018/07/json_web_token-tutorial.html)

## JWT 的诞生

一项技术的诞生必然是为了解决那个时代面临的某个问题。

传统的用户认证流程是客户端发送用户账号密码，服务端接收并存储到 session 中(内存中)，并返回 session_id 并写入到 cookie 中，用户之后的一系列请求都会通过 cookie 把 session_id 传递给服务端。

但是在分布式架构的后端应用中，就会出问题，因为用户的登录信息只会被分配到集群中的某一台服务器中的 session 中，其他服务器无法获取。

一种解决思路是把 session 持久化，集群中的每台服务器都去持久层获取；

另一种解决思路就是干脆在服务端不保存 session 了，而是保存在客户端，客户端每次请求都发回服务端。这必然导致安全问题，JWT 就是来实现此思路的具体方案。
