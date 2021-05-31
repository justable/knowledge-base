# Umi3 使用小结

## 概述

umi 是一个基于 webpack 的构建工具，它对 react 生态做了收敛，是我们可以把更多的精力集中在业务上，而不是各种框架、工具的集成上，也不用考虑 webpack 的各种打包优化。

## 使用

> 有些新特性官方文档不会立即更新，可以通过https://github.com/umijs/plugins/tree/master/packages/${pluginName}/src/index.ts了解。
> 或者浏览[sorrycc 的博客](https://github.com/sorrycc/blog/issues/92)。

执行`yarn create umi myapp`，选择 ant design pro v5。实际会调用[create-umi](https://github.com/umijs/create-umi)来创建项目。如果想要更轻量简单的初始配置，可以使用`yarn create @umijs/umi-app myapp`，实际会调用[@umijs/create-umi-app](https://github.com/umijs/umi/tree/master/packages/create-umi-app#readme)来创建项目。

执行`umi g tmp`可以生成`src/.umi/`文件夹以测试代码可行性。

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

```tsx
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
    // 每次dispatch都会打出日志
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

[使用@umijs/plugin-layout 动态获取菜单异常](https://github.com/umijs/plugins/issues/616)

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

### 错误处理方案

后台遵守 RESTful 的前提下，把错误消息体的格式定义成如下格式：

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
  showType?: ErrorShowType; // error display type： 0 silent; 1 message.warn; 2 message.error; 4 notification; 9 page
  traceId?: string; // Convenient for back-end Troubleshooting: unique request ID
  host?: string; // onvenient for backend Troubleshooting: host of current access server
}
```

`@umijs/plugin-request`会自动拦截非 200 接口，把错误信息根据 showType 统一处理？待确定，我们无需再为 axios 配置任何的拦截器。如果后台返回的错误信息不符合如上格式，可以通过 errorConfig.adaptor 进行配置，下面的运行时配置会有介绍。

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
  prefix: '/api',
  requestInterceptors: [
    (url, options) => {
      if (getToken()) {
        // @ts-ignore
        options.headers['Authorization'] = 'Bearer ' + getToken();
      }
      return {
        url,
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
      if (data && data.code === 401) {
        message.error('登录状态已过期，请重新登录');
        removeToken();
        history.push(loginPath);
      }
      return response;
    },
  ],
  errorConfig: {
    adaptor: (resData, ctx) => {
      const { code, msg, data } = resData;
      if (code === 401) {
        message.error('登录状态已过期，请重新登录');
        removeToken();
        history.push(loginPath);
      }
      return {
        success: code === 200,
        errorCode: code,
        errorMessage: msg || codeMessage[code],
        showType: 2,
        data,
      };
    },
    errorPage: '',
  },
  errorHandler: (error: ResponseError) => {
    // 覆盖默认的errorHandler
    const { messages } = getIntl(getLocale());
    const { response } = error;

    if (response && response.status) {
      const { status, statusText, url } = response;
      const requestErrorMessage = messages['app.request.error'];
      const errorMessage = `${requestErrorMessage} ${status}: ${url}`;
      const errorDescription = messages[`app.request.${status}`] || statusText;
      notification.error({
        message: errorMessage,
        description: errorDescription,
      });
    }
    if (!response) {
      notification.error({
        description: '您的网络发生异常，无法连接服务器',
        message: '网络异常',
      });
    }
    throw error;
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
};
```

要想知道上述配置的执行原理，可以在`.umi/plugin-request/request.ts`查看，以下是部分代码：

```js
// 230行
const errorInfo = errorAdaptor(resData, ctx);
if (errorInfo.success === false) {
  // 抛出错误到 errorHandler 中处理
  const error: RequestError = new Error(errorInfo.errorMessage);
  error.name = 'BizError';
  error.data = resData;
  error.info = errorInfo;
}
```

我们可以在 errorConfig.adaptor 自定义返回 errorInfo，默认的 errorHandler 方法中会获取 errorInfo 并作相关处理，比如自动错误弹框（见 155 行），我们也可以覆盖默认的 errorHandler 配置。在接口调用处最好 trycatch 捕获错误，未捕获的错误在开发模式中会进入错误栈界面。

除了 errorConfig 和 middlewares 以外其它配置都是直接透传 umi-request 的全局配置，所以想知道都支持哪些配置可以直接参考 umi-request 的全局配置。

总结下，如果后端选择了自定义状态码（总是返回 200 的情况），我们可以在 errorConfig.adaptor 中适配错误信息（只需返回 success=false 就会进入 errorHandler）；如果后端选择了原生 http 状态码，我们可以在 responseInterceptors 中处理错误信息，umi 自动会处理 http 状态码不为 200 的情况进入 errorHandler 吗？待确定。

### 代码案例

> 从个人实践来看，接口状态码放在 response header 上，错误的 errorMessage 优先后台定义，前端来做弥补措施。可以参考[mall-front-template](https://github.com/justable/mall-front-template)的相关配置。

```ts
// mock
export default {
  'GET /api/currentUser': (req: Request, res: Response) => {
    res.status(401).send({
      data: {
        isLogin: false,
      },
      errorCode: '401',
      errorMessage: '请先登录！',
      success: true,
      showType: 2,
    });
    return;
  },
};
```

```tsx | pure
// component
import { useRequest } from 'umi';
export default () => {
  const { data, error, loading } = useRequest(() => {
    return services.getCurrentUser();
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

## @umijs/plugin-openapi

可以根据后端的 swagger 文档一键生成 services,mocks 目录

```ts
export default {
  openAPI: [
    // {
    //   requestLibPath: "import { request } from 'umi'",
    //   // 或者使用在线的版本
    //   // schemaPath: "https://gw.alipayobjects.com/os/antfincdn/M%24jrzTTYJN/oneapi.json"
    //   schemaPath: join(__dirname, 'oneapi.json'),
    //   mock: false,
    // },
    {
      requestLibPath: "import { request } from 'umi'",
      schemaPath: join(__dirname, 'openapi-system.json'),
      projectName: 'system',
      mock: false,
    },
    // {
    //   requestLibPath: "import { request } from 'umi'",
    //   schemaPath: 'https://gw.alipayobjects.com/os/antfincdn/CA1dOm%2631B/openapi.json',
    //   projectName: 'swagger',
    // },
    // {
    //   requestLibPath: "import { request } from 'umi'",
    //   schemaPath: 'http://localhost:8080/system/v2/api-docs',
    //   projectName: 'system',
    //   mock: true,
    // },
  ],
};
```

执行`umi openapi`即可。

[openapi 插件只支持解析 3.0 版本的吗？](https://github.com/umijs/plugins/issues/607)

## 使用多页面和构建预渲染

配置如下：

```ts
export default {
  exportStatic: {},
};
```

如果想要 SEO 优化，可以配置：

> 只有在多页面场景才会开启构建时预渲染，即同时设置 exportStatic 和 ssr。

```ts
export default {
  exportStatic: {},
  ssr: {},
};
```

这样 umi 会为每个页面在构建时预渲染（不同于服务端渲染）。

## 服务端渲染

> [详细介绍](https://umijs.org/zh-CN/docs/ssr)

配置如下：

```ts
export default {
  ssr: {
    // devServerRender为true，设置false后本地运行时不会执行服务端渲染逻辑，但build时仍会生产umi.server.js
    devServerRender: false,
  },
};
```

此时会生成 umi.server.js，然后在服务端使用它：

```js
// Koa
const staticPath = path.resolve(__dirname, config.ssr.path);
app.use(
  compress({
    threshold: 2048,
    gzip: {
      flush: require('zlib').constants.Z_SYNC_FLUSH,
    },
    deflate: {
      flush: require('zlib').constants.Z_SYNC_FLUSH,
    },
    br: false, // 禁用br解决https gzip不生效加载缓慢问题
  }),
);

let render: IServerRender;
app.use(async (ctx, next) => {
  /**
   *  扩展global对象
   *
   *  这里是在服务端处理好cookie，
   *  会把所有cookie处理成{}形式
   *  赋值到global上面，方便客户端使用
   *
   *  同时获取浏览器的默认语言，处理好
   */
  // @ts-ignore
  global._cookies = parseCookie(ctx);
  // @ts-ignore
  global._navigatorLang = parseNavLang(ctx);

  const ext = path.extname(ctx.request.path);
  // 符合要求的路由才进行服务端渲染，否则走静态文件逻辑
  if (!ext) {
    if (!render) {
      render = require(path.join(staticPath, 'umi.server.js'));
    }

    const { html, error, rootContainer } = await render({
      basename: config.ssr.basename,
      path: ctx.request.url,
      // 开启流式传输
      mode: 'stream',
    });
    if (error) {
      console.log('----------------服务端报错-------------------', error);
      ctx.throw(500, error);
    } else {
      ctx.status = 200;
      ctx.type = 'text/html';
    }
    if (html instanceof Stream) {
      // 流渲染
      // ctx.type = 'application/octet-stream';
      ctx.body = html.on('error', ctx.onerror).pipe(new PassThrough());
    } else {
      ctx.body = html;
    }
  } else {
    await next();
  }
});

app.use(mount(`/${config.ssr.basename}`, require('koa-static')(staticPath)));
```

目前有两个 bug，不能同时使用 ssr 和 hash，如果 root 节点有子节点就不会服务端渲染。
https://github.com/umijs/umi/issues/6653

## 按需加载资源

umi 默认不会开启按需加载，build 后的目录是这样的：

```
+ dist
  - umi.js
  - umi.css
  - index.html
```

如果想要开启，umi 主要有两种按需加载资源策略：

1. 按路由

> 已知问题：global.css 会先于 antd.css 加载导致无法覆盖 antd 样式。

如下配置：

```js
export default {
  dynamicImport: {
    loading: '@/Loading',
  },
};
```

umi 会按照 SPA 的路由分离资源，即触发了对应的路由才会异步加载该路由的资源（js/css 等）。目录会变成这样：

```
+ dist
  - umi.js
  - umi.css
  - index.html
  - p__index.js
  - p__users__index.js
```

我们可以设置`src/Loading.tsx`作为加载时动画。

2. 按`import()`语法

如下配置：

```js
export default {
  dynamicImportSyntax: {},
};
```

只会对`import()`语法做 code spliting。

## 环境参数

- get user config failed, undefined does not exist, but process.env.UMI_ENV is set to dev.

当执行`cross-env UMI_ENV=dev umi dev`时报错，需要新增 config.dev.ts 文件，UMI_ENV=dev 时会去读取该文件。如果我们想自定义控制 dev 环境的行为，可以取名为 REACT_APP_ENV，当然也可以直接使用 UMI_ENV。

## 环境变量

Umi 中约定根目录下的 .env 为环境变量配置文件。然后在配置文件中定义 define 使其暴露在运行时中，注意运行时中不要通过 process.env.XXX 访问，直接 XXX 访问就可以了。

## 生态周边

- [Ant Design Pro](https://beta-pro.ant.design/)
- [ProComponents](https://procomponents.ant.design/)把常用的业务范型包装成组件，用起来很方便
- [UmiJS V3](https://umijs.org/zh-CN/docs)
- [Umi 入门](https://www.yuque.com/umijs/umi)
- [dumi](https://github.com/umijs/dumi)是一个 React 组件文档生成器
- [father](https://github.com/umijs/father)是 rollup 的上层封装，便于写 library
- [qiankun](https://github.com/umijs/qiankun)是一个微前端框架

## FAQ

我的期待：有个获取动态菜单的接口，我希望在登录成功后自动获取，并配合 ProLayout 完成渲染。
我的做法：在使用`@umijs/plugin-layout`时，我在 app.tsx 中配置了菜单动态获取，比如：

```tsx
export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  return {
    menu: {
      request: async () => {
        try {
          return await getMenus();
        } catch (error) {
          return [];
        }
      },
    },
  };
};
```

然后在 routes 文件中配置登录界面 `layout: false`，不希望登录界面调用该接口：

```js
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user/login',
        component: './user/Login',
      },
    ],
  },
];
```

实际状况：在登录界面就发起了菜单接口请求，导致接口异常。

@ant-design/pro-layout：6.17.1
@umijs/plugin-layout：0.15.0
umi:3.4.15

### 运行时配置 base 和 publicPath

```js
// base
window.routerBase = 'xxx';
// publicPath
__webpack_public_path__ = 'xxx';
```

## 参考

https://help.aliyun.com/learn/learningpath/oss.html?spm=5176.10695662.5694434980.6.188e5ad3iP0lBh
