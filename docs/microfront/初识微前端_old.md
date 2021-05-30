## 场景

公司内部有一个公共平台，需要集成各个项目组的相关对内业务，提供给公司员工使用。

暂时取名公共平台为 Public，有三个项目组对内业务 A、B、C，使用 React 开发。

## All In One

ABC 业务作为 Public 项目的子模块放在同一个项目里，做统一的版本控制和打包编译。

```
├── Public
  ├── Common
  ├── A
  ├── B
  ├── C
```

会有如下问题：

1. A 迭代发版时 B 和 C 可能并不需要。
2. A 修改了 Common 中的组件，但因为并不了解 B 和 C 的业务，导致该组件不兼容 B 和 C 产生 bug。
3. 中途需要接入项目组 D，D 是使用 Vue 开发的。

在长时间跨度的单体应用中，由于参与的人员、团队的增多、变迁，从一个普通应用演变成一个巨石应用，变得难以维护。

## Micro Frontend

1. 形成主应用和微应用体系，主应用作为所有微应用的载体，同时可以向微应用分发数据，并且最好是单向的，或者考虑使用回调函数的形式向微应用提供修改主应用的有限能力。
2. 微应用具备单独运行能力，同时又可接入主应用，可以通过全局遍历来判断是否处在微前端体系下，这个全局变量由主应用注入。
3. 主应用监测 URL 的变化来决定拉取对应微应用的代码入口文件进行初始化操作，微应用输出一些钩子函数向主应用提供管控自己的能力，主应用可以在各个阶段调用微应用暴露的钩子函数。主微应用之间采用这种轻接触的交流方式，可以保证双方的自治。
4. 主应用需要为每个微应用提供一个相对独立的沙盒环境，避免一系列冲突。
5. 由于主应用使用的是编译后的微应用代码（即微应用对于主应用而言就相当于一个外部模块），所以天然的具备技术栈无关性，但同时微应用的打包配置中需要做些标识性配置，以 webpack 为例，修改 output 的 library、libraryTarget、jsonpFunction 参数，其实目的就是为了在主应用运行环境中，每个微应用有自己的命名空间。

## 微前端框架

使用阿里开源的 [qiankun](https://qiankun.umijs.org/)。

## 变化

在微前端体系下，原本的单体应用变成了现在的微应用，项目构成是否发生了什么变化呢？

其实没有太多变化，以 React 为例，原本我们会在入口文件中调用 ReactDOM.render()将组件挂载到 container 中，并且在打包编译后以外部脚本被 HTML 文件引入；在微前端体系下，为了同时也能独立运行，只需在打包的入口文件输出钩子函数：

```tsx
if (window.__MICRO_FRONTEND__) {
  oldRender();
}
function oldRender(props) {
  // do something
  ReactDOM.render(<App />, document.getElementById('root'));
}
export async function bootstrap() {}
export async function mount(props) {
  oldRender(props);
}
export async function unmount() {
  ReactDOM.unmountComponentAtNode(document.getElementById('root'));
}
// export other lifecycles
```

打包编译后（可以配置成 umd 的输出格式），这个入口文件作为模块被主应用引入。

在主应用中，需要提前注册好要对接的微应用，具体流程配置、路由调度原理、沙箱构建原理等就不介绍了，可以自行查找这方面的资料。

## FAQ

- 主应用是监测 URL 的变化来决定接入对应微应用的，但是微应用也有自己的路由系统，此时如何解决路由的接管权？

TODO

- 主应用的拉取微应用代码的策略，即如何应对微应用变更？

TODO

- 每个微应用沙盒环境构建策略？

TODO，为什么不使用 iframe，参考[qiankun 为什么不使用 iframe](https://www.yuque.com/kuitos/gky7yw/gesexv)

## Troubleshooting

### 子应用无法注册全局变量

在子应用中需要使用 window.BMap={}来注册全局变量，而不能隐式的 BMap={}，因为子应用的全局作用域不是 window。这在使用 baidu 地图时会遇到，可以使用 react-bmap 代替。

## 参考

[https://github.com/single-spa/single-spa](https://github.com/single-spa/single-spa)
[https://qiankun.umijs.org/zh/guide](https://qiankun.umijs.org/zh/guide)
