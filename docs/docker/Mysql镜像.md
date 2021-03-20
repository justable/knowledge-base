# Mysql 镜像

## Installation

```sh
# 拉去mysql镜像
docker pull mysql
# 创建并启动容器
docker run --name dev-mysql -itd -p 3306:3306 -e MYSQL_ROOT_PASSWORD=a123456 -v dev-mysql:/etc/mysql/conf.d mysql
# 进入容器
docker exec -it dev-mysql /bin/bash
# 进入mysql进程
mysql -u root -p
```
