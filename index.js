import path from 'path';
import fs from 'fs/promises';
import { createRequire } from 'module';
import { asyncWalk } from 'estree-walker';
import MagicString from 'magic-string';

import { 
  isStaticCssImport, 
  isDynamicCssImport, 
  isAwaitDynamicImport,
  isDynamicImport,
  sourceHasDynamicVars,
  shouldIgnore
} from './src/ast.js';
import { getSourceHash, isBareModuleSpecifier } from './src/utils.js';
import { runtime } from './src/runtime.js';
import { 
  BUNDLE_VAR, 
  GET_BUNDLED_SHEET, 
  BUNDLE_SOURCE, 
  PREFIX
} from './src/CONSTANTS.js';

const require = createRequire(import.meta.url);

/**
 * @param {{
 *  transform?: (code: string) => string | Promise<string>,
 *  bundle?: 'css' | 'js'
 * }} options
 * @return {import('rollup').Plugin}
 */
export default function css(options = {}) {
  const cssFilesMap = {};
  const cssSourcesMap = {};

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
              if(sourceHasDynamicVars(node)) {
                console.warn(`
  [ROLLUP-PLUGIN-NATIVE-CSS-MODULES]: Dynamic imports with variables are not supported, since they rely on runtime code they are hard to statically analyze.
  
  Found in module "${id}": 
  
  ${code.substring(node.start, node.end)}
  `);

              }
     
              if(shouldIgnore(node)) {
                return;
              }

              const moduleSpecifier = /** @type {string} */ (node.source.value || node.source.quasis[0].value.raw);

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
                const assetName = `${PREFIX}styles-${hash}.css`;
                cssFilesMap[absolutePathToCssModule] = assetName;
                cssSourcesMap[`./${assetName}`] = assetSource;

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
    },
    async renderChunk(code) {
      if(options.bundle) {
        const ast = this.parse(code);
        const magicString = new MagicString(code);
        let modifiedCode = false;
  
        const cssImports = [];
        await asyncWalk(ast, {
          enter: async (node) => {
            if(node.type === 'VariableDeclarator') {
              if(
                isAwaitDynamicImport(node) || 
                isDynamicImport(node)
              ) { 
                const dynamicImportNode = node.init?.argument ?? node.init;
                
                if(shouldIgnore(dynamicImportNode)) {
                  return;
                }
  
                const source = /** @type {string} */ (dynamicImportNode.source.value || dynamicImportNode.source.quasis[0].value.raw);
                const specifier = node.id.name;
                
  
                magicString.overwrite(
                  dynamicImportNode.start, 
                  dynamicImportNode.end, 
                  options.bundle === 'css' 
                    ? `Promise.resolve(${GET_BUNDLED_SHEET}(${BUNDLE_VAR}, '${source.replace('./', '')}'))`
                    : `Promise.resolve(__dynamic_import_${specifier}__)`
                );
  
                cssImports.push({
                  dynamic: true,
                  specifier,
                  source
                });
              }
            }
  
            if (isStaticCssImport(node)) {
              const source = node.source.value;
  
              if(shouldIgnore(node)) {
                return
              };
  
              const specifier = node.specifiers.find(specifier => specifier.type === 'ImportDefaultSpecifier')?.local?.name;
  
              cssImports.push({
                specifier,
                source
              });
              magicString.remove(node.start, node.end);
            }
          }
        });
  
        let bundledStyleSheet = '';
        let newImports = [];
        const alreadyAdded = [];
  
        for (const { dynamic, source, specifier } of cssImports) {
          const normalizedSource = source.replace('./', '');

          if (options.bundle === 'css') {
            if (!alreadyAdded.find(({source}) => source === normalizedSource)) {
              bundledStyleSheet += `@supports sheet(${normalizedSource}) {${cssSourcesMap[source]}}\n`
              alreadyAdded.push({
                source: normalizedSource,
                specifier,
                dynamic: !!dynamic
              });
            }
    
            if(!dynamic) {
              newImports.push(`const ${specifier} = ${GET_BUNDLED_SHEET}(${BUNDLE_VAR}, '${normalizedSource}');`)
            }
          }

          if (options.bundle === 'js') {
            const name = dynamic ? `__dynamic_import_${specifier}__` : specifier;

            if(!alreadyAdded.find(({source}) => source === normalizedSource)) {
              bundledStyleSheet += `const ${name} = new CSSStyleSheet();${name}.replaceSync(\`${cssSourcesMap[source]}\`);export { ${name} };\n\n`
              alreadyAdded.push({
                source: normalizedSource,
                specifier,
                dynamic: !!dynamic
              });
            } else {
              const source = alreadyAdded.find(({source}) => source === normalizedSource);
              const target = source.dynamic ? `__dynamic_import_${source.specifier}__` : source.specifier;
              bundledStyleSheet += `export { ${target} as ${name} };`;
            }

            newImports.push(dynamic ? `__dynamic_import_${specifier}__` : specifier);
          }
        }
        const hash = getSourceHash(bundledStyleSheet);
        const bundledStyleSheetAssetName = `${BUNDLE_SOURCE}-${hash}.${options.bundle === 'js' ? 'js' : 'css'}`;
  
        this.emitFile({
          type: 'asset',
          fileName: bundledStyleSheetAssetName,
          source: bundledStyleSheet
        });
  
        if(options.bundle === 'css') {
          const bundledStylesheetImport = `import ${BUNDLE_VAR} from './${bundledStyleSheetAssetName}' with { type: 'css' };`
          magicString.prepend(newImports.join(''));
          // @TODO minify runtime
          magicString.prepend(runtime);
          magicString.prepend(bundledStylesheetImport);
        }

        if(options.bundle === 'js') {
          const bundledStylesheetImport = `import { ${newImports.join(',')} } from './${bundledStyleSheetAssetName}';`
          magicString.prepend(bundledStylesheetImport);
        }

        // @TODO source map
        return magicString.toString();
      }
    },
    generateBundle(_, bundle) {
      if(options.bundle) {
        for (const key of Object.keys(bundle)) {
          if(key.startsWith(PREFIX)) {
            delete bundle[key];
          }
        }
      }
    }
  }
}

