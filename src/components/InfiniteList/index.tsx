import React, { ReactNode } from 'react';

interface InfiniteListProps<S = any> {
  trigger: number;
  source: S[];
  render: (item: S) => ReactNode;
}
