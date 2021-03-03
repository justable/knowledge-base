# Performance

> https://developer.mozilla.org/zh-CN/docs/Web/API/Performance

- 测量代码耗时

```ts
async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}
async function usePerformanceEntryMethods() {
  console.log('PerformanceEntry tests ...');
  if (performance.mark === undefined) {
    console.log('... performance.mark Not supported');
    return;
  }
  performance.mark('Begin1');
  await sleep(1000);
  performance.mark('End1');
  performance.mark('Begin2');
  await sleep(1000);
  performance.mark('End2');
  await sleep(1000);
  performance.mark('End3');

  // let p = performance.getEntries();
  // let p = performance.getEntries({name : "Begin1", entryType: "mark"});
  let marks = performance.getEntriesByType('mark');
  performance.measure('block1', 'Begin1', 'End1');
  performance.measure('block2', 'Begin2', 'End2');
  performance.measure('block3', 'End2', 'End3');
  // let p = performance.getEntriesByName("Begin1", "mark");
  let block1 = performance.getEntriesByName('block1');
  let block2 = performance.getEntriesByName('block2');
  let block3 = performance.getEntriesByName('block3');
  console.log('setTimeout milliseconds:', block1[0].duration);
  console.log('setTimeout milliseconds:', block2[0].duration);
  console.log('setTimeout milliseconds:', block3[0].duration);
  // 清除存储的标志位
  performance.clearMarks();
  performance.clearMeasures();
}
```

- 页面耗时指标

```js
const navTimes = performance.getEntriesByType('navigation');
```

- 页面异步资源耗时指标

```js
const resourceTimes = performance.getEntriesByType('resource');
```

- Performance.timing 和 Performance.getEntriesByName()

前者过时了，参考[讨论](https://stackoverflow.com/questions/56623539/get-navigation-timing-backward-forward-compatible-convert-from-epoch-to-hr-tim)。
