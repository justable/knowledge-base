# React 渲染流程

## 初始渲染源码脉络总览

```typescript
// V17.0.0-alpha.0
├── ReactDOM.render(<App />, document.getElementById('root'))
  ├── legacyRenderSubtreeIntoContainer() => updateContainer()
    ├── enqueueUpdate(current, update) // 将待更新的内容挂载到fiber.updateQueue上
    ├── scheduleUpdateOnFiber(current, lane, eventTime) // 🌈(1)
      ├── const root = markUpdateLaneFromFiberToRoot(fiber, lane) // 向上merge lanes，lane是v17之后对expirationTime的替代，V16 markUpdateTimeFromFiberToRoot
      ├── performSyncWorkOnRoot(root) // if: 同步
        ├── renderRootSync(root, lanes) // ✨Render/Reconciliation阶段
          ├── workLoopSync()
            ├── performUnitOfWork(workInProgress) // loop: workInProgress !== null
              ├── next = beginWork(current, unitOfWork, subtreeRenderLanes)
                ├── return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderLanes) // if: workInProgress.tag === IndeterminateComponent
                  ├── value = renderWithHooks(null, workInProgress, Component, props, context, renderLanes) // 返回了ReactElement
                    ├── ReactCurrentDispatcher.current = HooksDispatcherOnMount // HooksDispatcherOnUpdate 挂载useXXX
                    ├── let children = Component(props, secondArg) // ✨调用render函数，🐛待探索hooks链表过程🌈(2)
                    ├── ReactCurrentDispatcher.current = ContextOnlyDispatcher // 重置useXXX
                  ├── value = renderWithHooks(null, workInProgress, Component, props, context, renderLanes) // if: __DEV__ && StrictMode 重复执行render函数
                  ├── reconcileChildren(null, workInProgress, value, renderLanes) // ✨遍历后代节点，从value.props.children中获得后代信息，再连接到fiber.child上🌈(3)
                  ├── return workInProgress.child
                ├── return updateClassComponent() // if: workInProgress.tag === ClassComponent
                  ├── constructClassInstance(workInProgress, Component, nextProps)
                    ├── adoptClassInstance(workInProgress, instance)
                      ├── instance.updater = classComponentUpdater // 初始化updater
              ├── completeUnitOfWork(unitOfWork) // if: next === null 说明已经在最底层的子节点，🐛待调试探索，与performUnitOfWork相反根据fiber.return向上遍历🌈(4)
        ├── commitRoot(root) // ✨Commit阶段，🐛待调试探索
          ├── commitRootImpl(root, renderPriorityLevel) // 🐛得仔细看下runWithPriority方法，涉及调度
            ├── commitMutationEffects(finishedWork, root, renderPriorityLevel) // ✨完成了dom的更新🌈(5)
            ├── commitLayoutEffects(finishedWork, root, lanes) // ✨赋值ref，触发useLayoutEffect回调函数
            ├── requestPaint() // 告诉Scheduler在当前渲染帧末尾返还控制权，让浏览器有机会渲染，🐛待探索如何实现的
      ├── performConcurrentWorkOnRoot() // 并发
```

## 一个例子

```jsx | pure
function fetch() {
  return Promise.resolve([{ text: 'foo' }, { text: 'bar' }]);
}
function Input(props) {
  function onKeyDown(e) {
    if (window.event.keyCode === 13) {
      props.onEnter();
    }
  }
  return <input ref={props.inputRef} type="text" onKeyDown={onKeyDown} />;
}
function List(props) {
  return (
    <ul>
      {props.todos.map((todo, key) => {
        return <li key={key}>{todo.text}</li>;
      })}
    </ul>
  );
}
function App() {
  const [todos, setTodos] = useState([]);
  const inputRef = useRef(null);
  function onEnter() {
    if (inputRef.current) {
      setTodos(todos.concat([{ text: inputRef.current.value }]));
      inputRef.current.value = '';
    }
  }
  useEffect(() => {
    fetch().then(res => {
      if (Array.isArray(res)) {
        setTodos(tds => tds.concat(res));
      }
    });
  }, []);
  return (
    <div>
      <p>请输入待办项</p>
      <Input inputRef={inputRef} onEnter={onEnter}></Input>
      <p>待办列表</p>
      <List todos={todos}></List>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
```

初始化渲染调用栈，
![企业微信截图_4d5bb002-5346-4568-bbfc-994e76bbd592.png](@images/1599029844760-27eeb8c6-ed55-4ff4-9bb9-0c9549797a83.png)
useEffect 中的 setTodos()之后的调用栈，
![企业微信截图_dfd965ee-5c15-47b5-8010-729ed093c7dc.png](@images/1599030102805-55b97b1a-c4a0-4e7c-9c74-3281c2a8ed77.png)

## 初始化渲染

一切从**ReactDOM.render()**开始，首先会创建 FiberRoot 和 RootFiber，建立如下结构（图片非原创），
![react_dom_render.png](@images/1598320042513-208eb234-edbf-4d61-b05f-ff0866a4cb55.png)
这是一棵渲染树的根基，FiberRoot 是整棵渲染树的根节点，RootFiber 则是 Fiber 树的根节点。

由于我们这次是同步渲染，所以会进入**performSyncWorkOnRoot()**，接着再走到**workLoopSync()**，**workLoopSync()**的代码如下所示，

```jsx | pure
function workLoopSync() {
  // Already timed out, so perform work without checking if we need to yield.
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
```

在这个 while 循环中，fiber 树的遍历开始了，**RootFiber 作为 fiber 树的根节点，会被第一个执行，也就是说当前的 workInProgress 对应的是 RootFiber**。

由于我们这次是初始化渲染，其实 fiber 树只有 RootFiber 孤零零一个节点，在后续的执行中 React 会一步步构建 fiber 树。

一路走到**beginWork()**，这里会根据 workInProgress.tag 来判断当前 fiber 的类型，比如 IndeterminateComponent、FunctionComponent、ClassComponent、HostRoot 等。RootFiber 的类型是 HostRoot，程序会进入处理 HostRoot 类型的 updateHostRoot()，在这里会从 workInProgress.updateQueue 获取待渲染的 ReactElement 树，也就是我们的`<App />`。代码如下所示，

```javascript
function updateHostRoot(current, workInProgress, renderLanes) {
  // 会处理updateQueue把待渲染的ReactElement树赋值给workInProgress.memoizedState
  processUpdateQueue(workInProgress, nextProps, null, renderLanes);
  var nextState = workInProgress.memoizedState;
  // nextChildren就是我们的<App />
  var nextChildren = nextState.element;
  // 由于是初始化渲染，reconcileChildren会把nextChildren包装成新的fiber节点赋值给workInProgress.child
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  // 返回给performUnitOfWork的next变量
  return workInProgress.child;
}
function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
  // current是workInProgress.alternate
  // 因为是初始化渲染，所以current等于null
  if (current === null) {
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes,
    );
  } else {
    // 更新渲染会走这
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes,
    );
  }
}
function performUnitOfWork(unitOfWork) {
  var next = beginWork$1(current, unitOfWork, subtreeRenderLanes);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    // If this doesn't spawn new work, complete the current work.
    completeUnitOfWork(unitOfWork);
  } else {
    // 把workInProgress指向了workInProgress.child，就开始处理下一个fiber节点了
    workInProgress = next;
  }
}
```

上面代码执行一轮后 workInProgress 就指向了 AppFiber，接着又开始新的一个任务单元。此时的 workInProgress.tag 是 IndeterminateComponent（React 第一次执行我们的代码不知道具体的类型，之后就是 FunctionComponent 了），程序进入 mountIndeterminateComponent()，在这里 React 会获取 nextChildren 也就是下面这个 ReactElement，

```jsx | pure
<div>
  <p>请输入待办项</p>
  <Input inputRef={inputRef} onEnter={onEnter}></Input>
  <p>待办列表</p>
  <List todos={todos}></List>
</div>
```

之后又会通过 reconcileChildren()创建新的 DivFiber 赋值给 AppFiber.child，并把 workInProgress 指向 DivFiber，开始下一个单元任务。我们要注意的是，React 根据 fiber.tag 类型会进行不同的任务处理，具体细节可以查看源码 ReactFiberBeginWork.js。

当处理 DivFiber 的时候，原生 dom 的 fiber.tag 是 HostComponent，程序会进入 updateHostComponent()，此时 DivFiber 的 nextChildren 是个数组，React 会在 reconcileChildren()中将这个 children 数组通过 fiber.sibling 连接起来，并把第一个 child 赋值给 workInProgress.child，也就是 DivFiber.child 为 PFiber，PFiber.sibling 又指向了下一个兄弟节点。

当 workInProgress 指向 PFiber 时，nextChildren 是段文本，React 不会把文本当作节点，看下面这段代码，

```javascript
function updateHostComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps;
  var nextChildren = nextProps.children;
  var isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    nextChildren = null;
  }
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
```

所以 workInProgress.child 等于 null，PFiber 已经算叶子结点了，此时就会触发 completeUnitOfWork()，在这里会创建 HTMLParagraphElement 实例赋值给 PFiber.stateNode，之后还进行了一系列 effect 处理，把当前 fiber 的 effect 归并到父级 fiber 上去，处理完后就进行如下处理，

```javascript
var siblingFiber = completedWork.sibling;
if (siblingFiber !== null) {
  // If there is more work to do in this returnFiber, do that next.
  workInProgress = siblingFiber;
  return;
} // Otherwise, return to the parent
completedWork = returnFiber; // Update the next thing we're working on in case something throws.
workInProgress = completedWork;
```

也就是说如果有兄弟节点则把 workInProgress 指向 workInProgress.sibling，也就是 InputFiber，如果没有兄弟节点，就把 workInProgress 指向 workInProgress.return，React 的这种遍历方式称作深度优先遍历。

程序一直走到 workInProgress 是 ulFiber 的时候，这个例子中第一次渲染 ul 下面并没有子节点，所以此时的 ulFiber 算是叶子结点了，之所以在这里提上一句，是因为后面的更新渲染 ulFiber 就会有子节点了。

之后 Render/Reconciliation 的过程就不再赘述了。

程序进入 Commit 阶段。
\*\*
未完待续。

## 更新渲染

在这个例子中，useEffect 的回调函数或者在输入框输入字符并按回车键后，都会开始更新渲染。

假设我们现在是 useEffect 的回调函数触发的更新渲染，之后的 Render/Reconciliation 阶段与初始化渲染并没有什么不同，我们跳过没什么两样的部分，直接把焦点移到 workInProgress 等于 ulFiber，程序进入 updateHostComponent()阶段，看如下代码，

```javascript
function updateHostComponent(current, workInProgress, renderLanes) {
  // ul
  var type = workInProgress.type;
  // { children: Array(2) }
  var nextProps = workInProgress.pendingProps;
  // { children: [] }
  var prevProps = current !== null ? current.memoizedProps : null;
  // nextChildren是个数组，数组包含两个li的ReactElement对象，这其实就是例子中的如下部分
  // <ul>
  //  {props.todos.map((todo, key) => {
  //    return <li key={key}>{todo.text}</li>;
  //  })}
  // </ul>
  var nextChildren = nextProps.children;
  // 后面没什么不同
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
```

从这里可以看出 React 的 Reconciliation 机制的一些端倪，React 会把更新都先作用于 workInProgress 节点，上面的 nextChildren 也是取自 workInProgress.pendingProps.children，并且能从 current.memoizedProps 访问到之前的状态，这也是 fiber 数据架构的魅力所在了。

更新渲染的 Render/Reconciliation 阶段是讲完了，但程序自**setTodos()**开始触发更新渲染到新一轮的 Render/Reconciliation 阶段开始，这之间 React 是如何调度的呢？

**setTodos()**实际上会调用到**dispatchAction()**，创建一个 update 并和当前 fiber 绑定，本例中 setTodos()是在 App 节点触发的，所以这个 update 会和 AppFiber 绑定，在 Render/Reconciliation 阶段遍历 fiber 树时这个 update 就会被消耗加入 effect list 中，在 commit 阶段 effect list 的内容会被执行并应用于 dom。我使用 Chrome 的 Performance 展现了自按下回车键后的函数调用栈，如下图所示，![企业微信截图_c5929610-e241-4eaf-a7ac-d5ad8be58262.png](@images/1599028839277-3bd18554-38c7-40f7-b32a-a9e450399c04.png)![企业微信截图_d6bc8b23-75b6-4778-8d33-726150daa390.png](@images/1599029193679-d164f21f-15b5-46a4-9166-2efcecb1d35f.png)![企业微信截图_5b8e703b-ff89-4714-b054-803365f536c2.png](@images/1599029262060-72270c6c-0d88-40b6-b9f8-fb1f9fcea04b.png)
我们发现**dispatchAction()**之后会调用**scheduleSyncCallback()**，这个方法会把本次待执行方法（指 performSyncWorkOnRoot）加到全局队列 syncQueue 中，syncQueue 中的方法会在 flushSyncCallbackQueue()时执行或在下一个 tick 执行。相关代码如下所示，

```javascript
function ensureRootIsScheduled() {
  scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
}
function scheduleSyncCallback(callback) {
  // Push this callback into an internal queue. We'll flush these either in
  // the next tick, or earlier if something calls `flushSyncCallbackQueue`.
  if (syncQueue === null) {
    syncQueue = [callback]; // Flush the queue in the next tick, at the earliest.
    immediateQueueCallbackNode = Scheduler_scheduleCallback(
      Scheduler_ImmediatePriority,
      flushSyncCallbackQueueImpl,
    );
  } else {
    // Push onto existing queue. Don't need to schedule a callback because
    // we already scheduled one when we created the queue.
    syncQueue.push(callback);
  }
  return fakeCallbackNode;
}
```

从调用栈截图可以看到，之后确实调用了**flushSyncCallbackQueue()**，这样**performSyncWorkOnRoot()**就被执行了，**performSyncWorkOnRoot()**在我们的初始化渲染过程中就出现过，说明要开始 Render/Reconciliation 阶段了。之后的过程和初始化渲染并没有什么不同，只不过此时的渲染树已经建立好了，要做的是 diff 操作，要注意的是，**无论 setState 是在哪个节点触发，最终都会从 RootFiber 节点开始遍历**。

上面代码中的**Scheduler_scheduleCallback()**就是**unstable_scheduleCallback()**，最后附上`scheduler.js`中包含的方法，都是比较重要的。

```javascript
// scheduler.js
export {
  ImmediatePriority as unstable_ImmediatePriority,
  UserBlockingPriority as unstable_UserBlockingPriority,
  NormalPriority as unstable_NormalPriority,
  IdlePriority as unstable_IdlePriority,
  LowPriority as unstable_LowPriority,
  // 修改currentPriorityLevel并执行回调函数
  unstable_runWithPriority,
  unstable_next,
  unstable_scheduleCallback,
  unstable_cancelCallback,
  unstable_wrapCallback,
  unstable_getCurrentPriorityLevel,
  unstable_shouldYield,
  unstable_requestPaint,
  unstable_continueExecution,
  unstable_pauseExecution,
  unstable_getFirstCallbackNode,
  getCurrentTime as unstable_now,
  forceFrameRate as unstable_forceFrameRate,
};
```

## 注意点

- 初始化渲染和更新渲染的整体代码流程是一样的，只是入口不同。

```javascript
// 初始化渲染
├── ReactDOM.render()
	├── legacyRenderSubtreeIntoContainer()
		├── updateContainer()
      ├── enqueueUpdate(fiber, update) // 将待更新的内容挂载到fiber.updateQueue上
      ├── scheduleUpdateOnFiber(fiber, lane, eventTime)
// Class 组件
├── this.setState() // 即this.updater.enqueueSetState
  ├── enqueueUpdate(fiber, update) // 将待更新的内容挂载到fiber.updateQueue上
  ├── scheduleUpdateOnFiber(fiber, lane, eventTime)
// Hooks 组件
├── const [_, setState] = useState()
├── setState() // 即ReactFiberHooks.js中的dispatchAction
  ├── scheduleUpdateOnFiber(fiber, lane, eventTime)
```

- React 中的一个任务单元对应一个 fiber 节点，每次处理完当前任务单元就会把下一个 fiber 节点作为任务单元，fiber 是任务调度体系的最小粒度
- 一个任务单元包含 beginWork 和 completeUnitOfWork 两阶段，beginWork 会对 workInProgress 做一系列处理，之后让 workInProgress 指向下一个 fiber 节点开始新的任务单元，直到叶子节点，叶子节点必然是原生 dom 类型；当 workInProgress 是叶子节点时就会触发 completeUnitOfWork，completeUnitOfWork 会归并 effect list 到父节点上（workInProgress.return），之后让 workInProgress 指向下一个 fiber 节点开始新的任务单元。
- 在 reconcileChildren()执行时，初始化渲染和更新渲染的执行逻辑有所不同。

```javascript
function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
  // current是workInProgress.alternate
  // 因为是初始化渲染，所以current等于null
  if (current === null) {
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes,
    );
  } else {
    // 更新渲染会走这
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes,
    );
  }
}
```

- 在 🌈(2)标记处，执行 render 函数，此时就会调用使用到的 hooks，而 useXXX 内部会通过 **mountWorkInProgressHook()** 将 hooks 按调用次序挂载到 workInProgressHook 链表上，并存储到 currentlyRenderingFiber.memoizedState 上，render 函数执行完毕后会清空 workInProgressHook 链表以备下一次渲染，下一次执行 render 函数时通过 **updateWorkInProgressHook()** 依次从 currentlyRenderingFiber.memoizedState 获取 hook。
- 在 🌈(3)标记处，之前通过 render 函数创建了 ReactElement 对象，整个组件树是通过 props.children 连结的，reconcileChildren 则会根据此转化为 fiber 链表。
- 在 🌈(5)标记处，会调用相关 dom api 将此次渲染的变动更新到 dom 树上。
- 不建议在 hooks deps 使用 ref 获取的 dom，比如`useEffect(_, [ref.current])`，因为 ref 的赋值是延后的（在 Commit 阶段），在 ref 改变前 render 函数已经被执行。当需要实时测量 dom 的变化，应该使用 functional ref，这会在 Commit 阶段赋值时立即被调用。
- 一次渲染整体分为 Render/Reconciliation 和 Commit 两个阶段，前者任务被分片可以被打断，后者一气呵成会阻塞浏览器渲染主线程。

## FAQ

- 本例中当 App()被执行后，useEffect 的回调函数被存放在了哪，又是在什么时候被调用的，useLayoutEffect 呢？

useLayoutEffect 的回调函数是在 commitLayoutEffects 阶段调用的，但是没有找到 useEffect 回调函数是何时调用的，应该和 scheduledHostCallback/workLoop/invokeGuardedCallback 这几个函数有关，交由 BOM API 执行了，源码涉及到 schedule，有点看不懂。

暂且把回调函数取名为 callback，在 Render/Reconciliation 阶段 App()执行后，callback 会和当前 AppFiber 绑定，到了 commit 阶段，会从 fiber 树中取出放到变量 pendingPassiveHookEffectsMount 中，再在合适的时机调用 flushPassiveEffects()，这样 callback 就被执行了，具体调用栈如下

```javascript
// Render/Reconciliation阶段App()执行后callback会存到fiber树中
// commit阶段时在从fiber树中获取并存放到pendingPassiveHookEffectsMount
commitLayoutEffects()
commitLifeCycles()
schedulePassiveEffects()
enqueuePendingPassiveHookEffectMount() {
  // 存放在全局变量pendingPassiveHookEffectsMount中
  pendingPassiveHookEffectsMount.push(effect, fiber)
}
// 消费阶段
flushPassiveEffects()
flushPassiveEffectsImpl() {
  // 从pendingPassiveHookEffectsMount获取_effect2（指callback）再传给invokeGuardedCallback()
  invokeGuardedCallback(null, invokePassiveEffectCreate, null, _effect2);
}
invokeGuardedCallbackImpl()
// 之后过程就不一一罗列了，可以自行全局搜索源码分析或者在chrome查看函数调用栈
```

- Render/Reconciliation 阶段任务的可中断和可恢复体现在哪？

首先我们要了解，在 React 的 Render/Reconciliation 阶段也分为两种模式，**performSyncWorkOnRoot()**和**performConcurrentWorkOnRoot()**，从方法名也能看出前者是同步后者是并发。而可中断和可恢复是体现在并发模式中的，看如下代码，

```javascript
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```

关键就在**shouldYield()**上，`shouldYield`其实就是看时间用完了没（`idleDeadline.timeRemaining()`），没用完就继续处理下一个任务单元，用完了就跳出循环，把时间控制权还给主线程，等下一次`requestIdleCallback`回调再接着做。中断了的任务会在当前任务对应的 fiber 上打个 tag 并保存当前任务结果，下次又执行到这个时就会进行恢复。

- **performSyncWorkOnRoot()**和**performConcurrentWorkOnRoot()**是有什么来决定的？

TODO...

- 更新渲染中的变化部分是如何被 React 收集的？

当遍历到叶子节点时会触发**completeUnitOfWork()**，在这里会向上合并 effect list 到父节点。到了 commit 阶段的**commitMutationEffects()**就会消费这些 effect list 应用到 dom，具体细节可以看源码，在操作 dom 时会按类型进行操作，如下代码所示，

```javascript
function commitMutationEffectsImpl() {
  const primaryEffectTag = effectTag & (Placement | Update | Hydrating);
  switch (primaryEffectTag) {
    case Placement: {
      commitPlacement(fiber);
      // Clear the "placement" from effect tag so that we know that this is
      // inserted, before any life-cycles like componentDidMount gets called.
      // TODO: findDOMNode doesn't rely on this any more but isMounted does
      // and isMounted is deprecated anyway so we should be able to kill this.
      fiber.effectTag &= ~Placement;
      break;
    }
    case PlacementAndUpdate: {
      // Placement
      commitPlacement(fiber);
      // Clear the "placement" from effect tag so that we know that this is
      // inserted, before any life-cycles like componentDidMount gets called.
      fiber.effectTag &= ~Placement;
      // Update
      const current = fiber.alternate;
      commitWork(current, fiber);
      break;
    }
    case Hydrating: {
      fiber.effectTag &= ~Hydrating;
      break;
    }
    case HydratingAndUpdate: {
      fiber.effectTag &= ~Hydrating;
      // Update
      const current = fiber.alternate;
      commitWork(current, fiber);
      break;
    }
    case Update: {
      const current = fiber.alternate;
      commitWork(current, fiber);
      break;
    }
  }
}
```

- batchedUpdates 的工作原理，在 setTimeout()中为什么会失效（据说 V17 之后不再失效了，为什么）要使用 unstable_batchedUpdates？

TODO...

- React.memo 或 PureComponent 会在遍历节点树时对 props 属性做浅对比，如果引用没有改变就跳过 children 的重绘。那么没有使用 React.memo 或 PureComponent 时，props 即使没有改变也会重绘 children，但 react 在重绘时的 diff 步骤发现 children 根本没有变化，那么 children 就不会被销毁重建。

## 总结

React 的渲染机制是比较复杂的，如果要扣细节真的很头大，作为框架使用者，只需要在心中存有整体的运作流程图，日常开发中出了问题时，能够在流程图中初略找到位置，再去调试源码了解细节，并做好笔记补充到流程图上，而不必一口气把心中的流程图画的很详细。

本文就作为我心中流程图的存档吧。

## 参考

[http://www.ayqy.net/blog/dive-into-react-fiber/](http://www.ayqy.net/blog/dive-into-react-fiber/)
