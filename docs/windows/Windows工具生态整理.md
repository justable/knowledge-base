# Mac 工具生态整理

> 吾爱破解

## Java 相关

- jdk

下载地址：http://www.oracle.com/technetwork/java/javase/downloads/
默认安装 Path：/Library/Java/JavaVirtualMachines/jdk1.8.0_144.jdk/Contents/Home

- maven
- tomcat

## 数据库相关

- Navicat

Navicat Premium 15.0.14 版本之后无法用这激活方法。激活过程https://www.52pojie.cn/thread-1101529-1-1.html。

序列号：NAV8-PGTU-EC2G-T77R
激活码：miWHRzjoiCb8EQFZT211APfgvEfvZ5Rv8tvSDUScILL/fo2ywEaVDBIx4EbAbkteDUEgm5kh3CUl0sm4U448RGUq8W70Pg7QjcS8MJA0Dhxjgr5nyZZiTyeSn6d1cEOxVcnzy2FOxQ6+pq/7f8Vm0qo6vQ1jyHLnP//nEmh7OM+US59prb9i3jL+amWvzI+RZwGssv421+sCsjajL7y9y/mJKaw2Cop4wjEt+/BryD55x9f3fiwCAUPVnOIrbI99XIXILcTKFOq2xqd6Iv8ra0uHYeS3A0H4oQg3LELEvWb14cClFT4H1liyz1RfHMOqaLzzLaV7EEuzEYhNKfctMg==

- Power Designer

https://www.52pojie.cn/thread-1334107-1-1.html

- mysql

https://dev.mysql.com/downloads/mysql/

1. 解压后的目录中是没有的 my.ini 文件的，自行添加的 my.ini，写入以下数据

```
[mysqld]

port=3306

basedir=C:\Program Files\MySQL

datadir=C:\Program Files\MySQL\Data

max_connections=200

max_connect_errors=10

character-set-server=utf8mb4

default-storage-engine=INNODB

#mysql_native_password

default_authentication_plugin=mysql_native_password

[mysql]

default-character-set=utf8mb4

[client]

port=3306

default-character-set=utf8mb4
```

2. mysqld --initialize --console
   记住临时密码！！！
3. mysqld --install mysql
4. net start mysql
5. mysql -u root -p
6. ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';
