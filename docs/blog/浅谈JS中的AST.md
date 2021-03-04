# 浅谈 JS 中的 AST

> 可以通过[astexplorer](https://astexplorer.net/)网站在线预览代码对于的 AST。

> 可以通过[jointjs](https://resources.jointjs.com/demos/javascript-ast)网站在线可视化预览 AST。

## 介绍

AST 的全称是 [abstract syntax tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree)，即抽象语法树，通过 parser 对源代码进行解析生成的一种抽象语法结构的树状表现形式，代码以数据结构的形式存在更利于对其进行修改，最终再还原成源代码。

![ast.png](@images/ast.png)

## AST 无处不在

平时常见的框架中都会用到 AST，如果我们掌握了对 AST 的使用，也可以研发出基于语法转换的框架。

- IDE 的错误提示、代码格式化、代码高亮、代码自动补全等
- ESLint 对代码错误或风格的检查等
- webpack、rollup 进行代码打包等
- TypeScript、React、Vue 等转化为原生 Javascript

## 常见的 parser

parser 通过解析源代码的语法词汇、语义、作用域，最终生成 AST。不同的 parser 对源代码的解析算法不同，参照的「树状结构语法表述规范」也有差别，不过大多都基于[estree](https://github.com/estree/estree)规范。

常见的 parser 有：

- acorn
- espree
- esprima
- traceur
- shift
- @babel/parser(babylon)-fork 自 Acorn

## 学习使用@babel/parser

这里以如何使用@babel/parser 为例，因为平时我们使用 babel 家族的东西比较多，从它入手再好不过了。

### 转换步骤

1. 通过@babel/parser 将源代码转换成 AST
1. 借助@babel/traverse 遍历 AST，进行转换
1. 使用@babel/core 中的 transformFromAst 将 AST 还原成代码

### @babel/traverse 的使用

我们将匹配 AST 节点类型的方法传入，@babel/traverse 遍历到与方法名相同的节点类型时就会调用该方法，[官方说明](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#visitors)。

例子：

```javascript
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const path = require('path');
const { transformFromAst } = require('@babel/core');

const content = `
  function square(n) {
    return n * n;
  }
`;
const ast = parser(content, {
  sourceType: 'module',
});
const Visitor = {
  Identifier(path) {
    console.log('Called!');
  },
};
traverse(content, Visitor);
const { code } = transformFromAst(ast, null);
fs.writeFileSync(path.join(__dirname, './output.js'), code, 'utf-8');
```

上述代码执行后会输出 4 次`Called!`，因为方法名`square`和 3 个`n`的类型是 `Identifier`，我们在 Visitor 中的同名函数就会被执行。

节点类型回调函数可接受一个`path`变量，它是一个可变(mutable)对象，包含了该节点在树中位置和各种自身信息，你可以直接改变它或是调用它的方法，常用的有父节点`path.parent`，当前节点`path.node`，作用域`path.scope`，还有内嵌遍历方法`path.traverse()`，它可以嵌套遍历该节点的后代，不过要谨慎的使用它，因为它会增加代码时间复杂度。

节点类型可以有别名，比如`Function`是`FunctionDeclaration`、`FunctionExpression`、`ArrowFunctionExpression`、`ObjectMethod`和`ClassMethod`的别名，更多的节点类型定义参考[babel-types](https://www.npmjs.com/package/babel-types)文档。

通过`babel-types`提供的方法和`path`变量的相关 API，可以满足操作 AST 的日常需求，更多操作方法可以参考[官方文档](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#toc-transformation-operations)。

#### Visitor.Identifier 的多种写法

节点类型回调函数支持多种写法，下面几种可以达到同样的效果。

第一种：

```javascript
const Visitor = {
  FunctionDeclaration(path) {},
  Identifier(path) {},
};
```

第二种：`Identifier() { ... }` 是 `Identifier: { enter() { ... } }`的缩写形式，与 `enter()` 对应的是 `exit()`，遍历过程中对同一个节点会有 enter 和 exit 两个回调。

```javascript
const Visitor = {
  FunctionDeclaration: {
    enter(path) {},
  },
  Identifier: {
    enter(path) {},
  },
};
```

第三种：

```javascript
const Visitor = {
  enter(path) {
    const type = path.node.type;
    if (type === 'FunctionDeclaration') {
    } else if (type === 'Identifier') {
    }
  },
};
```

#### 注意事项

- `path.traverse(visitor, state)`中的 state 可以在内嵌 visitor 中通过 this 访问。

```javascript
const updateParamNameVisitor = {
  Identifier(path) {
    console.log(this.paramName); // a
  },
};
const Visitor = {
  FunctionDeclaration(path) {
    path.traverse(updateParamNameVisitor, { paramName: 'a' });
  },
};
```

- 内嵌的 Visitor 不会影响外层 Visitor 的执行，下述代码执行后，会输出 3 次 outter 和 1 次 inner，因此要小心被重复遍历到的那部分处理逻辑。

```javascript
// input.js
function square(n) {
  function hh(b) {
    return b + b;
  }
  return n * n;
}
function add(n) {
  return n + n;
}
// transform.js
const updateParamNameVisitor = {
  FunctionDeclaration(path) {
    console.log('inner');
  },
};
const Visitor = {
  FunctionDeclaration(path) {
    console.log('outter');
    path.traverse(updateParamNameVisitor);
  },
};
```

#### 常见的错误使用案例

- 例子一：把下述代码中 square 函数的 n 转换成 x

```javascript
// input.js
function square(n) {
  return n * n;
}
n;
// transform.js
let paramName;
const MyVisitor = {
  FunctionDeclaration(path) {
    const param = path.node.params[0];
    paramName = param.name;
    param.name = 'x';
  },
  Identifier(path) {
    if (path.node.name === paramName) {
      path.node.name = 'x';
    }
  },
};
// output.js
function square(x) {
  return x * x;
}
x; // error
```

应该是这样：

```javascript
const updateParamNameVisitor = {
  Identifier(path) {
    if (path.node.name === this.paramName) {
      path.node.name = 'x';
    }
  },
};
const MyVisitor = {
  FunctionDeclaration(path) {
    const param = path.node.params[0];
    const paramName = param.name;
    param.name = 'x';
    path.traverse(updateParamNameVisitor, { paramName });
  },
};
path.traverse(MyVisitor);
```

在[实现一个简单的 WEB 打包工具](https://www.yuque.com/tingyur/yldon0/lk36ht)一文中会有实际的应用 😊。
