export default () => {
  const controller = {};

  const promise = new Promise((resolve, reject) => {
    controller.resolve = argv => resolve(argv);
    controller.reject = argv => reject(argv);
  });

  promise
    .then(argv => Promise.reject('err1'))
    .then(argv => console.log(argv))
    .catch(reason => console.log(reason));

  controller.resolve('aaa');
};
