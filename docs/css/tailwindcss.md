# tailwindcss

## 引言

一个项目中，会随着不断迭代，自定义 css 文件也会越来越多，为此，tailwindcss 采取了原子样式理念，预先定义好原子类，比如：

```css
.border-1 {
  border: 1px;
}
```

当然一个原子类可以对应多条 css 属性，最终达到原子类覆盖所有场景的效果，对应开发者而言，只需要自由组合这些原子类实现自定义的效果。这么一来，项目整个样式文件大小是由 tailwindcss 库当前版本决定的，不会随着项目迭代而增加，同时还可以在编译器做瘦身优化，即只打包使用到的原子类。

可能有人会产生疑问，这和直接写 inline style 有什么区别？很显然一个原子类是一组 style 属性的集合，原子类做到了复用，inline style 每次都得新加，并且 tailwindcss 的原子类也支持组合后的重命名，比如使用`@apply`：

```css
.btn-blue {
  @apply bg-blue-500 hover:bg-blue-700 text-white;
}
```

同时 tailwindcss 还支持我们定制，比如更改颜色值：

```js
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      blue: {
        light: '#85d7ff',
        DEFAULT: '#1fb6ff',
        dark: '#009eeb',
      },
    },
  },
};
```

项目中就可以使用`bg-blue-light`原子类访问到该颜色值。

tailwindcss 的功能远不止如此，更多请参考[官网教程](https://www.tailwindcss.cn/docs)。

## FAQ

- 在 webpack 中编译很卡

https://github.com/tailwindlabs/tailwindcss/issues/2544
https://stackoverflow.com/questions/63718438/webpack-dev-server-slow-compile-on-css-change-with-tailwind
