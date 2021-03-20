# React 测试

## npm 包

- ✨jest：通用的测试框架
- react-test-renderer：针对 react 测试 Snapshot
- react-dom/test-utils：提供测试 react 的常用工具方法
- @testing-library/jest-dom：方便用来测试 dom 的一些属性状态
- ✨@testing-library/react：是 react-dom/test-utils 和@testing-library/dom 的上层框架，便于测试 react 组件，可替换 Enzyme
- Enzyme：类似@testing-library/react，可被替换
- ✨cypress：End To End 测试框架
- testcafe：End To End 测试框架

## 一些概念

- shallow rendering：浅渲染是指模拟渲染一层父子结构，在使用浅渲染提供的 API 时，你的一些断言不会含括子组件的行为，参考[这里](https://enzymejs.github.io/enzyme/docs/api/shallow.html)

## 链接

- ✨@testing-library/react 介绍：https://testing-library.com/docs/react-testing-library/intro
- 测试例子：https://testing-library.com/docs/example-react-transition-group
- ✨react 配合 ts 的实践经验：https://github.com/typescript-cheatsheets/react-typescript-cheatsheet#reacttypescript-cheatsheets
- react 配合 ts 的实战视频教程：https://egghead.io/courses/use-typescript-to-develop-react-applications
- react 和 redux 配合 ts 的实战教程：https://github.com/piotrwitek/react-redux-typescript-guide#table-of-contents
- ✨✨react 配合 ts 的 todo 组件例子：https://github.com/laststance/create-react-app-typescript-todo-example-2020
- ✨create-react-app 的 ts 选项介绍文档：https://create-react-app.dev/docs/adding-typescript/
- ✨react 配合 ts 起步：https://github.com/Microsoft/TypeScript-React-Starter#typescript-react-starter
- ✨@testing-library/react 介绍：https://www.robinwieruch.de/react-testing-library

## FAQ

- 当使用 react+typescript 时该如何配置测试环境？

- jest 中引入 esm 的依赖报错`Unexpected token 'export'`

  这是因为当前的 node 版本不支持 esm 的格式，并且 jest 的配置文件中的 tranform 参数又默认 ignore 了 node_module 目录，所以 esm 的依赖没有经过 babel 转换以致报错。解决办法是：

  - 方法一：更新 node 版本（node@^12.16.0 || >=13.2.0），设置 testEnvironment 参数为 jest-environment-node 或 jest-environment-jsdom-sixteen，参考[这里](https://stackoverflow.com/questions/60372790/node-v13-jest-es6-native-support-for-modules-without-babel-or-esm)和[这里](https://github.com/facebook/jest/issues/9430)。
  - 方法二：在 jest 配置的 transformIgnorePatterns 参数添加白名单，让指定的 esm 依赖经过 babel 转译，参考[这里](https://stackoverflow.com/questions/57915921/how-do-i-get-jest-to-to-work-with-es6-dependencies)和[这里](https://jestjs.io/docs/en/tutorial-react-native#transformignorepatterns-customization)。
  - 方法三：设置 alias，为 jest 提供另一份 commonjs 规范的依赖，参考[这里](https://github.com/vitejs/vite/issues/381)和[这里](https://github.com/vitejs/vite/issues/434)。

- enzyme、reacttestutils 和 react-testing-library 的区别

  https://stackoverflow.com/questions/54152562/difference-between-enzyme-reacttestutils-and-react-testing-library

- Error: Not implemented: navigation

  https://github.com/jsdom/jsdom/issues/2112
