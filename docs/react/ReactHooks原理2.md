# ReactHooks 原理 2

## 概述

在 Hook 还没有出现时，functional 组件是不支持存储状态的，所以只能使用 class 组件，但是 class 组件由于 ES6 的语法特性，主要有以下缺点：

- 会使代码行数增加，没有 function 那么轻便；
- 为 jsx 传递 function 时需要先 bind(this)绑定作用域；
- 由于初次挂载和后续更新逻辑会略有不同，导致 componentDidMounted 和 componentDidUpdated 这两个生命周期函数会存在类似的逻辑；
- 代码逻辑复用困难；

Hook 出现以后，上面的问题都解决了，并且赋予了 functional 组件存储状态的能力。

## 实现原理

我们稍微要先对 React 的渲染机制有个了解。我们平时写的 jsx 是 React.createElement 的语法糖， react 的渲染呢可以分为两个阶段：Reconciliation 阶段和 Commit 阶段。

**Reconciliation 阶段**

该阶段会构建出与 element 树相对应的 fiber 树，一个 fiber 节点是 React 内部任务调度体系的最小单元，fiber 中会存储该 element 渲染时所必要的数据，同时又在 fiber.alternate 上维护了一棵 workInProgress 树，所有的 update 都会先作用于 WIP 树。接着对 fiber 树进行链表遍历，执行 diff、任务调度和时间分片等操作，并且这一过程是可以被中断和恢复的。

**Commit 阶段**

该阶段则是一鼓作气的把此次渲染的变更部分（patches）作用于 DOM，这一过程是会阻塞浏览器渲染主线程的，不可被中断。

假如有如下组件：

```jsx | pure
const Person = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState(0);
  return (
    <div>
      {name}:{age}
    </div>
  );
};
```

初次渲染，React 在 Reconciliation 阶段渲染到该组件时，useXXX 会被执行，useXXX 内部会创建出一个 Hook 对象来存储该 useXXX 的状态数据，就像这样：

```js
const hook = {
  memoizedState: null,
  baseState: null,
  queue: null,
  baseUpdate: null,
  next: null,
};
```

接着执行下一个 useXXX，即上例中的`const [age, setAge] = useState(0);`，同样会创建 Hook 对象并把它挂到上一个 Hook 对象的 next 属性中。重复如此直到该组件执行完毕就产生了一个 hook 链表，react 再把该 hook 链表绑定到当前 fiber 上去。以后的渲染 React 就不会重新创建 Hook 对象而是直接从已有 hook 链表的 next 属性读取，这就要求 hook 的执行顺序是固定的，这也是 React 官方文档一直强调的不要在循环、条件或嵌套函数内部调用 hooks 的原因所在了。

## 手写 Hook

本文就尝试写一个 useMockState 来模拟 useState 的功能。

但是有个问题是自己写的 useMockState 无法触发 React 的 rerender，所以我这里取巧写了个 useMockRender 来触发 React rerender：

```jsx | pure
import { useState } from 'react';

function useMockRender() {
  const [_, mockRender] = useState(0);
  return [mockRender];
}

export default useMockRender;
```

下面是 useMockState 的实现了：

```jsx | pure
let firstWorkHook = {
  memoriedState: undefined,
  next: undefined,
};
let nextWorkHook = firstWorkHook;

function useMockState(initialState) {
  return useMockReducer((state, action) => {
    return action;
  }, initialState);
}

function useMockReducer(reducer, initArg, init) {
  const [mockRender] = useMockRender();
  let current: WorkHook = nextWorkHook;
  if (typeof current.memoriedState === 'undefined') {
    // 第一次渲染
    let initState = initArg;
    if (typeof init === 'function') {
      initState = init(initArg);
    }
    current.memoriedState = initState;
  }
  // 链表向后移一格
  current.next = nextWorkHook = current.next
    ? current.next
    : { memoriedState: undefined, next: undefined };
  let dispatch = (action: any) => {
    current.memoriedState = reducer(current.memoriedState, action);
    // 因为我们无法获取fiber就无法缓存了，每次都重置hook链表
    nextWorkHook = firstWorkHook;
    // 触发重绘
    mockRender(num => num + 1);
  };
  return [current.memoriedState, dispatch];
}
```

接下来我们可以写个组件来测试下这个 useMockState：

```jsx | pure
const MockCounter = () => {
  let [name, setName] = useMockState('计数器');
  return (
    <div>
      {name}:{number}
      <button onClick={() => setName('计数器' + Date.now())}>改名字</button>
    </div>
  );
};
```

我自己测过是没有问题的。
