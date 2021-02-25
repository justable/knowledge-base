## 概述

umi 是一个基于 webpack 的构建工具，它对 react 生态做了收敛，是我们可以把更多的精力集中在业务上，而不是各种框架、工具的集成上，也不用考虑 webpack 的各种打包优化。

## 使用

> 有些新特性官方文档不会立即更新，可以通过https://github.com/umijs/plugins/tree/master/packages/${pluginName}/src/index.ts了解。
> 或者浏览[sorrycc 的博客](https://github.com/sorrycc/blog/issues/92)。

- `yarn create @umijs/umi-app`

## @umijs/preset-react

这是针对 react 应用的插件集，只需保证该依赖已安装，umi 会自动识别无需我们做任何相关配置。其包含了如下插件：

- @umijs/plugin-access，权限管理
- @umijs/plugin-analytics，统计管理
- @umijs/plugin-antd，整合 antd UI 组件
- @umijs/plugin-crossorigin，通常用于 JS 出错统计
- @umijs/plugin-dva，整合 dva
- @umijs/plugin-helmet，整合 react-helmet，管理 HTML 文档标签（如标题、描述等）
- @umijs/plugin-initial-state，初始化数据管理
- @umijs/plugin-layout，配置启用 ant-design-pro 的布局
- @umijs/plugin-locale，国际化能力
- @umijs/plugin-model，基于 hooks 的简易数据流
- @umijs/plugin-request，基于 umi-request 和 umi-hooks 的请求方案

## @umijs/plugin-access

> 当使用 TS 时，需要先配置`src/access.ts`，再执行`umi generate tmp`，这样才能`import {useAccess, Access} from 'umi'`。

### 运行时配置

约定在 src/access.ts 导出一个方法，该方法需要返回一个对象，对象的每一个值就对应定义了一条权限。如下所示：

```ts
// src/access.ts
export default function(initialState) {
  const { userId, role } = initialState;
  return {
    canReadFoo: true,
    canUpdateFoo: role === 'admin',
    canDeleteFoo: foo => {
      return foo.ownerId === userId;
    },
  };
}
```

其中 initialState 是通过初始化状态插件 @umijs/plugin-initial-state 提供的数据，你可以使用该数据来初始化你的用户权限。

### 路由配置

Access 插件基于 umi 路由，扩展了更多的配置项，如下所示，只有拥有了 canReadPageA 权限，用户才可以访问该页面，否则会默认渲染 Layout 插件内置的权限错误页面，

```ts
// config/route.ts
export const routes = [
  {
    path: '/pageA',
    component: 'PageA',
    access: 'canReadPageA', // 权限定义返回值的某个 key
  },
];
```

### 代码案例

我们也能直接在代码中获取权限信息，

```ts
import React from 'react';
import { useAccess, Access } from 'umi';
const PageA = props => {
  const { foo } = props;
  const access = useAccess(); // access 的成员: canReadFoo, canUpdateFoo, canDeleteFoo
  if (access.canReadFoo) {
    // 如果可以读取 Foo，则...
  }
  return (
    <div>
      <Access
        accessible={access.canReadFoo}
        fallback={<div>Can not read foo content.</div>}
      >
        Foo content.
      </Access>
      <Access
        accessible={access.canDeleteFoo(foo)}
        fallback={<div>Can not delete foo.</div>}
      >
        Delete foo.
      </Access>
    </div>
  );
};
```

## @umijs/plugin-antd

- 内置 antd，目前内置版本是 ^4.0.0
- 内置 antd-mobile，目前内置版本是 ^2.3.1
- 基于 babel-plugin-import 做按需编译
- 使用 antd@4 时，可一键切换为暗色主题

### 构建时配置

```ts
export default {
  antd: {
    dark: true,
    compact: true,
  },
};
```

## @umijs/plugin-dva

> 只有 2.6.x 版本以上支持 useDispatch,useSelector,useStore，否则使用 connect。
> 可以使用 `umi dva list model` 查看项目中包含了哪些 model。

- 内置 dva，默认版本是 ^2.6.0-beta.20，如果项目中有依赖，会优先使用项目中依赖的版本。
- 约定式的 model 组织方式，不用手动注册 model
- 文件名即 namespace，model 内如果没有声明 namespace，会以文件名作为 namespace
- 内置 dva-loading，直接 connect loading 字段使用即可
- 支持 immer，通过配置 immer 开启

### 构建时配置

```ts
export default {
  dva: {
    immer: true,
    hmr: false,
  },
};
```

### 运行时配置

在 src/app.ts 导出 dva 对象，

```ts
// src/app.ts
import { createLogger } from 'redux-logger';
import { message } from 'antd';
export const dva = {
  config: {
    onAction: createLogger(),
    onError(e: Error) {
      message.error(e.message, 3);
    },
  },
};
```

### Model 案例

```ts
import { Effect, ImmerReducer, Reducer, Subscription } from 'umi';
export interface IndexModelState {
  name: string;
}
export interface IndexModelType {
  namespace: 'index';
  state: IndexModelState;
  effects: {
    query: Effect;
  };
  reducers: {
    save: Reducer<IndexModelState>;
    // 启用 immer 之后
    // save: ImmerReducer<IndexModelState>;
  };
  subscriptions: { setup: Subscription };
}
const IndexModel: IndexModelType = {
  namespace: 'index',
  state: {
    name: '',
  },
  effects: {
    *query({ payload }, { call, put }) {},
  },
  reducers: {
    save(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
    // 启用 immer 之后
    // save(state, action) {
    //   state.name = action.payload;
    // },
  },
  subscriptions: {
    setup({ dispatch, history }) {
      return history.listen(({ pathname }) => {
        if (pathname === '/') {
          dispatch({
            type: 'query',
          });
        }
      });
    },
  },
};
export default IndexModel;
```

## @umijs/plugin-initial-state

> 该插件需要搭配@umijs/plugin-model 一起使用。页面第一次 getInitialState 会阻塞渲染进程，所以在其他组件可以直接使用 initialState，loading 是为之后的 refresh 服务的。

### 运行时配置

在 src/app.ts 导出 getInitialState 方法，返回值会作为全局共享的数据，我们可以在组件中通过 useModel('@@initialState')获取它，像这样，

```ts
// src/app.ts
// 获取用户信息比较慢的时候会展示一个 loading
export const initialStateConfig = {
  loading: <PageLoading />,
};
export async function getInitialState() {
  const data = await fetchXXX();
  return data;
}
// component
import { useModel } from 'umi';
export default () => {
  const { initialState, loading, error, refresh, setInitialState } = useModel(
    '@@initialState',
  );
  return <>{initialState}</>;
};
```

## @umijs/plugin-layout

集成了 [ProComponents](https://procomponents.ant.design/)，ProComponents 是一种重型组件库，重型组件是指对某一业务模型的包装，业务模型可以是“中后台项目的整体布局”，“带高级搜索的列表页”，“常见的提交表单页”，重型组件与业务强关联，失去部分的灵活性，但节省了很多重复开发的成本。

### 构建时配置

```ts
export default {
  layout: {
    name: 'Ant Design',
    locale: true,
    layout: 'side',
  },
};
```

### 运行时配置

```ts
// src/app.ts
import React from 'react';
import {
  BasicLayoutProps,
  Settings as LayoutSettings,
} from '@ant-design/pro-layout';
export const layout = ({
  initialState,
}: {
  initialState: { settings?: LayoutSettings; currentUser?: API.CurrentUser };
}): BasicLayoutProps => {
  return {
    rightContentRender: () => <RightContent />,
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { currentUser } = initialState;
      const { location } = history;
      // 如果没有登录，重定向到 login
      if (!currentUser && location.pathname !== '/user/login') {
        history.push('/user/login');
      }
    },
    menuHeaderRender: undefined,
    ...initialState?.settings,
  };
};
```

### 路由配置

Layout 插件基于 umi 路由，扩展了更多的配置项。

```ts
//config/route.ts
export const routes: IBestAFSRoute[] = [
  {
    path: '/welcome',
    component: 'IndexPage',
    menu: {
      name: '欢迎', // 兼容此写法
      icon: 'testicon',
    },
    // 不展示顶栏
    headerRender: false,
    // 不展示页脚
    footerRender: false,
    // 不展示菜单
    menuRender: false,
    // 不展示菜单顶栏
    menuHeaderRender: false,
    // 权限配置，需要与 plugin-access 插件配合使用
    access: 'canRead',
    // 隐藏子节点
    hideChildrenInMenu: true,
    // 隐藏自己和子节点
    hideInMenu: true,
    // 子项往上提，仍旧展示,
    flatMenu: true,
  },
];
```

### 代码案例

本来我们使用@ant-design/pro-layout 是这样的，

```ts
import ProLayout, { PageContainer } from '@ant-design/pro-layout';
function DemoPage() {
  return (
    <ProLayout {...defaultProps}>
      <PageContainer></PageContainer>
    </ProLayout>
  );
}
```

用了@umijs/plugin-layout 之后，外层 umi 会帮我们自动构建，我们只需关注页面主体部分，

```ts
import { PageContainer } from '@ant-design/pro-layout';
function DemoPage() {
  return <PageContainer></PageContainer>;
}
```

如果想要一探究竟 umi 是怎么封装的，可以查看.umi/plugin-layout/layout/index.tsx。

## @umijs/plugin-locale

基于 react-intl 库，规定 src/locales/目录下存放国际化文件。

### 构建时配置

如果想要关闭项目的国际化，不配置 locale 字段就可以了，

```ts
export default {
  locale: {
    default: 'zh-CN',
    antd: false,
    title: false,
    baseNavigator: true,
    baseSeparator: '-',
  },
};
```

### 运行时配置

```ts
// src/app.ts
import qs from 'qs';
export const locale = {
  getLocale() {
    // 识别url的 ?locale=${lang} 当做当前页面的语言
    const { search } = window.location;
    const { locale = 'zh-CN' } = qs.parse(search, { ignoreQueryPrefix: true });
    return locale;
  },
  setLocale({ lang, realReload, updater }) {
    history.push(`/?locale=${lang}`);
    updater();
  },
};
```

### 代码案例

国际化文本的 key 理论上可以自由定义，但我们通常约定俗成用.分隔文案在组件的层级关系。

```ts
// en-US.ts
export default {
  'navbar.lang': '中文',
};
// zh-CN.ts
export default {
  'navbar.lang': 'English',
};
```

```ts
import { getLocale, setLocale, FormattedMessage } from 'umi';
const SelectLang: React.FC = () => {
  function changeLang() {
    const locale = getLocale();
    if (!locale || locale === 'zh-CN') {
      setLocale('en-US');
    } else {
      setLocale('zh-CN');
    }
  }
  return (
    <Button
      size="small"
      ghost={theme === 'dark'}
      style={{
        margin: '0 8px',
      }}
      onClick={() => {
        changLang();
      }}
    >
      <FormattedMessage id="navbar.lang" />
    </Button>
  );
};
```

## @umijs/plugin-model

在 src/models 中编写自定义 hook，hook 中的状态会被全局化，按照如下所示使用，

```ts
// src/models/useCounter.js
import React, { useState } from 'react';
export default () => {
  const [counter, setCounter] = useState(0);
  const increment = () => setCounter(c => c + 1);
  const decrement = () => setCounter(c => c - 1);
  return { counter, increment, decrement };
};
// component
import React from 'react';
import { useModel } from 'umi';
export default () => {
  // namespace counter源自src/models/useCounter.js文件名
  const { counter, increment, decrement } = useModel('counter');
  return (
    <>
      <h2 data-testid="count">{counter}</h2>
      <button onClick={increment}>add</button>
      <button onClick={decrement}>minus</button>
    </>
  );
};
```

其本质是静态分析自定义 Hook 语法，将所有自定义 Hook 的数据收集并对应到 namespace 上，并把最终的 Model 对象通过 Context 分发给子组件，子组件通过`useModel('counter')`获取 Context 数据对应 namespace 的数据。你问我怎么知道的？可以自行查看`@umijs/plugin-model`源码和`.umi/plugin-model`文件夹。

## @umijs/plugin-request

基于 umi-request 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。

### 接口格式规范

```ts
export enum ErrorShowType {
  SILENT = 0, // 不提示错误
  WARN_MESSAGE = 1, // 警告信息提示
  ERROR_MESSAGE = 2, // 错误信息提示
  NOTIFICATION = 4, // 通知提示
  REDIRECT = 9, // 页面跳转
}
interface ErrorInfoStructure {
  success: boolean; // if request is success
  data?: any; // response data
  errorCode?: string; // code for errorType
  errorMessage?: string; // message display to user
  showType?: number; // error display type： 0 silent; 1 message.warn; 2 message.error; 4 notification; 9 page
  traceId?: string; // Convenient for back-end Troubleshooting: unique request ID
  host?: string; // onvenient for backend Troubleshooting: host of current access server
}
```

### 构建时配置

```ts
export default {
  request: {
    dataField: 'data',
  },
};
```

### 运行时配置

```ts
// src/app.ts
import { RequestConfig } from 'umi';
export const request: RequestConfig = {
  timeout: 1000,
  errorConfig: {
    adaptor: resData => {
      return {
        ...resData,
        success: resData.ok,
        errorMessage: resData.message,
      };
    },
    errorPage: '',
  },
  middlewares: [
    async function middlewareA(ctx, next) {
      const { req } = ctx;
      const { url, options } = req;

      // 判断是否需要添加前缀，如果是统一添加可通过 prefix、suffix 参数配置
      if (url.indexOf('/api') !== 0) {
        ctx.req.url = `/api/v1/${url}`;
      }
      ctx.req.options = {
        ...options,
        foo: 'foo',
      };

      await next();

      const { res } = ctx;
      const { success = false } = res; // 假设返回结果为 : { success: false, errorCode: 'B001' }
      if (!success) {
        // 对异常情况做对应处理
      }
    },
  ],
  requestInterceptors: [
    (url, options) => {
      return {
        url: `${url}&interceptors=yes`,
        options: { ...options, interceptors: true },
      };
    },
  ],
  responseInterceptors: [
    response => {
      const codeMaps = {
        502: '网关错误。',
        503: '服务不可用，服务器暂时过载或维护。',
        504: '网关超时。',
      };
      message.error(codeMaps[response.status]);
      return response;
    },
    async response => {
      const data = await response.clone().json();
      if (data && data.NOT_LOGIN) {
        location.href = '登录url';
      }
      return response;
    },
  ],
};
```

### 代码案例

```ts
import { useRequest } from 'umi';
export default () => {
  const { data, error, loading } = useRequest(() => {
    return services.getUserList('/api/test');
  });
  if (loading) {
    return <div>loading...</div>;
  }
  if (error) {
    return <div>{error.message}</div>;
  }
  return <div>{data.name}</div>;
};
```

## 生态周边

- [Ant Design Pro](https://beta-pro.ant.design/)
- [ProComponents](https://procomponents.ant.design/)把常用的业务范型包装成组件，用起来很方便
- [UmiJS V3](https://umijs.org/zh-CN/docs)
- [Umi 入门](https://www.yuque.com/umijs/umi)
- [dumi](https://github.com/umijs/dumi)是一个 React 组件文档生成器
- [father](https://github.com/umijs/father)是 rollup 的上层封装，便于写 library
- [qiankun](https://github.com/umijs/qiankun)是一个微前端框架
