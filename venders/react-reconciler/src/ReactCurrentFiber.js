import ReactSharedInternals from '../../shared/react/ReactSharedInternals'
import {
  HostRoot,
  HostPortal,
  HostText,
  Fragment,
  ContextProvider,
  ContextConsumer
} from '../../shared/react/ReactWorkTags'
import describeComponentFrame from '../../shared/react/describeComponentFrame'
import getComponentName from '../../shared/react/getComponentName'

const ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame

function describeFiber(fiber) {
  switch (fiber.tag) {
    case HostRoot:
    case HostPortal:
    case HostText:
    case Fragment:
    case ContextProvider:
    case ContextConsumer:
      return ''
    default:
      const owner = fiber._debugOwner
      const source = fiber._debugSource
      const name = getComponentName(fiber.type)
      let ownerName = null
      if (owner) {
        ownerName = getComponentName(owner.type)
      }
      return describeComponentFrame(name, source, ownerName)
  }
}

export function getStackByFiberInDevAndProd(workInProgress) {
  let info = ''
  let node = workInProgress
  do {
    info += describeFiber(node)
    node = node.return
  } while (node)
  return info
}

export let current = null
export let phase = null

export function getCurrentFiberOwnerNameInDevOrNull() {
  return null
}

export function getCurrentFiberStackInDev() {
  return ''
}

export function resetCurrentFiber() {}

export function setCurrentFiber(fiber) {}

export function setCurrentPhase(lifeCyclePhase) {}
