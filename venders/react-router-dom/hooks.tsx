import React from 'react'
import { State } from '../history'
import { useBlocker, useLocation, useNavigate } from '../react-router'
import { warning, createSearchParams, URLSearchParamsInit } from './utils'

/**
 * Prevents navigation away from the current page using a window.confirm prompt
 * with the given message.
 */
export function usePrompt(message: string, when = true) {
  let blocker = React.useCallback(
    (tx) => {
      if (window.confirm(message)) tx.retry()
    },
    [message]
  )

  useBlocker(blocker, when)
}

/**
 * A convenient wrapper for reading and writing search parameters via the
 * URLSearchParams interface.
 */
export function useSearchParams(defaultInit?: URLSearchParamsInit) {
  warning(
    typeof URLSearchParams !== 'undefined',
    'You cannot use the `useSearchParams` hook in a browser that does not' +
      ' support the URLSearchParams API. If you need to support Internet Explorer 11,' +
      ' we recommend you load a polyfill such as https://github.com/ungap/url-search-params' +
      '\n\n' +
      "If you're unsure how to load polyfills, we recommend you check out https://polyfill.io/v3/" +
      ' which provides some recommendations about how to load polyfills only for users that' +
      ' need them, instead of for every user.'
  )

  let defaultSearchParamsRef = React.useRef(createSearchParams(defaultInit))

  let location = useLocation()
  let searchParams = React.useMemo(() => {
    let searchParams = createSearchParams(location.search)

    for (let key of defaultSearchParamsRef.current.keys()) {
      if (!searchParams.has(key)) {
        defaultSearchParamsRef.current.getAll(key).forEach((value) => {
          searchParams.append(key, value)
        })
      }
    }

    return searchParams
  }, [location.search])

  let navigate = useNavigate()
  let setSearchParams = React.useCallback(
    (
      nextInit: URLSearchParamsInit,
      navigateOptions?: { replace?: boolean; state?: State }
    ) => {
      navigate('?' + createSearchParams(nextInit), navigateOptions)
    },
    [navigate]
  )

  return [searchParams, setSearchParams] as const
}
