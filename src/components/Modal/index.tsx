import React, { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { CloseOutlined } from '@ant-design/icons';
import './style.less';

interface CModalProps extends classAndStyleProps {
  visible: boolean;
  onClose?: Function;
  destroyOnClose?: boolean;
  header?: boolean;
  footer?: boolean;
}

interface CModalPortalProps extends CModalProps {
  singleton?: boolean;
  root?: string;
}

const Modal: React.FC<CModalProps> = props => {
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
    <div className="cmodal-container" style={{ ...visibleStyle }}>
      <div className="cmodal-mask" onClick={handleClose}></div>
      <div className="cmodal">
        <div className="cmodal-content">
          <div className="cmodal-close" onClick={handleClose}>
            <CloseOutlined />
          </div>
          {header && <div className="cmodal-header"></div>}
          <div className="cmodal-body">{children}</div>
          {footer && <div className="cmodal-footer"></div>}
        </div>
      </div>
    </div>
  );
};
const ModalPortal: React.FC<CModalPortalProps> = props => {
  const { singleton = false, root = 'cmodal-root', ...restProps } = props;
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
