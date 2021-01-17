---
title: React
order: 5
---

## hooks 带来了哪些便捷

1. 让函数式组件也能够携带状态，而写函数式组件比 class 组件更轻便
2. 涉及组件内部状态的逻辑代码能够被复用（不是指该内部状态被共享）

## React Portal 有哪些使用场景

适合需要脱离 root 节点的组件，特别是 position: absolute 与 position: fixed 的组件，比如模态框，通知，警告，goTop 等。

例子：

```html
<html>
  <body>
    <div id="root"></div>
    <div id="kbmodal-root"></div>
  </body>
</html>
```

```jsx | pure
import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';

const Modal = props => {
  const { children } = props;
  const modalRoot = useMemo(() => {
    let r = document.createElement('div');
    document.querySelector('body').appendChild(r);
    return r;
  }, []);

  return ReactDOM.createPortal(children, modalRoot);
};
```

## 谈谈虚拟 DOM

虚拟 DOM 其实是一种描述真实 DOM 结构的数据结构。原本我们是调用 DOM api 直接操作真实 DOM，现在则把所有对 DOM 的操作作用于虚拟 DOM（数据结构），再由渲染引擎提交到真实 DOM 中。

优点：

1. 虚拟 DOM 是一个数据抽象层，使渲染逻辑和宿主平台解耦，让同一套代码能够跨平台运行成为可能（只需使用不同的渲染引擎）。
2. 增加了代码的可维护性，操作数据比操作真实 DOM 更清晰便捷。
3. 对 DOM 的集中化操作，在数据改变时先对虚拟 DOM 进行修改，再反映到真实的 DOM 中，用最小的代价来更新 DOM。

缺点：

1. 首次渲染大量 DOM 时，由于多了一层虚拟 DOM 的计算，会比 innerHTML 插入慢。
2. 虚拟 DOM 需要在内存中的维护一份 DOM 的副本，有额外的内存开销。
3. 虚拟 DOM 在变更逻辑复杂的大项目情景下才会发挥出其优势，相反在页面简单，变更频繁但单一的简单情景下反而会变慢。

## key 的作用

> 不要把数组中的序号当作 key，序号和节点不是永远对应的，可能会因为数组中间删除或增加项而变化。

在 diff 阶段，React 需要得出新老节点树的差异，再把这些差异作用到真实 DOM 上去。在有大量重复相似节点的场景（比如列表），可能变化只是最后一项移到了第一项，但渲染算法在没有 key 标识的前提下只能一一对比每一项，并且得到的结果是每一项都发生了变化。如果我们提供 key，渲染算法就能对比 key 得知只是换了顺序，就可以复用这些节点。

## ref 是干嘛的

ref 在我们需要直接与真实 DOM 打交道的场景发挥作用，比如让输入框聚焦，读取 DOM 的属性等。

## 实现自定义 hook

> 参考[react-use](https://github.com/streamich/react-use)库。

## 实现 message <Badge>待补充</Badge>

可以使用 React.createPortal，可以考虑做成单例或者每次都销毁。

## 谈谈 fiber

fiber 是一种链表结构，遍历链表可以随时停止和恢复，这比原本的递归更可控。由于 JS 是单线程的，递归复杂的节点树时，由于递归不可被打断，会占用一大段时间导致页面失去响应。fiber 结构使任务分片成为可能，把原本一次递归完的任务分解成多段小任务，合理分配到每个渲染帧中，因此不会长时间的阻塞浏览器渲染。

总结来看，fiber 结构把原本同步的渲染改变为异步渲染，把任务碎片化，一个 fiber 就是任务的最小单位。

## useEffect 中如何使用 async/await

```ts
function useEffect(effect: EffectCallback, deps?: DependencyList): void;
type EffectCallback = () => void | (() => void | undefined);

async function fetchAPI() {
  let response = await fetch('api/data');
  response = await res.json();
  setData(response);
}
useEffect(() => {
  fetchAPI();
}, []);
```

## hooks 的原理 <Badge>待补充</Badge>

闭包+链表存储。

## Router 的实现原理 <Badge>待补充</Badge>

前端路由实现的本质是监听 url 变化，实现方式有两种：Hash 模式和 History 模式，无需刷新页面就能重新加载相应的页面。 Hash url 的格式为 www.a.com/#/，当#后的哈希值发生变化时，通过 hashchange 事件监听，然后页面跳转。 History url 通过 history.pushState 和 history.replaceState 改变 url。
