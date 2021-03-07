# rehype-slugs

给 markdown 的标题增加 id，用于锚点定位。

## 用法

```md
## [Hello](./example.md) World

Hello World

### Hello `World`

Hello World

## Hello <a href="./example.md">World</a>

Hello World
```

```js
var vfile = require('to-vfile');
var slugs = require('rehype-slugs');
var remark = require('remark');
var remark2rehype = require('remark-rehype');

var result;
remark()
  .use(remark2rehype)
  .use(slugs, {
    maxDepth: 3,
    callback: function(res) {
      result = res;
    },
  })
  .process(vfile.readSync('example.md'), function(err, file) {
    if (err) throw err;
    console.log(slugs);
    console.log(String(file));
  });
```

最终得到如下文本：

```
[
  { id: '33bea', depth: 1, tagName: 'h2', text: 'Hello World' },
  { id: '1a67a', depth: 2, tagName: 'h3', text: 'Hello World' },
  { id: '50eb7', depth: 1, tagName: 'h2', text: 'Hello World' }
]
<h2 id="33bea"><a href="./heading.md">Hello</a> World</h2>
<p>Hello World</p>
<h3 id="1a67a">Hello <code>World</code></h3>
<p>Hello World</p>
<h2 id="50eb7">Hello World</h2>
<p>Hello World</p>
```
