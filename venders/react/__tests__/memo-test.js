import React from '..'

describe('memo', () => {
  it('数据结构', () => {
    const instance = React.memo((props) => <div>{props.name}</div>)
    expect(instance).toHaveProperty('$$typeof')
    expect(instance).toHaveProperty('type')
    expect(instance).toHaveProperty('compare')
  })
})
