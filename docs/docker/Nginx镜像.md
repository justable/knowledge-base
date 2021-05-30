# Nginx 镜像

> [官方镜像](https://hub.docker.com/_/nginx)

## Installation

```sh
# 拉取镜像
docker pull nginx
# 创建并启动容器
docker run --name prod-nginx -v /usr/local/share/configs/nginx.conf:/etc/nginx/nginx.conf:ro -d nginx
# 进入容器
docker exec -it service_nginx /bin/bash
```

## Docker Compose

```
nginx:
    image: nginx
    volumes:
      - ./nginx/conf.d/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/log:/var/log/nginx
      - ./html:/usr/share/nginx/html/ruoyi-ui
    ports:
      - "80:80"
    environment:
      - NGINX_HOST=tingyur.top
      - NGINX_PORT=80
```

## 常用 docker 命令

- `docker cp tmp-nginx-container:/etc/nginx/nginx.conf /host/path/nginx.conf`

将容器的 nginx 默认配置拷贝到本机中，同理也可以将本机的配置文件覆盖到容器中

- `docker exec -it <container id/name> /bin/bash`

进入容器内部环境

## 常用 nginx 命令

- nginx -t

验证配置文件是否正确

- nginx -s reload

重启 nginx

## FAQ

- nginx 的 https 服务 proxy_pass 到 http，那客户端实际请求算是 https 还是 http？

- URL 尾部的/需不需要

关于 URL 尾部的/有三点也需要说明一下。第一点与 location 配置有关，其他两点无关。

1. location 中的字符有没有/都没有影响。也就是说/user/和/user 是一样的。
2. 如果 URL 结构是https://domain.com/的形式，尾部有没有/都不会造成重定向。因为浏览器在发起请求的时候，默认加上了/。虽然很多浏览器在地址栏里也不会显示/。这一点，可以访问baidu验证一下。
3. 如果 URL 的结构是https://domain.com/some-dir/。尾部如果缺少/将导致重定向。因为根据约定，URL尾部的/表示目录，没有/表示文件。所以访问/some-dir/时，服务器会自动去该目录下找对应的默认文件。如果访问/some-dir的话，服务器会先去找some-dir文件，找不到的话会将some-dir当成目录，重定向到/some-dir/，去该目录下找默认文件。可以去测试一下你的网站是不是这样的。

- proxy_pass 后的 URL 结尾加斜线(/)与不加的区别

> 准确的来讲是 url 后带资源和不带资源的区别，(/)也属于资源。
> https://segmentfault.com/q/1010000040088105?_ea=135497681

假设访问路径的 /pss/bill.html。

加/斜线的情况：

```
location /pss/ {
  proxy_pass http://127.0.0.1:18081/;
}
```

被代理的真实访问路径为：http://127.0.0.1:18081/bill.html

不加/斜线的情况：

```
location /pss/ {
  proxy_pass http://127.0.0.1:18081;
}
```

被代理的真实访问路径为：http://127.0.0.1:18081/pss/bill.html

- $host和$http_host 的区别

当请求头部有 host 字段时两者没有区别，当请求头部没有 host 字段时前者会取代理服务器的 host，后者为空（代理链的下级会取不到 host）。
