import path from 'path';
import fs from 'fs/promises';
import { createRequire } from 'module';
import { asyncWalk } from 'estree-walker';
import MagicString from 'magic-string';

import { isStaticCssImport, isDynamicCssImport, isTemplateStringWithVariables } from './src/ast.js';
import { checksumFile, isBareModuleSpecifier } from './src/utils.js';

const require = createRequire(import.meta.url);

/**
 * @param {{
 *  transform?: (code: string) => string | Promise<string>
 * }} options
 * @return {import('rollup').Plugin}
 */
export default function css(options = {}) {
  const cssFilesMap = {};

  return {
    name: 'css',
    resolveId(id) {
      if (id.endsWith('.css')) {
        return {
          id,
          external: true
        }
      }
    },
    async transform(code, id) {
      if (!id.endsWith('.css')) {
        const ast = this.parse(code);
        const magicString = new MagicString(code);
        let modifiedCode = false;

        await asyncWalk(ast, {
          enter: async node => {
            /**
             * @example `import styles from './styles.css' assert { type: 'css' };`
             */
            if (
              isStaticCssImport(node) || 
              isDynamicCssImport(node)
            ) {
              /**
               * @example `import(`./foo-${i}.css`, { assert: { type: 'css'} })`
               */
              if(
                isDynamicCssImport(node) &&
                isTemplateStringWithVariables(node)
              ) {
                console.warn(`
[ROLLUP-PLUGIN-NATIVE-CSS-MODULES]: Dynamic imports with variables are not supported, since they rely on runtime code they are hard to statically analyze.

Found in module "${id}": 

${code.substring(node.start, node.end)}
`);
                return;
              }

              /**
               * @example `import(foo, { assert: { type: 'css'} });`
               */
              if(node.source.type === 'Identifier') {
                return;
              }

              /**
               * Resolve path to the module specifier
               * @example bare module specifier: 'foo/index.css'
               * @example relative module specifier: './src/index.css'
               */
              const moduleSpecifier = /** @type {string} */ (node.source.value || node.source.quasis[0].value.raw);
              const dirname = path.dirname(id);
              const absolutePathToCssModule = isBareModuleSpecifier(moduleSpecifier)
                ? require.resolve(moduleSpecifier)
                : path.join(dirname, moduleSpecifier);
              /** 
               * If we havent processed this file before
               */
              if (!cssFilesMap[absolutePathToCssModule]) {
                const cssModuleContentsBuffer = await fs.readFile(absolutePathToCssModule);
                const cssModuleContents = await cssModuleContentsBuffer.toString();

                const assetSource = options?.transform
                  ? await options?.transform(cssModuleContents)
                  : cssModuleContents;

                const checksum = await checksumFile(absolutePathToCssModule)
                const assetName = `styles-${checksum}.css`;
                cssFilesMap[absolutePathToCssModule] = assetName;

                this.emitFile({
                  type: 'asset',
                  fileName: assetName,
                  source: assetSource
                });

                magicString.overwrite(
                  node.source.start,
                  node.source.end,
                  `'./${assetName}'`
                );

                modifiedCode = true;
              } else {
                magicString.overwrite(
                  node.source.start,
                  node.source.end,
                  `'./${cssFilesMap[absolutePathToCssModule]}'`
                );

                modifiedCode = true;
              }
            }
          }
        });

        if (modifiedCode) {
          return {
            code: magicString.toString(),
            map: magicString.generateMap({ hires: true }),
          };
        }

        return null;
      }
    }
  }
}

