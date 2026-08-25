# MORU ペア・セット割引 Discount Function

指示: 2026-08-25 Owner。仕様の位置づけは `docs/12_price_redesign_and_multibuy.md`。

> 🚫 **Discount resource は作っていない。有効化もしていない。**
> 対象の組み合わせ確定・combination 設定は **Owner 承認が要る**。
> ここにあるのは**コードとテスト、そして deploy 済みの Function 本体だけ**。

## まとめ買い割引(multi-buy-discount)との違い

| | multi-buy-discount | pair-set-discount(これ) |
|---|---|---|
| 何で決まるか | **同じ Product を何点買ったか** | **違う Product の組み合わせが揃ったか** |
| 対象の決め方 | Product metafield `custom.multi_buy_eligible` | **Discount の app metafield の JSON** |
| 割引率 | 2点10% / 3点以上15%(既定) | グループごとに設定 |
| 判定単位 | Product ID(Variant はまたいで合算) | Product ID(Variant は問わない) |

**別 Function・別ロジック。**同じ Discount には載らない(それぞれ別の Automatic Discount になる)。

## 対象商品をコードに書かない(config-driven)

Product ID を**ソースにハードコードしていない**。組み合わせを変えるのに
Function の再デプロイは要らない。Discount の app metafield
(`$app` / `function-configuration`)に JSON を入れるだけ。

```json
{
  "groups": [
    {
      "id": "flower-pair",
      "title": "フラワーシリーズ",
      "productIds": [
        "gid://shopify/Product/10218006446320",
        "gid://shopify/Product/10218057531632"
      ],
      "percentage": 15
    },
    {
      "id": "lamp-clock",
      "title": "灯りと時計",
      "productIds": ["gid://shopify/Product/...", "gid://shopify/Product/..."],
      "percentage": 15
    }
  ]
}
```

| キー | 必須 | 意味 |
|---|---|---|
| `productIds` | ✅ | **2件以上。**全部カートに入って初めて成立する。Variant は問わない |
| `percentage` | ✅ | 0 < x < 100。範囲外・数値でないものはそのグループごと無効 |
| `id` | — | 省略すると `group-1` のように自動採番。重複した id は**後から来たほうを捨てる** |
| `title` | — | 割引名に出る(`フラワーシリーズ セット 15%OFF`)。省略時は `セット購入 15%OFF` |

## 判定

1. `productIds` の**全て**が、カートに1点以上あること
2. 成立したら `setCount = 各 Product の合計数量の最小値`(何セット組めるか)
3. グループ商品の各ラインに、**合計 setCount 個まで** `percentage`% OFF

| カート | 結果 |
|---|---|
| A×1 + B×1 | 1セット → A1個・B1個が15%OFF |
| A×2 + B×3 | 2セット → A2個・B2個。**B の3個目は対象外** |
| A×1 + B×5 | 1セット → A1個・B1個だけ |
| A だけ | **割引なし** |
| A-v1×1 + A-v2×2 + B×2 | A は合計3個だが setCount=2 → A2個(ラインをまたいで按分)・B2個 |

「A×10 + B×1 で全部15%OFF」にならないよう、**セット数で頭打ちにしている**。

## 重複しない

1つの Product が複数グループに含まれても、**割引は1つだけ**。
成立したグループのうち **`percentage` が最も高いもの**が勝つ。
同率なら**先に定義したグループ**が勝つ(= 設定の順番に意味がある)。

## fail-closed

- metafield が無い / JSON が壊れている / `groups` が空 → **割引0円**
- `productIds` が実質1件のグループ → そのグループだけ無効(まとめ買い割引の領分)
- Discount に PRODUCT クラスが付いていない → 何もしない

**設定を1件も入れないまま有効化しても、割引は1円も出ない。**承認ゲートとして意図的にそうしてある。

## ファイル

| ファイル | 中身 |
|---|---|
| `src/pair_set.js` | **判定ロジック本体(純粋関数)。** 生成コードを import していないので Node から素で実行できる |
| `src/cart_lines_discounts_generate_run.js` | Function の export。生成 enum を渡して `buildResult` を呼ぶだけ |
| `src/index.js` | **CLI が固定で探すエントリポイント。** 中身は再輸出だけ(D-100) |
| `src/cart_lines_discounts_generate_run.graphql` | input query。Shopify MCP の `validate_graphql_codeblocks`(api: `functions_discount`)で検証済み |
| `tests/run_tests.mjs` | 21件 |

## テスト

```bash
node extensions/pair-set-discount/tests/run_tests.mjs
```

**21 passed / 0 failed**(2026-08-25)。

## deploy 状況

| 項目 | 値 |
|---|---|
| App | MORU Promotions(`7e71fcf4cf775c9c2568b1783bed5cfc`) |
| app version | `moru-promotions-4`(active) |
| extension uid | `54593006-b244-854c-5c79-1dca16afacb8f0c73de2` |
| handle | `moru-pair-set-discount` |
| api_version | `2025-10` |
| Discount resource | **未作成(0件)。Owner 承認まで作らない** |

```bash
cd apps/moru-promotions
npm ci
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt \
  ./node_modules/.bin/shopify app deploy --allow-updates
```

⚠️ ビルドの罠は `../multi-buy-discount/README.md` の表を必ず読むこと(D-100)。
この Extension も同じ構成(build command 空 / `src/index.js` / kebab-case export /
`typegen_command = "true"`)で作ってある。

## Combination(承認前)

**すべて off で作成することを提案する。**

| 相手 | 初期値 |
|---|---|
| Product discount(まとめ買い割引) | **off** |
| Order discount | **off** |
| Shipping discount | **off** |

まとめ買い割引と重ねると「ペアで15% + 同一商品3点で15%」が同時に載って
原価割れの危険がある。**実績を見てから開ける。**

## 有効化前に決めること

1. 対象の組み合わせ(`ops/products/_pair_candidates_20260825.md` の8案)
2. 割引率(現案は一律15%)
3. **CKB 原価監査の完了。**組み合わせの片方だけ原価未確定でも採算は出せない
4. 送料無料しきい値との干渉(`docs/10_pricing_rules.md`)。
   しきい値は**割引後の小計**で判定されるため、ペア割引で ¥7,700 を割ると送料が復活する
