# 渐变 gradient

渐变可以在任何可以使用图片的 css 属性中使用，比如 background、border-image 等，但不能在颜色属性中使用，比如 background-color 等。渐变是动态生成，并且自适应于填充的元素，因此在元素被放大的时候有较好的表现。

## 渐变的类型

- linear-gradient()
- radial-gradient()
- conic-gradient()
- repeating-linear-gradient()
- repeating-radial-gradient()

### linear-gradient()

![linear_gradient.png](@images/linear_gradient.png)

它会有一条渐变轴线，最终的渐变效果就是根据轴线方向和轴线上的中间点颜色来生成，比如：

`linear-gradient(to left top, blue, green 40%, red)`表示轴线方向是右下至左上，轴线上有 3 个颜色点。

两个中间点之间，默认会在 50%的位置取中间色开始渐变，这个中间色的位置是可以通过在两点之间增加一个%数值变更的，最终的效果是距离中间色近的点渐变速率变快反之变慢，比如：

`linear-gradient(red 10%, 30%, blue 90%)`表示把红蓝色的中间值放在 30%的位置。

表示方向的格式有：

- to left right
- 0deg，可以看作时钟，颜色方向是从圆心到外的

表示中间点的格式有：

- red 10%：如果省略百分比数值，则该颜色会处在前后两色的中间位置
- red 20px

渐变轴线可以有多条，比如：

```css
background: linear-gradient(
    217deg,
    rgba(255, 0, 0, 0.8),
    rgba(255, 0, 0, 0) 70.71%
  ), linear-gradient(127deg, rgba(0, 255, 0, 0.8), rgba(0, 255, 0, 0) 70.71%),
  linear-gradient(336deg, rgba(0, 0, 255, 0.8), rgba(0, 0, 255, 0) 70.71%);
```

### radial-gradient()

![radial_gradient.png](@images/radial_gradient.png)

它的颜色是从中心位置向轮廓渐变的。

定义中心位置的格式（默认在元素中心）：

- 像素：farthest-corner at 40px 40px
- 百分比：circle at 100%
- 方位：ellipse at top

定义中间点位置：

- 默认处在前后中间点的 50%处：radial-gradient(farthest-corner at 40px 40px, rgb(255, 0, 0), rgb(0, 255, 0), rgb(0, 0, 255));
- 百分比：radial-gradient(circle at 100%, rgb(255, 0, 0) 0, rgb(0, 255, 0) 10%, rgb(0, 0, 255) 100%);
- 像素：radial-gradient(ellipse at top, rgb(255, 0, 0), rgb(0, 255, 0) 100px, rgb(0, 0, 255));

定义轮廓位置：

- closest-side
- closest-corner
- farthest-side
- farthest-corner

定义轮廓形状（默认是 ellipse）：

- radial-gradient(circle | ellipse, rgb(255, 0, 0), rgb(0, 255, 0));

渐变中心可以有个，比如：

```css
background: radial-gradient(ellipse at top, #e66465, transparent),
  radial-gradient(ellipse at bottom, #4d9f0c, transparent);
```

### conic-gradient()

![conic_gradient.png](@images/conic_gradient.png)

[https://developer.mozilla.org/zh-CN/docs/Web/CSS/conic-gradient](https://developer.mozilla.org/zh-CN/docs/Web/CSS/conic-gradient)

### repeating-linear-gradient()

[https://developer.mozilla.org/zh-CN/docs/Web/CSS/repeating-linear-gradient](https://developer.mozilla.org/zh-CN/docs/Web/CSS/repeating-linear-gradient)

### repeating-radial-gradient()

[https://developer.mozilla.org/zh-CN/docs/Web/CSS/repeating-radial-gradient](https://developer.mozilla.org/zh-CN/docs/Web/CSS/repeating-radial-gradient)
