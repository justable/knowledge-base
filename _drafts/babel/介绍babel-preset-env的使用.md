# 介绍 babel-preset-env 的使用

## 先聊聊 babel-preset-latest

babel-preset-env 的前身是 babel-preset-latest，它是多个 preset 的集合(es2015+)，并且随着 ECMA 规范的更新增加它的内容，诣在减少用户的配置和不断追更。

但是为什么取消了呢？它有个缺点，默认的设置会将所有 ES6 与 ES6+的新特性转成复杂的 es5 的代码，但是大部分现代浏览器已经支持了 ES6 的部分特性，如果能够根据用户指定支持浏览器的版本来限制转换特性的范围就好了。

## babel-preset-env

针对代码运行环境优化哪些特性需要转换哪些特性无需转换，让整个代码转换更有效率和目的性，babel-preset-env 应运而生。

babel-preset-env 支持很多配置，详细介绍见[官方文档](https://www.babeljs.cn/docs/babel-preset-env)。我们这里主要介绍几个关键常用参数，

- targets

比如我们要运行在 v10.0.0 版本 node 的环境中，

```json
{
  "presets": [
    [
      "env",
      {
        "targets": {
          "node": "10.0.0"
        }
      }
    ]
  ]
}
```

比如我们要按浏览器的市场占比来限定范围，

```json
{
  "presets": [
    [
      "env",
      {
        "targets": "> 0.25%, not dead"
      }
    ]
  ]
}
```

比如我们要运行在某个版本的浏览器中，

```json
{
  "presets": [
    [
      "env",
      {
        "targets": {
          "browsers": ["ie >= 8", "chrome >= 62"]
        }
      }
    ]
  ]
}
```

我们可以运行`npx browserslist "ie >= 8, chrome >= 62"`来列出最终支持的浏览器版本列表，当然这些 query 规则需要参照[browserslist 库](https://github.com/browserslist/browserslist)的说明。

当没有指定 target 且也没有在 browserslist config 中配置 target，babel-preset-env 会转换所有 ES2015-ES2020 处于 stage 4 之后的特性，当然这是不被建议的。

有个要注意的点，browserslist 有个 defaults query 规则，如果要在 babel 中使用这 defaults 规则，需要显式指定`{ "targets": "defaults" }`。

## 如何使用 stage-0 ～ 3 的特性

babel-preset-env 只会转换 stage-4 之后的特性，如果要使用 stage-0 ～ stage-3 的特性，需要手动单独配置对应特性的 plugin，因为下面这种方法已经在 babel7 中被取消了，

```
npm install --save-dev babel-preset-stage-0
npm install --save-dev babel-preset-stage-1
npm install --save-dev babel-preset-stage-2
npm install --save-dev babel-preset-stage-3
```

```json
{
  "presets": [["env", {}], "stage-2"]
}
```

比如要使用 proposal-class-properties 特性，我们应该这么做，

```json
{
  "plugins": ["@babel/plugin-proposal-class-properties"]
}
```

## 扩展

可以在[babel-demo](https://github.com/justable/babel-demo)查看早起的 babel 特性研究，不一定正确，可以做些回忆参考。
