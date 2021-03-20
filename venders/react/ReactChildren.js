function traverseChildren(children, result) {
  if (Array.isArray(children)) {
    for (let i = 0, l = children.length; i < l; i++) {
      traverseChildren(children[i], result)
    }
  } else {
    result.push(children)
  }
}
function flattenChildren(children) {
  if (children == null) {
    return children
  }
  const result = []
  traverseChildren(children, result)

  return result
}

function mapChildren(children, fn, ctx) {
  if (children == null) return null
  children = flattenChildren(children)
  return children.map((child, index) => fn.call(ctx, child, index))
}
function forEachChildren(children, fn, ctx) {
  if (children == null) return null
  children = flattenChildren(children)
  children.forEach((child, index) => {
    fn.call(ctx, child, index)
  })
}
function countChildren(children) {
  if (children == null) return 0
  return flattenChildren(children).length
}
function onlyChild(children) {
  children = toArray(children)
  if (children.length !== 1)
    throw new Error(
      'Children.only: expected to receive a single element child.'
    )
  return children[0]
}
function toArray(children) {
  if (children == null) return []
  return flattenChildren(children).filter(
    // 排除 null undefined boolean
    (child) => child != null && typeof child !== 'boolean'
  )
}

export {
  forEachChildren as forEach,
  mapChildren as map,
  countChildren as count,
  onlyChild as only,
  toArray
}
