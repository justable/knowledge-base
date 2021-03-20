# WebWorkers

> Javascript 一直是单线程的工作模式，Web Worker 的出现使得主线程中的任务可以被分配到其他线程中执行。

## 工作模式

![](@images/js_webapi_1.png)

worker.js 脚本的执行上下文是在 WorkerGlobalScope 中，因此原本 window 对象上的变量和方法不一定存在，并且不能访问 DOM，具体支持哪些参考[这里](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Functions_and_classes_available_to_workers)。

页面的主线程和 worker 线程通过 postMessage 和 onmessage 互相进行发送和监听接收。

## 几种 workers

### Dedicated workers

worker.js 脚本的执行上下文是 DedicatedWorkerGlobalScope。

每执行一次`new Worker("worker.js")`，页面的 renderer 进程就会 spawn 一个新的 worker 线程，不同的 worker 线程互相独立，比如 worker.js 中维护了变量 foo 等于 0，A 页面改变 foo 等于 1，B 页面获取 foo 时依然等于 0。

页面端

```js
var worker = new Worker('worker.js');
worker.postMessage([1, 2]);
worker.onmessage = function(e) {
  console.log(e.data);
};
// 主线程主动关闭worker，不再接受来自worker的message
worker.terminate();
```

worker 端

```js
onmessage = function(e) {
  var result = e.data[0] * e.data[1];
  var workerResult = 'Result: ' + result;
  postMessage(workerResult);
};
// worker主动关闭
close();
```

### Shared workers

worker.js 脚本的执行上下文是 SharedWorkerGlobalScope。

不同于 Dedicated workers，SharedWorker 进程是个单例，多次执行`new SharedWorker("worker.js")`也只会创建一次，并且 SharedWorker 进程不属于页面的 renderer 进程，可以被不同的浏览器上下文所访问。

页面端

```js
var worker = new SharedWorker('worker.js', 'page1');
worker.port.postMessage([1, 2]);
worker.port.onmessage = function(e) {
  console.log(e.data);
};
worker.port.addEventListener('message', function(e) {
  console.log(e.data);
});
// 如果使用 addEventListener 监听，需要手动执行`worker.port.start()`
worker.port.start();
```

worker 端

```js
// this.name === 'page1'
onconnect = function(e) {
  var port = e.ports[0];
  port.onmessage = function(e) {
    var result = e.data[0] * e.data[1];
    var workerResult = 'Result: ' + result;
    port.postMessage(workerResult);
  };
};
```

### Service workers

worker.js 脚本的执行上下文是 ServiceWorkerGlobalScope，扮演浏览器与 web 应用或网络之间的代理服务器角色，常用于 PWA（Progressive Web App）应用。

- 请求和响应流只能被读取一次
- cache 是存储在内存中还是在磁盘中

https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API
https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API/Using_Service_Workers

### Chrome workers

### Audio workers

### Outside workers
