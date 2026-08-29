# 広告リンク先URLのルール(2026-08-29)

## 広告の色と着地の選択色を揃える

テーマは `?variant=<id>` で着地時の選択バリアントを指定できる
(`selected_or_first_available_variant`。2026-08-29 本番で実証明:
パラメータ付きでオリーブが checked、なしだと既定のアイボリー)。

**クリエイティブが特定色を見せているなら、リンク先URLに必ずその色の variant id を付ける。**

### フラワーラウンジの variant id

| 色 | variant id | URL |
|---|---|---|
| アイボリー(既定) | 50279721730288 | `https://moruliving.com/products/moru-flower-lounge?variant=50279721730288` |
| オリーブグリーン | 50279721763056 | `https://moruliving.com/products/moru-flower-lounge?variant=50279721763056` |

- FL_動画01_猫使用シーン_**オリーブ** → オリーブのURLにする(2026-08-29 に差し替え指示)
- 他商品の variant id は `https://moruliving.com/products/<handle>.js` の `variants[].id` で取れる

## 初日(2026-08-29)の観測メモ

- 消化 ¥3,626 / 購入1(¥8,532)/ CPA ¥3,626 — セール側CPA上限(旧価格ベース ¥3,533、+500後は≒¥3,880)の内側
- FL_動画01 が予算の98%を取り、画像2本は 3imp / 5imp で**未学習**(負けたのではなくデータなし)
- ファネル: クリック148 → LPV125(84%)→ カート追加4 → チェックアウト3 → 購入1
- **判断はLPV累計500まで保留。**ページ改修はしない(1画面目の構成は実測済みで問題なし)
