# Higgsfield 画像生成レシピ(実測・2026-08-23 検証済み)

> **画像生成はすべて Higgsfield で行う(D-073)。** 他のツールを使わない。
> 本ファイルは「実際に通した手順」。推測は書かない。動かなかったことも残す。

## 確定パラメータ

| 項目 | 値 |
|---|---|
| モデル | **`gpt_image_2`**(GPT Image 2 / OpenAI) |
| quality | **`low`**(D-073) |
| resolution | `1k`(既定) |
| コスト | **0.5 クレジット / 枚**(`get_cost: true` で実測) |
| 出力 | 1024 × 1024(`aspect_ratio: "1:1"` 指定時) |
| medias の role | **`image`**(`image_references` ではない。モデルごとに違うので `models_explore` で確認) |

`count: 2` で同一プロンプトの別案を2枚同時に出せる。**採用候補を選べるので既定で2枚出す。**

## 参照画像の渡しかた(3枚)

**URL は `medias[].value` に直接渡せない。必ず media_id にする。**

```
① 商品画像(Shopify CDN の URL)
   media_import_url(url) → media_id            ← そのまま使える

② ブランドシート(ローカルの PNG)
   media_upload(files[]) → upload_url を受け取る
   curl -X PUT -H "Content-Type: image/png" --data-binary @<file> "<upload_url>"   ← HTTP 200 を確認
   media_confirm(type:"image", media_ids:[...]) → status: uploaded
```

**渡す順序がそのまま IMAGE 1 / 2 / 3 になる。プロンプト側の番号と一致させる。**

| 順 | 中身 |
|---|---|
| IMAGE 1 | **商品画像**(形状の正) |
| IMAGE 2 | タイプ別シート(`03_thumbnail_rules.png` 等) |
| IMAGE 3 | `01_brand_visual.png` |

## プロンプトの骨格(この形で通った)

```
REFERENCE ROLES — follow strictly.

IMAGE 1 = THE PRODUCT. Reproduce this exact <商品> faithfully: <構造を具体的に列挙>.
Do not redesign it. Do not alter its proportions, <その商品で崩れやすい要素>.

IMAGE 2 and IMAGE 3 = MORU'S OFFICIAL BRAND DESIGN STANDARD (brand reference sheets).
Use them ONLY as the photographic and styling standard: quality of light, airiness,
room styling, framing discipline. NEVER copy their layout, grid, captions, Japanese text,
logos, colour swatches, or any of the products shown inside them.
The output must be one single clean photograph, never a sheet or collage.

SCENE — <1枚の写真として書く>
COLOUR — <オフホワイト+木を基調 / アクセントは1色だけ / 色は固定しない>
COMPOSITION — <主役・余白・アングル>
RENDERING — clean editorial interior photography, bright, airy, natural daylight,
gentle contrast. No harsh studio lighting, no glossy HDR advertising look.
STRICTLY EXCLUDE — any text, lettering, captions, watermarks, logos; white cut-out
studio background; people; animals (指定がある場合を除く); cat-ear or paw-print motifs;
extra copies of the product.
```

### この骨格で効いた点(実測)

- **「IMAGE 2/3 はブランド基準。レイアウト・文字・掲載商品を絶対にコピーするな」を明示しないと、
  シートそのもの(グリッド+日本語キャプション)を描き出す危険がある。** 必ず入れる
- **`STRICTLY EXCLUDE` に text / lettering / watermark を必ず入れる。** 入れないと看板や文字が湧く
- **アクセント色を1色に限定し、色名を指定しない**と、商品に似合う色をモデルが選ぶ(D-070 と整合)。
  検証時はマスタード系のラグと花瓶を自分で選んできた
- **`Do not redesign it` + 構造の列挙**で、クロームのチューブ・コーデュロイの畝・グレーの脚キャップまで再現された

## 検証結果(コーデュロイ フォールディングチェア・サムネイル)

| | 結果 |
|---|---|
| 形状の再現 | **良好。** チューブ構造・座面の厚み・背もたれの形・脚キャップまで一致 |
| ブランド適合 | **良好。** 明るい自然光・抜け感・余白・アクセント1色。白抜きなし |
| 文字の混入 | **なし** |
| シートのコピー | **なし**(除外指示が効いた) |
| 惜しい点 | 案A はラグが右端で切れた。案B は円形ラグが収まり構図が良い → **count:2 で選ぶ価値がある** |

## まだ検証していないこと(次にやる人へ)

- **バリアント別サムネイル**: 色違いを作る場合、参照する商品画像もその色のものに差し替えるべきか、
  プロンプトで色名を上書きするだけで足りるか未検証
- **説明画像の日本語文字**: `gpt_image_2` は text-rendering タグを持つが、**日本語**の精度は未検証。
  崩れたら HTML で作り直す(スキル §6-C)
- **寸法図**: 生成しない方針。HTML で作る
- 4K / medium・high quality は未使用(コスト増。low で足りている)
