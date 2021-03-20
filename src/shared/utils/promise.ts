//@ts-nocheck
import { isFunction, isThenable } from './helper';

const PENDING = Symbol.for('pending');
const FULFILLED = Symbol.for('fulfilled');
const REJECTED = Symbol.for('rejected');

// https://segmentfault.com/a/1190000016550260
namespace InternalVars {
  export type Resolve<T> = (value: T | PromiseLike<T>) => void;
  export type Reject = (reason?: any) => void;
  export type Executor<T> = (resolve: Resolve<T>, reject: Reject) => void;

  export type Value<T> = T | PromiseLike<T> | undefined;
}

interface ToyPromise<T> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): ToyPromise<TResult1 | TResult2>;
  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null,
  ): ToyPromise<T | TResult>;
}

interface ToyPromiseConstructor {
  readonly prototype: ToyPromise<any>;
  new <T>(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: any) => void,
    ) => void,
  ): ToyPromise<T>;
  reject<T = never>(reason?: any): ToyPromise<T>;
  resolve(): ToyPromise<void>;
  resolve<T>(value: T | PromiseLike<T>): ToyPromise<T>;
}

function resolvePromise(promise2, x, resolve, reject) {
  // 防止多次调用
  let called = false;
  if (promise2 === x) {
    return reject(new TypeError('循环引用'));
  }
  if (isThenable(x)) {
    x.then.call(
      x,
      value => {
        // 别人的Promise的then方法可能设置了getter等，使用called防止多次调用then方法
        if (called) return;
        called = true;
        // 成功值value有可能还是promise或者是具有then方法等，再次resolvePromise，直到成功值为基本类型或者非thenable
        resolvePromise(promise2, value, resolve, reject);
      },
      reason => {
        if (called) return;
        called = true;
        reject(reason);
      },
    );
  } else {
    resolve(x);
  }
}

class ToyPromise {
  private status = PENDING;
  private value;
  private reason;
  private fulfilledCallbacks = [];
  private rejectedCallbacks = [];

  static resolve() {
    const promise = new ToyPromise((resolve, reject) => {
      resolvePromise(promise, value, resolve, reject);
    });
    return promise;
  }

  static reject() {
    return new ToyPromise((resolve, reject) => {
      reject(reason);
    });
  }

  static all(promiseArr) {
    return new ToyPromise((resolve, reject) => {
      let result = [];
      promiseArr.forEach((promise, index) => {
        promise.then(value => {
          result[index] = value;
          if (result.length === promiseArr.length) {
            resolve(result);
          }
        }, reject);
      });
    });
  }

  static race(promiseArr) {
    return new ToyPromise((resolve, reject) => {
      promiseArr.forEach(promise => {
        promise.then(value => {
          resolve(value);
        }, reject);
      });
    });
  }

  static deferred() {
    let dfd = {};
    dfd.promies = new ToyPromise((resolve, reject) => {
      dfd.resolve = resolve;
      dfd.reject = reject;
    });
    return dfd;
  }

  constructor(executor) {
    const resolve = value => {
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
        this.fulfilledCallbacks.forEach(fn => fn());
      }
    };
    const reject = reason => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        this.rejectedCallbacks.forEach(fn => fn());
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then(onFulfilled, onRejected) {
    const self = this;
    // 这样没有被消费的value或reason才会冒泡给下一个
    onFulfilled = isFunction(onFulfilled) ? onFulfilled : value => value;
    onRejected = isFunction(onFulfilled)
      ? onRejected
      : reason => {
          throw new Error(reason instanceof Error ? reason.message : reason);
        };
    const promise2 = new ToyPromise((resolve, reject) => {
      if (self.status === PENDING) {
        self.fulfilledCallbacks.push(() =>
          queueMicrotask(() => {
            const x = onFulfilled(self.value);
            resolvePromise(promise2, x, resolve, reject);
          }),
        );
        self.rejectedCallbacks.push(() =>
          queueMicrotask(() => {
            const x = onRejected(self.reason);
            resolvePromise(promise2, x, resolve, reject);
          }),
        );
      } else if (self.status === FULFILLED) {
        queueMicrotask(() => {
          const x = onFulfilled(self.value);
          resolvePromise(promise2, x, resolve, reject);
        });
      } else if (self.status === REJECTED) {
        queueMicrotask(() => {
          const x = onRejected(self.reason);
          resolvePromise(promise2, x, resolve, reject);
        });
      }
    });

    return promise2;
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(onFinal) {
    return this.then(
      value => {
        onFinal();
        return value;
      },
      reason => {
        onFinal();
        throw reason;
      },
    );
  }

  done() {
    this.catch(reason => {
      throw reason;
    });
  }
}

export default ToyPromise;
