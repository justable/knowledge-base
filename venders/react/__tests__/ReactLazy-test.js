import React from '..'

describe('ReactLazy', () => {
  it('数据结构', () => {
    const instance = React.lazy(() => Promise.resolve())
    expect(instance).toHaveProperty('$$typeof')
    expect(instance).toHaveProperty('_ctor')
    expect(instance).toHaveProperty('_status')
    expect(instance).toHaveProperty('_result')
  })
})
