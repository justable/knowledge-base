# React Router 原理

## 前端路由的基本原理

前端路由是为 SPA 应用服务的，目的是根据 url 变化替换页面的局部内容，这过程不会使页面刷新。实现方式主要有两种，基于 Hash 和基于 History。

Hash 模式通过 hashchange 事件监听 url hash 的变更。举例：

```html
<body>
  <ul>
    <li><a href="#/home">home</a></li>
    <li><a href="#/about">about</a></li>
  </ul>
  <div id="routeView"></div>
</body>
```

```js
window.addEventListener('DOMContentLoaded', onLoad);
window.addEventListener('hashchange', onHashChange);
let routeView = null;
function onLoad() {
  routeView = document.querySelector('#routeView');
  onHashChange();
}
function onHashChange() {
  switch (window.location.hash) {
    case '#/home':
      routeView.innerHTML = 'Home';
      return;
    case '#/about':
      routeView.innerHTML = 'About';
      return;
    default:
      return;
  }
}
```

History 模式通过 popstate 监听 history 的变更，利用 pushState 和 replaceState 发起变更。举例：

```html
<body>
  <ul>
    <li><a href="/home">home</a></li>
    <li><a href="/about">about</a></li>
  </ul>
  <div id="routeView"></div>
</body>
```

```js
window.addEventListener('DOMContentLoaded', onLoad);
window.addEventListener('popstate', onPopState);
let routeView = null;
function onLoad() {
  routeView = document.querySelector('routeView');
  let linkList = document.querySelectorAll('a[href]');
  linkList.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      window.history.pushState(null, '', link.getAttribute('href'));
      onPopState();
    });
  });
}
function onPopState() {
  if (!routeView) {
    routeView = document.querySelector('#routeView');
  }
  switch (window.location.pathname) {
    case '/home':
      routeView.innerHTML = 'Home';
      return;
    case '/about':
      routeView.innerHTML = 'About';
      return;
    default:
      return;
  }
}
```

由于 history 模式会直接改变 url 的 pathname，pathname 发生变化后再次刷新页面，浏览器就会以新的 pathname 向服务器请求资源，这就要求服务端把某个子域下的页面请求都返回初始页面。

## React Router 的实现原理

对前端路由的基本原理有了初步理解后，再来理解 React Router 的实现原理就不难了。以下参照的是 V6 版本的源码。

React Router 将 hash 方案和 history 方案一同封装到了 [history 库](https://github.com/ReactTraining/history)中，并对外提供一致的的操作 API，所以使用者不管选择哪种方案，使用的方式都是一致的。API 如下所示：

![](@images/reactrouter_3.jpg)

在 SPA 应用中，React Router 会在顶层组件管理路由状态：

![](@images/reactrouter_1.png)

注意`history.listen(dispatch)`这行代码，history.listen 是事件注册接口，当路由变更时 history 库会将路由信息通过 action 信号传递给 dispatch，从而改变了 state。

接着再通过 React Context 将 state 状态向子组件传递，子组件就能访问路由信息了。

最后，有任何业务代码中发起了路由变更，即调用了 history.push 或 history.replace 接口，都会触发`history.listen(dispatch)`，从而促使组件 rerender，至此整个路由逻辑就产生了闭环。
