import React from '../../react'

describe('ReactContext', () => {
  it('Context数据结构', () => {
    const defaultValue = {
      foo: 'foo'
    }
    const context = React.createContext(defaultValue)
    expect(context).toHaveProperty('$$typeof')
    expect(context).toHaveProperty('_currentValue')
    expect(context).toHaveProperty('_currentValue2')
    expect(context).toHaveProperty('_threadCount')
    expect(context).toHaveProperty('Provider')
    expect(context).toHaveProperty('Consumer')
    expect(context._currentValue).toBe(defaultValue)
    expect(context._currentValue2).toBe(defaultValue)
  })
})
