# JavaScript 浮点数精度丢失

## 产生原因

JavaScript 中所有数字包括整数和小数都只有一种类型 — Number。它的实现遵循 IEEE 754 标准，使用 64 位固定长度来表示，也就是标准的 double 双精度浮点数（相关的还有 float 32 位单精度）。

## 已知问题

- 0.1 + 0.2 = 0.30000000000000004

  0.1 的二进制表示的是一个无限循环小数，该版本的 JS **采用的是浮点数标准需要对这种无限循环的二进制进行截取，从而导致了精度丢失**，造成了 0.1 不再是 0.1，截取之后 0.1 变成了 0.100…001，0.2 变成了 0.200…002。所以两者相加的数大于 0.3。

* 0.1 + 0.2 - 0.3 = 5.6

因为在输入内容进行转换的时候，二进制转换成十进制，然后十进制转换成字符串，在这个转换的过程中发生了取近似值，所以打印出来的是一个近似值，实际是 5.551115123125783e-17。

## 解决方法

### 把小数放大到整数

```javascript
// 0.1 + 0.2
(0.1 * 10 + 0.2 * 10) / 10 == 0.3; // true
```

### toFixed

不能用原生自带的 toFixed，1.335.toFixed(2) = 1.33，因为 1.335 实际值是 1.33444，需要自定义一个 toFixed 方法

```javascript
function toFixed(num, s) {
  var times = Math.pow(10, s);
  var des = num * times + 0.5;
  des = parseInt(des, 10) / times;
  return des + '';
}
```

### 第三方类库

比如 number-precision，

```javascript
import NP from 'number-precision';
NP.strip(0.1 + 0.2); // = 0.3
```

实现方式如下，

```typescript
function strip(num: numType, precision = 15): number {
  return +parseFloat(Number(num).toPrecision(precision));
}
```

关键处理就在于 precision 默认等于 15。具体原理可以参考[IEEE 754 浮点数标准详解](http://c.biancheng.net/view/314.html)。
