import React from 'react'
import {
  createMemoryHistory,
  MemoryHistory,
  Update,
  InitialEntry
} from '../history'
import Router from './Router'

export interface MemoryRouterProps {
  children?: React.ReactNode
  initialEntries?: InitialEntry[]
  initialIndex?: number
}

/**
 * MemoryRouter主要是为了缓存所有的entries，对应history的createMemoryHistory方法，
 * 主要是为非浏览器环境设计的，比如tests和React Native场景，
 * 因为在浏览器环境中浏览器会替我们缓存，比如调用window.history.go(-1)会自动返回上一个entry。
 * @param param0
 */
export default function MemoryRouter({
  children,
  initialEntries,
  initialIndex
}: MemoryRouterProps): React.ReactElement {
  let historyRef = React.useRef<MemoryHistory>()
  if (historyRef.current == null) {
    historyRef.current = createMemoryHistory({ initialEntries, initialIndex })
  }

  let history = historyRef.current
  let [state, dispatch] = React.useReducer(
    (_: Update, action: Update) => action,
    {
      action: history.action,
      location: history.location
    }
  )

  // 每当history发生update时会触发dispatch，更新当前entry的action和location属性
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
