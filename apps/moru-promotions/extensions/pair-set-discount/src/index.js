// @ts-check
//
// Shopify CLI(Javy)の JS Function ビルドは、エントリポイントを
// `src/index.js` に固定して探す。ここが唯一のエントリで、
// shopify.extension.toml の `export` に対応する名前を named export する。
export { cartLinesDiscountsGenerateRun } from './cart_lines_discounts_generate_run.js';
