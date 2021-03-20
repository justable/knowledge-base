import React from 'react'
import { Action, Location } from '../history'
import { readOnly } from './utils'
import type { Navigator, RouteObject, Params } from './types'

export interface LocationContextObject {
  action?: Action
  location?: Location
  navigator?: Navigator
  static: boolean
}

export const LocationContext = React.createContext<LocationContextObject>({
  static: false
})

export interface RouteContextObject {
  outlet: React.ReactElement | null
  params: Params
  pathname: string
  route: RouteObject | null
}

export const RouteContext = React.createContext<RouteContextObject>({
  outlet: null,
  params: readOnly<Params>({}),
  pathname: '',
  route: null
})
