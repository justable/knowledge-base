import React from 'react'
import { useLocation, useResolvedPath } from '../react-router'
import Link, { LinkProps } from './Link'

export interface NavLinkProps extends LinkProps {
  activeClassName?: string
  activeStyle?: object
  caseSensitive?: boolean
  end?: boolean
}

/**
 * A <Link> wrapper that knows if it's "active" or not.
 */
const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLinkWithRef(
    {
      'aria-current': ariaCurrentProp = 'page',
      activeClassName = 'active',
      activeStyle,
      caseSensitive = false,
      className: classNameProp = '',
      end = false,
      style: styleProp,
      to,
      ...rest
    },
    ref
  ) {
    let location = useLocation()
    let path = useResolvedPath(to)

    let locationPathname = location.pathname
    let toPathname = path.pathname
    if (!caseSensitive) {
      locationPathname = locationPathname.toLowerCase()
      toPathname = toPathname.toLowerCase()
    }

    let isActive = end
      ? locationPathname === toPathname
      : locationPathname.startsWith(toPathname)

    let ariaCurrent = isActive ? ariaCurrentProp : undefined
    let className = [classNameProp, isActive ? activeClassName : null]
      .filter(Boolean)
      .join(' ')
    let style = { ...styleProp, ...(isActive ? activeStyle : null) }

    return (
      <Link
        {...rest}
        aria-current={ariaCurrent}
        className={className}
        ref={ref}
        style={style}
        to={to}
      />
    )
  }
)

export default NavLink
