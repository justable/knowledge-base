import React, { useCallback, useState, RefCallback } from 'react';

function useMeasure<T>(): [T | null, RefCallback<T>] {
  const [node, setNode] = useState<T | null>(null);
  const ref = useCallback(node => {
    if (node) {
      setNode(node);
    }
  }, []);
  return [node, ref];
}
