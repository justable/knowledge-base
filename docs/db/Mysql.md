# Mysql

> [文档](https://dev.mysql.com/doc/refman/8.0/en/)

## 基本命令

mysql 的命令行末尾需要加分号;。

- SHOW DATABASES;

显示所有 db。

- select database();

显示当前的数据库

- select version();

查看版本。

- use [dbname];

进入指定 db。

## 扩展命令

- select host,user,authentication_string from mysql.user;

查询 mysql 库的 user 表的数据。

## FAQ

### 字符集选择

utf8 或者 utf8mb4(未来趋势)。utf8mb4 兼容 utf8，且比 utf8 能表示更多的字符。至于什么时候用，看是做什么项目了，[unicode 编码区](https://www.cnblogs.com/sxdcgaq8080/p/9932786.html)1 ～ 126 属于传统 utf8 区，当然 utf8mb4 也兼容这个区，126 行以下就是 utf8mb4 扩充区，什么时候你需要存储那些字符，你才用 utf8mb4，否则会浪费空间。

### 排序规则选择

排序一般分为两种：utf_bin 和 utf_general_ci。

utf8_general_ci: 不区分大小写，校对速度快，但准确度稍差（准确度够用，一般建库选择这个）。
utf8_general_cs: 区分大小写。
utf8_unicode_ci: 和 utf8_general_ci 对中、英文来说没有实质的差别，相对准确度更高，但校对速度稍慢。
utf8_bin: 字符串每个字符串用二进制数据编译存储，区分大小写，而且可以存二进制的内容。

### MySQL 里默认的几个库是干啥的？

- information_schema

保存着关于 mysql 服务器所维护的所有其他数据库的信息，如数据库名，数据库的表，表栏的数据类型与访问权限等
也就是说当你建立一个新的数据库，或者在已有的数据库中增删改表的话，都会记录在 information_schema 库中。

- mysql

存储数据库的用户、权限设置、关键字等 mysql 自己需要使用的控制和管理信息。

- performance_schema

主要用于收集数据库服务器性能参数。

- sys

一个简单版的 performance_schema。

### 为什么 mysql.user 表中有两个 root 用户

在 mysql 中，用户名由两部分组成：user 和 host，我们看到两个 root 是 user 部分相同，但是 host 并不同。

### mysql.user 表中 host 列的含义

host 指定了允许用户登录 MySQL 所使用的 IP 地址。主要有下面这几种形式。

- %：表示可以远程登录，并且是除服务器外的其他任何终端
- localhost：表示可以本地登录，即可以在服务器上登录
- 127.0.0.1：表示可以本机登录，即可以在服务器上登录
- sv01：表示主机名为 sv1 可以登录，sv01 具体指的哪台机器，可以在 cat /etc/hostname 查看
- ::1：表示一个 IPv6 地址，等同于 ipv4 的 127.0.0.1，表示本机可以登录

## troubleshooting

### Navicat: Client does not support authentication protocol requested by server; consider upgrading MySQL client

Navicat 版本过久，mysql8 之前的版本中加密规则是 mysql_native_password，而在 mysql8 之后加密规则是 caching_sha2_password。解决方法：

1. 升级 Navicat，但是 Navicat 是收费的，破解麻烦。
2. 把用户密码登录的加密规则还原成 mysql_native_password 这种加密方式，具体操作参考[这里](https://blog.csdn.net/yubin1285570923/article/details/83352491)。

### Specified key was too long; max key length is 767 bytes

在 mysql5.6 版本以下，索引键前缀限制默认为 767byte，且当数据库的字符集为 utf8mb4 时，utf8mb4 规定 4byte 表示一个字符，那么 `varchar(255)=1020>767`，因此报错。当数据库的字符集为 utf8 时，utf8 规定 3byte 表示一个字符，那么 `varchar(255)=765<767`，不会报错。我们可以开启 innodb_large_prefix，这样索引键前缀限制就会变为 3072byte。

## this is incompatible with sql_mode=only_full_group_by

执行`select @@global.sql_mode;`，把结果中的 ONLY_FULL_GROUP_BY 去掉，加到 my.ini 文件的`[mysqld]`下，重启 mysql 服务。

sql_mode=STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
