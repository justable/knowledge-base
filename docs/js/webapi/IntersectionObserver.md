# IntersectionObserver

> IntersectionObserver 提供了一种异步观察目标元素与其祖先元素或顶级文档视窗(viewport)交叉状态的方法，交叉区是指重叠部分，一个元素是否可见的本质就是是否和 viewport（窗口）有交叉区，我们可以依次来实现懒加载，即当目标元素接近 viewport 时再加载。

```js
const io = new IntersectionObserver(() => {
  // 实例化 默认基于当前视窗
});

let ings = document.querySelectorAll('[data-src]'); // 将图片的真实url设置为data-src src属性为占位图 元素可见时候替换src

function callback(entries) {
  entries.forEach(item => {
    // 遍历entries数组
    if (item.isIntersecting) {
      // 当前元素可见
      item.target.src = item.target.dataset.src; // 替换src
      io.unobserve(item.target); // 停止观察当前元素 避免不可见时候再次调用callback函数
    }
  });
}

imgs.forEach(item => {
  // io.observe接受一个DOM元素，添加多个监听 使用forEach
  io.observe(item);
});
```
