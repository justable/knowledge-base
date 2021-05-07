# lerna 使用总结

## 初识

> 建议使用 npm

lerna 是用来管理 monorepos 项目的。当一个源码库包含多个模块，你可以为每个模块创建一个单独的项目，也可以将所有模块以子 Package 的形式放在同一个项目中，后者就称为 monorepos。

管理 monorepos 主要有两种方式：

1. 使用 Lerna（主要针对 NPM）
1. 使用 Yarn 的 workspace

本文主要讲述 Lerna 的使用方法，Yarn 的 workspace 使用方法可以参考[这里](https://yarn.bootcss.com/docs/cli/workspace/)。

要注意的是，Lerna 会把多个 Package 中的共同依赖提升到项目的顶层 node_modules 中，根据 Node 的 Module resolution，所以 Package 可以引入已被提升但非当前包的依赖项，这在 monorepos 项目中没有问题，但如果未来把这个 Package 独立成单独的项目是就会找不到对应的依赖项，注意事项可以参考[这里](https://github.com/lerna/lerna/blob/master/doc/hoist.md)。

## 命令

- lerna init/npx lerna init
  - --independent：每个 package 的版本是独立的，lerna.json 的 version 设为 independent。
  - --exact(default)：每个 package 的版本统一，取 lerna.json 的 version。

初始化 lerna 项目。

- lerna create
  - --private 创建私有 package
  - --yes 跳过所有提示选项

创建新的 package。

例：`lerna create root-config`

- lerna add
  - --scope
  - --dev
  - --peer
  - --exact
  - --registry
  - --no-bootstrap

为 packages 添加依赖，可以是外部依赖，也可以是另一个 package。

例：`lerna add single-spa-layout --scope=root-config --dev`

- lerna link

符号链接所有互相依赖的 packages。

- lerna bootstrap
  1.  安装所有 packages 的依赖
  1.  符号链接 packages 之间的互相依赖
  1.  在每个 package 中执行`npm run prepublish`
  1.  在每个 package 中执行`npm run prepare`
- lerna list
  - --all 显示`private: true`的项目

查看所有的 packages。

- lerna changed

列出所有改动过的 packages。

- lerna diff

对比 package 与上次 release 的变化。

例：lerna diff root-config

- lerna version

查看版本。

- lerna exec
  - --scope

对每个 package 执行命令。

例：`lerna exec --scope root-config -- ls`

- lerna run
  - --scope
  - --stream 在 terminal 中输出子进程信息

执行每个 package 中的 script。

例：`lerna run --scope root-config start`

- lerna clean

移除每个 package 的 node_modules 目录。

- lerna import

导入外部项目到当前的 lerna 项目中。

例：`lerna import ~/Product`

- lerna info

查看本机的开发环境信息。

## 步骤

1. mkdir single-spa && cd single-spa
1. lerna init
1. lerna create root-config
1. 为 package 安装依赖
   - lerna add
   - 或定义 package.json 然后 lerna bootstrap
   - 或 lerna exec --scope root-config -- npx create-single-spa --moduleType root-config 初始化项目
1. 编写代码

[https://github.com/lerna/lerna](https://github.com/lerna/lerna)
