import { isString, isObject } from './helper';

function _get(obj: any, exps: string) {
  if (!isString(exps) || !isObject(obj)) return obj;
  let res = obj;
  const arr = exps.split('.');
  for (let i = 0; i < arr.length; i++) {
    const exp = arr[i];
    if (res[exp]) {
      res = res[exp];
    } else {
      return undefined;
    }
  }
  return res;
}

const lodash = {
  get: _get,
};

export default lodash;
