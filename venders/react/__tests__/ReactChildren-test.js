import React from '../../react'

describe('ReactChildren', () => {
  it('可以自定义回调函数context', () => {
    const context = {}
    const element = <span />
    const instance = <div>{element}</div>
    const callback = jest.fn(function (elm, index) {
      expect(this).toBe(context)
      return elm
    })
    const mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context
    )
    expect(callback).toHaveBeenCalledWith(element, 0)
    expect(mappedChildren[0]).toBe(element)

    callback.mockClear()
    React.Children.forEach(instance.props.children, callback, context)
    expect(callback).toHaveBeenCalledWith(element, 0)
  })

  it('toArray will flattened', () => {
    const flattened = React.Children.toArray([
      [<div key="apple" />, <div key="banana" />, <div key="camel" />],
      [<div key="banana" />, <div key="camel" />, <div key="deli" />]
    ])
    expect(flattened.length).toBe(6)
  })

  it('count will flattened', () => {
    const count = React.Children.count([
      [<div key="apple" />, <div key="banana" />, <div key="camel" />],
      [<div key="banana" />, <div key="camel" />, <div key="deli" />]
    ])
    expect(count).toBe(6)
  })

  it('only should throw error when passed two children', () => {
    let instance = (
      <div>
        <span></span>
        <span></span>
      </div>
    )
    expect(() => React.Children.only(instance.props.children)).toThrow()
    instance = <div>{[<span></span>, <span></span>]}</div>
    expect(() => React.Children.only(instance.props.children)).toThrow()
    instance = (
      <div>
        <span></span>
      </div>
    )
    let result
    expect(
      () => (result = React.Children.only(instance.props.children))
    ).not.toThrow()
    expect(result).toBe(instance.props.children)
  })
})
