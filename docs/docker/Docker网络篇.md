# Docker 网络篇

## Docker 的网络通讯模型

[待阅读之 Docker](../unread/待阅读之Docker.md)

### bridge(default)

> https://docs.docker.com/network/bridge/
> Bridge networks apply to containers running on the same Docker daemon host. For communication among containers running on different Docker daemon hosts, you can either manage routing at the OS level, or you can use an overlay network.

容器通过桥接的方式连接宿主网络，此时容器的端口和宿主端口是互相独立的，处在同一个桥接网络下的容器才可以互相访问交流。通过配置容器内端口和宿主端口的映射关系使得容器与外部网络访问畅通。

原理：当 Docker 进程启动之后，它会配置一个虚拟的网桥叫 docker0 在宿主机上，之后 Docker 会在虚拟网桥中分配虚拟的子网给即将启动的容器们。同时虚拟网桥也会分配一个虚拟 IP 给宿主机，表示宿主机在 docker0 上的 IP 地址，这样容器就能通过该 IP 访问到宿主机了。

Docker 容器启动后，将创建一个新的虚拟接口并分配一个网桥子网内的 IP 地址。这个 IP 地址嵌在容器内网络中，用于提供容器网络到宿主机 docker0 网桥上的一个通道。Docker 自动配置 iptables 规则来放行并配置 NAT，连通宿主机上的 docker0，就可以访问宿主机的 mysql 数据文件了。

有了对 bridge 网络的初步了解，我们就能解释为什么容器内部无法通过 localhost 或 127.0.0.1 访问宿主机了，因为 localhost 或 127.0.0.1 代表的是该容器在 docker0 中的 IP。如果要在容器内访问宿主机，需要获取 docker0 中宿主机的虚拟 IP 地址，我们可以通过`ip addr show docker0`来查看宿主机的虚拟 IP 地址，比如：

```shell
root@iZbp1fer9k258ad036ye4bZ:/var/web/ruoyi# ip addr show docker0
3: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default
    link/ether 02:42:23:64:b6:85 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
    inet6 fe80::42:23ff:fe64:b685/64 scope link
       valid_lft forever preferred_lft forever
```

那么我们就可以在容器内通过 172.17.0.1 来访问宿主机了。除了该种方式，也可以选择使用 host 网络直接访问宿主机。

容器内如何访问另一个容器呢？也很简单，同理我们也只需要获取目标容器在 docker0 中的 IP 就可以了，使用`docker inspect containerId`查询容器的虚拟 IP；如果是在 docker-compose 下，还可以直接通过 service 名或容器名访问另一个容器。

### host

容器会与宿主机共用端口号，容器内可以直接访问外部网络。

### none

容器无法连接网络。

## 域名

在 docker compose 中默认会为 service 分配一个随机值作域名，也可以手动指定 hostname 和 extra_hosts，比如：

```yml
version: '3'
services:
  service_redis:
    hostname: service_redis
    container_name: service_redis
    image: redis
    container_name: web_service_redis
    ports:
      - '6379:6379'
    extra_hosts:
      - 'somehost:162.242.195.82'
      - 'otherhost:50.31.209.229'
```

hostname 和[nacos-docker](https://github.com/nacos-group/nacos-docker#common-property-configuration)中的 PREFER_HOST_MODE 参数是什么关系？

不是很明白容器间访问情景中，配置文件的 service_name，hostname，container_name，external_links，networks 参数扮演什么角色？

有点明白了，bridge 网络下，同属一个 network 下的容器间可以通过 对方容器的 hostname 或虚拟 IP 访问，即使容器不在一份 docker compose 配置中。external_links 通常在分离 docker compose 配置文件的场景中使用，A.yml 要获取 B.yml 中的容器，需要先通过 external_links 接入进来，这样就能在环境变量等参数中使用外部容器了。暂时先这么理解吧。

## 参考

https://blog.csdn.net/kevinmeng0509/article/details/94623696
https://blog.csdn.net/weixin_39387961/article/details/112855714
https://blog.csdn.net/Kiloveyousmile/article/details/79830810
