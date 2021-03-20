import ReactCurrentOwner from './ReactCurrentOwner'
import { REACT_ELEMENT_TYPE } from '../shared/react/ReactSymbols'
import { invariant } from '../shared'

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
}

export function createElement(type, config, children) {
  const props = {}
  let key = null
  let ref = null
  // self and source only work in development, could be ingore in production
  let self = null
  let source = null

  if (config != null) {
    ref = config.ref === undefined ? null : config.ref
    key = config.key === undefined ? null : config.key
    self = config.__self === undefined ? null : config.__self
    source = config.__source === undefined ? null : config.__source
    // Remaining properties are added to a new props object
    for (let propName in config) {
      if (
        Object.prototype.hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName]
      }
    }
  }

  // Children can be more than one argument
  const childrenLength = arguments.length - 2
  if (childrenLength === 1) {
    props.children = children
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength)
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2]
    }
    props.children = childArray
  }

  // defaultProps
  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName]
      }
    }
  }
  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
    props
  )
}

function ReactElement(type, key, ref, self, source, owner, props) {
  const element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE,

    // Built-in properties that belong on the element
    type: type,
    key: key,
    ref: ref,
    props: props,

    // Record the component responsible for creating this element.
    _owner: owner
  }

  return element
}

/**
 * 就是把createElement的第一个参数type换成了element，拷贝传入的element的props给新的element
 * @param {*} element
 * @param {*} config
 * @param {*} children
 */
export function cloneElement(element, config, children) {
  invariant(
    !(element === null || element === undefined),
    'React.cloneElement(...): The argument must be a React element.'
  )

  let propName

  const props = Object.assign({}, element.props)

  let key = element.key
  let ref = element.ref
  const self = element._self
  const source = element._source

  let owner = element._owner

  if (config != null) {
    ref = config.ref === undefined ? null : config.ref
    owner = ReactCurrentOwner.current
    key = config.key === undefined ? null : '' + config.key

    let defaultProps
    if (element.type && element.type.defaultProps) {
      defaultProps = element.type.defaultProps
    }
    for (propName in config) {
      if (
        Object.prototype.hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        if (config[propName] === undefined && defaultProps !== undefined) {
          props[propName] = defaultProps[propName]
        } else {
          props[propName] = config[propName]
        }
      }
    }
  }

  const childrenLength = arguments.length - 2
  if (childrenLength === 1) {
    props.children = children
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength)
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2]
    }
    props.children = childArray
  }

  return ReactElement(element.type, key, ref, self, source, owner, props)
}

export function isValidElement(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  )
}
