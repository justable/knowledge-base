import useMockReducer from './useMockReducer';

function useMockState(initialState: any) {
  return useMockReducer((state: any, action: any) => {
    return action;
  }, initialState);
}

export default useMockState;
