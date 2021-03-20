import { REACT_FORWARD_REF_TYPE } from '../shared/react/ReactSymbols'

// render: (props: Props, ref: ReactRef) => ReactElement
export default function forwardRef(render) {
  return {
    $$typeof: REACT_FORWARD_REF_TYPE,
    render
  }
}
