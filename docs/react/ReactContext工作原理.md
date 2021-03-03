# ReactContext 工作原理

## 概述

其实 ReactContext 的工作原理很简单，它利用了 JS 对象是引用类型的特点，在 createContext 时同时使 Provider 和 Consumer 持有 Context 的引用，当 Provider 组件接收 value 属性时更改 Context 引用的`_currentValue`值，在渲染 Consumer 时自然能获取修改后的`_currentValue`值。

## 举个例子

```jsx | pure
const React = {
  createContext(defaultValue) {
    const context = {
      $$typeof: 'REACT_CONTEXT_TYPE',
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
  createElement(type, config, children) {
    let props = {};
    if (config != null) {
      props = {
        ...config,
      };
    }
    props.children = children;
    return {
      $$typeof: 'REACT_ELEMENT_TYPE',
      type: type,
      props: props,
    };
  },
  isValidElement(object) {
    return (
      typeof object === 'object' &&
      object !== null &&
      object.$$typeof === 'REACT_ELEMENT_TYPE'
    );
  },
};
const NameContext = React.createContext({
  name: '朱亘',
});
const pendingState = { name: '朱一旦' };

const NameProvider = React.createElement(
  NameContext.Provider,
  { value: pendingState },
  React.createElement(NameContext.Consumer, null, value =>
    console.log(value.name),
  ),
);
// 等价于JSX
// <NameContext.Provider value={pendingState}>
//   <NameContext.Consumer>{value => console.log(value.name)}</NameContext.Consumer>
// </NameContext.Provider>;

// 模拟渲染
function render(element) {
  if (!React.isValidElement(element)) return;
  switch (element.type.$$typeof) {
    case 'REACT_PROVIDER_TYPE':
      element.type._context._currentValue = element.props.value;
      break;
    case 'REACT_CONTEXT_TYPE':
      element.props.children(element.type._currentValue);
      break;
  }
  render(element.props.children);
}
render(NameProvider); // 朱一旦
```
