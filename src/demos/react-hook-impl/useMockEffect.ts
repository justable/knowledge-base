interface WorkHook {
  memoriedState: any;
  next: WorkHook | undefined;
}

let firstWorkHook: WorkHook = {
  memoriedState: undefined,
  next: undefined,
};

let nextWorkHook = firstWorkHook;

function useMockEffect(callback: Function, dependencies?: any[]) {
  if (typeof dependencies === 'undefined') {
    return callback();
  }
  let current = nextWorkHook;
  let memoriedDependencies = current.memoriedState;
  if (typeof memoriedDependencies === 'undefined') {
    current.memoriedState = dependencies;
    callback();
  } else {
    if (
      !dependencies.every((item, index) => item === memoriedDependencies[index])
    ) {
      callback();
      current.memoriedState = dependencies;
    }
  }
  current.next = nextWorkHook = current.next
    ? current.next
    : { memoriedState: undefined, next: undefined };
}
