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

export function memorize(fn: Function) {
  const cache: Record<string, any> = {};
  return function(...args: any[]) {
    const key = JSON.stringify(args);
    return cache[key] || (cache[key] = fn.apply(null, args));
  };
}

export function isPlainObject(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  let proto = obj;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(obj) === proto;
}

export function flat(arr: any[], depth = 1): any[] {
  return arr.reduce((result, item) => {
    if (depth > 0 && Array.isArray(item)) {
      return [...result, ...flat(item, depth - 1)];
    }
    return [...result, item];
  }, []);
}

export function wrapPromise(promise: Promise<any>) {
  let status = 'pending';
  let result: any;
  let suspender = promise.then(
    r => {
      status = 'success';
      result = r;
    },
    e => {
      status = 'error';
      result = e;
    },
  );
  return {
    read() {
      if (status === 'pending') {
        throw suspender;
      } else if (status === 'error') {
        throw result;
      } else if (status === 'success') {
        return result;
      }
    },
  };
}

export const getUuid = (a: string = ''): string =>
  a
    ? /* eslint-disable no-bitwise */
      ((Number(a) ^ (Math.random() * 16)) >> (Number(a) / 4)).toString(16)
    : `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, getUuid);

export function fillRef<T>(ref: React.Ref<T>, node: T) {
  if (typeof ref === 'function') {
    ref(node);
  } else if (typeof ref === 'object' && ref && 'current' in ref) {
    (ref as any).current = node;
  }
}

export function composeRef<T>(...refs: React.Ref<T>[]): React.Ref<T> {
  return (node: T) => {
    refs.forEach(ref => {
      fillRef(ref, node);
    });
  };
}

export function invariant(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

export const isClient = typeof window === 'object';
