# 我对 fiber 的理解

fiber 之前，React 的 Reconciliation 阶段是个递归过程，不可被打断，React 要在这个过程遍历所有节点树并与之前的状态作 diff 得到 patches，整个过程是个相对耗时的工作，这就导致会阻塞浏览器渲染线程。通常的屏幕为每秒 60 帧，如果某一帧的执行时间超过了 1/60 秒，就会出现卡顿从而影响用户体验。

fiber 的出现就是为了解决这问题的，React 为组件树创建一棵与之对应的 fiber 树（链表），每个 fiber 节点都存储了与之对应的组件节点渲染所需的必要数据。

开始 Reconciliation 阶段后，React 渲染引擎遍历 fiber 树，由于 fiber 树的存储结构是链表，这整个遍历过程是可中断与恢复的，React 又为此设计出了一套任务调度体系，fiber 就是这套任务调度体系的最小任务单元。

Reconciliation 阶段的可中断性，宏观上就出现了时间分片的概念，React 把原本 Reconciliation 阶段一大块耗时时间合理的切分 为若干片，配合 requestIdleCallback 等 WebApi 均摊到多个渲染帧中从而使 React 怎个渲染过程更加流畅。
