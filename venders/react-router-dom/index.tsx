import BrowserRouter, { BrowserRouterProps } from './BrowserRouter'
import HashRouter, { HashRouterProps } from './HashRouter'
import Link, { LinkProps } from './Link'
import NavLink, { NavLinkProps } from './NavLink'
import Prompt, { PromptProps } from './Prompt'

// components
export { BrowserRouter, HashRouter, Link, NavLink, Prompt }

// typings
export type {
  BrowserRouterProps,
  HashRouterProps,
  LinkProps,
  NavLinkProps,
  PromptProps
}

// hooks
export { usePrompt, useSearchParams } from './hooks'

// react-router
export {
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Router,
  Routes,
  createRoutesFromArray,
  createRoutesFromChildren,
  generatePath,
  matchRoutes,
  matchPath,
  resolvePath,
  useBlocker,
  useHref,
  useInRouterContext,
  useLocation,
  useMatch,
  useNavigate,
  useOutlet,
  useParams,
  useResolvedPath,
  useRoutes
} from '../react-router'
