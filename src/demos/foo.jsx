class ToyPromise {
  static resolve() {}

  static reject() {}

  status = 'PENDING';

  constructor(a: PromiseConstructor) {
    const resolve = value => {
      this.status = 'RESOLVED';
    };
  }

  then() {}

  catch() {}
}

new Promise((resolve, reject) => {});

Promise.resolve();

Promise.reject();

Promise.resolve()
  .then(value => value)
  .then(value => value);

Promise.reject()
  .catch(err => err)
  .catch(err => err);
