# ReactHooks 原理

## 概述

本文不会介绍关于 hooks 的用法，官网已经有了详尽的说明。主要从源码实现层面来理一理 hooks 的运作机制（目前主要讲解 useState、useReducer 和 useEffect），会涉及到一些 reconciler 的知识，并且以几个 hooks 使用的注意事项作为引子进行探索。

## React 整体运作的模型

> 首先我们要初步了解 React 整体运作的模型。

我们平时写的 JSX 组件最终会转义成 React.createElement 方法创建出一个 ReactElement，它的主要结构如下：

```javascript
const ReactElement = {
  $$typeof: REACT_ELEMENT_TYPE,
  type,
  key,
  ref,
  props,
};
```

我们通常会把一个个写好的业务组件放到根组件 App 下（组件通过 props.children 连结成一颗组件树），最终再执行以下代码，

```jsx | pure
ReactDOM.render(<App />, document.getElementById('root'));
```

ReactDOM.render 方法会生成一个 fiberRoot，主要结构如下，

```typescript
interface FiberRoot {
  // 该root的类型，所有类型定义在ReactRootTags.js
  tag: RootTag;
  // 和fiberRoot关联的DOM容器的相关信息，即document.getElementById('root')
  containerInfo: any;
  // 指向当前激活的与之对应的rootFiber节点
  current: Fiber;
  // 当前的fiberRoot是否处于hydrate模式
  hydrate: boolean;
  // 保存该root下一个要渲染的任务
  callbackNode: any;
  // 当前任务的优先级，定义在ReactFiberLane.js
  callbackPriority: LanePriority;
}
```

还会生成一个 rootFiber，挂载在 fiberRoot.current 上，rootFiber.stateNode 又指向 fiberRoot 形成相互引用，主要结构如下，

```typescript
interface Fiber {
  // 用于标记fiber节点的类型，定义在ReactWorkTags.js
  tag: WorkTag;
  // 用于唯一标识一个fiber节点
  key: null | string;
  // 保存ReactElement.type
  elementType: any;
  // The resolved function/class/ associated with this fiber.
  type: any;
  // 对于rootFiber节点而言，stateNode属性指向对应的fiberRoot节点
  // 对于child fiber节点而言，stateNode属性指向对应的组件实例（只有class组件有）
  stateNode: any;
  // 指向父节点
  return: Fiber | null;
  // 指向子节点
  child: Fiber | null;
  // 指向第一个兄弟节点
  sibling: Fiber | null;
  // 当前fiber节点的索引
  index: number;
  // The ref last used to attach this node.
  ref: null | RefObject;
  // 待处理的props数据
  pendingProps: any;
  // 已存储的props数据
  memoizedProps: any;
  // 表示更新队列，比如在setState操作中会先将需要更新的数据存放到这，用于后续调度
  updateQueue: mixed;
  // 已存储的state数据
  memoizedState: any;
  // Dependencies (contexts, events) for this fiber, if it has any
  dependencies: Dependencies | null;
  // fiber节点的模式，定义在ReactTypeOfMode.js
  mode: TypeOfMode;
  // Effect
  effectTag: SideEffectTag;
  subtreeTag: SubtreeTag;
  deletions: Array<Fiber> | null;
  // Singly linked list fast path to the next fiber with side-effects.
  nextEffect: Fiber | null;
  // The first and last fiber with side-effect within this subtree. This allows
  // us to reuse a slice of the linked list when we reuse the work done within
  // this fiber.
  firstEffect: Fiber | null;
  lastEffect: Fiber | null;
  lanes: Lanes;
  childLanes: Lanes;
  // 指向workInProgress树，更新会先作用在WIP节点上，便于diff
  // 双方互用alternate引用形成双缓存
  alternate: Fiber | null;
}
```

总结来讲，ReactDOM.render 方法创建了如下结构，做好了 Reconciliation 的准备，图片非原创。

![react_dom_render.png](@images/1598320682802-695a282b-96b5-4be6-aca3-4651fdcfc852.png)

## 渲染的两大阶段

接着进行渲染的两大阶段--Reconciliation 和 Commit，

Reconciliation 阶段会构建出与组件树相对应的 fiber 树，fiber 结构为整个 React 渲染系统建立了夯实的数据结构基础，fiber 中存放了在 Reconciliation 阶段需要的所有数据，同时又在 fiber.alternate 上维护了一棵 workInProgress 树，所有的 update 都会先作用于 WIP 树。接着对 fiber 树进行了遍历（链表遍历），即包括 diff、时间分片、任务调度、触发生命周期函数等操作，并且这一过程是可以被中断和恢复的（这也是得益于链表结构的特点）。

Commit 阶段则是一鼓作气的把此次渲染的变更部分作用于 DOM，同时触发相应的生命周期函数，这一过程是会阻塞浏览器渲染主线程的，不可被中断。

## 注意事项

> 在整体了解了 React 运作机制后，接着再回到本文的主题--Hooks 的工作原理上。

1. 只能在 React 函数组件调用 hooks，不要在外部函数中调用 hooks；
1. 只在顶层调用 hooks，不要在循环、条件或嵌套函数内部调用 hooks；
1. 不要在顶层使用 hooks 的 setXXX 动作函数，会形成死循环（React 会报错）；
1. 批量调用 hooks 的 setXXX 动作函数会合并成一个，但如果是在 setTimeout 等非 React event handlers 中调用则不会合并。

其实后面两条并非 hooks 的特性导致，只不过在使用 hooks 时也是需要注意的。

### 事项一

> 只能在 React 函数组件调用 hooks，不要在外部函数中调用 hooks

以 useState 为例，源码中是这样的，

```javascript
import ReactCurrentDispatcher from './ReactCurrentDispatcher';
function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current;
  invariant(
    dispatcher !== null,
    'Invalid hook call. Hooks can only be called inside of the body of a function component.',
  );
  return dispatcher;
}
export function useState(initialState) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}
```

```typescript
// ReactFiberHooks.js，探索源码此处上下游可以明白父节点在Reconciliation阶段的生命周期函数和
// render函数执行完才会执行子节点，而Commit阶段的生命周期函数则先于父节点。
let nextCurrentHook = null;
function renderWithHooks(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
) {
  ReactCurrentDispatcher.current =
    current === null || current.memoizedState === null
      ? HooksDispatcherOnMount
      : HooksDispatcherOnUpdate;
  // Component会指向内部的hooks，此时ReactCurrentDispatcher.current是有值的
  // 此处应该是两大阶段的转折点
  let children = Component(props, secondArg);
  // 之后重置，ContextOnlyDispatcher中的useXXX会throw errors
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;
  // ...
  return children;
}
```

useXXX 实际调用的是 ReactCurrentDispatcher.current.useXXX 方法，它会在 Reconciliation 阶段被赋值，之后又重置，所以外部函数调用 hooks 的情况下，ReactCurrentDispatcher.current 只会是 null 或者 ContextOnlyDispatcher，都会报错。

### 事项二

> 只在顶层调用 hooks，不要在循环、条件或嵌套函数内部调用 hooks

useXXX 内部会通过 mountWorkInProgressHook 将 hooks 按调用次序挂载到 workInProgressHook 链表上，并存储到 currentlyRenderingFiber.memoizedState 上，下一次渲染会通过 updateWorkInProgressHook 依次从 currentlyRenderingFiber.memoizedState 获取，这就要求组件每次执行时 hooks 的调用顺序都是严格相同的，理论上即使不在顶层调用 hooks，只要保证执行顺序严格相同，也是可行的，但肯定不推荐。

### 事项三

> 不要在顶层使用 hooks 的 setXXX 动作函数，会形成死循环（React 会报错）

hooks 的重渲机制和以前并没有区别，在顶层使用 hooks 的 setXXX 动作函数就相当于在 class component 的 render 函数中调用 this.setState，很显然这会形成死循环，不过我有个疑问是，当 setState 常量时，为什么不会取消这次重渲呢，diff 的结果应该为空呀？个人猜测应该是待更新队列的建立在 diff 操作之前，

### 事项四

> 批量调用 hooks 的 setXXX 动作函数会合并成一个，但如果是在 setTimeout 等非 React event handlers 中调用则不会合并。

据说 V17 之后统一都会合并，参考[这里](https://stackoverflow.com/questions/48563650/does-react-keep-the-order-for-state-updates/48610973#48610973)和[这里](https://github.com/facebook/react/issues/11527#issuecomment-360199710)。

## 参考

[https://www.cnblogs.com/tangshiwei/p/12209461.html](https://www.cnblogs.com/tangshiwei/p/12209461.html)
[https://stackoverflow.com/questions/48563650/does-react-keep-the-order-for-state-updates/48610973#48610973](https://stackoverflow.com/questions/48563650/does-react-keep-the-order-for-state-updates/48610973#48610973)
[https://github.com/facebook/react/issues/11527#issuecomment-360199710](https://github.com/facebook/react/issues/11527#issuecomment-360199710)
[https://medium.com/the-guild/under-the-hood-of-reacts-hooks-system-eb59638c9dba](https://medium.com/the-guild/under-the-hood-of-reacts-hooks-system-eb59638c9dba)
[https://juejin.im/post/5e53d9116fb9a07c9070da44](https://juejin.im/post/5e53d9116fb9a07c9070da44)
