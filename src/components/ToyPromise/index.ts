// @ts-nocheck
import { isFunction, isObject } from '@/shared/utils';

const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';
// https://segmentfault.com/a/1190000016550260

class ToyPromise {
  static resolve() {
    let promise;

    promise = new ToyPromise((resolve, reject) => {
      this.prototype.resolvePromise(promise, value, resolve, reject);
    });

    return promise;
  }

  static reject() {
    return new ToyPromise((resolve, reject) => {
      reject(reason);
    });
  }

  static deferred() {
    let dfd = {};
    dfd.promise = new ToyPromise((resolve, reject) => {
      dfd.resolve = resolve;
      dfd.reject = reject;
    });
    return dfd;
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

  private status = PENDING;

  private value = null;
  private reason = null;

  private fulfilledCallbacks = [];
  private rejectedCallbacks = [];

  constructor(executor) {
    const resolve = value => {
      this.status = FULFILLED;
      this.value = value;
      fulfilledCallbacks
        .filter(fn => isFunction(fn))
        .forEach(fn => queueMicrotask(() => fn()));
    };
    const reject = reason => {
      this.status = REJECTED;
      this.reason = reason;
      rejectedCallbacks
        .filter(fn => isFunction(fn))
        .forEach(fn => queueMicrotask(() => fn()));
    };
    try {
      executor(resolve, reject);
    } catch (reason) {
      reject(reason);
    }
  }

  /**
   * 统一处理值或thenable
   * @param promise2
   * @param x
   * @param resolve
   * @param reject
   * @returns
   */
  private resolvePromise(promise2, x, resolve, reject) {
    let called = false; // called 防止多次调用
    if (promise2 === x) {
      return reject(new TypeError('循环引用'));
    }
    if (x !== null && (isObject(x) || isFunction(x))) {
      try {
        let then = x.then;
        if (isFunction(then)) {
          then.call(
            x,
            y => {
              // 别人的Promise的then方法可能设置了getter等，使用called防止多次调用then方法
              if (called) return;
              called = true;
              // 成功值y有可能还是promise或者是具有then方法等，再次resolvePromise，直到成功值为基本类型或者非thenable
              this.resolvePromise(promise2, y, resolve, reject);
            },
            reason => {
              if (called) return;
              called = true;
              reject(reason);
            },
          );
        } else {
          if (called) return;
          called = true;
          resolve(x);
        }
      } catch (reason) {
        if (called) return;
        called = true;
        reject(reason);
      }
    } else {
      // x是普通值，直接resolve
      resolve(x);
    }
  }

  then(onFulfilled, onRejected) {
    if (this.status === PENDING) {
      this.fulfilledCallbacks.push(() => onFulfilled(this.value));
      this.rejectedCallbacks.push(() => onRejected(this.reason));
    } else if (this.status === FULFILLED) {
      queueMicrotask(() => onFulfilled(value));
    } else if (this.status === REJECTED) {
      queueMicrotask(() => onRejected(reason));
    }
    let promise2 = new ToyPromise((resolve, reject) => {
      if (this.state === PENDING) {
        this.fulfilledCallbacks.push(() => {
          try {
            let x = onFulfilled(this.value);
            this.resolvePromise(promise2, x, resolve, reject);
          } catch (reason) {
            reject(reason);
          }
        });
        this.rejectedCallbacks.push(() => {
          try {
            let x = onRejected(this.reason);
            this.resolvePromise(promise2, x, resolve, reject);
          } catch (reason) {
            reject(reason);
          }
        });
      }

      if (this.state === FULFILLED) {
        try {
          let x = onFulfilled(this.value);
          this.resolvePromise(promise2, x, resolve, reject);
        } catch (reason) {
          reject(reason);
        }
      }

      if (this.state === REJECTED) {
        try {
          let x = onRejected(this.reason);
          this.resolvePromise(promise2, x, resolve, reject);
        } catch (reason) {
          reject(reason);
        }
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
