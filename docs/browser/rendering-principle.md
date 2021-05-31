## 浏览器的目标

1. 将 Web Content 也就是 HTML、CSS、JS 转换为正确的 OpenGL 调用，并在屏幕上显示相应像素
2. 构造合理的中间数据结构能有效的做渲染更新，并响应来自脚本或系统其他部分的查询

:::tip
先讲句利于我自己理解后文的废话：在 GPU shipping pixels to screen 前，任何操作其实都只是对数学模型的计算。
:::

[Chrome Web 开发者文档](https://developers.google.cn/web/fundamentals)

[Edge(Chromium) Web 开发者文档](https://docs.microsoft.com/en-us/microsoft-edge/web-platform/user-agent-string)

## 名词索引

- 位图（bitmap）：描述物体及其颜色的数据结构，浏览器可以用位图来记录他想在某个区域绘制的内容，绘制的过程也就是往数组中具体的下标里填写像素而已。
- 纹理：好比 GPU 中的位图，存储在 GPU video RAM（VRAM） 中，固定格式且有大小限制，所以浏览器将图像分块光栅化后需要再转成纹理传输给 GPU，最终 GPU 根据这些纹理 shipping pixels to screen。
- Rasterize(光栅化)：光栅化是将一个图元（要显示的图像）转变为一个二维图像（位图）的过程。二维图像上每个点都包含了颜色、深度和纹理数据，将该点和相关信息叫做一个片元（fragment）。早年的浏览器采用 Full-screen Rasterization 把整个图像进行光栅化，现代的浏览器基本都采用 Tile-Based Rasterization，把图像分块成 tile，对每个 tile 单独光栅化，所有很大的图片不会一次性呈现，而是分段呈现，这样做的好处是减少了单次内存占用率，更好的发挥了多线程并行处理的优势，页面展示的更流畅。
  ![](./images/principle/16.png)
- Paint：把像素填充进位图
- Composite：组合各个 Layer 位图，在 GPU 中执行

## Renderer Process 和 GPU Process

![](./images/principle/5.png)
![](./images/principle/6.png)
引用自[博客](https://aerotwist.com/blog/the-anatomy-of-a-frame/)

- Renderer 进程：每个 tab 页一个，包含以下 3 个线程
  1. Compositor Thread：接收 vsync 信号（OS 通知浏览器开始新一帧的信号）和 用户交互的 I/O 信号（比如滚动、点击、鼠标移动等等）。它就像一个浏览器的外交官，负责和 OS 进行交流，很多场景（比如「touchmove, scroll, click」）还会亲力亲为，若有绑定回调则快速响应用户的同时唤醒 Main Thread 处理回调，若没有则直接响应用户。
  2. Main Thread：负责处理一系列 tasks，浏览器未来的趋势会把这里的一些事务转给 Compositor Thread 处理。
  3. Compositor Tile Worker(s)：由 Compositor Thread 创建，专门用来处理 tile 的光栅化。
- GPU 进程：整个浏览器共用一个，只有一个线程 GPU Thread。主要是负责把 绘制好的 tile 位图作为纹理上传至 GPU。

Compositor Thread 可能在一帧的时间内（一帧的时间会受实际卡顿情况影响）接收到 OS 传来的多次 I/O 交互信号，最终都会节流成一次传递给 Main Thread，所以说「touchmove, scroll, click」这些事件每帧只会触发一次。

Main Thread 中的每个步骤只会在需要时执行，优化性能的一个很好方式就是移除其中某一环节。

具体介绍可以参考[这篇文章](https://juejin.im/entry/590801780ce46300617c89b8)

## 强制同步重排

上节展示的图中红线箭头表示的是强制同步重排（Forced Synchronous Layout or Styles）。我们可以从 Chrome 的 Performance 中分析然后进行优化，这儿是个[分析用例](https://justable.github.io/demos/front/static/forcedsync.html)。

先按照例子中的步骤走完，可以看到
![](./images/principle/10.png)
每帧大约 150ms，这算很卡了。我们把范围缩小到一帧左右可以更清楚的看清 Main Thread 在每帧所执行的内容
![](./images/principle/11.png)
从调用栈不难猜出 update 就是 requestAnimationFrame 的回调函数，update 下面很多的紫块，带有红色的是 DevTools 在警告页面可能会被强制自动重排，强制自动重排是强制同步布局的另一种说法。  
在下方的 Summary Panel 中标识了发生强制重排的源码位置，点击进入查看
![](./images/principle/12.png)
Main Thread 遇到代码修改了[会影响元素布局信息的 CSS 样式](https://csstriggers.com/)时，会标记 layout dirty=true，在下一帧再判断若 dirty=true，则执行 Layout 步骤。这个例子每次根据图像的 offsetTop 值计算其 left 属性，而对元素 offsetTop 的访问会立即触发当前帧的重排（当 dirty=true 时，为了确保 offsetTop 的准确性必须在当前帧立即重排），并设置 layout dirty=false。除了访问 offsetTop 会触发立即重排外，还有
![](./images/principle/13.png)
接下来我们直接在 DevTool 中对代码进行修改，因为是内嵌在 html 中的 script 块所以无法直接编辑，我们复制整个 update 函数到 Console Panel 中，删除使用 offsetTop 的语句并取消注释其下面的语句，然后执行，浏览器就会覆盖原有的 update 函数，更新后的 Performance 图
![](./images/principle/14.png)
举个更直观的例子：

```js
const container = document.getElementById('container');
// dirty = false
console.log(container.offsetWidth); // 不relayout
// dirty = false
console.log(container.offsetWidth); // 不relayout
// dirty = false
container.style.width = '100px'; // 下帧再relayout
// dirty = true
console.log(container.offsetWidth); // 立即relayout
// dirty = false
console.log(container.offsetWidth); // 不relayout
// dirty = false
container.style.color = '#fff'; // 下帧再repaint
// dirty = true
```

## task 和 microtask

- task（macrotask）：主代码块，setTimeout，setInterval 等（可以看到，事件队列中的每一个事件都是一个 macrotask）
- microtask：Promise，process.nextTick 等

举个例子：

```js
(function main() {
  setTimeout(() => console.log(9), 0);
  console.log(1);
  new Promise(function exec(resolve) {
    console.log(2);
    resolve();
    Promise.resolve().then(() => console.log(5));
    console.log(3);
  }).then(() => {
    console.log(6);
    Promise.resolve().then(() => console.log(8));
    console.log(7);
  });
  console.log(4);
  // output：1，2，3，4，5，6，7，8，9
})();
```

## 浏览器渲染原理

![](./images/principle/7.png)

- LayoutObject：LayoutObject 树是基于 DOM 树建立起来的一棵新树，是为了布局计算和渲染等机制而构建的一种新的内部表示。LayoutObject 树节点和 DOM 节点并不是一一对应。LayoutObject 存放了浏览器将 DOM 节点绘制进位图时所需要的信息，比如背景、边框、文字内容等等。WebKit 在创建 DOM 树的同时也创建 LayoutObject 对象。详细介绍请参考[这篇文章](https://www.jianshu.com/p/60174ad4a8c6)。

一个 DOM 节点对应了一个渲染对象，渲染对象依然维持着 DOM 树的树形结构。一个渲染对象知道如何绘制一个 DOM 节点的内容，它通过向一个绘图上下文（GraphicsContext）发出必要的绘制调用来绘制 DOM 节点。

- PaintLayer：浏览器靠着遍历 LayoutObject 树来绘制位图时，只能按照 DOM 节点顺序覆盖，无法解决层叠关系，所以有了 PaintLayer，PaintLayer 和 LayoutObject 是一对多的关系。每个 PaintLayer 的子 PaintLayer 都按照升序排列存储在两个有序列表当中，negZOrderList 存储了负 z-indices 的子 layers，posZOrderList 存储了正 z-indices 的子 layers，渲染引擎遍历 PaintLayer 树，访问每一个 PaintLayer，然后递归遍历 negZOrderList 里的 layer、自己的 LayoutObject、再递归遍历 posZOrderList 里的 layer，就可以将一颗 PaintLayer 树绘制出来。不提升为 PaintLayer 的 LayoutObject 从属于其父级元素中最近的那个 PaintLayer，根元素 HTML 自己会先提升为 PaintLayer。

这是浏览器渲染期间构建的第一个层模型，处于相同坐标空间（z 轴空间）的渲染对象，都将归并到同一个渲染层中，因此根据层叠上下文，不同坐标空间的的渲染对象将形成多个渲染层，以体现它们的层叠关系。所以，对于满足形成层叠上下文条件的渲染对象，浏览器会自动为其创建新的渲染层。能够导致浏览器为其创建新的渲染层的，包括以下几类常见的情况：

- 根元素 document
- 有明确的定位属性（relative、fixed、sticky、absolute）
- opacity < 1
- 有 CSS fliter 属性
- 有 CSS mask 属性
- 有 CSS mix-blend-mode 属性且值不为 normal
- 有 CSS transform 属性且值不为 none
- backface-visibility 属性为 hidden
- 有 CSS reflection 属性
- 有 CSS column-count 属性且值不为 auto 或者有 CSS column-width 属性且值不为 auto
- 当前有对于 opacity、transform、fliter、backdrop-filter 应用动画
- overflow 不为 visible

DOM 节点和渲染对象是一一对应的，满足以上条件的渲染对象就能拥有独立的渲染层。当然这里的独立是不完全准确的，并不代表着它们完全独享了渲染层，由于不满足上述条件的渲染对象将会与其第一个拥有渲染层的父元素共用同一个渲染层，因此实际上，这些渲染对象会与它的部分子元素共用这个渲染层。

- GraphicsLayer(图形层)和 GraphicsContext(2D 图形上下文)：无论 LayoutObject 树还是 PaintLayer 树，最终都会绘制到一层位图中，如果页面中有 animation、video、canvas、3d 效果这些频繁变动的元素时，比如每秒 60 帧的动画，每次变动都重绘整个位图是很恐怖的性能开销。所以有了 GraphicsLayer 和 GraphicsContext，只有 SelfPaintLayer（基本可认为是 NormalPaintLayer） 才能提升为 GraphicsLayer ，每个 PaintLayer 都属于他祖先中最近的那个 GraphicsLayer，根元素 HTML 自己会先提升为 GraphicsLayer。每层 GraphicsLayer 都会有一层独立的位图（副作用是占用了更多的内存）。

![](./images/principle/9.jpg)

GraphicsLayer 其实是一个负责生成最终准备呈现的内容图形的层模型，它拥有一个图形上下文（GraphicsContext），GraphicsContext 会负责输出该层的位图。存储在共享内存中的位图将作为纹理上传到 GPU，最后由 GPU 将多个位图进行合成，然后绘制到屏幕上，此时，我们的页面也就展现到了屏幕上。所以 GraphicsLayer 是一个重要的渲染载体和工具，但它并不直接处理渲染层，而是处理合成层。

- CompositingLayer（合成层）
  满足某些特殊条件的渲染层，会被浏览器自动提升为合成层。合成层拥有单独的 GraphicsLayer，而其他不是合成层的渲染层，则和其第一个拥有 GraphicsLayer 的父层共用一个。

那么一个渲染层满足哪些特殊条件时，才能被提升为合成层呢？这里列举了一些常见的情况：

- 3D transforms：translate3d、translateZ 等
- video、canvas、iframe 等元素
- 通过 Element.animate() 实现的 opacity 动画转换
- 通过 СSS 动画实现的 opacity 动画转换
- position: fixed
- 具有 will-change 属性
- 对 opacity、transform、fliter、backdropfilter 应用了 animation 或者 transition

因此，文首例子的解决方案，其实就是利用 will-change 属性，将 CPU 消耗高的渲染元素提升为一个新的合成层，才能开启 GPU 加速的，因此你也可以使用 transform: translateZ(0) 来解决这个问题。

这里值得注意的是，不少人会将这些合成层的条件和渲染层产生的条件混淆，这两种条件发生在两个不同的层处理环节，是完全不一样的。

另外，有些文章会把 CSS Filter 也列为影响 Composite 的因素之一，然而我验证后发现并没有效果。

### 提升为 GraphicsLayer（硬件 GPU 加速）有以下几点好处

1. GraphicsLayer 的位图会交由 GPU 合成，比 CPU 处理要快
2. 当需要 repaint 时，只需要 repaint 本身，不会影响到其他的层
3. 对于 transform， opacity，filter 效果，不会触发 layout 和 paint

将元素提升为 GraphicsLayer，一个是可以起到层隔离 paint 的作用，另一个是对于 transform， opacity，filter 属性的动画，可以由 GPU 内部完成变换；如果是 left 等属性，则浏览器仍需要交由 CPU paint，然后再每帧以纹理的形式发送给 GPU[参考文章 1](https://engineering.gosquared.com/optimising-60fps-everywhere-in-javascript)、[参考文章 2](https://ariya.io/2013/06/optimizing-css3-for-gpu-compositing)，此时 GraphicsLayer 的作用仅仅是隔离渲染？

3D 变换的元素会提前提升为 GraphicsLayer；2D 变换则是动态的在开始时提升为 GraphicsLayer，结束后删除 GraphicsLayer。如果我们查看 2D 变换的 Performance，会发现开始和结束时分别有一个 repaint 阶段，就是新增和删除 GraphicsLayer 导致的。非 transform， opacity，filter 的动画浏览器不会自动提升为 GraphicsLayer。

[本机 Chrome 浏览器的加速情况](chrome://gpu/)

硬件加速的相关介绍可以参考[这篇文章](https://www.sitepoint.com/introduction-to-hardware-acceleration-css-animations/)

### 总结优化场景

1. 经常变动的并且浏览器不会自动提升为 GraphicsLayer 的动画类元素，手动提升为 GraphicsLayer

```css
// 新型浏览器
#target {
  will-change: transform;
}
// 不支持will-change的浏览器
#target {
  transform: translateZ(0);
}
```

2. 使用 transform 来替代 left、top 之类的属性和 opacity 来实现动画效果，这会跳过 Layout 和 Paint 阶段，直接由 GPU 进行变换，而不是在 CPU 上执行。目前 GPU 只支持 transform，opacity，filter 属性的变换。
   ![](./images/principle/19.png)
   ![](./images/principle/20.png)
3. 避免使用 box shadows 或 gradients 等这些 repaint 成本高的属性做动画。
4. 把固定不变且频繁显示的元素，比如一个 fix 在页面顶部的固定不变的导航提升为 GraphicsLayer
5. 面对层爆炸且浏览器[无法自动合并层的情况](https://fed.taobao.org/blog/2016/04/25/performance-composite/)，我们要找到无法合并的原因防止层爆炸

### 哪些因素会导致 LayoutObject 集合提升为 PaintLayer 呢？

- NormalPaintLayer

  - 根元素（HTML）
  - 有明确的定位属性（relative、fixed、sticky、absolute）
  - 透明的（opacity 小于 1）
  - 有 CSS 滤镜（fliter）
  - 有 CSS mask 属性
  - 有 CSS mix-blend-mode 属性（不为 normal）
  - 有 CSS transform 属性（不为 none）
  - backface-visibility 属性为 hidden
  - 有 CSS reflection 属性
  - 有 CSS column-count 属性（不为 auto）或者 有 CSS column-width - 属性（不为 auto）
  - 当前有对于 opacity、transform、fliter、backdrop-filter 应用动画

- OverflowClipPaintLayer
  - overflow 不为 visible
- NoPaintLayer
  - 不需要 paint 的 PaintLayer，比如一个没有视觉属性（背景、颜色、阴影等）的空 div。

### 哪些因素会导致 SelfPaintLayer 集合提升为 GraphicsLayer 呢？

- ⭐️3D 或透视变换(perspective、transform) CSS 属性
- ⭐️ 包含 opacity、transform 的 CSS 过渡和动画
- 拥有 3D (WebGL) 上下文或加速的 2D 上下文的 元素
- 对 opacity、transform、fliter、backdropfilter 应用了 animation - 或者 transition（需要是 active 的 animation 或者 transition，当 - animation 或者 transition 效果未开始或结束后，提升合成层也会失效）
- ⭐️will-change 设置为 opacity、transform、top、left、bottom、right（其中 top、left 等需要设置明确的定位属性，如 relative 等）
- 拥有加速 CSS 过滤器的元素
- 元素有一个 z-index 较低且包含一个复合层的兄弟元素(换句话说就是该元素在- 复合层上面渲染)
- ⭐️overlap 重叠原因
- 更多参考[淘宝 fed 文章](https://fed.taobao.org/blog/2016/04/25/performance-composite/)

GraphicsLayer 在处理动画有很好的优势，但我们要注意的是它会占用内存，如果我们手动为不经常变动的元素肆意添加 will-change，则会导致内存的浪费，反而降低了性能。并且对于一次性或不频繁的动画，比如一个按钮点击后触发一个动画效果的场景，最好在 button 的 hover 事件中动态的为目标添加 will-change，在 animationEnd 事件中再把 will-change 去除，释放内存。

## Event loop

[html5 官方规范](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)
[解析](https://www.cnblogs.com/bbc66/p/9909776.html)
[解析 2](https://copyfuture.com/blogs-details/20200527204558511xhc97mp2frtmg6p)

The browser main thread is an event loop. Its an infinite loop that keeps the process alive. It waits for events (like layout and paint events) and processes them.

Event loop 是浏览器渲染进程主线程的调度模型，只要浏览器的渲染进程还存活 Event loop 就会无线循环下去，而渲染过程也主要是主线程控制。JS 代码最终是以 task 和 microtask 的形式存在的，当一次 loop 处理完 task 后会进行渲染，此时会有这些不同情况：

- task 处理远小于 1/60s
- task 处理时间过长，造成卡帧（浏览器会智能降低渲染频率来防止掉帧）
- 当前 loop 的 task 处理完后对 dom 没有影响并不需要渲染（浏览器会按需来决定是否跳过渲染的某个步骤）

1. 从多个 task 队列中里选出一个 task 队列（浏览器为了区分不同 task 的优先级，所以时常有多个 task 队列），从这个 task 队列中取出最老的那个 task，执行他，然后把他从队列中去除。
2. perform a microtask checkpoint，这个步骤其实包含了多个子步骤，只要 microtask queue 不空，这一步会一直从 microtask queue 中取出 microtask，执行之。如果 microtask 执行过程中又添加了 microtask，那么仍然会执行新添加的 microtask。
3. Update the rendering（更新渲染），
4. run the resize steps
5. run【the scroll steps（是个队列，存放期间发生过 scroll 的 target）】
6. 更新、渲染用户界面

## 时间分片

要分辨屏幕刷新率和浏览器渲染帧，在硬件运行正常情况下为 60FPS，浏览器渲染帧可能因为耗时的同步任务导致渲染帧超过 16.67ms。

时间分片要做的就是把“大块的渲染帧”合理切分成多个“细小的渲染帧”，理想是和屏幕刷新率一致。时间分片通常可以依靠 requestAnimationFrame 和 requestIdleCallback 实现。可以参考[React Faber](https://zhuanlan.zhihu.com/p/37095662)中的时间分片。

## 浏览器兼容性检查

可以去这个[网站](http://html5test.com/)，它会检测当前的浏览器兼容性

## 获取节点宽度问题

clientWidth=width+padding  
offsetWidth=width+padding+border  
scrollWidth=滚动距离

```html
<div
  id="root"
  style="width: 200px; border: 2px solid; /*box-sizing: border-box*/"
>
  <div id="content" style="width: 300px"></div>
</div>
<script>
  var root = document.getElementById('root');
  var clientWidth = root.clientWidth; // content-box：200px border-box：196px
  var offsetWidth = root.offsetWidth; // content-box：204px border-box：200px
  var scrollWidth = root.scrollWidth; // content-box：300px border-box：300px
  // 当出现垂直滚动条时
  if (isMac()) {
    审查元素时的width = `200px`;
  } else {
    审查元素时的width = `183px`;
  }
  // 判断是否处在mac系统中
  function isMac() {
    return /macintosh|mac os x/i.test(navigator.userAgent);
  }
</script>
```

## Viewport

viewport 分为 layout viewport，visual viewport，ideal viewport，注意这些都是指独立像素而非物理像素/手机尺寸

- PC 浏览器的 layout viewport 是严格等于浏览器窗口的，移动端浏览器为了能够适应 PC 的网站，把 layout viewport 默认设置为 980px，这样即使页面是按百分比布局，在移动端显示时也不会极度变形，可以通过 document.documentElement.clientWidth 得到 layout viewport 值；
  ![](./images/principle/1.png)
- visual viewport 决定可视区域大小，可视区域大小可随浏览器缩放而变化，PC 浏览器的 visual viewport 默认等于 layout viewport，可以通过 window.innerWidth 得到 visual viewport 的值；
  ![](./images/principle/2.png)
- ideal viewport 是每个手机厂商设定的一个理想大小，所谓的理想是指不需要用户缩放和横向滚动条就能正常的查看网站的所有内容，显示的文字的大小是合适（确定仅靠手机浏览器支持而不需要开发者适配？），每个手机厂商设置的不一定一样，比如苹果手机都为 320px。  
  meta 的 viewport 属性中，
- width 是来控制 layout viewport 的，当 width=device-width 时表示把 layout viewport 设置为 ideal viewport，不过在 iphone 和 ipad 上，无论是竖屏还是横屏，宽度都是竖屏时 ideal viewport 的宽度；
  ![](./images/principle/3.png)
- initial-scale 表示初始的缩放比，它是相对于 ideal viewport 的，所以当 initial-scale=1 时，等价于 width=device-width，公式为 layout viewport = ideal viewport / initial-scale；
  ![](./images/principle/4.png)
- 当 width 和 initial-scale 同时出现时，浏览器会取较大值作为 layout viewport，并同时解决了兼容问题。
- devicePixelRatio 为设备物理像素和设备独立像素的比例，devicePixelRatio = 物理像素 / 独立像素，CSS 中的 px 代表的就是这独立像素。
- visual viewport = ideal viewport / 当前缩放值
- 当前缩放值 = ideal viewport / visual viewport
- initial-scale 在安卓机中没有默认值，只有设置了 initial-scale 才会生效，在苹果系列中，会自动计算 initial-scale 这个值，以保证 visual viewport 中能完全展现 layout viewport，也就是说不会出现横向滚动条，那么此时的 visual viewport=layout viewport=980，即 initial-scale = 320 / 980
- 当 initial-scale=0 时代表什么？

## FAQ

是我想差了，每次 loop 中的 task 最终转化为 Display Items 并通过光栅化上传给 GPU，无论 1ms 还是 5000ms 那只是渲染主线程的阻塞与否，和屏幕的刷新频率没关系

## References

[http://jankfree.org/](http://jankfree.org/)

[https://developer.mozilla.org/zh-CN/docs/Web/Guide/CSS/Understanding_z_index/The_stacking_context](https://developer.mozilla.org/zh-CN/docs/Web/Guide/CSS/Understanding_z_index/The_stacking_context)

[https://tech.domain.com.au/2016/11/website-jank-busting-part-3-of-3/](https://tech.domain.com.au/2016/11/website-jank-busting-part-3-of-3/)

[https://juejin.im/entry/59dc9aedf265da43200232f9](https://juejin.im/entry/59dc9aedf265da43200232f9)

[https://segmentfault.com/a/1190000020926189](https://segmentfault.com/a/1190000020926189)

[http://fouber.github.io/test/layer/](http://fouber.github.io/test/layer/)

[https://drafts.csswg.org/cssom-view/#run-the-resize-steps](https://drafts.csswg.org/cssom-view/#run-the-resize-steps)
