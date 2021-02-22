---
title: Case Study
---

## DataV 的实现 <Badge>待实践</Badge>

> 可以参考[文章](https://juejin.cn/post/6915297687873159176)。

1. 网格式编辑区
2. 可视化组件可自由拖拽组合
3. 支持配置组件参数
4. 支持全屏预览
5. 一键上传即可在线预览
6. 支持导出为 json 文件
7. 支持导入 json 文件
8. 支持一键生成 screenshot

想要实现上传导入导出功能，就需要制定一套 json 与视图转换的方案。

```json
{
  "formControls":[{"id":"1","type":"Text","label":"姓名","placeholder":"请输入姓名"},{"id":"2","type":"Number","label":"年龄","placeholder":" 请输入年龄"},{"id":"4","type":"MySelect","label":"爱好","options":[{"label":"选项一","value":"1"},{"label":"选项二","value":"2"},{"label":"选项三","value":"3"}]}]},"h":172,"type":"Form","category":"base"},"point":{"i":"x-21","x":0,"y":66,"w":24,"h":172,"isBounded":true},"status":"inToCanvas"}],"pageConfig":{"bgColor":"rgba(250,250,250,1)","title":"测试","desc":"测试"}
}
```

## 泛微接外部图表的相关方案

方案一：基于 ecode 云平台开发
描述：通过上次听课，了解到 ecode 是泛微提供的云开发平台，能够直接编辑公司 oa 的前端代码，也支持使用开源的数据图表库，比如 echarts。
缺点：
• ecode 云平台对前端的框架做过一次封装，有额外的学习成本。
• ecode 云平台所选用的前端开发框架由泛微统一管理，通常版本滞后，而前端同一框架的不同版本也会存在开发模式上的差异，前端人员可能开发不适应（与我们公司前端的主流开发模式有出入）。
方案二：独立部署数据可视化前端项目
描述：该项目作为数据可视化的展示平台，可以选择通过 iframe 内嵌到 oa 的页面中，或者在 oa 页面配置按钮跳转到单独的数据可视化页。
优点：
• 符合当下前端的主流开发模式，不再受泛微框架约束，开发起来更自由。
• 该项目可以不仅服务于 oa 项目，也可以服务于未来项目的任何可视化需求。
缺点：
• 依然需要在 oa 上写接入部分的代码（比如 iframe 或跳转按钮）。
• iframe 内嵌的形式或者按钮外部跳转的形式是否满足基本需求。
这是在上次听课和自己总结后能想到的两个大体方案，也没有其他更多细节好讲的了。

## 商城类系统开发

> S: 公司旧商城使用的是 JSP，与当下前端技术脱节难以维护（前端人员看不懂内嵌的 java 代码，我有过一年的 Java 开发经验），严重和后端耦合上线困难
> T: 技术选型，前端代码重构，SEO 友好
> A: 根据时下前端生态考量，选择了 React+Typescript，使用 umi 作为构建工具，并使用 SSR 同构技术
> R: 从 4 月分到 6 月份，在 618 活动前准时上线
> 难点: 活动页（倒计时抢购，砸金蛋），SSR 流式传输，异常监控，性能分析，用户行为分析，测试环境 docker 部署，图片防盗链，XSS 防范（对用户输入部分进行过滤处理）

重点是用户体验、性能、安全性。

### 路由设计

umi 对 react-router 进行了技术收敛。在嵌套路由的情景中，react-router 需要在子路由组件中定义下一层嵌套路由的结构，也就是 Route 组件嵌套 Route 组件，换句话说，react-router 是需要我们显示组织各路由组件间的关系的，即使把组件关系抽象成 config 配置文件，也需要我们手动遍历 config 得到最终的嵌套结构；在 umi 中，我们只需要关注路由组件自身的业务逻辑而不需要加入任何描述层级关系的代码，路由组件的层级关系全部通过 routes 配置文件管理，比如这样：

```js
const config = {
  routes: [
    {
      path: '/goodindexes',
      component: './Goodindexes',
      routes: [
        {
          path: '/goodindexes/list',
          component: './Goodindexes/List',
        },
        {
          path: '/goodindexes/cart',
          component: './Goodindexes/Cart',
        },
      ],
    },
    {
      path: '/credentials',
      component: './Credentials',
      routes: [
        {
          path: '/credentials/login',
          component: './Credentials/Login',
        },
        {
          path: '/credentials/register',
          component: './Credentials/Register',
        },
      ],
    },
    {
      path: '/',
      redirect: '/goodindexes/entry',
    },
    {
      component: './404',
    },
  ],
};
```

子路由组件会自动通过 props.children 传递给父路由组件。

嵌套路由存在的问题：可能会导致路由的 url 越来越长，像`/grandfather/father/son/grandson`这样。但是实际业务中，多个页面确实有共同部分需要提升到父路由组件中，我们接着思考一个问题，假如共同部分包含 a,b,c 三个组件，页面 A 和 B 需要显示 a,b,c，页面 C 只需显示 a,b，此时需要再把 a,b 进行路由提取吗？其实除了提升公共部分到父级路由，还可以在父级路由组件中根据当前匹配路由作动态区别处理，这在页面少的情况下更适合。

```js
import { useLocation } from 'umi';
const hasGoodMenuRoutes = [
  '/goodindexes/entry',
  '/goodindexes/list',
  '/goodindexes/menu',
];
function isShowGoodMenu(pathname: string) {
  return hasGoodMenuRoutes.includes(pathname);
}
const GoodIndexes = props => {
  const location = useLocation();
  const hasGoodMenu = isShowGoodMenu(location.pathname);
  return <div></div>;
};
```

如果直接在浏览器输入`/goodindexes`，页面会出现空白部分（没有加载子路由），怎么办？如果把公共部分抽象成 Layouts，路由切换时公共部分被重写渲染。

路由模式：hash 模式和 history 模式，history 模式需要服务端作适配处理。

## OA 系统开发

> S: OA 系统业务迭代
> T: OA 系统业务迭代
> A: React+Typescript，antd+componentpro
> R: OA 系统业务迭代
> 难点: 复杂表单，页面可视内容与权限挂钩

重点是权限、复杂表单、流程

## 公司内部统一平台搭建

> S: 需要一个统一平台统筹路由不同业务部门的数据平台，兼容各部门不同技术栈的前端项目（主要是 React 和 Vue）
> T: 调研微前端方案（single-spa 和 qiankun），搭建统一平台
> A: 选择 qiankun，将菜单用户信息提升到 root 项目
> R: 对各部门无感升级，
> 难点: 不同开发组的协作（微前端）

## 其他

小程序，h5，运维（docker，linux）

## 前端监控系统

https://juejin.cn/post/6844903662020460552
https://juejin.cn/post/6844903959115595790
