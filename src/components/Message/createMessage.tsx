import React, { useState, useEffect, ComponentType } from 'react';
import ReactDOM from 'react-dom';
import {
  InfoCircleFilled,
  ExclamationCircleFilled,
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
} from '@ant-design/icons';
import './style.less';

type MessageOptions = {
  msg: string;
  ms?: number;
};
interface MessageProps extends MessageOptions {
  type: 'info' | 'warn' | 'success' | 'error' | 'loading';
  destroy: () => void;
}

function getIcon(type: MessageProps['type']) {
  switch (type) {
    case 'info':
      return <InfoCircleFilled style={{ color: '#1890ff' }} />;
    case 'warn':
      return <ExclamationCircleFilled style={{ color: '#faad14' }} />;
    case 'success':
      return <CheckCircleFilled style={{ color: '#52c41a' }} />;
    case 'error':
      return <CloseCircleFilled style={{ color: '#ff4d4f' }} />;
    case 'loading':
      return <LoadingOutlined style={{ color: '#1890ff' }} />;
    default:
      return null;
  }
}

const Message: React.FC<MessageProps> = props => {
  const { msg, ms = 3000, type, destroy } = props;
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (ms > 0) {
      setTimeout(() => setVisible(false), ms);
    }
  }, []);
  useEffect(() => {
    if (!visible) {
      // 销毁实例
      destroy();
    }
  }, [visible]);
  if (!visible) return null;
  return (
    <div className="cmessage-content">
      <span style={{ margin: '0 5px' }}>{getIcon(type)}</span>
      {msg}
    </div>
  );
};

let portalRoot: HTMLElement | null = null;
function getRootNode() {
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.classList.add('cmessage-root');
    document.querySelector('body')?.appendChild(portalRoot);
  }
  const root = document.createElement('div');
  root.classList.add('cmessage');
  portalRoot?.appendChild(root);
  return root;
}
function createMessage(options: MessageOptions, type: MessageProps['type']) {
  const root = getRootNode();
  function destroy() {
    ReactDOM.unmountComponentAtNode(root);
    if (root.parentNode) {
      root.parentNode.removeChild(root);
    }
  }
  ReactDOM.render(<Message {...options} type={type} destroy={destroy} />, root);
}

export default createMessage;
