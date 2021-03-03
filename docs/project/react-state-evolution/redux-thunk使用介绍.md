# redux-thunk 使用介绍

thunk 本质利用 redux 向外开放的中间件扩展机制对原生的 dispatch 做了高阶包装，使其能够接收异步 action creator，异步 action creator 是指一个返回 Promise 的函数，在异步 action creator 中我们可以编写异步业务逻辑，并且可以访问原生的 dispatch，来提交同步的 action creator。

在这个例子中我们使用了 react-redux v7 版本的新特性 useSelector 和 useDispatch，这样就不需要 connect 了。
