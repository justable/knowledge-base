declare namespace Shared {
  function readOnly<T extends unknown>(obj: T): T

  function invariant(cond: boolean, message: string): void

  function warning(cond: boolean, message: string): void

  function warningOnce(key: string, cond: boolean, message: string): void

  let noop: () => void

  let warningWithoutStack: typeof noop
}

export = Shared
export as namespace Shared
