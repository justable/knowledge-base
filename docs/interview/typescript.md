---
title: TypeScript
order: 1
---

## 怎么定义一个 class

方法一：

```ts
class File {
  static read(arg: string): void {}
  constructor(arg: string): void {}
  save(arg: string): void {}
}
```

方法二：

```ts
interface File {
  save(arg: string): void;
}

interface FileConstructor {
  readonly prototype: File;
  new (arg: string): void;
  read(arg: string): void;
}

type StaticRead = FileConstructor['read'];
type FileInstance = FileConstructor['prototype'];
type Save = FileInstance['save'];
```

方法三：

```ts
interface File {
  save(arg: string): void;
}

interface FileConstructor {
  new (arg: string): File;
  read(arg: string): void;
}

type StaticRead = FileConstructor['read'];
type FileInstance = InstanceType<FileConstructor>;
type Save = FileInstance['save'];
```

## 类型推导和类型约束的区别

```ts
// 报错
function sum1(x: number, y: number): void {
  return x + y;
}
```

对函数进行了显式的类型约束，函数返回类型是 void。

```ts
// 不报错
let sum2: (x: number, y: number) => void = function(x, y) {
  return x + y;
};
```

没有对匿名函数进行类型约束，当匿名函数赋值给 sum2 变量时进行类型推导此函数的返回类型是 number。同时对 sum2 变量进行类型约束，sum2 函数的结果是 void 不应该再被使用。
