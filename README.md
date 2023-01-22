# Rollup-plugin-native-css-modules

Use native CSS modules with import assertions in Rollup. This plugin is intended to be used if you want to use import assertions in your build _output_, either in browsers that already support it, or because you're using something like [es-module-shims](https://github.com/guybedford/es-module-shims) to support native CSS modules. 

This plugin does **not** transform any CSS module imports to JavaScript, it leaves the import statements and imports in tact.

## Example

Checkout the example on [Stackblitz](https://stackblitz.com/edit/rollup-repro-fbdojc).

Or take a look at the [example project](https://github.com/thepassle/css-example-project) for a more elaborate example.

### Input

`src/index.js`:
```js
import styles from './styles.css' assert { type: 'css' };
```

### Output:

`dist/index.js`:
```js
import styles from './styles-3275f665.css' assert { type: 'css' };
```

## Usage

```
npm i -S rollup-plugin-native-css-modules
```

```js
import css from 'rollup-plugin-native-css-modules';

export default {
  input: 'index.js',
  output: {
    dir: 'dist',
    format: 'esm'
  },
  plugins: [
    css()
    /**
     * Or:
     */
    css({
      transform: (code) => {
        // modify the CSS code, minify, post-process, etc
        return code;
      }
    })
  ]
};
```

## Features

At time of writing Rollup V3 supports import assertion syntax, however, Rollup will still try to parse any module that gets imported in your source code and expect it to be JavaScript. This will cause Rollup to throw an error, because it'll try to parse CSS files expecting it to be JavaScript. This plugin fixes that.

### Support

This plugin supports:

```js
import styles from './styles.css' assert { type: 'css' };
import styles from 'bare-module-specifier/styles.css' assert { type: 'css' };
import('./styles.css', { assert: { type: 'css'} });
```

This plugin does NOT support:
```js
import(`./styles-${i}.css`, { assert: { type: 'css'} });
import('./styles-' + i + '.css', { assert: { type: 'css'} });
```

The reason for this is that imports with dynamic variables are hard to statically analyze, because they rely on runtime code.

External stylesheets are ignored:
```js
import styles from 'http://styles.com/index.css' assert { type: 'css' };
import styles from 'https://styles.com/index.css' assert { type: 'css' };
```

Data uri's are also ignored.

### Deduplication

This plugin also deduplicates imports for the same module. If `foo.js` and `bar.js` both import `my-styles.css`, only one CSS file will be output in the output directory, as opposed to two.

### Hashing

CSS modules output by this plugin receive a hash based on the contents of the CSS file. E.g.:

**input:**
```js
import styles from './styles.css' assert { type: 'css' };
```

**output:**
```js
import styles from './styles-3275f665.css' assert { type: 'css' };
```

### Transform

You can use the `transform` hook to modify the CSS that gets output to, for example, minify your CSS using a tool like [lightning CSS](https://lightningcss.dev/docs.html) or something like postcss.


```js
import css from 'rollup-plugin-native-css-modules';
import { transform } from 'lightningcss';

export default {
  input: 'demo/index.js',
  output: {
    dir: 'demo/dist',
    format: 'esm'
  },
  plugins: [
    css({
      transform: (css) => transform({
        code: Buffer.from(css),
        minify: true
      }).code.toString()
    })
  ]
};
```


## FAQ

### Polyfilling

At the time of writing, browser support for import assertions is still low, so you're probably going to need to polyfill them. You can do this via [`es-module-shims`](https://github.com/guybedford/es-module-shims), note that you'll also need a polyfill for constructable stylesheets, which you can polyfill via [`construct-style-sheets-polyfill`](https://www.npmjs.com/package/construct-style-sheets-polyfill).

### Why are CSS files not combined and bundled?

Because you can't. Consider the following example:

```
my-app/
├─ index.js
├─ element-a.js
├─ element-b.js
├─ blue-styles.css
├─ red-styles.css
```

<details>
<summary><code>index.js</code></summary>

```js
import './element-a.js';
import './element-b.js';
```
</details>

<details>
<summary><code>element-a.js</code></summary>

```js
import blueStyles from './blue-styles.css' assert { type: 'css' };

class ElementA extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [blueStyles];
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = '<h1>blue</h1>';
  }
}

customElements.define('element-a', ElementA);
```
</details>

<details>
<summary><code>element-b.js</code></summary>

```js
import redStyles from './red-styles.css' assert { type: 'css' };

class ElementB extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [redStyles];
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = '<h1>red</h1>';
  }
}

customElements.define('element-b', ElementB);
```
</details>

<details>
<summary><code>blue-styles.css</code></summary>

```css
h1 {
  color: blue;
}
```
</details>

<details>
<summary><code>red-styles.css</code></summary>

```css
h1 {
  color: red;
}
```
</details>

Bundling this would lead to the following build output:

<details>
<summary><code>bundle.js</code></summary>

```js
import blueStyles from './styles-3275f665.css' assert { type: 'css' };
import redStyles from './styles-3a3f9686.css' assert { type: 'css' };

class ElementA extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [blueStyles];
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = '<h1>blue</h1>';
  }
}

customElements.define('element-a', ElementA);

class ElementB extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [redStyles];
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = '<h1>red</h1>';
  }
}

customElements.define('element-b', ElementB);
```
</details>

<details>
<summary><code>styles-3a3f9686.css</code></summary>

```css
h1 {
  color: red;
}
```
</details>

<details>
<summary><code>styles-3275f665.css</code></summary>

```css
h1 {
  color: blue;
}
```
</details>

If you would combine the CSS files for `blueStyles` and `redStyles` into one, and use that stylesheet in both components, it would lead to style clashes; you would only have red `<h1>`s, instead of one blue `<h1>` for `<element-a>` and one red `<h1>` for `<element-b>`.

To illustrate:

<details>
<summary><code>bundle.js</code></summary>

```js
import bundledStyles from './styles-f32a2851.css' assert { type: 'css' };

class ElementA extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [bundledStyles];
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = '<h1>blue</h1>';
  }
}

customElements.define('element-a', ElementA);

class ElementB extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [bundledStyles];
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = '<h1>red</h1>';
  }
}

customElements.define('element-b', ElementB);
```

</details>




<details>
<summary><code>styles-f32a2851.css</code></summary>

```css
h1 {
  color: blue;
}

h1 {
  color: red;
}
```

</details>