import { invariant } from '../shared'

const ReactNoopUpdateQueue = {
  isMounted: function (publicInstance) {
    return false
  },
  enqueueForceUpdate: function (publicInstance, callback, callerName) {},
  enqueueReplaceState: function (
    publicInstance,
    completeState,
    callback,
    callerName
  ) {},

  enqueueSetState: function (
    publicInstance,
    partialState,
    callback,
    callerName
  ) {}
}

const emptyObject = {}

export class Component {
  isReactComponent = true

  constructor(props, context, updater) {
    this.props = props
    this.context = context
    // If a component has string refs, we will assign a different object later.
    this.refs = emptyObject
    // We initialize the default updater but the real one gets injected by the
    // renderer.
    this.updater = updater || ReactNoopUpdateQueue
  }

  setState = function (partialState, callback) {
    invariant(
      typeof partialState === 'object' ||
        typeof partialState === 'function' ||
        partialState == null,
      'setState(...): takes an object of state variables to update or a ' +
        'function which returns an object of state variables.'
    )
    this.updater.enqueueSetState(this, partialState, callback, 'setState')
  }

  forceUpdate = function (callback) {
    this.updater.enqueueForceUpdate(this, callback, 'forceUpdate')
  }
}

export class PureComponent extends Component {
  isPureReactComponent = true
}
