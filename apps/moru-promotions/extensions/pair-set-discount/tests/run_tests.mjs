// MORU ペア・セット割引 — ユニットテスト
//
//   node extensions/pair-set-discount/tests/run_tests.mjs
//
// Shopify に一切つながない。判定ロジック(src/pair_set.js)だけを直接叩く。

import assert from 'node:assert/strict';
import { buildResult, normalizeGroups, foldCartByProduct, matchGroups } from '../src/pair_set.js';

const A = 'gid://shopify/Product/1';
const B = 'gid://shopify/Product/2';
const C = 'gid://shopify/Product/3';

let pass = 0;
let fail = 0;

function test(name, fn) {
  try {
    fn();
    pass += 1;
    console.log(`  ok   ${String(pass + fail).padStart(2)} ${name}`);
  } catch (error) {
    fail += 1;
    console.log(`  FAIL ${String(pass + fail).padStart(2)} ${name}`);
    console.log(`       ${error.message}`);
  }
}

/** カートラインを1本作る。lineId は自動で振る。 */
let lineSeq = 0;
function line(productId, quantity, variantSuffix = 'v1') {
  lineSeq += 1;
  return {
    id: `gid://shopify/CartLine/${lineSeq}`,
    quantity,
    merchandise: {
      __typename: 'ProductVariant',
      id: `${productId}/${variantSuffix}`,
      product: { id: productId, title: productId },
    },
  };
}

function input(lines, groups, { classes = ['PRODUCT'] } = {}) {
  return {
    cart: { lines },
    discount: {
      discountClasses: classes,
      metafield: groups === undefined ? null : { jsonValue: { groups } },
    },
  };
}

/** 適用結果を {率 => [{lineId, quantity}]} に畳んで検証しやすくする。 */
function applied(result) {
  const out = {};
  for (const op of result.operations) {
    for (const candidate of op.productDiscountsAdd.candidates) {
      const pct = Number(candidate.value.percentage.value);
      out[pct] = (out[pct] || []).concat(
        candidate.targets.map((t) => ({ lineId: t.cartLine.id, quantity: t.cartLine.quantity })),
      );
    }
  }
  return out;
}

function totalDiscountedUnits(result) {
  return Object.values(applied(result))
    .flat()
    .reduce((sum, t) => sum + t.quantity, 0);
}

console.log('fail-closed(設定が無ければ1円も割引しない)');

test('metafield が無い → 割引なし', () => {
  const r = buildResult(input([line(A, 1), line(B, 1)], undefined));
  assert.deepEqual(r.operations, []);
});

test('groups が空配列 → 割引なし', () => {
  const r = buildResult(input([line(A, 1), line(B, 1)], []));
  assert.deepEqual(r.operations, []);
});

test('groups が配列でない(壊れた設定) → 割引なし', () => {
  const r = buildResult(input([line(A, 1), line(B, 1)], { nope: true }));
  assert.deepEqual(r.operations, []);
});

test('discountClasses に PRODUCT が無い → 何もしない', () => {
  const r = buildResult(
    input([line(A, 1), line(B, 1)], [{ id: 'g1', productIds: [A, B], percentage: 15 }], {
      classes: ['ORDER', 'SHIPPING'],
    }),
  );
  assert.deepEqual(r.operations, []);
});

console.log('\n組み合わせの成立・不成立');

test('ペア成立(A×1 + B×1) → 両方 15%OFF を1個ずつ', () => {
  const la = line(A, 1);
  const lb = line(B, 1);
  const r = buildResult(input([la, lb], [{ id: 'g1', title: 'ペア', productIds: [A, B], percentage: 15 }]));
  const got = applied(r);
  assert.deepEqual(Object.keys(got), ['15']);
  assert.deepEqual(
    got[15].sort((x, y) => x.lineId.localeCompare(y.lineId)),
    [
      { lineId: la.id, quantity: 1 },
      { lineId: lb.id, quantity: 1 },
    ].sort((x, y) => x.lineId.localeCompare(y.lineId)),
  );
});

test('ペア不成立(A だけ) → 割引なし', () => {
  const r = buildResult(input([line(A, 3)], [{ id: 'g1', productIds: [A, B], percentage: 15 }]));
  assert.deepEqual(r.operations, []);
});

test('3商品グループで2つしか無い → 割引なし', () => {
  const r = buildResult(input([line(A, 1), line(B, 1)], [{ id: 'g1', productIds: [A, B, C], percentage: 15 }]));
  assert.deepEqual(r.operations, []);
});

test('3商品グループが全部そろう → 3ライン全部が対象', () => {
  const r = buildResult(
    input([line(A, 1), line(B, 1), line(C, 1)], [{ id: 'g1', productIds: [A, B, C], percentage: 15 }]),
  );
  assert.equal(totalDiscountedUnits(r), 3);
});

console.log('\nセット数(setCount)の計算');

test('A×2 + B×3 → 2セット。B の3個目は対象外(合計4個)', () => {
  const la = line(A, 2);
  const lb = line(B, 3);
  const r = buildResult(input([la, lb], [{ id: 'g1', productIds: [A, B], percentage: 15 }]));
  const got = applied(r);
  assert.equal(totalDiscountedUnits(r), 4);
  assert.deepEqual(got[15].find((t) => t.lineId === la.id), { lineId: la.id, quantity: 2 });
  assert.deepEqual(got[15].find((t) => t.lineId === lb.id), { lineId: lb.id, quantity: 2 });
});

test('A×1 + B×5 → 1セットだけ(合計2個)', () => {
  const r = buildResult(input([line(A, 1), line(B, 5)], [{ id: 'g1', productIds: [A, B], percentage: 15 }]));
  assert.equal(totalDiscountedUnits(r), 2);
});

test('同一 Product の Variant 違いは合算される(A-v1×1 + A-v2×2 + B×2 → 2セット)', () => {
  const a1 = line(A, 1, 'v1');
  const a2 = line(A, 2, 'v2');
  const lb = line(B, 2);
  const r = buildResult(input([a1, a2, lb], [{ id: 'g1', productIds: [A, B], percentage: 15 }]));
  const got = applied(r);
  // A は合計3個あるが setCount=2 なので2個まで。ラインをまたいで按分される
  assert.equal(got[15].find((t) => t.lineId === a1.id).quantity, 1);
  assert.equal(got[15].find((t) => t.lineId === a2.id).quantity, 1);
  assert.equal(got[15].find((t) => t.lineId === lb.id).quantity, 2);
  assert.equal(totalDiscountedUnits(r), 4);
});

console.log('\n重複しない(1商品に割引は1つだけ)');

test('2グループに属する商品は率の高いほうが勝つ', () => {
  const la = line(A, 1);
  const lb = line(B, 1);
  const lc = line(C, 1);
  const r = buildResult(
    input(
      [la, lb, lc],
      [
        { id: 'g1', title: 'G1', productIds: [A, B], percentage: 10 },
        { id: 'g2', title: 'G2', productIds: [A, C], percentage: 20 },
      ],
    ),
  );
  const got = applied(r);
  assert.deepEqual(got[20].map((t) => t.lineId).sort(), [la.id, lc.id].sort());
  assert.deepEqual(got[10].map((t) => t.lineId), [lb.id]);
  // A は20%側にだけ入り、10%側には入らない
  assert.equal(totalDiscountedUnits(r), 3);
});

test('同率の2グループなら先に定義したほうが勝つ(設定順が意味を持つ)', () => {
  const la = line(A, 1);
  const lb = line(B, 1);
  const lc = line(C, 1);
  const r = buildResult(
    input(
      [la, lb, lc],
      [
        { id: 'first', title: '先', productIds: [A, B], percentage: 15 },
        { id: 'second', title: '後', productIds: [A, C], percentage: 15 },
      ],
    ),
  );
  const messages = r.operations[0].productDiscountsAdd.candidates.map((c) => c.message);
  assert.ok(messages.some((m) => m.includes('先')), `先勝ちしていない: ${messages.join(' / ')}`);
  assert.equal(totalDiscountedUnits(r), 3);
});

console.log('\n設定の正規化(壊れた設定を黙って通さない)');

test('percentage が 0 / 100 / 文字列 のグループは無効', () => {
  assert.equal(normalizeGroups([{ productIds: [A, B], percentage: 0 }]).length, 0);
  assert.equal(normalizeGroups([{ productIds: [A, B], percentage: 100 }]).length, 0);
  assert.equal(normalizeGroups([{ productIds: [A, B], percentage: 'ななじゅう' }]).length, 0);
  assert.equal(normalizeGroups([{ productIds: [A, B], percentage: '15' }]).length, 1);
});

test('productIds が1件だけ / 重複で実質1件 → 無効(まとめ買い割引の領分)', () => {
  assert.equal(normalizeGroups([{ productIds: [A], percentage: 15 }]).length, 0);
  assert.equal(normalizeGroups([{ productIds: [A, A], percentage: 15 }]).length, 0);
});

test('id が無ければ自動採番される / id が重複したら後勝ちせず捨てる', () => {
  const g = normalizeGroups([
    { productIds: [A, B], percentage: 15 },
    { id: 'dup', productIds: [A, C], percentage: 15 },
    { id: 'dup', productIds: [B, C], percentage: 30 },
  ]);
  assert.deepEqual(g.map((x) => x.id), ['group-1', 'dup']);
  assert.equal(g[1].percentage, 15);
});

console.log('\nカートの読み取り');

test('数量0・負のラインは無視する', () => {
  const folded = foldCartByProduct([line(A, 0), line(A, -2), line(A, 3)]);
  assert.equal(folded.get(A).quantity, 3);
  assert.equal(folded.get(A).lines.length, 1);
});

test('ProductVariant でない merchandise(CustomProduct 等)は無視する', () => {
  const folded = foldCartByProduct([
    { id: 'gid://shopify/CartLine/x', quantity: 2, merchandise: { __typename: 'CustomProduct' } },
    line(A, 1),
  ]);
  assert.equal(folded.size, 1);
  assert.ok(folded.has(A));
});

test('matchGroups は不成立グループを返さない', () => {
  const folded = foldCartByProduct([line(A, 1)]);
  const groups = normalizeGroups([{ id: 'g1', productIds: [A, B], percentage: 15 }]);
  assert.deepEqual(matchGroups(groups, folded), []);
});

console.log('\n出力の形');

test('割引名にグループ名が入る / 未設定なら既定文言', () => {
  const named = buildResult(input([line(A, 1), line(B, 1)], [{ id: 'g', title: 'フラワー', productIds: [A, B], percentage: 15 }]));
  assert.equal(named.operations[0].productDiscountsAdd.candidates[0].message, 'フラワー セット 15%OFF');
  const unnamed = buildResult(input([line(A, 1), line(B, 1)], [{ id: 'g', productIds: [A, B], percentage: 15 }]));
  assert.equal(unnamed.operations[0].productDiscountsAdd.candidates[0].message, 'セット購入 15%OFF');
});

test('percentage は小数1桁の文字列で出す / selectionStrategy は FIRST', () => {
  const r = buildResult(input([line(A, 1), line(B, 1)], [{ id: 'g', productIds: [A, B], percentage: 15 }]));
  assert.equal(r.operations[0].productDiscountsAdd.candidates[0].value.percentage.value, '15.0');
  assert.equal(r.operations[0].productDiscountsAdd.selectionStrategy, 'FIRST');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
