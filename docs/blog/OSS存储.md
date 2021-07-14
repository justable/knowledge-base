# OSS 存储

## 创建存储空间

存储空间（Bucket）是用于存储对象（Object）的容器。在上传任意类型的 Object 前，您需要先创建 Bucket。

## 上传文件

可以在阿里云控制台上传，或者通过官方 API 上传，或者使用不同语言的 SDK，具体参考[上传教学](https://help.aliyun.com/document_detail/31886.html?spm=a2c4g.11186623.6.599.38e262e7mxtRcc)。

这里以 npm 安装使用为例，由于浏览器的特殊性，以下功能不能使用：

- 流式上传：浏览器中无法设置 chunked 编码，建议使用分片上传替代。
- 操作本地文件：浏览器中不能直接操作本地文件系统，建议使用签名 URL 的方式下载文件。
- 由于 OSS 暂时不支持 Bucket 相关的跨域请求，建议在控制台执行 Bucket 相关操作。

## 访问安全

ALIYUN_ID=LTAI5tCfdp6y8ALIYUN_ID99UPYK6mNkq
ALIYUN_SECRET=tuAjPUj4tALIYUN_SECRETNOybc8DALIYUN_SECRETvkR6TY9HWkMdNd
ALIYUN_USER=tingyu@1487899462ALIYUN_USER153358.onaliyun.com

由于阿里云账号 AccessKey 拥有所有 API 访问权限，建议遵循阿里云安全最佳实践。如果部署在服务端可以使用 RAM 用户或 STS 来进行 API 访问或日常运维管控操作，如果部署在客户端请使用 STS 方式来进行 API 访问。

为了安全考虑，建议不要使用主账号的 AccessKey，可以在[RAM 访问控制](https://ram.console.aliyun.com/users)创建子账号，并只授权子账号进行 API 访问（这样子账号无法登录控制台），别忘了将指定的 Bucket 授权给子账号，否则访问不了。

当 Bucket 的读写权限为公有时，直接通过接口返回的 url 访问即可，比如：`http://tingyus.oss-cn-hangzhou.aliyuncs.com/reactcases/undraw_Floating_re_xtcj.png`;私有时需要获取文件签名，过程如下：

```js
// https://help.aliyun.com/document_detail/32077.htm?spm=a2c4g.11186623.2.17.790c1c91sQUOdz#concept-32077-zh
// 获取下载exampleobject.txt文件的签名URL，使用浏览器访问时默认直接预览要下载的文件。
// 填写不包含Bucket名称在内的Object完整路径。
const url = client.signatureUrl('exampleobject.txt');
console.log(url);

// 获取下载exampleobject.txt文件的签名URL，配置响应头实现浏览器访问时自动下载文件，并自定义下载后的文件名称。
const filename = 'ossdemo.txt'; // 自定义下载后的文件名称。
const response = {
  'content-disposition': `attachment; filename=${encodeURIComponent(filename)}`,
};
// 填写不包含Bucket名称在内的Object完整路径。
const url = client.signatureUrl('exampleobject.txt', { response });
console.log(url);

// 获取上传exampleobject.txt文件的签名URL，并设置过期时间。
// 填写不包含Bucket名称在内的Object完整路径。
const url = client.signatureUrl('exampleobject.txt', {
  expires: 3600, // 设置过期时间，默认值为1800秒。
  method: 'PUT', // 设置请求方式为PUT。默认请求方式为GET。
});
console.log(url);

// 获取上传exampleobject.txt文件的签名URL，并设置Content-Type。
// 填写不包含Bucket名称在内的Object完整路径。
const url = client.signatureUrl('exampleobject.txt', {
  expires: 3600,
  method: 'PUT',
  'Content-Type': 'text/plain; charset=UTF-8',
});
console.log(url);
```

可以在[这里](https://oss.console.aliyun.com/bucket/oss-cn-hangzhou/tingyus/permission#acl)修改 Bucket 读取权限。

[阿里云安全最佳实践](https://help.aliyun.com/document_detail/102600.html?spm=a2c8b.20231166.0.0.36dd336aCNmMC5)

## 跨域配置

通过浏览器直接访问 OSS 时，需要在阿里云控制台配置 CORS 规则。

来源：允许跨域请求的来源，可以同时指定多个来源。配置时需带上完整的域信息，例如：`http://10.X.X.100:8001`或`https://www.aliyun.com`。注意，不要遗漏了协议名 http 或 https，如果端口不是默认的 80，还需要带上端口。如果不能确定域名，可以打开浏览器的调试功能，查看 Header 中的 Origin。域名支持*通配符，每个域名中允许最多使用一个*，例如`https://*.aliyun.com`。如果来源指定为`*`，则表示允许所有来源的跨域请求。

https://help.aliyun.com/document_detail/44199.html

## 安装

安装：`npm install ali-oss --save`

```js
const OSS = require('ali-oss');
const client = new OSS({
  region: '<oss region>',
  accessKeyId: '<Your accessKeyId>',
  accessKeySecret: '<Your accessKeySecret>',
  bucket: '<Your bucket name>',
});
```

## 费用查询

https://usercenter2.aliyun.com/order/list?pageIndex=1&pageSize=20

## FAQ

- 如何将 OSS 文件配置成访问即下载的形式？

当您通过浏览器使用自定义域名访问 OSS 上存储的文件时，若您的浏览器支持预览所选的文件格式，则 OSS 将直接预览，而非下载所选的文件。

https://help.aliyun.com/document_detail/171120.html

## 参考

https://help.aliyun.com/learn/learningpath/oss.html?spm=5176.10695662.5694434980.6.188e5ad3iP0lBh
