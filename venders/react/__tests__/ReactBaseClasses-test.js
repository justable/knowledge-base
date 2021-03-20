import React from '../../react'

describe('ReactBaseClasses', () => {
  it('React.Component', () => {
    class Home extends React.Component {}
    const instance = <Home foo="foo"></Home>
    expect(Home.name).toBe('Home')
    expect(instance.props.foo).toBe('foo')

    const ElementType = instance.type
    const instance2 = new ElementType()
    expect(instance2.setState).toBeDefined()
    expect(instance2.forceUpdate).toBeDefined()
    expect(instance2.isReactComponent).toBeTruthy()

    expect(() => {
      instance2.setState('state')
    }).toThrow(
      'setState(...): takes an object of state variables to update or a ' +
        'function which returns an object of state variables.'
    )
  })
  it('React.PureComponent', () => {
    class Home extends React.PureComponent {}
    const instance = <Home foo="foo"></Home>
    expect(Home.name).toBe('Home')
    expect(instance.props.foo).toBe('foo')

    const ElementType = instance.type
    const instance2 = new ElementType()
    expect(instance2.setState).toBeDefined()
    expect(instance2.forceUpdate).toBeDefined()
    expect(instance2.isPureReactComponent).toBeTruthy()
  })
})
