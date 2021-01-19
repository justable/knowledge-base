---
title: General
---

## 如何进行代码质量检测

圈复杂度(Cyclomatic complexity)描写了代码的复杂度，可以理解为覆盖代码所有场景所需要的最少测试用例数量。CC 越高代码越不好维护。

## peerDependency 是为了解决什么问题

## optionalDependencies 的使用场景是什么

当一个包是可依赖可不依赖时，可采用 optionalDependencies，但需要在代码中做好异常处理。

```json
{
  "optionalDependencies": {
    "fsevents": "~2.1.2"
  }
}
```

```js
let fsevents;
try {
  fsevents = require('fsevents');
} catch (error) {
  if (process.env.CHOKIDAR_PRINT_FSEVENTS_REQUIRE_ERROR) console.error(error);
}
```

## 谈谈 semver（语义化版本号）
