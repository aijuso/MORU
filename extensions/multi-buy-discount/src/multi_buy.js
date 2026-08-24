// @ts-check
/**
 * MORU LIVING — まとめ買い割引の判定ロジック(純粋関数)
 *
 * 仕様は docs/12_price_redesign_and_multibuy.md §7-2 〜 §7-4。
 *
 *   - 数量は **Variant ID ではなく PRODUCT ID 単位で合算する**
 *   - Product 合計 2点   → 10% OFF(その Product の全ラインに適用)
 *   - Product 合計 3点以上 → 15% OFF(同上)
 *   - 対象商品は Product metafield `custom.multi_buy_eligible` が true のものだけ
 *
 * このファイルに Shopify の生成コード(../generated/api)を import しない。
 * import すると Node から素で読めなくなり、tests/run_tests.mjs が動かせなくなるため。
 * 列挙値は呼び出し側(cart_lines_discounts_generate_run.js)から渡す。
 */

/** 既定のしきい値。discount metafield で上書きできる。 */
export const DEFAULT_TIERS = [
  { minQuantity: 3, percentage: 15 },
  { minQuantity: 2, percentage: 10 },
];

const ELIGIBILITY_NAMESPACE = 'custom';
const ELIGIBILITY_KEY = 'multi_buy_eligible';

/**
 * metafield の値を boolean に読む。
 * 未設定・null・false はすべて「対象外」。**fail-closed**。
 * Owner が metafield を付けるまで、この Function を有効化しても割引は1円も出ない。
 */
function isEligible(product) {
  const raw = product && product.multiBuy && product.multiBuy.value;
  return raw === true || raw === 'true';
}

/** しきい値表を降順に正規化する。壊れた設定は既定値に落とす。 */
export function normalizeTiers(configured) {
  if (!Array.isArray(configured) || configured.length === 0) return DEFAULT_TIERS;
  const tiers = configured
    .map((t) => ({ minQuantity: Number(t.minQuantity), percentage: Number(t.percentage) }))
    .filter((t) => Number.isFinite(t.minQuantity) && Number.isFinite(t.percentage) &&
                   t.minQuantity >= 2 && t.percentage > 0 && t.percentage < 100)
    .sort((a, b) => b.minQuantity - a.minQuantity);
  return tiers.length ? tiers : DEFAULT_TIERS;
}

/** 合計数量から適用率を返す。該当なしは 0。 */
export function percentageFor(totalQuantity, tiers) {
  for (const tier of tiers) {
    if (totalQuantity >= tier.minQuantity) return tier.percentage;
  }
  return 0;
}

/**
 * @param {object} input Function の Input
 * @param {object} [options]
 * @param {string} [options.selectionStrategy] ProductDiscountSelectionStrategy.First 相当
 * @param {(pct:number)=>string} [options.message] 割引名の組み立て
 * @returns {{operations: object[]}}
 */
export function buildResult(input, options = {}) {
  const selectionStrategy = options.selectionStrategy || 'FIRST';
  const message = options.message || ((pct) => `まとめ買い ${pct}%OFF`);

  // Product 割引クラスが付いていない Discount では何もしない
  const classes = (input && input.discount && input.discount.discountClasses) || [];
  const hasProductClass = classes.some((c) => String(c).toUpperCase() === 'PRODUCT');
  if (!hasProductClass) return { operations: [] };

  const config = (input.discount && input.discount.metafield && input.discount.metafield.jsonValue) || {};
  const tiers = normalizeTiers(config.tiers);

  const lines = (input.cart && input.cart.lines) || [];

  // 1st pass: Product ID ごとに数量を合算する(Variant はまたいで合算する)
  /** @type {Map<string, {quantity: number, lineIds: string[]}>} */
  const byProduct = new Map();
  for (const line of lines) {
    const merchandise = line.merchandise;
    if (!merchandise || !('product' in merchandise) || !merchandise.product) continue;
    const product = merchandise.product;
    if (!isEligible(product)) continue;

    const entry = byProduct.get(product.id) || { quantity: 0, lineIds: [] };
    entry.quantity += line.quantity;
    entry.lineIds.push(line.id);
    byProduct.set(product.id, entry);
  }

  // 2nd pass: 率ごとにまとめて candidate を作る(同率の Product は1 candidate に束ねる)
  /** @type {Map<number, string[]>} */
  const targetsByPercentage = new Map();
  for (const [, entry] of byProduct) {
    const pct = percentageFor(entry.quantity, tiers);
    if (pct <= 0) continue;
    const bucket = targetsByPercentage.get(pct) || [];
    bucket.push(...entry.lineIds);
    targetsByPercentage.set(pct, bucket);
  }

  if (targetsByPercentage.size === 0) return { operations: [] };

  const candidates = [...targetsByPercentage.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([pct, lineIds]) => ({
      message: message(pct),
      // quantity を渡さない = そのラインの全数量が対象(docs/12 §7-3 の
      //「アヒル×2 + カエル×1 = 3点 → 全数量15%OFF」を満たす)
      targets: lineIds.map((id) => ({ cartLine: { id } })),
      value: { percentage: { value: pct.toFixed(1) } },
    }));

  return {
    operations: [{ productDiscountsAdd: { candidates, selectionStrategy } }],
  };
}
