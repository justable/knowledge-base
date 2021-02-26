import useMockRender from './useMockRender';

interface WorkHook {
  memoriedState: any;
  next: WorkHook | undefined;
}

let firstWorkHook: WorkHook = {
  memoriedState: undefined,
  next: undefined,
};

let nextWorkHook = firstWorkHook;

function useMockReducer(reducer: Function, initArg: any, init?: Function) {
  const [mockRender] = useMockRender();
  let current: WorkHook = nextWorkHook;
  if (typeof current.memoriedState === 'undefined') {
    let initState = initArg;
    if (typeof init === 'function') {
      initState = init(initArg);
    }
    current.memoriedState = initState;
  }
  current.next = nextWorkHook = current.next
    ? current.next
    : { memoriedState: undefined, next: undefined };
  let dispatch = (action: any) => {
    current.memoriedState = reducer(current.memoriedState, action);
    nextWorkHook = firstWorkHook;
    mockRender(num => num + 1);
  };
  return [current.memoriedState, dispatch];
}

export default useMockReducer;