import { createReadStream } from 'fs';
import crypto from 'crypto';

/**
 * @param {string} path 
 * @returns {Promise<string>}
 */
export function checksumFile(path) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('shake256', { outputLength: 8 });
    const stream = createReadStream(path);
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/**
 * @param {string} specifier
 * @returns {boolean}
 */
export function isBareModuleSpecifier(specifier) {
  return !!specifier?.replace(/'/g, '')[0].match(/[@a-zA-Z]/g);
}