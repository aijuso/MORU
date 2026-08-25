# Theme Promotion: MORU Frontend Dev → MAIN(2026-08-25)

> **Phase 1(READ ONLY)と Phase 2(manifest)まで。MAIN には1バイトも書いていない。**
> Owner が「**MAIN反映実行**」と明示するまで書かない。theme publish は行わない(不要)。

| テーマ | theme ID | role | ファイル数 |
|---|---|---|---|
| **MORU Frontend Dev**(コピー元) | `gid://shopify/OnlineStoreTheme/166341181680` | UNPUBLISHED | 84 |
| **MORU LIVING (Skeleton構築)**(コピー先) | `gid://shopify/OnlineStoreTheme/166203621616` | **MAIN** | 78 |

**取得方法:** Admin API の `theme(id:){ files { filename checksumMd5 size } }`(読み取り専用)。
Shopify CLI の `theme pull` は使っていない(この実行環境にテーマ用の認証が無いため)。
checksum は Shopify が保持している MD5 をそのまま使っている。

---

## Phase 1: 差分一覧

**同一 59 / 変更 18 / DEV のみ 7 / MAIN のみ 1**

### 1-A. DEV にしか無いファイル(7)— 新規追加。MAIN の既存物を壊さない

| path | Dev checksum | MAIN | 区分 | MAIN への影響 | shared resource | 安全にコピー可能か |
|---|---|---|---|---|---|---|
| `sections/moru-header-v2.liquid` | `4061eec3…` | 無し | **new** | ヘッダーの新実装。`header-group.json` が参照する | いいえ | ✅ **安全**(新規ファイル) |
| `sections/moru-cart-drawer-v2.liquid` | `bf73d206…` | 無し | **new** | カートドロワーの新実装 | いいえ | ✅ **安全** |
| `sections/moru-quantity-offers.liquid` | `787ab4b4…` | 無し | **new** | PDP の数量割引 UI(27.6KB) | いいえ | ✅ **安全**(ただし §注意 F-1/F-2) |
| `sections/moru-product-promotions.liquid` | `e9a27736…` | 無し | **new** | PDP の販促表示 | いいえ | ✅ **安全** |
| `sections/moru-promo-hub.liquid` | `608bc60b…` | 無し | **new** | ホームの SEASONAL SALE / PAIR IT YOUR WAY | いいえ | ✅ **安全** |
| `sections/moru-promo-landing.liquid` | `b5fe3794…` | 無し | **new** | コレクションページの販促枠 | いいえ | ✅ **安全** |
| `sections/moru-cart-discount-summary.liquid` | `35ef65cc…` | 無し | **new** | カートの実 Discount 内訳表示 | いいえ | ✅ **安全** |

### 1-B. 両方にあって内容が違うファイル(18)

| path | Dev checksum | MAIN checksum | サイズ Dev→MAIN | 区分 | MAIN への影響 | shared | 安全にコピー可能か |
|---|---|---|---|---|---|---|---|
| `templates/product.json` | `8655deb8…` | `a2aaea49…` | 4,962→5,615 | modified | **¥15,000→¥7,700 / 偽5%割引→0 / quantity_offers・promotions 追加** | テンプレート | ✅ **安全**(DEV が上位互換。MAIN 側の内容は全て含まれている) |
| `templates/cart.json` | `1ee4b091…` | `a1f5eeea…` | 1,708→2,134 | modified | `moru-cart-discount-summary` を追加 | テンプレート | ✅ **安全**(DEV は MAIN の完全な上位集合。サイズ差は**整形の違い**) |
| `templates/collection.json` | `ad364592…` | `534c6dc6…` | 1,039→1,245 | modified | `moru-promo-landing` を追加 | テンプレート | ✅ **安全**(同上) |
| `templates/index.json` | `87cd66b2…` | `5176d4b3…` | 7,591→7,495 | modified | **税込7,700円に修正 / `promo_hub` 追加 / community_journal・weekly_picks を disabled** | テンプレート | ✅ **安全** |
| `sections/header-group.json` | `113f445e…` | `0bc916da…` | 1,252→1,802 | modified | **¥7,700 に修正 / header を v2 に / cart_drawer を v2 に** | **セクショングループ** | ⚠️ **条件つき。**`moru-header-v2` と `moru-cart-drawer-v2` を**先に**入れないと MAIN が壊れる |
| `sections/footer-group.json` | `3ed97184…` | `2e367f1c…` | 838→1,664 | modified | **内容は同一。整形だけが違う** | セクショングループ | 🚫 **コピー不要。**中身が同じなので触らない |
| `sections/moru-hero.liquid` | `fe94c584…` | `7291f63c…` | 16,368→10,536 | modified | DEV が 5.8KB 大きい(機能追加) | いいえ | ⚠️ **要確認。**MAIN 側に無い変更が何かを Owner に見てもらう |
| `sections/moru-category-browser.liquid` | `e6504b91…` | `a8ab2092…` | 11,482→7,455 | modified | DEV が 4.0KB 大きい | いいえ | ⚠️ **要確認** |
| `sections/moru-shop-the-room.liquid` | `ba1e7845…` | `bd39ffc4…` | 8,518→8,117 | modified | DEV が 0.4KB 大きい | いいえ | ⚠️ **要確認** |
| `sections/moru-product-details.liquid` | `b19a7298…` | `2a7b9cbb…` | 3,278→**13,858** | modified | 🔴 **DEV は MAIN の 1/4。**レビュー UI・レビュー集計・`@app` ブロック対応が**削除されている** | いいえ | 🔴 **危険。**§Phase2 の注意を読むこと |
| `sections/moru-product-grid.liquid` | `ac002d77…` | `af335569…` | 4,882→6,412 | modified | 🔴 **DEV が 1.5KB 小さい。**MAIN にある設定が消えている可能性 | PDP・ホームの両方で使う | 🔴 **危険。要確認** |
| `snippets/moru-product-card.liquid` | `9b759b1f…` | `e68ca23f…` | 10,030→10,226 | modified | DEV が 0.2KB 小さい | **全ページの商品カード** | 🔴 **危険。要確認**(影響範囲が最大) |
| `sections/moru-header.liquid` | `f59e85a7…` | `bff14ae1…` | 12,239→**17,768** | modified | 🔴 **DEV が 5.5KB 小さい。**DEV は v1 を使わなくなったので v1 が古いまま残っている | いいえ | 🚫 **コピーしない。**MAIN の v1 を退化させるだけで、DEV は v2 を使っている |
| `config/settings_data.json` | `1e0dc3ca…` | `9ee35270…` | 476→193 | modified | テーマ設定の実データ | **shared settings** | 🚫 **無条件上書き禁止**(Owner 指示)。Phase 2 の allowlist から除外 |
| `locales/ja.default.json` | `15af4de6…` | `54d9414e…` | 10,717→11,185 | modified | 🔴 **MAIN のほうが 468B 多い** | **shared** | 🔴 **上書き禁止。マージが要る** |
| `locales/ja.default.schema.json` | `0674ede5…` | `20d555e0…` | 32,096→32,715 | modified | 🔴 **MAIN のほうが 619B 多い** | **shared** | 🔴 **上書き禁止。マージが要る** |
| `locales/en.json` | `7548ff31…` | `bfab1c68…` | 8,594→9,040 | modified | 🔴 **MAIN のほうが 446B 多い** | **shared** | 🔴 **上書き禁止。マージが要る** |
| `locales/en.schema.json` | `bd1f0935…` | `7f96cefe…` | 26,496→27,065 | modified | 🔴 **MAIN のほうが 569B 多い** | **shared** | 🔴 **上書き禁止。マージが要る** |

### 1-C. MAIN にしか無いファイル(1)

| path | MAIN checksum | 扱い |
|---|---|---|
| `templates/collection.new-arrivals.json` | `e2b7741c…` | 🚫 **削除しない。触らない。**DEV に無いのは「消された」のではなく「作られていない」だけ |

---

## Phase 1 の結論 — **単純な上書きはできない**

当初は「DEV = MAIN + ChatGPT の変更」だと考えたが、**実査でそうではないことが分かった。**

1. **JSON テンプレート(`product.json` / `cart.json` / `collection.json` / `index.json`)は
   DEV が完全な上位集合。**内容を1行ずつ突き合わせて確認した。サイズが小さく見えるのは
   **DEV 側が JSON を圧縮して書いている**だけ。**安全にコピーできる**
2. **`.liquid` で DEV のほうが小さいものは、本当に中身が減っている。**
   `moru-product-details.liquid` は MAIN のレビュー UI 一式(星・分布バー・レビューカード・
   `@app` ブロック)が丸ごと無い
3. **`locales` は4ファイルすべて MAIN のほうが大きい。**DEV の locales で上書きすると、
   MAIN のセクションが使っている `t:` キーが消えて**翻訳が壊れる可能性がある**
4. **`moru-header.liquid` は MAIN のほうが新しい。**DEV は v2 に乗り換えたので v1 を更新していない。
   **コピーすると MAIN を退化させるだけ**

---

## Phase 2: Promotion manifest(MAIN へコピーする明示的 allowlist)

**テーマ全体 push は禁止。削除は禁止。MAIN にしか無いファイルは上書きも削除もしない。**

### Tier 1 — そのままコピーしてよい(11ファイル)

**順序が重要。**上から順に入れる。

| 順 | path | 種別 | 理由 |
|---|---|---|---|
| 1 | `sections/moru-header-v2.liquid` | new | `header-group.json` の依存先。**先に入れる** |
| 2 | `sections/moru-cart-drawer-v2.liquid` | new | 同上 |
| 3 | `sections/moru-quantity-offers.liquid` | new | `product.json` の依存先 |
| 4 | `sections/moru-product-promotions.liquid` | new | 同上 |
| 5 | `sections/moru-promo-hub.liquid` | new | `index.json` の依存先 |
| 6 | `sections/moru-promo-landing.liquid` | new | `collection.json` の依存先 |
| 7 | `sections/moru-cart-discount-summary.liquid` | new | `cart.json` の依存先 |
| 8 | `templates/product.json` | modified | **¥7,700 修正 + 偽5%割引の解消。**MAIN の内容は全て含む |
| 9 | `templates/cart.json` | modified | MAIN の完全な上位集合 |
| 10 | `templates/collection.json` | modified | 同上 |
| 11 | `templates/index.json` | modified | **税込7,700円 修正 + 空セクションの disabled** |

### Tier 2 — 依存を満たしてからコピーする(1ファイル)

| path | 条件 |
|---|---|
| `sections/header-group.json` | **Tier 1 の 1・2 が入った後でのみ。**先に入れると MAIN が存在しないセクションを参照して壊れる。**¥7,700 修正はここに入っている** |

### Tier 3 — Owner が中身を見て決めるもの(5ファイル)

**allowlist に入れていない。**自動ではコピーしない。

| path | 判断してほしいこと |
|---|---|
| `sections/moru-product-details.liquid` | **レビュー UI を消してよいか。**偽レビュー(プレースホルダー3枚)が消えるのは**良いこと**だが、`@app` ブロック対応も一緒に消える。将来レビューアプリを入れる予定があるなら DEV 版は使えない。**加えて DEV 版は schema の `name` が日本語直書きで、CLAUDE.md 絶対ルール12に反する** |
| `sections/moru-product-grid.liquid` | DEV が 1.5KB 小さい。MAIN にある設定が消えていないか確認が要る。**PDP とホームの両方で使う** |
| `snippets/moru-product-card.liquid` | DEV が 0.2KB 小さい。**全ページの商品カード。影響範囲が最大** |
| `sections/moru-hero.liquid` | DEV が 5.8KB 大きい(追加のはず)。何が増えたかを見てから |
| `sections/moru-category-browser.liquid` | DEV が 4.0KB 大きい(追加のはず)。同上 |
| `sections/moru-shop-the-room.liquid` | DEV が 0.4KB 大きい。同上 |

### 除外 — コピーしない(7ファイル)

| path | 理由 |
|---|---|
| `config/settings_data.json` | **shared settings。無条件上書き禁止**(Owner 指示) |
| `locales/ja.default.json` | **MAIN のほうが大きい。上書きするとキーが消える。マージが要る** |
| `locales/ja.default.schema.json` | 同上 |
| `locales/en.json` | 同上 |
| `locales/en.schema.json` | 同上 |
| `sections/footer-group.json` | 中身が同一。整形差だけ |
| `sections/moru-header.liquid` | **MAIN のほうが新しい。**コピーすると退化する |

### 削除しない

`templates/collection.new-arrivals.json`(MAIN のみ)を含め、**MAIN のファイルを1つも削除しない。**
fonts / third-party app blocks / app embeds は DEV・MAIN のどちらにも存在しない
(ファイル一覧に該当なし)ので、今回は該当しない。

---

## Phase 3: 停止

**MAIN への書き込みは行っていない。**

反映する場合の手順(Owner が「MAIN反映実行」と言った後):

1. Tier 1 を**上の順序で** `themeFilesUpsert` する
2. Tier 2(`header-group.json`)を入れる
3. **プレビューで確認する**(ヘッダー・カートドロワー・PDP・ホーム・コレクション)
4. Tier 3 は Owner の個別判断が出たものだけ
5. locales は**マージ**して別途反映する(上書きしない)

> ⚠️ **Shopify MCP の `graphql_mutation` は MAIN(live)テーマへの書き込みをブロックする。**
> 反映は Shopify CLI(`shopify theme push --theme 166203621616 --only <path>`)で行う必要があり、
> **テーマ用の認証(`SHOPIFY_CLI_THEME_TOKEN` 等)がこの実行環境にはまだ無い。**
> Owner 承認が出た時点で、認証手段を用意していただく必要がある。

---

## 反映後も残る Frontend の問題

**このプロモーションを実行しても、`ops/_launch_blockers_20260825.md` §B-1 の
F-1・F-2・F-5・F-7・F-8・F-9・F-10・F-11 は解決しない。**
DEV 側にも同じ問題が残っているため。**ChatGPT 側の修正が別途必要。**

特に:

- `templates/cart.json` の**偽レビューブロックは DEV にも残っている**(F-5)
- `moru-quantity-offers` の `offer_scope: "all"` は**対象外商品にも割引表示を出す**(F-1)
- `locales` の ¥15,000 既定値4箇所は**DEV でも未修正**(C-1)
