import React from '../../react'

describe('ReactCreateRef', () => {
  it('应该返回一个current为null的对象', () => {
    const result = React.createRef()
    expect(result).toStrictEqual({
      current: null
    })
  })
})
