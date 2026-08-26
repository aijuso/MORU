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
 * **加算しない。ただし単位は「商品」ではなく「購入1点(quantity)」(D-144)。**
 *
 *   - **同じ1点に2つの割引を重ねない**(加算禁止)
 *   - **同じ商品でも、別の1点になら別の施策を当ててよい**
 *
 * 各 1点について、この順で強い施策から先に取っていく:
 *   a. percentage が高い方
 *   b. 同率なら定義順 PAIR > Multi-buy > Sale
 *
 * **強い割引が一部の点数にしか当たらないとき、残りの点数から弱い割引を奪わない。**
 *
 * 例: クラウド ×3 + マッシュルーム ×1(PAIR 15% / Sale 10%)
 *   PAIR は1セットしか成立しないので クラウド1点 + マッシュルーム1点 に 15%。
 *   **クラウドの残り2点には Sale 10% が当たる。**
 *   旧ロジックでは PAIR が商品ごと勝ってしまい、残り2点の割引が消えていた(D-143)。
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
 * ## まとめ買いの対象は Product metafield が唯一の正(D-134)
 *
 * **`custom.multi_buy_eligible = true` の商品だけがまとめ買いの対象。**
 * 設定 JSON に対象商品リストは**持たない。**
 *
 * Frontend(PDP のまとめ買い UI)も同じ metafield を見て出し分けているため、
 * ここに productIds を置くと**同じことを2箇所で手管理する**ことになり、
 * 「UI には出るのに割引が付かない / その逆」が起きる。**正本は1つにする。**
 *
 * 設定 JSON で変えられるのは `multiBuy.tiers`(数量しきい値と率)だけ。
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

/**
 * 設定を読む。**Discount の `$app` metafield が正。**
 * 無ければ shop の `custom.moru_promotions_config` にフォールバックする(D-138)。
 *
 * `$app` はこのアプリ専用の名前空間なので、**アプリ自身の Admin API トークンが無いと書けない。**
 * 一方 shop の `custom` はマーチャント所有なので、管理画面から Discount を作る運用でも
 * 設定を入れられる。**どちらも無ければ何もしない(fail-closed)。**
 */
export function readConfig(input) {
  const app = input && input.discount && input.discount.metafield && input.discount.metafield.jsonValue;
  if (app && typeof app === 'object') return app;
  const shop = input && input.shop && input.shop.metafield && input.shop.metafield.jsonValue;
  if (shop && typeof shop === 'object') return shop;
  return null;
}

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

/**
 * Product ごとに「その商品に当たり得る施策」を列挙する。**まだ点数の割当はしない。**
 *
 * 各施策は次を持つ:
 *   - `maxUnits`  … その施策が当てられる最大点数(PAIR は成立セット数。他は無制限)
 *   - `lineOk`    … その施策を当ててよいラインか(Sale の Variant 除外に使う)
 *
 * @returns {Map<string, {source:string, percentage:number, label:string, maxUnits:number, lineOk:(l:object)=>boolean}[]>}
 */
export function buildPromotions(config, byProduct) {
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
      push(productId, {
        source: 'pair',
        percentage: pair.percentage,
        label: pair.title ? `${pair.title} セット ${pair.percentage}%OFF` : `セット購入 ${pair.percentage}%OFF`,
        // PAIR は成立セット数ぶんしか当たらない。残りの点数は他の施策に回す。
        maxUnits: setCount,
        lineOk: () => true,
      });
    }
  }

  // ---- 2. Multi-buy ----
  // 対象判定は Product metafield `custom.multi_buy_eligible` だけを見る(D-134)。
  // 設定 JSON に対象商品リストを持たせない = Frontend と正本を1つにするため。
  // `multiBuy` キーが設定に無いときは、まとめ買いそのものを動かさない。
  // 対象商品は metafield が正だが、**施策の ON/OFF は設定側で持つ**。
  // 空の設定でいきなり割引が出るのは fail-closed に反する。
  const mb = (config.multiBuy && typeof config.multiBuy === 'object') ? config.multiBuy : null;
  const mbTiers = mb ? normalizeTiers(mb.tiers) : [];
  for (const [productId, entry] of (mb ? byProduct : [])) {
    if (!entry.lines.some((l) => l.eligible)) continue;
    const percentage = percentageFor(entry.quantity, mbTiers);
    if (percentage <= 0) continue;
    // 率は **カート内のその商品の合計点数**で決まる(PAIR が何点使ったかに関係なく)。
    // 当てる先は「まだ他の施策が取っていない点数」。割当は allocatePromotions が行う。
    push(productId, {
      source: 'multiBuy',
      percentage,
      label: `まとめ買い ${percentage}%OFF`,
      maxUnits: Infinity,
      lineOk: () => true,
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
      if (entry.lines.every((l) => excluded.has(l.variantId))) continue;
      push(productId, {
        source: 'sale',
        percentage: salePct,
        label: typeof sale.title === 'string' && sale.title ? `${sale.title} ${salePct}%OFF` : `SALE ${salePct}%OFF`,
        maxUnits: Infinity,
        // Variant 単位の除外(D-126: ハル 2脚セット)。PAIR / まとめ買いには効かない。
        lineOk: (l) => !excluded.has(l.variantId),
      });
    }
  }

  return candidates;
}

/**
 * 施策を **1点(quantity)単位** で割り当てる(D-144)。
 *
 * 強い施策から順に、**まだ誰も取っていない点数**を取っていく。
 * すでに割り当てられた点数には二度と当たらないので **加算は起きない。**
 * 強い施策が一部の点数しか取れなくても、**残りは次に強い施策が取れる**。
 *
 * 比較順: ① percentage が高い方 → ② 同率なら定義順 PAIR > Multi-buy > Sale
 *
 * @returns {{percentage:number, label:string, source:string, targets:{lineId:string,quantity:number}[]}[]}
 */
export function allocatePromotions(byProduct, promotionsByProduct) {
  const allocations = [];

  for (const [productId, promotions] of promotionsByProduct) {
    const entry = byProduct.get(productId);
    if (!entry) continue;

    // 残り点数をライン単位で持つ。ここから引いていく。
    const remaining = new Map(entry.lines.map((l) => [l.id, l.quantity]));

    const ordered = [...promotions].sort((a, b) =>
      b.percentage - a.percentage || SOURCE_RANK[a.source] - SOURCE_RANK[b.source]);

    for (const promo of ordered) {
      let budget = promo.maxUnits;
      if (!(budget > 0)) continue;
      const targets = [];
      for (const line of entry.lines) {
        if (budget <= 0) break;
        if (!promo.lineOk(line)) continue;
        const left = remaining.get(line.id) || 0;
        const quantity = Math.min(left, budget);
        if (quantity <= 0) continue;
        remaining.set(line.id, left - quantity);
        budget -= quantity;
        targets.push({ lineId: line.id, quantity });
      }
      if (targets.length) {
        allocations.push({ percentage: promo.percentage, label: promo.label, source: promo.source, targets });
      }
    }
  }
  return allocations;
}

/**
 * cart.lines.discounts.generate.run の本体。
 * @param {object} input Function の Input
 * @param {object} [options]
 * @param {string} [options.selectionStrategy] ProductDiscountSelectionStrategy.First 相当
 * @returns {{operations: object[]}}
 */
export function buildLinesResult(input, options = {}) {
  // **ALL でなければならない。**FIRST は「候補リストの最初の1つだけを適用する」ため、
  // 商品が2つ以上あるカートで2つ目以降の割引が丸ごと消える(D-144)。
  // 割当が点数単位で排他になっているので、ALL でも加算は起きない。
  const selectionStrategy = options.selectionStrategy || 'ALL';

  const classes = (input && input.discount && input.discount.discountClasses) || [];
  if (!classes.some((c) => String(c).toUpperCase() === 'PRODUCT')) return { operations: [] };

  const config = readConfig(input);
  if (!config) return { operations: [] }; // fail-closed

  const byProduct = foldCartByProduct((input.cart && input.cart.lines) || []);
  if (byProduct.size === 0) return { operations: [] };

  const allocations = allocatePromotions(byProduct, buildPromotions(config, byProduct));
  if (allocations.length === 0) return { operations: [] };

  // 同じ「率 + 表示名」はまとめて1 candidate にする。
  // 割当は点数単位で排他なので、candidate 同士の target は重ならない。
  /** @type {Map<string, {percentage: number, label: string, targets: object[]}>} */
  const buckets = new Map();
  for (const a of allocations) {
    const key = `${a.percentage}|${a.label}`;
    const bucket = buckets.get(key) || { percentage: a.percentage, label: a.label, targets: [] };
    for (const t of a.targets) {
      bucket.targets.push({ cartLine: { id: t.lineId, quantity: t.quantity } });
    }
    buckets.set(key, bucket);
  }

  const candidates = [...buckets.values()]
    .sort((a, b) => b.percentage - a.percentage)
    .map((bucket) => ({
      message: bucket.label,
      targets: bucket.targets,
      value: { percentage: { value: bucket.percentage.toFixed(1) } },
    }));

  return { operations: [{ productDiscountsAdd: { candidates, selectionStrategy } }] };
}
