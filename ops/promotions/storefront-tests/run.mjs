// MORU 販促割引 — Storefront 実機テスト
//
//   MORU_STOREFRONT_PASSWORD=... node ops/promotions/storefront-tests/run.mjs
//
// パスワード保護は Owner が一時解除しているので、認証処理は行わない。
// `/password` は叩かない(叩くとレート制限に入る)。
//
// ブラウザは使わない。Shopify の `/cart/add.js` と `/cart.js` を直接叩いて
// カートを作り、返ってきた JSON の割引額を見る。テーマの DOM に依存しないので
// Frontend の実装状況に左右されず、**Function の実挙動だけ**を測れる。
// (このサンドボックスの Chromium は外向きプロキシを通れなかった。
//  fetch は通るので、そちらで実機のカートを作る)

// shop.url の正規ドメイン。rgy5ee-fv は 301 でここへ飛ぶ。
const STORE = process.env.MORU_STORE_URL || 'https://moruliving.myshopify.com';

// 実データの Variant GID → 数値 ID(cart/add.js が使うのは数値 ID)
const V = {
  cloud:        50296062673136,   // クラウド サイドテーブル スターライトブラック ¥11,980
  mushroom:     50296081252592,   // マッシュルーム ゴールド ¥9,980
  fauxfur_150:  50296059068656,   // フェイクファー クリームホワイト 150×200 ¥3,980
  fauxfur_100:  50296059003120,   // フェイクファー クリームホワイト 100×150 ¥2,980
  fauxfur_100b: 50296059232496,   // フェイクファー カーキ 100×150 ¥2,980(Variant 違い)
  flannel_100:  50296057200880,   // フランネル スペースグレイ 100×150 ¥2,980
  coaster:      50296392253680,   // 手編みコースター マウス ¥2,980
  geometric:    50296080302320,   // ジオメトリック 本体のみ ¥7,980
  mini:         50296082006256,   // ミニ アラームクロック ¥4,480
  boa:          50296394219760,   // ボア ラウンジチェア ¥14,980
  haru1:        50296095637744,   // ハル 1脚 ¥20,980
  haru2set:     50296095768816,   // ハル 2脚セット ¥33,980(Sale 除外)
  sora:         50296441667824,   // ソラ ¥20,480(施策対象外)
  cellboard:    50296063918320,   // セル サイドボード A ¥31,980(Sale のみ)
};

const CASES = [
  // --- A. 送料無料 ---
  { id: 'A-1', name: 'フェイクファー 150×200 ×2(割引前 ¥7,960)', items: [[V.fauxfur_150, 2]],
    expect: { subtotal: 7960, discount: 796, shipFree: true } },
  { id: 'A-2', name: '手編みコースター ×3(割引前 ¥8,940)', items: [[V.coaster, 3]],
    expect: { subtotal: 8940, discount: 1341, shipFree: true } },
  { id: 'A-3', name: 'ジオメトリック 本体 ×1(割引前 ¥7,980)', items: [[V.geometric, 1]],
    expect: { subtotal: 7980, discount: 798, shipFree: true } },
  { id: 'A-4', name: 'ミニ アラームクロック ×1(¥4,480・しきい値未満)', items: [[V.mini, 1]],
    expect: { subtotal: 4480, discount: 0, shipFree: false } },
  { id: 'A-5', name: 'ボア ×1(¥14,980)', items: [[V.boa, 1]],
    expect: { subtotal: 14980, discount: 1498, shipFree: true } },
  { id: 'A-6', name: 'ソラ ×1(¥20,480・施策対象外)', items: [[V.sora, 1]],
    expect: { subtotal: 20480, discount: 0, shipFree: true } },
  // --- B. 優先順位・加算禁止 ---
  { id: 'B-1', name: 'クラウド ×1 + マッシュルーム ×1(PAIR)', items: [[V.cloud, 1], [V.mushroom, 1]],
    expect: { subtotal: 21960, discount: 3294, shipFree: true } },
  { id: 'B-2', name: 'クラウド ×1 のみ(PAIR 不成立 → Sale)', items: [[V.cloud, 1]],
    expect: { subtotal: 11980, discount: 1198, shipFree: true } },
  { id: 'B-3', name: 'クラウド ×3 + マッシュルーム ×1(D案の本命)', items: [[V.cloud, 3], [V.mushroom, 1]],
    expect: { subtotal: 45920, discount: 5690, shipFree: true } },
  { id: 'B-4', name: 'フェイクファー ×2(まとめ買い2点)', items: [[V.fauxfur_100, 2]],
    expect: { subtotal: 5960, discount: 596, shipFree: false } },
  { id: 'B-5', name: 'フェイクファー ×3(まとめ買い3点)', items: [[V.fauxfur_100, 3]],
    expect: { subtotal: 8940, discount: 1341, shipFree: true } },
  { id: 'B-6', name: 'フェイクファー 別Variant 2+1(合算して3点)', items: [[V.fauxfur_100, 2], [V.fauxfur_100b, 1]],
    expect: { subtotal: 8940, discount: 1341, shipFree: true } },
  { id: 'B-7', name: 'フェイクファー ×1 + フランネル ×1(別Productは合算しない)',
    items: [[V.fauxfur_100, 1], [V.flannel_100, 1]],
    expect: { subtotal: 5960, discount: 0, shipFree: false } },
  { id: 'B-8', name: 'フェイクファー ×4(4点以上も15%)', items: [[V.fauxfur_100, 4]],
    expect: { subtotal: 11920, discount: 1788, shipFree: true } },
  // --- C. Summer Sale の除外 ---
  { id: 'C-1', name: 'ハル 1脚 ×1(Sale 対象)', items: [[V.haru1, 1]],
    expect: { subtotal: 20980, discount: 2098, shipFree: true } },
  { id: 'C-2', name: 'ハル 2脚セット ×1(Sale 除外)', items: [[V.haru2set, 1]],
    expect: { subtotal: 33980, discount: 0, shipFree: true } },
  { id: 'C-3', name: 'ハル 1脚 ×1 + 2脚セット ×1', items: [[V.haru1, 1], [V.haru2set, 1]],
    expect: { subtotal: 54960, discount: 2098, shipFree: true } },
  // --- D. 除外・非対象 ---
  { id: 'D-1', name: 'ソラ ×3(まとめ買い非対象)', items: [[V.sora, 3]],
    expect: { subtotal: 61440, discount: 0, shipFree: true } },
  { id: 'D-2', name: 'セル サイドボード ×2(Sale のみ・まとめ買い対象外)', items: [[V.cellboard, 2]],
    expect: { subtotal: 63960, discount: 6396, shipFree: true } },
  // --- E. 送料無料の境界 ---
  { id: 'E-1', name: 'フランネル 150×200 ×2(割引前 ¥7,960 → ¥7,164)', items: [[50296057233648, 2]],
    expect: { subtotal: 7960, discount: 796, shipFree: true } },
  { id: 'E-2', name: 'ミニ ×1 + コースター ×1(¥7,460・しきい値未満)', items: [[V.mini, 1], [V.coaster, 1]],
    expect: { subtotal: 7460, discount: 0, shipFree: false } },
];

const yen = (n) => '¥' + Math.round(n).toLocaleString('ja-JP');

// --- 最小の Cookie ジャー。ストアフロントのセッションを維持するのに要る。 ---
const jar = new Map();
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
function remember(res) {
  for (const raw of res.headers.getSetCookie?.() || []) {
    const [pair] = raw.split(';');
    const i = pair.indexOf('=');
    if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(STORE + path, {
    method,
    redirect: 'manual',
    headers: {
      cookie: cookieHeader(),
      accept: 'application/json, text/html',
      'user-agent': 'MORU-promotions-test',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  remember(res);
  return res;
}

/** cart/add は連投すると 429 になる。少し待って数回試す。 */
async function addToCart(id, quantity) {
  for (let i = 1; i <= 6; i++) {
    const res = await call('/cart/add.js', { method: 'POST', body: { id, quantity } });
    if (res.status < 400) return res;
    if (res.status !== 429) return res;
    await sleep(3000 * i);
  }
  return { status: 429 };
}

async function main() {
  // パスワード保護は解除されている前提。認証はしない。
  const probe = await call('/cart.js');
  if (probe.status !== 200) {
    console.error(`❌ ストアフロントに入れない (cart.js → ${probe.status})。`);
    console.error('   パスワード保護がまだ有効な可能性がある。/password は叩かない(レート制限のため)。');
    process.exit(1);
  }
  console.log('✅ ストアフロントに入れた(パスワード保護は解除されている)');

  const results = [];
  for (const c of CASES) {
    await call('/cart/clear.js', { method: 'POST' });
    for (const [id, qty] of c.items) {
      const add = await addToCart(id, qty);
      if (add.status >= 400) {
        console.log(`  ⚠️ ${c.id}: cart/add に失敗 (variant ${id} → ${add.status})`);
      }
      await sleep(500);
    }
    const cartRes = await call('/cart.js');
    const raw = await cartRes.text();
    let cart;
    try { cart = JSON.parse(raw); }
    catch {
      console.log(`  ❌ ${c.id}: cart.js が JSON を返さなかった (status ${cartRes.status})`);
      results.push({ ...c, subtotal: 0, discount: 0, after: 0, names: [], pass: false });
      continue;
    }
    const subtotal = cart.items.reduce((n, i) => n + i.original_line_price, 0) / 100;
    const discount = (cart.total_discount || 0) / 100;
    const after = cart.total_price / 100;
    const names = (cart.items.flatMap((i) => (i.discounts || []).map((d) => d.title))
      .concat((cart.cart_level_discount_applications || []).map((d) => d.title)));
    const uniq = [...new Set(names)];

    const e = c.expect;
    const pass = subtotal === e.subtotal && Math.round(discount) === e.discount;
    results.push({ ...c, subtotal, discount, after, names: uniq, pass });
    await sleep(700);
    console.log(`${pass ? 'PASS' : 'FAIL'} ${c.id} ${c.name}`);
    console.log(`      小計 ${yen(subtotal)}(期待 ${yen(e.subtotal)}) / 割引 -${yen(discount)}(期待 -${yen(e.discount)}) / 割引後 ${yen(after)}`);
    if (uniq.length) console.log(`      割引名: ${uniq.join(' / ')}`);
  }

  await call('/cart/clear.js', { method: 'POST' });

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed} PASS / ${results.length - passed} FAIL / 全 ${results.length} ケース`);
  console.log('\n=== 結果表(docs 貼り付け用)===');
  console.log('| # | ケース | 小計 | 期待割引 | 実測割引 | 割引後 | 割引名 | 判定 |');
  console.log('|---|---|---|---|---|---|---|---|');
  for (const r of results) {
    console.log(`| ${r.id} | ${r.name} | ${yen(r.subtotal)} | -${yen(r.expect.discount)} | -${yen(r.discount)} | ${yen(r.after)} | ${r.names.join(' / ') || '—'} | ${r.pass ? '✅ PASS' : '❌ FAIL'} |`);
  }
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => { console.error('実行エラー:', e.message); process.exit(1); });
