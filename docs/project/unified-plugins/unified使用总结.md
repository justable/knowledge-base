# unified 使用总结

## 概述

unified 是一个通过语法树来处理文本的工具，它支持 remark (Markdown)，retext (natural language)，和 rehype (HTML)的格式文本。

## 使用目的

我想要使用 unified 来实现如下功能，

- 将 md 文档转换成 html 格式
- 为 html 下的 heading 标签增加唯一 id，同时导出此 html 的锚点信息，用于构建此 html 的导航菜单

## 例子

实现此功能的核心还是转化成 AST 来做。根据 unified[使用文档](https://www.npmjs.com/package/unified)，一个大纲代码如下所示：

```javascript
var fs = require('fs');
var path = require('path');
var unified = require('unified');
var markdown = require('remark-parse');
var remark2rehype = require('remark-rehype');
var anthor = require('rehype-slugs');
var sanitize = require('hast-util-sanitize');
var format = require('rehype-format');
var html = require('rehype-stringify');
var report = require('vfile-reporter');

var anthors;
unified()
  .use(markdown) // 先将md文档转成md规范的AST
  .use(remark2rehype) // 将md规范的AST转换成html规范的AST
  .use(sanitize) // 安全处理防止XSS攻击
  .use(anthor, {
    // 根据AST提取锚点信息
    maxDepth: 3,
    callback: function(res) {
      anthors = res;
    },
  })
  .use(format) // 格式化此AST
  .use(html) // 最终将AST转换成html文本
  .process(fs.readFileSync(path.resolve(__dirname, './example.md')), function(
    err,
    file,
  ) {
    console.log(anthors);
    console.log(String(file));
  });
```

上述使用到的包除了 rehype-slugs 是自己实现之外其余都可在 unified 的使用教程的例子中找到，后文也会对这些工具包进行一个汇总。

## unified 介绍

unified 官方的描述，

> unified is an interface for processing text using syntax trees. Syntax trees are a representation of text understandable to programs. Those programs, called plugins, take these trees and inspect and modify them. To get to the syntax tree from text, there is a parser. To get from that back to text, there is a compiler. This is the process of a processor.

```
| ........................ process ........................... |
| .......... parse ... | ... run ... | ... stringify ..........|

          +--------+                     +----------+
Input ->- | Parser | ->- Syntax Tree ->- | Compiler | ->- Output
          +--------+          |          +----------+
                              X
                              |
                       +--------------+
                       | Transformers |
                       +--------------+
```

总的来讲，unified 先把输入通过 Parser 转换成语法树，再通过一系列 Transformers 来修改这个语法树，最终通过 Compiler 输出。

### parse 阶段

我们需要使用不同的 Parser 来解析成不同规范的语法树，unified 主要支持三种规范，分别是：

- remark (Markdown)
- retext (natural language)
- rehype (HTML)

[remark](https://github.com/remarkjs/remark)及其附属工具族都以`remark-`开头，对应符合[mdast](https://github.com/syntax-tree/mdast)规范的语法树。

[retext](https://github.com/retextjs/retext)及其附属工具族都以`retext-`开头，对应符合[nlcst](https://github.com/syntax-tree/nlcst)规范的语法树。

[rehype](https://github.com/rehypejs/rehype-slugs)及其附属工具族都以`rehype-`开头，对应符合[hast](https://github.com/syntax-tree/hast)规范的语法树。

通常都是使用对应的`[remark|retext|rehype]-parse`包来完成。

### run 阶段

就是使用对应的工具族来修改对应的语法树，它的 run 阶段使用[trough](https://github.com/wooorm/trough)来处理，灵感来自[ware](https://github.com/segmentio/ware)，类似 Koa 的剥洋葱中间件组装形式。

### stringify 阶段

通常都是使用对应的`remark|retext|rehype-stringify`包来完成。

### AST 构建工具

> unist 是一个通用语法树规范，mdast, hast, xast, 和 nlcst 都继承自 unist。

至此应该对 unified 体系的工作流程有了大体的了解。

虽然如上面介绍的，在 parse 阶段使用对应的 parser 完成解析，但我们也可以使用工具直接构建 AST，这里介绍如下几种工具，

- [hyperscript](https://github.com/hyperhype/hyperscript)
- [hastscript](https://github.com/syntax-tree/hastscript) (create hast trees)
- [xastscript](https://github.com/syntax-tree/xastscript) (create [xast](https://github.com/syntax-tree/xast) trees)
- [unist-builder](https://github.com/syntax-tree/unist-builder) (create any [unist](https://github.com/syntax-tree/unist) trees)

## 如何实现 run 阶段对应的工具包呢

可以参考我对 [rehype-slugs](https://github.com/tingyur/rehype-slugs) 的实现，而我又是参考 [mdast-util-toc](https://github.com/syntax-tree/mdast-util-toc) 实现的。写完后发现有个类似的[包](https://github.com/rehypejs/rehype-slug)，不过功能不太一样。

## 安全性

因为由这些工具生成的内容可能会被直接用在 html 中，造成 cross-site scripting (XSS)，可以使用 rehype-sanitize 对 AST 进行安全处理，并且最好把 rehype-sanitize 放在所有 plugins 最后面，因为其他 plugins 也不一定安全。
