# Mongo 镜像

> [官方镜像](https://hub.docker.com/_/mongo)

## 常用 docker 命令

- `docker run -p 27017:27017 --name some-mongo -v /my/own/datadir:/data/db -d mongo`

其中`/data/db`是 mongo 镜像默认的存储点

- `docker exec -it <container id/name> /bin/bash`

进入容器内部环境

## 常用 mongo 命令

> [官方文档](https://docs.mongodb.com/manual/mongo/)

- mongod

启动 mongodb 进程

- mongo

连接已启动的 MongoDB，默认连接 27017 端口。

`--port`可以指定端口。

`--host`可以指定远程 db 地址。

- db

显示当前使用的 database，mongo 默认的 database 是 test。

- `use <database>`

切换指定的 database，如果指定的 database 不存在，则会创建它。

- show dbs

查看当前用户权限范围内的所有 database。

- show collections

查看所有 collections

## FAQ

- 进入 mongo 容器后执行 mongo 提示连接失败

一开始执行 mongo 时提示连接失败，之后在 node 项目中使用 mongoose 成功调用了容器内的 mongodb，再进入 mongo 容器执行 mongo 命令就连接成功了，接下来就可以随意操作 db 了。
