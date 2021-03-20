import React, { useState } from 'react';

/**
 * usage: 在demo中模拟组件重渲
 * const [mockRender] = useMockRender();
 * mockRender(num => num + 1);
 */
export function useMockRender() {
  const [_, mockRender] = useState<number>(0);
  return [mockRender];
}
