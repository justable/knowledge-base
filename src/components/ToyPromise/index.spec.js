import ToyPromise from '.';

it('should call executor immediately', () => {
  const executor = jest.fn();
  new ToyPromise(executor);
  expect(executor).toHaveBeenCalled();
});

it('should not call then when pending', () => {
  const thenFn = jest.fn();
  const promise = new ToyPromise(jest.fn());
  promise.then(thenFn);
  expect(thenFn).not.toHaveBeenCalled();
});

it('should call then when fulfilled', () => {
  const controller = {};
  const executor = (resolve, reject) => {
    controller.resolved = () => resolve('success');
  };
  const onFulfilled = jest.fn(value => expect(value).toBe('success'));
  const promise = new ToyPromise(executor);
  promise.then(onFulfilled);

  expect(onFulfilled).not.toHaveBeenCalled();
  controller.resolved();
  expect(onFulfilled).toHaveBeenCalled();
});

it('should call then when rejected', () => {
  const controller = {};
  const executor = (resolve, reject) => {
    controller.rejected = () => reject('failed');
  };
  const onRejected = jest.fn(reason => expect(reason).toBe('failed'));
  const promise = new ToyPromise(executor);
  promise.then(jest.fn(), onRejected);

  expect(onRejected).not.toHaveBeenCalled();
  controller.rejected();
  expect(onRejected).toHaveBeenCalled();
});

it('should call catch when rejected', () => {
  const controller = {};
  const executor = (resolve, reject) => {
    controller.rejected = () => reject('failed');
  };
  const onRejected = jest.fn(reason => expect(reason).toBe('failed'));
  const promise = new ToyPromise(executor);
  promise.catch(onRejected);

  expect(onRejected).not.toHaveBeenCalled();
  controller.rejected();
  expect(onRejected).toHaveBeenCalled();
});
