# qiankun 实践总结

## 基本原理

整体结构分为主应用和子应用，每个应用独立部署，比如：

| 应用     | 技术栈        | 域名                                        |
| -------- | ------------- | ------------------------------------------- |
| 主应用   | webpack+react | https://www.microfront.com/                 |
| 子应用 A | webpack+react | https://www.microfront.com/passport/        |
| 子应用 B | umi+react     | https://www.microfront.com/dashboard/react/ |
| 子应用 C | webpack+vue   | https://www.microfront.com/dashboard/vue/   |

> 如果主应用使用了 umi 构建，则可以参考[这篇文章](https://umijs.org/zh-CN/plugins/plugin-qiankun)进行配置。基本思路是一样的，只不过 umi 对一些操作进行了收敛，比如支持自动 mountElementId 避免多个 umi 子应用 mountElementId 冲突，支持自动 loading 动画，将 activeRule 整合到了 umi 自身的路由体系中，主应用可以直接通过 MicroApp 组件传递 props 并在子应用通过 useModel 获取等等。

在主应用中要先注册子应用信息，比如：

```js
import { registerMicroApps, start } from 'qiankun';
registerMicroApps([
  {
    name: 'passport-app',
    entry: '//localhost:3002',
    container: '#microapp-passport-container',
    activeRule: '/passport',
    props: {},
  },
]);

registerMicroApps([
  {
    name: 'vue-app',
    entry: '//localhost:3003',
    container: '#microapp-vue-container',
    activeRule: '/dashboard/vue',
    props: {},
  },
]);

registerMicroApps([
  {
    name: 'react-app',
    entry: '//localhost:3004',
    container: '#microapp-react-container',
    activeRule: '/dashboard/react',
    props: {},
  },
]);

start();
```

主应用的路由匹配到对应的 activeRule 时会运行时通过 import-html-entry 加载子应用的 index.html 文件，同时将 HTML document 作为子节点塞到主应用的容器中。首先会触发主应用的路由系统，待子应用加载完毕后会触发子应用的路由系统（子应用需要配置路由的 base 路径）。

子应用根据技术栈选用不同配置略有不同，可以参考[qiankun 官网](https://qiankun.umijs.org/zh/guide/tutorial#%E5%BE%AE%E5%BA%94%E7%94%A8)，主要支持如下类型的子应用：

- react
- vue
- angular
- 非 webpack 构建（jQuery、jsp 等）
- umi 构建并搭配 umi-qiankun 插件

## 样例

- [个人实战样例](https://github.com/bigmf)：一次启动各项目即可
- [官方样例](https://github.com/umijs/qiankun/tree/master/examples)
- [umijs/plugin-qiankun 样例](https://github.com/umijs/umi-plugin-qiankun/tree/master/examples)

## 注意点

### props 传递数据时接收不到

### 主应用通过接口获取子应用配置信息

### 在子应用跳转另一个子应用的路由

子应用必须调用的是主应用的路由系统，否则只会触发当前应用的路由。

- 直接使用 history.pushState({},'','/xxx')
- 主应用将路由实例通过 props 传递给子应用

https://qiankun.umijs.org/zh/faq#%E5%BE%AE%E5%BA%94%E7%94%A8%E4%B9%8B%E9%97%B4%E5%A6%82%E4%BD%95%E8%B7%B3%E8%BD%AC%EF%BC%9F

### 子应用本地运行和被主应用接入运行时 publicPath 和路由 base 配置说明

```js
// publicPath
if (window.__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
```

```js
// 路由 base
<BrowserRouter basename={window.__POWERED_BY_QIANKUN__ ? '/app-react' : '/'}>
```

### 各应用间数据传递问题

> 注意 setGlobalState 只能修改已存在的一级属性。

qiankun 提供了两种数据传递的策略，基于 props 的单向流和基于 initGlobalState 的响应式。子应用只能在 mount 等钩子函数中访问到这些 api（如果主子应用都是 umi 构建，可以基于 MicroApp 组件传递 props 然后在子应用 useModel 消费），如何将数据注入组件树中呢？可以使用如下方式：

- 基于 CustomEvent 自己实现 pub/sub 模式；
- 借助 localStorage 等；
- 使用第三方状态库：

```js
// vue
import { createApp } from 'vue';
let instance = createApp(App);
export async function mount(props) {
  instance.config.globalProperties.$onGlobalStateChange =
    props.onGlobalStateChange;
  instance.config.globalProperties.$setGlobalState = props.setGlobalState;
}
// vuex
export async function mount(props) {
  props.onGlobalStateChange((value, prev) => store.commit(), true);
}
// redux
export async function mount(props) {
  props.onGlobalStateChange((value, prev) => store.dispatch(), true);
}
```

### 子应用 A 通过 onGlobalStateChange 监听，但状态更新时子应用 A 还未 mount 怎么办？

貌似 qiankun 会在子应用 mount 时自动触发上次未消耗的信息。

### 接入 vite 子应用

https://github.com/umijs/qiankun/issues/1268
https://github.com/umijs/qiankun/issues/1257

### 304 Not Modified

子应用 unmount 之后，下次激活触发了浏览器的缓存导致没有实际获取，最终显示空白页面。

### 预加载

参考 start()方法的 prefetch 参数。

## 参考

https://juejin.cn/post/6856569463950639117
https://juejin.cn/post/6872132988780412935
