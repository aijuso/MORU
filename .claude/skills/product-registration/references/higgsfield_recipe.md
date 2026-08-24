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

IMAGE 1 IS A PRODUCT-IDENTITY REFERENCE ONLY. Take from it ONLY the object itself:
its construction, proportions, materials, colour and finish — <構造を具体的に列挙>.
Reproduce that object faithfully; do not redesign it or alter its proportions.
<素材ロック: 例 every tube of the frame is the SAME bright polished silver chrome.
 No brass, no gold, no bronze, no mixed metals anywhere on the chair.>
IGNORE EVERYTHING ELSE IN IMAGE 1. It is a supplier studio shot. Do NOT reuse its
background, its bare wall, its skirting board, its flooring, its shadow, its lighting
direction, its camera height, its focal length, its framing or its crop. The output
must NOT look like that photograph re-lit — it must be a different photograph taken
in a different, fully furnished room.

IMAGE 2 and IMAGE 3 = MORU'S OFFICIAL BRAND DESIGN STANDARD (brand reference sheets).
THE ROOM AND THE CAMERA COME FROM THESE, not from IMAGE 1: their quality of daylight,
their airy furnished interiors, their styling density and their framing discipline.
But NEVER copy their layout, grid, captions, Japanese text, logos, colour swatches,
or any of the products shown inside them.
The output must be one single clean photograph, never a sheet or collage.

SCENE — <家具のある実際の部屋として書く。窓・サイドボード・額・植物・ラグまで具体的に>
CAMERA — <高さと画角を必ず指定する。指定しないと商品写真のカメラを引き継ぐ>
COLOUR — <オフホワイト+木を基調 / アクセントは1色だけ / 色名は固定しない>
ACCENT DISCIPLINE — <ラグは無地・低彩度。差し色は商品から離れた小物だけ。
                     商品より彩度の高いものを背後や足元に置かない>
COMPOSITION — <主役・余白・アングル>
RENDERING — clean editorial interior photography, bright, airy, natural daylight,
gentle contrast. No harsh studio lighting, no glossy HDR advertising look.
STRICTLY EXCLUDE — any text, lettering, captions, watermarks, logos; white cut-out
studio background; people; animals (指定がある場合を除く); cat-ear or paw-print motifs;
extra copies of the product.
```

### ⚠️ 最重要: IMAGE 1 の「範囲」を切らないと環境まで引き継ぐ

**1回目の失敗。** 「IMAGE 1 = THE PRODUCT」とだけ書いたら、**商品だけでなく撮影環境まで再現された。**
仕入れ元スタジオの淡い壁・幅木・オークのフローリング・カメラの高さ・画角が、そのまま出力に残った。
背景に植物とラグを足しただけの「同じ写真の焼き直し」になり、ブランドの世界観にならない。

**対処(2回目で解消):**

1. **`IMAGE 1 IS A PRODUCT-IDENTITY REFERENCE ONLY`** と書き、取るものを
   「物体の構造・比率・素材・色・仕上げ」だけに限定する
2. **`IGNORE EVERYTHING ELSE IN IMAGE 1`** を独立した行で書き、
   **背景・壁・幅木・床・影・光の向き・カメラ高・焦点距離・フレーミング・クロップを個別に列挙して否定する**
3. **`THE ROOM AND THE CAMERA COME FROM IMAGE 2/3`** と、部屋とカメラの出所を明示して移し替える
4. **`CAMERA:` ブロックで高さと画角を能動的に指定する。** 書かないと商品写真のカメラに引きずられる
5. SCENE は「家具のある実際の部屋」として具体的に書く(窓・サイドボード・額・植物・ラグ)

### ⚠️ 素材の色が転ぶ: 金属仕上げは1行でロックする

**2回目の残課題。** 後ろ脚だけ真鍮色に転んだ。周囲の木や暖色光に引っぱられたと思われる。

**対処(3回目で解消): 部位を列挙して同一仕上げだと言い切り、除外にも書く。**

```
METAL FINISH LOCK: every tube of the frame — front legs, rear legs, stretchers,
back uprights, seat rim — is the SAME bright polished silver chrome.
No brass, no gold, no bronze, no warm metal, no mixed metals anywhere on the chair.
...
STRICTLY EXCLUDE: ...; brass or gold coloured chair tubing.
```

**一般化: 商品の「一部分だけ色が転びやすい要素」(金属・木部・金具)は、
部位を列挙して同一だと明言し、`STRICTLY EXCLUDE` にも否定形で入れる。**

### ⚠️ 差し色が商品を食う: アクセントは「小さく・静かに」と書く

**3回目の残課題(オーナー指摘)。** 商品の真下に敷いた**円形ラグが大きな彩度の高い色面**になり、
マスタード(v1)やモスグリーン(v3)のほうが目に入って、**主役の椅子が目立たなくなった。**

**原因は指示の解像度不足。** 「差し色は1〜2色」とだけ書くと、モデルは
**「画面のいちばん大きい面を1色で塗る」**と解釈する。シート03 のルールは色数の話であって、
**面積と彩度の話が抜けていた。**

**対処: 面積・彩度・置き場所を分けて書く。**

```
ACCENT DISCIPLINE — the product must be the loudest thing in the frame.
The rug directly under and behind the product is a QUIET, PLAIN, near-neutral
floor covering — off-white, oatmeal, pale greige or soft sand. It must not be a
large saturated colour field and must not carry a pattern; it exists to separate
the product from the floor, nothing more.
The single accent colour appears only on SMALL objects placed AWAY from the
product — one vase, one book spine, one piece of wall art. Keep it to a few
percent of the frame.
No element behind or beneath the product may be more saturated than the product
itself.
```

**セルフチェック(スクイントテスト)**: 出力を目を細めて見る、またはぼかす。
**最初に目に入るのが商品でなければ不合格。** 背景の色面が勝っていたら作り直す。

**一般化: 「1〜2色」のような数の指定だけでは足りない。
面積(小さく)・彩度(商品より低く)・位置(商品から離す)を必ず書く。**

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

**3回まわしたが、まだ完成していない。**
v1 = 環境の引き継ぎ / v2 = 環境は解消・金属が転ぶ / v3 = 金属も解消。
**ただし v1〜v3 すべてで、足元のラグの色面が強すぎて商品が主役になっていない**(オーナー指摘)。
次は上の ACCENT DISCIPLINE を入れて再生成する。**色を固定しない方針自体は維持**
(モデルは毎回違う色を選んだ: マスタード → モスグリーン)。問題は色名ではなく面積と彩度。

## まだ検証していないこと(次にやる人へ)

- **バリアント別サムネイル**: 色違いを作る場合、参照する商品画像もその色のものに差し替えるべきか、
  プロンプトで色名を上書きするだけで足りるか未検証
- **説明画像の日本語文字**: `gpt_image_2` は text-rendering タグを持つが、**日本語**の精度は未検証。
  崩れたら HTML で作り直す(スキル §6-C)
- **寸法図**: 生成しない方針。HTML で作る
- 4K / medium・high quality は未使用(コスト増。low で足りている)
