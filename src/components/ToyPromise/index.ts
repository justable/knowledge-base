const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';
// https://segmentfault.com/a/1190000016550260
// https://q.shanyue.tech/fe/js/23.html
class ToyPromise {
  static resolve() {}
  static reject() {}

  private status = PENDING;

  private value = null;
  private reason = null;

  private fulfilledCallbacks = [];
  private rejectedCallbacks = [];

  constructor(executor: PromiseConstructor) {
    const resolve = value => {
      this.status = FULFILLED;
      this.value = value;
      fulfilledCallbacks
        .filter(fn => typeof fn === 'function')
        .forEach(fn => queueMicrotask(() => fn()));
    };
    const reject = reason => {
      this.status = REJECTED;
      this.reason = reason;
      rejectedCallbacks
        .filter(fn => typeof fn === 'function')
        .forEach(fn => queueMicrotask(() => fn()));
    };
    executor(resolve, reject);
  }

  then(onFulfilled, onRejected) {
    if (this.status === PENDING) {
      if (typeof onFulfilled === 'function') {
        this.fulfilledCallbacks.push(onFulfilled);
      }
      if (typeof onRejected === 'function') {
        this.rejectedCallbacks.push(onRejected);
      }
    } else if (this.status === FULFILLED) {
      if (typeof onFulfilled === 'function') {
        queueMicrotask(() => onFulfilled(value));
      }
    } else if (this.status === REJECTED) {
      if (typeof onRejected === 'function') {
        queueMicrotask(() => onRejected(reason));
      }
    }
  }

  catch(onRejected) {
    if (this.status === PENDING) {
      if (typeof onRejected === 'function') {
        this.rejectedCallbacks.push(onRejected);
      }
    } else if (this.status === REJECTED) {
      if (typeof onRejected === 'function') {
        queueMicrotask(() => onRejected(reason));
      }
    }
  }
}

export default ToyPromise;
