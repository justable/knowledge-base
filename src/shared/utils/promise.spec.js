import ToyPromise from './promise';

describe('ToyPromise tests', () => {
  it('should call executor immediately', () => {
    const executor = jest.fn();
    new ToyPromise(executor);
    expect(executor).toHaveBeenCalled();
  });

  it('should not call then while pending', () => {
    const thenFn = jest.fn();
    const promise = new ToyPromise(jest.fn());
    promise.then(thenFn);
    expect(thenFn).not.toHaveBeenCalled();
  });

  it('should call then while fulfilled', () => {
    const controller = {};
    const executor = (resolve, reject) => {
      controller.resolved = () => resolve('success');
    };
    const onFulfilled = jest.fn(value => expect(value).toBe('success'));
    const promise = new ToyPromise(executor);
    promise.then(onFulfilled);

    expect(onFulfilled).not.toHaveBeenCalled();
    controller.resolved();
  });

  it('should call then while rejected', () => {
    const controller = {};
    const executor = (resolve, reject) => {
      controller.rejected = () => reject('failed');
    };
    const onRejected = jest.fn(reason => expect(reason).toBe('failed'));
    const promise = new ToyPromise(executor);
    promise.then(jest.fn(), onRejected);

    expect(onRejected).not.toHaveBeenCalled();
    controller.rejected();
  });

  it('should call catch while rejected', () => {
    const controller = {};
    const executor = (resolve, reject) => {
      controller.rejected = () => reject('failed');
    };
    const onRejected = jest.fn(reason => expect(reason).toBe('failed'));
    const promise = new ToyPromise(executor);
    promise.catch(onRejected);

    expect(onRejected).not.toHaveBeenCalled();
    controller.rejected();
  });

  it('Promise.all', function() {
    const promise1 = new ToyPromise((resolve, reject) => {
      setTimeout(() => {
        resolve('111');
      }, 100);
    });
    const promise2 = new ToyPromise((resolve, reject) => {
      setTimeout(() => {
        resolve('222');
      }, 200);
    });
    const promise3 = new ToyPromise((resolve, reject) => {
      setTimeout(() => {
        resolve('333');
      }, 1000);
    });
    ToyPromise.all([promise1, promise2, promise3]).then(values =>
      expect(values).equal(['111', '222', '333']),
    );
  });

  it('Promise.race', function() {
    const promise1 = new ToyPromise((resolve, reject) => {
      setTimeout(() => {
        resolve('111');
      }, 100);
    });
    const promise2 = new ToyPromise((resolve, reject) => {
      setTimeout(() => {
        resolve('222');
      }, 200);
    });
    const promise3 = new ToyPromise((resolve, reject) => {
      setTimeout(() => {
        resolve('333');
      }, 1000);
    });
    ToyPromise.race([promise1, promise2, promise3]).then(value =>
      expect(value).toBe('111'),
    );
  });

  it('Promise穿透', function() {
    new ToyPromise((resolve, reject) => {
      resolve('111');
    })
      .then()
      .then(value => {
        expect(value).toBe('111');
      });
  });

  it('没有被消费的value或reason会冒泡给下一个', function() {
    ToyPromise.reject('err1')
      .then(value => {})
      .catch(reason => expect(reason).toBe('err1'));
  });

  it('call chain as expected', function() {
    ToyPromise.resolve('111')
      .then(value => {
        expect(value).toBe('111');
        throw 'err1';
      })
      .catch(reason => {
        expect(reason).toBe('err1');
        throw 'err2';
      })
      .catch(reason => expect(reason).toBe('err2'));
  });
});
