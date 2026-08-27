// MORU カラースウォッチ — オプション値名 → 色 の対応表を作る
//
//   node ops/products/swatch-colors/build.mjs
//
// テーマ(snippets/moru-swatch-color.liquid)は色を3経路で解決する:
//
//   1. Shopify ネイティブのオプションスウォッチ(value.swatch.color)
//   2. **product.metafields.custom.swatch_colors** — moru_color メタオブジェクトの
//      リスト(カラー名 + 色)。名前で突き合わせるので順序は関係ない ← ここを埋める
//   3. テーマ設定 swatch_color_map(ショップ共通のフォールバック)
//
// 経路1は OptionValueUpdateInput に swatch フィールドが無く、メタオブジェクト連携が
// 要るので採らない。経路3はテーマ設定 = settings_data.json の変更になり、
// MAIN テーマへの書き込みが禁止されているので採れない。
// **経路2だけがテーマを一切触らずに済む。** そのために定義も既に用意されている:
//   MetaobjectDefinition moru_color(label: 必須 / color: 必須)
//   MetafieldDefinition  custom.swatch_colors(list.metaobject_reference)
//
// 入力は storefront の /products.json(公開データ)。**手で書き写さない。**
//
// DRAFT 商品は /products.json に出てこないのでこのスクリプトの対象外。
// 2026-08-27 時点の DRAFT 8商品の扱いは以下(Admin API で個別に確認・設定した):
//
//   ピボ テーブルランプ       … カラー3値。**設定済み**(レッド / ダークグリーン / オレンジ)
//   ルナ ウォールライト       … カラー4値。**設定済み**(アンバー / クリアブラック /
//                              スモーキーグレー / クリアホワイト)
//   プラッシュ クッション     … 色8値。**未設定。** 「両面-W柄レザーパウダー」
//                              「両面-A字型フラワースキンパウダー」が機械翻訳のままで、
//                              何色を指すか確定できない。**名前を直すのが先**
//   手編みコースター         … 色7値。**未設定。** 「カエルの直径は12cmです」など
//                              動物名しかなく色の情報が無い。**名前を直すのが先**
//   アブストラクト オブジェ / レジン スカルプチャーオブジェ … オプション名が「色分類」。
//                              テーマは カラー/色/Color の**完全一致**でしか
//                              スウォッチにしないので対象外(ボタン表示)
//   セル モジュールキャビネット / ソラ キャットハンモック … オプション名が「タイプ」。同上

import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);

// スウォッチ表示になるオプション名。テーマ設定 swatch_option_names の既定値と一致させる。
// テーマ側は **完全一致** で判定しているので「色分類」「タイプ」「光色」は対象外。
const SWATCH_OPTION_NAMES = ['カラー', '色', 'color'];

// --- 色の辞書 -----------------------------------------------------------------
//
// 家具・ファブリックの実物に寄せた**彩度を落とした**値にしてある。
// Web セーフな原色(#FF0000 等)を使うと docs/01 の「明るい自然光・清潔感」から外れ、
// 画面上でスウォッチだけが浮く。
//
// ⚠️ これは**オプション値名から引いた近似値**であって、実測色ではない。
//    実物と食い違うものはオーナーが直す前提。_review.md に一覧を出す。
//
// キーは長いものから順に照合される(「ライトグレー」が「グレー」より優先される)。
const COLORS = {
  // 白・生成り
  ホワイト: '#F2F0EC',
  オフホワイト: '#EDE9E1',
  クリームホワイト: '#F0E7D8',
  ミルキーホワイト: '#F4F1EA',
  パールホワイト: '#EFEDE6',
  アイボリー: '#E7D6CA',

  // ベージュ・カーキ・茶
  ベージュ: '#D9C7AE',
  ライトカーキ: '#C4B79A',
  カーキ: '#8E8467',
  ブラウン: '#6E4E37',
  ライトブラウン: '#A17C5B',
  キャラメル: '#A9682F',
  カラメル: '#A9682F',
  天然木: '#C7A87C',
  ウォールナット: '#6B4A31',
  ダークウォールナット: '#4E3626',

  // 黄
  イエロー: '#E8C24A',
  ミルクイエロー: '#F0DFA8',
  ライスイエロー: '#EADFB8',
  レモンイエロー: '#EFD34D',
  ターメリックイエロー: '#D9A521',

  // 金属
  ゴールド: '#C6A253',
  ローズゴールド: '#C89A86',
  シルバー: '#C3C6C9',
  クローム: '#C8CCD0',

  // グレー・黒
  グレー: '#9A9A98',
  ライトグレー: '#C6C6C4',
  フォググレー: '#B6B7B3',
  ダークグレー: '#5A5A58',
  スペースグレイ: '#6E7276',
  ブルーグレー: '#8C9AA6',
  ブラック: '#2A2A28',
  スターライトブラック: '#23252A',
  パールブラック: '#2B2D31',

  // 赤・橙
  レッド: '#B23A2E',
  トゥルーレッド: '#C4342A',
  オレンジレッド: '#D1502F',
  オレンジ: '#D9773B',
  バーガンディ: '#6E2733',
  ルビー: '#9B2340',
  アンバー: '#C98A3C',
  クリアブラック: '#3A3B3F',
  クリアホワイト: '#EDEBE6',
  スモーキーグレー: '#86847F',

  // ピンク・紫
  ピンク: '#E4A8B0',
  ピンキー: '#EBB7BE',
  パープル: '#8878B0',
  ライトパープル: '#B7ADD4',
  バイオレット: '#7E6BA8',

  // 青
  ブルー: '#3F6FA8',
  ライトブルー: '#A8C6DE',
  ピーコックブルー: '#1F6E7A',
  ライムブルー: '#7FB6B0',

  // 緑
  グリーン: '#4E7A54',
  ダークグリーン: '#2F4E3A',
  オリーブグリーン: '#7A7455',
  フルーツグリーン: '#8FAE6B',
  エメラルド: '#2E7D6B',
};

// 長いキーを先に見るための順序。**短いキーが先に当たると誤判定する**
// (「ライトグレー」が「グレー」で潰れる)。
const KEYS_BY_LENGTH = Object.keys(COLORS).sort((a, b) => b.length - a.length);

/**
 * オプション値名から色を1つ決める。
 *
 * 「ブラック × ベージュパッチワーク」のような複合名は**後ろ側を採る**。
 * 前がフレーム色、後ろが張地で、見た目の差が大きいのは張地のほうだから。
 * 「ブラウン ブリック×スワロー」のように後ろに色語が無ければ前が残る。
 *
 * @param {string} name
 * @returns {{hex: string|null, matched: string|null}}
 */
function resolve(name) {
  const hits = [];
  for (const key of KEYS_BY_LENGTH) {
    let from = 0;
    for (;;) {
      const at = name.indexOf(key, from);
      if (at < 0) break;
      // すでに拾った、より長いキーに内包されている位置は無視する
      const covered = hits.some((h) => at >= h.at && at + key.length <= h.at + h.key.length);
      if (!covered) hits.push({ at, key });
      from = at + 1;
    }
  }
  if (!hits.length) return { hex: null, matched: null };
  // いちばん後ろに現れた色語を採る
  hits.sort((a, b) => a.at - b.at);
  const chosen = hits[hits.length - 1];
  return { hex: COLORS[chosen.key], matched: chosen.key };
}

// --- 実行 ---------------------------------------------------------------------

const raw = JSON.parse(fs.readFileSync(path.join(HERE, 'products.json'), 'utf8'));
const wanted = new Set(SWATCH_OPTION_NAMES.map((n) => n.toLowerCase()));

const perProduct = [];
const unresolved = [];
const labelToHex = new Map();

for (const p of raw.products) {
  for (const o of p.options) {
    if (!wanted.has(o.name.toLowerCase())) continue;
    const values = [];
    for (const v of o.values) {
      const { hex, matched } = resolve(v);
      if (!hex) {
        unresolved.push({ handle: p.handle, title: p.title, value: v });
        continue;
      }
      values.push({ value: v, hex, matched });
      const prev = labelToHex.get(v);
      if (prev && prev !== hex) throw new Error(`同じ名前に別の色: ${v} → ${prev} / ${hex}`);
      labelToHex.set(v, hex);
    }
    perProduct.push({ handle: p.handle, title: p.title, option: o.name, values });
  }
}

const out = {
  labels: [...labelToHex].map(([label, color]) => ({ label, color })).sort((a, b) => a.label.localeCompare(b.label, 'ja')),
  products: perProduct,
  unresolved,
};
fs.writeFileSync(path.join(HERE, 'mapping.json'), JSON.stringify(out, null, 2) + '\n');

// --- 人が見る用の一覧 ---------------------------------------------------------

const lines = [];
lines.push('# カラースウォッチ 対応表(自動生成 — 編集しない)');
lines.push('');
lines.push('`node ops/products/swatch-colors/build.mjs` で再生成する。');
lines.push('色を直したいときは `build.mjs` の `COLORS` を直して流し直す。');
lines.push('');
lines.push(`- 対象商品: **${perProduct.length}**`);
lines.push(`- 対象オプション値: **${perProduct.reduce((n, p) => n + p.values.length, 0)}**`);
lines.push(`- 一意なカラー名: **${out.labels.length}**`);
lines.push(`- 色を決められなかった値: **${unresolved.length}**`);
lines.push('');
lines.push('⚠️ 色は**オプション値名から引いた近似値**であって実測色ではない。');
lines.push('実物と違うものはオーナーが `COLORS` を直す。');
lines.push('');
for (const p of perProduct) {
  lines.push(`## ${p.title}（${p.handle}）`);
  lines.push('');
  lines.push('| オプション値 | 拾った色語 | 色 |');
  lines.push('|---|---|---|');
  for (const v of p.values) lines.push(`| ${v.value} | ${v.matched} | \`${v.hex}\` |`);
  lines.push('');
}
if (unresolved.length) {
  lines.push('## 🔴 色を決められなかった値');
  lines.push('');
  lines.push('| 商品 | オプション値 | なぜ |');
  lines.push('|---|---|---|');
  for (const u of unresolved) {
    lines.push(`| ${u.title} | ${u.value} | 名前に色語が無い。1色で表せない値なので、`);
    lines.push('推測で色を当てず**未設定のまま**にした |');
  }
  lines.push('');
}
fs.writeFileSync(path.join(HERE, '_review.md'), lines.join('\n'));

console.log(`商品 ${perProduct.length} / 値 ${perProduct.reduce((n, p) => n + p.values.length, 0)} / 一意なカラー名 ${out.labels.length} / 未解決 ${unresolved.length}`);
for (const u of unresolved) console.log(`  🔴 未解決: ${u.title} — ${u.value}`);
