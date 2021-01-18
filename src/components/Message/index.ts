import createMessage from './createMessage';

const message = {
  info(msg: string, ms?: number) {
    return createMessage({ msg, ms }, 'info');
  },
  warn(msg: string, ms?: number) {
    return createMessage({ msg, ms }, 'warn');
  },
  success(msg: string, ms?: number) {
    return createMessage({ msg, ms }, 'success');
  },
  error(msg: string, ms?: number) {
    return createMessage({ msg, ms }, 'error');
  },
  loading(msg: string, ms?: number) {
    return createMessage({ msg, ms }, 'loading');
  },
};

export default message;
