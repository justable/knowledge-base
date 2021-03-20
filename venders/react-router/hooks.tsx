import React from 'react'
import { LocationContext, RouteContext } from './context'
import { State, To, Blocker, Transition, Path } from '../history'
import {
  createRoutesFromArray,
  joinPaths,
  matchRoutes,
  resolvePath,
  matchPath,
  warningOnce,
  readOnly,
  invariant,
  warning
} from './utils'
import type {
  PartialRouteObject,
  RouteObject,
  Params,
  Navigator,
  NavigateFunction,
  PathPattern,
  PathMatch
} from './types'

/**
 * Returns an imperative method for changing the location. Used by <Link>s, but
 * may also be used by other elements to change the location.
 */
export function useNavigate(): NavigateFunction {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useNavigate() may be used only in the context of a <Router> component.`
  )

  let locationContext = React.useContext(LocationContext)
  let navigator = locationContext.navigator as Navigator
  let { pathname } = React.useContext(RouteContext)

  let activeRef = React.useRef(false)
  React.useEffect(() => {
    activeRef.current = true
  })

  let navigate: NavigateFunction = React.useCallback(
    (to: To | number, options: { replace?: boolean; state?: State } = {}) => {
      if (activeRef.current) {
        if (typeof to === 'number') {
          navigator.go(to)
        } else {
          let path = resolvePath(to, pathname)
          ;(!!options.replace ? navigator.replace : navigator.push)(
            path,
            options.state
          )
        }
      } else {
        warning(
          false,
          `You should call navigate() in a useEffect, not when ` +
            `your component is first rendered.`
        )
      }
    },
    [navigator, pathname]
  )

  return navigate
}

React.forwardRef
/**
 * 获取context中的outlet
 */
export function useOutlet(): React.ReactElement | null {
  return React.useContext(RouteContext).outlet
}

export function useParams(): Params {
  return React.useContext(RouteContext).params
}

export function useLocation(): Location {
  invariant(
    useInRouterContext(),
    `useLocation() may be used only in the context of a <Router> component.`
  )

  return (React.useContext(LocationContext).location as unknown) as Location
}

/**
 * 判断context中的location是否为null
 */
export function useInRouterContext(): boolean {
  return React.useContext(LocationContext).location != null
}

/**
 * 根据路由配置对象生成tree状路由节点
 * @param partialRoutes
 * @param basename
 */
export function useRoutes(
  partialRoutes: PartialRouteObject[],
  basename = ''
): React.ReactElement | null {
  invariant(
    useInRouterContext(),
    `useRoutes() may be used only in the context of a <Router> component.`
  )

  let routes = React.useMemo(() => createRoutesFromArray(partialRoutes), [
    partialRoutes
  ])

  return useRoutes_(routes, basename)
}

export function useRoutes_(
  routes: RouteObject[],
  basename = ''
): React.ReactElement | null {
  let {
    route: parentRoute,
    pathname: parentPathname,
    params: parentParams
  } = React.useContext(RouteContext)

  if (process.env.NODE_ENV === 'development') {
    // You won't get a warning about 2 different <Routes> under a <Route>
    // without a trailing *, but this is a best-effort warning anyway since we
    // cannot even give the warning unless they land at the parent route.
    let parentPath = parentRoute && parentRoute.path
    warningOnce(
      parentPathname,
      !parentRoute || parentRoute.path.endsWith('*'),
      `You rendered descendant <Routes> (or called \`useRoutes\`) at "${parentPathname}"` +
        ` (under <Route path="${parentPath}">) but the parent route path has no trailing "*".` +
        ` This means if you navigate deeper, the parent won't match anymore and therefore` +
        ` the child routes will never render.` +
        `\n\n` +
        `Please change the parent <Route path="${parentPath}"> to <Route path="${parentPath}/*">.`
    )
  }

  basename = basename ? joinPaths([parentPathname, basename]) : parentPathname

  let location = useLocation() as Location
  let matches = React.useMemo(() => matchRoutes(routes, location, basename), [
    location,
    routes,
    basename
  ])

  if (!matches) {
    // TODO: Warn about nothing matching, suggest using a catch-all route.
    return null
  }

  // Otherwise render an element.
  // 路由的树状结构最终只会匹配一条线路，最后的那个节点就是前一个的outlet
  let element = matches.reduceRight((outlet, { params, pathname, route }) => {
    return (
      <RouteContext.Provider
        children={route.element}
        value={{
          outlet,
          params: readOnly<Params>({ ...parentParams, ...params }),
          pathname: joinPaths([basename, pathname]),
          route
        }}
      />
    )
  }, null as React.ReactElement | null)

  return element
}

/**
 * Blocks all navigation attempts. This is useful for preventing the page from
 * changing until some condition is met, like saving form data.
 *
 * @see https://reactrouter.com/api/useBlocker
 */
export function useBlocker(blocker: Blocker, when = true): void {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useBlocker() may be used only in the context of a <Router> component.`
  )

  let navigator = React.useContext(LocationContext).navigator as Navigator

  React.useEffect(() => {
    if (!when) return

    let unblock = navigator.block((tx: Transition) => {
      let autoUnblockingTx = {
        ...tx,
        retry() {
          // Automatically unblock the transition so it can play all the way
          // through before retrying it. TODO: Figure out how to re-enable
          // this block if the transition is cancelled for some reason.
          unblock()
          tx.retry()
        }
      }

      blocker(autoUnblockingTx)
    })

    return unblock
  }, [navigator, blocker, when])
}

/**
 * Resolves the pathname of the given `to` value against the current location.
 *
 * @see https://reactrouter.com/api/useResolvedPath
 */
export function useResolvedPath(to: To): Path {
  let { pathname } = React.useContext(RouteContext)
  return React.useMemo(() => resolvePath(to, pathname), [to, pathname])
}

/**
 * Returns the full href for the given "to" value. This is useful for building
 * custom links that are also accessible and preserve right-click behavior.
 *
 * @see https://reactrouter.com/api/useHref
 */
export function useHref(to: To): string {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useHref() may be used only in the context of a <Router> component.`
  )

  let navigator = React.useContext(LocationContext).navigator as Navigator
  let path = useResolvedPath(to)

  return navigator.createHref(path)
}

/**
 * Returns true if the URL for the given "to" value matches the current URL.
 * This is useful for components that need to know "active" state, e.g.
 * <NavLink>.
 *
 * @see https://reactrouter.com/api/useMatch
 */
export function useMatch(pattern: PathPattern): PathMatch | null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useMatch() may be used only in the context of a <Router> component.`
  )

  let location = useLocation() as Location
  return matchPath(pattern, location.pathname)
}
