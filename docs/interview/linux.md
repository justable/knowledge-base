---
title: Linux
---

## 查看所有网络接口

- ifconfig
- netstat

## 查找文件里符合条件的字符串

- grep
  - grep 字符串 文件名：从文件内容查找匹配指定字符串的行
  - ps -aux | grep 服务名：常配合管道查询

## 查看进程状态

- ps
  - ps -aux | grep 服务名

## 查看磁盘使用情况

- du
  - du -hd 0 node_modules：查看当前目录的 node_modules 占用情况
