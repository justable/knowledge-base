---
title: Coding
order: 6
---

## 题目一

实现 sum 函数，使下面计算成立：

```js
sum(1, 2, 3).valueOf(); // 6
sum(2, 3)(2).valueOf(); // 7
sum(1)(2)(3)(4).valueOf(); // 10
sum(2)(4, 1)(2).valueOf(); // 9
sum(1)(2)(3)(4)(5)(6).valueOf(); // 21
```

实现：

```js
function sum(...args) {
  const f = (...nextArgs) => sum(...args, ...nextArgs);
  f.valueOf = () => args.reduce((a, b) => a + b, 0);
  return f;
}
```
