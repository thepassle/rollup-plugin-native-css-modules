export const runtime = `
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
      const match = /sheet\((.+)\)/.exec(rule.conditionText);
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
`;