> qiankun 是基于 single-spa 的上层框架，qiankun2.0 的定位由微前端框架变为微**应用**加载器。

## 对比

![image.png](https://cdn.nlark.com/yuque/0/2020/png/467908/1608624755328-231cdcea-56bb-477b-929b-ea589380d939.png#align=left&display=inline&height=305&margin=%5Bobject%20Object%5D&name=image.png&originHeight=610&originWidth=1233&size=283654&status=done&style=none&width=616.5)

|                    | single-spa                                                  | qiankun                                                    |
| ------------------ | ----------------------------------------------------------- | ---------------------------------------------------------- |
| 粒度               | 微模块                                                      | 微应用                                                     |
| 加载资源           | 入口 JS                                                     | 入口 HTML，或 JS                                           |
| 加载器             | SystemJS                                                    | import-html-entry                                          |
| 样式隔离           | /                                                           | 子应用间用 shadow dom 隔离样式，但主应用的样式会影响子应用 |
| window 污染        | /                                                           | 包裹在立即执行函数中并传入 proxy window                    |
| 子应用层级关系     | 兄弟关系，并列存在于 body                                   | 指定挂载节点，支持嵌套应用                                 |
| 独立运行子应用     | 可能需要修改子应用的样式                                    | 无需修改                                                   |
| 各应用重复依赖问题 | systemjs+[import-maps](https://github.com/WICG/import-maps) | webpack5 的 module federation 的 shared 参数               |
| 父子应用的交流     |                                                             |                                                            |

## 讨论

### 独立运行子应用

- single-spa：由于子应用是兄弟关系，在集成时可能会进行样式的协调，比如左边 navbar 的宽度是 300px，那么 content 部分需要设置 margin-left：300px，当独立运行 content 部分就需要移除 margin-left。
- qiankun：当使用兄弟关系构建子应用时，同 single-spa；当是嵌套关系时，独立运行 content 部分无需修改任何样式。

### 按需显隐 layout

- single-spa：在 registerApplication 时设置激活规则，比如 layout app 的激活条件排除/login 路由。
- qiankun：如果 layout 在主应用中，在 layout component 中根据路由显隐即可；其他同 single-spa。

### 路由原理

主应用根据路由激活对应的子应用，或手动按需激活，激活之后再触发子应用的路由。所以说主应用的路由和子应用的路由是分离的。

## References

[https://zhuanlan.zhihu.com/p/234964127](https://zhuanlan.zhihu.com/p/234964127)
[https://micro-frontends.org/](https://micro-frontends.org/)
[https://github.com/umijs/qiankun/issues/337](https://github.com/umijs/qiankun/issues/337)
