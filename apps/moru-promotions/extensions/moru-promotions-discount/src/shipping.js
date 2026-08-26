// @ts-check
/**
 * MORU LIVING — 送料無料の判定ロジック(純粋関数)
 *
 * ## 解きたい問題(D-127)
 *
 * Shopify 標準の配送料金条件は **割引後の金額**で評価される。そのため:
 *
 * ```
 * 割引前 ¥7,960  → 送料無料
 *        ↓ まとめ買い 2点 10%OFF(−¥796)
 * 割引後 ¥7,164  → 送料 ¥870 が発生
 * = 実質 +¥74 の値上げ(割引を使ったほうが高い)
 * ```
 *
 * Owner 方針は **送料無料ライン ¥7,700 を変えない**こと。
 * したがって「**割引前** subtotal が ¥7,700 以上なら、割引後に下回っても送料無料を維持する」
 * を Function 側で実装する。
 *
 * ## 同じ Function に同居させる理由
 *
 * Discount Function は1つの拡張に複数ターゲットを宣言でき、
 * `discount.discountClasses` に何が入っているかで出し分けられる。
 * **割引を決めているのと同じ Function が同じ設定 metafield を読んで配送も決める**ので、
 * しきい値とその判定基準を1箇所に書ける。
 *
 * ## ⚠️ 未検証の1点
 *
 * 配送ターゲットが実行される時点で `line.cost.amountPerQuantity` が
 * **商品割引の適用前か適用後か**は、ドキュメントから断定できなかった。
 * **DEV ストアでテスト注文を通して実測してから本番に出すこと。**
 * 適用後だった場合は、割引率が設定 metafield にあるので足し戻して復元できる。
 * 手順は `ops/_promotion_architecture_20260825.md` §1。
 *
 * ## fail-closed
 *
 * SHIPPING 割引クラスが付いていない / 設定が読めない / しきい値が数値でない
 * → **何もしない**(Shopify 標準の ¥7,700 条件がそのまま働く)。
 * **壊れた設定で送料を勝手に無料にしない。**
 */

import { readConfig } from './promotions.js';

/**
 * 割引前の subtotal を、明細の単価 × 数量から自前で組み立てる。
 * `cart.cost.subtotalAmount` を使わないのは、そちらが割引後の値になり得るため。
 */
export function preDiscountSubtotal(lines) {
  let total = 0;
  for (const line of lines || []) {
    const quantity = Number(line && line.quantity);
    const unit = Number(line && line.cost && line.cost.amountPerQuantity && line.cost.amountPerQuantity.amount);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    if (!Number.isFinite(unit) || unit < 0) continue;
    total += unit * quantity;
  }
  return total;
}

/** 設定からしきい値を読む。読めなければ null(= 何もしない)。 */
export function readThreshold(config) {
  if (!config || typeof config !== 'object') return null;
  const n = Number(config.freeShippingThreshold);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * cart.delivery-options.discounts.generate.run の本体。
 * @param {object} input Function の Input
 * @param {object} [options]
 * @param {string} [options.selectionStrategy] DeliveryDiscountSelectionStrategy.All 相当
 * @returns {{operations: object[]}}
 */
export function buildDeliveryResult(input, options = {}) {
  const selectionStrategy = options.selectionStrategy || 'ALL';

  const classes = (input && input.discount && input.discount.discountClasses) || [];
  if (!classes.some((c) => String(c).toUpperCase() === 'SHIPPING')) return { operations: [] };

  const threshold = readThreshold(readConfig(input));
  if (threshold === null) return { operations: [] }; // fail-closed

  const subtotal = preDiscountSubtotal((input.cart && input.cart.lines) || []);
  if (subtotal < threshold) return { operations: [] };

  const groups = (input.cart && input.cart.deliveryGroups) || [];
  const targets = groups
    .filter((g) => g && typeof g.id === 'string' && g.id.length > 0)
    .map((g) => ({ deliveryGroup: { id: g.id } }));
  if (targets.length === 0) return { operations: [] };

  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates: [
            {
              message: '送料無料',
              targets,
              value: { percentage: { value: '100.0' } },
            },
          ],
          selectionStrategy,
        },
      },
    ],
  };
}
