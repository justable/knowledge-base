import MAX_SIGNED_31_BIT_INT from './maxSigned31BitInt'

export const NoWork = 0
export const Never = 1
export const Sync = MAX_SIGNED_31_BIT_INT

const UNIT_SIZE = 10
const MAGIC_NUMBER_OFFSET = MAX_SIGNED_31_BIT_INT - 1

// 1 unit of expiration time represents 10ms.
export function msToExpirationTime(ms) {
  // Always add an offset so that we don't clash with the magic number for NoWork.
  return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0)
}

export function expirationTimeToMs(expirationTime) {
  return (MAGIC_NUMBER_OFFSET - expirationTime) * UNIT_SIZE
}

function ceiling(num, precision) {
  return (((num / precision) | 0) + 1) * precision
}

function computeExpirationBucket(currentTime, expirationInMs, bucketSizeMs) {
  return (
    MAGIC_NUMBER_OFFSET -
    ceiling(
      MAGIC_NUMBER_OFFSET - currentTime + expirationInMs / UNIT_SIZE,
      bucketSizeMs / UNIT_SIZE
    )
  )
}

// TODO: This corresponds to Scheduler's NormalPriority, not LowPriority. Update
// the names to reflect.
export const LOW_PRIORITY_EXPIRATION = 5000
export const LOW_PRIORITY_BATCH_SIZE = 250

export function computeAsyncExpiration(currentTime) {
  return computeExpirationBucket(
    currentTime,
    LOW_PRIORITY_EXPIRATION,
    LOW_PRIORITY_BATCH_SIZE
  )
}

// Same as computeAsyncExpiration but without the bucketing logic. This is
// used to compute timestamps instead of actual expiration times.
export function computeAsyncExpirationNoBucket(currentTime) {
  return currentTime - LOW_PRIORITY_EXPIRATION / UNIT_SIZE
}

// We intentionally set a higher expiration time for interactive updates in
// dev than in production.
//
// If the main thread is being blocked so long that you hit the expiration,
// it's a problem that could be solved with better scheduling.
//
// People will be more likely to notice this and fix it with the long
// expiration time in development.
//
// In production we opt for better UX at the risk of masking scheduling
// problems, by expiring fast.
export const HIGH_PRIORITY_EXPIRATION = 150
export const HIGH_PRIORITY_BATCH_SIZE = 100

export function computeInteractiveExpiration(currentTime) {
  return computeExpirationBucket(
    currentTime,
    HIGH_PRIORITY_EXPIRATION,
    HIGH_PRIORITY_BATCH_SIZE
  )
}

export function inferPriorityFromExpirationTime(currentTime, expirationTime) {
  if (expirationTime === Sync) {
    return ImmediatePriority
  }
  if (expirationTime === Never) {
    return IdlePriority
  }
  const msUntil =
    msToExpirationTime(expirationTime) - msToExpirationTime(currentTime)
  if (msUntil <= 0) {
    return ImmediatePriority
  }
  if (msUntil <= HIGH_PRIORITY_EXPIRATION) {
    return UserBlockingPriority
  }
  if (msUntil <= LOW_PRIORITY_EXPIRATION) {
    return NormalPriority
  }

  // TODO: Handle LowPriority

  // Assume anything lower has idle priority
  return IdlePriority
}
