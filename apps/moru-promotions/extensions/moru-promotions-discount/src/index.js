// Shopify CLI は JS Function のエントリポイントを src/index.js に固定している。
// 各ターゲットの実装はここから再 export する(D-100)。
export { cartLinesDiscountsGenerateRun } from './cart_lines_discounts_generate_run.js';
export { cartDeliveryOptionsDiscountsGenerateRun } from './cart_delivery_options_discounts_generate_run.js';
