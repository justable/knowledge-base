import { useState } from 'react';

function useMockRender() {
  const [_, mockRender] = useState<number>(0);
  return [mockRender];
}

export default useMockRender;
