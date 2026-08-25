// @ts-check
/**
 * MORU LIVING — ペア・セット割引の判定ロジック(純粋関数)
 *
 * まとめ買い割引(multi-buy-discount)とは**別の Function・別ロジック**。
 *   - multi-buy  … 「同じ Product を何点買ったか」で決まる
 *   - pair-set   … 「違う Product の組み合わせが揃ったか」で決まる
 *
 * ## 対象商品をコードに書かない(config-driven)
 *
 * Product ID をこのファイルにハードコードしない。判定に必要なものは全て
 * Discount の app metafield(`$app` / `function-configuration`)の JSON から読む。
 * 組み合わせを変えるのに Function の再デプロイは要らない。
 *
 * ```json
 * {
 *   "groups": [
 *     {
 *       "id": "flower-pair",
 *       "title": "フラワーシリーズ",
 *       "productIds": ["gid://shopify/Product/1", "gid://shopify/Product/2"],
 *       "percentage": 15
 *     }
 *   ]
 * }
 * ```
 *
 * ## 判定
 *
 *   1. `productIds` の **全て**が、カートに1点以上あること(Variant は問わない)
 *   2. 成立したら `setCount = 各 Product の合計数量の最小値`(= 何セット組めるか)
 *   3. グループ商品の各ラインに、**合計 setCount 個まで** `percentage`% OFF
 *
 *   例: A×2 + B×3 → 2セット成立 → A を2個・B を2個まで割引(B の3個目は対象外)
 *
 * ## 重複しない
 *
 * 1つの Product が複数グループに含まれていても、**割引は1つだけ**。
 * 成立したグループのうち **percentage が最も高いもの**を採る。
 *
 * ## fail-closed
 *
 * 設定が無い / JSON が壊れている / productIds が1件以下 → **割引0円**。
 * Discount に PRODUCT クラスが付いていない場合も何もしない。
 *
 * このファイルは Shopify の生成コード(../generated/api)を import しない。
 * import すると Node から素で読めなくなり、tests/run_tests.mjs が動かせなくなる。
 */

/** グループ設定を正規化する。使えないものは黙って捨てる(fail-closed)。 */
export function normalizeGroups(configured) {
  if (!Array.isArray(configured)) return [];
  const groups = [];
  const seenIds = new Set();

  for (const raw of configured) {
    if (!raw || typeof raw !== 'object') continue;

    const percentage = Number(raw.percentage);
    if (!Number.isFinite(percentage) || percentage <= 0 || percentage >= 100) continue;

    const productIds = Array.isArray(raw.productIds)
      ? [...new Set(raw.productIds.filter((id) => typeof id === 'string' && id.length > 0))]
      : [];
    // 1商品だけの「組み合わせ」は組み合わせではない。まとめ買い割引の領分なので受け付けない。
    if (productIds.length < 2) continue;

    const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : `group-${groups.length + 1}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    groups.push({
      id,
      title: typeof raw.title === 'string' && raw.title.length > 0 ? raw.title : '',
      productIds,
      percentage,
    });
  }
  return groups;
}

/**
 * カートを Product ID 単位に畳む。Variant はまたいで合算する。
 * @returns {Map<string, {quantity: number, lines: {id: string, quantity: number}[]}>}
 */
export function foldCartByProduct(lines) {
  const byProduct = new Map();
  for (const line of lines || []) {
    const merchandise = line && line.merchandise;
    if (!merchandise || !merchandise.product || !merchandise.product.id) continue;
    const quantity = Number(line.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;

    const productId = merchandise.product.id;
    const entry = byProduct.get(productId) || { quantity: 0, lines: [] };
    entry.quantity += quantity;
    entry.lines.push({ id: line.id, quantity });
    byProduct.set(productId, entry);
  }
  return byProduct;
}

/**
 * 成立したグループを返す。成立 = productIds が全てカートにある。
 * `setCount` は何セット組めるか(= 各 Product の合計数量の最小値)。
 */
export function matchGroups(groups, byProduct) {
  const matched = [];
  for (const group of groups) {
    let setCount = Infinity;
    let ok = true;
    for (const productId of group.productIds) {
      const entry = byProduct.get(productId);
      if (!entry) { ok = false; break; }
      if (entry.quantity < setCount) setCount = entry.quantity;
    }
    if (!ok || !Number.isFinite(setCount) || setCount <= 0) continue;
    matched.push({ ...group, setCount });
  }
  return matched;
}

/**
 * Product ごとに「どのグループの割引を当てるか」を1つに決める。
 * 率が高いほうが勝つ。同率なら先に定義されたグループが勝つ(設定順が意味を持つ)。
 */
export function resolveWinners(matched) {
  /** @type {Map<string, {percentage: number, setCount: number, groupId: string, title: string}>} */
  const winnerByProduct = new Map();
  for (const group of matched) {
    for (const productId of group.productIds) {
      const current = winnerByProduct.get(productId);
      if (current && current.percentage >= group.percentage) continue;
      winnerByProduct.set(productId, {
        percentage: group.percentage,
        setCount: group.setCount,
        groupId: group.id,
        title: group.title,
      });
    }
  }
  return winnerByProduct;
}

/**
 * @param {object} input Function の Input
 * @param {object} [options]
 * @param {string} [options.selectionStrategy] ProductDiscountSelectionStrategy.First 相当
 * @param {(w:{percentage:number,title:string})=>string} [options.message] 割引名の組み立て
 * @returns {{operations: object[]}}
 */
export function buildResult(input, options = {}) {
  const selectionStrategy = options.selectionStrategy || 'FIRST';
  const message =
    options.message ||
    ((w) => (w.title ? `${w.title} セット ${w.percentage}%OFF` : `セット購入 ${w.percentage}%OFF`));

  // Product 割引クラスが付いていない Discount では何もしない
  const classes = (input && input.discount && input.discount.discountClasses) || [];
  if (!classes.some((c) => String(c).toUpperCase() === 'PRODUCT')) return { operations: [] };

  const config = (input.discount && input.discount.metafield && input.discount.metafield.jsonValue) || {};
  const groups = normalizeGroups(config.groups);
  if (groups.length === 0) return { operations: [] }; // fail-closed

  const byProduct = foldCartByProduct((input.cart && input.cart.lines) || []);
  const matched = matchGroups(groups, byProduct);
  if (matched.length === 0) return { operations: [] };

  const winnerByProduct = resolveWinners(matched);

  // 同じ「率 + 表示名」の target はまとめて1 candidate にする
  /** @type {Map<string, {percentage: number, label: string, targets: object[]}>} */
  const bucketByKey = new Map();

  for (const [productId, winner] of winnerByProduct) {
    const entry = byProduct.get(productId);
    if (!entry) continue;

    // setCount 個まで。ラインをまたいで按分する(同じ Product の Variant 違いに対応)
    let remaining = winner.setCount;
    const targets = [];
    for (const line of entry.lines) {
      if (remaining <= 0) break;
      const quantity = Math.min(line.quantity, remaining);
      remaining -= quantity;
      targets.push({ cartLine: { id: line.id, quantity } });
    }
    if (targets.length === 0) continue;

    const label = message(winner);
    const key = `${winner.percentage}|${label}`;
    const bucket = bucketByKey.get(key) || { percentage: winner.percentage, label, targets: [] };
    bucket.targets.push(...targets);
    bucketByKey.set(key, bucket);
  }

  if (bucketByKey.size === 0) return { operations: [] };

  const candidates = [...bucketByKey.values()]
    .sort((a, b) => b.percentage - a.percentage)
    .map((bucket) => ({
      message: bucket.label,
      targets: bucket.targets,
      value: { percentage: { value: bucket.percentage.toFixed(1) } },
    }));

  return { operations: [{ productDiscountsAdd: { candidates, selectionStrategy } }] };
}
