import React from 'react'
import { createPath, To, State } from '../history'
import {
  useHref,
  useNavigate,
  useLocation,
  useResolvedPath
} from '../react-router'
import { isModifiedEvent } from './utils'

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  replace?: boolean
  state?: State
  to: To
}

/**
 * The public API for rendering a history-aware <a>.
 */
const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function LinkWithRef(
    { onClick, replace: replaceProp = false, state, target, to, ...rest },
    ref
  ) {
    let href = useHref(to)
    let navigate = useNavigate()
    let location = useLocation()
    let path = useResolvedPath(to)

    function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
      if (onClick) onClick(event)
      if (
        !event.defaultPrevented && // onClick prevented default
        event.button === 0 && // Ignore everything but left clicks
        (!target || target === '_self') && // Let browser handle "target=_blank" etc.
        !isModifiedEvent(event) // Ignore clicks with modifier keys
      ) {
        event.preventDefault()

        // If the URL hasn't changed, a regular <a> will do a replace instead of
        // a push, so do the same here.
        let replace = !!replaceProp || createPath(location) === createPath(path)

        navigate(to, { replace, state })
      }
    }

    return (
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      <a
        {...rest}
        href={href}
        onClick={handleClick}
        ref={ref}
        target={target}
      />
    )
  }
)

export default Link
