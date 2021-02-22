import React, { useState, useCallback } from 'react';
import './style.less';

interface TextEllipsisProps {
  rows?: number;
  title?: string;
  bottom?: number;
  right?: number;
}

const TextEllipsis: React.FC<TextEllipsisProps> = props => {
  let { children, rows = 1, title, bottom = 0, right = 0 } = props;
  rows = rows < 1 ? 1 : rows;

  const [ellipsisVisible, setEllipsisVisible] = useState(false);
  const measureRef = useCallback(node => {
    if (node !== null) {
      setEllipsisVisible(node.scrollHeight > node.offsetHeight);
    }
  }, []);

  if (rows === 1) {
    return (
      <div className="single-ellipsis" title={title}>
        {children}
      </div>
    );
  }

  const height = `${1.4 * rows}em`;

  return (
    <div
      className="multi-ellipsis"
      ref={measureRef}
      title={title}
      style={{
        lineHeight: '1.4em',
        maxHeight: height,
      }}
    >
      {children}
      {ellipsisVisible && (
        <span className="symbol" style={{ right, bottom }}>
          ...
        </span>
      )}
    </div>
  );
};

export default TextEllipsis;
