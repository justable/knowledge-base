## 初识

single-spa 的微前端体系分为两部分，

1. root config，或称为主应用
   1. 加载能力（A function to load the application's code）
   1. 路由能力（A function that determines when the application is active/inactive）
   1. 重要，注册 importsMap 定义模块的真实路径的 alias，所有用到的模块都需要配置，alias 会被 SystemJS 使用，可以是本地启动的子应用的访问路径如`"@zhuzy/spa-demo": "http://localhost:8080/zhuzy-spa-demo.js"`或任何运行时能访问到的资源
   1. 可选，使用 single-spa-layout 来路由子应用
2. single-spa application，或称为子应用
   1. 需要提供 bootstrap, mount, and unmount 供主应用调用
   1. 不需要自己的 html 模版，为了支持独立运行也可以有
3. 公共模块，不和路由绑定

create-single-spa 可以帮助我们完成上面这些配置，主应用执行`yarn create single-spa --module-type root-config`，子应用执行`yarn create single-spa --framework react|vue|angular`。

如果想要理解构建原理，我们也可以不使用 create-single-spa，参考[教程](https://single-spa.js.org/docs/recommended-setup/#build-tools-webpack--rollup)手动配置 webpack。

## 推荐的微前端架构

1. Prefer splitting microfrontends by route, instead of by components within a route. This means preferring single-spa applications over single-spa parcels whenever possible. The reason for this is that transitions between routes often involve destroying and recreating most UI state, which means your single-spa applications on different routes do not need to ever share UI state.
1. Move fixed navigation menus into their own single-spa applications. Implement their activity functions to be active by default, only unmounting for the login page.
1. Create utility modules for your core component library / styleguide, for shared authentication / authorization code, and for global error handling.
1. If you are only using one framework, prefer framework components (i.e. React, Vue, and Angular components) over single-spa parcels. This is because framework components interop easier with each other than when there is an intermediate layer of single-spa parcels. You can import components between single-spa applications You should only create a single-spa parcel if you need it to work with multiple frameworks.

## 原理

主要流程是，使用 registerApplication 注册子应用的配置信息，包括子应用的入口文件，再调用 start 函数根据当前路由决定应该加载哪些子应用。

```javascript
registerApplication({
  name: '@zhuzy-mf/navbar',
  app: () => {
    /**
    加载资源的方式是自定义的，也可以手动fetch远程资源
    我在另一个例子看到是把子应用打包成npm包，然后使用import()动态加载。
    本质是，子应用的入口文件导出相应的生命周期函数，在主应用中通过任何手段加载到即可。
    **/

    return System.import('@zhuzy-mf/navbar');
  },
  activeWhen: '/', // 匹配路由时激活
  customProps: {
    githubLink: 'https://github.com/vue-microfrontends/root-config',
  },
});
start({
  urlRerouteOnly: true,
});
```

single-spa 获取到子应用入口文件后就会调用其暴露的生命周期函数--bootstrap、mount、unmount 这些，最终渲染 dom 结构。

额外要注意的一点是，只有在 registerApplication 注册的应用称作子应用，像分离出去的 style(@react-mf/styleguide) 或 api(@react-mf/api)在主应用中并不会被注册成子应用，是以全局引入的方式存在的，

```html
<script>
  System.import('@react-mf/styleguide');
</script>
```

具体的可以参考我写的 single-spa 的一个 [demo](https://github.com/justable/single-spa)。

## 疑惑

1. 如何把拿到的子应用的静态资源转化为运行时方法呢？bootstrap、mount、unmount 这些只有在内存中才能被执行啊。子应用中把生命周期函数挂载到 window 对象上，主应用从 window 对象上取？

答：single-spa 例子中是通过 systemjs 动态加载模块的，缺陷是无法避免全局变量 window 的污染和 css 污染问题。qiankun 在 single-spa 的基础上对加载资源这块做了扩展，最终支持 css 隔离和 window 对象隔离，qiankun2.0 的[定位](https://www.yuque.com/kuitos/gky7yw/viueoh#d3011d1e)也从微服务框架收敛聚焦到了微应用加载器。

2. 入口文件渲染 dom 是类 react 框架才会有的渲染模式，如果是传统的 jQuery，dom 结构都是定义在 html 文件中的，那该如何呢？

答：也许这就是 qiankun 使用 import-html-entry 加载入口模版文件而非入口 JS 文件的原因？

3. single-spa 最终的效果是，不同的子应用都会以独立的 div 在页面上显隐，是如何做样式和 js 隔离的？

答：single-spa 并没有解决隔离问题。

4. single-spa 是如何决定子应用挂载在页面哪个节点位置的？

答：single-spa 是将子应用包裹在 div 中然后 append 到 body 中的，不同子应用是兄弟关系，子应用的样式需要和其他子应用协调，比如 navbar 的宽度为 300px，那么其他应用需要 margin-left：300px。这其实很不方便，qiankun 则可以指定页面挂载点。

## Reference

[https://www.cnblogs.com/synY/p/13958963.html](https://www.cnblogs.com/synY/p/13958963.html)
[https://single-spa.js.org/docs/getting-started-overview](https://single-spa.js.org/docs/getting-started-overview)

子应用独立运行
子应用是兄弟关系
样式隔离，window 隔离
