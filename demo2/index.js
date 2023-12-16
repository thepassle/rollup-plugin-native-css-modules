import styles from './styles.css' with { type: 'css' };
import styles2 from './styles2.css' with { type: 'css' };
import { bar } from './src/bar.js';

// @TODO handling of dynamic imports isnt correct, they should be chunks?
const dynamicStyles = await import('./dynamic-import.css', { with: { type: 'css' }});
const dynamicStyles2 = import('./dynamic-import.css', { with: { type: 'css' }});

console.log(dynamicStyles2);
console.log(dynamicStyles);
console.log(styles);
console.log(styles2);
console.log(bar);