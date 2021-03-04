# MutationObserver

> MutationObserver 接口提供了监视对 DOM 树所做更改的能力。

## 类型定义

```typescript
interface MutationCallback {
  (mutations: MutationRecord[], observer: MutationObserver): void;
}
// 参考https://developer.mozilla.org/zh-CN/docs/Web/API/MutationRecord
interface MutationRecord {
  readonly addedNodes: NodeList;
  readonly attributeName: string | null;
  readonly attributeNamespace: string | null;
  readonly nextSibling: Node | null;
  readonly oldValue: string | null;
  readonly previousSibling: Node | null;
  readonly removedNodes: NodeList;
  readonly target: Node;
  readonly type: 'attributes' | 'characterData' | 'childList';
}
interface MutationObserver {
  disconnect(): void;
  observe(target: Node, options?: MutationObserverInit): void;
  takeRecords(): MutationRecord[];
}
// childList、attributes、characterData 三个属性之中必须有一个为 true，否则会抛出 TypeError 异常
interface MutationObserverInit {
  // 指定特定dom的属性名称，只有指定的属性发生变化才会触发通知，默认所有属性
  attributeFilter?: string[];
  // 当指定属性变化时，记录旧值，默认 false
  attributeOldValue?: boolean;
  // 设为 true 以观察受监视元素的属性值变更，默认 false
  attributes?: boolean;
  // 设为 true 以监视指定目标节点或子节点树中节点所包含的字符数据的变化，默认 false
  characterData?: boolean;
  // 设为 true 以在文本在受监视节点上发生更改时记录节点文本的先前值，默认 false
  characterDataOldValue?: boolean;
  // 设为 true 以监视目标节点（如果 subtree 为 true，则包含子孙节点）添加或删除新的子节点，默认 false
  childList?: boolean;
  // 设为 true 以将监视范围扩展至目标节点整个节点树中的所有节点，默认 false
  subtree?: boolean;
}
```

## new MutationObserver(callback: MutationCallback)

创建并返回一个新的观察器，接收一个回调函数，当被观察的 dom 改变时会调用这个回调函数。

## mutationObserver.observe(target: Node, options?: MutationObserverInit)

开始观察指定的 dom 节点，创建一个新观察器后必须调用此方法开启观察，MutationObserverInit 中的 childList、attributes、characterData 三个属性之中必须有一个为 true，否则会抛出 TypeError 异常。

## mutationObserver.disconnect()

停止观察，直到再次调用 observe 方法。

## mutationObserver.takeRecords()

返回已检测到但还未被观察者执行回调函数的 dom 变动列表，使变动队列保持为空。此方法最常见的使用场景是在停止观察之前立即获取所有未处理的变动记录，以便在停止观察时可以处理任何未处理的变动。

```javascript
var observer = new MutationObserver(callback);
observer.observe(targetNode, observerOptions);
var mutations = observer.takeRecords();
if (mutations) {
  callback(mutations);
}
// 停止观察前把未回调处理的手动处理一遍
observer.disconnect();
```

## 完整例子

实现可编辑 dom 节点中，自动把 url 转换成 a 标签

```html
<div contenteditable>
  <p>可以编辑</p>
</div>
<script>
  const observer = new MutationObserver(function(mutations) {
    for (const i = 0; i < mutations.length; i++) {
      replaceLinks(mutations[i].target);
    }
  });
  observer.observe(document.querySelector('[contenteditable]'), {
    characterData: true,
    subtree: true,
  });
  const replaceLinks = debounce(function(target) {
    const content = target.textContent.replace(
      /(.*)\[([^\]]+)\]\(([^\]]+)\)(.*)/g,
      "$1<a href='$3'>$2</a>$4",
    );
    if (content !== target.textContent) {
      const newNode = document.createElement('template');
      newNode.innerHTML = content;
      target.parentElement.replaceChild(newNode.content, target);
    }
  });
</script>
```
