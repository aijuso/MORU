# プロモーション実装アーキテクチャ案(2026-08-25・READ ONLY 調査)

> **Shopify は未変更。Discount resource は作成も有効化もしていない。**
> 本書は仕様調査と設計案まで。実装は Owner Gate。
>
> 調査方法: Shopify Dev MCP `search_docs_chunks`(Discount Function API)+
> `validate_graphql_codeblocks`(api = `functions_shipping_discounts`)で input query を実機検証。

---

## 1. 送料無料 ¥7,700 の境界問題(Owner: しきい値は変えない)

### 何が起きるか

```
割引前 subtotal ¥7,960(フェイクファー ¥3,980 × 2)  → 送料無料
        ↓ まとめ買い 2点 10%OFF
割引後 subtotal ¥7,164                              → 送料 ¥870 が発生
        ↓
顧客の手取り: −¥796(割引) + ¥870(送料) = **+¥74 の値上げ**
```

**割引を使ったほうが高くなる。**これはローンチ前に解消が必要。

### 該当7件(現行の新価格案)

| # | 対象 | 割引前 | 割引後 | 不足 |
|---|---|---|---|---|
| 1 | ジオメトリック ブックスタンド 本体(Sale10%) | ¥7,980 | ¥7,182 | ¥518 |
| 2 | フェイクファー 150×200 / 180×200(2点) | ¥7,960 | ¥7,164 | ¥536 |
| 3 | フェイクファー 100×150(3点) | ¥8,940 | ¥7,599 | ¥101 |
| 4 | フランネル 150×200 / 180×200(2点) | ¥7,960 | ¥7,164 | ¥536 |
| 5 | フランネル 100×150(3点) | ¥8,940 | ¥7,599 | ¥101 |
| 6 | 手編みコースター ¥2,980帯(3点) | ¥8,940 | ¥7,599 | ¥101 |
| 7 | PAIR P-F(バルーンドッグ + ツインベル) | ¥8,460 | ¥7,191 | ¥509 |

### 検討した4案

| 案 | 内容 | 判定 |
|---|---|---|
| **A. Shopify 標準の配送料金設定** | 配送プロファイルの「注文金額」条件で ¥7,700 以上を無料にする | ❌ **不可。**標準条件は**割引後の金額**で評価される。割引前で判定する設定は無い |
| **B. Delivery Customization Function** | `cart.delivery.options.transform.run` で配送オプションを書き換える | ⚠️ **できるが不適。**配送オプションの**表示・並べ替え・名称変更**が用途で、**料金を0にする用途ではない**。割引として履歴に残らない |
| **C. Shipping Discount Function を単体で追加** | `cart.delivery-options.discounts.generate.run` で条件付き 100% 配送割引 | ⚠️ 動くが、**商品割引と別 Function になるため「割引前 subtotal」を自分で再構成する必要がある**(→ 案D の理由) |
| **D. ✅ 既存の Discount Function に配送ターゲットを追加(推奨)** | **1つの Function 拡張が2つのターゲットを持つ**:<br>`cart.lines.discounts.generate.run`(商品割引)<br>`cart.delivery-options.discounts.generate.run`(配送割引) | ✅ **推奨** |

### なぜ案 D が最善か

Shopify の Discount Function は **1つの拡張に複数ターゲットを宣言でき、
`discount.discountClasses` に `PRODUCT` / `ORDER` / `SHIPPING` のどれが含まれるかで
それぞれのターゲットを出し分ける**(公式の "Create combined multi-type discounts" 例で確認)。

これにより:

- **割引を決めているのと同じ Function が、同じ設定 metafield を読んで配送も決める**
- **「割引前 subtotal で判定する」ロジックを1箇所に書ける**
- Sale / Multi-buy / PAIR / 送料無料の**優先順位と排他が1つのコードで完結する**
- **送料無料ライン ¥7,700 は変えない。**しきい値は設定 metafield に持たせる

### 実装スケッチ(まだ書いていない)

```
extensions/moru-promotions-discount/
  shopify.extension.toml
    [[extensions.targeting]]  target = "cart.lines.discounts.generate.run"
    [[extensions.targeting]]  target = "cart.delivery-options.discounts.generate.run"
```

配送ターゲット側の判定:

```
1. discountClasses に SHIPPING が無ければ何もしない
2. 設定 metafield から free_shipping_threshold(= 7700)を読む
   読めない / 壊れている → 何もしない(fail-closed。送料を勝手に無料にしない)
3. **割引前 subtotal** = Σ(line.cost.amountPerQuantity × line.quantity)
4. 割引前 subtotal >= 7700 なら、全 deliveryGroup に 100% の配送割引を出す
5. それ以外は何もしない(Shopify 標準の ¥7,700 条件がそのまま働く)
```

> ⚠️ **検証が要る1点。**配送ターゲットが実行される時点で
> `line.cost.amountPerQuantity` が**商品割引適用前の値か適用後の値か**は、
> ドキュメントから断定できなかった。**推測で断定しない。**
>
> 実装後に **DEV ストアで1回テスト注文を通し、実値を確認してから本番に出す。**
> 万一 適用後の値だった場合の代替: 同じ Function が商品割引側で計算した割引額を
> 設定から再構成して足し戻す(割引率は設定 metafield にあるので復元できる)。

### この案の副作用

**割引前 ¥7,700 以上なら常に送料無料になるため、送料負担がわずかに増える。**
該当7件の不足は ¥101〜536 で、**送料 ¥870 を全額負担することになる。**
発生頻度は「割引を使い、かつ ¥7,700 をまたぐ注文」に限られるが、
**顧客の実質メリットが消える現状よりは良い**という判断。数字は Owner が確認。

---

## 2. Sale / Multi-buy / PAIR の排他制御を1つの Function に統合する案

### 現状

| 拡張 | ターゲット | 状態 |
|---|---|---|
| `multi-buy-discount` | `cart.lines.discounts.generate.run` | deploy 済み・**Discount 未作成** |
| `pair-set-discount` | `cart.lines.discounts.generate.run` | deploy 済み・**Discount 未作成** |

**2つの Function がそれぞれ独立に商品割引を出すため、
Shopify の組み合わせ設定次第で加算され得る。**Owner 方針(加算禁止)を
コードで保証できていない。

### 統合案 — `moru-promotions-discount` 1本にまとめる

**1つの Function が、1回の呼び出しでカート全体を見て、全施策の勝者を決める。**

```
入力: cart.lines[] (product.id, quantity, cost) + 設定 metafield

1. PAIR を判定       → 成立した組の対象商品に percentage 15 の候補を立てる
2. Multi-buy を判定  → 同一 Product 内の合計数量で 2点=10 / 3点以上=15 の候補を立てる
                        (別 Product は合算しない)
3. Summer Sale を判定 → 対象商品に percentage 10 の候補を立てる
4. **1商品につき候補は1つだけ残す。**
   percentage が高い方を採用。同率なら「先に定義された方」= PAIR > Multi-buy > Sale の順
5. 設定が読めない / 壊れている → operations を空で返す(fail-closed)
6. 同じ Function の配送ターゲットで、割引**前** subtotal から送料無料を判定(§1)
```

**手順4は既存 `pair-set-discount` の `resolveWinners` がすでに実装している**
(product ごとに最高 percentage を1つだけ残し、同率は定義順)。
**統合は新規発明ではなく、既存ロジックへの Sale / Multi-buy の合流。**

### 設定 metafield の形(案)

```json
{
  "freeShippingThreshold": 7700,
  "pairs":  [ { "id": "P-6", "title": "ソファの脇", "productIds": ["gid://...", "gid://..."], "percentage": 15 } ],
  "multiBuy": { "productIds": ["gid://..."], "tiers": [ {"min": 2, "percentage": 10}, {"min": 3, "percentage": 15} ] },
  "sale":     { "productIds": ["gid://..."], "percentage": 10,
                "excludedVariantIds": ["gid://shopify/ProductVariant/..."] }
}
```

- **固定 Product ID をコードにハードコードしない**(既存方針を維持)
- `sale.excludedVariantIds` で **ハル 2脚セットを Variant 単位で除外**(§3)

### 移行手順(実装は Owner Gate)

1. 新 `moru-promotions-discount` 拡張を作る(既存2本のロジックを移植・テストも移植)
2. `shopify app deploy` で **3つ目の Function として登録**(既存2本はまだ残す)
3. 新 Function で **Discount を1つだけ作る**
4. 動作確認後、旧2本の拡張を削除して再 deploy

**旧2本の Discount は作っていないので、切り替えで顧客影響が出る状態はまだ無い。**

---

## 3. ハル ダイニングチェア 2脚セットの Sale 除外(Owner決定)

**2脚セット Variant を Summer Sale の対象から外す。**

| Variant | 新通常価格 | Summer Sale |
|---|---|---|
| ウォールナット × グレーレザー調(1脚) | ¥20,980 | ¥18,882 |
| チェリー × ミルクブラウンレザー調(1脚) | ¥20,980 | ¥18,882 |
| ウォールナット × グレーレザー調(**2脚セット**) | ¥33,980 | **対象外** |
| チェリー × ミルクブラウンレザー調(**2脚セット**) | ¥33,980 | **対象外** |

理由: 2脚セット価格には既にセットメリット(1脚×2 比 **−¥7,980**)が入っている。
その上に Sale 10% を重ねると、**セット割 + 施策割の二段重ね**になる。

**価格自体は変更しない**(¥33,980 のまま)。分類上の変更だけ。

実装: 上記 metafield の `sale.excludedVariantIds` に 2脚セット2 Variant の GID を入れる。
**Product 単位ではなく Variant 単位の除外が必要**な点に注意。

---

## 4. ship_est の最小検証プラン

現状 **landed 実測 0件**。223/257 Variant の着地原価が
`ckb_cost + ship_est`(**小物 ¥800 / 中型 ¥1,750 / 大型 ¥3,500 の概算**)に依存している。

**全商品の実送料が揃うまでローンチを止める必要はない。**
ただし、**3バケットの代表1商品ずつ = 3件だけ**は実測を取る。

### 代表商品の選び方

**「そのバケットの判断がいちばん送料概算に振り回される商品」**を選ぶ。
= 概算送料が着地原価に占める割合が高く、かつ販売施策に乗っている商品。

| バケット | 代表商品 | 選定理由 | ship_est が着地原価に占める割合 |
|---|---|---|---|
| **小物 ¥800** | **フェイクファー ブランケット 100×150cm** | CKB ¥324 に対し概算 ¥800。**着地原価の 71% が概算**。全 Variant 中いちばん薄い(引当5%で限界利益 ¥1,135) | **71%** |
| **中型 ¥1,750** | **フラワーバッド テーブルランプ** | CKB ¥469 に対し概算 ¥1,750。**着地原価の 79% が概算**。唯一 絶対粗利額の目安を割っている商品 | **79%** |
| **大型 ¥3,500** | **クラウド サイドテーブル** | CKB ¥564 に対し概算 ¥3,500。**着地原価の 86% が概算**。**PAIR 第一候補 P-6 の片側**で、引当8%だと目安 ¥5,000 を割る | **86%** |

**3件とも「原価は安いが送料概算が原価の7〜9割を占める」商品。**
ここが外れていると採算判断が根本から変わる。逆に、
CKB 原価が高い商品(モコ ¥10,445 / デュオ ¥31,237 など)は概算のブレの影響が小さい。

### 取得する数字

THE CKB で **実際の配送見積、または初回発注の実績**として:

1. 中国国内送料(工場 → 代行倉庫)
2. 代行手数料・検品費
3. 国際送料(実重量 / 容積重量のどちらで課金されたか**も**)
4. 関税・輸入消費税
5. 国内配送料(通関後 → 顧客)
6. **梱包後の実寸法と実重量**(容積重量の再計算に要る。現在 Shopify 上は全商品 0kg)

### 反映の仕方

- 取得できたら `_ckb_costs.csv` の `ship_domestic_cn` / `agent_qc` / `intl_ship` / `duty_tax` に入れる
  → `price_audit.py` が自動で `cost_source = 実測` に切り替える
- **3件の実測と概算のズレ率**を見て、同じバケットの他商品の概算を更新するか判断する
  → **ズレ率を他商品へ機械的に横展開しない。**それは推測になる。
     更新するなら「概算を改訂した」と `docs/13 §2` に明記する
- **`ship_est` は改訂後も estimate と明記し続ける**

### ローンチとの関係

**この3件が取れるまで価格反映を止める必要はない。**
ただし **P-6(クラウド)と フラワーバッド は、実測が出るまで
「引当8%で目安割れ」を承知の上で出す**という理解が要る。
広告予算を大きく振るのは実測が出てからが安全。
