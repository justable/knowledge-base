# 数字字面量调用 Number 对象方法异常

## 问题描述

```javascript
// (1) Uncaught SyntaxError: Invalid or unexpected token
1.toFixed(2);
// (2) 1.00
var num = 1;
num.toFixed(2);
// (3) 1.00
1..toFixed(2);
```

在 JS 中，小数点的作用是不确定的，可以表示浮点数，也可以是读取对象属性，JS 默认会把第一个小数点理解成浮点数，第二个小数点理解为读取对象属性。对于第一个例子，解释器理解成了浮点数，所以报错。

## 知识点

我当时的疑惑是，toFixed 是部署在 Number 对象的方法，而数字字面量属于基本类型--数字，Number 对象和基本类型数字是两回事，为何能直接访问？（引擎会自动转换成 Number 对象）

### 字面量

字面量是值的具象表示法，主要有以下几类，

- number literal        8   就是数字字面量
- string literal 　　'hello'   字符串字面量
- object literal 　　{} 对象字面量
- array literal 　　[] 数组字面量
- function  　　 function (){alert('aa')} 函数字面量
- regexp literal     正则字面量
