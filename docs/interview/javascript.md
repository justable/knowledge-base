---
title: JavaScript
order: 1
---

## 事件委托 (event delegation)

事件委托是将事件监听添加到父元素，而不是每个子元素单独设置监听器，当触发子元素时，事件会冒泡到父元素，监听器就会触发。

好处是：

1. 内存占用少，因为只需要一个父元素的事件处理程序，而无需为每个后代元素都设置事件处理程序。
2. 无需从已删除的元素中解绑处理程序，也无需为新元素绑定处理程序。

例子：

```tsx | pure
import React, { useEffect } from 'react';

export default () => {
  useEffect(() => {
    const wrapper = document.getElementById('wrapper') as HTMLDivElement;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.nodeName === 'P' || target.matches('a.link')) {
        alert(target.textContent);
      }
    };
    wrapper.addEventListener('click', handler);
    return () => {
      wrapper.removeEventListener('click', handler);
    };
  }, []);
  return (
    <div id="wrapper">
      <a className="link">点我a</a>
      <p>点我p</p>
      <button>点我没反应</button>
    </div>
  );
};
```

## target 和 currentTarget

前者是实际触发事件的元素，后者是被监听的元素。在前面事件委托的例子中，currentTarget 为 wrapper。

## 事件的捕获和冒泡

先捕获后冒泡，前者从 window(当前窗口)->document(整个文档)->documentElement(html)->body->target，后者反之。

我们可以通过`e.stopPropagation()`阻止捕获和冒泡，通过`e.stopImmediatePropagation()`阻止一个节点上绑定的多个同种事件。比如在同个节点 click 事件绑定了三个 handler，前者只会阻止当前的 handler，而后者会取消该节点所有的 click 事件。

我们可以通过`addEventListener`方法的第三个参数可以控制事件发生在捕获阶段还是冒泡阶段，默认为冒泡阶段 false。

## 防抖 (debounce)

目的是归并短时间内的连续行为，使程序只响应一次。

应用场景：

1. 登录、发短信等按钮避免用户点击太快，以致于发送了多次请求，需要防抖
2. 调整浏览器窗口大小时，resize 次数过于频繁，造成计算过多，此时需要一次到位，就用到了防抖
3. 文本编辑器实时保存，当无任何更改操作一秒后进行保存

```js
function debounce(f, interval) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => f(...args), interval);
  };
}
```

## 节流 (throttle)

目的是控制程序的执行频率。

应用场景：

1. scroll 事件，每隔一秒计算一次位置信息等
2. 浏览器播放事件，每个一秒计算一次进度信息等
3. input 框实时搜索并发送请求展示下拉列表，每隔一秒发送一次请求 (也可做防抖)

```js
function throttle(f, interval) {
  let timer;
  return (...args) => {
    if (timer) {
      return;
    }
    timer = setTimeout(() => {
      f(...args);
      timer = null;
    }, interval);
  };
}
```

## 实现 Promise

<code src="../../src/demos/foo1.tsx"></code>
