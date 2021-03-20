# MessagePort

> MessagePort 是 MessageChannel 中端口的描述，单独使用没有意义。

## MessagePort.postMessage()

- 参数：`MessagePort.postMessage(message: any, transfer: Transferable[])`

发送数据，transfer 的所属权会被交给接收方。

## MessagePort.start()

- 打开端口，当使用`MessagePort.onmessage`时默认会被执行，当使用`EventTarget.addEventListener`时需要手动执行。

## MessagePort.close()

- 关闭端口。

## MessagePort.onmessage

- 监听端口。
