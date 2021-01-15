export function syncSleep(ms: number, mode?: string) {
  if (mode === 'next') {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } else {
    const start = new Date().getTime();
    while (new Date().getTime() - start < ms) {
      continue;
    }
  }
}

export function asyncSleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sleep(ms: number, mode = 'async') {
  return mode === 'async' ? asyncSleep(ms) : syncSleep(ms);
}

export default sleep;
