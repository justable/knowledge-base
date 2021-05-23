## 什么是 Context

Context 是 React 原生支持的一种数据共享方案。React 组件树的数据传递是自上而下的，没有 Context 之前，只能通过 props 逐层向下传递，这种方案的问题是数据会流经多个节点，而中间这些节点可能并不需要使用这些数据，也得无奈的把数据继续传递给自己的 children；或者借助 redux 这种中央状态共享库来解决。有了 Context 之后，组件树中的数据就可以基于生产消费者模型进行点对点的传递，就像下面这样：

```jsx | pure
const ThemeContext = React.createContext('light');

const GrandFather = () => {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={theme}>
      <Father></Father>
    </ThemeContext.Provider>
  );
};
const Father = () => {
  return (
    <div>
      <Son></Son>
    </div>
  );
};
const Son = () => {
  return (
    <ThemeContext.Consumer>{value => <div>{value}</div>}</ThemeContext.Consumer>
  );
};
```

自从 React hook 出现后，消费者组件中也可以直接使用内置的`useContext(ThemeContext)`来获取数据。
​

## 实现原理

我看了 React 关于 Context 实现的源码后，发现本质是很简单的，它在 createContext 函数内部创建了一个 context 对象，就像下面这样：

```jsx | pure
const React = {
  createContext(defaultValue) {
    const context = {
      $$typeof: 'REACT_CONTEXT_TYPE',
      // 要共享的数据
      _currentValue: defaultValue,
      Provider: null,
      Consumer: null,
    };
    context.Provider = {
      $$typeof: 'REACT_PROVIDER_TYPE',
      _context: context,
    };
    context.Consumer = context;
    return context;
  },
};
```

它利用了 JS  对象是引用类型的特点，在  createContext  时使  Provider  和  Consumer  同时持有  context  对象的引用，当  Provider  组件接收  value  属性时更改  context  引用的\_currentValue 值，触发 rerender 后作为下层组件的 Consumer  自然也 rerender 了，因此能从自身持有的 context 对象中取得最新的\_currentValue 值。
​

使用 Context 共享数据有个要求是生产者和消费者必须处在同一个直系渲染树中，因此我们可以将全局共享数据提升到根组件然后通过 Context 向下分发，这样就能扮演 redux 这类中央共享状态库的作用了，就像这样：

```jsx | pure
const initialState = { theme: 'light' };

const GlobalContext = React.createContext();

function reducer(state, action) {
  // do something
}

const ReduxApp = () => {
  const [store, dispatch] = useReducer(reducer, initialState);
  return (
    <GlobalContext.Provider value={{ store, dispatch }}>
      <App />
    </GlobalContext.Provider>
  );
};

ReactDOM.render(<ReduxApp />, document.getElementById('root'));
```
