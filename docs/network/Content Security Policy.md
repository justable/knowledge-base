# Content Security Policy

## 概述

CSP 严格控制了网页中对外部资源加载的范围和外部代码的执行的安全性，主要体现在使用[`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script) and [`<object>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object)  加载第三方资源上。

主要有两种方式指定网页的 CSP，

1. server 端返回的 http 头部增加 Content-Security-Policy 字段
1. 在网页的 meta 标签上指定

## 配置

`script-src`和`object-src`是必设的，除非设置了`default-src`。

### 参数名

- **`default-src`**：设置所有参数的默认值
- **`script-src`**：外部脚本，行内 script 将不被允许

```html
<script>
  console.log('foo');
</script>
<div onclick="console.log('click')">Click me!</div>
```

- **`style-src`**：样式表
- **`img-src`**：图像
- **`media-src`**：媒体文件（音频和视频）
- **`font-src`**：字体文件
- **`object-src`**：插件（比如 Flash）
- **`child-src`**：框架
- **`frame-ancestors`**：嵌入的外部资源（比如`<frame>、<iframe>、<embed>和<applet>`）
- **`connect-src`**：HTTP 连接（通过 XHR、WebSockets、EventSource 等）
- **`worker-src`**：`worker`脚本
- **`manifest-src`**：manifest 文件

### 参数值

- 主机名：`example.org`，`[https://example.com:443](https://example.com:443)`
- 路径名：`example.org/resources/js/`
- 通配符：`*.example.org`，`*://*.example.com:*`（表示任意协议、任意子域名、任意端口）
- 协议名：`https:`、`data:`
- 关键字`'self'`：当前域名，需要加引号
- 关键字`'none'`：禁止加载任何外部资源，需要加引号

## 例子

```html
<meta
  http-equiv="Content-Security-Policy"
  content="script-src 'self'; object-src 'none'; style-src cdn.example.org third-party.org; child-src https:"
/>
```

- 脚本：只信任当前域名
- `<object>`标签：不信任任何 URL，即不加载任何资源
- 样式表：只信任`cdn.example.org`和`third-party.org`
- 框架（frame）：必须使用 HTTPS 协议加载
- 其他资源：没有限制

## 原文

[http://www.ruanyifeng.com/blog/2016/09/csp.html](http://www.ruanyifeng.com/blog/2016/09/csp.html)
[https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy)
