# 重新梳理 Promise

## 概述

Promise 是一套异步处理机制，遵循[Promise A+](https://promisesaplus.com/)规范，[实现列表](https://promisesaplus.com/implementations)罗列了许多 Promise 的实现。当然我们也可以自己实现 Promise，只要参照 Promise A+规范，并且通过[Promises/A+ Compliance Test Suite](https://github.com/promises-aplus/promises-tests#readme)。

本文主要梳理[ES6 中的 Promise](https://tc39.es/ecma262/#sec-properties-of-the-promise-constructor)是如何实现的。

> await 右边部分自动会被 Promise.resolve()处理，如果状态是 reject，那么会调用 catch，相当于 throw error，看下面例子。

```javascript
function reject() {
  return Promise.reject('error');
}
async function main() {
  // throw 'error'
  const res = await reject();
  console.log(res); // 不会执行
}
main().catch(err => {
  console.log(err); // error
});
```

上面这种处理方式虽然能够处理 main 方法的 reject 状态，但怎么在内部处理 reject 状态呢？我们可以 trycatch，

```javascript
async function main() {
  try {
    const res = await reject();
  } catch (e) {
    // do something
  }
}
// or
async function main() {
  const res = await reject().catch(e => captureError(e));
}
```

有没有更工整的处理方式呢？可以自行封装一个方法合并 resolve 和 reject 结果，

```javascript
function handlePromise(promise) {
  return promise.then(res => [res]).catch(err => [null, err]);
}
async function main() {
  const [res, err] = await handlePromise(reject());
  if (err) {
    // do something
  }
}
```

要注意下面这种形式的 promise 内部状态是 fulfilled，

```javascript
function test() {
  return Promise.reject('error').catch(err => err);
}
const promise = test(); // fulfilled
Promise.resolve(promise).then(res => console.log(res)); // error
```

## 参考

[http://wiki.commonjs.org/wiki/Promises/A](http://wiki.commonjs.org/wiki/Promises/A)
[https://promisesaplus.com/](https://promisesaplus.com/)
[https://promisesaplus.com/implementations](https://promisesaplus.com/implementations)
[https://github.com/promises-aplus/promises-tests](https://github.com/promises-aplus/promises-tests)
[https://tc39.es/ecma262/#sec-properties-of-the-promise-constructor](https://tc39.es/ecma262/#sec-properties-of-the-promise-constructor)
[https://github.com/whyggg/promised/blob/master/src/promise.js](https://github.com/whyggg/promised/blob/master/src/promise.js)
