# docker-compose

> [参考一](https://docs.docker.com/compose/) > [参考二](https://docs.docker.com/compose/compose-file/) > [参考三](jianshu.com/p/658911a8cff3) > [参考项目](https://github.com/docker/labs/tree/master/beginner/)

## 应用背景

在基于 docker 的工程体系中，会遇到这样一个问题，比如我们写好了一个 node 项目，为了方便使用，将其打包成 docker 镜像，然后基于此镜像启动容器即可，但是如果该 node 项目使用到了 mongodb，而 mongodb 在另一个容器中，那么 node 项目是无法访问到另一个容器中的 mongodb 服务的。当 node 项目运行在宿主机上时，我们通过 localhost 可以正常连接到 mongodb 中，但是当 node 项目运行在容器中时，其 localhost 是容器内部的 localhost 而非宿主机的 localhost，因此无法连接到另一个容器中的 mongodb 服务。

除了上述问题外，当一个工程体系涉及到了多个容器时，如果自己手动管控这些容器，那会相当的麻烦，因此需要一个管控工具来把这些孤立的容器给关联起来。

docker-compose 就是一个这样的工具，由 docker 官方维护。

> 注意：我们直接通过 docker-compose 管控镜像的创建、容器的创建、容器的启动等操作，我们也可以像没使用 docker-compose 时那样使用 docker 命令 build 镜像、创建容器（当然要保证命名和 docker-compose.yml 文件中配置的一样），然后再通过 docker-compose 管控，因为 docker-compose 会使用已存在的镜像或容器。

Docker Compose 将所管理的容器分为三层，分别是工程（project）、服务（service）、容器（container）。Docker Compose 运行目录下的所有文件（docker-compose.yml）组成一个工程，一个工程包含多个服务，每个服务中定义了容器运行的镜像、参数、依赖，一个服务可包括多个容器实例。

## 与 k8s 的区别

![](@images/docker_container_arrangement.jpeg)

## 常用命令

- docker-compose -f docker-compose.yml up

指定文件启动

- docker-compose build SERVICE

构建或者重新构建服务，根据 service.build 和 service.image 参数来构建生成对应的镜像

- docker-compose create SERVICE

为一个服务创建容器但不启动，该命令已过时，使用`docker-compose up --no-start`代替

- docker-compose start SERVICE

启动指定服务的容器（容器必须已经创建）

- docker-compose stop SERVICE

相对于 start，停止一个服务的容器但不会移除它

- docker-compose config

校验或者浏览配置文件

- docker-compose up SERVICE

Builds, (re)creates, starts, and attaches to containers for a service

默认情况下，如果已存在 image，则不会重新 build 镜像（添加--build 参数可以强制重新 build 镜像，但会多出一个名为 none 镜像），如果不存在则会 build 镜像（添加--no-build 参数即使不存在也不会 build 镜像），添加--no-recreate 参数不会重新创建容器

- docker-compose down

停止 containers 并移除有 up 命令创建的 containers、networks、volumes 和 images，定义在 external 中的不会被移除

- docker-compose exec SERVICE COMMAND(/bin/bash)

进入 compose 中的指定 service，等价于 docker exec，不过不用加`-it`参数

- docker-compose kill

通过发送 SIGKILL 信号来停止指定的 service

- docker-compose logs SERVICE

查看服务日志输出

- docker-compose pause SERVICE

暂停一个 service 中的容器

- docker-compose unpause SERVICE

相对于 pause

- docker-compose port SERVICE PRIVATE_PORT

打印绑定的公共端口，`docker-compose port nginx 80`可以输出 nginx 服务 80 端口所绑定的公共端口

- docker-compose ps

列出所有运行容器

- docker-compose images

列出所有已 build 的镜像

- docker-compose pull SERVICE

下载服务对应的镜像，但不会启动这个服务

- docker-compose push SERVICE

如果 service 配置了 build 参数，那么会把它提交到指定仓库（由 image 参数指定）

- docker-compose rm SERVICE

移除指定的处于停止状态的 service 容器，`-v`可以同时删除匿名 volume，如果不指定任何 service 和参数，那么会移除由 up 和 run 命令创建的容器

- docker-compose run SERVICE

在一个服务上执行一个命令

- docker-compose top SERVICE

显示正在运行的进程信息

## 主要参数（不包括 swarm 模式下的参数和不常用参数）

> [官方文档](https://docs.docker.com/compose/compose-file/)。理解这些参数的语境，容器相当于一个封闭的盒子，docker-compose 相当于是把一组容器（或称为 service）包裹起来的又一个封闭盒子，从外部来看，它和单个容器具有相同的特性。
> 注意：创建的 volumes 和 networks 的名称会增加前缀，该前缀默认取当前目录名，可以通过`--project-name`或使用 COMPOSE_PROJECT_NAME 环境变量名修改。

- version：指定 docker-compose.yml 文件的写法格式版本，不同版本的参数集合不同
- services：多个容器集合
  - hostname: 指定域名，系统默认会生成随机值作为域名
  - build：指定一个路径，生成该 service 的镜像，也可以是个对象。如果同时配置了 image 参数，则 Compose 会根据 image 参数为 build 生成的镜像命名
  - image：指定当前服务的镜像，如果同时存在 build 参数，则以 build 为准
  - container_name：自定义容器名称，默认 Compose 会自动创建唯一的名称
  - command：覆盖容器启动后默认执行的命令（即 Dockerfile 文件中配置的启动命令）
  - depends_on：声明当前 service 的依赖 service，依赖容器会先于当前 service 启动（但不保证处于就绪状态）
  - dns：自定义 dns 服务器
  - dns_search：自定义 dns 域名
  - env_file：从指定文件中获取环境变量，优先级低于 environment 参数
  - environment：指定环境变量，可以被程序访问，比如 node 中可以通过 process.env.DB_HOST 访问
  - expose：暴露当前 service 内部端口给需要连接到该 service 的 service，但不暴露给宿主机
  - external_links：在同个 compose.yml 文件启动的容器可以互相访问，但是不同 compose.yml 启动的容器间需要 external_links 来关联
  - extra_hosts:
    - "somehost:162.242.195.82"
    - "otherhost:50.31.209.229"
  - healthcheck：检测当前 service 的健康状况
  - links：关联另一个 service （可以取别名）使得可以和当前 service 交流，但这通常是不需要的，因为 Compose 中的所有 services 默认会在同一个 network 下，可以直接正常交流。这是个遗留参数，未来可能被移除
  - network_mode：定义 service 的网络模式，有 bridge(default)、host、none
  - networks：加入指定网络中，只有处在同一个网络中的 service 才可以互相交流，默认情况下所有 services 都会处在同一个默认网络中
  - ports：暴露端口，HOST_PORT:CONTAINER_PORT 或者单独的 CONTAINER_PORT，HOST_PORT 是给 swarm 等集群使用的，service 间访问的是 CONTAINER_PORT
  - restart：规定 service 的重启策略，支持 no、always、on-failure、unless-stopped 四种模式，默认 no，即永远不重启
  - volumes：规定当前 service 的挂载数据卷，HOST_PATH/VOLUME_NAME:CONTAINER_PATH 或者单独的 CONTAINER_PATH（匿名数据卷，VOLUME_NAME 自动生成），当指定 VOLUME_NAME 时，也就是具名数据卷必须在顶层 volumes 参数中定义 name（会使用已存在的数据卷）
- volumes：顶层数据卷配置，多个 services 可以使用同个数据卷达到共享的效果
- networks：创建自定义网络

```yml
# 创建网络
networks:
  web_common_network:
```

```yml
# 使用已存在的网络
networks:
  web_common_network:
    external: true
    name: my-app-net
```

## Compose 中的 Network

> [官方介绍](https://docs.docker.com/compose/networking/)

Compose 的 services 默认都会被加到同一个 network 中，不同的 service 之间可以直接交流。比如有 web 和 db 两个 service，默认的 network 为 myapp_default，那么这两个 services 会分别加入到 myapp_default.web 和 myapp_default.db 中。

我们可以在 networks 参数中自定义新的网络，并在 service.networks 下指定该 service 所属的 network，只有处于同个 network 下的 service 才可以互相交流。

## 控制启动序列

当使用 docker-compose 的 services 管理多个容器时，需要考虑容器的启动顺序问题，比如一个 webapp 使用到了 database，那么显然 database 需要先于 webapp 启动并处于就绪状态。在 docker-compose.yml 文件中主要有 depends_on, links, volumes_from, and network_mode: "service:..."这些属性控制容器的启动顺序问题，但都无法保证处于就绪状态。官方建议应该在 appliction 中增加处理所依赖容器未正常运行的诊断代码，就 database 而言就是增加重连机制。如果你不想在代码层面处理这些问题，也可以使用执行包裹脚本的方式解决，具体参考[官方介绍](https://docs.docker.com/compose/startup-order/)。

我觉得可以把能够独立运行的服务配置在一个 docker-compose.yml 中，然后先启动这些服务，参考[这篇博客](https://glory.blog.csdn.net/article/details/113938453)。

```

```
