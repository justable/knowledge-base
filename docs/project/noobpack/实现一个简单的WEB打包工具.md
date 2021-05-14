# 实现一个简单的 WEB 打包工具

## 引言

提到 WEB 打包工具，第一个想到的就是 Webpack 了，它的功能非常强大：

1. 能够合并分散的模块化文件，生成可直接在浏览器运行的文件；
1. 支持 tree shaking，能够剔除没有使用到的代码；
1. 支持 code spliting，根据 `optimization.splitChunks`生成 chunk，减少打包后文件中的重复代码，提升代码利用率，更利于触发缓存；
1. 支持各类`xxx-loader`，能够对源码进行打包前的转换处理；
1. 支持各类`xxx-webpack-plugin`，能够在 webpack 编译打包的各个钩子函数中进行扩展；
1. ......

不管 Webpack 实现有多复杂，它的初衷其实很简单，就是“将工程化结构的代码打包成浏览器中可以直接运行的代码”。本文就是讲述如何实现这么一个最基本的 WEB 打包工具。

作为一个日常项目开发中频繁使用的工具，对它背后的实现原理进行探索，一来可以锻炼我们的编程思维，二来有助于理解 webpack 繁多的配置选项。

本文主要实现上述的第一项，即「能够合并分散的模块化文件，生成可直接在浏览器运行的文件」，其实只是想实战一下[浅谈 JS 中的 AST](https://www.yuque.com/tingyur/yldon0/qxyk7a)一文中谈到的 AST，因为打包时会利用 AST 进行依赖分析 😊。

## 实现目标

我们要将下面这个例子打包成一个直接可在浏览器运行的文件。

配置文件：

```javascript
const path = require('path');

module.exports = {
  entry: {
    pageA: './pages/pageA.js',
  },
  output: {
    path: __dirname,
    filename: '[name].js',
  },
};
```

pageA.js：

```javascript
import add from './add.js';

const button = document.getElementsByTagName('button')[0];
const inputs = document.getElementsByTagName('input');
const result = document.getElementsByTagName('span')[0];
button.onclick = function() {
  result.textContent = add(inputs[0].value, inputs[1].value);
};
```

add.js：

```javascript
import log from './log.js';

export default function(a, b) {
  log('executing add function');
  return Number(a) + Number(b);
}
```

log.js：

```javascript
export default function(text) {
  console.log(text);
}
```

这个例子中的依赖关系是 pageA.js->add.js->log.js。

## 实现过程

一切以入口文件为起点，先把入口文件经过 parser 处理，将 ES6 语法转为 ES5，并得到自身的下游依赖（通过 AST 对语法进行分析得到），同理对下游依赖文件也依次经过 parser 处理，最终把每个文件包装成对象放进数组，一个数组就代表一条依赖链，每个文件对象格式如下所示：

```typescript
interface FileInfo {
  // 文件的路径
  path: string;
  // 下游依赖文件的路径数组
  deps: string[];
  // 转换后的ES5代码
  code: string;
}
```

我们希望最终在浏览器运行的代码结构是这样的：

```javascript
(function(modules) {
  // The module cache
  var installedModules = {};

  // The require function
  function require(moduleId) {
    // Check if module is in cache
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }

    // Create a new module (and put it into the cache)
    var module = (installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {},
    });

    // Execute the module function
    modules[moduleId].call(module.exports, module, module.exports, require);

    // Flag the module as loaded
    module.l = true;

    // Return the exports of the module
    return module.exports;
  }

  // Load entry module and return exports
  return require('./pageA.js');
})({
  './pageA.js': function(module, exports, require) {
    var _add = require('./add.js');
    // do something
  },
  './add.js': function(module, exports, require) {
    var _log = require('./log.js');
    // do something
  },
  './log.js': function(module, exports, require) {
    // do something
  },
});
```

其实上面这段代码就是一个简易的 Webpack 运行时文件。我们已经拥有了表示依赖链的文件对象数组，那么我们现在只需要将依赖链数组转换成以 path 为 key，code 包裹在函数体中为 value 的对象，就如上述代码结构那般，最终将这个文件按照 output 配置输出即可。

## 开始动手

根据配置文件中的 entry 选项找到入口文件，将入口文件转成 AST

```javascript
const fs = require('fs');
const parser = require('@babel/parser');
// 读取文件原始内容
const content = fs.readFileSync(filePath, 'utf-8');
// 将文件原始内容解析成ast
const ast = parser.parse(content, {
  sourceType: 'module',
});
```

遍历 AST 得到文件的直接依赖

```javascript
const traverse = require('@babel/traverse').default;
const path = require('path');
const deps = [];
// 遍历ast得到文件的依赖关系
traverse(ast, {
  ImportDeclaration({ node }) {
    const dirname = path.dirname(filePath);
    // 将import依赖的相对当前文件的路径都转换成相对项目根目录的路径
    const newFile = './' + path.join(dirname, node.source.value);
    deps.push(newFile);
    node.source.value = newFile;
  },
});
```

使用`@babel/core`的`transformFromAst`方法把 AST 转换成源代码，这里使用了`@babel/preset-env`插件，它会转换 ES6+的语法特性。

```javascript
const { transformFromAst } = require('@babel/core');
// 使用babel转换代码
const { code } = transformFromAst(ast, null, {
  presets: ['@babel/preset-env'],
});
// 输出一个文件相对项目根目录的路径，依赖，转换后的源码
return { path: filePath, deps, code };
```

> 要注意最终生成的代码中，模块依赖是通过 require 方法引入的，也就是说 babel 会把原本的 import 转换成 require，但浏览器环境中是没有 require 方法的，所以我们之后要实现这个方法。

把上述代码连起来包装在`analyzeFile`方法中，`analyzeFile`方法其实是在分析一个文件的直属依赖，并不包含依赖中的依赖，接下来要做的就是迭代分析入口文件依赖的依赖，得到完整的依赖树。

```javascript
const file = this.analyzeFile(entryPath);
const fileArray = [file];
// 迭代法
for (let i = 0; i < fileArray.length; i++) {
  const mod = fileArray[i];
  for (let j = 0, deps = mod.deps; j < deps.length; j++) {
    const dep = deps[j];
    fileArray.push(this.analyzeFile(dep));
  }
}
// 至此，fileArray包含了入口文件的所有依赖文件，不过根据上述的迭代法，会出现重复的依赖，接下来去重即可
const modules = {};
fileArray.forEach(item => {
  // 去重
  modules[item.path] = item.code;
});
const bundle = {
  targetPath: path.join(output.path, output.filename.replace('[name]', name)),
  id: entryPath,
  modules,
};
```

最终得到了入口文件完整的依赖对象 bundle，接着利用这个对象生成最终的代码

```javascript
// 输出
fs.writeFileSync(bundle.targetPath, generateFinalCode(bundle), 'utf-8');

// 将依赖模块的代码通过函数包裹，便于之后的调用
function wrapModuleCode(code) {
  return `function(module, exports, require){
    ${code}
  }`;
}
// 将依赖对象生成输出字符串
function transformDepsToStr(modules) {
  const ids = Object.keys(modules);
  const allStr = ids.reduce((str, id) => {
    const entry = `,\n"${id}": ${wrapModuleCode(modules[id])}`;
    return `${str}${entry}`;
  }, '');
  return `{\n${allStr.slice(1)}\n}`;
}
// 这是最终要在浏览器执行的代码
function generateFinalCode(bundle) {
  return `
    (function(modules) {
      // The module cache
      var installedModules = {};

      // The require function
      function require(moduleId) {
        // Check if module is in cache
        if (installedModules[moduleId]) {
          return installedModules[moduleId].exports;
        }

        // Create a new module (and put it into the cache)
        var module = (installedModules[moduleId] = {
          i: moduleId,
          l: false,
          exports: {}
        });

        // Execute the module function
        modules[moduleId].call(
          module.exports,
          module,
          module.exports,
          require
        );

        // Flag the module as loaded
        module.l = true;

        // Return the exports of the module
        return module.exports;
      }

      // Load entry module and return exports
      return require("${bundle.id}");
    })(${transformDepsToStr(bundle.modules)})
    `;
}
```

通过`require("${bundle.id}")`开始执行入口文件，其中的主体代码通过自定义 require 方法中的`modules[moduleId].call(module.exports, module, module.exports, require )`执行，之前说过主体代码中的依赖是通过 require 方法进行引入的，因此主体代码若有依赖，会自行调用我们提前定义好的 require 方法，这样一来，层层的嵌套依赖也会自行引入并执行，至此，一个简单的 web 打包工具就完成了。

完整代码及例子看[noobpack](https://github.com/justable/noobpack)。
