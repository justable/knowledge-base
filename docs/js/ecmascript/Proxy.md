# Proxy

## 构造器

- const proxy = new Proxy(target, handler: ProxyHandler)

target 可以是任何类型的对象，包括原生数组，函数，甚至另一个代理；handler 是一个对象，其属性是当执行一个操作时定义代理的行为的函数。

### handler

详情请见[原文](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler)

下面的 target 指代理对象

- getPrototypeOf(target): object || null

在读取代理对象的原型时触发，比如 Object.getPrototypeOf(proxy)等

- setPrototypeOf(target, prototype): boolean

在设置代理对象的原型时触发，比如 Object.setPrototypeOf(proxy, null)

- isExtensible(target): boolean

在判断一个代理对象是否是可扩展时触发，比如 Object.isExtensible(proxy)

- preventExtensions(target): boolean

在让一个代理对象不可扩展时触发，比如 Object.preventExtensions(proxy)

- getOwnPropertyDescriptor(target, prop): object || undefined

在获取代理对象某个属性的属性描述时触发，比如 Object.getOwnPropertyDescriptor(proxy, "foo")

- defineProperty(target, property, descriptor): boolean

在定义代理对象某个属性时的属性描述时触发，比如 Object.defineProperty(proxy, "foo", {})

- has(target, prop): boolean

在判断代理对象是否拥有某个属性时触发，比如"foo" in proxy

- get(target, property, receiver: Proxy): any

在读取代理对象的某个属性时触发，比如 proxy.foo，注意 Map、Set、WeakMap、WeakSet 的 api 都会触发 get，但数组的不会

- set(target, property, value, receiver: Proxy): boolean

在给代理对象的某个属性赋值时触发，比如 proxy.foo = 1，给数组赋值也会触发，比如 proxy[0]=1、proxy.push(1)，key 等于数组的下标，注意 proxy.push 会先触发 get，且 key=push

- deleteProperty(target, property): boolean

在删除代理对象的某个属性时触发，即使用 delete 运算符，比如 delete proxy.foo

- handler.ownKeys(target): object

比如 Object.getOwnPropertyNames 和 Object.getOwnPropertySymbols

- handler.apply(target, context, argumentsList): any

函数调用时触发，比如 func()、func.call()和 func.apply()

- handler.construct(target, argumentsList, newTarget: Proxy): object

new 运算符时触发

## 创建可撤销的代理对象

- const revocableProxy: { proxy, revoke: Function } = Proxy.revocable(target, handler)

revoke 是撤销方法，调用的时候不需要加任何参数，就可以撤销掉和它一起生成的那个代理对象。

例子

```javascript
var revocable = Proxy.revocable(
  {},
  {
    get(target, name) {
      return '[[' + name + ']]';
    },
  },
);
var proxy = revocable.proxy;
proxy.foo; // "[[foo]]"
revocable.revoke();
console.log(proxy.foo); // 抛出 TypeError
proxy.foo = 1; // 还是 TypeError
delete proxy.foo; // 又是 TypeError
typeof proxy; // "object"，因为 typeof 不属于可代理操作
```

## 思考

### 思考一

Proxy 只能创建一层代理，如何实现嵌套代理，比如下例

```javascript
const obj = { a: { b: 1 }, b: 1 };
const observed = new Proxy(obj, {
  get(target, prop, receiver) {
    return typeof target[prop] === 'number' ? target[prop] + 1 : target[prop];
  },
});
observed.a.b; // 怎么才能输出2
```
