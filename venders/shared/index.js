export const readOnly =
  process.env.NODE_ENV === 'development'
    ? (obj) => Object.freeze(obj)
    : (obj) => obj

export function invariant(cond, message) {
  if (!cond) throw new Error(message)
}

export function warning(cond, message) {
  if (!cond) {
    if (typeof console !== 'undefined') console.warn(message)
    try {
      throw new Error(message)
    } catch (e) {}
  }
}

const alreadyWarned = {}
export function warningOnce(key, cond, message) {
  if (!cond && !alreadyWarned[key]) {
    alreadyWarned[key] = true
    warning(false, message)
  }
}

export let noop = () => {}

export let warningWithoutStack = noop
