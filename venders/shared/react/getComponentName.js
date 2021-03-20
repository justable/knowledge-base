import { warningWithoutStack } from '..'
import {
  REACT_CONCURRENT_MODE_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_PORTAL_TYPE,
  REACT_MEMO_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_LAZY_TYPE,
  REACT_EVENT_COMPONENT_TYPE,
  REACT_EVENT_TARGET_TYPE,
  REACT_EVENT_TARGET_TOUCH_HIT,
  REACT_EVENT_FOCUS_TARGET,
  REACT_EVENT_PRESS_TARGET
} from './ReactSymbols'
import { refineResolvedLazyComponent } from './ReactLazyComponent'

import { enableEventAPI } from './ReactFeatureFlags'

function getWrappedName(outerType, innerType, wrapperName) {
  const functionName = innerType.displayName || innerType.name || ''
  return (
    outerType.displayName ||
    (functionName !== '' ? `${wrapperName}(${functionName})` : wrapperName)
  )
}

function getComponentName(type) {
  if (type == null) {
    // Host root, text node or just invalid type.
    return null
  }
  if (typeof type === 'function') {
    return type.displayName || type.name || null
  }
  if (typeof type === 'string') {
    return type
  }
  switch (type) {
    case REACT_CONCURRENT_MODE_TYPE:
      return 'ConcurrentMode'
    case REACT_FRAGMENT_TYPE:
      return 'Fragment'
    case REACT_PORTAL_TYPE:
      return 'Portal'
    case REACT_PROFILER_TYPE:
      return `Profiler`
    case REACT_STRICT_MODE_TYPE:
      return 'StrictMode'
    case REACT_SUSPENSE_TYPE:
      return 'Suspense'
  }
  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE:
        return 'Context.Consumer'
      case REACT_PROVIDER_TYPE:
        return 'Context.Provider'
      case REACT_FORWARD_REF_TYPE:
        return getWrappedName(type, type.render, 'ForwardRef')
      case REACT_MEMO_TYPE:
        return getComponentName(type.type)
      case REACT_LAZY_TYPE: {
        const thenable: LazyComponent<mixed> = (type: any)
        const resolvedThenable = refineResolvedLazyComponent(thenable)
        if (resolvedThenable) {
          return getComponentName(resolvedThenable)
        }
        break
      }
      case REACT_EVENT_COMPONENT_TYPE: {
        if (enableEventAPI) {
          const eventComponent = type
          const displayName = eventComponent.displayName
          if (displayName !== undefined) {
            return displayName
          }
        }
        break
      }
      case REACT_EVENT_TARGET_TYPE: {
        if (enableEventAPI) {
          const eventTarget = type
          if (eventTarget.type === REACT_EVENT_TARGET_TOUCH_HIT) {
            return 'TouchHitTarget'
          } else if (eventTarget.type === REACT_EVENT_FOCUS_TARGET) {
            return 'FocusTarget'
          } else if (eventTarget.type === REACT_EVENT_PRESS_TARGET) {
            return 'PressTarget'
          }
          const displayName = eventTarget.displayName
          if (displayName !== undefined) {
            return displayName
          }
        }
      }
    }
  }
  return null
}

export default getComponentName
