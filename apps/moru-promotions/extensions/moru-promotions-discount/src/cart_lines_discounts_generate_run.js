// @ts-check
import { buildLinesResult } from './promotions.js';

// `ProductDiscountSelectionStrategy.All` の実値。点数単位で排他に割り当てているので加算は起きない。
// `../generated/api` を import しない = `shopify app function typegen` に依存しない。
const SELECTION_STRATEGY_ALL = 'ALL';

export function cartLinesDiscountsGenerateRun(input) {
  return buildLinesResult(input, { selectionStrategy: SELECTION_STRATEGY_ALL });
}
