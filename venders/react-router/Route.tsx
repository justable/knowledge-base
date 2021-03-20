import React from 'react'
import Outlet from './Outlet'

export interface RouteProps {
  caseSensitive?: boolean
  children?: React.ReactNode
  element?: React.ReactElement | null
  path?: string
}

export default function Route({
  element = <Outlet />
}: RouteProps): React.ReactElement | null {
  return element
}
