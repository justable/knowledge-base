# Nginx 镜像

> [官方镜像](https://hub.docker.com/_/nginx)

## Installation

```sh
# 拉取镜像
docker pull nginx
# 创建并启动容器
docker run --name prod-nginx -v /usr/local/share/configs/nginx.conf:/etc/nginx/nginx.conf:ro -d nginx
# 进入容器
docker exec -it ruoyi_nginx_1 /bin/bash
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
