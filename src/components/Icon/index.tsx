import React from 'react';
import classNames from 'classnames';
import styles from './style.less';

export interface IconProps extends classAndStyleProps {
  type: string;
}

const script = document.createElement('script');
script.src = '//at.alicdn.com/t/font_773315_48hfd1i31lv.js';
document.body.appendChild(script);

const Icon: React.FC<IconProps> = ({ className, style, type }) => {
  return (
    <svg
      className={classNames(styles.icon, className)}
      style={style}
      aria-hidden="true"
    >
      <use xlinkHref={`#${type}`} />
    </svg>
  );
};

export default Icon;
