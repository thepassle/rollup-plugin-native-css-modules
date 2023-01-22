import path from 'path';
import fs from 'fs/promises';
import { createRequire } from 'module';
import { asyncWalk } from 'estree-walker';
import MagicString from 'magic-string';

import { 
  isStaticCssImport, 
  isDynamicCssImport, 
  isTemplateStringWithVariables, 
  isBinaryExpression 
} from './src/ast.js';
import { getSourceHash, isBareModuleSpecifier } from './src/utils.js';

const require = createRequire(import.meta.url);

const ignoredProtocols = ['data:', 'http:', 'https:'];

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
            if (
              isStaticCssImport(node) || 
              isDynamicCssImport(node)
            ) {
              if(
                /**
                 * @example `import(`./foo-${i}.css`, { assert: { type: 'css'} })`
                 */
                isTemplateStringWithVariables(node) ||
                /**
                 * @example `import('./foo-' + i + '.css', { assert: { type: 'css'} })`
                 */
                isBinaryExpression(node)
              ) {
                console.warn(`
[ROLLUP-PLUGIN-NATIVE-CSS-MODULES]: Dynamic imports with variables are not supported, since they rely on runtime code they are hard to statically analyze.

Found in module "${id}": 

${code.substring(node.start, node.end)}
`);
                return;
              }

              if(
                node.source.type !== 'Literal' &&
                node.source.type !== 'TemplateLiteral'
              ) {
                return;
              }

              const moduleSpecifier = /** @type {string} */ (node.source.value || node.source.quasis[0].value.raw);

              /** Ignore external css files or data URIs */
              if(ignoredProtocols.some(protocol => moduleSpecifier.startsWith(protocol))) {
                return;
              }

              const dirname = path.dirname(id);
              const absolutePathToCssModule = isBareModuleSpecifier(moduleSpecifier)
                ? require.resolve(moduleSpecifier)
                : path.join(dirname, moduleSpecifier);

              /** If we havent processed this file before */
              if (!cssFilesMap[absolutePathToCssModule]) {
                const cssModuleContentsBuffer = await fs.readFile(absolutePathToCssModule);
                const cssModuleContents = await cssModuleContentsBuffer.toString();

                const assetSource = options?.transform
                  ? await options?.transform(cssModuleContents)
                  : cssModuleContents;

                const hash = getSourceHash(assetSource);
                const assetName = `styles-${hash}.css`;
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

