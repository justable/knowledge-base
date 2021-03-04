# WeakMap

## 简介

WeakMap 是一组键/值对的集合，其中的键是弱引用的（弱引用是指不会被计入垃圾回收机制），其键必须是对象，而值可以是任意的。

## 原型

- WeakMap.prototype.delete(key)

移除 key 的关联对象。执行后 WeakMap.prototype.has(key)返回 false。

- WeakMap.prototype.get(key)

返回 key 关联对象, 或者 undefined(没有 key 关联对象时)。

- WeakMap.prototype.has(key)

根据是否有 key 关联对象返回一个 Boolean 值。

- WeakMap.prototype.set(key, value)

在 WeakMap 中设置一组 key 关联对象，返回这个 WeakMap 对象。

## 使用场景

可以用来充当缓存，具体参考`vue-next/reactivity/reactive.ts`的用法

## Map 和 WeakMap 的区别

下面的 text 节点初始引用次数是 2，elements 实例 1 次，DOM 树 1 次，当移除 DOM 树中的 text 节点后，text 节点初始引用次数变为 1，GC 不会释放在 elements 实例中的 text 节点，发生内存泄漏。

```html
<div id="root">
  <button id="button">delete</button>
  <div id="text">text</div>
</div>
<script>
  const elements = new Map();
  elements.set(document.getElementById('root'), 'root');
  elements.set(document.getElementById('button'), 'button');
  elements.set(document.getElementById('text'), 'text');
  function removeText() {
    document
      .getElementById('root')
      .removeChild(document.getElementById('text'));
    console.log(elements.size); // 3
  }
  button.onclick = removeText;
</script>
```

下面的 text 节点以弱引用的形式存在与 elements 实例中，因此初始引用次数是 1，当移除 DOM 树中的 text 节点后，text 节点实例会被 GC 回收。

```html
<div id="root">
  <button id="button">delete</button>
  <div id="text">text</div>
</div>
<script>
  const elements = new WeakMap();
  elements.set(document.getElementById('root'), 'root');
  elements.set(document.getElementById('button'), 'button');
  elements.set(document.getElementById('text'), 'text');
  function removeText() {
    document
      .getElementById('root')
      .removeChild(document.getElementById('text'));
  }
  button.onclick = removeText;
</script>
```
