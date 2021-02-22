---
title: 模态框
order: 1
---

## 代码演示

```tsx
/**
 * title: 基本
 * desc: 最简单的用法。
 */
import React, { useState } from 'react';
import { Modal } from 'knowledge-base';
import { Button } from 'antd';

export default () => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <Button onClick={() => setVisible(true)}>弹窗</Button>
      <Modal visible={visible} onClose={() => setVisible(false)}>
        <input />
      </Modal>
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
import { Modal } from 'knowledge-base';
import { Button } from 'antd';

export default () => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <Button onClick={() => setVisible(true)}>弹窗</Button>
      <Modal
        visible={visible}
        destroyOnClose={true}
        onClose={() => setVisible(false)}
      >
        <input />
      </Modal>
    </div>
  );
};
```
