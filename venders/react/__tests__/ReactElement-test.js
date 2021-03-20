import React from '../../react'
import { create as createTestRenderer } from 'react-test-renderer'

describe('ReactElement', () => {
  describe('createElement', () => {
    it('快照element的数据结构', () => {
      const element = React.createElement(
        'div',
        { key: 'div_1', className: 'container' },
        'hello world'
      )
      // toMatchSnapshot 会自动将对象转成jsx
      expect(element).toMatchSnapshot()
    })
  })
  describe('cloneElement', () => {
    it('是浅克隆', () => {
      const style = { display: 'block' }
      const oldElement = React.createElement('div', { style }, 'hello world')
      expect(React.isValidElement(oldElement)).toBeTruthy()
      const newElement = React.cloneElement(oldElement)
      expect(React.isValidElement(newElement)).toBeTruthy()
      expect(newElement.props.style).toBe(style)
      style.display = 'none'
      expect(newElement.props.style.display).toBe('none')
    })
  })
  it('isValidElement', () => {
    let result
    result = React.isValidElement('')
    expect(result).toBeFalsy()
    result = React.isValidElement(() => <div></div>)
    expect(result).toBeFalsy()
    result = React.isValidElement(<div></div>)
    expect(result).toBeTruthy()
  })
})
