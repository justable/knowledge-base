# CSS 自适应关键字

> 本文主要介绍 fill-available、max-content、min-content、fit-content 四个自适应关键字的作用。

## fill-available

表示自动撑满可用空间，对于 width 而言，这其实是块状元素的默认特性，如果给行内元素比如 span 设置了该属性，也能达到自动换行的效果；也能在 height 中使用。

## min-content

将元素宽度设置为最小宽度值最大的那个子元素的宽度，最小宽度值是指默认不换行的字符串的宽度，要注意中文的最小宽度值是一个字。

## max-content

将元素宽度设置为最大宽度值最大的那个子元素的宽度，最大宽度值是指文本强制不换行情况下的宽度。

## fit-content

和 max-content 类似，区别在于如果最终的宽度超过了父元素的宽度，则会让内容换行（前提是内容默认能换行）。
