const styleSheet = new CSSStyleSheet();styleSheet.replaceSync(`body {
  color: red;
}`);export { styleSheet };

const styles2 = new CSSStyleSheet();styles2.replaceSync(`body {
  color: blue;
}`);export { styles2 };

const __dynamic_import_dynamicStyles__ = new CSSStyleSheet();__dynamic_import_dynamicStyles__.replaceSync(`.bla {
  color: green;
}`);export { __dynamic_import_dynamicStyles__ };

export { __dynamic_import_dynamicStyles__ as __dynamic_import_dynamicStyles2__ };