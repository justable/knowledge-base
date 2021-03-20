# NodeJS 之作用域

node 的全局作用域是 global，不过和在浏览器中不同，在 node 中，所有模块文件都会被包裹在一个函数中（后文称呼此函数为模块函数），如下所示：

```js
// /<node_internals>/internal/modules/cjs/loader.js
`(function (exports, require, module, __filename, __dirname) { ${moduleContent} \n});`;
```

这么做的目的是让模块间的成员互相隔离，并且模块中的 this 并非指向 global，而是指向自身独立的上下文，node 是如何实现这一特性的我还没有阅读源码求证，不过凭借对 JS 语言的了解，this 的指向默认由执行的所在环境决定，或显式的指定它，那么 node 实现这一特性的方法无非就两种：

1. 模块函数的执行环境不在顶级作用域 global 中；
2. 模块函数显式的指定了上下文，比如 `moduleFn.call(createContext())`。

我更倾向与第二种，待有空时阅读源码求证一番。

虽然模块是互相隔离的，但仍然可以共享 global 全局对象，比如 module A 中`global.hello = true`，在 module B 中可以直接访问`global.hello`。一些挂载在 global 的方法或变量（比如 setTimeout、console 等）可以直接访问。

## 几个代表性例子

- 模块中的 this 不指向 global

```js
// module A
console.log(global === this); // false
```

- 无论在哪层作用域给未声明的变量赋值，都会加在 global 中，以下所反映的 JS 特性与在浏览器中相同，参考[上文](../javascript/作用域.md)

```js
// module A
hello1 = 'hello1';
console.log(global.hello1); // hello1
var hello2 = 'hello2';
console.log(global.hello2); // undefined 因为module A的执行上下文不在global下，hello2相当于模块函数中的局部变量
let hello3 = 'hello3';
console.log(global.hello3); // undefined
{
  var hello4 = 'hello4';
}
console.log(hello4); // hello4
{
  let hello5 = 'hello5';
}
console.log(hello5); // Uncaught ReferenceError
global.hello6 = 'hello6';
console.log(global.hello6); // hello6
console.log(hello7); // undefined
console.log(hello8); // Uncaught ReferenceError
var hello7 = 'hello7';
let hello8 = 'hello8';
function test() {
  hello9 = 'hello9';
  console.log(global.hello9); // hello9
  function nestTest() {
    hello10 = 'hello10';
    console.log(global.hello10); // hello10
    console.log(this); // global 没有在任何对象中调用的方法默认在全局变量global中调用
  }
  nestTest();
  console.log(this); // global 没有在任何对象中调用的方法默认在全局变量global中调用
}
test();
```

- 通过 eval 向模块文件注入变量

```js
// module A
let codeB = fs.readFileSync('moduleB', 'utf-8');
function hello() {
  console.log('hello');
}
let globalFn = eval(`(function wrapper(hello) {${codeB}})`);
globalFn.call({});
```

```js
// module B
console.log(global); // global
console.log(this); // {}
```
