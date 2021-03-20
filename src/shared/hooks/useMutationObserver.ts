import React, { useEffect, useLayoutEffect, DependencyList } from 'react';

export const useMutationObserver = (
  node: { current: Node | null },
  options: MutationObserverInit,
  callback: Function,
) => {
  let observer: MutationObserver;
  useLayoutEffect(() => {
    if (!node.current || observer) {
      return;
    }
    observer = new MutationObserver(() => {
      // 不要在callback中修改dom，否则会死循环
      callback();
    });
    observer.observe(node.current, options);
  }, []);
};
