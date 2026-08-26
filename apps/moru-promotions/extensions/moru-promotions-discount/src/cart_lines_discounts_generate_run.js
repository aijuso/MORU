// @ts-check
import { buildLinesResult } from './promotions.js';

// `ProductDiscountSelectionStrategy.First` の実値。
// `../generated/api` を import しない = `shopify app function typegen` に依存しない。
const SELECTION_STRATEGY_FIRST = 'FIRST';

export function cartLinesDiscountsGenerateRun(input) {
  return buildLinesResult(input, { selectionStrategy: SELECTION_STRATEGY_FIRST });
}
