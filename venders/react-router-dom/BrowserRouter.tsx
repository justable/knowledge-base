import React from 'react'
import { BrowserHistory, createBrowserHistory, Update } from '../history'
import { Router } from '../react-router'

export interface BrowserRouterProps {
  children?: React.ReactNode
  window?: Window
}
/**
 * 是 <Router> 组件在Web端的上层封装
 */
export default function BrowserRouter({
  children,
  window
}: BrowserRouterProps) {
  let historyRef = React.useRef<BrowserHistory>()
  if (historyRef.current == null) {
    historyRef.current = createBrowserHistory({ window })
  }

  let history = historyRef.current
  let [state, dispatch] = React.useReducer(
    (_: Update, action: Update) => action,
    {
      action: history.action,
      location: history.location
    }
  )

  // 路由发生变化时会执行dispatch
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
