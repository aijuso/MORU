// @ts-check
import { buildResult } from './multi_buy.js';

// `ProductDiscountSelectionStrategy.First` の実値。
// `../generated/api` を import しない = `shopify app function typegen` に依存しない。
const SELECTION_STRATEGY_FIRST = 'FIRST';

/**
 * cart.lines.discounts.generate.run のエントリポイント。
 * 判定ロジックは ./multi_buy.js(純粋関数・Node から素でテストできる)。
 */
export function cartLinesDiscountsGenerateRun(input) {
  return buildResult(input, { selectionStrategy: SELECTION_STRATEGY_FIRST });
}
