import React, {
  useState,
  useReducer,
  useEffect,
  useRef,
  Reducer,
  PropsWithChildren,
} from 'react';
import classNames from 'classnames';
import { invariant } from '@/shared/utils';
import styles from './style.less';

type AvatarShape = 'circle' | 'square';
type AvatarSize = number | 'large' | 'small' | 'default';
export interface AvatarProps extends classAndStyleProps {
  icon?: JSX.Element;
  shape?: AvatarShape;
  size?: AvatarSize;
  src?: string;
  srcSet?: string;
  alt?: string;
  onError?: NoArgFn<boolean>;
  gap?: number;
}

interface avatarState {
  scale?: string;
  isImgExist: Boolean;
}

function reducer(state: avatarState, action: Partial<avatarState>) {
  return {
    ...state,
    ...action,
  };
}
function useAvatarProps({
  icon,
  shape,
  size,
  src,
  srcSet,
  alt,
  onError,
  gap,
  children,
}: PropsWithChildren<AvatarProps>) {
  const [avatarState, dispatchAvatarState] = useReducer(reducer, {
    isImgExist: true,
  });
  const childRef = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    dispatchAvatarState({
      isImgExist: true,
      scale: 'scale(1)',
    });
  }, [src]);
  useEffect(() => {
    if (!childRef.current || !wrapperRef.current) {
      return;
    }
    const childWidth = childRef.current!.offsetWidth;
    const wrapperWidth = wrapperRef.current!.offsetWidth;
    let scale;
    if (childWidth > gap! * 2) {
      if (wrapperWidth > childWidth + gap! * 2) {
        scale = 'scale(1)';
      } else {
        scale = `scale(${(wrapperWidth - gap! * 2) / childWidth})`;
      }
      dispatchAvatarState({
        scale,
      });
    }
  }, [children, gap, size, avatarState.isImgExist]);

  let childToRender;
  let wrapperClass = [
    styles.avatar,
    {
      [styles.avatarImage]: src && avatarState.isImgExist,
      [styles.avatarIcon]: icon,
      [styles.avatarCircle]: shape === 'circle',
      [styles.avatarSquare]: shape === 'square',
      [styles.avatarLG]: size === 'large',
      [styles.avatarSM]: size === 'small',
    },
  ];
  const sizeStyle =
    typeof size === 'number'
      ? {
          width: size,
          height: size,
          lineHeight: `${size}px`,
          fontSize: icon ? size / 2 : 18,
        }
      : {};
  const scaleStyle = {
    transform: `${avatarState.scale} translateX(-50%)`,
  };
  function handleImgLoadError() {
    const fallback = onError ? onError() : true;
    fallback &&
      dispatchAvatarState({
        isImgExist: false,
      });
  }
  if (src && avatarState.isImgExist) {
    childToRender = (
      <img src={src} srcSet={srcSet} alt={alt} onError={handleImgLoadError} />
    );
  } else if (icon) {
    childToRender = icon;
  } else {
    childToRender = (
      <span
        className={styles.avatarString}
        style={{
          ...scaleStyle,
        }}
        ref={childRef}
      >
        {children}
      </span>
    );
  }
  const avatar = (
    <span
      className={classNames(wrapperClass)}
      style={{
        ...sizeStyle,
      }}
      ref={wrapperRef}
    >
      {childToRender}
    </span>
  );
  return [avatar];
}
const Avatar: React.FC<PropsWithChildren<AvatarProps>> = props => {
  const [avatar] = useAvatarProps(props);
  return avatar;
};

Avatar.defaultProps = {
  shape: 'circle',
  size: 'default',
  gap: 4,
};

export default Avatar;
