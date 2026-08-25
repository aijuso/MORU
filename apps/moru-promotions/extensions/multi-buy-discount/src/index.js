// @ts-check
//
// Shopify CLI(Javy)の JS Function ビルドは、エントリポイントを
// `src/index.js`(または index.ts/jsx/tsx)に固定して探す。
// ここが唯一のエントリで、shopify.extension.toml の `export` に書いた名前を
// そのまま named export する。ロジック本体は multi_buy.js(純粋関数)。
export { cartLinesDiscountsGenerateRun } from './cart_lines_discounts_generate_run.js';
