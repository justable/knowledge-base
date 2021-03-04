# TypeScript 几个不易理解的知识点

## 类型

### any

- 当一个变量被声明为 any 类型，ts  不会再做类型检测，就和 javascript 一样，可以随便改变数据类型。

```typescript
let anyType: any = 'string';
anyType = 1;
```

### void

- 与 any  类型相反，一般在函数没有返回值的时候用到
- 声明一个 void 类型的变量，只能赋值 undefined 和 null，所以没多大意义

```typescript
function fn(): void {}
let val: void = null;

const p: Promise<void> = Promise.resolve();
```

### never

- never 是任何类型的字类型，可以赋值给任何类型，但是没有类型可以赋值给它，除了自己 never
- 一般用与那些抛出异常，没有返回值的表达式和箭头函数的返回值类型

```typescript
function fn():never {
  hrow new Error("message");
}
```

### unknown

- TypeScript 3.0 版本引入的，认为是 top type , 是任何类型的子类型 subType
- 与 any 的区别在于，any 既是 topType，也是 buttomType，所以 any 不会对数据做类型检查,而 unkown 在使用的时候会检测数据类型
- 当一个数据为 unkown 类型，你又要使用它的使用，你使用断言或者做类型判断才能通过 ts 的类型检查，否则会编译错误

```typescript
let data: unknown = 1; //变量赋值给1 ,但是类型还是unknown

data = [2, 3, 4]; // 这里又重新赋值给数组，ts 不会报错
// let rs1 = data[0];// 这里调用的时候却是报错了，虽然值是数组，但是类型却是unkown，所以调用的时候就会报错
let rs2 = (<Array<number>>data)[0]; ////需要使用断言来重新声明类型

data = { a: 1 }; // 这里又重新赋值给对象，ts 不会报错
// data.a="string" // 这里获取a报错
(<{ a: string }>data).a = '12'; //使用断言（<>尖括号）或者（as） 关键字都可以
```

## 关键字

### keyof

### extends

### in

### is

### infer

```typescript
type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;
```

## 语法

### K extends keyof any

```typescript
type Record<K extends keyof any, T> = {
  [P in K]: T;
};
```

### T extends U ? never : T

```typescript
type Exclude<T, U> = T extends U ? never : T;
```

### value is keyof typeof DNATranscriber

```typescript
enum DNATranscriber {
  G = 'C',
  C = 'G',
  T = 'A',
  A = 'U',
}
function isValidCodon(value: string): value is keyof typeof DNATranscriber {
  return value in DNATranscriber;
}
```

### 泛型默认值

如果泛型默认值应用在类型系统上，那么在使用这个类型时可以不用指定泛型具体类型，比如像下面这样，

```typescript
// (1)
interface ExoticComponent<P> {
  (props: P): ReactElement | null;
}
let MyComp: ExoticComponent; // ide会报错
let MyComp: ExoticComponent<string>; // 需要这样
// (2)
let MyComp: ExoticComponent = (props: unknown) => null; // ide也会报错
// (3) 但如果指定了泛型默认值
interface ExoticComponent<P = string> {
  (props: P): ReactElement | null;
}
let MyComp: ExoticComponent; // ide就不会报错了
```

如果泛型默认值应用在值系统（比如函数）上，会有点不同，这也是突然让我困惑的地方，

```typescript
function myFunc<P = string>(params: P) {}
myFunc(1); // ide不会报错
function myFunc<P>(params: P) {}
myFunc(1); // ide也不会报错
```

因为是值系统，而我们调用的参数是个 number 类型，那么泛型 P 就隐式的变成了 number 类型，所以上面这个例子泛型默认值没有意义（我困惑的地方）？

再来个能体现泛型默认值在值引用场景中有作用的例子，

```typescript
// (1)
class MyClass {}
class MyGenericTypedClass<T> { // 注意这里没有指定默认值
    data: T;
}
let obj = new MyGenericTypedClass(); // 注意这里没有限定
obj.data; // ide会推断是unknown，因为T是未知的
// (2)----------------------------------------------------
class MyGenericTypedClass<T = MyClass> // 如果指定了默认值
obj.data; // ide会推断是MyClass
// (3)----------------------------------------------------
let obj = new MyGenericTypedClass<MyClass>() // 对于例(1)，我们也可以显示指定泛型类型达到同样的效果

```

总结类型系统和值系统场景来看，泛型默认值起到的是类型隐式判断的作用。对于类型系统来看，TS 的类型也是可以互相逻辑组合运算的，但没有值来触发类型隐式判断；对于值系统来看，比如一个函数，我们调用它的参数就触发了类型隐式判断，所以此时泛型默认值就没有意义了。
