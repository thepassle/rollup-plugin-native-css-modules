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

console.log(dynamicWithVariables);
console.log(dynamic);
console.log(bar);
console.log(foo);
console.log(styleSheet);
console.log(fooStyles);
