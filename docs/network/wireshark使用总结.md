# wireshark 使用总结

![](@images/wireshark_ui.png)

交互清单中每一行数据代表的是一个数据包，并不是指一次请求，所以多行数据可能代表一次请求过程，比如两行的 source 都为 192.168.1.107，那就说明这两个数据包是同一次请求发送的（也不一定，比如 TCP 的四次挥手中服务端就会连续发送两次请求）。

## 过滤规则

### 可以协议

tcp、udp、arp、icmp、http、smtp、ftp、dns、msnms、ip、ssl、oicq、bootp

### 过滤 IP

```sh
ip.addr == 8.8.8.8
ip.addr == 10.0.0.0/16
# 请求源
ip.src == 8.8.8.8
# 请求目的地
ip.dst == 8.8.8.8
```

### 过滤端口

```sh
tcp.port == 9090
tcp.dstport == 9090
tcp.srcport == 9090
tcp.port >=1 and tcp.port <= 80
```

### 过滤长度

```sh
# tcp data length
tcp.len >= 7
# except fixed header length
ip.len == 88
# fixed header length 8 and data length
udp.length == 26
# all data packet length
frame.len == 999
```

## 过滤 HTTP 数据包

```sh
http.host == xxx.com
# 过滤所有的 http 响应包
http.response == 1
http.response.code == 302
http.request.method==POST
# 过滤 cookie 包含 xxx
http.cookie contains xxx
http.request.uri=="/robots.txt"
# 过滤含域名的整个url
http.request.full_uri=="http://1.com"
# 过滤http头中server字段含有nginx字符的数据包
http.server contains "nginx"
http.content_type == "text/html"
http.content_encoding == "gzip"
http.transfer_encoding == "chunked"
http.content_length_header == "279"
http.content_length == 279
# 过滤HTTP/1.1版本的http包，包括请求和响应
http.request.version == "HTTP/1.1"
```
