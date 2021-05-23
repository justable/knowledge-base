# ReactSuspense 原理

## 什么是 Suspense

Suspense 通过包裹异步组件，使得在异步组件加载时显示 loading 动画，加载完毕后再渲染异步组件。使用形式如下所示：

```jsx | pure
const OtherComponent = React.lazy(() => import('./OtherComponent'));
function MyComponent() {
  return (
    <React.Suspense fallback={<Spinner />}>
      <OtherComponent />
    </React.Suspense>
  );
}
```

## Suspense 实现原理

目前异步组件一定要使用 React.lazy 创建，React.lazy 接收`() => Promise`作为参数，整个过程是这样的：

当 Promise 为 pending 状态时，throw 该 Promise，被 Suspense 的 componentDidCatch 接收，Suspense 显示 loading 状态；

当 Promsie 由 pending 转为 rejected 时，throw error 信息，被 Suspense 的 componentDidCatch 接收，Suspense 显示错误信息；

当 Promsie 由 pending 转为 fulfilled 时， Suspense 就直接显示 children 了，也就是 React.lazy 返回的组件。

## 手写 Suspense

MockSuspense：

```jsx | pure
class MockSuspense extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: false, error: '' };
  }

  componentDidCatch(next) {
    if (next.then) {
      this.setState({ loading: true, error: '' });
    } else {
      this.setState({ loading: false, error: next });
    }
    return;
  }

  render() {
    const { children, fallback } = this.props;
    const { loading, error } = this.state;
    if (loading) {
      return fallback;
    }
    if (error) {
      return <div>{error}</div>;
    }
    return children;
  }
}

export default MockSuspense;
```

wrapPromise 模拟 React.lazy：

```js
function wrapPromise(promise) {
  let status = 'pending';
  let result;
  let suspender = promise.then(
    r => {
      status = 'success';
      result = r;
    },
    e => {
      status = 'error';
      result = e;
    },
  );
  return {
    read() {
      if (status === 'pending') {
        throw suspender;
      } else if (status === 'error') {
        throw result;
      } else if (status === 'success') {
        return result;
      }
    },
  };
}

export default wrapPromise;
```

App：

```jsx | pure
import React from 'react';
import ReactDOM from 'react-dom';
import wrapPromise from './wrapPromise';
import MockSuspense from './MockSuspense';

// 模拟后台接口
const fetchUser = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ name: 'Alice' });
    }, 3000);
  });
};

function fetchProfileData() {
  let userPromise = fetchUser();
  return {
    user: wrapPromise(userPromise),
  };
}
const resource = fetchProfileData();

const ProfileDetails = () => {
  const user = resource.user.read();
  return <h1>{user.name}</h1>;
};

function App() {
  return (
    <div>
      <MockSuspense fallback={<h1>Loading profile...</h1>}>
        <ProfileDetails />
      </MockSuspense>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('#root'));
```

## 参考

https://reactjs.org/docs/concurrent-mode-suspense.html
