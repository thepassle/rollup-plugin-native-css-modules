import __css_bundle__ from './bundled-styles-452ed81b.css' with { type: 'css' };
const __cached_sheets__ = new WeakMap();

const __get_bundled_sheet__ = (sheet, name) => {
  let cachedBundledSheets = __cached_sheets__.get(sheet);
  if (cachedBundledSheets === undefined) {
    __cached_sheets__.set(sheet, cachedBundledSheets = new Map());
  }
  let bundledSheet = cachedBundledSheets.get(name);
  if (bundledSheet === undefined) {
    cachedBundledSheets.set(name, bundledSheet = new CSSStyleSheet());
  } else {
    return bundledSheet;
  }
  for (let i = 0; i < sheet.cssRules.length; i++) {
    const rule = sheet.cssRules[i];
    if (rule instanceof CSSSupportsRule && rule.conditionText) {
      const match = /sheet((.+))/.exec(rule.conditionText);
      if (match?.[1] === name) {
        for (let j = 0; j < rule.cssRules.length; j++) {
          const bundledRule = rule.cssRules[j];
          bundledSheet.insertRule(bundledRule.cssText);
        }
        return bundledSheet;
      }
    }
  }
};
const styleSheet = __get_bundled_sheet__(__css_bundle__, '__ROLLUP_PLUGIN_NATIVE_CSS_MODULES_styles-dca460be.css');const styles2 = __get_bundled_sheet__(__css_bundle__, '__ROLLUP_PLUGIN_NATIVE_CSS_MODULES_styles-b27c71a0.css');


console.log(styleSheet);
const bar = 2;

// @TODO handling of dynamic imports isnt correct, they should be chunks?
const dynamicStyles = await import('./dynamic-import.css', { assert: { type: 'css' } });
const dynamicStyles2 = import('./dynamic-import.css', { assert: { type: 'css' } });

console.log(dynamicStyles2);
console.log(dynamicStyles);
console.log(styleSheet);
console.log(styles2);
console.log(bar);
