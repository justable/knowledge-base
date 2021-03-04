# Iterator 和 Generator

## 概述

任何数据结构只要部署 Iterator 接口，就可以完成遍历操作，即依次处理该数据结构的所有成员。Iterator 接口主要供 for...of 消费，后者是 ES6 的一种新的遍历命令。

## Iterator 接口格式

```javascript
var iter = {
  [Symbol.iterator]() {
    return {
      next() {
        return { value: 1, done: false };
      },
      return() {
        return { done: true }; // 注意，return方法必须返回一个对象，这是 Generator 规格决定的。
      },
      throw() {
        return { done: true }; // 注意，throw方法必须返回一个对象，这是 Generator 规格决定的。
      },
    };
  },
};
```

## 遍历过程

调用 Iterator 接口中的 next 方法，Iterator 接口部署在对象的`[Symbol.iterator]`上，next 方法返回`{value: any,done: boolean}`形式的数据，value 作为一次遍历的值，done 表示是否结束遍历，接着执行遍历方法，当遇到 break 或 throw 时，会自动调用 Iterator 接口中的 return 方法，看下边这个例子：

```javascript
var iter = {
  [Symbol.iterator]() {
    return this;
  },
  next() {
    return { value: 1, done: false };
  },
  return() {
    console.log('return');
    throw 0;
  },
};
try {
  for (let i of iter) {
    throw 1;
  }
} catch (e) {
  console.log(e);
}
```

此时会依次输出`return`和`1`，如果把 throw 改为 break，则会输出`return`和`0`。

## Iterator 接口`[Symbol.iterator]`在哪些常见下会被使用呢？

- 解构赋值
- 扩展运算符
- `yield*`：用来在一个 Generator 函数里面执行另一个 Generator 函数
- 由于数组的遍历会调用遍历器接口，所以任何接受数组作为参数的场合，其实都调用了遍历器接口，比如
  - for...of
  - Array.from()
  - Map(), Set(), WeakMap(), WeakSet()（比如 new Map([['a',1],['b',2]])）
  - Promise.all()
  - Promise.race()

## Generator 函数和 Iterator 接口的关系

Generator 函数本身是一个 Iterator 生成器，调用 Generator 函数会返回一个 Iterator 对象，因此 Generator 函数可以直接赋值给`[Symbol.iterator]`属性。

```javascript
function* g() {
  for (var i = 0; i < 10; i++) {
    var reset = yield i;
    if (reset) {
      i = 10;
    }
  }
  return 11;
}
var iter = g();
console.log(iter.next()); // { value: 0, done: false }
console.log(iter.next()); // { value: 1, done: false }
console.log(iter.next(true)); // { value: 11, done: true }
var iterable = {
  [Symbol.iterator]: g,
};
for (var i of iterable) {
  console.log(i); // 0-9
}
```

当调用 next 方法时，yield 右侧的结果会作为 value 值，并且停止在这直到下次调用 next 方法。要注意的是 yield 表达式返回的值会根据 next 方法的第一个参数来决定，默认 undefined。

```javascript
function* g() {
  for (var i = 0; i < 10; i++) {
    var reset = yield i;
    if (reset) {
      i = 10;
    }
  }
}
var iter = g();
console.log(iter.next()); // { value: 0, done: false }
console.log(iter.return(11)); // { value: 11, done: true }
```

当调用 return 方法时，会直接返回`{done: true}`。

```javascript
function* f() {
  try {
    for (var i = 0; i < 10; i++) {
      var reset = yield i;
      if (reset) {
        i = 10;
      }
    }
  } catch (e) {
    console.log('内部捕获', e);
  }
  yield 11;
}
var iter = f();
console.log(iter.next()); // { value: 0, done: false }
try {
  console.log(iter.throw('a')); // {value: 11, done: false}
  iter.throw('b'); //
} catch (e) {
  console.log('外部捕获', e);
}
// 内部捕获 a
// 外部捕获 b
```

当调用 throw 方法时，会抛出异常，并像 next 方法一样向后遍历一次，如果没有后续则返回`{done: true}`，上例中第一次 throw 被内部捕获，于是中断 try 语块并执行到`yield 11`处，此时发生第二次 throw 但已没有 trycatch 包裹，因此被外部捕获。

其实 next、return、throw 可以联系起来理解，它们的作用都是让 Generator 函数恢复执行，并且使用不同的语句替换 yield 表达式：

- next(arg: any)是将 yield 表达式替换成一个值
- throw(arg: any)是将 yield 表达式替换成一个 throw 语句
- return(arg: any)是将 yield 表达式替换成一个 return 语句
