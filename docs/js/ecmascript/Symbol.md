# Symbol

## JavaScript 的七种原始数据类型：

- undefined
- null
- 布尔值（Boolean）
- 字符串（String）
- 数值（Number）
- 对象（Object）
- Symbol

Symbol 作为第七种原始数据类型，表示独一无二的值，从根本上防止属性名的冲突。

Symbol 值可以作为对象的 key，但是不会出现在 for...in、for...of 循环中，也不会被 Object.keys()、Object.getOwnPropertyNames()、JSON.stringify()返回。可以通过 Object.getOwnPropertySymbols()访问。

## Symbol(desc?: any)

新建一个 Symbol 值，可以接受一个 desc 参数，可以用来标识这个 Symbol

```javascript
const foo = Symbol('foo');
const bar = Symbol('bar');
const anonymous = Symbol();
console.log(foo, bar, anonymous); // Symbol(foo),Symbol(bar),Symbol()
```

不过要注意，即使两个同样标识的 Symbol 值，它们也是不相等的

```javascript
const foo1 = Symbol('foo');
const foo2 = Symbol('foo');
console.log(foo1 === foo2); // false
```

## Symbol.prototype.description

读取 Symbol 值的标识

```javascript
const foo = Symbol('foo');
console.log(foo.prototype.description); // foo
```

## Symbol.for(desc: string)

和 Symbol()一样都是新建一个 Symbol 值，区别是它创建的 Symbol 值会根据 desc 参数被登记在全局环境中供搜索

```javascript
let foo1 = Symbol.for('foo');
let foo2 = Symbol.for('foo');
console.log(foo1 === foo2); // true
```

## Symbol.keyFor(sym: Symbol)

返回指定 Symbol 值的标识

```javascript
let foo1 = Symbol.for('foo');
Symbol.keyFor(foo1); // "foo"
let foo2 = Symbol('foo');
Symbol.keyFor(foo2); // undefined
```
