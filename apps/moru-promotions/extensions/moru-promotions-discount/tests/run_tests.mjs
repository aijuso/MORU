// MORU 販促割引(統合)の単体テスト。依存ゼロで動く。
//
//   node tests/run_tests.mjs
//
// Shopify の生成コードを import しないので、Wasm を作らなくても素の Node で走る。

import assert from 'node:assert/strict';
import {
  normalizePairs, normalizeTiers, percentageFor, foldCartByProduct,
  buildCandidates, resolveWinners, buildLinesResult,
} from '../src/promotions.js';
import { preDiscountSubtotal, readThreshold, buildDeliveryResult } from '../src/shipping.js';

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.error(`  FAIL ${name}\n       ${e.message}`); }
}

const P = (n) => `gid://shopify/Product/${n}`;
const V = (n) => `gid://shopify/ProductVariant/${n}`;

/** カート行を作る。price は割引前の単価。 */
function line(id, productId, variantId, quantity, price = 1000, eligible = false) {
  return {
    id: `gid://shopify/CartLine/${id}`,
    quantity,
    cost: { amountPerQuantity: { amount: String(price) } },
    merchandise: {
      __typename: 'ProductVariant',
      id: variantId,
      product: { id: productId, title: productId, multiBuy: eligible ? { value: 'true' } : null },
    },
  };
}

function input(lines, config, classes = ['PRODUCT']) {
  return {
    cart: { lines, deliveryGroups: [{ id: 'gid://shopify/CartDeliveryGroup/1' }] },
    discount: { discountClasses: classes, metafield: config === null ? null : { jsonValue: config } },
  };
}

const CONFIG = {
  freeShippingThreshold: 7700,
  pairs: [{ id: 'P-6', title: 'ソファの脇', productIds: [P(1), P(2)], percentage: 15 }],
  multiBuy: { productIds: [P(3)], tiers: [{ minQuantity: 2, percentage: 10 }, { minQuantity: 3, percentage: 15 }] },
  sale: { productIds: [P(1), P(2), P(4)], percentage: 10, excludedVariantIds: [V(99)] },
};

/** 割引結果を {lineId: {pct, quantity, message}} に畳む。 */
function flatten(result) {
  const out = {};
  for (const op of result.operations) {
    for (const c of op.productDiscountsAdd.candidates) {
      for (const t of c.targets) {
        out[t.cartLine.id] = { pct: Number(c.value.percentage.value), quantity: t.cartLine.quantity, message: c.message };
      }
    }
  }
  return out;
}

console.log('\n-- 設定の正規化 --');
test('percentage が範囲外の PAIR は捨てる', () => {
  assert.equal(normalizePairs([{ productIds: [P(1), P(2)], percentage: 0 }]).length, 0);
  assert.equal(normalizePairs([{ productIds: [P(1), P(2)], percentage: 100 }]).length, 0);
});
test('productIds が1件の PAIR は捨てる(組み合わせではない)', () => {
  assert.equal(normalizePairs([{ productIds: [P(1)], percentage: 15 }]).length, 0);
});
test('PAIR の id 重複は先勝ち', () => {
  const p = normalizePairs([
    { id: 'x', productIds: [P(1), P(2)], percentage: 15 },
    { id: 'x', productIds: [P(3), P(4)], percentage: 20 },
  ]);
  assert.equal(p.length, 1);
  assert.equal(p[0].percentage, 15);
});
test('groups キーでも PAIR を読む(旧 pair-set-discount との互換)', () => {
  const r = buildLinesResult(input(
    [line(1, P(1), V(1), 1), line(2, P(2), V(2), 1)],
    { groups: [{ id: 'g', productIds: [P(1), P(2)], percentage: 15 }] },
  ));
  assert.equal(Object.keys(flatten(r)).length, 2);
});
test('tiers が壊れていたら既定値に落ちる', () => {
  assert.deepEqual(normalizeTiers('nonsense'), normalizeTiers([]));
  assert.equal(percentageFor(3, normalizeTiers([])), 15);
  assert.equal(percentageFor(2, normalizeTiers([])), 10);
  assert.equal(percentageFor(1, normalizeTiers([])), 0);
});
test('しきい値が数値でなければ null', () => {
  assert.equal(readThreshold({ freeShippingThreshold: 'abc' }), null);
  assert.equal(readThreshold({}), null);
  assert.equal(readThreshold(null), null);
  assert.equal(readThreshold({ freeShippingThreshold: 7700 }), 7700);
});

console.log('\n-- カートの畳み込み --');
test('同じ Product の Variant 違いは合算する', () => {
  const m = foldCartByProduct([line(1, P(3), V(1), 2), line(2, P(3), V(2), 1)]);
  assert.equal(m.get(P(3)).quantity, 3);
  assert.equal(m.get(P(3)).lines.length, 2);
});
test('数量0以下・商品なしの行は無視する', () => {
  const m = foldCartByProduct([line(1, P(3), V(1), 0), { id: 'x', quantity: 2, merchandise: {} }]);
  assert.equal(m.size, 0);
});

console.log('\n-- fail-closed --');
test('PRODUCT クラスが無ければ何もしない', () => {
  const r = buildLinesResult(input([line(1, P(3), V(1), 3)], CONFIG, ['ORDER']));
  assert.deepEqual(r.operations, []);
});
test('設定 metafield が無ければ何もしない', () => {
  assert.deepEqual(buildLinesResult(input([line(1, P(3), V(1), 3)], null)).operations, []);
});
test('設定が空オブジェクトでも何もしない', () => {
  assert.deepEqual(buildLinesResult(input([line(1, P(3), V(1), 3)], {})).operations, []);
});
test('カートが空なら何もしない', () => {
  assert.deepEqual(buildLinesResult(input([], CONFIG)).operations, []);
});
test('SHIPPING クラスが無ければ配送割引は出ない', () => {
  const i = input([line(1, P(4), V(4), 1, 9000)], CONFIG, ['PRODUCT']);
  assert.deepEqual(buildDeliveryResult(i).operations, []);
});
test('しきい値が読めなければ配送割引は出ない', () => {
  const i = input([line(1, P(4), V(4), 1, 9000)], { sale: CONFIG.sale }, ['SHIPPING']);
  assert.deepEqual(buildDeliveryResult(i).operations, []);
});

console.log('\n-- Summer Sale --');
test('対象商品に 10%OFF が当たる', () => {
  const f = flatten(buildLinesResult(input([line(1, P(4), V(4), 1)], CONFIG)));
  assert.equal(f['gid://shopify/CartLine/1'].pct, 10);
});
test('対象外の商品には当たらない', () => {
  const f = flatten(buildLinesResult(input([line(1, P(9), V(9), 1)], CONFIG)));
  assert.deepEqual(f, {});
});
test('excludedVariantIds の Variant は Sale 対象外(ハル 2脚セット)', () => {
  const f = flatten(buildLinesResult(input([line(1, P(4), V(99), 1)], CONFIG)));
  assert.deepEqual(f, {}, '除外 Variant に割引が当たってしまった');
});
test('同じ Product でも除外されていない Variant には当たる', () => {
  const f = flatten(buildLinesResult(input(
    [line(1, P(4), V(99), 1), line(2, P(4), V(4), 1)], CONFIG)));
  assert.equal(f['gid://shopify/CartLine/1'], undefined);
  assert.equal(f['gid://shopify/CartLine/2'].pct, 10);
});

console.log('\n-- まとめ買い --');
test('2点で 10%OFF', () => {
  const f = flatten(buildLinesResult(input([line(1, P(3), V(1), 2)], CONFIG)));
  assert.equal(f['gid://shopify/CartLine/1'].pct, 10);
});
test('3点以上で 15%OFF・全数量が対象', () => {
  const f = flatten(buildLinesResult(input([line(1, P(3), V(1), 5)], CONFIG)));
  assert.equal(f['gid://shopify/CartLine/1'].pct, 15);
  assert.equal(f['gid://shopify/CartLine/1'].quantity, 5);
});
test('同一 Product の Variant 違いを合算して 3点にする', () => {
  const f = flatten(buildLinesResult(input(
    [line(1, P(3), V(1), 2), line(2, P(3), V(2), 1)], CONFIG)));
  assert.equal(f['gid://shopify/CartLine/1'].pct, 15);
  assert.equal(f['gid://shopify/CartLine/2'].pct, 15);
});
test('別 Product は数量を合算しない', () => {
  const cfg = { ...CONFIG, multiBuy: { productIds: [P(3), P(5)], tiers: CONFIG.multiBuy.tiers } };
  // P(3) 1点 + P(5) 1点 = どちらも 1点。合算して 2点にはしない。
  const f = flatten(buildLinesResult(input([line(1, P(3), V(1), 1), line(2, P(5), V(5), 1)], cfg)));
  assert.deepEqual(f, {});
});
test('1点では割引が出ない', () => {
  assert.deepEqual(flatten(buildLinesResult(input([line(1, P(3), V(1), 1)], CONFIG))), {});
});
test('productIds 未設定なら metafield へ落ちる(旧方式の互換)', () => {
  const cfg = { multiBuy: { tiers: CONFIG.multiBuy.tiers } };
  const f = flatten(buildLinesResult(input([line(1, P(7), V(7), 3, 1000, true)], cfg)));
  assert.equal(f['gid://shopify/CartLine/1'].pct, 15);
});
test('metafield が false なら対象外(fail-closed)', () => {
  const cfg = { multiBuy: { tiers: CONFIG.multiBuy.tiers } };
  assert.deepEqual(flatten(buildLinesResult(input([line(1, P(7), V(7), 3, 1000, false)], cfg))), {});
});

console.log('\n-- PAIR --');
test('両方揃うと 15%OFF が両方に当たる', () => {
  const f = flatten(buildLinesResult(input([line(1, P(1), V(1), 1), line(2, P(2), V(2), 1)], CONFIG)));
  assert.equal(f['gid://shopify/CartLine/1'].pct, 15);
  assert.equal(f['gid://shopify/CartLine/2'].pct, 15);
});
test('片方だけなら PAIR は成立せず Sale 10% に落ちる', () => {
  const f = flatten(buildLinesResult(input([line(1, P(1), V(1), 1)], CONFIG)));
  assert.equal(f['gid://shopify/CartLine/1'].pct, 10);
});
test('セット数を超える分は PAIR の対象外', () => {
  // P(1)×3 + P(2)×1 → 1セットのみ成立。P(1) は1個だけ 15%。
  const f = flatten(buildLinesResult(input([line(1, P(1), V(1), 3), line(2, P(2), V(2), 1)], CONFIG)));
  assert.equal(f['gid://shopify/CartLine/1'].quantity, 1);
  assert.equal(f['gid://shopify/CartLine/1'].pct, 15);
});

console.log('\n-- 優先順位・加算禁止 --');
test('PAIR 15% が Sale 10% に勝つ', () => {
  const f = flatten(buildLinesResult(input([line(1, P(1), V(1), 1), line(2, P(2), V(2), 1)], CONFIG)));
  assert.equal(f['gid://shopify/CartLine/1'].pct, 15);
  assert.match(f['gid://shopify/CartLine/1'].message, /ソファの脇/);
});
test('1商品につき candidate は1つ(加算されない)', () => {
  const r = buildLinesResult(input([line(1, P(1), V(1), 1), line(2, P(2), V(2), 1)], CONFIG));
  const hits = [];
  for (const op of r.operations) {
    for (const c of op.productDiscountsAdd.candidates) {
      for (const t of c.targets) hits.push(t.cartLine.id);
    }
  }
  assert.equal(hits.length, new Set(hits).size, '同じラインに複数の割引が当たっている');
});
test('同率 15% ならカバー数量が多い方(まとめ買い)が勝つ', () => {
  // P(1)×3(まとめ買い対象にもする)+ P(2)×1 → PAIR は1個ぶんしか当たらない。
  const cfg = { ...CONFIG, multiBuy: { productIds: [P(1)], tiers: CONFIG.multiBuy.tiers } };
  const f = flatten(buildLinesResult(input([line(1, P(1), V(1), 3), line(2, P(2), V(2), 1)], cfg)));
  assert.equal(f['gid://shopify/CartLine/1'].pct, 15);
  assert.equal(f['gid://shopify/CartLine/1'].quantity, 3, 'PAIR の1個ぶんだけになってしまった');
});
test('率・数量が同じなら定義順で PAIR が勝つ', () => {
  const cfg = { ...CONFIG, multiBuy: { productIds: [P(1)], tiers: [{ minQuantity: 1, percentage: 15 }] } };
  const f = flatten(buildLinesResult(input([line(1, P(1), V(1), 1), line(2, P(2), V(2), 1)], cfg)));
  assert.match(f['gid://shopify/CartLine/1'].message, /ソファの脇/);
});
test('Sale 対象外 Variant は PAIR には乗れる(除外は Sale 限定)', () => {
  const f = flatten(buildLinesResult(input([line(1, P(1), V(99), 1), line(2, P(2), V(2), 1)], CONFIG)));
  assert.equal(f['gid://shopify/CartLine/1'].pct, 15);
});

console.log('\n-- 送料無料 --');
const SHIP = ['PRODUCT', 'SHIPPING'];
test('割引前 subtotal は単価×数量で組み立てる', () => {
  assert.equal(preDiscountSubtotal([line(1, P(1), V(1), 2, 3980), line(2, P(2), V(2), 1, 1000)]), 8960);
});
test('しきい値ちょうどで送料無料になる', () => {
  const i = input([line(1, P(4), V(4), 1, 7700)], CONFIG, SHIP);
  const ops = buildDeliveryResult(i).operations;
  assert.equal(ops[0].deliveryDiscountsAdd.candidates[0].value.percentage.value, '100.0');
});
test('★割引前 ¥7,960 / 割引後 ¥7,164 でも送料無料が維持される', () => {
  // フェイクファー ¥3,980 × 2点 → まとめ買い 10%OFF で ¥7,164
  const lines = [line(1, P(3), V(1), 2, 3980)];
  const priced = flatten(buildLinesResult(input(lines, CONFIG)));
  assert.equal(priced['gid://shopify/CartLine/1'].pct, 10, '前提のまとめ買い割引が出ていない');
  assert.equal(3980 * 2 * 0.9, 7164);
  const ops = buildDeliveryResult(input(lines, CONFIG, SHIP)).operations;
  assert.equal(ops.length, 1, '割引後にしきい値を割ったせいで送料無料が消えた');
});
test('★本来 ¥7,700 未満の注文には送料無料が付かない', () => {
  const ops = buildDeliveryResult(input([line(1, P(4), V(4), 1, 7699)], CONFIG, SHIP)).operations;
  assert.deepEqual(ops, []);
});
test('★割引なしの通常注文も従来どおり(¥7,700 以上で無料)', () => {
  const ops = buildDeliveryResult(input([line(1, P(9), V(9), 1, 9980)], CONFIG, SHIP)).operations;
  assert.equal(ops.length, 1);
});
test('配送グループが無ければ何もしない', () => {
  const i = input([line(1, P(4), V(4), 1, 9000)], CONFIG, SHIP);
  i.cart.deliveryGroups = [];
  assert.deepEqual(buildDeliveryResult(i).operations, []);
});
test('全 deliveryGroup を対象にする', () => {
  const i = input([line(1, P(4), V(4), 1, 9000)], CONFIG, SHIP);
  i.cart.deliveryGroups = [{ id: 'a' }, { id: 'b' }];
  assert.equal(buildDeliveryResult(i).operations[0].deliveryDiscountsAdd.candidates[0].targets.length, 2);
});
test('単価が読めない行は subtotal に数えない', () => {
  const bad = { id: 'x', quantity: 2, merchandise: { product: { id: P(1) } }, cost: {} };
  assert.equal(preDiscountSubtotal([bad, line(1, P(1), V(1), 1, 1000)]), 1000);
});

console.log('\n-- 実データに近いケース --');
test('P-6 相当: クラウド ¥11,980 + マッシュルーム ¥9,980 → 両方 15%OFF・送料無料', () => {
  const lines = [line(1, P(1), V(1), 1, 11980), line(2, P(2), V(2), 1, 9980)];
  const f = flatten(buildLinesResult(input(lines, CONFIG)));
  assert.equal(f['gid://shopify/CartLine/1'].pct, 15);
  assert.equal(f['gid://shopify/CartLine/2'].pct, 15);
  const total = 21960 * 0.85;
  assert.equal(Math.round(total), 18666);
  assert.equal(buildDeliveryResult(input(lines, CONFIG, SHIP)).operations.length, 1);
});
test('手編みコースター 3点 ¥8,940 → 15%OFF ¥7,599 でも送料無料', () => {
  const lines = [line(1, P(3), V(1), 3, 2980)];
  const f = flatten(buildLinesResult(input(lines, CONFIG)));
  assert.equal(f['gid://shopify/CartLine/1'].pct, 15);
  assert.equal(Math.round(8940 * 0.85), 7599);
  assert.equal(buildDeliveryResult(input(lines, CONFIG, SHIP)).operations.length, 1);
});

console.log(`\n${passed} passed / ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
