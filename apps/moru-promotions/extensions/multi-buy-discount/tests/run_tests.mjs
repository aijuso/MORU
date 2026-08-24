// docs/12_price_redesign_and_multibuy.md §7-7 の必須テスト12件 + 回帰3件。
// 依存なしで動く:  node extensions/multi-buy-discount/tests/run_tests.mjs
import { buildResult, percentageFor, normalizeTiers, DEFAULT_TIERS } from '../src/multi_buy.js';

const P_A = 'gid://shopify/Product/1';   // 対象商品A(手編みコースター想定)
const P_B = 'gid://shopify/Product/2';   // 対象商品B
const P_X = 'gid://shopify/Product/9';   // 対象外商品(家具想定)

let lineSeq = 0;
function line(productId, quantity, { eligible = true, unitPrice = 3480 } = {}) {
  lineSeq += 1;
  return {
    id: `gid://shopify/CartLine/${lineSeq}`,
    quantity,
    cost: {
      subtotalAmount: { amount: String(unitPrice * quantity) },
      amountPerQuantity: { amount: String(unitPrice) },
    },
    merchandise: {
      __typename: 'ProductVariant',
      id: `gid://shopify/ProductVariant/${lineSeq}`,
      product: {
        id: productId,
        multiBuy: eligible ? { value: 'true' } : null,
      },
    },
  };
}

function cart(lines, { discountClasses = ['PRODUCT'], jsonValue = null } = {}) {
  return { cart: { lines }, discount: { discountClasses, metafield: jsonValue ? { jsonValue } : null } };
}

/** 結果を「lineId → 割引率」に潰す。判定を読みやすくするため。 */
function ratesByLine(result) {
  const out = {};
  for (const op of result.operations) {
    for (const c of op.productDiscountsAdd.candidates) {
      for (const t of c.targets) out[t.cartLine.id] = Number(c.value.percentage.value);
    }
  }
  return out;
}

let pass = 0, fail = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if (a === e) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       expected ${e}\n       actual   ${a}`); }
}

console.log('docs/12 §7-7 必須テスト');

// 1. 同一 Variant 1点 → 0%
{ lineSeq = 0; const l = [line(P_A, 1)];
  check('1  同一Variant 1点 → 割引なし', ratesByLine(buildResult(cart(l))), {}); }

// 2. 同一 Variant 2点 → 10%
{ lineSeq = 0; const l = [line(P_A, 2)];
  check('2  同一Variant 2点 → 10%', ratesByLine(buildResult(cart(l))), { 'gid://shopify/CartLine/1': 10 }); }

// 3. 同一 Variant 3点 → 15%
{ lineSeq = 0; const l = [line(P_A, 3)];
  check('3  同一Variant 3点 → 15%', ratesByLine(buildResult(cart(l))), { 'gid://shopify/CartLine/1': 15 }); }

// 4. 別 Variant 2種類(計2点) → 10%
{ lineSeq = 0; const l = [line(P_A, 1), line(P_A, 1)];
  check('4  別Variant 2種(計2点) → 両方10%', ratesByLine(buildResult(cart(l))),
    { 'gid://shopify/CartLine/1': 10, 'gid://shopify/CartLine/2': 10 }); }

// 5. 別 Variant 3種類(計3点) → 15%
{ lineSeq = 0; const l = [line(P_A, 1), line(P_A, 1), line(P_A, 1)];
  check('5  別Variant 3種(計3点) → 全て15%', ratesByLine(buildResult(cart(l))),
    { 'gid://shopify/CartLine/1': 15, 'gid://shopify/CartLine/2': 15, 'gid://shopify/CartLine/3': 15 }); }

// 6. 別 Variant 4種類 → 15%
{ lineSeq = 0; const l = [line(P_A,1),line(P_A,1),line(P_A,1),line(P_A,1)];
  check('6  別Variant 4種(計4点) → 全て15%', Object.values(ratesByLine(buildResult(cart(l)))), [15,15,15,15]); }

// 7. 別 Variant 5種類 → 15%
{ lineSeq = 0; const l = [line(P_A,1),line(P_A,1),line(P_A,1),line(P_A,1),line(P_A,1)];
  check('7  別Variant 5種(計5点) → 全て15%', Object.values(ratesByLine(buildResult(cart(l)))), [15,15,15,15,15]); }

// 8. 同一 Variant×2 + 別 Variant×1 → 全数量15%
{ lineSeq = 0; const l = [line(P_A, 2), line(P_A, 1)];
  check('8  同一×2 + 別×1(計3点) → 全数量15%', ratesByLine(buildResult(cart(l))),
    { 'gid://shopify/CartLine/1': 15, 'gid://shopify/CartLine/2': 15 }); }

// 9. 3点 → 2点(再計算)
{ lineSeq = 0; const before = ratesByLine(buildResult(cart([line(P_A, 3)])));
  lineSeq = 0; const after = ratesByLine(buildResult(cart([line(P_A, 2)])));
  check('9  3点→2点 → 15%から10%へ', [before, after],
    [{ 'gid://shopify/CartLine/1': 15 }, { 'gid://shopify/CartLine/1': 10 }]); }

// 10. 2点 → 1点(解除)
{ lineSeq = 0; const before = ratesByLine(buildResult(cart([line(P_A, 2)])));
  lineSeq = 0; const after = ratesByLine(buildResult(cart([line(P_A, 1)])));
  check('10 2点→1点 → 解除', [before, after], [{ 'gid://shopify/CartLine/1': 10 }, {}]); }

// 11. 対象 Product A×2 + 対象 Product B×1 → A のみ10% / B は0%
{ lineSeq = 0; const l = [line(P_A, 2), line(P_B, 1)];
  check('11 A×2 + B×1 → Aのみ10% / Bは対象外', ratesByLine(buildResult(cart(l))),
    { 'gid://shopify/CartLine/1': 10 }); }

// 12. Variant ごとに価格が違う場合、% 計算が正しいこと
//     Function は「率」を返すだけで金額計算は Shopify 側。率が両ラインに正しく載ることを見る。
{ lineSeq = 0; const l = [line(P_A, 1, { unitPrice: 3480 }), line(P_A, 1, { unitPrice: 3980 })];
  const r = buildResult(cart(l));
  const rates = ratesByLine(r);
  const expectedYen = { 'gid://shopify/CartLine/1': 3480 * 0.10, 'gid://shopify/CartLine/2': 3980 * 0.10 };
  const actualYen = {
    'gid://shopify/CartLine/1': 3480 * rates['gid://shopify/CartLine/1'] / 100,
    'gid://shopify/CartLine/2': 3980 * rates['gid://shopify/CartLine/2'] / 100,
  };
  check('12 Variant別価格 → 率が同じで割引額が価格に比例', actualYen, expectedYen); }

console.log('\n回帰・境界');

// 13. 対象外商品だけのカート → 何も返さない
{ lineSeq = 0; const l = [line(P_X, 5, { eligible: false })];
  check('13 対象外商品5点 → 割引なし(fail-closed)', buildResult(cart(l)).operations, []); }

// 14. Product 割引クラスが無い Discount → 何もしない
{ lineSeq = 0; const l = [line(P_A, 3)];
  check('14 discountClasses に PRODUCT が無い → 何もしない',
    buildResult(cart(l, { discountClasses: ['ORDER'] })).operations, []); }

// 15. しきい値を metafield から上書きできる
{ lineSeq = 0; const l = [line(P_A, 4)];
  const cfg = { tiers: [{ minQuantity: 4, percentage: 20 }, { minQuantity: 2, percentage: 10 }] };
  check('15 metafield でしきい値を上書き(4点20%)',
    ratesByLine(buildResult(cart(l, { jsonValue: cfg }))), { 'gid://shopify/CartLine/1': 20 }); }

// 16. 壊れた設定は既定値に落ちる
check('16 壊れたtiers設定 → 既定値', normalizeTiers([{ minQuantity: 'x' }]), DEFAULT_TIERS);
check('17 percentageFor(1/2/3/9)', [1,2,3,9].map((q) => percentageFor(q, DEFAULT_TIERS)), [0,10,15,15]);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
