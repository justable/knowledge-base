# MessageChannel

> 连接两个端口，可以进行跨上下文的沟通。

## MessageChannel.port1

- 端口 1。

## MessageChannel.port2

- 端口 2。

## 例子

发送方

```js
const channel = new MessageChannel();
targetWindow.postMessage('接收下端口对象，之后就通过它和我沟通吧', '*', [
  channel.port2,
]);

button.onclick = function(e) {
  channel.port1.postMessage('你好，接收方');
};

channel.port1.ommessage = function(e) {
  console.log(e.data); // 你好，发送方
};
```

接收方

```js
let port;
window.onmessage(function(e) {
  console.log(e.data); // 接收下端口对象，之后就通过它和我沟通吧
  port = e.ports[0];
  port.onmessage = function(e) {
    console.log(e.data); // 你好，接收方
    port.postMessage('你好，发送方');
  };
});
```
