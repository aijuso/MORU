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
 *
 * ## 配送方法の許可リスト(D-146)
 *
 * 送料無料にしてよい配送方法は、設定の `freeShippingDeliveryOptionTitles` に
 * **明示的に列挙されたものだけ**。ローンチ時点では `["通常配送"]` のみ。
 *
 * 以前は `deliveryGroups` を丸ごと 100%OFF していた。これだと**将来 Shopify 側に
 * 配送方法が増えたとき、その新しい配送方法まで自動的に無料になる。**
 * 速達 ¥3,762 をローンチ対象から外した判断(D-146)と同じ理由で、
 * **知らない配送方法には当てない。**
 *
 * 許可リストが無い / 空 / 文字列以外 → **何もしない**。
 * 許可リストに載っていても、カートにその title の配送オプションが無ければ何もしない。
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
 * 送料無料にしてよい配送方法の title 一覧を読む。
 * 読めなければ null(= 何もしない)。空配列も null 扱い(= fail-closed)。
 */
export function readAllowedOptionTitles(config) {
  if (!config || typeof config !== 'object') return null;
  const raw = config.freeShippingDeliveryOptionTitles;
  if (!Array.isArray(raw)) return null;
  const titles = raw
    .filter((t) => typeof t === 'string')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  return titles.length > 0 ? titles : null;
}

/**
 * カートの配送オプションのうち、許可リストに載っている title のものだけを返す。
 * 同じ title の配送オプションが複数あることがある
 * (例: 通常配送 ¥870 と、¥7,700 以上の条件で出る 通常配送 ¥0)。両方対象にしてよい。
 */
export function allowedDeliveryOptionHandles(deliveryGroups, allowedTitles) {
  const allowed = new Set(allowedTitles);
  const handles = [];
  const seen = new Set();
  for (const group of deliveryGroups || []) {
    for (const option of (group && group.deliveryOptions) || []) {
      const handle = option && option.handle;
      const title = option && typeof option.title === 'string' ? option.title.trim() : null;
      if (typeof handle !== 'string' || handle.length === 0) continue;
      if (title === null || !allowed.has(title)) continue;
      if (seen.has(handle)) continue;
      seen.add(handle);
      handles.push(handle);
    }
  }
  return handles;
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

  const config = readConfig(input);

  const threshold = readThreshold(config);
  if (threshold === null) return { operations: [] }; // fail-closed

  const allowedTitles = readAllowedOptionTitles(config);
  if (allowedTitles === null) return { operations: [] }; // fail-closed

  const subtotal = preDiscountSubtotal((input.cart && input.cart.lines) || []);
  if (subtotal < threshold) return { operations: [] };

  const groups = (input.cart && input.cart.deliveryGroups) || [];
  const targets = allowedDeliveryOptionHandles(groups, allowedTitles).map((handle) => ({
    deliveryOption: { handle },
  }));
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
