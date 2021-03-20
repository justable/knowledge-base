# BrowsingContext

> [原文一](https://html.spec.whatwg.org/multipage/browsers.html) > [原文二](https://html.spec.whatwg.org/multipage/history.html)

## Browsing context

![](@images/js_webapi_2.png)

- browsing context 是一个将 Document 对象呈现给用户的环境；
- 一个标签页或窗口包含一个 browsing context，iframe 或一个 frameset 内的若干 frame 也有独自的浏览上下文；
- 某些情况下会复用 browsing context，比如一个标签页 a 中打开了另一个新标签页 b，并且 a 和 b 属于同一站点；
- 每个 browsing context 有独立的渲染进程和 Event loop；
- 一个 browsing context 有相对应的一个 WindowProxy 对象，WindowProxy 的内部`[[Window]]`插槽值指向 active document 对应的 window 对象，当 browsing context 发生内部导航时，`[[Window]]`插槽值也会随之改变；
- 每一个 Document 对象都关联一个 window 对象，通常是一对一，当 replacement enabled，一个 browsing context 从最初的 about:blank Document 导航到另一个文档时是二对一；
- 一个 browsing context 有一个 session history，session history 记录了对应的 browsing context 中已呈现过的、正在呈现的、或将要呈现的 Document 对象；
- 使用 API 创建的 Document（e.g createDocument() ）没有 browsing context 的，还有其他场景也没有 browsing context（e.g 数据挖掘工具）。

## Nested browsing context

 <!-- <Badge text="内嵌浏览上下文"/> -->

iframe 或一个 frameset 内的若干 frame 产生的是嵌套的浏览上下文。

一个浏览上下文没有嵌套的浏览上下文同时自身也没有父浏览上下文，那么它就是顶级浏览器上下文和祖先浏览器上下文。

## Session history

browsing context 中的 session history 由一个个 session history 条例组成，每个条例至少有一个 URL，可能还具有 serialized state、title、关联的 document、滚动位置、浏览器上下文名称以及与之相关的其他信息。

每个 session history 条例被创建之初，都会有一个关联的 document，不过如果此 document 未被激活，则有可能会被用户代理（通常指浏览器）释放资源空间，当需要被激活时，用户代理会根据 session history 条例中的 URL 等其他信息重新生成一个 document 作为该 session history 条例的关联 document。
