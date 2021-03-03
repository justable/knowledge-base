# redux 使用介绍

## 目录结构

```
|__constants
|__components
|__actions
|__containers
|__reducers
|__selectors
|__services
```

- constants

通常存放 action 对应 type 的枚举值。

- components

存放组件。

- actions

存放 action creators，用于生成 action。

- containers

通过 react-redux 将中央状态 connect 到对应组件中。在 mapDispatchToProps 中可以调用 bindActionCreators 方法将 action creators 和 dispatch 包装在一起，之后在组件中直接调用 action creators 就可以进行 dispatch。要注意的是，如果 mapDispatchToProps 是个 action creator 的对象，那么会自动调用 bindActionCreators。bindActionCreators 之后的类型依然是`ActionCreator<AnyAction>`。

```ts
function bindActionCreator<A extends AnyAction = AnyAction>(
  actionCreator: ActionCreator<A>,
  dispatch: Dispatch,
) {
  return function(this: any, ...args: any[]) {
    return dispatch(actionCreator.apply(this, args));
  };
}

function dispatch(action: AnyAction): AnyAction {}
```

但是在 react-redux v7 版本之后，出现了 useSelector 这个 hook，它能直接获取 Provider 包裹下的 state，再使用 useDispatch 获取 dispatch 来提交 action。有篇关于 useSelector 争议的讨论[如何看待 react-redux@7 的 useSelector API？
](https://www.zhihu.com/question/332090851/answer/730617297)。

对比 connect 和 useSelector 两种形式来看，我认为其本质依然都是依靠 Context.Provider 的传递能力，connect 采用了高阶组件的形式把从 Provider 分发的数据传递给低阶组件，而 useSelector 则直接在组件内部使用 useContext 获取上下文中的状态，无需高阶化处理，这要归功于 hooks 赋予函数式组件的能力（没看过 react-redux 源码，是否利用了 Context.Provider 和 useContext 待进一步确认）。

- reducers

处理 action 的地方，当 dispatch 一个 action 后，redux 会传给 reducer 函数得到最终的 state。

- selectors

使用到了 reselect 插件。在实际应用中，我们考虑把哪些状态从组件内部分离到中央状态库中是个值得深思熟虑的问题，这直接关系到整个应用的数据层次感、健壮性和可维护性。通常建议把数据定义的更原始一点，而不会直接把中间数据放到中央状态库中，中间数据是指基于一个或多个原始数据处理后的数据。如果不使用 reselect 插件，我们可以在组件内部使用 useMemo 得到处理后的数据。

- services

存放接口请求。

## reselect 实现缓存的原理

待完成

## react-redux 的实现原理

待完成，包含 connect 和 useSelector

## 缺陷

可以发现，在不使用任何中间件的情况下，redux 只能 dispatch 同步 action，也就是在异步方法的回调函数中进行 dispatch，这本身并没有什么问题，所以纯 redux 也是能够胜任异步操作场景的。

那么怎么会有 redux-thunk 或 redux-saga 这类库出现呢？我认为目的是把异步的逻辑从组件剥离，更易于代码测试和维护。
