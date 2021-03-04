# 如何调试 npm 模块

> 本文基于 VSCode 展开

## 概述

如果写了一个 npm 模块，想本地进行调试，可以通过 npm link 来完成，如果需要断点调试源码，可以配置 launch.json 实现。

## npm link

1. 在需要被调试的 moduleA 中执行 npm link，moduleA 就会被注册在 npm 全局目录{prefix}/lib/node_modules/中
1. 在 moduleB 中执行 npm link "moduleA"，此时就会在 moduleB 的 node_modules 下生成一个指向 moduleA 的符号链接

要注意的是，如果 moduleB 原本就依赖了 moduleA，当本地调试完毕执行 npm unlink "moduleA"后，需要重新 npm install moduleA。

## --preserve-symlinks

```powershell
{appDir}
 ├── app
 │   ├── index.js
 │   └── node_modules
 │       ├── moduleA -> {appDir}/moduleA
 │       └── moduleB
 │           ├── index.js
 │           └── package.json
 └── moduleA
     ├── index.js
     └── package.json
```

默认情况下，当 Node.js 从一个被符号连接到另一块磁盘位置的路径加载一个模块时，Node.js 会解引用该连接，**并使用模块的真实磁盘的实际路径**来定位其路径。 大多数情况下，默认行为是可接受的。 但是，当  `moduleA`  试图引入  `moduleB`  作为一个 peer dependences 时，Node.js 就无法找到 moduleB，此时需要使用该命令。

## 如何进行断点调试

这里要分几种情况，

1. 调试目标是普通的 node，直接使用 node --inspect-brk module.js 调试，vscode 的 auto attach 也很方便。
1. 调试目标是 cli 工具源码，并且源文件是使用 ts 编写的（如果没用 ts 可以跳过第一步），我们可以这样配置，先将源文件编译输出到 dist 目录，同时生成 sourcemap，

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "lib": ["ESNext"],
    "moduleResolution": "node",
    "strict": true,
    "declaration": true,
    "noUnusedLocals": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "sourceMap": true
  }
}
```

接着配置 launch.json 文件，

```json
{
  "type": "node",
  "request": "launch",
  "name": "Launch Program",
  "skipFiles": ["<node_internals>/**"],
  "runtimeExecutable": "${workspaceFolder}/bin/vite.js",
  "args": ["-h"],
  "outFiles": ["${workspaceFolder}/dist/**/*.js"]
}
```

默认会在整个工作目录查找 sourcemap 文件，也可以指定 outFiles 缩小范围，之后就可以在源文件打断点调试了。
