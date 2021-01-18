---
title: 全局提示
---

## 思考 <Badge>待实现</Badge>

1. 鼠标在信息窗口时延迟关闭（防抖的效果）
2. 接口返回一个函数，再次调用该函数能够手动关闭

## 代码演示

```tsx
/**
 * title: 基本
 * desc: 最简单的用法。
 */
import React, { useState } from 'react';
import { message } from 'knowledge-base';
import { Button, Space } from 'antd';

export default () => {
  return (
    <Space>
      <Button type="primary" onClick={() => message.info('This is a message')}>
        Info
      </Button>
      <Button type="primary" onClick={() => message.warn('This is a message')}>
        Warn
      </Button>
      <Button
        type="primary"
        onClick={() => message.success('This is a message')}
      >
        Success
      </Button>
      <Button type="primary" onClick={() => message.error('This is a message')}>
        Error
      </Button>
      <Button
        type="primary"
        onClick={() => message.loading('This is a message')}
      >
        Loading
      </Button>
    </Space>
  );
};
```
