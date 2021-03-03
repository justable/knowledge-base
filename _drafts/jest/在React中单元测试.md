# 在 React 中单元测试

平时单测 React 组件主要使用[jest](https://jestjs.io/docs/en/getting-started)、[@testing-library/react](https://testing-library.com/docs/react-testing-library/ap)和[@testing-library/jest-dom](https://github.com/testing-library/jest-dom)，本文主要介绍@testing-library/react 的使用。

## jest

主要介绍一些常见测试场景的用法。

### mock function

```javascript
// mock方法
jest.fn(() => customImplementation);
// 等价于
jest.fn().mockImplementation(() => customImplementation);

// 跟踪已存在的方法
jest.spyOn(object, methodName);

// 覆盖已存在的方法
jest.spyOn(object, methodName).mockImplementation(() => customImplementation);
// 等价于
object[methodName] = jest.fn(() => customImplementation);

// 重置被覆盖的方法，只适用于spyOn
object[methodName].mockRestore();
```

### mock module

```jsx | pure
// map.js
import React from 'react';
import { LoadScript, GoogleMap } from 'react-google-maps';

export default function Map(props) {
  return (
    <LoadScript id="script-loader" googleMapsApiKey="YOUR_API_KEY">
      <GoogleMap id="example-map" center={props.center} />
    </LoadScript>
  );
}
// contact.js
import React from 'react';
import Map from './map';

export default function Contact(props) {
  return (
    <div>
      <address>Contact {props.name}</address>
      <Map center={props.center} />
    </div>
  );
}
// contact.test.js
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import Contact from './contact';
import MockedMap from './map';

jest.mock('./map', () => {
  return function DummyMap(props) {
    return (
      <div data-testid="map">
        {props.center.lat}:{props.center.long}
      </div>
    );
  };
});
it('should render contact information', () => {
  act(() => {
    render(<Contact name="Joni Baez" center={center} />, container);
  });
});
```

### useFakeTimers

```jsx | pure
// card.js
import React, { useEffect } from 'react';

export default function Card(props) {
  useEffect(() => {
    const timeoutID = setTimeout(() => {
      props.onSelect(null);
    }, 5000);
    return () => {
      clearTimeout(timeoutID);
    };
  }, [props.onSelect]);
  return <button onClick={() => props.onSelect(1)}>test</button>;
}
// card.test.js
import React from 'react';
import { render } from 'react-dom';
import { act } from 'react-dom/test-utils';

jest.useFakeTimers();
it('should select null after timing out', () => {
  const onSelect = jest.fn();
  act(() => {
    render(<Card onSelect={onSelect}></Card>, container);
  });
  act(() => {
    jest.advanceTimersByTime(100);
  });
  expect(onSelect).not.toHaveBeenCalled();
  act(() => {
    jest.advanceTimersByTime(5000);
  });
  expect(onSelect).toHaveBeenCalledWith(null);
});
```

###

### jsdom 没有实现的部分

jest 是使用 jsdom 来测试 dom 的，但 jsdom 并没有实现所有 dom 属性，所以有时我们会遇到错误提示：Error: Not implemented，此时我们可以自己模拟那缺失的部分，比如：

```javascript
let originOffsetWidth;
beforeAll(() => {
  originOffsetWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetWidth',
  ).get;
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    get() {
      if (this.className === 'avatarString') {
        return 100;
      }
      return 80;
    },
  });
});
afterAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    get: originOffsetWidth,
  });
});
```

## @testing-library/dom

> [官方文档](https://testing-library.com/docs/dom-testing-library/intro)

###

### queries

部署在 screen 对象上，其实就是提供了一系列查询 document.body 节点的接口，前提是测试用例都是 mount 到全局 document.body 的，[官方文档](https://testing-library.com/docs/dom-testing-library/api-queries)，[screen 源码](https://github.com/testing-library/dom-testing-library/blob/master/src/screen.js)。

**要注意区分 getBy、queryBy 和 findBy**。getBy 如果没有找到会报错；queryBy 没有找到会返回 null；findBy 返回一个 Promise，它默认会在 1000ms 内尽可能的寻找，在有副作用函数的情况下显得尤为重要，当然也可以使用 act()替代。
![queries.png](@images/1598593040721-36cfff3b-0dd2-4869-9aea-0b00a612ade6.png)

### fireEvent

[官方文档](https://testing-library.com/docs/dom-testing-library/api-events)

## @testing-library/react

> [官方文档](https://testing-library.com/docs/react-testing-library/intro)：The `React Testing Library` is a very light-weight solution for testing React components. It provides light utility functions on top of `react-dom` and `react-dom/test-utils`

其本身主要提供了三个 API：

- render
- cleanup
- act

同时也可以获取如下 API，它们其实是 `@testing-library/dom` 的 API：

- screen
- fireEvent

### render

该方法负责把 ReactElement 渲染到 container 中去，是单元测试中主要的渲染方法，**要注意的是其内部会自动调用 act 方法保证副作用函数被执行**，使用方式如下：

```typescript
function render(
  ui: React.ReactElement,
  options?: {
    // 用的不多不介绍了，看官网
  },
): RenderResult;
```

```typescript
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

test('renders a message', () => {
  const { container, getByText } = render(<Greeting />);
  expect(getByText('Hello, world!')).toBeInTheDocument();
  expect(container.firstChild).toMatchInlineSnapshot(`
    <h1>Hello, World!</h1>
  `);
});
```

其中 **RenderResult **包含了一些 dom 选择器，不过平时都用`@testing-library/dom`的 screen 对象。

### cleanup

和 render 相对应，render 将节点树 mount 到 container 中，cleanup 则从 container 中 unmount 节点树，为了每个单元测试的隔离性，需要使用 cleanup 清空节点树。从[源码](https://github.com/testing-library/react-testing-library/blob/master/src/index.js)中可以看到，@testing-library/react 在 afterEach 函数中注册了 cleanup 方法，所以我们无需手动调用它。

### act

是 react-dom/test-utils act 的轻包装，后文有讲解。

## react-test-render

[https://reactjs.org/docs/test-renderer.html](https://reactjs.org/docs/test-renderer.html)

## react-dom/test-utils

[官方介绍](https://reactjs.org/docs/test-utils.html)

### act

```typescript
function act(callback: () => Promise<void | undefined>): Promise<undefined>;
function act(callback: () => void | undefined): void;
```

最初遇到这方法就很困惑，为什么要把方法包裹在 act 方法中，act 内部究竟做了什么事情？我在网上找到了这篇[act()的秘密](https://github.com/threepointone/react-act-examples/blob/master/sync.md)。除了这篇还有以下链接都有对 act()做讨论。

[https://github.com/threepointone/react-act-examples/issues/6](https://github.com/threepointone/react-act-examples/issues/6)
[https://stackoverflow.com/questions/60113292/when-to-use-act-in-jest-unit-tests-with-react-dom?r=SearchResults](https://stackoverflow.com/questions/60113292/when-to-use-act-in-jest-unit-tests-with-react-dom?r=SearchResults)
[https://stackoverflow.com/questions/59077421/react-test-renderer-act-function?r=SearchResults](https://stackoverflow.com/questions/59077421/react-test-renderer-act-function?r=SearchResults)
[https://www.robinwieruch.de/react-testing-library#react-testing-library-asynchronous--async](https://www.robinwieruch.de/react-testing-library#react-testing-library-asynchronous--async)

> 我们知道在 React 组件内部 setState 会触发 batchedUpdates，如果是在 setTimeout 等函数中执行 setState，则不会合并，此时需要使用 React.unstable_batchedUpdates()，这里的 act()就相当于 React.unstable_batchedUpdates()。

最后我去看了 act 的[源码](https://github.com/facebook/react/blob/master/packages/react-dom/src/test-utils/ReactTestUtilsAct.js)，act(callback)会把 callback 丢给[batchedUpdates](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1195)处理，而 batchedUpdates 会合并多个 update，之后再调用[flushWork](https://github.com/facebook/react/blob/master/packages/react-dom/src/test-utils/ReactTestUtilsAct.js#L39)，它的作用就是 flush effects；如果 callback 是异步函数或者是一个返回 Promise 的函数，则会调用[flushWorkAndMicroTasks](https://github.com/facebook/react/blob/master/packages/react-dom/src/test-utils/ReactTestUtilsAct.js#L50)，它会 flush effects，**同时还会等待微队列执行完毕，因为异步函数 await 左边部分或者 Promise 回调函数都是加入微队列执行的**。

看下面的例子：

```jsx | pure
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

function App() {
  const [name, setName] = useState('朱亘');
  return <div>{name}</div>;
}

function AppWithEffect() {
  const [name, setName] = useState('朱亘');
  useEffect(() => {
    setName('朱一旦');
  }, []);
  return <div>{name}</div>;
}

let container;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
});

// 没有副作用的情况下是否使用act包裹没有区别
it('should render 朱亘', () => {
  ReactDOM.render(<App />, container);
  // 通过
  expect(screen.getByText('朱亘')).toBeInTheDocument();
});

it('should render 朱亘', () => {
  act(() => {
    ReactDOM.render(<App />, container);
  });
  // 通过
  expect(screen.getByText('朱亘')).toBeInTheDocument();
});

// 有副作用的情况下，act()可以保证setName('朱一旦')先于后面的expect执行
it('should render 朱一旦', async () => {
  ReactDOM.render(<AppWithEffect />, container);
  // 不通过，因为此时还没有执行setName('朱一旦')
  expect(screen.queryByText('朱一旦')).toBeInTheDocument();
});

it('should render 朱一旦', async () => {
  act(() => {
    ReactDOM.render(<AppWithEffect />, container);
  });
  // 通过，此时setName('朱一旦')已被执行
  expect(screen.queryByText('朱一旦')).toBeInTheDocument();
});
```

上面这个例子说明，在没有副作用的情况下，是否包裹 act()没有区别，都是符合预期的；有副作用的情况下则需要包裹 act()来保证执行顺序。

再来看一个异步 act 的例子：

```jsx | pure
const promise = Promise.resolve('朱一旦');
// mock fetch api
function fetchName() {
  return promise;
}

function App() {
  const [name, setName] = useState('');
  async function handleClick() {
    const res = await fetchName();
    setName(res);
  }
  return (
    <div>
      {name}
      <button onClick={handleClick}>Confirm</button>
    </div>
  );
}

it('should render 朱一旦', async () => {
  render(<App />);
  // 因为handleClick是async function，所以这里要加await
  // 这里如果不用act()包裹，控制台会发出警告，虽然测试结果没有影响
  // Warning: An update to App inside a test was not wrapped in act(...).
  await act(async () => await fireEvent.click(screen.getByRole('button')));
  // 通过，因为上面已经显式的await了，所以此时setName(res)已被执行
  expect(screen.getByText('朱一旦')).toBeInTheDocument();
  // 通过，当然也可以使用findBy，它默认会在1000ms内的不停的试图寻找指定节点
  expect(await screen.findByText('朱一旦')).toBeInTheDocument();
});
```

注意上面例子中执行 fireEvent.click 是包裹在 act()中的，这是因为这个例子的 handleClick 是个 async function，所以后面的测试代码就会默认 rerender 已经完成，但其实不然，可能在 rerender 过程中新增了其他微任务，使用 act()包裹后才能真正保证微队列执行完毕，后面的测试代码才是安全的；

为了突出 act()具有保证微队列执行完毕的特性，再来一个例子，这个例子中使用 Promse 代替异步事件，注意此时执行 fireEvent.click 就不需要包裹在 act()中了，因为后面的测试代码明白当前不是安全状态，会主动使用 findBy 来延迟查找。

```jsx | pure
const promise = Promise.resolve('朱一旦');
function App() {
  const [name, setName] = useState('');
  function handleClick() {
    promise.then(res => setName(res));
  }
  return (
    <div>
      {name}
      <button onClick={handleClick}>Confirm</button>
    </div>
  );
}

it('should render 朱一旦', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button'));
  // 不通过，此时还没有执行setName(res)
  expect(screen.queryByText('朱一旦')).toBeInTheDocument();
  // 通过，因为使用了findBy
  expect(await screen.findByText('朱一旦')).toBeInTheDocument();
});

it('should render 朱一旦', async () => {
  render(<App />);
  act(() => {
    fireEvent.click(screen.getByRole('button'));
  });
  // 如果能看懂这行代码就到位了。
  // 首先我们要明白，当触发了点击事件后，setName(res)会加入微队列中执行，
  // 而下面这行代码，传给act()一个返回promise的函数，按照上文介绍的那样，
  // 这会触发flushWorkAndMicroTasks，这样就能保证在执行接下来的expect前，微队列都被执行完毕。
  await act(() => Promise.resolve());
  // 通过，如果不加上面这行代码，则不通过
  expect(screen.queryByText('朱一旦')).toBeInTheDocument();
});
```

在一步步测试的过程中，对 React 的机制有了进一步的理解，但也产生了一个问题，我们知道微队列是会在当前渲染帧执行的，那么 useEffect 的回调函数是否是放在微队列中的呢，还是在下一帧执行？这需要进一步验证，可以使用 chrome 的 performance。

## 参考

[https://www.robinwieruch.de/react-testing-library](https://www.robinwieruch.de/react-testing-library)
[https://reactjs.org/docs/testing-recipes.html](https://reactjs.org/docs/testing-recipes.html)
