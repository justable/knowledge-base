---
title: 文本省略
---

## 代码演示

```tsx
/**
 * title: 单行
 * desc: 单行文本。
 */
import React, { useState } from 'react';
import { TextEllipsis } from 'knowledge-base';

const text =
  '省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号';
export default () => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="border" style={{ width: 500, padding: 24 }}>
      <TextEllipsis title={text}>{text}</TextEllipsis>
    </div>
  );
};
```

```tsx
/**
 * title: 多行
 * desc: 多行文本。
 */
import React, { useState } from 'react';
import { TextEllipsis } from 'knowledge-base';

export default () => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="border" style={{ width: 500, padding: 24, color: 'red' }}>
      <TextEllipsis rows={3}>
        省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号省略号
      </TextEllipsis>
    </div>
  );
};
```
