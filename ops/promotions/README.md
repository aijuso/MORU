# Promotion 実行 Runbook(2026-08-26)

> **この時点で Shopify は未変更。**Discount 0件 / 商品価格・タグ・status・publication・
> MAIN テーマ すべて据え置き。**Owner が GO と言うまで何も実行しない。**

| ファイル | 中身 |
|---|---|
| `_shopify_gids_20260826.json` | 商品名 → Product GID(Admin 実査・36商品) |
| `_discount_config_20260826.json` | Function に渡す設定 JSON |
| `_discount_create_variables_20260826.json` | `discountAutomaticAppCreate` の variables |
| `_multibuy_assignment_20260826.csv` | `custom.multi_buy_eligible = true` の設定予定一覧(13商品) |
| `_multibuy_set_variables_20260826.json` | `metafieldsSet` の variables |

生成: `python3 ops/tools/promotion_config.py`(Shopify を1件も変更しない)

---

## 0. 前提 — deploy 済みのもの

| 項目 | 値 |
|---|---|
| App | **MORU Promotions** `7e71fcf4cf775c9c2568b1783bed5cfc` |
| released version | **`moru-promotions-6`** |
| Function handle | **`moru-promotions-discount`** |
| Extension UID | `ed96ca74-83c1-80c0-6013-247f4b793a0fcc7642d055774ef8` |
| ターゲット | `cart.lines.discounts.generate.run` / `cart.delivery-options.discounts.generate.run` |
| テスト | **44 passed / 0 failed** |

---

## 🔴 実行前に解決が要る1点 — Admin API アクセストークン

Function の設定 JSON は **アプリ予約名前空間 `$app`** の metafield に入る
(`shopify.app.toml` の `[discount.metafields.app.function-configuration]` で定義)。

**`$app` は MORU Promotions 専用の名前空間なので、他のアプリからは書き込めない。**
Claude が使っている MCP は別アプリ(`Shopify Claude Connector App`)なので、
**この Discount 作成 mutation を Claude 側から実行できない。**

実行できるのは次のいずれか:

1. **MORU Promotions アプリ自身の Admin API アクセストークン**を用意して mutation を叩く
2. Shopify 管理画面から作成する
   → ただし**設定 JSON を入れる UI が無い**(admin UI extension を作っていない)。
     設定が空 = fail-closed なので**割引は1円も出ない。**この経路は今のままでは使えない

**→ 1 が必要。**`shopify app deploy` で使った Automation Token は Dev Dashboard 用で、
**ストアの Admin API トークンではない。**別途取得が要る。

> `metafieldsSet`(まとめ買いの13商品)は **`custom` 名前空間 = マーチャント所有**なので、
> **こちらは今の権限で実行できる。**制約がかかるのは Discount 作成だけ。

---

## 1. まとめ買い対象 13商品に `custom.multi_buy_eligible = true`

**正本はこの Product metafield ひとつ**(D-134)。Frontend の PDP UI も同じ値を見る。
設定 JSON には対象商品リストを持たせていない。

```graphql
mutation SetMultiBuyEligible($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields { id namespace key value type owner { ... on Product { id title } } }
    userErrors { field message code }
  }
}
```

variables: `_multibuy_set_variables_20260826.json`

- 定義は既存: `gid://shopify/MetafieldDefinition/258121728240`(boolean・ALL_VALID)
- **DRAFT 4商品(ルナ / セル モジュール / プラッシュ / アブストラクト)と
  保留のソラには設定しない。**
- 現在の設定件数は **0件**(全36商品で `null` を実査確認済み)

## 2. 商品価格の一括反映

`ops/products/_new_price_map_20260825.csv` が Source of Truth。
**31商品 / 211 Variant。**変更内容は `_price_plan_variants_20260825.csv` の
`現価格` → `新通常価格` 列。

## 3. Discount を1件作成(**Owner Gate**)

```graphql
mutation CreateMoruPromotions($discount: DiscountAutomaticAppInput!) {
  discountAutomaticAppCreate(automaticAppDiscount: $discount) {
    automaticAppDiscount {
      discountId title status startsAt endsAt discountClasses
      appDiscountType { functionId title }
    }
    userErrors { field message code }
  }
}
```

variables: `_discount_create_variables_20260826.json`

- `discountClasses: ["PRODUCT", "SHIPPING"]` — **両方必要。**
  PRODUCT が無いと商品割引が、SHIPPING が無いと送料無料が動かない(fail-closed)
- `combinesWith` は **3つとも false**。Owner 方針の「加算禁止」を Shopify 側でも二重に担保する
- `startsAt` は `null`(= 即時)。日時を指定するなら Owner が決める
- **両 mutation とも `validate_graphql_codeblocks` で検証済み**(必要スコープ
  `write_discounts` / `read_discounts` はアプリに付与済み)

---

## 4. DEV テストケース一覧(Discount 作成後・本番前に必ず通す)

`shopify theme dev` ではなく **実際のチェックアウトまで**通す。単体テストは
すべてモック入力なので、**実データでの確認はここでしかできない。**

### A. 送料無料(Owner 指定の5項目)

| # | カート | 割引前 | 割引後 | 期待 |
|---|---|---|---|---|
| A-1 | フェイクファー 150×200 × 2点 | ¥7,960 | ¥7,164 | **送料無料が維持される** 🔴最重要 |
| A-2 | 手編みコースター ¥2,980帯 × 3点 | ¥8,940 | ¥7,599 | **送料無料が維持される** |
| A-3 | ジオメトリック 本体のみ × 1点 | ¥7,980 | ¥7,182 | **送料無料が維持される** |
| A-4 | ミニ アラームクロック × 1点 | ¥4,480 | ¥4,480 | **送料無料が付かない**(¥7,700 未満) |
| A-5 | ボア ラウンジチェア × 1点 | ¥14,980 | ¥13,482 | 従来どおり無料 |
| A-6 | ミニ × 1点 のみ(割引なし) | ¥4,480 | — | **送料が正しく発生する** |

> ⚠️ **A-1 が本命。**配送ターゲットが読む `line.cost.amountPerQuantity` が
> 商品割引の**前か後か**はドキュメントから断定できなかった。**ここで実測する。**
> 後だった場合は、割引率が設定 metafield にあるので足し戻して復元できる
> (`ops/_promotion_architecture_20260825.md` §1)。

### B. 割引の優先順位・加算禁止

| # | カート | 期待 |
|---|---|---|
| B-1 | クラウド × 1 + マッシュルーム × 1 | **両方 15%OFF**・合計 ¥18,666・送料無料 |
| B-2 | クラウド × 1 のみ | **10%OFF**(Sale)¥10,782。PAIR は成立しない |
| B-3 | クラウド × 3 + マッシュルーム × 1 | クラウドは **1個だけ 15%**、残り2個は割引なし |
| B-4 | フェイクファー × 2点 | **10%OFF**(まとめ買い2点) |
| B-5 | フェイクファー × 3点 | **15%OFF**・全数量 |
| B-6 | フェイクファー 100×150 × 2 + 150×200 × 1 | **合算 3点 → 15%OFF**(Variant をまたぐ) |
| B-7 | フェイクファー × 1 + フランネル × 1 | **どちらも割引なし**(別 Product は合算しない) |
| B-8 | 任意の1商品 | **割引が2つ表示されていない**(加算されていない) |

### C. Summer Sale の除外

| # | カート | 期待 |
|---|---|---|
| C-1 | ハル **1脚** × 1 | **10%OFF** ¥18,882 |
| C-2 | ハル **2脚セット** × 1 | **割引なし** ¥33,980 🔴 |
| C-3 | ハル 1脚 × 1 + 2脚セット × 1 | 1脚だけ 10%OFF |

### D. 除外商品

| # | カート | 期待 |
|---|---|---|
| D-1 | ソラ キャットハンモック × 3 | **割引なし**(保留・metafield 未設定) |
| D-2 | セル サイドボード × 2 | **10%OFF のみ**(Sale 対象・まとめ買い対象外) |

### E. fail-closed

| # | 操作 | 期待 |
|---|---|---|
| E-1 | Discount を一時停止する | **割引が全部消える。**送料は標準条件に戻る |
| E-2 | 設定 metafield を空の `{}` にする | **割引が出ない。送料無料も付かない** |

---

## 5. 実行順序

```
0. Admin API アクセストークンを用意する        ← 🔴 これが無いと 3 が実行できない
1. metafieldsSet(13商品)                      ← 今の権限で実行できる
2. 商品価格の一括反映(31商品 / 211 Variant)
3. Discount を1件作成(Owner Gate)
4. DEV テスト A〜E を通す                       ← 本番有効化の前提条件
5. 旧 multi-buy-discount / pair-set-discount 拡張を削除して再 deploy
```

**5 は 4 が通ってから。**旧2本の Discount は作っていないので、
削除しても顧客に見えている割引は変わらない。

---

## 6. 追補(2026-08-26)— 認証ブロッカーの解消と実行済みの変更

### 実行済み(Owner 承認済みの範囲)

| 変更 | 件数 | 結果 |
|---|---|---|
| Product 価格 | **211 Variant / 31商品** | **不一致 0**(257 Variant 全件 readback) |
| `custom.multi_buy_eligible = true` | **13商品** | **設定漏れ 0 / 誤設定 0** |

readback: `_price_readback_20260826.csv`(257行・全件 match)。
`compare_at_price` は**全 Variant で null のまま**(1件も作っていない)。

### 認証ブロッカーの解消(D-138)

**Function が設定を2段階で読むようにした。**

```
1. Discount の $app metafield(function-configuration)   ← アプリ自身のトークンが要る
2. 無ければ shop の custom.moru_promotions_config       ← マーチャント所有。誰でも書ける
3. どちらも無ければ何もしない(fail-closed)
```

**これで Admin API トークンが無くても運用できる:**

- 設定 JSON は **shop の `custom` metafield** に入れる(`metafieldsSet` で書ける)
- Discount 本体は **Shopify 管理画面から作成する**
  (割引 → 自動割引を作成 → アプリ `MORU Promotions` の `moru-promotions-discount` を選ぶ)
- **トークンがあるなら従来どおり `discountAutomaticAppCreate` + `$app` metafield でもよい。**
  その場合は `$app` が優先される

variables: `_shop_config_set_variables_20260826.json`
(`ownerId` は `__SHOP_GID__` のまま。実行時に実際の Shop GID へ差し替える)

> ⚠️ **shop metafield を書いても、Discount が無ければ割引は1円も出ない。**
> 設定だけ先に入れても顧客には影響しない。

### DEV テストの前提が1つ増えた

Discount を管理画面から作る場合、**`discountClasses` に PRODUCT と SHIPPING の
両方が付くかを作成後に確認する。**片方だけだとその機能が丸ごと動かない(fail-closed)。

---

## 7. 追補(2026-08-26 その2)— Discount 作成が Claude 側からはできない

### `shopify app execute` は使えなかった

```
shopify app execute --store=rgy5ee-fv.myshopify.com -q 'query { shop { id } }'
→ GraphQL Error (Code: 401) FetchStoreByDomain
```

**原因は権限。**公式ドキュメント(Manage App Automation Tokens)に
「App Automation Token は **`deploy` コマンド**でアプリ設定と拡張をプログラム的に
デプロイするために使う」と明記されている。**ストアスコープの Admin API アクセスは含まれない。**
`app execute` はまず組織 API でストアを解決しようとするので、そこで 401 になる。

対話式の `shopify auth login`(ブラウザ)が必要で、このサンドボックスでは実行できない。

### `discountAutomaticAppCreate` も Claude 側からは通らない — 実測で確定

```
functionHandle: "moru-promotions-discount"
→ userErrors: "Function moru-promotions-discount が見つかりません。
   現在のアプリ (341262598145) でリリースされており、
   そのアプリがインストールされていることを確認してください。"
```

**`functionHandle` は「呼び出しているアプリ」の Function の中から解決される。**
Claude が使っている MCP は別アプリ(`Shopify Claude Connector App` / 341262598145)なので、
MORU Promotions の Function は見えない。**推測ではなく実際に叩いて確認した。**

> なお `startsAt: null` は受け付けられない(「開始日時は空にできません」)。
> **作成時に必ず開始日時を入れる。**

### → 採用した経路: **shop metafield + 管理画面から作成**

**設定 JSON は書き込み済み。**

| 項目 | 値 |
|---|---|
| Metafield GID | `gid://shopify/Metafield/62541611335920` |
| owner | `gid://shopify/Shop/85743927536`(MORU LIVING) |
| namespace / key | `custom` / `moru_promotions_config` |
| type | `json` |
| 読み出し確認 | **`jsonValue` として正しくパースされることを確認済み** |

> ⚠️ **`custom` はマーチャント所有の名前空間で、`$app` より分離性が弱い。**
> このストアにインストールされた他のアプリからも読み書きできる。
> 秘密情報ではない(商品 GID と割引率だけ)が、**`$app` と同じ隔離性はない。**
> アプリ自身のトークンが用意できたら `$app` へ移し、shop 側は消してよい
> (Function は `$app` を優先して読む)。

### Owner にやってもらう1手順 — 管理画面から Discount を作成

1. Shopify 管理画面 → **割引** → **割引を作成** → **自動割引**
2. アプリ **MORU Promotions** の **`MORU 販促割引(統合)`** を選ぶ
3. **割引の種類で「商品割引」と「配送割引」の両方にチェックを入れる**
   🔴 **片方だけだとその機能が丸ごと動かない(fail-closed)**
4. **組み合わせ設定は3つとも OFF**(商品割引・注文割引・配送割引のいずれとも組み合わせない)
5. 開始日時を入れて保存する

**設定 JSON は shop metafield から自動で読まれる。**管理画面で JSON を入力する欄は無い
(admin UI extension を作っていないため)。**作成した瞬間から有効になる。**

### 作成後の readback(Claude 側で実行できる)

```graphql
query VerifyDiscount {
  automaticDiscountNodes(first: 10) {
    nodes {
      id
      automaticDiscount {
        ... on DiscountAutomaticApp {
          title status startsAt endsAt discountClasses
          combinesWith { productDiscounts orderDiscounts shippingDiscounts }
          appDiscountType { functionId title appKey }
        }
      }
    }
  }
}
```

確認する項目:

- Discount が **1件だけ**であること
- `appDiscountType.functionId` が **`moru-promotions-discount`** の Function であること
- `discountClasses` に **PRODUCT と SHIPPING の両方**が入っていること
- `combinesWith` が **3つとも false** であること
- `status` が `ACTIVE` であること

### 21 の DEV テストはまだ実行していない

**Discount が無いと1件も実行できない。**割引が存在しない状態でカートを作っても、
Function は呼ばれない(= テストにならない)。**Discount 作成後にまとめて実施する。**

**A-1(フェイクファー2点 ¥7,960 → ¥7,164 で送料無料が維持されるか)が最優先。**
ここで `line.cost.amountPerQuantity` が商品割引の前か後かが実測で分かる。
