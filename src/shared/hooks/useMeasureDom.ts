import React, { useCallback, RefCallback } from 'react';

/**
 * 每次dom变化时执行回掉
 * @param callback
 */
export const useMeasureDom = (
  callback: (node: RefCallback<Node | null>) => void,
) => {
  const ref = useCallback(callback, []);
  return [ref];
};
