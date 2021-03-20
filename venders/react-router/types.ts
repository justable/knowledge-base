import { History, To, State } from '../history'

export type Navigator = Omit<
  History,
  'action' | 'location' | 'back' | 'forward' | 'listen'
>

export interface NavigateFunction {
  (to: To, options?: { replace?: boolean; state?: State }): void
  (delta: number): void
}

export type PathPattern =
  | string
  | { path: string; caseSensitive?: boolean; end?: boolean }

/**
 * A route object represents a logical route, with (optionally) its child
 * routes organized in a tree-like structure.
 */
export interface RouteObject {
  caseSensitive: boolean
  children?: RouteObject[]
  element: React.ReactNode
  path: string
}

/**
 * A "partial route" object is usually supplied by the user and may omit
 * certain properties of a real route object such as `path` and `element`,
 * which have reasonable defaults.
 */
export interface PartialRouteObject {
  caseSensitive?: boolean
  children?: PartialRouteObject[]
  element?: React.ReactNode
  path?: string
}

/**
 * The parameters that were parsed from the URL path.
 */
export type Params = Record<string, string>

export interface RouteMatch {
  route: RouteObject
  pathname: string
  params: Params
}

export interface PathMatch {
  path: string
  pathname: string
  params: Params
}
