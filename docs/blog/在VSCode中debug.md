# 在 VSCode 中 debug

> [参考一](https://code.visualstudio.com/docs/nodejs/nodejs-debugging) [参考二](https://code.visualstudio.com/docs/editor/variables-reference)

## 两种调试模式

根据 NodeJS 的[调试模型](../basic/nodejs/debug.md#调试模型)，调试由调试进程和调试客户端组成，VSCode 就是一个调试客户端。

### Launch

该种模式下，VSCode 会启动自身的调试模块，同时开启 NodeJS 的调试进程，并把两者关联起来。

### Attach

该种模式下，VSCode 会启动自身的调试模块，并把它与已启动的 NodeJS 的调试进程关联起来，这种模式需要提供 processId。

## 配置参数

VSCode 的调试模块会读取.vscode 文件夹下的 launch.json 作为配置文件。

### 通用配置

可以在 Launch 和 Attach 两种调试模式下使用。
::: details 通用配置

```ts
interface common {
  // 环境类型，比如node
  type: string;
  // debug方式
  request: 'launch' | 'attach';
  // 给debugger取个名字
  name: string;
  // 遵循协议
  protocol: 'auto' | 'inspector' | 'legacy';
  // debug port
  port: number;
  // TCP/IP address of the debug port
  address: string;
  // enable source maps by setting this to true
  sourceMaps: boolean;
  // array of glob patterns for locating generated JavaScript files
  outFiles: array;
  // restart session on termination
  restart: boolean;
  // when restarting a session, give up after this number of milliseconds
  timeout: number;
  // 断点会停在第一行，break immediately when the program launches
  stopOnEntry: boolean;
  // VS Code's root directory
  localRoot: string;
  // Node's root directory
  remoteRoot: string;
  // try to automatically step over code that doesn't map to source files
  smartStep: boolean;
  // automatically skip files covered by these glob patterns
  skipFiles: array;
  // enable diagnostic output
  trace: boolean;
}
```

:::

### Launch 配置

只能在 Launch 模式下使用

```ts
interface launch {
  // an absolute path to the Node.js program to debug
  program: string;
  // arguments passed to the program to debug
  args: array;
  // launch the program to debug in this directory
  cwd: '${workspaceFolder}';
  // absolute path to the runtime executable to be used. Default is node
  runtimeExecutable: 'node' | 'npm' | string;
  // optional arguments passed to the runtime executable
  runtimeArgs: string;
  // select a specific version of Node.js
  runtimeVersion: string;
  // This attribute expects environment variables as a list of string typed key/value pairs
  env: {};
  // optional path to a file containing environment variable definitions
  envFile: '${workspaceFolder}/.env';
  // kind of console to launch the program
  console: 'internalConsole' | 'integratedTerminal' | 'externalTerminal';
  // This is useful for programs or log libraries that write directly to the stdout/stderr streams instead of using console.* APIs
  outputCapture: string;
  autoAttachChildProcesses: boolean;
  // 在lanuch前执行指定任务
  preLaunchTask: string;
}
```

对于上面的 runtimeExecutable、runtimeArgs、program、args 做个说明。

这几个参数最终会被组合成${runtimeExecutable}${runtimeArgs}${program}${args}，比如有如下配置，

```json
{
  "type": "node",
  "request": "launch",
  "name": "Launch Program",
  "runtimeExecutable": "${workspaceFolder}/node_modules/vite/bin/vite",
  "program": "${workspaceFolder}/main.js",
  "runtimeArgs": ["-h"]
}
```

那么实际执行的是 vite -h main.js。

### Attach 配置

只能在 Attach 模式下使用

```ts
interface attach {
  // the debugger tries to attach to this process after having sent a USR1 signal, conflict with port
  processId: string;
}
```

## 实际案例

假如要调试 app.js 文件，下面几个 launch.json 都可以达到同样的效果。

### 例子一

node app.js

```json
{
  "type": "node",
  "request": "launch",
  "name": "Launch Program",
  "program": "${workspaceFolder}/app.js"
}
```

### 例子二

npm run-script debug

```json
{
  "type": "node",
  "request": "launch",
  "name": "Launch via NPM",
  "runtimeExecutable": "npm", // or yarn
  "runtimeArgs": ["run-script", "debug"],
  "port": 9229
}
```

```json
{
  "debug": "node --inspect-brk ./app.js"
}
```

### 例子三

node app.js

```json
{
  "type": "node",
  "request": "launch",
  "name": "Launch via args",
  "runtimeExecutable": "node",
  "args": ["${workspaceFolder}/app.js"]
}
```

### 例子四

node app.ts

这是个在 TypeScirpt 场景下的案例，手动执行`npm run tsc_build`

```json
{
  "type": "node",
  "request": "launch",
  "name": "Launch outFiles",
  "program": "app.ts",
  "outFiles": ["${workspaceFolder}/bin/**/*.js"]
}
```

```json
{
  "tsc_build": "tsc --sourceMap --outDir bin app.ts"
}
```

### 例子五

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach via processId",
  "processId": "${command:PickProcess}"
}
```

## 自动调试

⌘⇧+P 输入 Toggle Auto Attach 开启自动调试模式，然后在 VS Code 的 Integrated Terminal 中执行 `node --inspect-brk xxx.js`即可。

## Source maps

VSCode 默认会开启 sourcemaps。如果编译后的文件不在同级目录，则需要设置 outFiles 告知 VSCode 的调试模块编译后的文件在哪。

```json
{
  "type": "node",
  "request": "launch",
  "name": "Launch TypeScript",
  "program": "app.ts",
  "outFiles": ["${workspaceFolder}/bin/**/*.js"]
}
```

## 占位符

- \${workspaceFolder} - the path of the folder opened in VS Code
- \${workspaceFolderBasename} - the name of the folder opened in VS Code without any slashes (/)
- \${file} - the current opened file
- \${relativeFile} - the current opened file relative to workspaceFolder
- \${fileBasename} - the current opened file's basename
- \${fileBasenameNoExtension} - the current opened file's basename with no file extension
- \${fileDirname} - the current opened file's dirname
- \${fileExtname} - the current opened file's extension
- \${cwd} - the task runner's current working directory on startup
- \${lineNumber} - the current selected line number in the active file
- \${selectedText} - the current selected text in the active file
- \${execPath} - the path to the running VS Code executable
- \${env:Name} - environment variables
- \${config:Name} - configuration variables
- \${command:commandID} - command variables
- \${input:variableID} - input variables
