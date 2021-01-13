export function isFunction(argv: any) {
  return typeof argv === 'function';
}

export function isObject(argv: any) {
  return Object.prototype.toString.call(argv) === '[object Object]';
}
