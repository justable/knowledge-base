# 在 VSCode 中从单元测试调试 React 源码

我把 React 项目 clone 到了本地，并从它的单元测试为入口调试 React 源码，本文就是记录下这过程。

配置 launch.json：

```json
{
  "version": "0.1.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Entry",
      "program": "${workspaceRoot}/node_modules/.bin/jest",
      "args": [
        "${file}",
        "--config",
        "./scripts/jest/config.source.js",
        "--runInBand"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

根据以上配置，VSCode 会调试当前打开的文件，然后我在测试用例中打断点，这一切都很顺利。

![](@images/react_debug_1.jpg)

但是当我继续把断点打到/packages/react/src/ReactElement.js 中时，VSCode 无法准确进入断点。

![](@images/react_debug_2.jpg)

个人猜测 Jest 是使用 Babel 来 transform 源码的（/scripts/jest/preprocessor.js），缺少 sourceMap 导致 VSCode 无法把断点映射到源码处。

果然在 scripts/jest/preprocessor.js 的 babel 配置中添加 sourceMaps: 'both'或者 sourceMaps: 'inline'就好了。
