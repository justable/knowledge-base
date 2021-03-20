import React from 'react'
import { PartialLocation, To, Path, parsePath } from '../history'
import { invariant, readOnly, warning, warningOnce } from '../shared'
import Outlet from './Outlet'
import type {
  PathPattern,
  RouteObject,
  PartialRouteObject,
  Params,
  RouteMatch,
  PathMatch
} from './types'

export { invariant, readOnly, warning, warningOnce }

/**
 * 根据<Routes>组件的children生成规范化的数据结构
 * @param children
 */
export function createRoutesFromChildren(
  children: React.ReactNode
): RouteObject[] {
  let routes: RouteObject[] = []

  React.Children.forEach(children, (element) => {
    if (!React.isValidElement(element)) {
      return
    }

    if (element.type === React.Fragment) {
      routes.push.apply(
        routes,
        createRoutesFromChildren(element.props.children)
      )
      return
    }

    let route: RouteObject = {
      path: element.props.path || '/',
      caseSensitive: element.props.caseSensitive === true,
      element
    }

    if (element.props.children) {
      let childRoutes = createRoutesFromChildren(element.props.children)
      if (childRoutes.length) {
        route.children = childRoutes
      }
    }

    routes.push(route)
  })

  return routes
}

/**
 * 根据路由配置对象生成规范化的数据结构
 * @param array
 */
export function createRoutesFromArray(
  array: PartialRouteObject[]
): RouteObject[] {
  return array.map((partialRoute) => {
    let route: RouteObject = {
      path: partialRoute.path || '/',
      caseSensitive: partialRoute.caseSensitive === true,
      element: partialRoute.element || <Outlet />
    }

    if (partialRoute.children) {
      route.children = createRoutesFromArray(partialRoute.children)
    }

    return route
  })
}

/**
 * Returns a path with params interpolated.
 *
 * @see https://reactrouter.com/api/generatePath
 */
export function generatePath(path: string, params: Params = {}): string {
  return path
    .replace(/:(\w+)/g, (_, key) => {
      invariant(params[key] != null, `Missing ":${key}" param`)
      return params[key]
    })
    .replace(/\/*\*$/, (_) =>
      params['*'] == null ? '' : params['*'].replace(/^\/*/, '/')
    )
}

/**
 * Matches the given routes to a location and returns the match data.
 *
 * @see https://reactrouter.com/api/matchRoutes
 */
export function matchRoutes(
  routes: RouteObject[],
  location: string | PartialLocation,
  basename = ''
): RouteMatch[] | null {
  if (typeof location === 'string') {
    location = parsePath(location)
  }

  let pathname = location.pathname || '/'
  if (basename) {
    let base = basename.replace(/^\/*/, '/').replace(/\/+$/, '')
    if (pathname.startsWith(base)) {
      pathname = pathname === base ? '/' : pathname.slice(base.length)
    } else {
      // Pathname does not start with the basename, no match.
      return null
    }
  }

  let branches = flattenRoutes(routes)
  rankRouteBranches(branches)

  let matches = null
  for (let i = 0; matches == null && i < branches.length; ++i) {
    // TODO: Match on search, state too?
    matches = matchRouteBranch(branches[i], pathname)
  }

  return matches
}

function flattenRoutes(
  routes: RouteObject[],
  branches: RouteBranch[] = [],
  parentPath = '',
  parentRoutes: RouteObject[] = [],
  parentIndexes: number[] = []
): RouteBranch[] {
  routes.forEach((route, index) => {
    let path = joinPaths([parentPath, route.path])
    let routes = parentRoutes.concat(route)
    let indexes = parentIndexes.concat(index)

    // Add the children before adding this route to the array so we traverse the
    // route tree depth-first and child routes appear before their parents in
    // the "flattened" version.
    if (route.children) {
      flattenRoutes(route.children, branches, path, routes, indexes)
    }

    branches.push([path, routes, indexes])
  })

  return branches
}

type RouteBranch = [string, RouteObject[], number[]]

function rankRouteBranches(branches: RouteBranch[]): void {
  let pathScores = branches.reduce<Record<string, number>>((memo, [path]) => {
    memo[path] = computeScore(path)
    return memo
  }, {})

  // Sorting is stable in modern browsers, but we still support IE 11, so we
  // need this little helper.
  stableSort(branches, (a, b) => {
    let [aPath, , aIndexes] = a
    let aScore = pathScores[aPath]

    let [bPath, , bIndexes] = b
    let bScore = pathScores[bPath]

    return aScore !== bScore
      ? bScore - aScore // Higher score first
      : compareIndexes(aIndexes, bIndexes)
  })
}

const paramRe = /^:\w+$/
const dynamicSegmentValue = 2
const emptySegmentValue = 1
const staticSegmentValue = 10
const splatPenalty = -2
const isSplat = (s: string) => s === '*'

function computeScore(path: string): number {
  let segments = path.split('/')
  let initialScore = segments.length
  if (segments.some(isSplat)) {
    initialScore += splatPenalty
  }

  return segments
    .filter((s) => !isSplat(s))
    .reduce(
      (score, segment) =>
        score +
        (paramRe.test(segment)
          ? dynamicSegmentValue
          : segment === ''
          ? emptySegmentValue
          : staticSegmentValue),
      initialScore
    )
}

function compareIndexes(a: number[], b: number[]): number {
  let siblings =
    a.length === b.length && a.slice(0, -1).every((n, i) => n === b[i])

  return siblings
    ? // If two routes are siblings, we should try to match the earlier sibling
      // first. This allows people to have fine-grained control over the matching
      // behavior by simply putting routes with identical paths in the order they
      // want them tried.
      a[a.length - 1] - b[b.length - 1]
    : // Otherwise, it doesn't really make sense to rank non-siblings by index,
      // so they sort equally.
      0
}

function stableSort(array: any[], compareItems: (a: any, b: any) => number) {
  // This copy lets us get the original index of an item so we can preserve the
  // original ordering in the case that they sort equally.
  let copy = array.slice(0)
  array.sort((a, b) => compareItems(a, b) || copy.indexOf(a) - copy.indexOf(b))
}

function matchRouteBranch(
  branch: RouteBranch,
  pathname: string
): RouteMatch[] | null {
  let routes = branch[1]
  let matchedPathname = '/'
  let matchedParams: Params = {}

  let matches: RouteMatch[] = []
  for (let i = 0; i < routes.length; ++i) {
    let route = routes[i]
    let remainingPathname =
      matchedPathname === '/'
        ? pathname
        : pathname.slice(matchedPathname.length) || '/'
    let routeMatch = matchPath(
      {
        path: route.path,
        caseSensitive: route.caseSensitive,
        end: i === routes.length - 1
      },
      remainingPathname
    )

    if (!routeMatch) return null

    matchedPathname = joinPaths([matchedPathname, routeMatch.pathname])
    matchedParams = { ...matchedParams, ...routeMatch.params }

    matches.push({
      route,
      pathname: matchedPathname,
      params: readOnly<Params>(matchedParams)
    })
  }

  return matches
}

/**
 * Performs pattern matching on a URL pathname and returns information about
 * the match.
 *
 * @see https://reactrouter.com/api/matchPath
 */
export function matchPath(
  pattern: PathPattern,
  pathname: string
): PathMatch | null {
  if (typeof pattern === 'string') {
    pattern = { path: pattern }
  }

  let { path, caseSensitive = false, end = true } = pattern
  let [matcher, paramNames] = compilePath(path, caseSensitive, end)
  let match = pathname.match(matcher)

  if (!match) return null

  let matchedPathname = match[1]
  let values = match.slice(2)
  let params = paramNames.reduce((memo, paramName, index) => {
    memo[paramName] = safelyDecodeURIComponent(values[index], paramName)
    return memo
  }, {} as Params)

  return { path, pathname: matchedPathname, params }
}

function compilePath(
  path: string,
  caseSensitive: boolean,
  end: boolean
): [RegExp, string[]] {
  let keys: string[] = []
  let source =
    '^(' +
    path
      .replace(/^\/*/, '/') // Make sure it has a leading /
      .replace(/\/?\*?$/, '') // Ignore trailing / and /*, we'll handle it below
      .replace(/[\\.*+^$?{}|()[\]]/g, '\\$&') // Escape special regex chars
      .replace(/:(\w+)/g, (_: string, key: string) => {
        keys.push(key)
        return '([^\\/]+)'
      }) +
    ')'

  if (path.endsWith('*')) {
    if (path.endsWith('/*')) {
      source += '\\/?' // Don't include the / in params['*']
    }
    keys.push('*')
    source += '(.*)'
  } else if (end) {
    source += '\\/?'
  }

  if (end) source += '$'

  let flags = caseSensitive ? undefined : 'i'
  let matcher = new RegExp(source, flags)

  return [matcher, keys]
}

function safelyDecodeURIComponent(value: string, paramName: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch (error) {
    warning(
      false,
      `The value for the URL param "${paramName}" will not be decoded because` +
        ` the string "${value}" is a malformed URL segment. This is probably` +
        ` due to a bad percent encoding (${error}).`
    )

    return value
  }
}

/**
 * Returns a resolved path object relative to the given pathname.
 *
 * @see https://reactrouter.com/api/resolvePath
 */
export function resolvePath(to: To, fromPathname = '/'): Path {
  let { pathname: toPathname, search = '', hash = '' } =
    typeof to === 'string' ? parsePath(to) : to

  let pathname = toPathname
    ? resolvePathname(
        toPathname,
        toPathname.startsWith('/') ? '/' : fromPathname
      )
    : fromPathname

  return { pathname, search, hash }
}

const trimTrailingSlashes = (path: string) => path.replace(/\/+$/, '')
const normalizeSlashes = (path: string) => path.replace(/\/\/+/g, '/')
export const joinPaths = (paths: string[]) => normalizeSlashes(paths.join('/'))
const splitPath = (path: string) => normalizeSlashes(path).split('/')

function resolvePathname(toPathname: string, fromPathname: string): string {
  let segments = splitPath(trimTrailingSlashes(fromPathname))
  let relativeSegments = splitPath(toPathname)

  relativeSegments.forEach((segment) => {
    if (segment === '..') {
      // Keep the root "" segment so the pathname starts at /
      if (segments.length > 1) segments.pop()
    } else if (segment !== '.') {
      segments.push(segment)
    }
  })

  return segments.length > 1 ? joinPaths(segments) : '/'
}
