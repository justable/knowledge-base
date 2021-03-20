# HTMLTemplateElement

## 简介

解析器在加载页面时会处理「HTML 内容模板（`<template>`）元素」的内容，但元素内容不会被渲染，template 实例中的 content 属性是个 DocumentFragment。

## 检测浏览器是否支持

- `'content' in document.createElement('template')`

## 例子

html 文档中存在`<template>`元素，通过改变它并克隆其内容，达到为 root 节点增加内容的作用，相当于一个 dom 修改的中转区域。

```html
<div id="root"></div>
<template id="temp">
  <p></p>
</template>
<script>
  if ('content' in document.createElement('template')) {
    const root = document.querySelector('#root');
    const temp = document.querySelector('#temp');

    const pNode = temp.content.querySelector('p');
    pNode.textContent = 'hello';

    // 克隆节点
    let clone = document.importNode(temp.content, true);
    root.appendChild(clone);

    pNode.textContent = 'world';

    // 克隆节点
    clone = document.importNode(temp.content, true);
    root.appendChild(clone);
  }
</script>
```
