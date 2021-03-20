import {
  REACT_PROVIDER_TYPE,
  REACT_CONTEXT_TYPE
} from '../shared/react/ReactSymbols'

export function createContext(defaultValue) {
  const context = {
    $$typeof: REACT_CONTEXT_TYPE,
    // As a workaround to support multiple concurrent renderers, we categorize
    // some renderers as primary and others as secondary. We only expect
    // there to be two concurrent renderers at most: React Native (primary) and
    // Fabric (secondary); React DOM (primary) and React ART (secondary).
    // Secondary renderers store their context values on separate fields.
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    // Used to track how many concurrent renderers this context currently
    // supports within in a single renderer. Such as parallel server rendering.
    _threadCount: 0,
    // These are circular
    Provider: null,
    Consumer: null
  }

  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE,
    _context: context
  }

  context.Consumer = context

  return context
}
