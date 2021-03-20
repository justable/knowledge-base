# NodeJS 之 Debug

> [原文](https://nodejs.org/en/docs/guides/debugging-getting-started/)

## 调试模型

NodeJS 的调试模型有两个组成部分：

1. 调试进程：对程序有着控制权，监听 host+port，接收来自客户端的指令信息
2. 调试客户端：通过 host+port+UUID，向调试进程发起具体指令

## 开启调试模式

- node --inspect xxx.js

此命令会开启一个 debug 进程，并且标识唯一的 UUID，默认监听 127.0.0.1:9229。

## 安全性

因为调试进程有着对程序执行环境完全的控制权，这就导致了恶意攻击者可以通过访问指定的 host+port 向调试进程发起指令进而控制该程序。

所以我们应该避免让调试进程监听 Public IP 或 0.0.0.0。

## 远程调试

1. 远程服务器执行 node --inspect server.js
2. 本地执行 ssh -L 9221:localhost:9229 user@remote.example.com（表示将本地的 9221 端口信息转发到远程服务器的 9229 端口），建立一个 ssh 隧道，之后将调试客户端 attach 到 localhost:9221，参考后文的浏览器或 VSCode 方案调试

![](@images/nodejs_debug_remote.png)

## 常见调试客户端

### 浏览器

1. 执行`node --inspect`命令
2. 在浏览器中打开`chrome://inspect`，点击指定调试进程的 inspect 按钮

![](@images/nodejs_debug_chrome.png)

### VSCode

跳转[文章](../../article/在VSCode中debug.md)

## 常见命令

- --inspect
  - Enable inspector agent
  - Listen on default address and port (127.0.0.1:9229)
- --inspect=[host:port]
  - Enable inspector agent
  - Bind to address or hostname host (default: 127.0.0.1)
  - Listen on port port (default: 9229)
- --inspect-brk
  - Enable inspector agent
  - Listen on default address and port (127.0.0.1:9229)
  - Break before user code starts
- --inspect-brk=[host:port]
  - Enable inspector agent
  - Bind to address or hostname host (default: 127.0.0.1)
  - Listen on port port (default: 9229)
  - Break before user code starts
- node inspect script.js
  - Spawn child process to run user's script under --inspect flag; and use main process to run CLI debugger
- node inspect --port=xxxx script.js
  - Spawn child process to run user's script under --inspect flag; and use main process to run CLI debugger
  - Listen on port port (default: 9229)
