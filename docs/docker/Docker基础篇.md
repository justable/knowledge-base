# Docker 基础篇

## 概述

container 就相当于一个正在运行的进程，它运行在独立的文件系统中，独立于主机和其他 containers。

Dockerfile 中描述了如何为 container 组装一个私人的文件系统。

image 就像是创建 container 的模版，可以通过运行它创建一个新的 container，或者配合 Dockerfile 组装成一个新的 image。

## 分层结构

一个被运行的 image 由多个可读的镜像层组成，通过 Dockerfile 中的 FROM 关键字连接，当启动一个容器时，相当于在 image 上再加了一层可写的容器层。

![](@images/docker_layers.png)

## 容器的数据管控

在容器中的任何写入操作，都只会记录在容器层，这导致所有修改会随容器的销毁而丢失，这就涉及到如何管理容器层的数据--持久化和数据共享，[官方文档](https://docs.docker.com/storage/)中主要列举了 volumes 和 bind mounts 两种方案。

volumes 方案中，数据卷 volume 是独立于容器层的存储机制，它是一个持久存在的可以被不同容器共享的且被 docker 管控的中间存储点（linux 情况下在`/var/lib/docker/volumes`中），可以通过 docker cli 命令管理它，这是官方推荐的方案。

bind mounts 方案和 volumes 方案不同地方在于，它挂载的存储点是自定义的宿主机的绝对路径，无法通过 docker cli 命令管理它。

## Docker Compose

Docker Compose 是 docker 提供的一个命令行工具，用来定义和运行由多个容器组成的应用。使用 compose，我们可以通过 YAML 文件声明式的定义应用程序的各个服务，并由单个命令完成应用的创建和启动。

## Dockerfile 的使用

> [所有指令](https://docs.docker.com/engine/reference/builder/) > [最佳实践](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

```sh
# 指定一个镜像作为父镜像
FROM node:current-slim

# 设置一个工作路径，注意这里的路径不是真实主机中的路径，而是被隔离的虚拟文件系统
WORKDIR /usr/src/app

# 把真实主机当前路径下的package.json拷贝到虚拟文件系统的当前路径WORKDIR下
# 不在这COPY . .是为了更好的利用缓存
COPY package.json .

# 在虚拟文件系统中执行命令
RUN npm install

# 把真实主机中app的剩余文件拷贝到虚拟文件系统中
COPY . .

# 告诉Docker启动容器时监听指定的端口号
EXPOSE 8080

# 在容器中运行指定的命令
CMD [ "npm", "start" ]
```

> 注意单独先`COPY package.json .`是为了更好的利用 docker 缓存，只有当 package.json 发生改变时才会重新安装依赖，如果直接在这`COPY . .`，那么这个项目的任何文件更改都会重新安装依赖，参考[这篇文章](http://bitjudo.com/blog/2014/03/13/building-efficient-dockerfiles-node-dot-js/)。

- ADD

功能和 COPY 类似，额外支持拷贝远程文件到目标地点

- CMD

当执行`docker run`时，CMD 中的命令会被执行，如果定义了 ENTRYPOINT，则会作为参数附加到 ENTRYPOINT 命令后面。

如果`docker run [custom args]`有未被消耗的参数，则会覆盖 CMD。

- ENTRYPOINT

ENTRYPOINT 中的命令会在 `docker run` 时执行，如果`docker run [custom args]`有未被消耗的参数，则会作为参数附加到 ENTRYPOINT 命令后面。

`docker run --entrypoint`可以覆盖 ENTRYPOINT。

> ENTRYPOINT 和 CMD 的区别就是`docker run [custom args]`中未被消耗的参数会附加到 ENTRYPOINT，覆盖 CMD。

- VOLUME

不同于`-v A:B`命令。Dockerfile 的 VOLUME 指令只能创建匿名 volume，不能与宿主机目录进行挂载（为了镜像的可迁移性），相当于`-v B`。

## 缩减打包镜像体积

- 使用 node 的 alpine 版本，关于 alpine 版本的解释参考[这里](https://www.v2ex.com/t/581888)
- 增加 `.dockerigonre` 文件
- 将构建期的依赖放到 devDependencies 中，并使用 npm install --production，就不会打包 devDependencies 中的依赖

## 常用命令

> [所有命令](https://docs.docker.com/engine/reference/commandline/docker/)

- docker pull nginx:latest

拉取镜像，默认 latest 版本

- docker build --tag bulletinboard:1.0 .

会根据同级目录的 Dockerfile 文件创建新的 image

- docker image ls OR docker images

显示本地安装的 image

- docker image rm nginx

删除本地镜像

- docker run -p 8000:8080 -d --name test nginx:latest

启动一个 container（等价于 docker create & docker start），如果本机没有该镜像，则会自动拉取远程镜像到本地。

增加`-p`表示把主机的 8000 端口转发到 container 的 8080 端口。

增加`-d`告诉 docker 在后台运行此 container。

增加`--name`为 container 定义了别名 test。

增加 `--it`（i 和 t 通常一同使用）可以直接进入 container 内部，相当于`docker exec`的效果，注意`-t`后面要加`/bin/bash`，比如`docker run -it --name test nginx /bin/bash`。

增加 `-v` 可以挂载 volume 到容器内的指定目录，实现数据共享和持久化，格式为`-v A:B[:option]`，B 是容器内的绝对路径，option 可以是 ro，设置容器那一端为只读模式，A 则有三种形式：

1. volume 名称
2. 省略，即匿名模式，docker 会随机生成名称
3. 宿主机的绝对路径（[bind-mounts 模式](https://docs.docker.com/storage/bind-mounts/)）

如果不增加-v，那么所有数据都会随着容器的关闭而消失。

增加 `--mount` 作用和 `-v` 类似，参考[这里](https://docs.docker.com/storage/bind-mounts/#choose-the--v-or---mount-flag)。

增加 `--volumes-from` 可以为当前容器挂载另一个容器的 volume，即共用一个 volume，实现数据互通共享。

增加 `--rm` 创建临时容器，会在容器退出时自动删除，同时还会自动删除匿名 volume。

- docker ps

显示正在启动的 container

- docker stop bb

停止运行某个 container

- docker rm --force bb

强制删除某个 container，如果 container 正在运行会先停止它并删除，如果要删除一个已被停止的 container，则不需要`--force`

- docker exec -it `<container id/name>` /bin/bash

进入容器内部，和 docker attach 的区别是后者退出时会停止容器

- docker volume create volumeName

创建 volume，linux 系统下所有 docker 管控的 volume（除了挂载到宿主机自定义路径的 volume）都在`/var/lib/docker/volumes`目录下

- docker volume inspect volumeName

查看指定 volume 的信息

- docker volume rm volumeName

清理指定 volume

- docker volume prune

清理所有没有被容器使用到的 volume

- `docker rmi $(docker images | grep "none" | awk '{print $3}')`

删除 none 的镜像

- `docker stop $(docker ps -a | grep "Exited" | awk '{print $1 }')`

停止匹配项容器

- `docker rm $(docker ps -a | grep "Exited" | awk '{print $1 }')`

移除匹配项容器

- docker inspect containerId

查看容器虚拟 IP 地址

- docker network ls

列出容器所处的网络

- docker network inspect network_name

查看该 network 下都有哪些 container

- docker container inspect containerId/containerName

查看指定 container 的信息

- docker network create -d bridge web_common

创建网络

## 提交本地镜像到 dockerhub

要先登陆 docker

1. docker tag local:1.0 justable/remote:1.0
2. docker push justable/remote:1.0
