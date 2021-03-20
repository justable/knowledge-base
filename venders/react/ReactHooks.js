import {invariant} from '../shared'
import ReactCurrentDispatcher from './ReactCurrentDispatcher'

function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current
  invariant(
    dispatcher !== null,
    'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
      ' one of the following reasons:\n' +
      '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
      '2. You might be breaking the Rules of Hooks\n' +
      '3. You might have more than one copy of React in the same app\n' +
      'See https://fb.me/react-invalid-hook-call for tips about how to debug and fix this problem.'
  )
  return dispatcher
}

export function useContext(Context) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useContext(Context)
}

export function useState(initialState) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useState(initialState)
}

export function useReducer(reducerx, initialArg, init) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useReducer(reducer, initialArg, init)
}

export function useRef(initialValue) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useRef(initialValue)
}

export function useEffect(create, inputs) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useEffect(create, inputs)
}

export function useLayoutEffect(create, inputs) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useLayoutEffect(create, inputs)
}

export function useCallback(callback, inputs) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useCallback(callback, inputs)
}

export function useMemo(create, inputs) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useMemo(create, inputs)
}

export function useImperativeHandle(ref, create, inputs) {
  const dispatcher = resolveDispatcher()
  return dispatcher.useImperativeHandle(ref, create, inputs)
}
