# HTTP 的认证体系

> [原文](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication)

## 概述

HTTP authentication framework 为 client 和 server 的交流提供安全保障。

这一认证过程如下图所示：

![image.png](https://cdn.nlark.com/yuque/0/2020/png/467908/1606287893550-9204d4bb-62b7-4184-b549-68b6406d838a.png#align=left&display=inline&height=305&margin=%5Bobject%20Object%5D&name=image.png&originHeight=335&originWidth=710&size=43483&status=done&style=none&width=647)
在上图，server 的第一次 response 中 WWW-Authenticate: <type> realm=<realm>，告诉 client 如何提供 credentials，Basic 是 Authentication schemes 中的一种；client 按指示回应对应的信息 Authorization: <type> <credentials>。

## Authentication schemes

- Basic
- Bearer：bearer tokens to access OAuth 2.0-protected resources
- Digest
- HOBA
- Mutual
- AWS4-HMAC-SHA256

### Basic

- 例子：Authorization: Basic ODQ4Y2Q0OGEyNDE5NGNmOTg2OGIzYjg4YTQyY2JhNzM6WmpiWlp5Z3BSMU92NVRkT3lvamlZemUzaFI1SEtqdXE=

Basic 规定将`username:password`字符串通过 base64 加密后作为 request header 的 Authorization 字段，但是因为 base64 是可逆的，所以存在安全问题。如果使用 Basic，需要乘载在 HTTPS 中来提高安全性。

### Bearer

- 例子：Authorization: Bearer CNUn7CHbLqrPAYXyMnhAUK89nJfCT239IB

Bearer 则是通过 OAuth2 得到 access_token 作为 Authorization 的值。
