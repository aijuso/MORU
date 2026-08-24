# MORU まとめ買い割引 Discount Function(Phase B)

仕様: `docs/12_price_redesign_and_multibuy.md` §7。

> 🚫 **本番有効化していない。** Discount も作成していない(ストアの `discountNodes` は0件のまま)。
> 対象商品の確定・tag / metafield の付与・combination 設定は **Owner 承認が要る**(docs/12 §2)。
> ここにあるのは**コードとテストだけ**。

## ロジック

| Product 合計数量 | 割引 |
|---|---|
| 1 | なし |
| 2 | **10% OFF** |
| 3以上 | **15% OFF** |

- 数量は **Variant ID ではなく PRODUCT ID 単位で合算**する(docs/12 §7-2)
- 割引はその Product の**全カートラインの全数量**に載る。
  `cartLine.quantity` を渡していないため、「アヒル×2 + カエル×1 = 3点 → 全数量15%OFF」が成立する
- カートを変更すれば毎回 Function が再実行されるので、3点→2点は 15%→10%、2点→1点は解除になる(§7-4)

## 対象商品の判定 — **専用タグではなく metafield を使っている**

Product metafield **`custom.multi_buy_eligible`(boolean)** が `true` の商品だけを対象にする。

docs/12 §7-5 の懸念のとおり、`tier-*` は階層・`cushion` / `object` / `textile` はカテゴリ(docs/09)なので、
**販促の可否フラグをカテゴリタグに相乗りさせると、カテゴリを変えた瞬間に割引対象が変わる。**
metafield なら Function の input から直接読め、タグ設計を汚さない。

**fail-closed。** metafield が無い商品・null・false はすべて対象外。
つまり **metafield を1件も付けないままこの Function を有効化しても、割引は1円も出ない。**
承認ゲートとして、この挙動は意図的。

metafield 定義(**承認後に**作成する。まだ作っていない):

| 項目 | 値 |
|---|---|
| namespace / key | `custom` / `multi_buy_eligible` |
| type | `boolean` |
| owner | Product |

## しきい値の変更

Discount の app metafield(`$app` / `function-configuration`)に JSON を入れると上書きできる。

```json
{ "tiers": [ { "minQuantity": 3, "percentage": 15 }, { "minQuantity": 2, "percentage": 10 } ] }
```

未設定なら `DEFAULT_TIERS`(2点10% / 3点15%)。壊れた設定は既定値に落ちる。

## ファイル

| ファイル | 中身 |
|---|---|
| `src/multi_buy.js` | **判定ロジック本体(純粋関数)。** Shopify の生成コードを import していないので Node から素で実行できる |
| `src/cart_lines_discounts_generate_run.js` | Function の export。生成 enum を渡して `buildResult` を呼ぶだけ |
| `src/cart_lines_discounts_generate_run.graphql` | input query。**Shopify MCP の `validate_graphql_codeblocks`(api: `functions_discount`)で検証済み** |
| `tests/run_tests.mjs` | docs/12 §7-7 の12件 + 境界5件 |

## テスト

```bash
node extensions/multi-buy-discount/tests/run_tests.mjs
```

**17 passed / 0 failed**(2026-08-24 実行)。docs/12 §7-7 の12ケースは全て含んでいる。

## デプロイ(まだ実施していない・Owner 承認が要る)

**このリポジトリはテーマであってアプリではない。** Function を動かすには Shopify アプリが要る。

1. `shopify app init` でアプリを作り、`shopify.app.toml` の `scopes` に **`write_discounts`** を追加
2. この `extensions/multi-buy-discount/` をアプリの `extensions/` 配下に置く
3. `shopify app deploy`
4. Admin から **Automatic discount** として作成し、**discount class に Product** を付ける
5. 対象商品に `custom.multi_buy_eligible = true` を付ける ← **ここで初めて割引が発生する**

## Discount combination(docs/12 §7-6)

**変更しない。** 現段階では SALE / PAIR・SET / その他 Product Discount との自動スタッキングを
**すべて off で作成する**ことを提案する。ストアに他の Discount が0件なので、
off から始めて実績を見てから開けるのが安全。**Owner 承認なしに combination を変えない。**

## ⚠️ 有効化前に必ず解決すべきこと(Phase A で見つかった)

| # | 内容 |
|---|---|
| 1 | **送料無料しきい値**。ストア設定は **¥7,700**、トップ表示は ¥15,000。しきい値は**割引後の小計**で判定されるため、「¥8,000 のカゴが10%OFFで ¥7,200 になり送料無料を失う」が起きる。**数量割引より先に一本化する** |
| 2 | **ハル ダイニングチェアに「2脚セット」Variant がある。** 対象にすると「2脚セット×1=割引なし / 1脚×2=10%OFF」という逆転が起きる。**対象外にする**(Phase A の判定も対象外) |
| 3 | **デュオ ナイトテーブルの「2連」も同種のセット Variant。** 同じ理由で対象外 |
| 4 | Product Page の 10% / 15% 表示は **ChatGPT 側の参考表示**。source of truth は Cart / Checkout の Shopify 実計算。有効化後に突き合わせる(docs/12 §7-7 末尾) |

---

## デプロイ状況(2026-08-24)— **⛔ Owner のログインが要る。まだ登録できていない**

Owner から「`shopifyFunctions` に載るところまで進めてよい」と承認を受けたが、
**この実行環境からはデプロイできない。** ブロックしているのは権限ではなく**ログイン方式**。

### 実査したこと

| 確認 | 結果 |
|---|---|
| ストアの `shopifyFunctions` | **0件**(まだ何も登録されていない) |
| Shopify CLI | `@shopify/cli@4.7.0` を導入済み。動作する |
| CLI の認証 | **デバイス認証(ブラウザ)必須。** `User verification code: ****` が出て
`https://accounts.shopify.com/activate-with-code` を開こうとするが、**この環境にブラウザが無い**(`xdg-open ENOENT`)。コードの有効期限は約15分 |
| 非対話デプロイ | `--allow-updates` 等の CI フラグはあるが、**`SHOPIFY_CLI_PARTNERS_TOKEN` が環境に無い**ので認証自体が通らない |
| アプリ本体 | **まだ存在しない。** `client_id` は Partner org でアプリを作る/紐づけるときに発行される。`shopify.app.toml` は `client_id` 必須で、**手で埋められない** |
| テーマ操作への影響 | **無し。** アプリ設定は `shopify.app.toml.example` として置いてあり、`shopify theme *` は影響を受けないことを確認済み |

**Function は Admin API からは登録できない。** `shopifyFunctions` は読み取り専用で、
Function は**アプリの deploy を通してしか**ストアに載らない。
Shopify MCP の `graphql_mutation` でも代替できない。

### Owner にお願いしたいこと(どちらか一方)

**方法1: CI トークンを渡す(推奨・その場に居なくてよい)**
Partner Dashboard で CLI 用トークンを発行し、環境変数 `SHOPIFY_CLI_PARTNERS_TOKEN` に入れてもらう。
以降は非対話でデプロイできる。

**方法2: その場でデバイス認証する(15分以内の同席が要る)**
こちらでコマンドを走らせ、表示された verification code を Owner がブラウザで承認する。

### 認証が通ったあとの手順(1回で終わる)

```bash
cp extensions/multi-buy-discount/shopify.app.toml.example ./shopify.app.toml
shopify app config link          # ← Partner org でアプリを作る / 既存に紐づける(client_id が入る)
shopify app deploy --allow-updates
```

`shopify app config link` は **Partner org に "MORU Discounts" というアプリを新規作成する。**
既存アプリに載せたい場合は、そのアプリを選ぶこともできる。**どちらにするかは Owner 判断。**

### デプロイ後に報告する項目(Owner 指定)

```graphql
query { shopifyFunctions(first: 25) { nodes { id title apiType apiVersion app { title } } } }
```

Function ID / title / handle / apiType(`discount`)/ apiVersion(`2025-10`)を報告して**止まる。**
**Discount resource の作成・有効化・商品 metafield の設定・価格変更は、次の Owner 承認まで行わない。**
