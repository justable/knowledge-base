export { default as ToyPromise } from './promise';

export { default as compose } from './compose';

export { default as lodash } from './lodash';

export function isFunction(argv: any) {
  return typeof argv === 'function';
}

export function isObject(argv: any) {
  return Object.prototype.toString.call(argv) === '[object Object]';
}

export function isString(argv: any) {
  return typeof argv === 'string';
}

export function isArray(argv: any) {
  return Object.prototype.toString.call(argv) === '[object Array]';
}

export function isThenable(argv: any) {
  return (
    argv !== null &&
    (isObject(argv) || isFunction(argv)) &&
    isFunction(argv.then)
  );
}

export function hashStr(s: string) {
  let hash = 0;
  if (s.length == 0) return hash;
  for (let i = 0; i < s.length; i++) {
    let char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export function cloneDeep(obj: any, mode?: string): any {
  if (mode === 'json') {
    return JSON.parse(JSON.stringify(obj));
  } else {
    let target: Record<string, any> = {};
    if (isObject(obj)) {
      for (let key in obj) {
        let item = obj[key];
        target[key] = cloneDeep(item);
      }
      return target;
    } else if (isArray(obj)) {
      return (obj as any[]).map(item => cloneDeep(item));
    } else {
      return obj;
    }
  }
}

export function runGenerator(gen: () => Generator) {
  // 暂不处理await右边是PromiseLike的情况
  return new Promise((resolve, reject) => {
    const iterator = gen();
    try {
      let next = iterator.next();
      while (!next.done) {
        next = iterator.next(next.value);
      }
      resolve(next.value);
    } catch (reason) {
      reject(reason);
    }
  });
}
