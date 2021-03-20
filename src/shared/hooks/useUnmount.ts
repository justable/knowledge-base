import { useRef, useEffect } from 'react';

const useUnmount = (fn: () => any): void => {
  const fnRef = useRef(fn);

  // 挂载到ref上，保证umount回调函数的时效性
  fnRef.current = fn;

  useEffect(() => () => fnRef.current(), []);
};

export { useUnmount };
