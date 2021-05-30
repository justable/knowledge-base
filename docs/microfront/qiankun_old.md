## 初识

qiankun 是基于 single-spa 和 import-html-entry 的微服务框架，single-spa 负责子应用之间的调度问题，import-html-entry 负责加载子应用资源，分析入口模版并转化成 entry 对象。

[qiankun2.0](https://www.yuque.com/kuitos/gky7yw/viueoh#d3011d1e) 的定位发生了变化，由微前端框架转变为微应用加载器，弥补 single-spa 的加载子应用能力的不足（隔离问题）。

## 隔离问题

### 样式隔离

利用 shadow dom。

### window 对象隔离

不支持 proxy 的浏览器在 mount 前对 window 快照，unmount 时把这期间子应用对 window 的修改存到 modifyPropsMap 对象中，以备该子应用下次激活时恢复。

支持 proxy 的浏览器为每个子应用生成 proxyWindow 对象，proxy 天然的不会对原对象造成影响。

有个问题是如何把子应用的全局对象指向 proxyWindow 呢？
qiankun 把子应用的 JS 代码包裹在立即执行函数中（此时代码以字符串的形式存在），并把 proxyWindow 以参数的形式传入，最后 eval 这段 JS 代码，创造出最终的沙盒环境。

有个注意点是，子应用必须以 window[key]的形式赋值，因为立即执行函数内部的匿名全局环境 this 并非 window。可以参考[子应用加载 baidu 地图无法获取 BMap 对象](https://www.yuque.com/tingyur/yldon0/olb6l5#Ju8kH)问题。

## 与 single-spa 的区别![image.png](https://cdn.nlark.com/yuque/0/2020/png/467908/1608617139328-6e31cbf5-397d-40a5-9913-a4f2cceed0a4.png#align=left&display=inline&height=305&margin=%5Bobject%20Object%5D&name=image.png&originHeight=610&originWidth=1233&size=283654&status=done&style=none&width=616.5)

### single-spa

> single-spa 加载的是子应用的导出生命周期函数的入口 JS 文件

single-spa 的注册子应用部分是这样的，

```javascript
registerApplication({
  name: '@zhuzy-mf/navbar',
  app: () => {
    // 加载资源的方式是自定义的，也可以手动fetch远程资源
    return System.import('@zhuzy-mf/navbar');
  },
  activeWhen: '/',
  customProps: {
    githubLink: 'https://github.com/vue-microfrontends/root-config',
  },
});
// 开始分析路由决定激活对应的子应用
start({
  urlRerouteOnly: true,
});
```

子应用的加载方式需要我们实现，这个例子中使用了 System.import，但这是不够的，生产环境会面临各个子应用的隔离问题，single-spa 没有解决这个问题。

single-spa 的子应用是兄弟关系，所有子应用是 append 到 body 中的，没有挂载点，不支持父子结构的嵌套。我不知道 single-spa 强推兄弟关系的初衷是什么，实际使用起来，不同子应用需要互相协调样式，比如 navbar 宽度 300px，那么 content 区域就需要 margin-left：300px，很是麻烦。

### qiankun

> qiankun 会使用 import-html-entry 加载子应用的入口模版文件，通常就是 html，再分析 externalScripts，dom 结构，样式等资源完成最终的子应用加载过程，子应用会被包裹在一个 div 中。qiankun2.0 现在的定位就是微服务加载器而非微服务框架了。

qiankun 的注册子应用部分是这样的，

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

qiankun 主要对 single-spa 的 registerApplication 和 start 做了封装，并实现了 single-spa 缺失的部分--隔离的加载各个子应用，下面是部分源码，

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

## Reference

[https://www.cnblogs.com/synY/p/13969785.html](https://www.cnblogs.com/synY/p/13969785.html)
[https://qiankun.umijs.org/zh/guide](https://qiankun.umijs.org/zh/guide)
[https://juejin.cn/post/6856569463950639117](https://juejin.cn/post/6856569463950639117)
