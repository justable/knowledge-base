import { REACT_MEMO_TYPE } from '../shared/react/ReactSymbols'

export default function memo(type, compare) {
  const memoType = {
    $$typeof: REACT_MEMO_TYPE,
    type,
    compare: compare === undefined ? null : compare
  }
  return memoType
}
