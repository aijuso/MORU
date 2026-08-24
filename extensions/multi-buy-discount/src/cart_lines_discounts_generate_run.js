// @ts-check
import { ProductDiscountSelectionStrategy } from '../generated/api';
import { buildResult } from './multi_buy';

/**
 * @typedef {import('../generated/api').CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 * @param {import('../generated/api').Input} input
 * @returns {CartLinesDiscountsGenerateRunResult}
 */
export function cartLinesDiscountsGenerateRun(input) {
  return /** @type {CartLinesDiscountsGenerateRunResult} */ (
    buildResult(input, { selectionStrategy: ProductDiscountSelectionStrategy.First })
  );
}
