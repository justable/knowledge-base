import { HostComponent, ClassComponent } from '../../shared/react/ReactWorkTags'
import {
  requestCurrentTime,
  unbatchedUpdates,
  computeExpirationForFiber
} from './ReactFiberScheduler'
import { createFiberRoot } from './ReactFiberRoot'
import { get as getInstance } from '../../shared/react/ReactInstanceMap'
import {
  findCurrentUnmaskedContext,
  processChildContext,
  emptyContextObject,
  isContextProvider as isLegacyContextProvider
} from './ReactFiberContext'

function getContextForSubtree(parentComponent) {
  if (!parentComponent) {
    return emptyContextObject
  }

  const fiber = getInstance(parentComponent)
  const parentContext = findCurrentUnmaskedContext(fiber)

  if (fiber.tag === ClassComponent) {
    const Component = fiber.type
    if (isLegacyContextProvider(Component)) {
      return processChildContext(fiber, Component, parentContext)
    }
  }

  return parentContext
}

function scheduleRootUpdate(
  current: Fiber,
  element: ReactNodeList,
  expirationTime: ExpirationTime,
  callback: ?Function
) {
  const update = createUpdate(expirationTime)
  // Caution: React DevTools currently depends on this property
  // being called "element".
  update.payload = { element }

  callback = callback === undefined ? null : callback
  if (callback !== null) {
    warningWithoutStack(
      typeof callback === 'function',
      'render(...): Expected the last optional `callback` argument to be a ' +
        'function. Instead received: %s.',
      callback
    )
    update.callback = callback
  }

  flushPassiveEffects()
  enqueueUpdate(current, update)
  scheduleWork(current, expirationTime)

  return expirationTime
}

export function updateContainerAtExpirationTime(
  element,
  container,
  parentComponent,
  expirationTime,
  callback
) {
  // TODO: If this is a nested container, this won't be the root.
  const current = container.current

  const context = getContextForSubtree(parentComponent)
  if (container.context === null) {
    container.context = context
  } else {
    container.pendingContext = context
  }

  return scheduleRootUpdate(current, element, expirationTime, callback)
}

export { unbatchedUpdates }

export function getPublicRootInstance(container) {
  const containerFiber = container.current
  if (!containerFiber.child) {
    return null
  }
  switch (containerFiber.child.tag) {
    case HostComponent:
      return getPublicInstance(containerFiber.child.stateNode)
    default:
      return containerFiber.child.stateNode
  }
}

export function createContainer(containerInfo, isConcurrent, hydrate) {
  return createFiberRoot(containerInfo, isConcurrent, hydrate)
}

export function updateContainer(element, container, parentComponent, callback) {
  const current = container.current
  const currentTime = requestCurrentTime()
  const expirationTime = computeExpirationForFiber(currentTime, current)
  return updateContainerAtExpirationTime(
    element,
    container,
    parentComponent,
    expirationTime,
    callback
  )
}
