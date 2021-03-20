declare module '*.css';
declare module '*.less';

interface classAndStyleProps {
  className?: string;
  style?: React.CSSProperties;
}

interface NoArgFn<T> {
  (): T;
}
