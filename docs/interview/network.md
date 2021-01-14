---
title: Network
order: 4
---

## 网络安全威胁及防范

> 详见[https://eggjs.org/zh-cn/core/security.html](https://eggjs.org/zh-cn/core/security.html)

- XSS 攻击：对 Web 页面注入脚本，使用 JavaScript 窃取用户信息，诱导用户操作。
- CSRF 攻击：伪造用户请求向网站发起恶意请求。
- 钓鱼攻击：利用网站的跳转链接或者图片制造钓鱼陷阱。
- HTTP 参数污染：利用对参数格式验证的不完善，对服务器进行参数注入攻击。
- 远程代码执行：用户通过浏览器提交执行命令，由于服务器端没有针对执行函数做过滤，导致在没有指定绝对路径的情况下就执行命令。

## 跨域及解决

协议，域名，端口，三者有一不一样，就是跨域。

1. CORS，在服务器端设置几个响应头
2. 在 nginx 等反向代理服务器中设置为同一域名

## Cookies 有哪些字段

> 详见[https://zhuanlan.zhihu.com/p/172533051](https://zhuanlan.zhihu.com/p/172533051)

- name
- value
- domain
- path
- expires/max-age
- size
- httpOnly
- secure
- sameSite
- priority
