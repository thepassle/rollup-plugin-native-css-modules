import { IGNORED_PROTOCOLS } from './CONSTANTS.js';

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
export function isConcatenatedSource(node) {
  return node.source.type === 'BinaryExpression';
}

/**
 * @example const styles = await import('./styles.css', { assert: { type: 'css' } });
 * @param {import('estree-walker').Node} node
 * @returns {boolean}
 */
export function isAwaitDynamicImport(node) {
  return (
    node.init?.type === 'AwaitExpression' && 
    node.init?.argument?.type === 'ImportExpression' &&
    isDynamicCssImport(node.init.argument)
  )
}

/**
 * @example const styles = import('./styles.css', { assert: { type: 'css' } });
 * @param {import('estree-walker').Node} node
 * @returns {boolean}
 */
export function isDynamicImport(node) {
  return (
    node.init?.type === 'ImportExpression' &&
    isDynamicCssImport(node.init)
  )
}

/**
 * @param {import('estree-walker').Node} node
 * @returns {boolean}
 */
export function sourceHasDynamicVars(node) {
  return isTemplateStringWithVariables(node) || isConcatenatedSource(node);
}

/**
 * @param {import('estree-walker').Node} node
 * @returns {boolean}
 */
export function shouldIgnore(node) {
  if (
    node.source.type !== 'Literal' &&
    node.source.type !== 'TemplateLiteral'
  ) {
    return true;
  }

  const moduleSpecifier = /** @type {string} */ (node.source.value || node.source.quasis[0].value.raw);

  /** Ignore external css files or data URIs */
  if(IGNORED_PROTOCOLS.some(protocol => moduleSpecifier.startsWith(protocol))) {
    return true;
  }

  if(sourceHasDynamicVars(node)) {
    return true;
  }

  return false;
}