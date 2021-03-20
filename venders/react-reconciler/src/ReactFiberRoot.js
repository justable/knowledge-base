import { noTimeout } from './ReactFiberHostConfig.dom'
import { createHostRootFiber } from './ReactFiber'
import { NoWork } from './ReactFiberExpirationTime'
import { enableSchedulerTracing } from '../../shared/react/ReactFeatureFlags'
import { unstable_getThreadID } from '../../react-scheduler/Tracing'

function FiberRootNode(containerInfo, hydrate) {
  this.current = null
  this.containerInfo = containerInfo
  this.pendingChildren = null
  this.pingCache = null
  this.pendingCommitExpirationTime = NoWork
  this.finishedWork = null
  this.timeoutHandle = noTimeout
  this.context = null
  this.pendingContext = null
  this.hydrate = hydrate
  this.firstBatch = null
  this.callbackNode = null
  this.callbackExpirationTime = NoWork
  this.firstPendingTime = NoWork
  this.lastPendingTime = NoWork
  this.pingTime = NoWork

  if (enableSchedulerTracing) {
    this.interactionThreadID = unstable_getThreadID()
    this.memoizedInteractions = new Set()
    this.pendingInteractionMap = new Map()
  }
}

export function createFiberRoot(containerInfo, isConcurrent, hydrate) {
  // TODO 不清楚这里的RootNode是干嘛的
  const root = new FiberRootNode(containerInfo, hydrate)

  const uninitializedFiber = createHostRootFiber(isConcurrent)
  // 这里是真的Fiber结构数据
  root.current = uninitializedFiber
  uninitializedFiber.stateNode = root

  return root
}
