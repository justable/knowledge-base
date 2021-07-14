## 架构

- 本地服务器：express，手动调用 webpack-dev-middleware。为什么不直接使用 webpack-dev-server？为了根据需求进行更多自定义设置，其实 webpack-dev-server 也是基于 webpack-dev-middleware。参考[webpack 开发环境][1]。
- 登录页：独立的 html，不在 react 体系中，使用的 jquery，通过 express 静态代理，见 addDevMiddlewares.js。
- 接口代理：没有看到本地的 proxy 配置，应该是后端配置了 cors 策略，`access-control-allow-origin: *`。
- 动态菜单：通过system/menus一次性获取所有菜单，然后根据tab切换显示子集。
- 组件库：mkui-fd 和 mkui-ext，是对antd的封装。
- 本地联调：app/utils/config.js

## alias

```js
{
    'app': path.resolve(__dirname, '../../app'),
    'utils': path.resolve(__dirname, '../../app/utils'),
    '@': path.resolve(__dirname, '../../app/components'),
    'request': path.resolve(__dirname, '../../app/utils/request'),
    'hooks': path.resolve(__dirname, '../../app/hooks'),
}
```

## 布局

> app/containers/App/app.js

```jsx | pure
<AppWrapper cls={sideWidth < 100 ? 'app-menu-small' : ''}>
    {renderHead}
    <div className="app-layout-workspace">
    <BrowserRouter>
        {renderSideMenu}
        <div className="app-layout-workspace-content">{routesList}</div>
    </BrowserRouter>
    </div>
    {signOutFlag ? (
    <SignOutPage continueWorkHandle={continueWorkHandle}/>
    ) : null}
    <ModalContainer ref={store.current.modalContainerRef}/>
</AppWrapper>
```

## 权限控制

> PermisionCheck.js

app/services/system.js存放当前用户系统数据单例，从localStorage中读取数据来初始化（initSystemStore方法），登录进入首页后会请求后台接口获取当前用户系统数据（app/containers/App/app.js init方法），包括权限、用户信息等，并存放在全局单例中，可以通过getUserPermisions()获取当前用户的权限。



- 按钮权限控制

> 下面两种方法都是调用了getUserPermisions()

推荐：
```jsx | pure
<PermisionCheck code={`${PAGE_NAME}_export`}>
    <span className={`${prefixCls}-pad`} />
    <Button
        type="primary"
        onClick={openExportSelectHandle}
    >
        导出
    </Button>
</PermisionCheck>
```
不推荐：
```jsx | pure
import { hasRights } from 'utils/common';
const PAGE_NAME = 'User';
const hasPermission = opt => hasRights(`${PAGE_NAME}_${opt}`);
<ToolBar.Left>
    {hasPermission('add') && (
        <>
        <Link to={`${loc.pathname}/detail`}>
            <Button type="primary" style={{ marginRight: 16 }}>
            <PlusOutlined />
            添加员工
            </Button>
        </Link>
        <Link
            to={`${PATH.IMPORT_TOOL_CREATE.replace(':type', 'USER')}`}
        >
            <Button>
            <PlusOutlined />
            批量导入
            </Button>
        </Link>
        </>
    )}
</ToolBar.Left>
```

## 目录

```
maycur-electronic-archives-web
├── containers               // 一个路由页面作为一个container
│       └── App              // 项目根容器，路由结构配置，引入全局样式文件
│       └── Others           // 其他路由页面
├── styles                   // 全局样式，同时引入组件库样式
├── auth                     // 一些passport相关的静态页面
├── internals                // node脚本和webpack配置
├── server                   // express本地开发服务器
├── pom.xml
```


## FAQ

- routerInstance什么用

在平行路由组件间传递数据用的，比如MemberManage业务页面，在List页面执行`routerInstance.freshListPage = reload;`，其中reload是useAsyncTable的返回参数，作用是重新加载当前分页的数据，之后在Detail页面修改数据并保存时预先执行`routerInstance.freshListPage()`，就会触发useAsyncTable内部的reload方法去重新请求数据，最后返回List页面就能得到最新的数据了。但是为什么需要这要绕个大弯呢？在List页面每次都默认reload不就可以了？

- 路由的keep-alive是如何做的

场景：列表页第3页进入详情页，再返回页表页依然是第3页。
方法一：列表页模糊路由匹配，详情页exact路由匹配，进入详情页后列表页依然存在，通过样式控制详情页覆盖在列表页上层。
```jsx | pure
<MultipleRouterStack>
    <Route
    path={PATH.MEMBER_MANAGE}
    render={routeProps => (
        <MemberManage routerInstance={routerInstance} {...routeProps} />
    )}
    />
    <Route
    exact
    path={PATH.MEMBER_MANAGE_DETAIL_ADD}
    render={routeProps => (
        <MemberManageDetail routerInstance={routerInstance} {...routeProps} entrance="add"/>
    )}
    />
    <Route
    exact
    path={PATH.MEMBER_MANAGE_DETAIL}
    render={routeProps => (
        <MemberManageDetail routerInstance={routerInstance}  {...routeProps} entrance="edit"/>
    )}
    />
</MultipleRouterStack>
```
方法二：将详情页作为列表页的子路由，再通过样式控制详情页覆盖在列表页上层。
```jsx | pure
<Switch>
    <Route exact path={PATH.ARCHIVE_BORROW_CERTIFICATE_DETAIL} component={ArchiveBorrowCertificateDetail} />
    <Route path={PATH.ARCHIVE_BORROW_BOOK_DETAIL} component={ArchiveBorrowBookDetail} />
    <Route path={PATH.ARCHIVE_BORROW_STATEMENT_DETAIL} component={ArchiveBorrowBookDetail} />
    <Route path={PATH.ARCHIVE_CUSTOM_DETAIL} component={ArchiveBorrowCustomDetail} />
    <Route path={PATH.ARCHIVE_COMMON_DETAIL} component={CommonDetail} />
    <Route path={PATH.ARCHIVE_RECEIPT_DETAIL} component={ReceiptDetail} />
    <Route path={PATH.ARCHIVE_BILL_DETAIL} component={BillDetail} />
</Switch>
<Layout className={prefixCls}>
    <Header>
        {renderTab()}
    </Header>
    <Content>
        {renderContent()}
    </Content>
</Layout>
```

[1]: https://webpack.docschina.org/guides/development/
