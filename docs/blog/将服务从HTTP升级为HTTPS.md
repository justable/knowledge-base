# 将服务从 HTTP 升级为 HTTPS

## 引言

在 Chrome 浏览器访问 http 网站会有一个不安全的标识，甚是难看。我在编写前文[使用 Wireshark 分析 HTTPS 连接过程](https://www.yuque.com/tingyur/yldon0/ggeq90)时对 HTTPS 有了较为深刻的理解，于是决定将个人网站从 http 升级为 https。

## 开始行动

### 申请证书

先在阿里云购买了 DV 单域名证书免费试用版（DigiCert 机构），之后在控制台的 SSL 证书中申请证书并填写签发表单，阿里云会替我们提交给 CA 签发机构（有了 CA 认证的证书才是有效的），等待电话或邮件通知，最后将证书安装到服务器即可。

### 修改 nginx 配置

将证书上传到服务器的`/etc/nginx/cert`目录，并对 nginx.conf 做如下修改：

```conf
http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    server {
        listen 80;
        server_name tingyur.top www.tingyur.top;
        #将所有HTTP请求通过rewrite指令重定向到HTTPS。
        rewrite ^(.*)$ https://$host$1;
        location / {
            index index.html index.htm;
        }
    }
    server {
        listen       443 ssl http2;
        server_name  tingyur.top www.tingyur.top;
        root html;
        index index.html index.htm;
        #在这里指定证书文件路径。
        ssl_certificate cert/cert-5456735.pem;
        ssl_certificate_key cert/cert-5456735.key;
        ssl_session_timeout 5m;
        #表示使用的加密套件的类型。
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
        #表示使用的TLS协议的类型。
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
        ssl_prefer_server_ciphers on;
    }
}
```

### 将 http/1.x 升级为 http2

http2 相对 http/1.x 有如下优点：

- 二进制分帧：HTTP/2 采用二进制格式（帧）传输数据，而非 HTTP/1.x 的文本格式。多个帧之间可以乱序发送，根据帧首部的流标识可以重新组装
- 多路复用（Multiplexing and Concurrency）：代替原来的序列和阻塞机制，同个域名下的 http 请求只需占用一个 TCP 连接，且每个请求都可以带一个 31bit 的优先值，决定哪些资源可以优先传送。HTTP/1.x 中，如果想并发多个请求，必须使用多个 TCP 连接，现代浏览器为了缓解该状况通常会打开多个并行的 TCP 连接，通常是 2-8 个，不同浏览器不同。但这终究只是缓解，并没有真正解决问题。
- 头部压缩（Header Compression）：Http 头压缩后，节省消息头占用的网络的流量。而 HTTP/1.x 每次请求，都会携带大量冗余头信息，浪费了很多带宽资源。
- 服务器推送（Server Push）：服务端可以在发送页面 HTML 时主动推送其它资源，而不用等到浏览器解析到相应位置，发起请求再响应。例如服务端可以主动把 JS 和 CSS 文件推送给客户端，而不需要客户端解析 HTML 时再发送这些请求。

升级过程还是比较简单的，只需要将 nginx 配置的`listen 443 ssl;`改为`listen 443 ssl http2;`即可，不过前提是操作系统和 nginx 版本都得支持 http2。

可在[我的网站](https://www.tingyur.top/reactcases/eeteig)中预览效果。

## 参考

https://zhuanlan.zhihu.com/p/29609078
