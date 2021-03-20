import React from 'react'
import { Action, Location } from '../history'
import { invariant } from './utils'
import { LocationContext } from './context'
import { useInRouterContext } from './hooks'
import type { Navigator } from './types'

export interface RouterProps {
  action?: Action
  children?: React.ReactNode
  location: Location
  navigator: Navigator
  static?: boolean
}

const Router: React.FC<RouterProps> = ({
  children = null,
  action = Action.Pop,
  location,
  navigator,
  static: staticProp = false
}) => {
  invariant(
    !useInRouterContext(),
    `You cannot render a <Router> inside another <Router>.` +
      ` You never need more than one.`
  )
  return (
    <LocationContext.Provider
      children={children}
      value={{ action, location, navigator, static: staticProp }}
    ></LocationContext.Provider>
  )
}

export default Router
