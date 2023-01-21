import styleSheet from './styles-a28f51d8a292462c.css' assert { type: 'css' };
import fooStyles from './styles-6e5466f81b971d57.css' assert { type: 'css' };
import styleSheet2 from './styles-981fdc66c31c1bf5.css' assert { type: 'css' };

console.log(styleSheet);

const foo = 1;

console.log(styleSheet);
console.log(styleSheet2);
const bar = 2;

const dynamic = await import('./styles-088e4e988949df7a.css', { assert: { type: 'css' } });

const dynamicWithVariables = await import(`./dynamic-${1}.css`, {
  assert: { type: 'css' },
});

console.log(dynamicWithVariables);
console.log(dynamic);
console.log(bar);
console.log(foo);
console.log(styleSheet);
console.log(fooStyles);
