import { isFunction } from '@/shared/utils';

const PENDING = Symbol.for('pending');
const FULFILLED = Symbol.for('fulfilled');
const REJECTED = Symbol.for('rejected');

// https://segmentfault.com/a/1190000038290791
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

class _Promise<T> {
  private status = PENDING;
  private value: InternalVars.Value<T>;
  private reason: any;

  static resolve() {
    return new _Promise((resolve, _) => {});
  }

  static reject() {}

  constructor(executor: InternalVars.Executor<T>) {
    const resolve: InternalVars.Resolve<T> = value => {
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
      }
    };
    const reject: InternalVars.Reject = reason => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
      }
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then: ToyPromise<T>['then'] = (onFulfilled, onRejected) => {
    onFulfilled = isFunction(onFulfilled) ? onFulfilled : value => value;
    return new _Promise((resolve, reject) => {});
  };

  catch: ToyPromise<T>['catch'] = onRejected => {
    return new _Promise((_, reject) => {});
  };
}

export default _Promise;
