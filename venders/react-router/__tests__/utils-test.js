import React from 'react'
import {
  Routes,
  Route,
  createRoutesFromChildren,
  matchRoutes
} from '../../react-router'
import type { RouteObject } from '../types'

describe('utils', () => {
  beforeEach(() => {})

  afterEach(() => {})

  describe('createRoutesFromChildren', () => {
    let routes: RouteObject[] = []
    function pickPaths(routes: RouteObject[], pathname: string) {
      let matches = matchRoutes(routes, { pathname })
      return matches ? matches.map((match) => match.route.path) : null
    }
    function Admin() {
      return <h1>Admin</h1>
    }
    function Manage() {
      return <h1>Manage</h1>
    }
    const MockRoutes = (basename = '') => {
      return (
        <Routes basename={basename}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/manage" element={<Manage />} />
        </Routes>
      )
    }
    it('把ReactElement转换成树状结构', () => {
      routes = createRoutesFromChildren(MockRoutes().props.children)
      expect(routes).toMatchSnapshot()
    })
    it('匹配当前路由的children', () => {
      expect(pickPaths(routes, '/admin')).toEqual(['/admin'])
    })
  })
})
