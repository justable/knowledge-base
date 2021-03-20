import invariant from '../../shared'
import { warningWithoutStack } from '../../shared'
import {
  enableProfilerTimer,
  enableEventAPI
} from '../../shared/react/ReactFeatureFlags'
import { NoEffect } from '../../shared/react/ReactSideEffectTags'
import {
  IndeterminateComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  ForwardRef,
  Fragment,
  Mode,
  ContextProvider,
  ContextConsumer,
  Profiler,
  SuspenseComponent,
  FunctionComponent,
  MemoComponent,
  LazyComponent,
  EventComponent,
  EventTarget
} from '../../shared/react/ReactWorkTags'
import getComponentName from '../../shared/react/getComponentName'

import { isDevToolsPresent } from './ReactFiberDevToolsHook'
import { NoWork } from './ReactFiberExpirationTime'
import {
  NoContext,
  ConcurrentMode,
  ProfileMode,
  StrictMode
} from './ReactTypeOfMode'
import {
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_CONTEXT_TYPE,
  REACT_CONCURRENT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_MEMO_TYPE,
  REACT_LAZY_TYPE,
  REACT_EVENT_COMPONENT_TYPE,
  REACT_EVENT_TARGET_TYPE
} from '../../shared/react/ReactSymbols'

let hasBadMapPolyfill

// type Fiber = {|
//   tag: WorkTag,
//   key,
//   elementType,
//   type,
//   stateNode,
//   return | null,
//   child | null,
//   sibling | null,
//   index: number,
//   ref: null | (((handle: mixed) => void) & { _stringRef: ?string }) | RefObject,
//   pendingProps,
//   memoizedProps,
//   updateQueue: UpdateQueue<any> | null,
//   memoizedState,
//   contextDependencies: ContextDependencyList | null,
//   mode,
//   effectTag: SideEffectTag,
//   nextEffect | null,
//   firstEffect | null,
//   lastEffect | null,
//   expirationTime,
//   childExpirationTime,
//   alternate | null,
//   actualDuration?: number,
//   actualStartTime?: number,
//   selfBaseDuration?: number,
//   treeBaseDuration?: number,
//   _debugID?: number,
//   _debugSource?: Source | null,
//   _debugOwner? | null,
//   _debugIsCurrentlyTiming?: boolean,
//   _debugHookTypes?: Array<HookType> | null
// |}

let debugCounter

function FiberNode(tag, pendingProps, key, mode) {
  // Instance
  this.tag = tag
  this.key = key
  this.elementType = null
  this.type = null
  this.stateNode = null

  // Fiber
  this.return = null
  this.child = null
  this.sibling = null
  this.index = 0

  this.ref = null

  this.pendingProps = pendingProps
  this.memoizedProps = null
  this.updateQueue = null
  this.memoizedState = null
  this.contextDependencies = null

  this.mode = mode

  // Effects
  this.effectTag = NoEffect
  this.nextEffect = null

  this.firstEffect = null
  this.lastEffect = null

  this.expirationTime = NoWork
  this.childExpirationTime = NoWork

  this.alternate = null

  if (enableProfilerTimer) {
    // Note: The following is done to avoid a v8 performance cliff.
    //
    // Initializing the fields below to smis and later updating them with
    // double values will cause Fibers to end up having separate shapes.
    // This behavior/bug has something to do with Object.preventExtension().
    // Fortunately this only impacts DEV builds.
    // Unfortunately it makes React unusably slow for some applications.
    // To work around this, initialize the fields below with doubles.
    //
    // Learn more about this here:
    // https://github.com/facebook/react/issues/14365
    // https://bugs.chromium.org/p/v8/issues/detail?id=8538
    this.actualDuration = Number.NaN
    this.actualStartTime = Number.NaN
    this.selfBaseDuration = Number.NaN
    this.treeBaseDuration = Number.NaN

    // It's okay to replace the initial doubles with smis after initialization.
    // This won't trigger the performance cliff mentioned above,
    // and it simplifies other profiler code (including DevTools).
    this.actualDuration = 0
    this.actualStartTime = -1
    this.selfBaseDuration = 0
    this.treeBaseDuration = 0
  }
}

// This is a constructor function, rather than a POJO constructor, still
// please ensure we do the following:
// 1) Nobody should add any instance methods on this. Instance methods can be
//    more difficult to predict when they get optimized and they are almost
//    never inlined properly in static compilers.
// 2) Nobody should rely on `instanceof Fiber` for type testing. We should
//    always know when it is a fiber.
// 3) We might want to experiment with using numeric keys since they are easier
//    to optimize in a non-JIT environment.
// 4) We can easily go from a constructor to a createFiber object literal if that
//    is faster.
// 5) It should be easy to port this to a C struct and keep a C implementation
//    compatible.
const createFiber = function (tag, pendingProps, key, mode) {
  // $FlowFixMe: the shapes are exact here but Flow doesn't like constructors
  return new FiberNode(tag, pendingProps, key, mode)
}

function shouldConstruct(Component) {
  const prototype = Component.prototype
  return !!(prototype && prototype.isReactComponent)
}

export function isSimpleFunctionComponent(type) {
  return (
    typeof type === 'function' &&
    !shouldConstruct(type) &&
    type.defaultProps === undefined
  )
}

export function resolveLazyComponentTag(Component) {
  if (typeof Component === 'function') {
    return shouldConstruct(Component) ? ClassComponent : FunctionComponent
  } else if (Component !== undefined && Component !== null) {
    const $$typeof = Component.$$typeof
    if ($$typeof === REACT_FORWARD_REF_TYPE) {
      return ForwardRef
    }
    if ($$typeof === REACT_MEMO_TYPE) {
      return MemoComponent
    }
  }
  return IndeterminateComponent
}

// This is used to create an alternate fiber to do work on.
export function createWorkInProgress(current, pendingProps, expirationTime) {
  let workInProgress = current.alternate
  if (workInProgress === null) {
    // We use a double buffering pooling technique because we know that we'll
    // only ever need at most two versions of a tree. We pool the "other" unused
    // node that we're free to reuse. This is lazily created to avoid allocating
    // extra objects for things that are never updated. It also allow us to
    // reclaim the extra memory if needed.
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode
    )
    workInProgress.elementType = current.elementType
    workInProgress.type = current.type
    workInProgress.stateNode = current.stateNode

    workInProgress.alternate = current
    current.alternate = workInProgress
  } else {
    workInProgress.pendingProps = pendingProps

    // We already have an alternate.
    // Reset the effect tag.
    workInProgress.effectTag = NoEffect

    // The effect list is no longer valid.
    workInProgress.nextEffect = null
    workInProgress.firstEffect = null
    workInProgress.lastEffect = null

    if (enableProfilerTimer) {
      // We intentionally reset, rather than copy, actualDuration & actualStartTime.
      // This prevents time from endlessly accumulating in new commits.
      // This has the downside of resetting values for different priority renders,
      // But works for yielding (the common case) and should support resuming.
      workInProgress.actualDuration = 0
      workInProgress.actualStartTime = -1
    }
  }

  workInProgress.childExpirationTime = current.childExpirationTime
  workInProgress.expirationTime = current.expirationTime

  workInProgress.child = current.child
  workInProgress.memoizedProps = current.memoizedProps
  workInProgress.memoizedState = current.memoizedState
  workInProgress.updateQueue = current.updateQueue
  workInProgress.contextDependencies = current.contextDependencies

  // These will be overridden during the parent's reconciliation
  workInProgress.sibling = current.sibling
  workInProgress.index = current.index
  workInProgress.ref = current.ref

  if (enableProfilerTimer) {
    workInProgress.selfBaseDuration = current.selfBaseDuration
    workInProgress.treeBaseDuration = current.treeBaseDuration
  }

  return workInProgress
}

export function createHostRootFiber(isConcurrent) {
  let mode = isConcurrent ? ConcurrentMode | StrictMode : NoContext

  if (enableProfilerTimer && isDevToolsPresent) {
    // Always collect profile timings when DevTools are present.
    // This enables DevTools to start capturing timing at any point–
    // Without some nodes in the tree having empty base times.
    mode |= ProfileMode
  }

  return createFiber(HostRoot, null, null, mode)
}

export function createFiberFromTypeAndProps(
  type, // React$ElementType
  key,
  pendingProps,
  owner,
  mode,
  expirationTime
) {
  let fiber

  let fiberTag = IndeterminateComponent
  // The resolved type is set if we know what the final type will be. I.e. it's not lazy.
  let resolvedType = type
  if (typeof type === 'function') {
    if (shouldConstruct(type)) {
      fiberTag = ClassComponent
    }
  } else if (typeof type === 'string') {
    fiberTag = HostComponent
  } else {
    getTag: switch (type) {
      case REACT_FRAGMENT_TYPE:
        return createFiberFromFragment(
          pendingProps.children,
          mode,
          expirationTime,
          key
        )
      case REACT_CONCURRENT_MODE_TYPE:
        return createFiberFromMode(
          pendingProps,
          mode | ConcurrentMode | StrictMode,
          expirationTime,
          key
        )
      case REACT_STRICT_MODE_TYPE:
        return createFiberFromMode(
          pendingProps,
          mode | StrictMode,
          expirationTime,
          key
        )
      case REACT_PROFILER_TYPE:
        return createFiberFromProfiler(pendingProps, mode, expirationTime, key)
      case REACT_SUSPENSE_TYPE:
        return createFiberFromSuspense(pendingProps, mode, expirationTime, key)
      default: {
        if (typeof type === 'object' && type !== null) {
          switch (type.$$typeof) {
            case REACT_PROVIDER_TYPE:
              fiberTag = ContextProvider
              break getTag
            case REACT_CONTEXT_TYPE:
              // This is a consumer
              fiberTag = ContextConsumer
              break getTag
            case REACT_FORWARD_REF_TYPE:
              fiberTag = ForwardRef
              break getTag
            case REACT_MEMO_TYPE:
              fiberTag = MemoComponent
              break getTag
            case REACT_LAZY_TYPE:
              fiberTag = LazyComponent
              resolvedType = null
              break getTag
            case REACT_EVENT_COMPONENT_TYPE:
              if (enableEventAPI) {
                return createFiberFromEventComponent(
                  type,
                  pendingProps,
                  mode,
                  expirationTime,
                  key
                )
              }
              break
            case REACT_EVENT_TARGET_TYPE:
              if (enableEventAPI) {
                return createFiberFromEventTarget(
                  type,
                  pendingProps,
                  mode,
                  expirationTime,
                  key
                )
              }
              break
          }
        }
        let info = ''
        invariant(
          false,
          'Element type is invalid: expected a string (for built-in ' +
            'components) or a class/function (for composite components) ' +
            'but got: %s.%s'
        )
      }
    }
  }

  fiber = createFiber(fiberTag, pendingProps, key, mode)
  fiber.elementType = type
  fiber.type = resolvedType
  fiber.expirationTime = expirationTime

  return fiber
}

export function createFiberFromElement(element, mode, expirationTime) {
  let owner = null

  const type = element.type
  const key = element.key
  const pendingProps = element.props
  const fiber = createFiberFromTypeAndProps(
    type,
    key,
    pendingProps,
    owner,
    mode,
    expirationTime
  )

  return fiber
}

export function createFiberFromFragment(elements, mode, expirationTime, key) {
  const fiber = createFiber(Fragment, elements, key, mode)
  fiber.expirationTime = expirationTime
  return fiber
}

export function createFiberFromEventComponent(
  eventComponent,
  pendingProps,
  mode,
  expirationTime,
  key
) {
  const fiber = createFiber(EventComponent, pendingProps, key, mode)
  fiber.elementType = eventComponent
  fiber.type = eventComponent
  fiber.expirationTime = expirationTime
  return fiber
}

export function createFiberFromEventTarget(
  eventTarget,
  pendingProps,
  mode,
  expirationTime,
  key
) {
  const fiber = createFiber(EventTarget, pendingProps, key, mode)
  fiber.elementType = eventTarget
  fiber.type = eventTarget
  fiber.expirationTime = expirationTime
  // Store latest props
  fiber.stateNode = {
    props: pendingProps
  }
  return fiber
}

function createFiberFromProfiler(pendingProps, mode, expirationTime, key) {
  const fiber = createFiber(Profiler, pendingProps, key, mode | ProfileMode)
  // TODO: The Profiler fiber shouldn't have a type. It has a tag.
  fiber.elementType = REACT_PROFILER_TYPE
  fiber.type = REACT_PROFILER_TYPE
  fiber.expirationTime = expirationTime

  return fiber
}

function createFiberFromMode(pendingProps, mode, expirationTime, key) {
  const fiber = createFiber(Mode, pendingProps, key, mode)

  // TODO: The Mode fiber shouldn't have a type. It has a tag.
  const type =
    (mode & ConcurrentMode) === NoContext
      ? REACT_STRICT_MODE_TYPE
      : REACT_CONCURRENT_MODE_TYPE
  fiber.elementType = type
  fiber.type = type

  fiber.expirationTime = expirationTime
  return fiber
}

export function createFiberFromSuspense(
  pendingProps,
  mode,
  expirationTime,
  key
) {
  const fiber = createFiber(SuspenseComponent, pendingProps, key, mode)

  // TODO: The SuspenseComponent fiber shouldn't have a type. It has a tag.
  const type = REACT_SUSPENSE_TYPE
  fiber.elementType = type
  fiber.type = type

  fiber.expirationTime = expirationTime
  return fiber
}

export function createFiberFromText(content, mode, expirationTime) {
  const fiber = createFiber(HostText, content, null, mode)
  fiber.expirationTime = expirationTime
  return fiber
}

export function createFiberFromHostInstanceForDeletion() {
  const fiber = createFiber(HostComponent, null, null, NoContext)
  // TODO: These should not need a type.
  fiber.elementType = 'DELETED'
  fiber.type = 'DELETED'
  return fiber
}

export function createFiberFromPortal(portal, mode, expirationTime) {
  const pendingProps = portal.children !== null ? portal.children : []
  const fiber = createFiber(HostPortal, pendingProps, portal.key, mode)
  fiber.expirationTime = expirationTime
  fiber.stateNode = {
    containerInfo: portal.containerInfo,
    pendingChildren: null, // Used by persistent updates
    implementation: portal.implementation
  }
  return fiber
}

// Used for stashing WIP properties to replay failed work in DEV.
export function assignFiberPropertiesInDEV(target = null, source) {
  if (target === null) {
    // This Fiber's initial properties will always be overwritten.
    // We only use a Fiber to ensure the same hidden class so DEV isn't slow.
    target = createFiber(IndeterminateComponent, null, null, NoContext)
  }

  // This is intentionally written as a list of all properties.
  // We tried to use Object.assign() instead but this is called in
  // the hottest path, and Object.assign() was too slow:
  // https://github.com/facebook/react/issues/12502
  // This code is DEV-only so size is not a concern.

  target.tag = source.tag
  target.key = source.key
  target.elementType = source.elementType
  target.type = source.type
  target.stateNode = source.stateNode
  target.return = source.return
  target.child = source.child
  target.sibling = source.sibling
  target.index = source.index
  target.ref = source.ref
  target.pendingProps = source.pendingProps
  target.memoizedProps = source.memoizedProps
  target.updateQueue = source.updateQueue
  target.memoizedState = source.memoizedState
  target.contextDependencies = source.contextDependencies
  target.mode = source.mode
  target.effectTag = source.effectTag
  target.nextEffect = source.nextEffect
  target.firstEffect = source.firstEffect
  target.lastEffect = source.lastEffect
  target.expirationTime = source.expirationTime
  target.childExpirationTime = source.childExpirationTime
  target.alternate = source.alternate
  if (enableProfilerTimer) {
    target.actualDuration = source.actualDuration
    target.actualStartTime = source.actualStartTime
    target.selfBaseDuration = source.selfBaseDuration
    target.treeBaseDuration = source.treeBaseDuration
  }
  target._debugID = source._debugID
  target._debugSource = source._debugSource
  target._debugOwner = source._debugOwner
  target._debugIsCurrentlyTiming = source._debugIsCurrentlyTiming
  target._debugHookTypes = source._debugHookTypes
  return target
}
