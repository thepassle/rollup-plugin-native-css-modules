import { createHash } from 'node:crypto';

const DEFAULT_HASH_SIZE = 8;

/**
 * @param {string} source 
 * @returns {string}
 */
export function getSourceHash(source) {
	return createHash('sha256').update(source).digest('hex').slice(0, DEFAULT_HASH_SIZE);
}

/**
 * @param {string} specifier
 * @returns {boolean}
 */
export function isBareModuleSpecifier(specifier) {
  return !!specifier?.replace(/'/g, '')[0].match(/[@a-zA-Z]/g);
}