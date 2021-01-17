---
title: Modal
order: 1
---

## 代码演示

```tsx
/**
 * title: 基本
 * desc: 最简单的用法。
 */
import React, { useState } from 'react';
import { KBModal } from 'knowledge-base';
import { Button } from 'antd';

export default () => {
  const [visible, setVisible] = useState(false);
  const [visible2, setVisible2] = useState(false);
  return (
    <div>
      <Button onClick={() => setVisible(true)}>弹窗</Button>
      <KBModal visible={visible} onClose={() => setVisible(false)}>
        <input />
      </KBModal>
    </div>
  );
};
```

```tsx
/**
 * title: destroyOnClose
 * desc: 关闭时销毁 Modal 里的子元素。
 */
import React, { useState } from 'react';
import { KBModal } from 'knowledge-base';
import { Button } from 'antd';

export default () => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <Button onClick={() => setVisible(true)}>弹窗</Button>
      <KBModal
        visible={visible}
        destroyOnClose={true}
        onClose={() => setVisible(false)}
      >
        <input />
      </KBModal>
    </div>
  );
};
```
