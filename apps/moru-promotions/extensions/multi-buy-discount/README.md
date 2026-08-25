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

## デプロイ — **アプリは `apps/moru-promotions/`(MORU Promotions)**

Owner 決定(2026-08-24): **Function ごとにアプリを作らず、`MORU Promotions` 配下に
Extension として並べる。** リポジトリ直下をアプリ化せず、`apps/moru-promotions/` に独立させる。

```
apps/moru-promotions/
  shopify.app.toml        ← client_id は `shopify app config link` が書き込む
  package.json            ← npm test / build / deploy
  extensions/
    multi-buy-discount/   ← このディレクトリ
```

### スコープ(最小)

```toml
scopes = "read_products,write_discounts"
```

| scope | なぜ要るか |
|---|---|
| `write_discounts` | Function を割引として登録し、のちに Automatic Discount を作るため。`read_discounts` は含まれる |
| `read_products` | input query が Product の merchant-owned metafield `custom.multi_buy_eligible` を読むため |

**付けていないもの:** `write_products` / `read_orders` / `read_customers` / `read_inventory` /
`write_themes` / **network access**(Function は外部通信しない)。

> ⚠️ `read_products` について: Shopify のドキュメントは「input query から product の metafield を
> 読める」と明記しているが、**そのために必要な scope を名指ししていない。**
> 安全側に倒して読み取り専用の最小 scope として入れてある。
> **deploy 後に metafield が読めることを確認できたら、外せるかを検証する。**
> 逆に読めなかった場合は、`custom` ではなく **app-owned(`$app:multi_buy_eligible`)** への
> 切り替えを検討する(その場合は Owner の metafield 方式の決定に関わるので相談する)。

### 手順(認証が通れば1回で終わる)

```bash
cd apps/moru-promotions
shopify app config link      # Partner org に "MORU Promotions" を作る / 既存に紐づける
shopify app deploy --allow-updates
```

### ✅ deploy 済み(2026-08-25)

```bash
cd apps/moru-promotions
npm ci
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt \
  ./node_modules/.bin/shopify app deploy --allow-updates
```

| 項目 | 値 |
|---|---|
| App | MORU Promotions |
| Client ID | `7e71fcf4cf775c9c2568b1783bed5cfc` |
| app version | `moru-promotions-3`(active) |
| extension uid | `a475e5e4-1bfc-6e0c-1036-c65f32d3a9cca5956889` |
| api_version | `2025-10` |
| scopes | `read_products,write_discounts` |
| テスト | 17 passed / 0 failed |
| ストアの `discountNodes` | **0件(意図どおり)** |
| ストアの `shopifyFunctions` | **0件 — 未解決。下記参照** |

### ⚠️ ビルドで踏んだ罠(D-100)。踏み直さないこと

| やってはいけない | なぜ |
|---|---|
| `[extensions.build] command` に `npm run build` を書く | package.json の `build` が `shopify app function build` を呼び返して**無限再帰**。出力ゼロで永久にハングする(「javy が遅い」に見える)。**JS Function は CLI が直接ビルドするので空でよい** |
| エントリを `src/index.js` 以外にする | CLI は `src/index.js`(または .ts/.jsx/.tsx)しか探さない。無いと `isJavaScript` が false になり「build command が無い」で落ちる |
| TOML の `export` を camelCase にする | Wasm Component Model の制約で kebab-case 必須。JS 側の camelCase とは CLI が自動で対応づける |
| プロキシ変数なしで CLI を叩く | この実行環境の Shopify CLI は `HTTPS_PROXY` を読まない。`NODE_USE_ENV_PROXY=1` と `NODE_EXTRA_CA_CERTS` が要る。無いと無言でハングする |

### 未解決: ストアに Function が出てこない

deploy 25分後も `shopifyFunctions` は0件。app version は active なので、
**`MORU Promotions` が `rgy5ee-fv.myshopify.com` にインストールされていない可能性が高い。**
Admin API の `appInstallations` は権限が無く、こちらからは確認できない。

→ **Owner に Dev Dashboard → 該当アプリ → Home → Install app を確認してもらう。**
(`DEPLOY_GUIDE.md` の ②-2)

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
