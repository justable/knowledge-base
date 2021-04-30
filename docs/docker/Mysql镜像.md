# Mysql 镜像

## Installation

```sh
# 拉去mysql镜像
docker pull mysql
# 创建并启动容器
docker run --name dev-mysql -itd -p 3306:3306 -e MYSQL_ROOT_PASSWORD=a123456 -v dev-mysql:/etc/mysql/conf.d mysql
# 进入容器
docker exec -it ruoyi_mysqldb_1 /bin/bash
# 进入mysql进程
mysql -u root -p
```

## Docker Compose

```
mysqldb:
    image: mysql
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=a123456
    volumes:
      - ./mysql/init.d:/docker-entrypoint-initdb.d
      - ./mysql/db:/var/lib/mysql
    restart: on-failure
```

## 初始化表

mysql 镜像在创建容器时会执行/docker-entrypoint-initdb.d 目录下的文件，我们只需要把 sql 文件通过 volume 同步进容器即可。

要注意的是 mysql 镜像只会在/var/lib/mysql 为空时才会执行初始化，如果我们希望重新执行/docker-entrypoint-initdb.d，得把./mysql/db 清空，参考[Stackoverflow 解答](https://stackoverflow.com/questions/38504257/mysql-scripts-in-docker-entrypoint-initdb-are-not-executed)。

```
mysqldb:
    image: mysql
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=a123456
    volumes:
      - ./mysql/init.d:/docker-entrypoint-initdb.d
      - ./mysql/db:/var/lib/mysql
    restart: on-failure
```
