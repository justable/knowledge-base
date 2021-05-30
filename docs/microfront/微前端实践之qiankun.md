## 什么是 qiankun

qiankun 是基于 single-spa 的上层框架，[qiankun2.0 的定位](https://www.yuque.com/kuitos/gky7yw/viueoh#d3011d1e)从微服务框架收敛聚焦到了微应用加载器上。它使用 single-spa 负责子应用之间的调度问题，使用 import-html-entry 来加载子应用入口资源并转化成 entry 对象。

## 工作原理

qiankun 会使用 import-html-entry 加载子应用的入口模版文件，通常就是 html，再分析 externalScripts，dom 结构，样式等资源完成最终的子应用加载过程，子应用会被包裹在一个 div 中。

qiankun 是这样注册子应用的：

```javascript
registerMicroApps(
  apps.map(item => getApps(item, theme)),
  {
    beforeLoad: app => {},
    beforeMount: () => {},
  },
);
setDefaultMountApp(setting.defaultMountApp);
start({ prefetch: false, sandbox: false, singular: true });
```

qiankun 主要对 single-spa 的 registerApplication 和 start 做了封装，并实现了 single-spa 缺失的部分即隔离的加载各个子应用，下面是部分源码，

```javascript
// 封装了single-spa的registerApplication
function registerMicroApps() {
  unregisteredApps.forEach((app) => {
    // 调用single-spa的registerApplication
    registerApplication({
      name,
      app: async () => {
        loader(true);
        await frameworkStartedDefer.promise;
        const { mount, ...otherMicroAppConfigs } = (
          // 核心部分，隔离的加载子应用
          await loadApp({ name, props, ...appConfig }, frameworkConfiguration, lifeCycles)
        )();
        return {
          mount: [async () => loader(true), ...toArray(mount), async () => loader(false),
          ...otherMicroAppConfigs,
        };
      },
      activeWhen: activeRule,
      customProps: props,
    });
  });
}
function start(opts = {}) {
  frameworkConfiguration = { prefetch: true, singular: true, sandbox: true, ...opts };
  const { prefetch, sandbox, singular, urlRerouteOnly, ...importEntryOpts } = frameworkConfiguration;
  if (prefetch) {
    doPrefetchStrategy(microApps, prefetch, importEntryOpts);
  }
  if (sandbox) {
    if (!window.Proxy) {
    }
  }
  // startSingleSpa是single-spa的start方法的别名
  startSingleSpa({ urlRerouteOnly });
  frameworkStartedDefer.resolve();
}
```

## Demo

待补充

## 已知问题

### 请问微前端架构中，如何存储当前用户信息？比如单体项目登录后一般会存在 redux 中，那在微前端中，登录模块也被分离成了单独的子应用，登录后如何在多个子应用共享用户信息？

这其实是个 GlobalState 共享问题，可以直接使用 [redux](https://github.com/yuki070/qiankun-redux) 或者通过 initGlobalState 初始化再由子应用通过 onGlobalState 获取，可以参考https://github.com/umijs/qiankun/pull/729，会有很大启发。

### 运行时依赖去重

可以考虑基于 import-maps

### 应用依赖共享问题

[https://github.com/umijs/qiankun/issues/172](https://github.com/umijs/qiankun/issues/172)
各应用间会存在重复的依赖，比如 react。
可以使用 webpack5 ModuleFederationPlugin 的 shared 参数，或者 external。
但 qiankun 是使用 import-html-entry 加载的，是如何与 ModuleFederationPlugin 协作的，有待探索。

### 子应用加载 baidu 地图无法获取 BMap 对象

[https://github.com/umijs/qiankun/issues/812](https://github.com/umijs/qiankun/issues/812)
主应用通过 registerMicroApp 的 props 参数传递给子应用。
或者在 start(opts)指定 excludeAssetFilter 防止被 qiankun 截获外部资源。

### 子应用无法注册全局变量

在子应用中需要使用 window.BMap={}来注册全局变量，而不能隐式的 BMap={}，因为子应用的全局作用域不是 window，也可以使用 react-bmap 代替。

### 挂载在动态的 container 时，如何保证注册子应用时 container 已经加载完毕

这涉及渲染机制，父 willMount->子 willMount->子 mounted->父 mounted，react 和 vue 相同。所以只要在最外层的 useEffect 初始化就可以了。

### 主子应用通讯

[https://github.com/umijs/qiankun/issues/39](https://github.com/umijs/qiankun/issues/39)
[https://github.com/umijs/qiankun/pull/412](https://github.com/umijs/qiankun/pull/412)

### 使用 entry 对象注册子应用时

例一：使用 entry 字符串，qiankun 会把子应用的 html 模版文件作为 prop.container 传给子应用。

```jsx | pure
/* 主应用 */
registerMicroApps([
  {
    name: 'auth app',
    entry: '//localhost:3002',
    container: '#microapp',
    activeRule: '/#/login',
  },
]);
/* 子应用 */
export async function mount(props) {
  ReactDOM.render(<App />, props.container.querySelector('.mf-auth-container'));
}
/* html模版 */
<body>
  <div class="mf-auth-container"></div>
</body>;
```

例二：使用 entry 对象，不指定 html。

```jsx | pure
/* 主应用 */
registerMicroApps([
  {
    name: 'auth app',
    entry: {
      scripts: ['//localhost:3002/main.js'],
      styles: ['//localhost:3002/main.css'],
    },
    container: '#microapp',
    activeRule: '/#/login',
  },
]);
/* 子应用 */
export async function mount(props) {
  // 直接挂载在props.container上，导致styles失效，因为React会清空所挂载的节点
  ReactDOM.render(<App />, props.container);
}
/* html模版没有意义 */
```

例三：使用 entry 对象，指定 html。

```jsx | pure
/* 主应用 */
registerMicroApps([
  {
    name: 'auth app',
    entry: {
      html: '<div class=".mf-auth-container"></div>',
      scripts: ['//localhost:3002/main.js'],
      styles: ['//localhost:3002/main.css'],
    },
    container: '#microapp',
    activeRule: '/#/login',
  },
]);
/* 子应用 */
export async function mount(props) {
  // 挂载在props.container的.mf-auth-container上，不会导致styles失效
  ReactDOM.render(<App />, props.container.querySelector('.mf-auth-container'));
}
/* html模版没有意义 */
```

例四：子应用动态创建 container，不推荐。

```jsx | pure
/* 主应用 */
registerMicroApps([
  {
    name: 'auth app',
    entry: {
      scripts: ['//localhost:3002/main.js'],
    },
    container: '#microapp',
    activeRule: '/#/login',
  },
]);
/* 子应用 */
let domEl;
export async function mount(props) {
  domEl = document.createElement('div');
  props.container.appendChild(domEl);
  ReactDOM.render(<App />, domEl);
}
```

### initGlobalState 可以当作 action 吗？

可以，把 globalState 定义成{type, payload}的格式，子应用 setGlobalState 就相当于发起了一个 action。

### 主子应用的样式隔离

子应用间的样式是隔离的。但主子应用间不是隔离的，只能通过前缀来做到隔离。

### initGlobalState 和 registerMicroApps 的 props 参数使用场景

前者是动态数据，后者是静态数据。

### 公共库是通过主应用 registerMicroApps 的 props 参数传递给子应用还是子应用单独引用，比如 axios，baidu map 等。

**不要共享运行时**，比如全局 state 和全局变量，减少微前端各模块的依赖性。
如果一定要共享，可以把配置信息传递给子应用而非传递整个实例，否则子应用过度依赖主应用导致无法单独启动。同时子应用可以作降级处理，如果存在主应用传递的则用之，否则自已引用外部库。

### 内嵌子应用的取舍问题

如果希望分离登录模块、整体布局模块（菜单栏和头部和内容区）、各子应用，这里有个关键问题是，登录模块不需要整体布局模块，各子应用需要内嵌在整体布局模块的内容区，也有可能存在不需要整体布局模块的子应用。

qiankun 的挂载模式不同于 single-spa 的 append 到 body 中，而是选择挂载点，那么要分两种情况来看：

1. 主应用是简单的静态页面
2. 主应用是个单页应用

single-spa 只能是第一种情况，qiankun 则都可以，不过更建议使用单页应用，否则很难控制 sidebar 的显隐，因为动态显隐对于用户来说页面会出现闪动（除非像 single-spa 一样把 sidebar 也分离出去由 activeRule 来控制显隐）。

下面谈谈 qiankun 主应用是单页应用的设计思路。假如路由为：

```js
const routes = [
  {
    path: '/login',
    component: '@/pages/Login',
  },
  {
    path: '/layoutAChildren',
    component: '@/pages/LayoutWithMenu',
    routes: [
      {
        path: 'projectA',
      },
      {
        path: 'projectB',
      },
    ],
  },
  {
    path: '/layoutBChildren',
    component: '@/pages/LayoutWithMenu',
    routes: [
      {
        path: 'projectC',
      },
      {
        path: 'projectD',
      },
    ],
  },
];
```

那么可以设置 projectA 的 activeRule 为`/layoutAChildren/projectA`，以此类推。

可以参考[如何在主应用的某个路由页面加载微应用](https://qiankun.umijs.org/zh/faq#%E5%A6%82%E4%BD%95%E5%9C%A8%E4%B8%BB%E5%BA%94%E7%94%A8%E7%9A%84%E6%9F%90%E4%B8%AA%E8%B7%AF%E7%94%B1%E9%A1%B5%E9%9D%A2%E5%8A%A0%E8%BD%BD%E5%BE%AE%E5%BA%94%E7%94%A8)。

下面谈谈 qiankun 主应用是静态页面的几种思路：

1. 采用 single-spa 的各子应用之间是兄弟关系的策略，主应用只是作为注册中心。qiankun 是可以指定具体挂载点的（single-spa 因为各子应用只能默认 append 到 body 中，所以需要把 siderbar 或 header 做成 fixed，再依靠子应用的 margin 来协调整体的展示），我们只需把结构性布局转移到主应用上，在模版文件中设计好模块的插槽位置，把 siderbar 和 header 也当作单个子应用分离出去，最后依靠微应用框架的 activeRule 来控制显示哪个模块。

```html
<body>
  <div class="layout">
    <div id="sider"></div>
    <div id="header"></div>
    <div id="content"></div>
  </div>
  <div id="login"></div>
</body>
```

2. 在第一种思路的基础上，把 sider 和 header 也作为主应用的一部分，依靠子应用的 setGlobalState 来动态控制，不过这样有很多问题，比如登陆界面会先看到菜单栏，待触发子应用的 mount 函数后再隐藏菜单栏，对于用户来说页面会出现闪动。或者把布局模块默认为隐藏，待需要依赖它的子应用 mount 后动态控制为显示，但是可能下一个 active 的子应用是登录模块所以得在 unmount 函数再次隐藏布局模块，但又会造成另一个问题，各依赖布局模块的各子应用互相切换时会不停的激活和销毁布局模块，布局模块内部的状态无法被保存。

```html
<body>
  <div class="layout">
    <!-- 动态显示或隐藏 -->
    <div>header</div>
    <div>siderbar</div>
  </div>
  <div id="content"></div>
  <div id="login"></div>
</body>
```

3. 继续沿用第二种思路，但是把 login 或者整体形态不同的系统分离出这个微前端。仔细想想，微前端集成的本就应该是形态相同的系统。
4. 多级内嵌关系，主应用 A 注册登录模块和整体布局模块（菜单栏和头部和内容区），整体布局模块 B 也作为另一个主应用注册各子应用，这种思路的问题是多级关系会加大各模块间交流的成本，并且要默认所有子应用都是需要菜单栏和头部的，否则得提升到主应用 A 中。

```html
<!-- A -->
<body>
  <div id="layout"></div>
  <div id="login"></div>
  <div id="other-no-siderbar-and-header-module"></div>
</body>
<!-- B -->
<body>
  <div>
    <div>header</div>
    <div>siderbar</div>
    <div id="content"></div>
  </div>
</body>
```

### 关于子系统的热重载问题

https://github.com/umijs/qiankun/issues/830

### 如果挂载点被组件状态给卸载了是否会造成意想不到的后果

应该是的。

首先要讲一下，在 react 中使用 qiankun 时，挂载点被 qiankun 填充了子应用的页面结构后，会造成真实 dom 树与 react 内部存储的节点树不一致，也就是 react 中的 Uncontrolled Components 概念，不知道这会在 react 做重绘 diff 时产生什么副作用（是指 react 重绘时把 qiankun 挂载的子应用给 delete 掉了）。个人基于对 react 渲染原理的理解推断，react 在做 diff 时是对比的新老 fiber 树，而不是对比的真实 dom，因此只要不出现是基于 Controlled Components 并且会造成挂载点 children 重绘的操作，像什么引起挂载点 props 改变的操作是不会使 react 感知到并产生副作用的，或者使用 React.memo 或 PureComponent 创建挂载点。

官方指出挂载点可以是动态的某个路由下的节点，通过 activeRule 控制即可，我们知道路由变更是会导致挂载点被销毁的，那么挂载点下的子应用页面也会跟着被销毁，不过由于此种情况 qiankun 是可以通过 activeRule 来推断挂载点的销毁时机的，因此 qiankun 可以选择做一些弥补副作用的措施，具体做了什么我不清楚，但是如果挂载点是被组件内部状态的变更所卸载，这对 qiankun 而言是无从感知的，因此肯定不会做出弥补副作用的措施？

官网上有个关于挂载点是在动态子路由中的案例解读，很奇怪 vue 和 react 为什么情况不同？vue 需要在挂载点所处的那个组件的 mounted 钩子中执行 start()来重新启动子应用，而 react 不需要。反而 vue 的情况更让人理解，是因为 vue 和 react 的重绘机制不同？还是 qiankun 对于两种框架做了不同的处理？打算在 qiankun 的 issue 里提个问题问问官方，[discussions/1475](https://github.com/umijs/qiankun/discussions/1475)。

已知情况：qiankun 是通过子应用提供的 mount 和 unmount 来控制子应用的挂载与卸载的。

八九不离十的推测：主应用是 Vue+Vue Router 时，采用的是 import()异步加载，所以需要在 mounted 中 start()。

```js
const routes = [
  {
    path: '/portal/*',
    name: 'portal',
    component: () => import('../views/Portal.vue'),
  },
];
```

```js
// 挂载点所处的页面
import { start } from 'qiankun';
export default {
  mounted() {
    if (!window.qiankunStarted) {
      window.qiankunStarted = true;
      start();
    }
  },
};
```

## 参考

[https://www.cnblogs.com/synY/p/13969785.html](https://www.cnblogs.com/synY/p/13969785.html)
[https://qiankun.umijs.org/zh/guide](https://qiankun.umijs.org/zh/guide)
[https://juejin.cn/post/6856569463950639117](https://juejin.cn/post/6856569463950639117)
[https://zhuanlan.zhihu.com/p/234964127](https://zhuanlan.zhihu.com/p/234964127)
[https://micro-frontends.org/](https://micro-frontends.org/)
[https://github.com/umijs/qiankun/issues/337](https://github.com/umijs/qiankun/issues/337)
