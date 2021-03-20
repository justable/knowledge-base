import React from '../../react'

describe('forwardRef', () => {
  const FancyButton = React.forwardRef((props, ref) => (
    <button ref={ref} className="FancyButton">
      {props.children}
    </button>
  ))

  it('数据结构', () => {
    expect(FancyButton).toHaveProperty('$$typeof')
    expect(FancyButton).toHaveProperty('render')
  })
})
