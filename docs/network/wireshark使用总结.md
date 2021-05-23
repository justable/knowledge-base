# wireshark 使用总结

![](@images/wireshark_ui.png)

交互清单中每一行数据代表的是一个数据包，并不是指一次请求，所以多行数据可能代表一次请求过程，比如两行的 source 都为 192.168.1.107，那就说明这两个数据包是同一次请求发送的（也不一定，比如 TCP 的四次挥手中服务端就会连续发送两次请求）。

## 过滤规则

### 可以协议

tcp、udp、arp、icmp、http、smtp、ftp、dns、msnms、ip、ssl、oicq、bootp

### follow tcp stream

```sh
# 这里的4只是wireshark给tcp流的一个编号。tcp流是可以用一对(ip,port)来限定的
tcp.stream eq 4
```

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

## 抓取 HTTPS 明文包

通常在抓取 HTTPS 包时会 Protocol 栏会显示 TLS，在 Info 栏中显示 Application Data，这应该是 Wireshark 通过数据包的信息来显示 Protocol 的，http 是 TLS 的上层协议，数据包经过 TLS 层后已经加密过了，无法从数据包中分析出 HTTP 关键字。

https://segmentfault.com/a/1190000023568902?utm_source=tag-newest

1. 通过网站的私钥：如果你想抓取的网站是你自己的，那么可以利用这种方式，因为这需要使用网站生成证书使用的私钥进行解密，就是那个 nginx 上配置的 ssl_certificate_key 对应的私钥文件，把它添加到 wireshark 配置中。不过这种方法貌似只支持 TLS 加密套件类型是 RSA 的情况，不支持 ECDHE 等。
2. 通过浏览器的 SSL 日志功能：目前该方案只支持 Chrome 和 Firefox 浏览器，通过设置 SSLKEYLOGFILE 环境变量，可以指定浏览器在访问 SSL/TLS 网站时将对应的密钥保存到本地文件中，有了这个日志文件之后 wireshake 就可以将报文进行解密了。
