import MemoryRouter, { MemoryRouterProps } from './MemoryRouter'
import Router, { RouterProps } from './Router'
import Routes, { RoutesProps } from './Routes'
import Route, { RouteProps } from './Route'
import Navigate, { NavigateProps } from './Navigate'
import Outlet from './Outlet'
import {
  LocationContext,
  RouteContext,
  LocationContextObject,
  RouteContextObject
} from './context'

// components
export { MemoryRouter, Router, Routes, Route, Outlet, Navigate }

// context
export { LocationContext, RouteContext }

// typings
export type {
  MemoryRouterProps,
  RouterProps,
  RoutesProps,
  RouteProps,
  NavigateProps,
  LocationContextObject,
  RouteContextObject
}

// hooks
export {
  useNavigate,
  useOutlet,
  useLocation,
  useInRouterContext,
  useRoutes,
  useBlocker,
  useHref,
  useMatch,
  useParams,
  useResolvedPath
} from './hooks'

// utils
export {
  createRoutesFromArray,
  createRoutesFromChildren,
  generatePath,
  matchRoutes,
  matchPath,
  resolvePath
} from './utils'
