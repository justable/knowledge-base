# 本机请求本机 IP 会走互联网吗

如下属于本机在不同网络中的 IP，本机请求它们有什么区别，需要走网卡吗？

1. localhost/127.0.0.1（不需要）
2. 局域网：192.168.1.1（不需要）
3. 公网 IP：38.15.16.155（需要）

比如 nginx 监听 443 端口，并 proxy_pass 给本机的 http://myhost.com 服务，对于浏览器来说建立的传输通道是 https 还是 http？nginx proxy_pass 给本机的 http 服务需要走网卡吗？如果 proxy_pass 给另一台机器的 http://otherhost.com 服务，证书由 nginx 提供还是另一台机器？假如 proxy_pass 的两端都是 https 服务，那么两段 https 请求的响应方都需要提供证书吗？

本机的报文的路径是这样的：
应用层-> socket 接口 -> 传输层（tcp/udp 报文） -> 网络层 -> back to 传输层 -> backto socket 接口 -.> 传回应用程序。然后就没有介质访问控制层/数据链路层/物理层什么事了。
