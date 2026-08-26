// @ts-check
/**
 * MORU LIVING — 販促割引の統合ロジック(純粋関数)
 *
 * `multi-buy-discount` と `pair-set-discount` を1本にまとめたもの(D-128)。
 * **別々の Function にしておくと、Shopify の組み合わせ設定次第で割引が加算され得る。**
 * Owner 方針(加算禁止・1商品につき割引1つ)をコードで保証するために統合した。
 *
 * ## 優先順位(docs/13 §3-C)
 *
 *   1. PAIR       15%   … 指定した別 Product の組み合わせが揃ったとき
 *   2. Multi-buy  2点10% / 3点以上15% … 同一 Product 内の合計数量
 *   3. Sale       10%   … 対象商品に常時
 *
 * **加算しない。1商品につき採用する割引は1つだけ。**
 *
 * 勝者の決め方(この順で比較):
 *   a. percentage が高い方
 *   b. 同率なら **割引が当たる数量が多い方**
 *      (PAIR は成立セット数までしか当たらないため、同率 15% なら
 *       全数量に当たる Multi-buy の方が顧客にとって得。ここで取りこぼさない)
 *   c. それも同じなら定義順 PAIR > Multi-buy > Sale
 *
 * ## 設定は全て Discount の app metafield から読む(config-driven)
 *
 * **Product ID をこのファイルにハードコードしない。**
 *
 * ```json
 * {
 *   "freeShippingThreshold": 7700,
 *   "pairs": [
 *     { "id": "P-6", "title": "ソファの脇",
 *       "productIds": ["gid://shopify/Product/1", "gid://shopify/Product/2"],
 *       "percentage": 15 }
 *   ],
 *   "multiBuy": {
 *     "productIds": ["gid://shopify/Product/3"],
 *     "tiers": [ { "minQuantity": 2, "percentage": 10 },
 *                { "minQuantity": 3, "percentage": 15 } ]
 *   },
 *   "sale": {
 *     "productIds": ["gid://shopify/Product/4"],
 *     "percentage": 10,
 *     "excludedVariantIds": ["gid://shopify/ProductVariant/9"]
 *   }
 * }
 * ```
 *
 * `multiBuy.productIds` が空のときだけ、Product metafield
 * `custom.multi_buy_eligible` が true の商品を対象とみなす(旧方式の後方互換)。
 * どちらも無ければ Multi-buy は動かない。
 *
 * `sale.excludedVariantIds` は **Variant 単位**の除外。
 * ハル ダイニングチェアの2脚セット(既にセット割が入っている)を Summer Sale から
 * 外すのに使う(D-126)。**Product 単位では外せない**ので Variant で持つ。
 *
 * ## fail-closed
 *
 * 設定が無い / JSON が壊れている / PRODUCT 割引クラスが付いていない
 * → **割引0円**。壊れた設定で勝手に安く売らない。
 *
 * このファイルは Shopify の生成コード(../generated/api)を import しない。
 * import すると Node から素で読めなくなり、tests/run_tests.mjs が動かせなくなる。
 */

/** 定義順の優先度。数字が小さいほど強い(同率・同数量のときの決着用)。 */
export const SOURCE_RANK = { pair: 0, multiBuy: 1, sale: 2 };

/** 既定のまとめ買いしきい値。設定で上書きできる。 */
export const DEFAULT_TIERS = [
  { minQuantity: 3, percentage: 15 },
  { minQuantity: 2, percentage: 10 },
];

function toPercentage(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n < 100 ? n : null;
}

function toIdList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id) => typeof id === 'string' && id.length > 0))];
}

/** PAIR グループを正規化する。使えないものは黙って捨てる(fail-closed)。 */
export function normalizePairs(configured) {
  if (!Array.isArray(configured)) return [];
  const pairs = [];
  const seen = new Set();
  for (const raw of configured) {
    if (!raw || typeof raw !== 'object') continue;
    const percentage = toPercentage(raw.percentage);
    if (percentage === null) continue;
    const productIds = toIdList(raw.productIds);
    // 1商品だけの「組み合わせ」は組み合わせではない。まとめ買いの領分。
    if (productIds.length < 2) continue;
    const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : `pair-${pairs.length + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    pairs.push({
      id,
      title: typeof raw.title === 'string' ? raw.title : '',
      productIds,
      percentage,
    });
  }
  return pairs;
}

/** しきい値表を降順に正規化する。壊れた設定は既定値に落とす。 */
export function normalizeTiers(configured) {
  if (!Array.isArray(configured) || configured.length === 0) return DEFAULT_TIERS;
  const tiers = configured
    .map((t) => ({ minQuantity: Number(t && t.minQuantity), percentage: Number(t && t.percentage) }))
    .filter((t) => Number.isFinite(t.minQuantity) && t.minQuantity >= 2 && toPercentage(t.percentage) !== null)
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
 * カートを Product ID 単位に畳む。Variant はまたいで合算する。
 * @returns {Map<string, {quantity: number, lines: {id: string, quantity: number, variantId: string, eligible: boolean}[]}>}
 */
export function foldCartByProduct(lines) {
  const byProduct = new Map();
  for (const line of lines || []) {
    const merchandise = line && line.merchandise;
    const product = merchandise && merchandise.product;
    if (!product || !product.id) continue;
    const quantity = Number(line.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;

    const entry = byProduct.get(product.id) || { quantity: 0, lines: [] };
    entry.quantity += quantity;
    entry.lines.push({
      id: line.id,
      quantity,
      variantId: merchandise.id || '',
      // 旧方式の後方互換。metafield は文字列で返る。
      eligible: product.multiBuy && (product.multiBuy.value === true || product.multiBuy.value === 'true'),
    });
    byProduct.set(product.id, entry);
  }
  return byProduct;
}

/** 先頭のラインから quantity 個ぶんを割り当てる(同じ Product の Variant 違いに按分)。 */
function allocate(lines, limit) {
  const targets = [];
  let remaining = limit;
  for (const line of lines) {
    if (remaining <= 0) break;
    const quantity = Math.min(line.quantity, remaining);
    remaining -= quantity;
    targets.push({ lineId: line.id, quantity });
  }
  return targets;
}

/**
 * Product ごとに候補となる割引案を全部作る。まだ勝者は決めない。
 * @returns {Map<string, {source: string, percentage: number, label: string, targets: {lineId:string,quantity:number}[], covered: number}[]>}
 */
export function buildCandidates(config, byProduct) {
  /** @type {Map<string, any[]>} */
  const candidates = new Map();
  const push = (productId, candidate) => {
    const list = candidates.get(productId) || [];
    list.push(candidate);
    candidates.set(productId, list);
  };

  // ---- 1. PAIR ----
  for (const pair of normalizePairs(config.pairs || config.groups)) {
    // 成立 = productIds が全てカートにある。setCount = 何セット組めるか。
    let setCount = Infinity;
    let ok = true;
    for (const productId of pair.productIds) {
      const entry = byProduct.get(productId);
      if (!entry) { ok = false; break; }
      if (entry.quantity < setCount) setCount = entry.quantity;
    }
    if (!ok || !Number.isFinite(setCount) || setCount <= 0) continue;

    for (const productId of pair.productIds) {
      const entry = byProduct.get(productId);
      const targets = allocate(entry.lines, setCount);
      if (!targets.length) continue;
      push(productId, {
        source: 'pair',
        percentage: pair.percentage,
        label: pair.title ? `${pair.title} セット ${pair.percentage}%OFF` : `セット購入 ${pair.percentage}%OFF`,
        targets,
        covered: targets.reduce((n, t) => n + t.quantity, 0),
      });
    }
  }

  // ---- 2. Multi-buy ----
  const mb = (config.multiBuy && typeof config.multiBuy === 'object') ? config.multiBuy : {};
  const mbIds = toIdList(mb.productIds);
  const mbTiers = normalizeTiers(mb.tiers);
  for (const [productId, entry] of byProduct) {
    // 設定に productIds があればそれが正。無ければ metafield へ落ちる(後方互換)。
    const eligible = mbIds.length ? mbIds.includes(productId) : entry.lines.some((l) => l.eligible);
    if (!eligible) continue;
    const percentage = percentageFor(entry.quantity, mbTiers);
    if (percentage <= 0) continue;
    // まとめ買いは Product の全数量が対象。
    const targets = entry.lines.map((l) => ({ lineId: l.id, quantity: l.quantity }));
    push(productId, {
      source: 'multiBuy',
      percentage,
      label: `まとめ買い ${percentage}%OFF`,
      targets,
      covered: entry.quantity,
    });
  }

  // ---- 3. Summer Sale ----
  const sale = (config.sale && typeof config.sale === 'object') ? config.sale : {};
  const salePct = toPercentage(sale.percentage);
  const saleIds = toIdList(sale.productIds);
  const excluded = new Set(toIdList(sale.excludedVariantIds));
  if (salePct !== null && saleIds.length) {
    for (const productId of saleIds) {
      const entry = byProduct.get(productId);
      if (!entry) continue;
      // Variant 単位の除外(D-126: ハル 2脚セット)
      const lines = entry.lines.filter((l) => !excluded.has(l.variantId));
      if (!lines.length) continue;
      const targets = lines.map((l) => ({ lineId: l.id, quantity: l.quantity }));
      push(productId, {
        source: 'sale',
        percentage: salePct,
        label: typeof sale.title === 'string' && sale.title ? `${sale.title} ${salePct}%OFF` : `SALE ${salePct}%OFF`,
        targets,
        covered: targets.reduce((n, t) => n + t.quantity, 0),
      });
    }
  }

  return candidates;
}

/**
 * Product ごとに勝者を1つだけ決める。**加算しない。**
 * 率 → 当たる数量 → 定義順(PAIR > Multi-buy > Sale)の順で比較する。
 */
export function resolveWinners(candidates) {
  /** @type {Map<string, any>} */
  const winners = new Map();
  for (const [productId, list] of candidates) {
    let best = null;
    for (const candidate of list) {
      if (
        best === null ||
        candidate.percentage > best.percentage ||
        (candidate.percentage === best.percentage && candidate.covered > best.covered) ||
        (candidate.percentage === best.percentage &&
          candidate.covered === best.covered &&
          SOURCE_RANK[candidate.source] < SOURCE_RANK[best.source])
      ) {
        best = candidate;
      }
    }
    if (best) winners.set(productId, best);
  }
  return winners;
}

/**
 * cart.lines.discounts.generate.run の本体。
 * @param {object} input Function の Input
 * @param {object} [options]
 * @param {string} [options.selectionStrategy] ProductDiscountSelectionStrategy.First 相当
 * @returns {{operations: object[]}}
 */
export function buildLinesResult(input, options = {}) {
  const selectionStrategy = options.selectionStrategy || 'FIRST';

  const classes = (input && input.discount && input.discount.discountClasses) || [];
  if (!classes.some((c) => String(c).toUpperCase() === 'PRODUCT')) return { operations: [] };

  const config = (input.discount && input.discount.metafield && input.discount.metafield.jsonValue) || null;
  if (!config || typeof config !== 'object') return { operations: [] }; // fail-closed

  const byProduct = foldCartByProduct((input.cart && input.cart.lines) || []);
  if (byProduct.size === 0) return { operations: [] };

  const winners = resolveWinners(buildCandidates(config, byProduct));
  if (winners.size === 0) return { operations: [] };

  // 同じ「率 + 表示名」の target はまとめて1 candidate にする
  /** @type {Map<string, {percentage: number, label: string, targets: object[]}>} */
  const buckets = new Map();
  for (const [, winner] of winners) {
    const key = `${winner.percentage}|${winner.label}`;
    const bucket = buckets.get(key) || { percentage: winner.percentage, label: winner.label, targets: [] };
    for (const t of winner.targets) {
      bucket.targets.push({ cartLine: { id: t.lineId, quantity: t.quantity } });
    }
    buckets.set(key, bucket);
  }
  if (buckets.size === 0) return { operations: [] };

  const candidates = [...buckets.values()]
    .sort((a, b) => b.percentage - a.percentage)
    .map((bucket) => ({
      message: bucket.label,
      targets: bucket.targets,
      value: { percentage: { value: bucket.percentage.toFixed(1) } },
    }));

  return { operations: [{ productDiscountsAdd: { candidates, selectionStrategy } }] };
}
