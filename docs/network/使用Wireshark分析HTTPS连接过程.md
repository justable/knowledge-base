# 使用 Wireshark 分析 HTTPS 连接过程

## 引言

我们应该都知道 HTTPS 是在 HTTP 的基础上，增加了 TLS/SSL 层，其主要目的有三个：

1. 数据保密性：保证数据内容在传输的过程中不会被第三方查看；
1. 数据完整性：及时发现被第三方篡改的传输内容；
1. 身份校验安全性：保证数据到达用户期望的目的地。

本文主要讲述 TLS 协议部分。

## 实验说明

我通过本地浏览器访问个人服务器为例。

| 对象      | IP            |
| --------- | ------------- |
| Client IP | 192.168.1.107 |
| Server IP | 8.136.182.56  |

## 连接过程

整个连接会分为几个步骤：

- TCP 三次握手
- TLS 握手，主要就是证书验证和密钥协商
- 最终的应用数据交换

​

下图是通过本地 Chrome 浏览器访问个人服务器的一个静态页面的完整数据包：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1621684019260-7b158965-06be-4919-ab93-91b6659ca588.png#clientId=ude7bb4e5-58b4-4&from=paste&height=324&id=ua9c1830e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=324&originWidth=1239&originalType=binary&size=66288&status=done&style=none&taskId=u0c998720-0744-407c-b022-a1b08171d8b&width=1239)

### TCP 的三次握手

![image.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1621685113987-140ed0ff-af4f-4655-95fa-57401e9f7711.png#clientId=u6374b4fb-5569-4&from=paste&height=66&id=u79071bb2&margin=%5Bobject%20Object%5D&name=image.png&originHeight=66&originWidth=1242&originalType=binary&size=14717&status=done&style=none&taskId=u135f8d4d-31d8-466f-a71c-36e85a70c91&width=1242)
HTTP 就是基于 TCP 连接的，这没什么好说的。
​

### TLS 过程 Client Hello

![image.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1621594166587-bf1480ab-0844-4b2e-a660-762722619ed4.png#clientId=ude7bb4e5-58b4-4&from=paste&height=37&id=u73de148e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=37&originWidth=768&originalType=binary&size=4961&status=done&style=none&taskId=ub930323d-29c7-4964-a30e-02d7ecc5d2a&width=768)
![image.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1621594247274-5018e54b-40ee-4e9d-b48d-da9080cff901.png#clientId=ude7bb4e5-58b4-4&from=paste&height=693&id=ubec2066a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=693&originWidth=771&originalType=binary&size=60565&status=done&style=none&taskId=ucb3ab347-1354-4e25-9398-82610c9c72f&width=771)
**概述：**
这一步主要就是 Client 向 Server 交代一些自身的信息，比如支持哪些算法之类的。
**​**

**部分字段说明：**

- Session ID: 在中断重连场景中，为了避免重新握手，每次请求对话都携带上 SessionID，如果服务器存有此 SessionID 记录的话，双方就可以重新使用已有的对称密钥而不必重新生成一把。不过要注意如果是双方近期的第一次对话，那么 SessionID 是空的，会在后面几个环节中生成。但这种服务器缓存的策略在分布式的负载均衡场景上就无法正常运行。于是在 TLS1.3 中没有了 SessionID 这种会话恢复模式不过为了兼容性依然保留了这个字段。
- session_ticket：session_ticket 就是为了解决 SessionID 这个问题的，目前只有 Firefox 和 Chrome 浏览器支持。
- Cipher Suites：密文族表示 Client 支持的算法，比如 TLS_RSA_WITH_AES_128_GCM_SHA256 表示 TLS 为协议，RSA 为密钥交换的算法，AES_128_GCM 是对称加密算法（其中 128 是密钥长度，GCM 是分组方式），SHA 是哈希算法来确保数据完整性。
- supported_versions：支持的协议版本，比如 TLS 1.2 版。
- supported_groups：表明了 Client 支持的用于密钥交换的命名组，优先级从高到低。
- psk_key_exchange_modes：描述 PSK 密钥协商模式。
- Random：一个客户端生成的随机数 **RandomC**，稍后用于生成"对话密钥"。
- compress_certificate：支持的压缩算法。
- signature_algorithms：支持的签名算法。
- server_name：当我们去访问一个站点时，一定是先通过 DNS 解析出站点对应的 ip 地址，最终通过 ip 地址来访问站点，而一台 server 很可能部署多个站点，因此如果没有 server_name 这个字段，server 无法识别这是访问的哪个站点也就无法给与客户端相应的数字证书，此例中为我的个人服务器域名 www.tingyur.top。

### TLS 过程 Server Hello 和 传递证书

![image.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1621606113153-a9677c40-3b32-4db6-b7c6-460a3a3a0067.png#clientId=ude7bb4e5-58b4-4&from=paste&height=78&id=ud7cf145a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=78&originWidth=1094&originalType=binary&size=14046&status=done&style=none&taskId=u3dc50374-eccf-439e-9e7c-b096d30934b&width=1094)![image.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1621609176785-b7d33039-c611-4fa0-a30d-bad62f1217f7.png#clientId=ude7bb4e5-58b4-4&from=paste&height=280&id=u96fd0698&margin=%5Bobject%20Object%5D&name=image.png&originHeight=280&originWidth=658&originalType=binary&size=22695&status=done&style=none&taskId=ubda065cc-74be-4f26-90cd-254906f8b79&width=658)![image.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1621609263770-cf7f9b2b-9a91-4a53-823d-c0a1a507fea3.png#clientId=ude7bb4e5-58b4-4&from=paste&height=286&id=u9e778c0f&margin=%5Bobject%20Object%5D&name=image.png&originHeight=286&originWidth=989&originalType=binary&size=28369&status=done&style=none&taskId=u910bd2c3-ee00-4c6f-9b7b-f4513c8a1c0&width=989)
**概述：**
这一步主要就是 Server 在 Client 提供的支持集里选择一个选项，同时把证书传送给 Client。这里要额外说明下，对于基于 RSA 算法的密钥协商，Client 会从证书提取公钥并完成证书的身份验证；本实验是基于 ECDHE 算法协议的，证书只用来让 Client 做身份验证，其中不包含公钥，之后会额外发送 Server Key Exchange 数据包来传递公钥，这是我在 Nginx 配置的 ssl_ciphers（加密套件类型）参数决定的。
**​**

**部分字段说明：**

- Session ID：在 Server Hello 中，SessionID 可以有 3 种情况。
  - 使用 client hello 里的 sessionID 表示我找到上次的缓存记录并希望延用次 SessionID
  - 新的 SessionID
  - 空，服务端不希望 SessionID 被恢复，本实验中就是这种情况
- Cipher Suite：Server 在 Client Hello 的 Cipher Suites 密文族中选择了一条**TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256**。
- Random：一个服务器生成的随机数 **RandomS**，稍后用于生成"对话密钥"。
- Certificates：服务器证书，这是我在阿里云领的免费 DV 证书。在浏览器左上方的锁型按钮中可以查看证书。
- Compression Method: 选择的压缩方法，本实验为 null。

**TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256 说明：**
**​**

- ECDHE_RSA：密钥协商交换算法
  - ECDHE：使用基于椭圆曲线签密方案（EC, Elliptic Curve）的 Diffie-Hellman（DH）密钥协商协议。尾部的 E 为 Ephemeral 首字母，表示协商的是临时会话密钥。相对每次会话协商的临时密钥，证书中的公钥则是永久的（long-term）。
  - RSA：证书公钥加密算法，用于对证书数据部分的散列值进行签密、对 ECDHE 交换参数（的 HASH 值）进行签密。可能替换值为 ECDSA（椭圆曲线数字签名算法）。
- AES_128_GCM：传输会话（对称）加解密使用 GCM 模式的 AES-128 算法。
  - AES_128：使用 128 位的会话对称加密算法，双方通过 ECDHE 交换参数协商出对称密钥。
  - GCM：Galois 计数器模式（Galois/Counter Mode）。消息认证码（MAC，Message Authentication Code）用于保障消息的完整性，防止各种伪造。AES-CMAC 使用分组密码，取代 HMAC 的加密散列函数。Galois 消息认证码（GMAC）则采用了 AES 算法的一种特殊模式。
- SHA256：消息认证码算法，基于有密钥的加密散列函数，用于创建消息摘要/指纹。使用安全散列算法 2（SHA-2）生成 256 字节的摘要，确保消息的完整性（没有被篡改）。

​

关于 Cipher Suites 可参考《[TLSPARAMS - Cipher Suites](http://blog.csdn.net/phunxm/article/details/72852770)》。

> 主流加密算法趋势是 AES（128/256），加密模式的趋势是 GCM。GCM 是一种特殊的称为 AEAD 的加密模式，不需要配合 MAC。
> 这里要注意下如果非对称密钥协商算法是 DHE/ECDHE 会有 Server Key Exchange 这一步，如果是 RSA/DH/ECDH 算法则不会有 Server Key Exchange 这一步。

​

### TLS 过程 Client 应答 Server

![image.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1621610761152-45683bb9-e24b-430f-b6ae-e68fb4854734.png#clientId=ude7bb4e5-58b4-4&from=paste&height=39&id=u61aad4cf&margin=%5Bobject%20Object%5D&name=image.png&originHeight=39&originWidth=1028&originalType=binary&size=7576&status=done&style=none&taskId=u899fa835-fc3f-472b-bac9-a7b7391754a&width=1028)
这只是一个 ACK 包，这里专门提一下，后文就直接忽视它们了。
​

### TLS 过程 Server Key Exchange 和 Server Hello Done

![image.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1621610857401-6c8624f1-0dc7-492c-982b-f4dc66f51e2d.png#clientId=ude7bb4e5-58b4-4&from=paste&height=36&id=u556083a4&margin=%5Bobject%20Object%5D&name=image.png&originHeight=36&originWidth=932&originalType=binary&size=5865&status=done&style=none&taskId=u0868eba5-6c1e-4650-825c-9fbae78dd79&width=932)![image.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1621668587904-5346437a-df8c-405f-83ef-3b9ee2c41b3a.png#clientId=ude7bb4e5-58b4-4&from=paste&height=319&id=uce6b74d3&margin=%5Bobject%20Object%5D&name=image.png&originHeight=319&originWidth=566&originalType=binary&size=26853&status=done&style=none&taskId=ub63c0ba3-3ba8-4832-a472-5617914203c&width=566)
**概述：**
由于 TLS 加密套件类型是 ECDHE，所以会通过这一步单独传送公钥。
**​**

**部分字段说明：**

- EC Diffie-Hellan：携带了 ECDHE 密钥协商协议所需的参数，用于 Client 生成 Pre-Master Secret。
- Signature：签名，用来验证证书的完整性和真实性。

### TLS 过程 Client Key Exchange

![image.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1621612986019-617c8a66-a2d3-4c91-b763-3986b147a7d2.png#clientId=ude7bb4e5-58b4-4&from=paste&height=58&id=ub4b3e5db&margin=%5Bobject%20Object%5D&name=image.png&originHeight=58&originWidth=1165&originalType=binary&size=11432&status=done&style=none&taskId=uf48dec83-732d-4e83-9fed-7ea7d976e15&width=1165)![image.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1621672293703-47fc85c3-ae74-4830-95e1-8caace323cec.png#clientId=ude7bb4e5-58b4-4&from=paste&height=424&id=u5e471165&margin=%5Bobject%20Object%5D&name=image.png&originHeight=424&originWidth=516&originalType=binary&size=31821&status=done&style=none&taskId=ua30bc99f-0438-4c13-947b-8891d86fe81&width=516)
**概述：**
Client 在接收到 Server Key Exchange 后，根据其携带的公钥，配合之前的 RandomC 和 RandomS 生成 Session Secret，Session Secret 就是最终对数据进行加解密的。接着发送 Client Key Exchange，至于此时的 ECDHE 参数中的 Pubkey 为什么和 Server Key Exchange 中的不同，应该和 ECDHE 加密协议有关，具体细节我也不知道，个人猜测此时的 Pubkey 是原 Pubkey 和 Pre-Master Secret（Session Secret 不是一步产生的，Pre-Master Secret 就是中间产物）通过 ECDHE 加密协议进行加密后的产物，目的是将如何生成 Pre-Master Secret 的信息传递给 Server，这样服务器也能顺利生成 Pre-Master Secret 从而得到最终的 Session Secret。
​

**部分信息说明：**

- ChangeCipherSpec 信号：表示 Client 确认接受 Server Hello 中服务器选定的 Cipher Suite。ChangeCipherSpec 是一个独立的协议，体现在数据包中就是一个字节的数据，用于告知服务端，客户端已经切换到之前协商好的加密套件的状态，准备使用之前协商好的加密套件加密数据并传输了。
- Encryted Handshake Message 信号：表示 Client 基于自己计算出的 Session Secret 加密一段数据，在正式传输应用数据之前对握手协商的会话加解密通道进行验证，如果 Server 也顺利生成了 Session Secret 就能解密这段数据。

### TLS 过程 New Session Ticket

![image.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1621677969888-569ecc45-2473-434a-acfd-980bb91378b9.png#clientId=ude7bb4e5-58b4-4&from=paste&height=61&id=u3ba9d8df&margin=%5Bobject%20Object%5D&name=image.png&originHeight=61&originWidth=1143&originalType=binary&size=12871&status=done&style=none&taskId=u71e4b6aa-5042-4ed6-ab22-89ecaa6ae57&width=1143)![image.png](https://cdn.nlark.com/yuque/0/2021/png/467908/1621678176448-773f4288-982d-4d39-8cc7-335051c44be9.png#clientId=ude7bb4e5-58b4-4&from=paste&height=446&id=u2aa512f3&margin=%5Bobject%20Object%5D&name=image.png&originHeight=446&originWidth=595&originalType=binary&size=35450&status=done&style=none&taskId=u36ba12a1-1175-4b27-8e45-10634d84610&width=595)
**概述：**
服务端在接收到 Client Key Exchange 后，基于 ECDHE 参数中的 Pubkey 通过一定的算法计算出 Pre-Master Secret，并使用和 Client 相同的方法生成最终的 Session Secret。至此 TLS 的密钥协商就完成了，TLS HandShake 成功，之后就可以开始传输应用数据了。
**​**

**部分信息说明：**

- ChangeCipherSpec 信号：服务器在收到客户端的 ChangeCipherSpec 报文后，也回应一个 ChangeCipherSpec 告知客户端确定使用双方都支持确认的 Cipher Suite。
- Encryted Handshake Message 信号：服务端在接收到客户端发过来的 Encryted Handshake Message 后，若使用自己生成的 Session Secret 能解密出原始校验数据（verify_data，Finished message），则表明 C->S 方向的加解密通道就绪。同时，服务器也会给客户端发送一份使用 Session Secret 加密的校验数据报文 Encryted Handshake Message。若客户端也能正确解密，则表明 S->C 方向的加解密通道就绪。

​

## 小结

在 Wireshark 实际抓包中，会遇到部分和书本资料描述不一致的地方，这应该是和 TLS 版本，或者选择的 TLS 加密套件类型有关。
​

## 参考

[深入揭秘 HTTPS 安全问题&连接建立全过程](https://zhuanlan.zhihu.com/p/22142170)
[TLS 握手协商流程解析](https://blog.csdn.net/phunxm/article/details/72853552)
[HTTPS 过程以及详细案例](https://www.cnblogs.com/helloworldcode/p/10104935.html)
[SSL 详解](https://www.cnblogs.com/NathanYang/p/9183300.html)
[SSH2 协议的交互细节](https://www.yuque.com/barretlee/network/ssh2)
[Https(SSL/TLS)原理详解](http://www.rosoo.net/a/201409/17051.html)
[TLS/SSL 协议详解 (30) SSL 中的 RSA、DHE、ECDHE、ECDH 流程与区别](https://blog.csdn.net/mrpre/article/details/78025940)
