# model hook 使用介绍

## 概述

hooks 在我的理解中，其封装的逻辑是可被不同组件复用的，但其内部的状态是和使用它的组件绑定的，并且还要求严格的调用次序稳定性，每次渲染帧中的状态也是隔离的，当然这是为了让状态具备时间回溯的能力，其本质状态存储的结构是个链表。

可能有的人会觉得，hooks 的优势就是高可复用性啊！但这仅仅是指逻辑复用，那么 hooks 能否在组件状态的共享上发挥一定作用呢？我在使用 umi 时接触到了@umijs/plugin-model，它使用起来就是个自定义 hook，

```js
// src/models/useCounter.js
import React, { useState } from 'react';
export default () => {
  const [counter, setCounter] = useState(0);
  const increment = () => setCounter(c => c + 1);
  const decrement = () => setCounter(c => c - 1);
  return { counter, increment, decrement };
};
```

如上我们定义了一个自定义 hook，放在 models/useCounter.js 文件中，umi 约定在 src/models 目录下的文件为项目定义的 model 文件。每个文件需要默认导出一个 function，该 function 定义了一个 Hook，不符合规范的会被过滤掉。文件名对应最终 model 的 name，我们可以通过插件提供的 API 来消费 model 中的数据，就像这样，

```js
import React from 'react';
import { useModel } from 'umi';

export default () => {
  const { counter, increment, decrement } = useModel('counter');
  return (
    <>
      <h2 data-testid="count">{counter}</h2>
      <button onClick={increment}>add</button>
      <button onClick={decrement}>minus</button>
    </>
  );
};
```

useModel 有两个参数，namespace 和 updater。

- namespace - 就是 hooks model 文件的文件名，如上面例子里的 useAuthModel
- updater - 可选参数。在 hooks model 返回多个状态，但使用组件仅引用了其中部分状态，并且希望仅在这几个状态更新时 rerender 时使用（性能相关）。

## 分析实现

下面我们就分析@umijs/plugin-model 是怎么使自定义 hook 中的状态能够被不同组件共享的。

插件会静态分析我们定义的 hooks，借助 AST 定制成 Provider->Consumer 的结构，把 hooks 中的状态托管到 Context 中向下分发，再利用 useModel 获取消费，useModel 本质使用了原生的 useContext。

对于一项陌生的技术，了解整体的机制后再去使用心里会从容坦然的多，倒不至于需要了解所有的实现细节，待遇到实战疑难问题再去探究细节原理比使用之初就摸清所有实现细节来的更有效率，更深刻，更有针对性。
