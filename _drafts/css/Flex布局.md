# Flex 布局

> [原文](http://www.ruanyifeng.com/blog/2015/07/flex-grammar.html)

## 引言

浏览器渲染时，会生成一个个盒子，每个盒子遵循的规则称为格式化上下文（formatting context），传统的块状盒子都是 block formatting context，grid 和 flex 有属于自己的 formatting context。

Flex 布局使得一个框体内部的排版更为便捷，比如栅格排版，自适应分配长宽，垂直居中等，原来可能需要很多样式配合来完成，使用 flex，就变得更 native 了。

Flex 布局主要由两层结构实现，外层 container 和内层 item，当然内层 item 也可以是更内层的 container

- 容器：外层 container
- 项目：内层 item
- 主轴：item 的排列方向
- 交叉轴：与主轴垂直

## 容器的属性

- flex-direction
- flex-wrap
- flex-flow
- justify-content
- align-items
- align-content

### flex-direction

主轴的方向

```
// row 自左向右
// row-reverse 自右向左
// column 自上而下
// row 自下向上
flex-direction: row(default) | row-reverse | column | column-reverse;
```

![1.png](@images/1608171222574-427a66c0-b5f3-4337-8f82-3db71e992fda.png)

### flex-wrap

控制项目的换行规则，因为默认不换号，当项目的宽度之和大于容器的宽度时，会根据项目的一些属性决定实际宽度分配

```
// nowrap 不换行
// wrap 换行，新行在下方
// wrap-reverse 换行，新行在上方
flex-wrap: nowrap(default) | wrap | wrap-reverse;
```

![2.png](@images/1608171232125-a301bbea-e99e-4850-967f-e129cbe38764.png)

### flex-flow

是 flex-direction 和 flex-wrap 的缩写

```
// 默认 flex-flow: row nowrap
flex-flow: <flex-direction> || <flex-wrap>;
```

### justify-content

主轴上的对齐方式

```
justify-content: flex-start(default) | flex-end | center | space-between | space-around;
```

![3.png](@images/1608171244539-b5a5a5a6-f242-4879-8af0-f36ed591ee04.png)

### align-items

交叉轴上的对齐方式

```
// flex-start 交叉轴的起点对齐
// flex-end 交叉轴的终点对齐
// center 交叉轴的中点对齐
// baseline 项目的第一行文字的基线对齐
// stretch 如果项目未设置高度或设为auto，将占满整个容器的高度
align-items: flex-start | flex-end | center | baseline | stretch(default);
```

![4.png](@images/1608171253288-fe749242-e010-4aca-9b1f-92486639622e.png)

### align-content

定义了多根轴线的对齐方式。如果项目只有一根轴线，该属性不起作用。

```
// flex-start 与交叉轴的起点对齐
// flex-end 与交叉轴的终点对齐
// center 与交叉轴的中点对齐
// space-between 与交叉轴两端对齐，轴线之间的间隔平均分布
// space-around 每根轴线两侧的间隔都相等。所以，轴线之间的间隔比轴线与边框的间隔大一倍
// stretch 轴线占满整个交叉轴
align-content: flex-start | flex-end | center | space-between | space-around | stretch(default);
```

![5.png](@images/1608171261355-e315ec34-81fa-43d7-bd84-035d8d42e783.png)
重点看上图的 stretch，从 item 设了高度和没设高度 auto 的区别可看出，stretch 的原理是将交叉轴根据行数平分(交叉轴长度/行数)成若干份，如果设了高度，就用真是高度，没设高度就填充单份高度。

## 项目的属性

- order
- flex-grow
- flex-shrink
- flex-basis
- flex
- align-self

### order

定义项目的排列顺序。数值越小，排列越靠前，可以是负数，相同时依 dom 顺序。

```
order: <integer>; // 0 default
```

### flex-grow

定义项目的放大比例，默认为 0，即如果存在剩余空间，也不放大。负数无效，浏览器视作默认值 0。

```
flex-grow: <number>; // 0 default
```

![6.png](@images/1608171270722-a6d1d47d-73df-402c-880f-8bc46bfee3df.png)

注意放大比例是从剩余空间分配的，上图 item 最终实际宽度(px)：

- 图一：
  - 剩余宽度 restWidth = 300 - 3 × 50 = 150
  - 红色宽度 redWidth = 1 / 3 × restWidth + 50 = 100
  - 黄色宽度 yellowWidth = 2 / 3 × restWidth + 50 = 150
  - 绿色宽度 greenWidth = 50
- 图二：依次类推
- 图三：因为没有剩余宽度，发挥作用的是 flex-shrink

### flex-shrink

定义了项目的缩小比例，即如果空间不足，该项目将缩小，flex-shrink 属性为 0 时项目不缩小，负数无效，浏览器视作默认值 1。

```
flex-shrink: <number>; // 1 default
```

![7.png](@images/1608171278463-e7ab1acd-094c-4371-bc4f-33ef05d1810e.png)

注意当 flex-shrink 属性为 0 的项目总宽度大于等于容器宽度时，即没有剩余空间分配时，其余 flex-shrink 属性不为 0 的项目宽度会缩小成刚好能够容纳内容，padding,margin 依然有效。上图 item 最终实际宽度(px)：

- 图一：
  - 剩余宽度：restWidth = 300 - 3 × 100 = 0

所以 redWidth 和 yellowWidth 变成了能够容纳内容的最小宽度

- 图二：
  - 剩余宽度：restWidth = 300 - 2 × 100 = 100

所以 redWidth 和 yellowWidth 按照某种比例分配了 restWidth，分配策略还没弄清楚

### flex-basis

flex-grow 和 flex-shrink 都提到了剩余空间，其实就是根据这个属性计算的，它的默认值为 auto，即项目的本来大小。bootstrap4 的栅格系统就是用了这个属性替代了 bootstrap3 的 float:left+width%组合。

```
flex-basis: <length> | auto; // auto default
```

### flex

是 flex-grow, flex-shrink 和 flex-basis 的简写，默认值为 0 1 auto。后两个属性可选。该属性有快捷值：auto(1 1 auto)、none(0 0 auto)、1(1 1 0%)、0(0 1 0%)。bootstrap4 的栅格系统用的是(0 0 %)

```
flex: none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]
```

![8.png](@images/1608171286929-406c219a-a181-4b39-b6e8-0a7291274057.png)

### align-self

允许单个项目有与其他项目不一样的对齐方式，可覆盖 align-items 属性。默认值为 auto，表示继承父元素的 align-items 属性，如果没有父元素，则等同于 stretch。

```
align-self: auto | flex-start | flex-end | center | baseline | stretch;
```
