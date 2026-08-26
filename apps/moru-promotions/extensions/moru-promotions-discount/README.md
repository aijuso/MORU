# MORU 販促割引(統合)— `moru-promotions-discount`

`multi-buy-discount` と `pair-set-discount` を1本にまとめた Discount Function(D-128)。
**2つのターゲット**を持つ。

| ターゲット | 役割 |
|---|---|
| `cart.lines.discounts.generate.run` | PAIR / まとめ買い / Summer Sale を判定し、**1商品につき割引を1つだけ**当てる |
| `cart.delivery-options.discounts.generate.run` | **割引前** subtotal がしきい値以上なら送料を 100%OFF |

## なぜ統合したか

別々の Function にしておくと、**Shopify の組み合わせ設定次第で割引が加算され得る。**
Owner 方針(**加算禁止・1商品につき割引1つ**)をコードで保証するには1本にする必要がある。

配送を同居させたのは、**「割引前 subtotal」の定義を割引を決める側と1箇所に揃えるため。**

## 優先順位

```
1. PAIR       15%
2. Multi-buy  2点 10% / 3点以上 15%(同一 Product 内で合算。別 Product は合算しない)
3. Sale       10%
```

勝者はこの順で比較する:

1. **percentage が高い方**
2. 同率なら **割引が当たる数量が多い方**
   PAIR は成立セット数までしか当たらないので、同率 15% なら全数量に当たる
   まとめ買いの方が顧客にとって得。ここで取りこぼさない
3. それも同じなら **定義順 PAIR > Multi-buy > Sale**

## 設定(Discount の app metafield `$app` / `function-configuration`)

**Product ID をコードにハードコードしない。**

```json
{
  "freeShippingThreshold": 7700,
  "pairs": [
    { "id": "P-6", "title": "ソファの脇",
      "productIds": ["gid://shopify/Product/10218006315248",
                     "gid://shopify/Product/10218008248560"],
      "percentage": 15 }
  ],
  "multiBuy": {
    "productIds": ["gid://shopify/Product/..."],
    "tiers": [ { "minQuantity": 2, "percentage": 10 },
               { "minQuantity": 3, "percentage": 15 } ]
  },
  "sale": {
    "title": "SUMMER SALE",
    "productIds": ["gid://shopify/Product/..."],
    "percentage": 10,
    "excludedVariantIds": ["gid://shopify/ProductVariant/..."]
  }
}
```

- `pairs` は旧 `groups` キーでも読む(`pair-set-discount` からの移行用)
- `multiBuy.productIds` が空のときだけ、Product metafield `custom.multi_buy_eligible`
  が true の商品を対象とみなす(旧 `multi-buy-discount` との後方互換)
- **`sale.excludedVariantIds` は Variant 単位の除外。**
  ハル ダイニングチェア 2脚セット(既にセット割が入っている)を Summer Sale から
  外すのに使う(D-126)。**Product 単位では外せない**

## fail-closed

| 状況 | 挙動 |
|---|---|
| PRODUCT 割引クラスが無い | 商品割引を出さない |
| SHIPPING 割引クラスが無い | 配送割引を出さない |
| 設定 metafield が無い / 壊れている | **何もしない** |
| `freeShippingThreshold` が数値でない | 配送割引を出さない(標準の条件がそのまま働く) |
| カートが空 / 対象商品なし | 何もしない |

**壊れた設定で勝手に安く売らない・送料を勝手に無料にしない。**

## テスト

```
node tests/run_tests.mjs     # 43 passed / 0 failed
```

Shopify の生成コード(`../generated/api`)を import していないので、
**Wasm を作らなくても素の Node で走る。**

## ⚠️ 本番前に必ず実機で確認すること

配送ターゲットが実行される時点で `line.cost.amountPerQuantity` が
**商品割引の適用前か適用後か**は、ドキュメントから断定できなかった。
**DEV ストアでテスト注文を通して実測してから本番に出す。**

確認する4件:

1. 割引前 ¥7,700 以上 → 割引後 ¥7,700 未満 → **送料無料が維持される**
2. 本来 ¥7,700 未満の注文 → **送料無料が付かない**
3. 割引なしの通常注文 → 従来どおり(¥7,700 以上で無料)
4. 1商品に**割引が2つ当たっていない**

適用後の値だった場合は、割引率が設定 metafield にあるので足し戻して復元できる。
手順は `ops/_promotion_architecture_20260825.md` §1。

## ビルド上の注意(D-100)

- `[extensions.build] command` は**空のまま**にする。
  `npm run build` を書くと package.json を呼び返して**無限再帰**する
- エントリポイントは `src/index.js` 固定。各ターゲットはそこから再 export する
- TOML の `export` は **kebab-case**(Wasm Component Model の制約)
