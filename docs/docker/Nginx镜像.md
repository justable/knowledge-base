# Nginx 镜像

> [官方镜像](https://hub.docker.com/_/nginx)

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
