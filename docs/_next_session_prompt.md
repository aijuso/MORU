# 次セッションに貼る引き継ぎ文(2026-08-24 作成)

> このファイル自体が「次のセッションの最初に貼るテキスト」です。
> 下の `---` から下を丸ごとコピーして貼ってください。

---

MORU LIVING の作業を続けます。

ブランチ: `claude/moru-living-shopify-dev-yvnmni`(新しいブランチは作らないでください)

## 最初にやること

1. `git fetch origin --prune`(docs/07_session_protocol.md §1)
2. `docs/06_handoff.md` を冒頭から読む(テーマ運用ルールと分業)
3. `docs/12_price_redesign_and_multibuy.md` を読む(価格再設計の指示書)
4. `apps/moru-promotions/DEPLOY_GUIDE.md` と
   `apps/moru-promotions/extensions/multi-buy-discount/README.md` を読む
5. `learn_shopify_api` を1回呼ぶ(無ければ docs/07 §6 の代替で進める)

## 今回の主タスク — Discount Function を Shopify にデプロイする

前セッションで、コード・テスト・アプリ構成・client_id まで揃っています。
**残っているのは deploy と確認だけです。**

### 状況

- アプリ **MORU Promotions** は Owner が Dev Dashboard で作成済み・MORU ストアにインストール済み
- **client_id `7e71fcf4cf775c9c2568b1783bed5cfc`** は
  `apps/moru-promotions/shopify.app.toml` に記入済み。**`shopify app config link` は不要**
- Owner が **`SHOPIFY_APP_AUTOMATION_TOKEN`** を環境変数に設定済み(このセッションから見えるはず)
- Shopify CLI は `apps/moru-promotions/` の devDependency。`./node_modules/.bin/shopify`
- ストアの `shopifyFunctions` は **0件**、`discountNodes` も **0件**(前セッション実査)

### 手順

```bash
# 0. トークンが見えているか確認(見えなければ Owner に報告して止まる)
env | grep SHOPIFY_APP_AUTOMATION_TOKEN

cd apps/moru-promotions
npm ci                       # 依存を入れる
npm test --prefix extensions/multi-buy-discount   # 17 passed / 0 failed を確認
./node_modules/.bin/shopify app build             # dist/function.wasm ができるか
./node_modules/.bin/shopify app deploy --allow-updates
```

**⚠️ `shopify app build` が前セッションでは完走を確認できていません**
(javy のダウンロードで時間がかかり、時間切れになった。エラーではない)。
**時間に余裕をもって実行し、失敗したらエラー全文を読んでから直してください。**
ビルド設定は `extensions/multi-buy-discount/shopify.extension.toml` の
`[extensions.build] command = "npm run build" / path = "dist/function.wasm"`。

### deploy 後に確認して報告する

```graphql
query { shopifyFunctions(first: 25) { nodes { id title apiType apiVersion app { title } } } }
query { discountNodes(first: 5) { nodes { id } } }
```

報告項目(Owner 指定): App名 / client ID / `shopify.app.toml` の場所 / Function title /
Function handle / Function ID / apiVersion / scopes / deploy 結果 /
`shopifyFunctions` の確認結果 / テスト結果 / **Discount がまだ0件であること**

**ここまでで止まってください。**

## 禁止事項(Owner 承認まで)

- `discountAutomaticAppCreate` / Discount resource の作成 / Discount の有効化
- `custom.multi_buy_eligible` を商品に設定すること
- 商品の price / compare_at_price / tags / metafields / status / publication の変更
- **MAIN テーマ `166203621616` への書き込み・publish**(`--allow-live` を使わない)
- **Frontend Dev `166341181680` の theme files の変更**(ChatGPT 側が並行実装中)
- 気づいた点があれば、直さずに**指摘としてまとめて渡す**

## deploy が終わったら(または待ちの間に)進めてよいこと

### 1. CKB 原価が届いていれば、価格監査を進める

`ops/products/_ckb_cost_request_20260824.md` を Owner が埋めたら、その内容を
`ops/products/_ckb_costs.csv`(列: `product,variant,ckb_cost,ship_domestic_cn,agent_qc,intl_ship,duty_tax,landed`)
に写して:

```bash
python3 ops/tools/price_audit.py
```

**原価が入った商品だけ監査が完成し、未入力は「原価待ち」で残ります。推測で埋めないこと。**
形式の見本は `ops/products/_ckb_costs.csv.example`。

### 2. Owner 判断待ちの項目(催促はしても、勝手に進めない)

- CKB Variant 原価の提供(優先度1: 11商品62 Variant)
- **アブストラクト オブジェの分割**(案は `ops/products/_abstract_object_split_20260824.md`。
  5〜6商品 + 非掲載2件。**DRAFT のまま維持**)
- **送料無料しきい値**(ストア実設定 ¥7,700 / トップ表示 ¥15,000。現状は虚偽表示)
- **まとめ買い対象13商品の確定**(`ops/products/_multibuy_candidates_20260824.md`)

## 前セッションまでに終わっていること(やり直さない)

- **Phase A 価格監査** … `ops/products/_price_audit_20260824.md` /
  `_price_audit_20260824_variants.csv`(257 Variant)
- **⛔ Variant 別 CKB 原価はこの実行環境からは取得できない**(D-096)。
  Shopify に原価(`unitCost` 全 null)・重量(全0kg)・価格履歴が無く、`ckb.jp` に到達できない。
  **同じ調査を繰り返さないこと。** Owner 依頼票に切り替え済み
- **×7〜×10 の高倍率は原価記録の取り違えだった**(D-097)。**値下げ推奨は0件。**
  説明がつかないのは **フラワー フロアクッション(×6.08)だけ**
- **Discount Function 実装 + テスト17件**(`apps/moru-promotions/extensions/multi-buy-discount/`)
- **docs の事実訂正**(Discount 0件 / compare_at 全 null / 20%クーポンは存在しない)
- 決定ログ **D-096〜D-099**

## 補足

- Shopify Dev MCP(`learn_shopify_api` / `validate_theme`)は接続失敗するセッションがある。
  その場合は docs/07 §6 の代替(`shopify theme check` / Admin側 MCP の
  `search_docs_chunks` / `validate_graphql_codeblocks`)で進めてよい
- GraphQL は提示前に必ず `validate_graphql_codeblocks` を通す(CLAUDE.md 必須ルール)
