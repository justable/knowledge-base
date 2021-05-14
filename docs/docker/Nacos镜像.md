# Nacos 镜像

## Docker Compose

```
version: "3"
services:
  service_nacos:
    hostname: service_nacos
    container_name: service_nacos
    image: nacos/nacos-server:2.0.0-bugfix
    environment:
      - PREFER_HOST_MODE=hostname
      - MODE=standalone
      - SPRING_DATASOURCE_PLATFORM=mysql
      - MYSQL_SERVICE_HOST=service_mysql
      - MYSQL_SERVICE_DB_NAME=funadmin_config
      - MYSQL_SERVICE_PORT=3306
      - MYSQL_SERVICE_USER=root
      - MYSQL_SERVICE_PASSWORD=a123456
    volumes:
      - ./nacos/log/:/home/nacos/logs
      - ./nacos/init.d/custom.properties:/home/nacos/init.d/custom.properties
    ports:
      - "8848:8848"
    restart: on-failure
    networks:
      - web_common

networks:
  web_common:
    external: true
```

配置参考https://github.com/nacos-group/nacos-docker。
