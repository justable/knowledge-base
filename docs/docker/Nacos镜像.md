# Nacos 镜像

## Docker Compose

```
nacos:
    image: nacos/nacos-server:2.0.0-bugfix
    environment:
      - PREFER_HOST_MODE=hostname
      - MODE=standalone
      - SPRING_DATASOURCE_PLATFORM=mysql
      - MYSQL_SERVICE_HOST=mysqldb
      - MYSQL_SERVICE_DB_NAME=ry-config
      - MYSQL_SERVICE_PORT=3306
      - MYSQL_SERVICE_USER=root
      - MYSQL_SERVICE_PASSWORD=a123456
    volumes:
      - ./nacos/log/:/home/nacos/logs
      - ./nacos/init.d/custom.properties:/home/nacos/init.d/custom.properties
    ports:
      - "8848:8848"
    depends_on:
      - mysqldb
    restart: on-failure
```

配置参考https://github.com/nacos-group/nacos-docker。
