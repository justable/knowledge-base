import { invariant } from '../shared'

export const ImmediatePriority = 99
export const UserBlockingPriority = 98
export const NormalPriority = 97
export const LowPriority = 96
export const IdlePriority = 95
// NoPriority is the absence of priority. Also React-only.
export const NoPriority = 90

let currentPriorityLevel = NormalPriority

function unstable_getCurrentPriorityLevel() {
  return currentPriorityLevel
}

export function getCurrentPriorityLevel() {
  switch (unstable_getCurrentPriorityLevel()) {
    case ImmediatePriority:
      return ImmediatePriority
    case UserBlockingPriority:
      return UserBlockingPriority
    case NormalPriority:
      return NormalPriority
    case LowPriority:
      return LowPriority
    case IdlePriority:
      return IdlePriority
    default:
      invariant(false, 'Unknown priority level.')
  }
}

function getCurrentTime() {
  // 伪逻辑，简单化源码
  return Date.now()
}
export { getCurrentTime as unstable_now }
