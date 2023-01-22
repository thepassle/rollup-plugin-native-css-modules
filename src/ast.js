/**
 * @example import styles from './styles.css' assert { type: 'css' };
 * @param {import('estree-walker').Node} node
 * @returns {boolean}
 */
export function isStaticCssImport(node) {
  return (
    node.type === 'ImportDeclaration' &&
    node.assertions?.length &&
    node.assertions.some(assertion => (
      assertion.key.name === 'type' &&
      assertion.value.value === 'css'
    ))
  )
}

/**
 * @example import('./styles.css', {assert: { type: 'css' }});
 * @param {import('estree-walker').Node} node
 * @returns {boolean}
 */
export function isDynamicCssImport(node) {
  return (
    node.type === 'ImportExpression' &&
    node.arguments?.[0]?.properties?.[0]?.key?.name === 'assert' &&
    node.arguments?.[0]?.properties?.[0]?.value?.properties?.[0]?.key.name === 'type' &&
    node.arguments?.[0]?.properties?.[0]?.value?.properties?.[0]?.value?.value === 'css'
  )
}

/**
 * @example import(`./foo-${i}.css`, { assert: { type: 'css'} })
 * @param {import('estree-walker').Node} node
 * @returns {boolean}
 */
export function isTemplateStringWithVariables(node) {
  return (
    node.source.type === 'TemplateLiteral' &&
    node.source?.quasis?.length > 1
  )
}

/**
 * @example import('./foo-' + i + '.css', { assert: { type: 'css'} })
 * @param {import('estree-walker').Node} node
 * @returns {boolean}
 */
export function isBinaryExpression(node) {
  return node.source.type === 'BinaryExpression';
}