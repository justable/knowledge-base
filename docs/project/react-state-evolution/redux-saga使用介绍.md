# redux-saga 使用介绍

## 概述

sagas 属于一个错误管理模式，也同时用于控制复杂事务的执行和回滚等，redux-saga 借鉴了这种思想，要进一步了解可以参考[sagas 模式](https://blog.csdn.net/ethanwhite/article/details/53783141)。

在 redux-saga 中，所有的 generator 函数都会执行在 task 容器中，在 yield 关键字后面的 effect 只是一个纯 object，其实是用来给执行容器 task 发送的一个信号，这也是刚接触 redux-saga 感到困惑的地方了。所有的 effect creator 功能参考[redux-saga api](https://redux-saga.js.org/docs/api/)。

redux-saga 的实现原理可以参考[浅析 redux-saga 实现原理](https://zhuanlan.zhihu.com/p/30098155)。

## 核心概念

redux-saga 基于 redux 的扩展能力，对原生的 dispatch 进行了包装。当接收到组件提交的 action 后，首先会触发 reducer，之后再被 saga 消费，注意所有经由 saga 的 put effect 提交的 action 会标记 `action[SAGA_ACTION] = true`，并且同一个 action 是会被 reducer 和 saga 同时命中的，导致执行多次，因此个人认为一些同步 action 没必要写进 saga。

redux-saga 中有三个概念：buffer、channel 和 task。

### buffer

```js
function ringBuffer(limit = 10, overflowAction) {
  let arr = new Array(limit);
  let length = 0;
  let pushIndex = 0;
  let popIndex = 0;
  // 存
  const push = it => {
    arr[pushIndex] = it;
    pushIndex = (pushIndex + 1) % limit;
    length++;
  };
  // 取
  const take = () => {
    if (length != 0) {
      let it = arr[popIndex];
      arr[popIndex] = null;
      length--;
      popIndex = (popIndex + 1) % limit;
      return it;
    }
  };
  // 清空
  const flush = () => {
    let items = [];
    while (length) {
      items.push(take());
    }
    return items;
  };
  return {
    isEmpty: () => length == 0,
    put: it => {
      if (length < limit) {
        push(it);
      } else {
      }
    },
    take,
    flush,
  };
}
// 以下只是在超出limit时处理逻辑不同
export const fixed = limit => ringBuffer(limit, ON_OVERFLOW_THROW);
export const dropping = limit => ringBuffer(limit, ON_OVERFLOW_DROP);
export const sliding = limit => ringBuffer(limit, ON_OVERFLOW_SLIDE);
export const expanding = initialSize =>
  ringBuffer(initialSize, ON_OVERFLOW_EXPAND);
```

### channel

可以认为 channel 是连接 task 和存储的通道，本身也提供了一定的存储能力。

### task

task 是执行 generator 函数的地方，不同的 task 是相互独立的。

我们通过写在 generator 函数中的 effect 信号来告知 redux-saga 执行容器要做什么，因此 effect 信号是个纯对象，redux-saga 执行容器通过 iterater.next().value 来接收 effect 信号再作出不同的操作，实现类似下面这样，

```js
// 执行容器
function task(iterator) {
  const iter = typeof iterator === 'function' ? iterator() : iterator;
  function next(args) {
    const result = iter.next(args);
    if (!result.done) {
      // 获取effect信号
      const effect = result.value;
      if (typeof effect[Symbol.iterator] === 'function') {
        runForkEffect(effect, next);
      } else if (effect.type) {
        switch (effect.type) {
          case 'take':
            runTakeEffect(effect, next);
            break;
          case 'fork':
            runForkEffect(effect, next);
            break;
          // ...
          // 处理其他类型的effect
        }
      }
    }
  }
  next();
}
// 这是入口saga函数
function* mainSaga() {
  const action = yield take();
  console.log(action);
}
// 对应sagaMiddleware.run()
task(mainSaga);
```

## 模拟实现

结合上文 task 的简单实现，

```js
function channel() {
  // 存放一个taker单例
  let taker;
  function take(cb) {
    taker = cb;
  }
  function put(input) {
    if (taker) {
      const tempTaker = taker;
      taker = null;
      tempTaker(input);
    }
  }
  return {
    put,
    take,
  };
}
const chan = channel();
function dispatch(action) {
  chan.put(action);
}
// yield take(pattern)会在当前执行容器对应的channel中注册一个taker函数
function runTakeEffect(effect, next) {
  chan.take(input => {
    next(input);
  });
}
$btn.addEventListener(
  'click',
  () => {
    // 提交action
    dispatch(action);
  },
  false,
);
```

## effect 介绍

### put

会将 action 加入调度中心，并不一定立即执行原生 dispatch，因为 saga 的任务队列可能还有其它 task 在前面。

### call

调用方法，可以是 generator 函数、返回 Promise 的函数或其他普通函数，如果是普通函数就不会阻塞。

### take

take effect 会阻塞当前的 task 执行容器，直到接收到匹配 pattern 的 action，然后就会继续执行，可以对照 channel 的实现来理解。在 runTakeEffect 中注册单例，点击按钮 dispatch 一个 action 触发了 channel.put 逻辑，释放了单例，最后使得 generator 继续执行。

下面是个实现在每次 dispatch action 时输出日志的例子，

```js
import { select, take } from 'redux-saga/effects';
function* watchAndLog() {
  // 因为channel中的单例是消耗型的，所以需要while true来让其一直执行下去，后文会介绍takeEvery effect更加方便处理
  while (true) {
    const action = yield take('*');
    const state = yield select();
    console.log('action', action);
    console.log('state after', state);
  }
}
```

这时如果我希望监听不同的 action 处理不同的逻辑，比如像下面这样的代码，

```js
function* fetchList() {
  while (true) {
    yield take('fetchListA');
    // do somethingA
    const listA = yield call(fetchListA);
    console.log(listA);
    yield take('fetchListB');
    // do somethingB
    const listB = yield call(fetchListB);
    console.log(listB);
  }
}
```

上述代码的问题是 fetchListA 和 fetchListB 是串行的，也就是说执行容器首先会阻塞等待 fetchListA 的 action，而我们希望它们是并行的，能够同时监听响应两种 action。这就引出了 fork effect。

### fork

fork 会让 generator 函数执行在新的 task 容器中，不同的容器对应不同的 channel 因此互不干扰，像下面这样，

```js
function* fetchListA() {
  while (true) {
    yield take('fetchListA');
    const listA = yield call(fetchListA);
    console.log(listA);
  }
}
function* fetchListB() {
  while (true) {
    yield take('fetchListB');
    // do somethingB
    const listB = yield call(fetchListB);
    console.log(listB);
  }
}
function* fetchList() {
  yield fork(fetchListA);
  yield fork(fetchListB);
}
```

不仅仅 take effect 会阻塞容器，其他类似 call（会等待异步接口）这些 effect 都会进行一定时间的阻塞，此时使用 fork 创建新执行容器就可以避免阻塞的发生。

总的来看，会发现 sagaMiddleware.run()创建了一个执行容器，之后的 fork 又在主的执行容器下派生了新的子执行容器，类似下面这样，

```
mainTask
|__taskA
|__taskB
```

### spawn

类似 fork 创建新 task，区别是 spawn 完全独立于父 task，具体使用场景待确定。

### takeEvery

由于 channel 中的单例是消耗型的，每当执行到 take effect，单例被赋值，当响应了指定 action 单例会被消耗，而在上文为了解决这问题，把代码包裹在了 while true，takeEvery effect 则提供了更简单的解决方式，像下面这样，

```js
function* fetchList() {
  //...
}
function* watchFetchList() {
  yield takeEvery('USER_REQUESTED', fetchList);
}
```

takeEvery 是建立在 take 和 fork 上的，其等价于，

```js
const takeEvery = (patternOrChannel, saga, ...args) =>
  fork(function*() {
    while (true) {
      const action = yield take(patternOrChannel);
      yield fork(saga, ...args.concat(action));
    }
  });
```

### takeLatest

类似 takeEvery，不同 action 对应的任务是可以并行的，与 takeEvery 不同的是 takeLatest 会取消上一个 task，

```js
const takeLatest = (patternOrChannel, saga, ...args) =>
  fork(function*() {
    let lastTask;
    while (true) {
      const action = yield take(patternOrChannel);
      if (lastTask) {
        yield cancel(lastTask); // cancel is no-op if the task has already terminated
      }
      lastTask = yield fork(saga, ...args.concat(action));
    }
  });
```

### takeLeading

类似 takeEvery 和 takeLatest，不过 takeLeading 是串行的，只有前一个 task 执行完毕，才会响应 action 执行下一个 task，

```js
const takeLeading = (patternOrChannel, saga, ...args) =>
  fork(function*() {
    while (true) {
      const action = yield take(patternOrChannel);
      yield call(saga, ...args.concat(action));
    }
  });
```

### cancel

可以取消之前使用 fork 创建的 task，

```js
function* mySaga() {
  const task = yield fork(myApi);
  yield cancel(task);
}
```

### actionChannel

上文有说明 channel 会存储 effect 函数单例。actionChannel 可以在 call 阻塞期间缓存多个 USER_REQUEST action，并返回这些 actions，但只会响应第一次 action，

```js
function* takeOneAtMost() {
  const chan = yield actionChannel('USER_REQUEST');
  while (true) {
    const { payload } = yield take(chan);
    yield call(api.getUser, payload);
  }
}
```

### flush

清空 channel 中的之前被 actionChannel 缓存的 action，并返回这些 actions，这些 actions 按需可以被利用，像下面这样，

```js
function* saga() {
  const chan = yield actionChannel('ACTION');
  try {
    while (true) {
      const action = yield take(chan);
      // ...
    }
  } finally {
    const actions = yield flush(chan);
    // ...
  }
}
```

### cancelled

判断一个 task 是否已被取消，

```js
function* saga() {
  try {
    // ...
  } finally {
    if (yield cancelled()) {
      // logic that should execute only on Cancellation
    }
    // logic that should execute in all situations (e.g. closing a channel)
  }
}
```

### select

类似 react-redux 中的 useSelector，可以自定义返回中央 state 的成员。

### race

类似 Promise.race，只要其中一个 effect 成功或失败，整个都会对应成功或失败，如下，

```js
function* fetchUsersSaga() {
  const { response, cancel } = yield race({
    response: call(fetchUsers),
    cancel: take(CANCEL_FETCH),
  });
}
```

假如 fetchUsers 正在执行，此时发起 CANCEL_FETCH action，race 接口会直接返回`{cancel: Object}`对象，并取消 fetchUsers。

### all

类似 Promise.all，会等待所有 effect 完成。

### throttle

节流，只会响应时间间隔中的第一次 action，是使用 take, fork 和 actionChannel 的上层 api，

```js
function* fetchAutocomplete(action) {
  const autocompleteProposals = yield call(Api.fetchAutocomplete, action.text);
  yield put({
    type: 'FETCHED_AUTOCOMPLETE_PROPOSALS',
    proposals: autocompleteProposals,
  });
}
function* throttleAutocomplete() {
  yield throttle(1000, 'FETCH_AUTOCOMPLETE', fetchAutocomplete);
}
```

等价于，

```js
const throttle = (ms, pattern, task, ...args) =>
  fork(function*() {
    const throttleChannel = yield actionChannel(pattern, buffers.sliding(1));
    while (true) {
      const action = yield take(throttleChannel);
      yield fork(task, ...args, action);
      yield delay(ms);
    }
  });
```

### debounce

防抖，不会响应指定间隔内的连续操作，直到操作间隔大于指定时间，才会响应最后一次操作，与节流的区别是节流在指定时间内必然会执行一次。是使用 take, delay, race 和 fork 的上层 api，

```js
function* fetchAutocomplete(action) {
  const autocompleteProposals = yield call(Api.fetchAutocomplete, action.text);
  yield put({
    type: 'FETCHED_AUTOCOMPLETE_PROPOSALS',
    proposals: autocompleteProposals,
  });
}
function* debounceAutocomplete() {
  yield debounce(1000, 'FETCH_AUTOCOMPLETE', fetchAutocomplete);
}
```

等价于，

```js
const debounce = (ms, pattern, task, ...args) =>
  fork(function*() {
    while (true) {
      let action = yield take(pattern);
      while (true) {
        const { debounced, latestAction } = yield race({
          debounced: delay(ms),
          latestAction: take(pattern),
        });
        if (debounced) {
          yield fork(task, ...args, action);
          break;
        }
        action = latestAction;
      }
    }
  });
```

### retry

重新尝试调用方法，可以设置尝试次数，延长时间，

```js
function* retrySaga(data) {
  try {
    const SECOND = 1000;
    const response = yield retry(3, 10 * SECOND, request, data);
    yield put({ type: 'REQUEST_SUCCESS', payload: response });
  } catch (error) {
    yield put({ type: 'REQUEST_FAIL', payload: { error } });
  }
}
```
