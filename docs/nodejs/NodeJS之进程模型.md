# NodeJS 之进程模型

> 本文讨论的是在 Linux 系统下的场景

- 一个进程可以监听多个端口吗？

可以，一个进程可以创建多个 socket 来监听多个端口。

- 多个进程可以监听同个端口吗？

可以，

- 进程、线程、协程

- linux 没有线程，只有子进程

- Node 句柄传递

- 单线程，事件驱动模型

https://juejin.im/post/5e71164d6fb9a07ce31f05e9
https://juejin.im/post/5e7732aa518825492e497fe0
https://github.com/ponkans/F2E
