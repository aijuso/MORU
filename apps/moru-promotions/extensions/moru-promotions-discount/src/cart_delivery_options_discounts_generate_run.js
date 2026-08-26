// @ts-check
import { buildDeliveryResult } from './shipping.js';

// `DeliveryDiscountSelectionStrategy.All` の実値。
const SELECTION_STRATEGY_ALL = 'ALL';

export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  return buildDeliveryResult(input, { selectionStrategy: SELECTION_STRATEGY_ALL });
}
