# PnP

还是等社区用的人多了再用吧，初步试用了下有好多坑。。。

## 概述

在初次遇见前端项目的时候，当时就有一个困惑，依赖包为何要以项目为单位进行维护？正常的逻辑应该是，所有项目的依赖包都存放在一个本地中心仓库，初次安装或者不同版本时更新到中心仓库，这样从以项目为单位的分散管理变成统一管理，可以大大提高利用率啊，就像后端项目的 Maven 一样。如果有哪位朋友知道当初这么设计的原因请留言告知。

根据 [Node Resolution](https://nodejs.org/api/modules.html#modules_all_together) 的策略，寻找依赖是个很低效的过程，具体分析可以参考[这里](https://yarnpkg.com/features/pnp)。

Yarn 的 PnP 特性就是解决 Node 包管理低效的问题，开启 PnP 特性后，使用 Yarn install 初始化项目时不再生成 node_modules 目录，而是生成一个.pnp.js 文件，该文件维护了包对应的磁盘位置和依赖项，如下格式：

```javascript
[
  'react',
  new Map([
    [
      '16.13.1',
      {
        packageLocation: path.resolve(
          __dirname,
          '../../Library/Caches/Yarn/v6/npm-react-16.13.1-2e818822f1a9743122c063d6410d85c1e3afe48e-integrity/node_modules/react/',
        ),
        packageDependencies: new Map([
          ['loose-envify', '1.4.0'],
          ['object-assign', '4.1.1'],
          ['prop-types', '15.7.2'],
          ['react', '16.13.1'],
        ]),
      },
    ],
  ]),
];
```

未开启 PnP 时 Yarn install 实际做了以下事情：

1. 将依赖包的版本区间解析为某个具体的版本号，下载对应版本依赖的 tar 包到本地离线镜像
1. 将依赖从离线镜像解压到本地缓存
1. 将依赖从缓存拷贝到当前目录的 node_modules 目录
1. We apply the computed changes (a bunch of rsync operations, basically)

在开启 PnP 之后的 Yarn2 版本：

1. 下载对应版本依赖的 tar 包到本地缓存（合并了离线镜像和本地缓存）
1. 生成.pnp.js，建立依赖模块到本地磁盘的映射关系

## 原理

PnP 会使用自定义的 resolver 来处理 require()请求，以此来覆盖原本的 Node Resolution 策略，但同时会造成一些影响，请见下文的注意事项。

## 好处

- 节省 install 时间
- 所有 npm 模块都会存放在全局的缓存目录下, 依赖树扁平化, 避免拷贝和重复
- 提高模块加载效率. Node 为了查找模块, 需要调用大量的 stat 和 readdir 系统调用. pnp 通过 Yarn 获取或者模块信息, 直接定位模块
- 不再受限于 node_modules 同名模块不同版本不能在同一目录
- 高效协作开发，我们可以使用 [Zero-Installs](https://yarnpkg.com/features/zero-installs)，把.pnp.js 提交到版本控制中去，其他人 clone 该项目后不再需要执行 yarn install 操作即可直接运行，注意一下需要 ingore 的[文件](https://yarnpkg.com/advanced/qa#which-files-should-be-gitignored)

## 如何使用

使用 `yarn --pnp`或者直接在 package.json 增加如下配置：

```json
{
  "installConfig": {
    "pnp": true
  }
}
```

## loose 模式

> 在 yarnrc.yml 配置 pnpMode: loose

默认的 strict 模式下，PnP 会阻止不在显式依赖列表中的依赖（即没有定义在 package.json 中）。开启 loose 模式后，PnP 会利用 node-modules 的提升策略（把深层次的依赖提升到顶层安装）把这些原本会被提升的包记录在“fallback pool”，当未显式定义的依赖但在“fallback pool”清单中时不会被阻止 resolve。不过当同个包的有不同版本时，无法确定哪个版本会被提升，因此会生成 warning。

## 注意事项

- 部分第三方包自己实现了 Node Resolution 策略

有一些包可能自己实现了 resolver 来处理 require()请求（除了已结合 PnP API 规范的），这可能会和 PnP 产生冲突异常，可以在 Yarn[官方仓库](https://github.com/yarnpkg/yarn/issues)反馈。大多数都可以通过 loose 模式或者插件解决，但是 Flow 和 React Native 和 PnP 完全不兼容，可以在.yarnrc.yml 中配置`nodeLinker: node-modules`切换为生成 node_modules 文件夹的模式。

- script 脚本命令需要前置增加 yarn 命令

node index.js => yarn node index.js

- vscode 需要配置 Editor SDKs

[https://yarnpkg.com/advanced/editor-sdks](https://yarnpkg.com/advanced/editor-sdks)

- 当需要修改第三方包源码进行调试时

使用 yarn unplug packageName 来将某个指定依赖拷贝到项目中的 .pnp/unplugged 目录下，之后 .pnp.js 中的 resolver 就会自动加载这个 unplug 的版本。调试完毕后，再执行 yarn unplug --clear packageName 可移除本地 .pnp/unplugged 中的对应依赖。

## 参考

[https://yarnpkg.com/features/pnp](https://yarnpkg.com/features/pnp)
[https://nodejs.org/api/modules.html#modules_all_together](https://nodejs.org/api/modules.html#modules_all_together)
[https://stackoverflow.com/questions/53135221/what-does-yarn-pnp](https://stackoverflow.com/questions/53135221/what-does-yarn-pnp)
[https://www.zhihu.com/question/367871981?utm_source=qq](https://www.zhihu.com/question/367871981?utm_source=qq)
[https://github.com/yarnpkg/berry/issues/634](https://github.com/yarnpkg/berry/issues/634)
[http://loveky.github.io/2019/02/11/yarn-pnp/](http://loveky.github.io/2019/02/11/yarn-pnp/)
