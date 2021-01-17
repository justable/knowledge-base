import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { CloseOutlined } from '@ant-design/icons';
import './style.less';

interface KBModalProps extends classAndStyleProps {
  visible: boolean;
  onClose?: Function;
  destroyOnClose?: boolean;
  header?: boolean;
  footer?: boolean;
}

interface KBModalPortalProps extends KBModalProps {
  singleton?: boolean;
  root?: string;
}

const Modal: React.FC<KBModalProps> = props => {
  const {
    visible,
    children,
    header,
    footer,
    destroyOnClose = false,
    onClose,
  } = props;
  const visibleStyle = useMemo(() => {
    return visible ? { display: 'block' } : { display: 'none' };
  }, [visible]);
  function handleClose() {
    onClose && onClose();
  }
  if (destroyOnClose && !visible) {
    return null;
  }
  return (
    <div className="kbmodal-container" style={{ ...visibleStyle }}>
      <div className="kbmodal-mask" onClick={handleClose}></div>
      <div className="kbmodal">
        <div className="kbmodal-content">
          <div className="kbmodal-close" onClick={handleClose}>
            <CloseOutlined />
          </div>
          {header && <div className="kbmodal-header"></div>}
          <div className="kbmodal-body">{children}</div>
          {footer && <div className="kbmodal-footer"></div>}
        </div>
      </div>
    </div>
  );
};
const ModalPortal: React.FC<KBModalPortalProps> = props => {
  const { singleton = false, root = 'kbmodal-root', ...restProps } = props;
  const modalRoot = useMemo(() => {
    let r: HTMLElement | null;
    if (singleton) {
      r = document.getElementById(root);
      if (!r) {
        r = document.createElement('div');
        r.id = root;
        document.querySelector('body')!.appendChild(r);
      }
    } else {
      r = document.createElement('div');
      document.querySelector('body')!.appendChild(r);
    }
    return r;
  }, [singleton, root]);

  return ReactDOM.createPortal(<Modal {...restProps} />, modalRoot);
};

export default ModalPortal;
