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

```jsx
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

```jsx
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

```jsx
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

```jsx
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

几种思路（个人采用第三种思路）：

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

## 参考

[https://www.cnblogs.com/synY/p/13969785.html](https://www.cnblogs.com/synY/p/13969785.html)
[https://qiankun.umijs.org/zh/guide](https://qiankun.umijs.org/zh/guide)
[https://juejin.cn/post/6856569463950639117](https://juejin.cn/post/6856569463950639117)
[https://zhuanlan.zhihu.com/p/234964127](https://zhuanlan.zhihu.com/p/234964127)
[https://micro-frontends.org/](https://micro-frontends.org/)
[https://github.com/umijs/qiankun/issues/337](https://github.com/umijs/qiankun/issues/337)
