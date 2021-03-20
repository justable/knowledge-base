# 常用 NPM 包索引

## iconv-lite

转换编码

```js
var iconv = require('iconv-lite');
function readGBKText(pathname) {
  var bin = fs.readFileSync(pathname);
  return iconv.decode(bin, 'gbk');
}
```

## minimist

解析命令参数

```js
var argv = require('minimist')(process.argv.slice(2));
console.log(argv);
```

## meow & arg

可以用于基本的参数解析

## commander & yargs

可以用来比较复杂的参数解析，并支持子命令

## inquirer & enquirer & prompts

用于处理复杂的输入提示

## email-prompt

可方便地提示邮箱输入

## chalk & kleur

可用于彩色输出

## ora

是一个好看的加载提示

## boxen

可以用于在你的输出外加上边框

## listr

可以展示进程列表

## convert-source-map

能够生成 sourcemap 或还原 sourcemap 成代码

## source-map-support

使用 sourcemap 时，如果报错会提供错误跟踪栈 stack traces，通常是显示 10 行

## jsdom

在 node 中可以使用 dom api

## chokidar

监听文件变更

## puppeteer

Puppeteer is a Node library which provides a high-level API to control Chrome or Chromium over the DevTools Protocol.

## markdown-it

Markdown parser done right. Fast and easy to extend.

## esbuild

This is a JavaScript bundler and minifier.

## es-module-lexer

A JS module syntax lexer used in es-module-shims.
