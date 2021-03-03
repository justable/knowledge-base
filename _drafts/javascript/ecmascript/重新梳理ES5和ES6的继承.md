# 重新梳理 ES5 和 ES6 的继承

<a id="e4568847"></a>

## 引言

在看一段源码时，竟然看懵了，决定完整梳理下 ES5 和 ES6 的继承知识。

源码结构是这样的：

```javascript
class Foo extends Function {
  constructor(params) {
    super();
    this.params = params;
    return new Proxy(this, {
      apply: (target, thisArg, args) => target.handle(),
    });
  }
  handle() {
    console.log(this.params);
  }
}
const foo = new Foo('hello');
foo(); // hello
```

我就惊了个呆。

**为了便于表述，后文统一称呼 class 式继承为 ES6 继承，prototype 式继承为 ES5 继承。**

<a id="e1fdfb20"></a>

## 脑子卡壳的地方

我惊呆了必然是由于对某个基础知识没有完全理顺，我希望自己能从基础知识出发，自然而然的理解这段代码，而不是从代码的最终效果反推一些原理特性。因此本文重新梳理一下 ES5 和 ES6 的继承。关于原型链就不梳理了，它在我脑中已经梳理的不能再顺了 😂。

说出这段源码的目的并不难，只要一运行看下效果就知道了，效果是使得所有的 Foo 实例是 Callable 的，并且调用时会执行 handle 方法。

但是 Foo 的实例 foo 为什么是个函数，就因为继承了 Function？我接着使用 ES5 的“寄生组合式继承”方式[实现了一遍](#df08f0d4)上述代码，发现运行结果不同。

<a id="a7080042"></a>

## ES5 的几种继承方式

**JS 中的所有 function 都继承自 Function，所以`customFunc.__proto__ === Function.prototype`，但基于 class 的 ES6 继承则不同，**[**后文**](#0376074c)**会说明。**

继承要达到两点：

1. 父类的实例属性被继承
1. 父类的原型方法被继承

首先定义一个父类：

```javascript
function Person(name) {
  this.sign = 'Person';
  this.name = name;
}
Person.prototype.logName = function() {
  console.log(`(${this.sign})名字: ${this.name}`);
};
```

<a id="37483c19"></a>

### 借用构造函数继承

```javascript
function Singer(name, debut) {
  Person.call(this, name);
  this.sign = 'Singer';
  this.debut = debut;
}
Singer.prototype.logDebut = function() {
  console.log(`(${this.sign})出道年份: ${this.debut}`);
};

const jay = new Singer('Jay', 2000);
jay.logDebut(); // (Singer)出道年份: 2000
jay.logName(); // jay.logName is not a function
```

缺点：没有继承父类的原型方法

<a id="5aa5c705"></a>

### 原型链继承

```javascript
function Singer(name, debut) {
  this.sign = 'Singer';
  this.name = name; // 需要增加这一行
  this.debut = debut;
}
Singer.prototype = new Person();
Singer.prototype.constuctor = Singer;
Singer.prototype.logDebut = function() {
  console.log(`(${this.sign})出道年份: ${this.debut}`);
};

const jay = new Singer('Jay', 2000);
jay.logDebut(); // (Singer)出道年份: 2000
jay.logName(); // (Singer)名字: Jay
```

缺点：无法自动继承父类的实例属性，得在子类中手动重新定义一遍，并且子类的原型会出现父类的实例属性

<a id="511d63d3"></a>

### 组合继承

```javascript
function Singer(name, debut) {
  Person.call(this, name);
  this.sign = 'Singer';
  this.debut = debut;
}
Singer.prototype = new Person();
Singer.prototype.constuctor = Singer;
Singer.prototype.logDebut = function() {
  console.log(`(${this.sign})出道年份: ${this.debut}`);
};

const jay = new Singer('Jay', 2000);
jay.logDebut(); // (Singer)出道年份: 2000
jay.logName(); // (Singer)名字: Jay
```

缺点：没有完全解决“原型链继承”的问题，子类的原型会出现父类的实例属性

![inherit_1.png](@images/1598322102403-3a70f797-b5d7-4ddf-a51c-5f67f38e2081.png)

<a id="df08f0d4"></a>

### 寄生组合式继承

```javascript
function Singer(name, debut) {
  Person.call(this, name);
  this.sign = 'Singer';
  this.debut = debut;
}
Singer.prototype = Object.create(Person.prototype);
Singer.prototype.constuctor = Singer;
Singer.prototype.logDebut = function() {
  console.log(`(${this.sign})出道年份: ${this.debut}`);
};

const jay = new Singer('Jay', 2000);
jay.logDebut(); // (Singer)出道年份: 2000
jay.logName(); // (Singer)名字: Jay
```

解决了上述问题，此方法也是 ES5 中比较成熟的继承方式

![inherit_2.png](@images/1598322132077-7a1c4bcc-e537-40dd-bc09-0636528d4533.png)

<a id="0376074c"></a>

## ES6 的继承方式

```javascript
class Person {
  sign = 'Person';
  constructor(name) {
    this.name = name;
  }
  logName() {
    console.log(`(${this.sign})名字: ${this.name}`);
  }
}
class Singer extends Person {
  sign = 'Singer';
  constructor(name, debut) {
    super(name);
    this.debut = debut;
  }
  logDebut() {
    console.log(`(${this.sign})出道年份: ${this.debut}`);
  }
}

const jay = new Singer('Jay', 2000);
jay.logDebut(); // (Singer)出道年份: 2000
jay.logName(); // (Singer)名字: Jay
```

![inherit_3.png](@images/1598322139556-9b3ab19b-b638-45a4-99d8-8026c31719ba.png)

ES6 继承中的 class 不同于 Java 的 class，它只是一个语法糖，本质依然是基于 prototype 的，但比 ES5 继承更直观和简洁，并且只能通过 new 关键字创建。

<a id="3d71812a"></a>

## ES6 继承与 ES5 继承的核心差异

在 ES5 继承中，会优先创建子类的实例对象 this，再通过`Person.call(this)`将父类构造函数中的实例属性附加到这个 this 上；

在 ES6 继承中，会通过`super()`追溯到最顶层的构造函数，优先创建顶层的实例对象 this，再通过子类的构造函数修改这个 this。

除了 this 的不同，还有个不能忽视的区别，ES6 继承中，子类的`__proto__`将指向父类`Person`，而不是`Function.prototype`。

```javascript
// 寄生组合事继承
console.log(Singer.__proto__ === Function.prototype); // true
// ES6 继承
console.log(Singer.__proto__ === Person); // true
```

<a id="1bed3aef"></a>

## 回到最初的例子

最开始的例子，如果用 ES5 继承如何实现？

我的第一直觉是这么写的：

```javascript
function Foo(params) {
  Function.call(this);
  this.params = params;
  return new Proxy(this, {
    apply: (target, thisArg, args) => target.handle(),
  });
}
Foo.prototype = Object.create(Function.prototype);
Foo.prototype.constructor = Foo;
Foo.prorotype.handle = function() {
  console.log(this.params);
};

const foo = new Foo('hello');
foo(); // foo is not a function
```

咋一看没什么问题，但是运行出错了，原因正是 ES5 继承和 ES6 继承的 this 创建时机不同导致，ES5 继承的 this 是在 Foo 的构造函数中创建的，最终是个对象；ES6 继承的 this 是在顶层 Function 的构造函数中创建的，最终是个函数。
