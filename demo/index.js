import styleSheet from './styles.css' assert { type: 'css' };
import fooStyles from '@thepassle/css/foo.css' assert { type: 'css' };
import { foo } from './foo.js';
import { bar } from './src/bar.js';

const dynamic = await import('./dynamic-import.css', {
  assert: { type: 'css' },
});

const dynamicWithVariables = await import(`./dynamic-${1}.css`, {
  assert: { type: 'css' },
});

const quux = '';
const dynamicVariable = await import(quux, {
  assert: { type: 'css' },
});

const dynamicImportTemplateString = await import(`./template-string.css`, {
  assert: { type: 'css' },
});

console.log(dynamicImportTemplateString);
console.log(dynamicVariable);
console.log(dynamicWithVariables);
console.log(dynamic);
console.log(bar);
console.log(foo);
console.log(styleSheet);
console.log(fooStyles);
