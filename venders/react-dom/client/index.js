import { invariant } from '../../shared'
import { HostComponent } from '../../shared/react/ReactWorkTags'
import {
  ELEMENT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE
} from '../shared/HTMLNodeType'
import { ROOT_ATTRIBUTE_NAME } from '../shared/DOMProperty'
import { getPublicInstance } from '../../react-reconciler/src/ReactFiberHostConfig.dom'
import {
  createContainer,
  updateContainer,
  unbatchedUpdates
} from '../../react-reconciler/inline.dom'

function getPublicRootInstance(container) {
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

function isValidContainer(node) {
  return !!(
    node &&
    (node.nodeType === ELEMENT_NODE ||
      node.nodeType === DOCUMENT_NODE ||
      node.nodeType === DOCUMENT_FRAGMENT_NODE ||
      (node.nodeType === COMMENT_NODE &&
        node.nodeValue === 'react-mount-point-unstable '))
  )
}

function ReactWork() {
  this._callbacks = null
  this._didCommit = false
  // list of Work objects.
  this._onCommit = this._onCommit.bind(this)
}
ReactWork.prototype.then = function (onCommit) {
  if (this._didCommit) {
    onCommit()
    return
  }
  let callbacks = this._callbacks
  if (callbacks === null) {
    callbacks = this._callbacks = []
  }
  callbacks.push(onCommit)
}
ReactWork.prototype._onCommit = function () {
  if (this._didCommit) {
    return
  }
  this._didCommit = true
  const callbacks = this._callbacks
  if (callbacks === null) {
    return
  }
  for (let i = 0; i < callbacks.length; i++) {
    const callback = callbacks[i]
    invariant(
      typeof callback === 'function',
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: %s'
    )
    callback()
  }
}

function ReactRoot(container, isConcurrent, hydrate) {
  // SKIP 创建了一个FiberRootNode，并在其current属性中挂载了一个未初始化的FiberNode
  const root = createContainer(container, isConcurrent, hydrate)
  this._internalRoot = root
}

ReactRoot.prototype.render = function (children, callback) {
  const root = this._internalRoot
  const work = new ReactWork()
  callback = callback === undefined ? null : callback
  if (callback !== null) {
    work.then(callback)
  }
  updateContainer(children, root, null, work._onCommit)
  return work
}
ReactRoot.prototype.unmount = function (callback) {
  const root = this._internalRoot
  const work = new ReactWork()
  callback = callback === undefined ? null : callback
  if (callback !== null) {
    work.then(callback)
  }
  updateContainer(null, root, null, work._onCommit)
  return work
}
ReactRoot.prototype.legacy_renderSubtreeIntoContainer = function (
  parentComponent,
  children,
  callback
) {
  const root = this._internalRoot
  const work = new ReactWork()
  callback = callback === undefined ? null : callback
  if (callback !== null) {
    work.then(callback)
  }
  updateContainer(children, root, parentComponent, work._onCommit)
  return work
}
ReactRoot.prototype.createBatch = function () {
  const batch = new ReactBatch(this)
  const expirationTime = batch._expirationTime

  const internalRoot = this._internalRoot
  const firstBatch = internalRoot.firstBatch
  if (firstBatch === null) {
    internalRoot.firstBatch = batch
    batch._next = null
  } else {
    // Insert sorted by expiration time then insertion order
    let insertAfter = null
    let insertBefore = firstBatch
    while (
      insertBefore !== null &&
      insertBefore._expirationTime >= expirationTime
    ) {
      insertAfter = insertBefore
      insertBefore = insertBefore._next
    }
    batch._next = insertBefore
    if (insertAfter !== null) {
      insertAfter._next = batch
    }
  }

  return batch
}

function getReactRootElementInContainer(container) {
  if (!container) {
    return null
  }

  if (container.nodeType === DOCUMENT_NODE) {
    return container.documentElement
  } else {
    return container.firstChild
  }
}

function shouldHydrateDueToLegacyHeuristic(container) {
  const rootElement = getReactRootElementInContainer(container)
  return !!(
    rootElement &&
    rootElement.nodeType === ELEMENT_NODE &&
    rootElement.hasAttribute(ROOT_ATTRIBUTE_NAME)
  )
}

function legacyCreateRootFromDOMContainer(container, forceHydrate) {
  const shouldHydrate =
    forceHydrate || shouldHydrateDueToLegacyHeuristic(container)
  // First clear any existing content.
  if (!shouldHydrate) {
    let warned = false
    let rootSibling
    while ((rootSibling = container.lastChild)) {
      container.removeChild(rootSibling)
    }
  }
  // Legacy roots are not async by default.
  const isConcurrent = false
  return new ReactRoot(container, isConcurrent, shouldHydrate)
}

function legacyRenderSubtreeIntoContainer(
  parentComponent,
  children,
  container,
  forceHydrate,
  callback
) {
  let root = container._reactRootContainer
  if (!root) {
    // 创建一个ReactRoot
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate
    )
    if (typeof callback === 'function') {
      const originalCallback = callback
      callback = function () {
        const instance = getPublicRootInstance(root._internalRoot)
        originalCallback.call(instance)
      }
    }
    // Initial mount should not be batched.
    unbatchedUpdates(() => {
      if (parentComponent != null) {
        root.legacy_renderSubtreeIntoContainer(
          parentComponent,
          children,
          callback
        )
      } else {
        root.render(children, callback)
      }
    })
  } else {
    if (typeof callback === 'function') {
      const originalCallback = callback
      callback = function () {
        const instance = getPublicRootInstance(root._internalRoot)
        originalCallback.call(instance)
      }
    }
    // Update
    if (parentComponent != null) {
      root.legacy_renderSubtreeIntoContainer(
        parentComponent,
        children,
        callback
      )
    } else {
      root.render(children, callback)
    }
  }
  return getPublicRootInstance(root._internalRoot)
}

const ReactDom = {
  hydrate(element, container, callback) {
    invariant(
      isValidContainer(container),
      'Target container is not a DOM element.'
    )
    return legacyRenderSubtreeIntoContainer(
      null,
      element,
      container,
      true,
      callback
    )
  },
  render(element, container, callback) {
    invariant(
      isValidContainer(container),
      'Target container is not a DOM element.'
    )
    return legacyRenderSubtreeIntoContainer(
      null,
      element,
      container,
      false,
      callback
    )
  }
}

export default ReactDom
