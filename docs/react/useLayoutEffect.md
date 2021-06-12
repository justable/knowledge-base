# useLayoutEffect

## 对比例子

```js
export default function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log(`useEffect - count=${count}`);
    // 耗时的操作
    const pre = Date.now();
    while (Date.now() - pre < 500) {}

    // count为0时重新生成个随机数
    if (count === 0) {
      setCount(10 + Math.random() * 200);
    }
  }, [count]);

  // 点击DIV重置count
  return <div onClick={() => setCount(0)}>{count}</div>;
}
```

```js
export default function App() {
  const [count, setCount] = useState(0);

  useLayoutEffect(() => {
    console.log(`useLayoutEffect - count=${count}`);
    // 耗时的操作
    const pre = Date.now();
    while (Date.now() - pre < 500) {}

    if (count === 0) {
      setCount(10 + Math.random() * 200);
    }
  }, [count]);

  return <div onClick={() => setCount(0)}>{count}</div>;
}
```

## 特点

- useLayoutEffect 和 componentDidMount 和 componentDidUpdate 触发时机一致，且都是是同步执行，都在 DOM 修改后且浏览器渲染之前（即在 commit 阶段立即执行，会阻塞浏览器渲染）；
- useLayoutEffect 要比 useEffect 更早的触发执行；
- 除非要修改 DOM 并且不让用户看到修改 DOM 的过程，才考虑使用 useLayoutEffect，否则应当使用 useEffect。如果只是为了获取 DOM 属性（或其它 get 操作），则没必要使用 useLayoutEffect，应当使用 useEffect。
