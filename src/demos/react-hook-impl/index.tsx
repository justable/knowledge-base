import React, { useState, useReducer, useEffect } from 'react';
import useMockReducer from './useMockReducer';
import useMockState from './useMockState';

const INCREMENT = 'INCREMENT';
const DECREMENT = 'DECREMENT';

let reducer = (number: any, action: any) => {
  switch (action.type) {
    case INCREMENT:
      return number + 1;
    case DECREMENT:
      return number - 1;
    default:
      return number;
  }
};
let init = (number: number) => {
  return number;
};

const MockCounter = () => {
  let [number, dispatch] = useMockReducer(reducer, 0, init);
  let [name, setName] = useMockState('计数器');
  return (
    <>
      <p>
        {name}:{number}
      </p>
      <button onClick={() => dispatch({ type: INCREMENT })}>加一</button>
      <button
        onClick={() => {
          dispatch({ type: INCREMENT });
          dispatch({ type: INCREMENT });
        }}
      >
        加一&amp;加一
      </button>
      <button onClick={() => dispatch({ type: DECREMENT })}>减一</button>
      <button onClick={() => setName('计数器' + Date.now())}>改名字</button>
    </>
  );
};
const Counter = () => {
  let [number, dispatch] = useReducer(reducer, 0, init);
  let [name, setName] = useState('计数器');
  return (
    <>
      <p>
        {name}:{number}
      </p>
      <button onClick={() => dispatch({ type: INCREMENT })}>加一</button>
      <button
        onClick={() => {
          dispatch({ type: INCREMENT });
          dispatch({ type: INCREMENT });
        }}
      >
        加一&amp;加一
      </button>
      <button
        onClick={() => {
          setTimeout(() => {
            dispatch({ type: INCREMENT });
            dispatch({ type: INCREMENT });
          }, 0);
        }}
      >
        setTimeout加一&amp;加一
      </button>
      <button onClick={() => dispatch({ type: DECREMENT })}>减一</button>
      <button onClick={() => setName('计数器' + Date.now())}>改名字</button>
    </>
  );
};

const ReactHookImpl: React.FC = () => {
  return (
    <div>
      <div>
        <h3>原始的hooks</h3>
        <Counter></Counter>
      </div>
      <div>
        <h3>模拟的hooks</h3>
        <MockCounter></MockCounter>
      </div>
    </div>
  );
};

export default ReactHookImpl;
