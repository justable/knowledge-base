import {
  NoWork,
  Sync,
  msToExpirationTime,
  computeInteractiveExpiration,
  computeAsyncExpiration
} from './ReactFiberExpirationTime'
import {
  unstable_now as now,
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
  getCurrentPriorityLevel
} from '../../react-scheduler/Scheduler'
import { NoContext, ConcurrentMode, ProfileMode } from './ReactTypeOfMode'
import { invariant } from '../../shared'

const ceil = Math.ceil

const {
  ReactCurrentDispatcher,
  ReactCurrentOwner,
  ReactShouldWarnActingUpdates
} = ReactSharedInternals

// type WorkPhase = 0 | 1 | 2 | 3 | 4 | 5;
const NotWorking = 0
const BatchedPhase = 1
const LegacyUnbatchedPhase = 2
const FlushSyncPhase = 3
const RenderPhase = 4
const CommitPhase = 5

// type RootExitStatus = 0 | 1 | 2 | 3;
const RootIncomplete = 0
const RootErrored = 1
const RootSuspended = 2
const RootCompleted = 3

// The phase of work we're currently in
let workPhase = NotWorking
// The root we're working on
let workInProgressRoot = null
// The fiber we're working on
let workInProgress = null
// The expiration time we're rendering
let renderExpirationTime = NoWork
// Whether to root completed, errored, suspended, etc.
let workInProgressRootExitStatus = RootIncomplete
// Most recent event time among processed updates during this render.
// This is conceptually a time stamp but expressed in terms of an ExpirationTime
// because we deal mostly with expiration times in the hot path, so this avoids
// the conversion happening in the hot path.
let workInProgressRootMostRecentEventTime = Sync

let nextEffect = null
let hasUncaughtError = false
let firstUncaughtError = null
let legacyErrorBoundariesThatAlreadyFailed = null

let rootDoesHavePassiveEffects = false
let rootWithPendingPassiveEffects = null
let pendingPassiveEffectsExpirationTime = NoWork

let rootsWithPendingDiscreteUpdates = null

// Use these to prevent an infinite loop of nested updates
const NESTED_UPDATE_LIMIT = 50
let nestedUpdateCount = 0
let rootWithNestedUpdates = null

const NESTED_PASSIVE_UPDATE_LIMIT = 50
let nestedPassiveUpdateCount = 0

let interruptedBy = null

let initialTimeMs = now()
let currentEventTime = NoWork

export function requestCurrentTime() {
  if (workPhase === RenderPhase || workPhase === CommitPhase) {
    // We're inside React, so it's fine to read the actual time.
    return msToExpirationTime(now() - initialTimeMs)
  }
  // We're not inside React, so we may be in the middle of a browser event.
  if (currentEventTime !== NoWork) {
    // Use the same start time for all updates until we enter React again.
    return currentEventTime
  }
  // This is the first update since React yielded. Compute a new start time.
  currentEventTime = msToExpirationTime(now() - initialTimeMs)
  return currentEventTime
}

export function computeExpirationForFiber(currentTime, fiber) {
  if ((fiber.mode & ConcurrentMode) === NoContext) {
    return Sync
  }

  if (workPhase === RenderPhase) {
    // Use whatever time we're already rendering
    return renderExpirationTime
  }

  // Compute an expiration time based on the Scheduler priority.
  let expirationTime
  // SKIP 获取当前的优先级别
  const priorityLevel = getCurrentPriorityLevel()
  switch (priorityLevel) {
    case ImmediatePriority:
      expirationTime = Sync
      break
    case UserBlockingPriority:
      // TODO: Rename this to computeUserBlockingExpiration
      expirationTime = computeInteractiveExpiration(currentTime)
      break
    case NormalPriority:
    case LowPriority: // TODO: Handle LowPriority
      // TODO: Rename this to... something better.
      expirationTime = computeAsyncExpiration(currentTime)
      break
    case IdlePriority:
      expirationTime = Never
      break
    default:
      invariant(false, 'Expected a valid priority level')
  }

  // If we're in the middle of rendering a tree, do not update at the same
  // expiration time that is already rendering.
  if (workInProgressRoot !== null && expirationTime === renderExpirationTime) {
    // This is a trick to move this update into a separate batch
    expirationTime -= 1
  }

  return expirationTime
}

export function unbatchedUpdates(fn, a) {
  if (workPhase !== BatchedPhase && workPhase !== FlushSyncPhase) {
    // We're not inside batchedUpdates or flushSync, so unbatchedUpdates is
    // a no-op.
    return fn(a)
  }
  const prevWorkPhase = workPhase
  workPhase = LegacyUnbatchedPhase
  try {
    return fn(a)
  } finally {
    workPhase = prevWorkPhase
  }
}
