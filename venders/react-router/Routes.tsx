import React from 'react'
import { useRoutes_ } from './hooks'
import { createRoutesFromChildren } from './utils'

export interface RoutesProps {
  basename?: string
  children?: React.ReactNode
}

export default function Routes({
  basename = '',
  children
}: RoutesProps): React.ReactElement | null {
  // 把children抽象成数据结构
  let routes = createRoutesFromChildren(children)
  // 和当前路由进行匹配，来决定显示哪些children
  return useRoutes_(routes, basename)
}
