import React from 'react'
import { To, State } from '../history'
import { invariant, warning } from './utils'
import { LocationContext } from './context'
import { useInRouterContext, useNavigate } from './hooks'

export interface NavigateProps {
  to: To
  replace?: boolean
  state?: State
}
export default function Navigate({ to, replace, state }: NavigateProps): null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of
    // the router loaded. We can help them understand how to avoid that.
    `<Navigate> may be used only in the context of a <Router> component.`
  )

  warning(
    !React.useContext(LocationContext).static,
    `<Navigate> must not be used on the initial render in a <StaticRouter>. ` +
      `This is a no-op, but you should modify your code so the <Navigate> is ` +
      `only ever rendered in response to some user interaction or state change.`
  )

  let navigate = useNavigate()
  React.useEffect(() => {
    navigate(to, { replace, state })
  })

  return null
}
