# Window

> window 对象属于 BOM。

## 常用属性

```ts
interface Window extends EventTarget{
  // 当前浏览上下文
  readonly window: WindowProxy;
  readonly self: WindowProxy;
  readonly document: Document;
  name: DOMString;
  location: Location;
  readonly history: History;
  readonly locationbar: Barprop;
  readonly menubar: Barprop;
  readonly personalbar: Barprop;
  readonly scrollbars: Barprop;
  readonly statusbar: Barprop;
  readonly toolbar: Barprop;
  void close();
  void stop();
  void focus();
  void blur();

  // 其它浏览上下文
  readonly frames: WindowProxy;
  readonly length: number;
  readonly top: WindowProxy;
  opener: WindowProxy;
  readonly parent: WindowProxy;
  readonly frameElement: Element;
  open(): WindowProxy | null;
  // ...

  // 用户代理
  readonly navigator: Navigator;
  /** @deprecated */
  readonly external: External;
  readonly applicationCache: ApplicationCache;

  // 用户提示
  alert(message?: any): void;
  confirm(message?: string): boolean;
  prompt(message?: string, _default?: string): string | null;
  print(): void;
  // ...

  // 事件句柄 IDL 属性
  onerror: Function | null;
  onload: Function | null;
  onmessage: Function | null;
  onmousemove: Function | null;
  onresize: Function | null;
  onscroll: Function | null;
  // ...
};
```

## 安全性

当 window 对象的任意一个成员属性或方法被非同源的脚本访问时，用户代理必须产生一个 security_err。

当一个脚本和 Document 下的 window 对象不同源时，若该脚本尝试访问 window 对象的属性或者方法时，用户代理必须保证 window 对象的属性操作、修改、访问都不能完成。

举个例子，如果两个 Iframe 的 Document 是不同源的，那么当它访问同一个 window 的 postMessage()方法时，返回的对象是不一样的。

## window.postMessage()

- 参数：`window.postMessage(message: any, targetOrigin: string, transfer: Transferable[])`

可以向指定的 window 对象发送信息，这个指定 window 对象可以是 iframe 的 contentWindow、执行 window.open() 返回的窗口对象。transfer 目前只支持 ArrayBuffer 和 MessagePort 对象。

对应的监听方法是`window.onmessage()`。

```js
window.onmessage(function(event) {
  event.data; // 传输的数据
  event.origin; // 发送方的origin
  event.source; // 发送方的window
  event.ports; // 对应postMessage的第三个参数，是个数组
});
```

看到 postMessage 很容易联想到 Worker、MessagePort 也是通过 postMessage 进行通信的。worker.postMessage 是 JS 脚本线程之间的通信，window.postMessage 是两个上下文之间的通信。

## window.focus()

- 参数：`window.focus()`

聚焦窗口

## window.open()

- 参数：`window.open(url?: string, target?: string, features?: string, replace?: boolean)`
- url：新窗口对应的 url
- target：用于设置新窗口的名字，如果名字已经存在则重用该页面
- features：新窗口的特性，常见的有 `width=420,height=230,resizable,scrollbars=yes,status=1,top=0,left=0,chrome=yes,centerscreen=yes`
- replace：若为 true，则从弹出窗口打开的任何页面都会从窗口的会话历史中删除。

默认打开 about:blank 页面，并返回对应的 window 对象

## window.top

- 返回：顶级浏览上下文的 WindowProxy 对象

## window.parent

- 返回：父浏览上下文的 WindowProxy 对象

## window.frameElement

- 返回：浏览上下文容器的 Element 对象

## window.history

### 常用属性

```ts
interface History {
  readonly length: number;
  scrollRestoration: ScrollRestoration;
  readonly state: any;
  back(): void;
  forward(): void;
  go(delta?: number): void;
  pushState(data: any, title: string, url?: string | null): void;
  replaceState(data: any, title: string, url?: string | null): void;
}
```

### history.length

- 返回：session history 条例的数量

### history.scrollRestoration

- 返回：当前条例的 scroll restoration mode

### history.state

- 返回：当前的 serialized state

### history.back()

- 回退到上一个 session history 条例，如果没有则什么都不做

### history.forward()

- 去往下一个 session history 条例，如果没有则什么都不做

### history.go()

- 参数：`history.go(delta?: number): void`
- 去往指定的 session history 条例，如果 delta 是 0 则 reload 本页，如果超出范围则什么都不做

### history.pushState()

- 参数：`pushState(data: any, title: string, url?: string | null): void`
- 生成一个 history 条例并 push 到 session history 中

### history.replaceState()

- 参数：`replaceState(data: any, title: string, url?: string | null): void`
- update 当前的 history 条例

## window.btoa() & window.atob()

- 参数：`btoa(stringToEncode: string): string` & `atob(encodedData: string): string`
- btoa 是编码，atob 是解码

实际应用

```js
let Base64 = {
  encode(str) {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(
        match,
        p1,
      ) {
        return String.fromCharCode('0x' + p1);
      }),
    );
  },
  decode(str) {
    return decodeURIComponent(
      atob(str)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''),
    );
  },
};
```
