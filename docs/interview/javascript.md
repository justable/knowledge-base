---
title: JavaScript
order: 1
---

## 事件委托 (event delegation)

事件委托是将事件监听添加到父元素，而不是每个子元素单独设置监听器，当触发子元素时，事件会冒泡到父元素，监听器就会触发。

好处是：

1. 内存占用少，因为只需要一个父元素的事件处理程序，而无需为每个后代元素都设置事件处理程序。
2. 无需从已删除的元素中解绑处理程序，也无需为新元素绑定处理程序。

例子：

```tsx | pure
import React, { useEffect } from 'react';

export default () => {
  useEffect(() => {
    const wrapper = document.getElementById('wrapper') as HTMLDivElement;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.nodeName === 'P' || target.matches('a.link')) {
        alert(target.textContent);
      }
    };
    wrapper.addEventListener('click', handler);
    return () => {
      wrapper.removeEventListener('click', handler);
    };
  }, []);
  return (
    <div id="wrapper">
      <a className="link">点我a</a>
      <p>点我p</p>
      <button>点我没反应</button>
    </div>
  );
};
```

## target 和 currentTarget

前者是实际触发事件的元素，后者是被监听的元素。在前面事件委托的例子中，currentTarget 为 wrapper。

## 事件的捕获和冒泡

先捕获后冒泡，前者从 window(当前窗口)->document(整个文档)->documentElement(html)->body->target，后者反之。

我们可以通过`e.stopPropagation()`阻止捕获和冒泡，通过`e.stopImmediatePropagation()`阻止一个节点上绑定的多个同种事件。比如在同个节点 click 事件绑定了三个 handler，前者只会阻止当前的 handler，而后者会取消该节点所有的 click 事件。

我们可以通过`addEventListener`方法的第三个参数可以控制事件发生在捕获阶段还是冒泡阶段，默认为冒泡阶段 false。

## 防抖 (debounce)

目的是归并短时间内的连续行为，使程序只响应一次。

应用场景：

1. 登录、发短信等按钮避免用户点击太快，以致于发送了多次请求，需要防抖
2. 调整浏览器窗口大小时，resize 次数过于频繁，造成计算过多，此时需要一次到位，就用到了防抖
3. 文本编辑器实时保存，当无任何更改操作一秒后进行保存

```js
function debounce(f, interval) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => f(...args), interval);
  };
}
```

## 节流 (throttle)

目的是控制程序的执行频率。

应用场景：

1. scroll 事件，每隔一秒计算一次位置信息等
2. 浏览器播放事件，每个一秒计算一次进度信息等
3. input 框实时搜索并发送请求展示下拉列表，每隔一秒发送一次请求 (也可做防抖)

```js
function throttle(f, interval) {
  let timer;
  return (...args) => {
    if (timer) {
      return;
    }
    timer = setTimeout(() => {
      f(...args);
      timer = null;
    }, interval);
  };
}
```

## 手写 Promise

> 需要遵循[Promise A+](https://promisesaplus.com/)规范。

```js
import { isFunction, isThenable } from '@/shared/utils';

const PENDING = Symbol.for('pending');
const FULFILLED = Symbol.for('fulfilled');
const REJECTED = Symbol.for('rejected');

function resolvePromise(promise2, x, resolve, reject) {
  let called = false;
  if (promise2 === x) {
    return reject(new TypeError('循环引用'));
  }
  if (isThenable(x)) {
    x.then.call(
      x,
      value => {
        if (called) return;
        called = true;
        resolvePromise(promise2, value, resolve, reject);
      },
      reason => {
        if (called) return;
        called = true;
        reject(reason);
      },
    );
  } else {
    resolve(x);
  }
}

class ToyPromise {
  private status = PENDING;
  private value;
  private reason;
  private fulfilledCallbacks = [];
  private rejectedCallbacks = [];

  static resolve() {
    const promise = new ToyPromise((resolve, reject) => {
      resolvePromise(promise, value, resolve, reject);
    });
    return promise;
  }

  static reject() {
    return new ToyPromise((resolve, reject) => {
      reject(reason);
    });
  }

  constructor(executor) {
    const resolve = value => {
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
        this.fulfilledCallbacks.forEach(fn => fn());
      }
    };
    const reject = reason => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        this.rejectedCallbacks.forEach(fn => fn());
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    const self = this;
    onFulfilled = isFunction(onFulfilled) ? onFulfilled : value => value;
    onRejected = isFunction(onFulfilled)
      ? onRejected
      : reason => {
          throw new Error(reason instanceof Error ? reason.message : reason);
        };
    const promise2 = new ToyPromise((resolve, reject) => {
      if (self.status === PENDING) {
        self.fulfilledCallbacks.push(() =>
          queueMicrotask(() => {
            const x = onFulfilled(self.value);
            resolvePromise(promise2, x, resolve, reject);
          }),
        );
        self.rejectedCallbacks.push(() =>
          queueMicrotask(() => {
            const x = onRejected(self.reason);
            resolvePromise(promise2, x, resolve, reject);
          }),
        );
      } else if (self.status === FULFILLED) {
        queueMicrotask(() => {
          const x = onFulfilled(self.value);
          resolvePromise(promise2, x, resolve, reject);
        });
      } else if (self.status === REJECTED) {
        queueMicrotask(() => {
          const x = onRejected(self.reason);
          resolvePromise(promise2, x, resolve, reject);
        });
      }
    });

    return promise2;
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }
}
```

## 手写 bind

```js
Function.prototype.fakeBind = function(...bindArgs) {
  return (...args) => this.call(...bindArgs.concat(args));
};
function f(...args) {
  console.log(this, args);
}
f.bind(1, 2)(3);
f.fakeBind(1, 2)(3);
```

## 代码压缩的原理是什么

将代码转成 ast，遍历 ast 作出优化。

比如替换语法树中的变量，变成 a，b，c 那样的看不出意义的单字符变量名，还有把 if/else 合并成三元运算符等。

最后输出代码的时候，全都输出成一行。

## 类数组转化为数组

> 要考虑稀疏数组(sparse array)，稀疏数组内的成员是 empty，无法被 map 等方法遍历，可以先调用 fill 方法进行填充。

```js
const arrayLike = { 0: 3, 1: 4, 2: 5, length: 3 };

Array.from(arrayLike);
Array.apply(null, arrayLike);
Array.prototype.concat.apply([], arrayLike);
```

## 手写 compose 函数

> compose 就是组合若干个函数，从右边开始执行，先执行的函数结果作为下一个函数的参数。

```js
function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}
```

## 手写 lodash 的 get 方法

```js
function _get(obj: any, exps: string) {
  if (!isString(exps) || !isObject(obj)) return obj;
  let res = obj;
  const arr = exps.split('.');
  for (let i = 0; i < arr.length; i++) {
    const exp = arr[i];
    if (res[exp]) {
      res = res[exp];
    } else {
      return undefined;
    }
  }
  return res;
}

const obj = { test: { arr: [{ name: 1 }] } };
_get(obj, 'test.arr.0.name');
```

## 空值合并符和可选链

> ??和?.

空值合并操作符（??）是一个逻辑操作符，当左侧的操作数为 null 或者 undefined 时，返回其右侧操作数，否则返回左侧操作数。与逻辑或操作符（||）不同，逻辑或操作符会在左侧操作数为假值时返回右侧操作数。也就是说，如果使用 || 来为某些变量设置默认值，可能会遇到意料之外的行为。比如为假值（例如，'' 或 0）时。

可选链操作符( ?. )允许读取位于连接对象链深处的属性的值，而不必明确验证链中的每个引用是否有效。

```js
let customer = {
  name: 'Carl',
  details: { age: 82 },
};

let customerCity = customer?.city ?? '暗之城';
console.log(customerCity); // “暗之城”
```

## 手写深拷贝

```js
function cloneDeep(obj, mode) {
  if (mode === 'json') {
    return JSON.parse(JSON.stringify(obj));
  } else {
    let target = {};
    if (isObject(obj)) {
      for (let key in obj) {
        let item = obj[key];
        target[key] = cloneDeep(item);
      }
      return target;
    } else if (isArray(obj)) {
      return obj.map(item => cloneDeep(item));
    } else {
      return obj;
    }
  }
}
```

## 简述 Event loop

> The browser main thread is an event loop. Its an infinite loop that keeps the process alive.

JS 的所有同步任务会按序加入主任务队列，像 Promise 的回调函数则会加入微任务队列，当主队列的任务执行完毕后会执行微任务队列，直到微队列为空（运行时新增的微任务会延续微队列的执行），像 setTimeout 的回调函数会加入消息队列，消息队列的任务会在下次 loop 中加入主队列。整个 Event loop 是无限循环的。

## 手写自执行 Generator 函数

```js
function runGenerator(gen) {
  // 暂不处理await右边是PromiseLike的情况
  return new Promise((resolve, reject) => {
    const iterator = gen();
    try {
      let next = iterator.next();
      while (!next.done) {
        next = iterator.next(next.value);
      }
      resolve(next.value);
    } catch (reason) {
      reject(reason);
    }
  });
}

function* test() {
  const r1 = yield 1;
  throw 'error';
}
runGenerator(test).catch(err => console.log(err));
```

## Promise.allSettled 和 Promise.all 的区别

```js
const promise1 = Promise.resolve('1');
const promise2 = Promise.resolve('2');
const promise3 = Promise.reject('3');
Promise.allSettled([promise1, promise3]).then(values => {
  console.log(values);
  // [{ status: 'fulfilled', value: '1' }, { status: 'rejected', reason: '3' }]
});
Promise.all([promise1, promise2]).then(values => {
  console.log(values);
  // ['1', '2']
});
Promise.all([promise1, promise3]).then(values => {
  console.log(values);
  // Uncaught (in promise) 3
});
```

## 手写 LRU cache

> 可以直接使用 lru-cache 包

```js
// https://blog.csdn.net/u014298440/article/details/105412348
```

  <!-- <code src="../../src/components/ToyPromise/index.ts"></code> -->
