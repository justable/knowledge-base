# Redux 原理 2

Redux 是一个 JS 应用的状态容器，和 react-redux 配合实现了 React 应用跨组件的状态共享。使用起来就像下面这样：

```js
import React from 'react';
import { render } from 'react-dom';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import App from './components/App';

const rootReducer = combineReducers({
  todos,
  visibilityFilter,
});
const store = createStore(rootReducer);
render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root'),
);
```

接着 react-redux 会帮我们订阅一个重绘函数，比如`store.subscribe(rerender)`，然后我们在 App 中通过 dispatch 一个 action 来发起状态变更信号，redux 会执行`reducer(state, action)`把结果作为新的内部状态，并执行之前订阅的函数发起重绘。

react-redux v7 之前需要使用 connect 连接组件，组件内才能访问 redux 状态，v7 后直接可以通过`useSelector`这个 hook 访问 redux 状态，这应该是 v7 版本后 react-redux 通过了 React Context 自上向下传递数据流，并通过 react 内置的 useContext 接收数据，没看过 react-redux 源码硬猜的。。。

为了更便于理解 redux，下面举个不和 react 绑定使用的例子：

```js
import Redux from 'redux';

const $root = document.getElementById('root');
function reducer(state, action) {
  if (typeof state === 'undefined') {
    return 0;
  }
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
  }
}

const store = Redux.createStore(reducer);

function render() {
  $root.innerHTML = store.getState().toString();
}

store.subscribe(render);

document.getElementById('increment').addEventListener('click', () => {
  store.dispatch({ type: 'INCREMENT' });
});

document.getElementById('decrement').addEventListener('click', () => {
  store.dispatch({ type: 'DECREMENT' });
});
```

以上代码就完成了一个计数的功能，这样看 redux 工作流程就完整清晰多了，平时 React 应用中有些流程是 react-redux 帮我们做的，所以我们看到的流程才不是很完整。

另外我还写了一个在应用中单独使用 redux，使用 redux-thunk，使用 redux-saga，使用 dva 的对比案例（虽然它们都一脉相承，但应用层的使用方式还是有差异的）。

[仓库地址](https://github.com/justable/react-state-evolution)。
