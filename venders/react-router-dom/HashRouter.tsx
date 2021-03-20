import React from 'react'
import { HashHistory, createHashHistory, Update } from '../history'
import { Router } from '../react-router'

export interface HashRouterProps {
  children?: React.ReactNode
  window?: Window
}
/**
 * A <Router> for use in web browsers. Stores the location in the hash
 * portion of the URL so it is not sent to the server.
 */
export default function HashRouter({ children, window }: HashRouterProps) {
  let historyRef = React.useRef<HashHistory>()
  if (historyRef.current == null) {
    historyRef.current = createHashHistory({ window })
  }

  let history = historyRef.current
  let [state, dispatch] = React.useReducer(
    (_: Update, action: Update) => action,
    {
      action: history.action,
      location: history.location
    }
  )

  React.useLayoutEffect(() => history.listen(dispatch), [history])

  return (
    <Router
      children={children}
      action={state.action}
      location={state.location}
      navigator={history}
    />
  )
}
