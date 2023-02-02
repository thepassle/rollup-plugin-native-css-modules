import css from './index.js';

export default {
  input: 'demo2/index.js',
  output: {
    dir: 'demo2/dist',
    format: 'esm'
  },
  plugins: [
    css({
      bundle: 'js'
      // transform: code => {
      //   return `${code} .bar { color: red;}`;
      // }
    })
  ]
};