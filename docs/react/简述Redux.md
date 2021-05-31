Redux 是一个 JS 应用的状态容器，和 react-redux 配合实现了 React 应用跨组件的状态共享。
​

它内部的逻辑就像下面这么简单：

```javascript
class Redux {
  state = {};
  todos = [];
  reducer = () => {};

  constructor(reducer) {
    this.reducer = reducer;
  }

  subscribe = callback => {
    this.todos.push(callback);
  };

  dispatch = action => {
    const prevState = this.state;
    const currentState = (this.state = this.reducer(prevState, action));
    todos.forEach(todo => {
      todo(currentState);
    });
  };
}
```

它本质是基于 pub/sub 模式，先注册 reducer 作为状态变更逻辑，接着订阅回调函数，redux 会在每次状态变更后执行回调函数，最后使用 dispatch 发起状态变更信号就可以达成闭环了。

在 React 应用中，通常由 react-redux 帮我们完成回调函数的订阅，react-redux v7 之前需要使用 connect 连接组件，组件内才能访问 redux 状态，其本质是基于高阶组件，讲数据通过 props 向下传递；v7 后直接可以通过`useSelector`这个 hook 访问 redux 状态，这应该是 v7 版本后 react-redux 通过了 React Context 自上向下传递数据流，并通过 react 内置的 useContext 接收数据。

下面是个不和 react 绑定使用的例子：

```javascript
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

可以看到 Redux 用起来就和我写的那 21 行代码一样，当然其内部还做了其他比如合并 reducer，支持 middleware 等功能，但它的最简逻辑真的很简单。

另外我还写了一个在应用中单独使用 redux，使用 redux-thunk，使用 redux-saga，使用 dva 的对比案例（虽然它们都一脉相承，但应用层的使用方式还是有差异的）。

[仓库地址](https://github.com/justable/react-state-evolution)。
