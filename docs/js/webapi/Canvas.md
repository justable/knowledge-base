# Canvas

## 概述

Canvas API 提供了一个通过 JavaScript 和 HTML 的`<canvas>`元素来绘制图形的方式。它可以用于动画、游戏画面、数据可视化、图片编辑以及实时视频处理等方面。

Canvas API 主要聚焦于 2D 图形。而同样使用`<canvas>`元素的 [WebGL API](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL_API) 则用于绘制硬件加速的 2D 和 3D 图形。

Canvas 由 CanvasRenderingContext2D 接口完成实际的绘制，CanvasRenderingContext2D 接口是 Canvas API 的一部分，可为`<canvas>`元素的绘图表面提供 2D 渲染上下文。 它用于绘制形状，文本，图像和其他对象。

```js
const canvas = document.getElementById('canvas');
// 这个ctx就是CanvasRenderingContext2D接口
const ctx = canvas.getContext('2d');
```
