# Jest 源码整理

## 核心节点代码片段梳理

以下代码按照顺序排列，删除了很多，作为节点梳理，便于源码阅读。

一切从`jest --command`开始

```javascript
// jest-cli/bin/jest.js
#!/usr/bin/env node
require("jest-cli/cli").run();
```

```typescript
// jest-cli/src/cli/index.ts
import { runCLI } from 'jest-core';
async function run(maybeArgv, project) {
  await runCLI(argv, projects);
}
```

```typescript
// jest-core/src/jest.ts
// 向外暴露runCli接口
export { runCLI } from './cli';
```

```typescript
// jest-core/cli/index.ts
import runJest from '../runJest';
async function runCLI(argv, projects) {
  _run();
}
async function _run() {
  runWithoutWatch();
}
async function runWithoutWatch() {
  runJest();
}
```

```typescript
// jest-core/src/runJest.ts
await new TestScheduler(
  globalConfig,
  { startRun },
  testSchedulerContext,
).scheduleTests(allTests, testWatcher);
```

```typescript
// jest-core/src/TestScheduler.ts
class TestScheduler {
  async scheduleTests() {
    const testRunners = Object.create(null);
    contexts.forEach(({ config }) => {
      // 注册runner
      if (!testRunners[config.runner]) {
        const Runner: typeof TestRunner = require(config.runner);
        testRunners[config.runner] = new Runner(this._globalConfig, {
          changedFiles: this._context && this._context.changedFiles,
        });
      }
    });
    const testsByRunner = this._partitionTests(testRunners, tests);
    if (testsByRunner) {
      for (const runner of Object.keys(testRunners)) {
        // 执行runner，默认的runner实现在jest-runner包中
        await testRunners[runner].runTests(
          testsByRunner[runner],
          watcher,
          onStart,
          onResult,
          onFailure,
          {
            serial: runInBand || Boolean(testRunners[runner].isSerial),
          },
        );
      }
    }
  }
}
```

```typescript
// jest-runner/src/index.ts
class TestRunner {
  async runTests() {
    this._createInBandTestRun();
  }
  async _createInBandTestRun() {
    runTest();
  }
}
```

```typescript
// jest-runner/src/runTest.ts
import sourcemapSupport = require('source-map-support');
async function runTest() {
  await runTestInternal();
}
async function runTestInternal() {
  // 获取测试文件代码
  const testSource = fs.readFileSync(path, 'utf8');
  // 获取配置文件的testEnvironment参数
  let testEnvironment = config.testEnvironment;
  // jest-environment-jsdom/jest-environment-node包中
  const TestEnvironment = interopRequireDefault(require(testEnvironment))
    .default;
  const environment = new TestEnvironment(config, {
    console: testConsole,
    docblockPragmas,
    testPath: path,
  });
  // 代码缓存
  const cacheFS = { [path]: testSource };
  // 所有代码加载到runtime实例中，runtime实现在jest-runtime包中
  const runtime = new Runtime(environment, cacheFS);
  // 开始执行runtime实例中的代码
  config.setupFiles.forEach(path => runtime.requireModule(path));
  // 通过 source-map-support 包输出错误栈
  sourcemapSupport.install(sourcemapOptions);
  // 向global注入describe、expect等全局方法，实现在jest-jasmine2包中
  await testFramework(globalConfig, config, environment, runtime, path);
}
```

```typescript
// jest-runtime/src/index.ts
import { Script, compileFunction } from 'vm';
class Runtime {
  constructor(
    config,
    // jsdom或node
    environment,
    resolver,
    cacheFS,
    coverageOptions,
  ) {
    this._environment = environment;
  }
  requireModule() {
    this._loadModule();
  }
  _loadModule() {
    this._execModule();
  }
  // 执行单测文件的地方
  _execModule() {
    // 调用vm模块的compileFunction创建函数执行沙盒环境
    // transformedFile是通过babel-jest或其他转译引擎（根据配置文件的transform参数）转译后的代码
    let compiledFunction;
    if (typeof this._environment.getVmContext === 'function') {
      compiledFunction = compileFunction(
        transformedFile.code,
        this.constructInjectedModuleParameters(),
        {
          filename,
          parsingContext: vmContext,
        },
      );
    } else {
      const script = this.createScriptFromCode(transformedFile.code, filename);
      const runScript = this._environment.runScript(script);
      // EVAL_RESULT_VARIABLE = "Object.<anonymous>"
      compiledFunction = runScript[EVAL_RESULT_VARIABLE];
    }

    // 最终执行单测代码
    compiledFunction.call(
      localModule.exports,
      localModule as NodeModule, // module object
      localModule.exports, // module exports
      localModule.require as typeof require, // require implementation
      dirname, // __dirname
      filename, // __filename
      this._environment.global, // global object
      this._createJestObjectFor(), // jest object
      ...this._config.extraGlobals.map(() => {}),
    );
  }
  createScriptFromCode(scriptSource, filename) {
    try {
      return new Script(this.wrapCodeInModuleWrapper(scriptSource), {
        displayErrors: true,
        filename: this._resolver.isCoreModule(filename)
          ? `jest-nodejs-core-${filename}`
          : filename,
      });
    } catch (e) {
      throw handlePotentialSyntaxError(e);
    }
  }
  // 包裹函数
  wrapCodeInModuleWrapper(content: string) {
    const args = this.constructInjectedModuleParameters();
    return (
      '({"' +
      EVAL_RESULT_VARIABLE +
      `":function(${args.join(',')}){` +
      content +
      '\n}});'
    );
  }
}
```

```typescript
// jest-jasmine2/src/index.ts
// 向global注入describe、expect等全局方法
async function jasmine2(globalConfig, config, environment, runtime, testPath) {
  environment.global.test = environment.global.it;
  environment.global.it.only = environment.global.fit;
  environment.global.it.todo = env.todo;
  environment.global.it.skip = environment.global.xit;
  environment.global.xtest = environment.global.xit;
  environment.global.describe.skip = environment.global.xdescribe;
  environment.global.describe.only = environment.global.fdescribe;
}
```

## 验证单测文件是在函数沙箱环境执行的

我们可以直接在单测文件的 top level 访问 arguments，arguments.callee 等函数作用域中独有的变量。

![jest_arguments.png](@images/1608173058468-98fbab85-fa50-42b4-a764-fc2f1c7eb457.png)

## Jest 是在什么时候注入 document 对象的

Jest 会读取配置文件中的 testEnvironment 参数，默认是 jsdom，还可以是 node。

> 当`testEnvironment=jsdom`时，Jest 会使用 jsdom 创建浏览器环境作为 global 对象，并传入沙盒函数，所以在单测文件中访问的 global 不是 node 的 全局变量 global 对象；

当> `testEnvironment=node`时，Jest 会直接修改 node 的 全局变量 global 对象。

下述代码自行连接上“核心节点代码片段梳理”理解。

```typescript
// jest-environment-jsdom/src/index.ts
import { JSDOM } from 'jsdom';
class JSDOMEnvironment implements JestEnvironment {
  constructor(config, options = {}) {
    this.dom = new JSDOM('<!DOCTYPE html>', {
      pretendToBeVisual: true,
      runScripts: 'dangerously',
      url: config.testURL,
      virtualConsole: new VirtualConsole().sendTo(options.console || console),
      ...config.testEnvironmentOptions,
    });
    // 使用jsdom创建的浏览器环境作为global对象
    const global = (this.global = this.dom.window.document.defaultView);
    // 这里会把配置文件的globals参数merge进去
    installCommonGlobals(global, config.globals);
  }
}
```

```typescript
// jest-runner/src/runTest.ts
// 以testEnvironment=jsdom为例
const TestEnvironment = interopRequireDefault(require(testEnvironment)).default;
// 得到的TestEnvironment就是class JSDOMEnvironment
const environment = new TestEnvironment(config, {
  console: testConsole,
  docblockPragmas,
  testPath: path,
});
// 此时environment已经拥有了浏览器环境global
setGlobal(environment.global, 'console', testConsole);
// 把environment对象交给runtime对象
const runtime = new Runtime(environment, cacheFS);
// 此时runtime对象已经拥有了浏览器环境global，而runtime是最终执行单测文件的地方
```

## Jest 是如何支持单测代码语法转译的

Jest 会在加载单测文件时对文件进行转译，转译调度器在 jest-transform 包中，它会读取配置文件的 transform 参数作为转译引擎。

下述代码自行连接上“核心节点代码片段梳理”理解。

```typescript
// jest-runtime/src/index.ts
import { ScriptTransformer } from '@jest/transform';
class Runtime {
  constructor() {
    // 这是Jest的转译模块，它会根据配置文件的transform参数定制
    this._scriptTransformer = new ScriptTransformer(config);
  }
  _execModule() {
    // 在执行单测文件前会先进行转译工作
    const transformedFile = this._scriptTransformer.transform(
      filename,
      this._getFullTransformationOptions(options),
      this._cacheFS[filename],
    );
  }
}
```

```typescript
// jest-transfrom/src/ScriptTransformer.ts
import { fromSource as sourcemapFromSource } from 'convert-source-map';
class ScriptTransformer {
  transform(filename, options, fileSource) {
    return this._transformAndBuildScript();
  }
  _transformAndBuildScript(filename, options, instrument, fileSource) {
    const { code, mapCoverage, sourceMapPath } = this.transformSource();
    return {
      code,
      mapCoverage,
      originalCode: content,
      sourceMapPath,
    };
  }
  // Jest每次在转译源码时都会先从cache中判断是否已存在，如果存在直接返回，不存在才会重新转译
  transformSource(filepath, content, instrument) {
    // 即使没有配置transform参数，也会使用babel-jest作为默认转译引擎
    const transform = this._getTransformer(filename);
    const cacheFilePath = this._getFileCachePath(filename, content, instrument);
    // 如果当前文件是ignore的文件则为false
    const shouldCallTransform = transform && this.shouldTransform(filename);
    let sourceMapPath = cacheFilePath + '.map';
    let code = this._config.cache ? readCodeCacheFile(cacheFilePath) : null;
    // 缓存中有代码就直接返回
    if (code) {
      return {};
    }
    let transformed = {
      code: content,
      map: null,
    };
    if (transform && shouldCallTransform) {
      // 不出意外都会进入
      // 开始转译
      const processed = transform.process(content, filename, this._config, {
        instrument,
      });
      if (typeof processed === 'string') {
        transformed.code = processed;
      } else if (processed != null && typeof processed.code === 'string') {
        // 通常会走这里
        transformed = processed;
      } else {
        throw new TypeError(
          "Jest: a transform's `process` function must return a string, " +
            'or an object with `code` key containing this string.',
        );
      }
    }
    if (!transformed.map) {
      // 通常不会走这里
      try {
        // 通过convert-source-map获取内联在代码中的sourcemap，如果没有找到会返回null
        const inlineSourceMap = sourcemapFromSource(transformed.code);
        if (inlineSourceMap) {
          transformed.map = inlineSourceMap.toJSON();
        }
      } catch (e) {
        const transformPath = this._getTransformPath(filename);
        console.warn(
          `jest-transform: The source map produced for the file ${filename} ` +
            `by ${transformPath} was invalid. Proceeding without source ` +
            'mapping for that file.',
        );
      }
    }
    if (!transformWillInstrument && instrument) {
      code = this._instrumentFile(filename, transformed.code);
    } else {
      // 经过babel-jest转译的代码会有内联sourcemap
      code = transformed.code;
    }
    if (transformed.map) {
      const sourceMapContent =
        typeof transformed.map === 'string'
          ? transformed.map
          : JSON.stringify(transformed.map);
      // 输出sourcemap到指定文件
      writeCacheFile(sourceMapPath, sourceMapContent);
    } else {
      sourceMapPath = null;
    }
    // 输出转译后的代码存储到cache中
    writeCodeCacheFile(cacheFilePath, code);
    return {
      code,
      mapCoverage,
      originalCode: content,
      sourceMapPath,
    };
  }
}
```

## Jest 是如何解决动态代码调试问题的

如果要调试一段已经过语法转译的代码，或者经过再包装的动态代码（即使没有经过语法转译），都是需要借助 sourcemap 把源码和运行时代码联系起来的，比如源码的哪一行对应运行时代码的哪一行，源码的变量名对应运行时代码的变量名等。

Jest 对于 sourcemap 的处理在上一段落“Jest 是如何支持单测代码语法转译的”已经有过讲解，这里再做一个小结：

首先根据配置文件的 transform 参数读取当前单测文件所对应的转译器，没有配置 transform 时会使用默认的 babel-jest。接着判断缓存中是否存在当前单测文件，如果已经存在了就不再转译了，如果不存在则转译源码，可以获得转译后的代码和 sourcemap，最终把转译后的代码和 sourcemap 备份起来，其中转译后的代码会通过 node 的 vm 模块创建的沙箱环境运行。

## Jest 是如何输出错误栈的

Jest 是通过 source-map-support 包输出错误栈的。效果如下，具体实现就不展开了：

![jest_error_stack.png](@images/1608173068069-f56fd68c-c59e-412f-b1db-22e0b7590420.png)
