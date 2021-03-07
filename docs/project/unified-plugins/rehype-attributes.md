# rehype-attributes

可以自定义加工 HTML 文本中元素的属性，搭配 rehype 使用。

## 用法

下面的例子我们修改 href 属性，并且增加 target 属性，

```html
<!-- example.html -->
<p><a href="build/PnP.md">test</a></p>
<p><a href="./build/PnP.md">test</a></p>
<p><a href="PnP.md">test</a></p>
<p><a href="./PnP.md">test</a></p>
<p><a href="./原理.md">test</a></p>
<p><a href="baidu.com">test</a></p>
<p><a href="www.baidu.com">test</a></p>
<p><a href="https://www.baidu.com">test</a></p>
```

```js
var vfile = require('to-vfile');
var attributes = require('rehype-attributes');
var rehype = require('rehype');

var mdReg = /(?:\.\/)?(.*)\.md$/;
var urlReg = /^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+([\w\-.,@?^=%&:\/~+#]*[\w\-@?^=%&\/~+#])?$/;

rehype()
  .use(attributes, {
    // 在这可以获取a标签的AST节点
    a: function(node) {
      var { href, target } = transform(node);
      node.properties.href = href;
      node.properties.target = target;
    },
  })
  .process(vfile.readSync('example.html'), function(err, file) {
    if (err) throw err;
    console.log(String(file));
  });

function transform(node) {
  var href = node.properties.href;
  var target = node.properties.target;
  if (!href) {
    return { href, target };
  }
  var match = mdReg.exec(href);
  if (match) {
    return { href: encodeURIComponent(match[1]) };
  }
  match = urlReg.exec(href);
  if (match) {
    return {
      href: match[1] ? href : '//' + href,
      target: '_blank',
    };
  }
  return {
    href,
    target,
  };
}
```

最终得到：

```html
<p><a href="build%2FPnP">test</a></p>
<p><a href="build%2FPnP">test</a></p>
<p><a href="PnP">test</a></p>
<p><a href="PnP">test</a></p>
<p><a href="%E5%8E%9F%E7%90%86">test</a></p>
<p><a href="//baidu.com" target="_blank">test</a></p>
<p><a href="//www.baidu.com" target="_blank">test</a></p>
<p><a href="https://www.baidu.com" target="_blank">test</a></p>
```
