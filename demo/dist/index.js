import styleSheet from './styles-3275f665.css' assert { type: 'css' };
import fooStyles from './styles-3a3f9686.css' assert { type: 'css' };
import styleSheet2 from './styles-ef356b6d.css' assert { type: 'css' };

console.log(styleSheet);

const foo = 1;

console.log(styleSheet);
console.log(styleSheet2);
const bar = 2;

const dynamic = await import('./styles-eff1cae3.css', { assert: { type: 'css' } });

const dynamicWithVariables = await import(`./dynamic-${1}.css`, {
  assert: { type: 'css' },
});

const quux = '';
const dynamicVariable = await import(quux, {
  assert: { type: 'css' },
});

const dynamicImportTemplateString = await import('./styles-f32a2851.css', { assert: { type: 'css' } });

const externalHttps = await import('https://foo.com/index.css', { assert: { type: 'css' } });
const externalHttp = await import('http://foo.com/index.css', { assert: { type: 'css' } });
// const dataUri = await import('data:text/bla');
const concatenatedStrings = await import('./my' + 1 + '.css', { assert: { type: 'css'} });

console.log(concatenatedStrings);
// console.log(dataUri);
console.log(externalHttp);
console.log(externalHttps);
console.log(dynamicImportTemplateString);
console.log(dynamicVariable);
console.log(dynamicWithVariables);
console.log(dynamic);
console.log(bar);
console.log(foo);
console.log(styleSheet);
console.log(fooStyles);
