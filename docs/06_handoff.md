# 06. 引き継ぎメモ(セッション間の申し送り)

> 最終更新: **2026-08-29**(初注文 #1001 / Meta広告 初日CPA¥3,626 / 説明文→特徴の統合完了 D-163 /
> ヒーローの枠比率・X/Y位置・フェード強度・CTA形式をエディタ設定化 D-164 / 現行価格の監査完了 D-165 /
> **価格改定案(利益額ベース+1年保証)が Owner 承認待ち** `ops/products/_price_proposal_1yr_20260829.md`。
> ⚠️ 承認が出るまで価格・保証文言を変えないこと)
> 作業ブランチ: `claude/moru-living-shopify-dev-yvnmni` — **新しいブランチを作らない(Owner 指示)**
> 📄 **2026-08-31: オーナーコンサル資料(Shopify Dropshipping Playbook)を受領・読解済み。**
> 原本と MORU 現状との対照・オーナー確認事項3件は `docs/consulting/playbook_digest_20260831.md`
> 🔌 **Winning Hunter 導入決定(Owner 指示)。** `.mcp.json` 設定済み・**残りは Owner の
> `WH_API_KEY` 環境変数登録のみ**(`ops/research/winning_hunter_setup.md`)。
> ブランド非依存のリサーチ標準を `.claude/skills/winning-hunter-research/` に新設
> 対象ストア: `rgy5ee-fv.myshopify.com` / 独自ドメイン **`moruliving.com`**(SSL 有効)

---

# ★★ 2026-08-27 — 新しいセッションはここだけ読めば再開できる ★★

## 1. いまの状態(3行)

- **フロントは本番公開済み。** `MORU Release 2026-08-27` が MAIN
- **パスワード保護は解除済み**(2026-08-27 実測)。**正規ドメインは `moruliving.com`。
  旧 `*.myshopify.com` は 301 で飛ぶ**
- 販促(Sale / まとめ買い / PAIR / 送料無料 / ¥500クーポン)は**バックエンド側は完成・稼働中**
- ✅ **商品ページのセール価格は本番に反映ずみ**(2026-08-27。CLI 経路の初運用)。
  ACTIVE 28商品を実測して **セール表示 17 / 非セール 11 / 不一致 0**。
  記録は `ops/theme/_live_deploy_20260827_sale_price.md`
- ✅ **repo は本番テーマと一致した**(`shopify theme pull -e live` 実行ずみ)。
  「相違24 / repo に無い11」は**解消**。`_repo_vs_dev_20260827.md` は履歴として残す

### ⚠️ ストアフロントを叩くときの URL

**`https://moruliving.com` を使う。** `moruliving.myshopify.com` /
`rgy5ee-fv.myshopify.com` はどちらも **301**。
`run.mjs` は `redirect: 'manual'` なので、旧ドメインを渡すと
「パスワード保護がまだ有効」と**誤検知して止まる**(2026-08-27 に実際に踏んだ)。

## 2. テーマ(⚠️ 2026-08-26 に入れ替わった。古い表を信じない)

| テーマ | theme id | role | 扱い |
|---|---|---|---|
| **MORU Release 2026-08-27** | **`166459769072`** | **MAIN(公開中)** | 🚫 直接書き込み・publish しない |
| MORU LIVING (Skeleton構築) | `166203621616` | UNPUBLISHED | **切り戻し先**として温存 |
| **MORU Frontend Dev** | **`166341181680`** | UNPUBLISHED | ✅ **フロントの正本。変更はここに入れる** |
| Horizon | `166127468784` | UNPUBLISHED | 旧プロジェクト。触らない |

**フロントは ChatGPT が Frontend Dev で実装、MAIN 反映は Owner が実施する。**
Claude が Frontend Dev を直す場合は**Owner の明示指示があるときだけ**(2026-08-26 のクーポン UX がその例)。

## 3. 🔧 テーマ反映方法(⚠️ 2026-08-27 に方針変更)

### 正式な手順は `ops/theme/README.md`

**Shopify CLI + Theme Access トークンを正式な反映手段にした(D-151)。**
セットアップは Owner が一度だけ行う(Theme Access パスワード発行 → 環境変数3つ)。
`.claude/settings.json` と `shopify.theme.toml` は用意済み。

```
shopify theme check
shopify theme push -e live --only <ファイル> --nodelete
```

**🔴 セットアップが済むまでは、本番反映は「管理画面で人が publish」しかできない。**

### なぜ CLI にしたか — MCP からは本番テーマを直せない(実測)

| 経路 | 結果 |
|---|---|
| MCP `themeFilesUpsert` を公開テーマ宛て | **拒否**(`category: live_theme`) |
| MCP `themePublish` | **拒否**(`category: destructive`) |
| Shopify CLI | ハーネスの権限分類器が拒否 → **`.claude/settings.json` の allow で解除できる** |

前2つは Shopify MCP サーバー側の設計で解除できない。
これがないと「未公開テーマを直す → 公開 → そのテーマが MAIN になり書けなくなる →
次はもう片方を同期してから直す」という ping-pong を毎回やることになる。

### 🔴 repo は本番テーマの正本ではない

2026-08-27 実測で **相違24ファイル / repo に無いファイル11件**
(`ops/theme/_repo_vs_dev_20260827.md`)。
**`--only` なしで `-e live` に push すると本番からファイルが消える。**
セットアップ後の**最初の作業は `shopify theme pull -e live`**。

### CLI が使えないときの代替(Admin API)

代わりに **Admin API** を使う:

1. Dev の現物を `theme(id:).files(filenames:).body` で取得
2. **ローカルに復元したら、md5 が Shopify の `checksumMd5` と一致するか必ず確認**してからパッチを当てる
   (一致しなければ復元ミス。そこで止める)
3. 反映は `stagedUploadsCreate`(`resource: FILE`)で実ファイルを上げ、
   `themeFilesUpsert` に **`body: { type: URL }`** で取り込ませる
   → **本文を手で書き写さないので転記ミスが起こり得ない**
4. 反映後に `checksumMd5` で readback

⚠️ `publishableUnpublish` は MCP の安全ポリシーで**拒否される**。
商品を落とすときは `productUpdate { status: DRAFT }` を使う(可逆・データ保持)。

⚠️ **Chromium はこのサンドボックスのプロキシを通れない**(`ERR_CONNECTION_RESET`)。
ストアフロントを見るときは素の `fetch` / `curl` を使う。

⚠️ **`shopify-dev-mcp` は接続失敗中。** `validate_theme_codeblocks` が無いので、
docs/07 §6 に従い **`shopify theme check`** で代替する。

## 4. 販促の構成(稼働中)

**Discount は 2件。**

| # | ID | 種別 | 内容 |
|---|---|---|---|
| 1 | `DiscountAutomaticNode/1484384305392` | Automatic (App) | MORU 販促割引(統合) / PRODUCT+ORDER+SHIPPING / ACTIVE |
| 2 | `DiscountCodeNode/1484417040624` | Code | 新規会員登録 ¥500OFF / **`MORU500`** / ORDER / ACTIVE |

**両方 `combinesWith` 全 false = 加算しない。** 競合したら Shopify が顧客に得な方を選ぶ
(実測で確認済み。送料無料が消える事故は起きない)。

- **Function の設定の正本は shop metafield `custom.moru_promotions_config`**
  (アプリ: `apps/moru-promotions` / 現在 `moru-promotions-12` / extension は
  `moru-promotions-discount` と `-ui` の2つだけ。旧2件は削除済み)
- まとめ買い対象の正本は **Product metafield `custom.multi_buy_eligible`**
- MORU500 の対象は **Segment `578826076400`(`number_of_orders = 0`)**
  ⚠️ 新しい顧客アカウントでは `Customer.state` が ENABLED にならない。
  `customer_account_status` を条件に入れると**誰にもマッチしない**
- `sale` collection(`489369338096`)は **`TAG EQUALS 'sale'` のスマートコレクション**。
  18商品タグ済みで config と差分 0

## 5. ストア設定(確定済み)

| | |
|---|---|
| 配送 | **通常配送 ¥870 のみ** / 割引前小計 **¥7,700 以上で無料**(Function が判定) |
| 速達 ¥3,762 | **削除済み** |
| 国際配送 | `Standard ¥3,000` → `active: false` / `shipsToCountries: ["JP"]` |
| 商品 | **ACTIVE 28 / DRAFT 8** |
| built-in policies | **6種すべて登録済み**(Owner 側で同期。本文と Page の一致は未検証) |

**DRAFT 8商品**: プラッシュ クッション / アブストラクト オブジェ / セル モジュールキャビネット /
ルナ ウォールライト / ピボ テーブルランプ / ソラ キャットハンモック /
手編みコースター / レジン スカルプチャーオブジェ
→ **すべて `status: ACTIVE` に戻すだけで復帰できる。**

## 6. 🔴 残っているローンチ阻害(**1つだけ**・2026-08-27 実測で更新)

| # | 項目 | 状態 | 誰が |
|---|---|---|---|
| 1 | パスワード保護 | ✅ **解除済み**(`passwordProtection.enabled: false`) | 済 |
| 2 | 通常配送の transit time | ✅ **消えている。** `/cart/shipping_rates.json` が `delivery_days: []` / `delivery_range: null` を返す(¥870 のケース・¥0 のケース両方で確認) | 済 |
| 3 | **MORU500 の顧客への案内** | 🔴 **未解消** | Frontend |

**#3 は「未実装」より悪い。** コード `MORU500` は
`/` `/cart` `/account/register` `/account/login` `/pages/faq` の**どこにも出ていない**のに、

- アナウンスバー(全ページ): 「新規会員登録で**¥500OFFクーポン**プレゼント」
- FAQ: 「新規会員登録後、**対象のお客様のカートに表示される**¥500OFFクーポンをご利用ください」

**FAQ が「カートに表示される」と明言しているのに、その表示ブロックが存在しない。**
顧客向け文面が事実と食い違っている。実装を先送りするなら
**FAQ の文面だけは先に直す**(詳細は `ops/promotions/_new_member_500_design_20260826.md` §24)。

⚠️ 修正先は **`MORU Frontend Dev`(166341181680)**。docs/06 §2 の分業ルールにより、
**Owner の明示指示があるまで Claude は着手しない。**

**実機 QA:**
```
MORU_STORE_URL=https://moruliving.com node ops/promotions/storefront-tests/run.mjs
```
(既定値も `moruliving.com` に直したので env は無くても動く)
### 実行結果(2026-08-27)— **17 PASS / 0 FAIL / SKIP 4**

**Function の挙動が期待と違ったケースはゼロ。** 明細は
`ops/promotions/_new_member_500_design_20260826.md` §24。

裏づけられた挙動: まとめ買い 2点10% / 3点以上15%(4点以上も15%) /
別 Variant は合算・別 Product は合算しない / SUMMER SALE 10% /
ハル2脚セットの Sale 除外 / PAIR 15% と Sale の同時成立 / 送料無料しきい値の境界。

**SKIP 4件 = A-2・E-2(手編みコースター)と A-6・D-1(ソラ)。**
どちらも DRAFT で `cart/add.js` が 422 を返すため。
⚠️ **成立するのは 21ケース中 17ケース。**
これ以前の申し送りの「20ケース」「19ケース」はどちらも誤り
(ソラも DRAFT であることを数え漏らしていた)。ACTIVE に戻せば 21 に戻る。

⚠️ **`/cart/add.js` は IP 単位で 429 を返す。** 連続実行・並行実行をするとバケットが潰れ、
数分回復しない(実際に21ケース中14ケースを潰した)。落ちたケースだけなら
`MORU_CASES=B-1,D-2,E-1 node ops/promotions/storefront-tests/run.mjs` で流し直せる。
判定は **PASS / FAIL / SKIP(DRAFT) / BLOCKED(429)** の4種に分かれる。
**BLOCKED は「未測定」であって合格ではない**(残ると exit 1)。

## 6.5 カラースウォッチ(2026-08-27 に設定・D-149)

**全商品のオプション値に色が1件も入っておらず、本番のスウォッチが色なしの丸だった。**
`custom.swatch_colors`(`moru_color` メタオブジェクトのリスト)経由で設定した。
**テーマは一切触っていない。**

| | |
|---|---|
| 作成した `moru_color` | **107件** |
| 設定した商品 | ACTIVE **23** + DRAFT **2**(ピボ / ルナ) |
| 設定した値 | **134** |
| 本番 PDP での実測 | **127/127 一致**(ACTIVE 分) |

- 対応表と再生成手順: **`ops/products/swatch-colors/`**(`build.mjs` の `COLORS` を直して流し直す)
- 色は**名前から引いた近似値。実測色ではない。** 実物と違うものは Owner が直す前提
- **未設定で残したもの**: バルーンドッグの `マルチカラー`(1色で表せない) /
  プラッシュ クッション・手編みコースター(**Variant 名が機械翻訳のままで色が確定できない。
  名前を直すのが先**)
- オプション名が `色分類` / `タイプ` の商品はテーマがスウォッチ表示にしないので対象外

---

## 7. 未確認・要判断で残っているもの

- **ピボ テーブルランプ**: 説明画像19枚中17枚に中国語。**画像7 に「护眼 / 节能护眼 / 健康护眼」**
  = CLAUDE.md 絶対ルール15 が名指しで禁じる健康表現。**日本語化ではなく削除か差し替えが要る。**
  画像19 は寸法・材質・光源の仕様表が中国語のまま
- **ピボは `sale.productIds` に残っている**(config は変更禁止だったのでそのまま)。外すか要判断
- 手編みコースター / レジン: Variant 名が機械翻訳のまま(「カエルの直径は12cmです」等)
- 30日間安心保証の顧客向け文面と policy 本文の突き合わせ
- `ship_est` 実測3件の CKB 依頼
- 価格の未決9件(`ops/products/_price_audit_20260825.md` §9)

## 7.5 Google Sheets 連携(2026-08-28 に確立・D-155)

**商品リサーチ用シート「MORU 商品リサーチDB」への読み書きが通った。手順書は `ops/research/README.md`(唯一の正)。**

| | |
|---|---|
| シート ID | `1W8LczbaYgB7s6hzhmNfNyjou36Jt0tTF1_VqNwskB4w` |
| 認証 | サービスアカウント `morusheet@shopfiy-506905.iam.gserviceaccount.com` |
| 鍵 | 環境変数 `GOOGLE_SHEETS_KEY_B64`(JSON キーの base64。**登録済み**) |
| タブ | `マスターDB` / `2026-08-28` |

セッションごとに `pip install gspread google-auth && pip install --upgrade cffi`。
**`cffi` の upgrade を省くと `import gspread` が `PanicException` で落ちる。**

### リサーチ・広告制作の資産(2026-08-28 新設・D-156〜D-159)

| 場所 | 中身 |
|---|---|
| `ops/research/` | README(Runbook)/ rubric(評価基準)/ sites(対象サイトDB)/ workflow(実行手順) |
| `ops/ads/benchmarks/` | 競合分析の**結果置き場**(kocol / desk-nest-cat-bed。取得日必須) |
| `ops/ads/creatives/` | 商品ごとの採用プロンプト・コピーの記録 + Beautiful Utility の翻訳型 |
| **`.claude/skills/ad-benchmark-creative/`** | **広告制作の正**(D-160)。8ステップ + AdWhispr の使い方・brandId表 / 借りる捨てる / コピー設計 / 生成の失敗6件 |

**リサーチ前に `ops/research/rubric.md`(ルール16)、広告制作・競合分析前に
`.claude/skills/ad-benchmark-creative/`(ルール17)を読む。**

## 7.8 ✅ 完了: 商品説明を「特徴」へ統合した(2026-08-28・D-163)

**ACTIVE 28商品すべてに適用済み。** `moru_feature` metaobject を52ブロック更新し、
全28商品をストアフロントで実取得して配信を確認した(userErrors 0 / 不一致 0)。

- 判断基準・商品ごとの適用結果・落とした表現は **`ops/products/_description_merge_20260828.md`**
- 決定は **D-163**
- 変更が無かったのはロロ サイドテーブル1件のみ(説明文が既存の特徴に全部入っていた)
- **副産物**: 説明文と特徴の**矛盾3件**(クリアシェードの調光「無段階/3段階」、ツインベルの秒針、
  パイピングの洗濯可否)と**文字化け・誤字を7商品**で修正。クリアシェードは SEO タグも直した
- **落とした表現**: フラワーバッド「ギフトにも選ばれています」(注文0件の店では事実に反する)
- `product.description` は**消していない**(ストア内検索・構造化データが参照するため)

### 🔴 Owner に1件だけ確認したい

デュオ ナイトテーブルのキャッチコピー「木とステンレス、二つの顔。**枝先の家具**だからこそ、選ぶ価値がある。」
の「枝先の家具」の意味が取れない(「脇役の家具」の誤変換か)。**推測で直さず残してある。**

### 残っている同種の作業

- **DRAFT 4商品**は未着手(ACTIVE になるときに同じ手順で実施する)

## 8. 次のフェーズ: Meta(Facebook)広告

Owner が着手予定。**独自ドメイン `moruliving.com` があるのでドメイン認証は可能。**
Facebook & Instagram 販売チャネルは**未導入**(publications は オンラインストア / Shop / POS のみ)。
**パスワード解除が前提 → ✅ 2026-08-27 に解除済みなので着手可能。**
手順は本セッションのチャットに記載。

## 9. 読む順番

1. `CLAUDE.md`(絶対ルール。特に 15 = 未検証の品質・健康表現)
2. **`docs/13_pricing_promotion_framework.md`** — 価格設計の正(docs/10・12 より優先)
3. `docs/06_decisions_log.md` の **D-117〜D-147**
4. **`ops/promotions/_new_member_500_design_20260826.md`** — 本セッションの設計・実測ログ(§18〜§23 が最新)
5. `ops/promotions/README.md` — Function 運用の Runbook

---

## ⚠️ テーマの運用ルール(最初に読む・2026-08-24 実査で確認)

| テーマ | theme id | role | 扱い |
|---|---|---|---|
| **MORU Frontend Dev** | `166341181680` | UNPUBLISHED | ✅ **フロント作業はここに対して行う** |
| MORU LIVING (Skeleton構築) | `166203621616` | **MAIN(公開テーマ)** | 🚫 **write / publish 禁止** |
| Horizon | `166127468784` | UNPUBLISHED | 旧プロジェクト。触らない |
| Development (87442c-vm) | `166203523312` | DEVELOPMENT | CLI が作った一時テーマ |

**🚧 分業: Frontend は ChatGPT 側が並行実装中。Claude Code は theme files を触らない。**

| 担当 | 範囲 |
|---|---|
| ChatGPT | MORU Frontend Dev の theme files(数量アップセルUI / Cart Drawer / Cart Page) |
| **Claude Code** | **Shopify 側のデータ(商品・価格・Discount Function)と docs。theme files は変更しない** |

**禁止事項:**

- **MAIN(`166203621616`)へのテーマ書き込みを行わない。** `--allow-live` を使わない
- **テーマの publish を行わない**(どのテーマからも)
- **Frontend Dev(`166341181680`)の theme files も Claude Code からは変更しない。**
  ChatGPT 側の実装と競合させない。直したい点があれば**指摘としてまとめて渡す**
- 本書の過去セクションには `--theme 166203621616 --allow-live` で push した記録が残っているが、
  **それは 2026-08-23 時点の運用。現在は無効。踏襲しない**

**作業手順:** commit → `git push` → **`shopify theme push --store=rgy5ee-fv.myshopify.com --theme 166341181680`**。
push 前に毎回 `themes(first: 20) { nodes { id name role } }` で role を確認すること
(id は入れ替わりうる。**名前ではなく role を見て MAIN を避ける**)。

---

## ★ 2026-08-25 現在 — ここを最初に読む

| | |
|---|---|
| 作業ブランチ | `claude/moru-living-shopify-dev-yvnmni` |
| ストア | `rgy5ee-fv.myshopify.com`(表示ドメイン `moruliving.myshopify.com`) |
| Frontend Dev テーマ | `166341181680` / UNPUBLISHED / **ChatGPT が実装中。Claude Code は触らない** |
| MAIN テーマ | `166203621616` / **MAIN。書き込み・publish 禁止** |
| 販促アプリ | **MORU Promotions**(`7e71fcf4cf775c9c2568b1783bed5cfc`)/ app version **`moru-promotions-4`** が active |
| Function | **2本 deploy 済み**(まとめ買い / ペア・セット) |
| **Discount resource** | **0件。1つも作っていない。有効化もしていない** |
| **注文** | **0件**(`ordersCount` = 0・EXACT) |
| **在庫** | ✅ **全商品が購入可能**(257 Variant 中 255 が「在庫を追跡しない」設定・D-107)。<br>前回の「35商品が在庫0」は `totalInventory` の誤読だった |
| 送料無料 | **¥7,700 が正式値(D-101)。**ストア設定は元から ¥7,700 なので変更していない |

### deploy 済みの Function

| Extension | handle | uid | 対象判定 |
|---|---|---|---|
| まとめ買い割引 | `moru-multi-buy-discount` | `a475e5e4-1bfc-6e0c-1036-c65f32d3a9cca5956889` | Product metafield `custom.multi_buy_eligible`(**定義は作成済み・商品への設定は0件**) |
| ペア・セット割引 | `moru-pair-set-discount` | `54593006-b244-854c-5c79-1dca16afacb8f0c73de2` | Discount の app metafield の JSON(**設定は空**) |

**どちらも fail-closed。**設定を1件も入れないまま有効化しても割引は1円も出ない。

⚠️ **Admin API の `shopifyFunctions` は「問い合わせているアプリ自身の Function」しか返さない。**
Claude Code の Shopify MCP は別アプリなので**常に0件**になる。**未インストールと誤判定しないこと**(D-100)。
確認は管理画面 → 設定 → アプリと販売チャネル → MORU Promotions → Functions。

### 2026-08-25 に作った Owner 提出物

| 何 | 場所 |
|---|---|
| **まとめ買い 推奨13 / 要確認6 の最終一覧** | `ops/products/_multibuy_final_20260825.md` |
| **PAIR 候補8組** | `ops/products/_pair_candidates_20260825.md` |
| **SUMMER SALE 候補8商品 + SALE collection 案** | `ops/products/_summer_sale_20260825.md` |
| **ローンチ阻害事項の全件監査(BLOCKER 15件)** | `ops/_launch_blockers_20260825.md` |
| **DEV → MAIN 差分 と promotion allowlist** | `ops/theme/_dev_to_main_20260825.md`(⚠️ **Frontend 修正前の checksum。作り直しが要る**) |
| **在庫・販売可能性の全 Variant 監査** | `ops/products/_inventory_audit_20260825.md` + `_inventory_audit_20260825.csv`(257行) |
| **Pages / Policy 監査** | `ops/_pages_policy_audit_20260825.md` |
| **ペア採算ツール** | `ops/tools/pair_audit.py` + `ops/products/_pair_definitions.csv` |
| **価格監査(原価223件反映)** | `ops/products/_price_audit_20260825.md` |
| 商品単位サマリ | `ops/products/_price_summary_by_product.csv`(`ops/tools/product_summary.py` で生成) |

### 🔴 いま Owner に決めていただきたい最重要2件(D-113 / D-114)

1. **docs/10 の「×3.0」と docs/12 の「15%OFF後 ×2.6」が両立しない。**
   ×3.0 × 0.85 = ×2.55。**ルールどおりに値付けした商品は15%OFFで必ず基準を割る。**
   → 推奨は「15%OFF を出す商品だけ ×3.06 以上にする」。**実際に効くのは3商品だけ**
2. **PAIR 第一候補が P-8 → P-6 に入れ替わる。**ソラ キャットハンモックが唯一 ×3.0 を割っており
   (×2.42)、P-8 は ×2.12 で基準割れ。**ソラを ¥25,980 にすれば P-8 も成立する**

### Owner 待ち(ここが止まっている)

1. ✅ **CKB 商品原価 223 Variant を反映済み(2026-08-25)。**監査は
   `ops/products/_price_audit_20260825.md`。**未取得は34 Variant / 3商品**
   (アブストラクト21 / ルナ ウォールライト8 / セル モジュール5)。
   ⚠️ **着地原価は実測ではなく推定**(`ckb_cost + ship_est`)。送料・手数料の実測値は未取得(D-112)
2. **返品条件の決定**(A: 7日・不良のみ / B: 30日・お客様都合可)。**Shopify に返金ポリシーが1件も無い**(D-109・D-110)
3. **特商法の空欄9項目**+ ストア設定の電話番号(すべて法定必須)
4. **プライバシー・利用規約の本文**(ページが白紙)→ **5ページの公開**
5. **「¥500ptプレゼント」「2年保証」の実体確認**
5b. **国際配送ゾーンと「速達 ¥3,762」の停止可否**(D-108)
6. まとめ買い13商品 / ペア8案 / SALE 8商品 の確定
7. **アブストラクト オブジェ**(21 Variant が別商品)の分割 / 非掲載
8. **MAIN 反映の可否**(`ops/theme/_dev_to_main_20260825.md` の allowlist)

### やってはいけない(承認まで)

- Discount の作成・有効化 / `custom.multi_buy_eligible` の商品設定
- 商品の price / compare_at_price / tags / metafields / status / publication の変更
- **MAIN テーマ `166203621616` への書き込み・publish**(`--allow-live` を使わない)
- **Frontend Dev `166341181680` の theme files の変更**(ChatGPT が並行実装中)

---

## ★ 全商品価格再設計 + 数量割引 Function — **Phase A 実施済み / Phase B コード完了**

**指示書は `docs/12_price_redesign_and_multibuy.md`。決定は `docs/06_decisions_log.md` D-096〜D-099。**

### 成果物

| 何 | 場所 |
|---|---|
| 価格監査 Phase A 本体 | `ops/products/_price_audit_20260824.md` |
| Variant 単位 257行の台帳 | `ops/products/_price_audit_20260824_variants.csv` |
| **Owner への CKB 原価依頼票** | `ops/products/_ckb_cost_request_20260824.md` |
| Discount Function + テスト | `apps/moru-promotions/extensions/multi-buy-discount/`(17 passed / 0 failed) |

**Shopify 側は1件も変更していない**(price / compare_at_price / tags / metafields /
status / publication / discounts)。テーマファイルも触っていない。

### 次のセッションが最初に読むべきこと

1. ⛔ **Variant 別 CKB 原価は、この実行環境からは取得できない(D-096)。**
   Shopify に原価(`unitCost` 全 null)・重量(全 0kg)・価格履歴が無く、
   `ckb.jp` に到達できず、認証情報も無い。**Owner が依頼票を埋めるまで新価格は確定できない。**
   **同じ調査を繰り返さないこと。** 依頼票は優先度1(11商品62 Variant)/ 優先度2(10商品113 Variant)
2. ✅ **§6 の ×7〜×10 は原価記録の取り違えだった(D-097)。値下げ推奨は0件。**
   `_variant_decisions_20260823.md` の削除ログで9商品が説明できる。
   **説明がつかないのは フラワー フロアクッション(×6.08)だけ。最優先で実測**
3. ⚠️ **アブストラクト オブジェは ¥4,980〜¥58,980 の21種が1商品に同居。** 価格以前に構成の判断が要る
4. ⚠️ **ストアに Discount は0件。** docs/10 §3 の「現行クーポン20%OFF」は事実と違う
5. ✅ **送料無料しきい値は ¥7,700 に決着(D-101・2026-08-25)。**ストア設定は元から ¥7,700 なので変更不要。
   しきい値は**割引後の小計**で判定されるので、数量割引より先に一本化する

### Owner 判断待ち(承認まで動かさない)

1. CKB Variant 原価の提供(`_ckb_cost_request_20260824.md`)
2. アブストラクト オブジェをどうするか(分割 / 非掲載 / 一部だけ残す)
3. ~~送料無料しきい値~~ → ✅ **¥7,700 に決着(D-101)**
4. まとめ買い対象を推奨13商品で確定してよいか(要確認6商品の扱い)
5. 判定方法を **`custom.multi_buy_eligible`(boolean metafield)** にしてよいか(D-098)

---

## 0. 直近のセッション(2026-08-24)— **フェーズ転換: 画像制作を止めて売上に寄せる**

**オーナー判断で、商品画像の作り込みをやめた(D-080)。**

> 今やるべきことは各商品の画像をうまく生成することじゃなくて、早くPDCAを回して
> 商品を売れる環境を作って経験を積むこと。一つひとつの商品にリファレンスシートに則って
> サムネイル・商品画像・説明画像まで作るのは、正直やりすぎだった。

### いま何をするか

**① 説明文とメタフィールド → ② 必須画像の日本語化 → ③ 公開準備 → ④ 広告** の順。

**① は 2026-08-24 に完了。** `later` 2件(プラッシュ クッション / アブストラクト オブジェ)と
`review-required` 2件(レジン スカルプチャーオブジェ / 手編みコースター)を除く**全32商品**に
説明文・`custom.catch_copy`・`custom.features`・`custom.specs`・SEO を登録した。
**画像から読み取れなかった項目と、オーナー判断が要る指摘は
`ops/products/_unverified_report.md` にまとめてある。次に読むのはそこ。**

**画像作業は「必須の中国語画像の日本語化」だけ。これも 2026-08-24 に完了。**
対象は**寸法図 / 仕様表 / 使い方 / 同梱物**のように「読めないと買えない」もの。
雰囲気カットは中国語のままでよい。**崩れたら諦めて元のまま残す。元画像は削除しない。**

**20商品・27枚**を日本語化し、全部ギャラリー写真の直後(4〜7枚目)に置いた。
走査は**全説明画像589枚をコンタクトシート化して全数目視**している(D-090。
1回目は途中で打ち切ってクラウドの寸法図を取りこぼした)。
判明した寸法・素材は**説明文と仕様表の両方に反映ずみ**。詳細は
`ops/products/_unverified_report.md` の「中国語画像の日本語化」節。

### 退避したもの

`docs/_archive/2026-08_image-production-workflow/`(**参照しない**)。
レシピ(実測値・3回の失敗)/ スキル §5〜§6 / docs/11 §6 / シート改訂ブリーフ。
**捨てていないのは、規模が出たあとに戻る可能性があるため。**

`image-prompt-director` / `seedance-scene-director` は**退避していない。**
Meta / TikTok の広告クリエイティブで使う見込みがあるため(D-082)。

---

## 0-A. 2026-08-23 深夜 — **商品登録ワークフローの確立(Tier1 5商品)**

**`docs/11_product_registration_workflow.md` を新設。** CKB → Shopify → フロントの一連の流れを、
Tier1 5商品で実際に通してから手順書にした。

### この回で分かった一番大きいこと

**仕入れ元の販促画像は読み取れる。寸法図が入っていることが多い。**
「サイズが分からないから仕様が書けない」という詰まりの大半は、これで解ける。

- 実例: コーデュロイ フォールディングチェア → 全高82 / 座面高47 / 座面41×44 / 背46×40cm を図から取得
- **Shopify 側の画像には一切触っていない**(ローカルに落として読むだけ)
- **書いていないことは書かない。** 取れなければ「確認中」と書き、報告に回す(D-064)
- **画像の禁止表現は書き写さない。** ランプ画像の「护眼」「无蓝光」は健康に関わる未検証の主張(D-065)

### 登録済み(5商品)

フラワー キャットタワー / ソラ キャットハンモック / コーデュロイ フォールディングチェア /
クラウド サイドテーブル / フラワーバッド テーブルランプ。
それぞれ `descriptionHtml` / `catch_copy` / `specs` / `features`(4〜5点)/ SEO 2点。

### ⚠️ オーナー確認が要るもの → `ops/products/_tier1_batch_20260823.md`

- **フラワー キャットタワー: 同一商品に別構造の寸法図が2枚ある**(1段 D59×42cm / 3段 50×47×70cm)。
  価格は同じ ¥31,480。**どちらを売るのか要確認**(仕様表は商品名と一致する3段を採用)
- **クラウド サイドテーブル: 画像20枚に寸法図が1枚も無い。** CKB 側から拾う必要がある
- ソラ キャットハンモックの「木製フレーム」バリアントに対応する画像が見つからない
- ランプのバッテリー容量・点灯時間、チェアの折りたたみ厚・耐荷重が不明

### 残り

- **28商品**(`later` 2件・`review-required` 2件を除く)。1回3〜5商品が現実的

---

## 0-A. 2026-08-23 深夜 — **フロント反映(ナビ7分類・新着の自動化)**

> ✅ **(2026-08-23 当時の運用)ライブテーマ(#166203621616)へ push 済み**。**現在この宛先は禁止。** `theme check` 73ファイル無指摘。
> `shopify theme dev` のプレビューでトップ・全コレクションページの描画を確認済み。

### ⚠️ push 前に必ずやること(この回で危うく壊しかけた)

**テーマエディタで入れた設定はライブテーマにしか無い。** リポジトリの JSON は空のままなので、
そのまま `theme push` すると**ロゴ・フォント・ヒーロー画像・アナウンス文が消える。**

```
shopify theme pull --theme 166341181680 --path <tmp>   # 作業テーマ(Frontend Dev)を取得
# ライブ(166203621616)の設定を参照したいときは pull のみ可。push は禁止
diff -rq . <tmp>                                        # 自分が触っていない差分を洗い出す
# config/settings_data.json / sections/*-group.json / templates/*.json / locales/*.json
# はライブ側を正として取り込んでから、自分の変更を載せ直す
```

実際、この回のライブには以下が入っていた(取り込み済み):
フォント(Zen Kaku Gothic New)・`max_page_width` 等 / ヘッダーとフッターのロゴ `MORU.gif` /
アナウンス文「¥15,000以上のご購入で送料無料 …」/ **ヒーロー3枚の画像とコピー** /
ベストセラー5枠の商品指定 / カートドロワーの税設定

### Shopify 側(適用済み)

- **コレクション5本が未公開だった**(`storage` / `chair-stool` / `table` / `lighting` / `fabric`)。
  **API で作ったコレクションは販売チャネルに自動公開されない**(D-062)。オンラインストア + Shop に公開した
- `main-menu` を **新着 / ペット / インテリア▾(すべてのインテリア + 6分類) / セール** に更新。
  `footer-shopping` も7分類に。**「読みもの」は記事0件なので今回は入れていない**
- `new-arrivals` を **全商品・作成日降順**のスマートコレクションに変更し、`templateSuffix = new-arrivals` を設定。
  フラワーラウンジの `new-arrival` タグは不要になったので外した

### テーマ側(push 済み)

- `templates/index.json` — 「カテゴリーから探す」を**7分類**に。新着グリッドは60日フィルタ。
  その下のグリッドは `cat-life`(1件)→ `pet` に
- `sections/moru-header.liquid` — **ドロップダウン(デスクトップ)とアコーディオン(モバイル)を新規実装。JS 不要**
- `sections/moru-product-grid.liquid` / `snippets/moru-product-card.liquid` — **`new_within_days`**
- `templates/collection.new-arrivals.json` — 新着コレクションページ用(60日)
- 翻訳キー4本を ja / en に追加

### 未着手のまま残っているもの

- **商品説明文 37件**(tier別テンプレート)
- モバイルドロワー下段の信頼情報3項目・最下部SNS(docs/09 §3)
- **送料無料しきい値の矛盾**(表示 ¥15,000 / ストア設定 ¥7,700)= **現状は虚偽表示**
- ベストセラー枠は `interior` を母数にしているだけで、**販売実績に基づいていない**(表記の是非は保留のまま)
- 4商品が DRAFT(プラッシュ クッション / アブストラクト オブジェ / セル モジュールキャビネット / ルナ ウォールライト)

---

## 0-A. 2026-08-23 深夜 — **商品命名の確定・リネーム20件・命名規則の恒久化**

**ブランチ `claude/moru-living-shopify-dev-yvnmni`。テーマコードは1行も変えていない。**

- **オーナーが商品名20件を確定**。Shopify に title + handle を適用済み(handle は新 title の英訳スラッグに統一)
- **命名規則の正は `docs/09_navigation_taxonomy.md` §8。** 新しい商品名を付ける前に必ず §8 を読み、
  愛称の語彙表で重複を確認し、**追加したら表に追記する**
- **商品登録スキルにステップ 3-2「商品名を決める」を新設。** AI は候補を出すだけで、
  **オーナー承認前に title を確定しない**
- **「フラワー」を MORU 初の公式シリーズに確定**(`series-flower` タグ・5商品)
- **禁止表現をバリアント名まで走査。56値 / 9商品を修正**(無垢材 → 天然木、ラムフリース → ボアフリース、
  「洗濯機で洗えます」「品質保証」「二重耐荷重」「中古/中世」の削除)。本文への混入は0件
- 決定ログ **D-047〜D-051**

### バリアント構成の確定(D-052〜D-057)

オーナーが **D-042(AI はバリアントを刈らない)を解除**したため、全商品のバリアントを整理した。

- **約600 → 325**。うち後回し4商品(`later` / `review-required`)で92
- 受注生産「カスタマイズ」5値・ギフトボックス3値・「ほしい物リストに追加優先配送」等、
  **履行できない約束をカートから排除した**
- クッション3商品は**中材付きに一本化**。ブランケット2商品は**両方残し、色は全色・サイズ3種**
- **オプション名・値の日本語化を完了**(仕入れ元の管理コード全廃・寸法表記の統一)
- **価格は変更していない。** 残ったバリアントの価格はそのまま有効
- 詳細は `ops/products/_variant_decisions_20260823.md`

### ⚠️ この回で起こした事故(復旧済み・要フォロー)

`productOptionUpdate(optionValuesToUpdate:)` に **22件を1回で渡して、11件目以降の
オプション値とバリアントを削除した**(ボア ラウンジチェア 22 → 10)。同セッション内で
22 に復旧し、全37商品の `variantsCount` を棚卸しスナップショットと照合して他に欠損が無いことを確認した。

- **`optionValuesToUpdate` は 1回 10件まで。前後で `variantsCount` を照合する**(D-051)
- **復元できなかったもの: 削除された12バリアントの仕入れ元原価。** 現在は生存分と同じ ¥16,480 が入っている。
  **その後のバリアント整理で、原価が確かなスポンジ座面10色だけを残し、復旧したラテックス側12値を削除した。
  これで価格の不確かさは解消したため `needs-pricing` は解除済み**

---

## 0-B. 直近のセッション(2026-08-23 夜)— **v0.2 全面改訂(ドキュメントのみ)**

**ブランチ `claude/moru-living-shopify-dev-yvnmni`。テーマコードは1行も変えていない。**

オーナーの「MORU v0.2 全面改訂」プロンプトを受け、**ブランド再定義・サイト構造・
カテゴリ設計・画像ワークフローをドキュメントに反映した。実装はオーナー承認待ち。**

### 変更したファイル

| ファイル | 内容 |
|---|---|
| `docs/00_brand_master.md` | 冒頭に **v0.2 追補**(Pet-first, Interior-always. / Concept・Mission・Vision・Values / 3層の問題 / ペルソナ / 商品システム4階層 / エコシステム)。**旧本文に優先する** |
| `docs/01_brand_guidelines.md` | **全面改訂 v0.2。** 9色パレット / 写真4原則 / Playful の出し方 / **SALE系解禁** / 画像ルール |
| `docs/02_homepage_spec.md` | **v3 に改訂。** 12セクション構成 |
| `docs/05_build_workflow.md` | 見た目の正をリファレンスシートへ。`locales/ja.json` → `ja.default.json` の誤記修正 |
| `docs/06_decisions_log.md` | **新設。** D-001〜D-029 |
| `docs/07_session_protocol.md` | §3「現在の正」表を更新 |
| `docs/09_navigation_taxonomy.md` | **新設。** ナビ6分類・ヘッダー・スマートコレクション・内部タグ |
| `docs/brand/reference-sheets/` | **新設。** シート01〜05 のテキスト版 + README |
| `.claude/skills/product-registration/` | **新設(v2)。** リファレンスシート生成方式は廃止 |
| `.claude/skills/image-prompt-director/` | **新設(移植)。** オーナーの汎用スキルの完全コピー + `references/moru-notes.md` |
| `.claude/skills/seedance-scene-director/` | **新設(移植)。** 同上 |
| `CLAUDE.md` | 絶対ルール14項目に再編・ステータス更新。**ルール10で moru-notes.md の優先読み込みを義務化** |

### ⚠️ 次のセッションが最初に確認すべきこと(v0.2 分)

| 状態 | 内容 |
|---|---|
| **未受領** | **リファレンスシート画像5枚がリポジトリに無い。** オーナーはチャットに添付したが、この実行環境はチャット添付画像をファイル化できなかった(`/mnt/attach` が空)。テキスト版のみ在り |
| **未受領** | **`home_v3_upper.png` / `home_v3_lower.png` は添付そのものが無かった。** docs/02 v3 はプロンプト本文だけを根拠にしている。**余白・比率・カード寸法は未確定** |
| **未着手** | テーマ実装への反映(design token 色替え / ヘッダー改修 / ホーム v3 化)。**オーナー承認待ち** |
| **不整合** | v0.2 プロンプトは「前回の引き継ぎ(`docs/06_decisions_log.md`)」を参照していたが、**そのファイルはこのリポジトリに存在しなかった。** 別クローンの記憶と思われる。今回新設し、2026-08-23 から記録を開始した |
| **不整合** | v0.2 プロンプトは `ops/products/` と `.claude/skills/product-registration/` の「全面改訂」を指示したが、**どちらもこのリポジトリに存在しなかった。** スキルは新規作成した。`ops/` は商品登録の実作業時に作る |
| **不整合** | v0.2 プロンプトは旧 `brand_board.png` に言及したが、**このリポジトリには無い**(あるのは `home_v2_final.png` のみ) |
| **既知** | **アカウント側 synced に同名スキルあり**(`image-prompt-director` / `seedance-scene-director`)。**どちらが読まれるかは環境依存。** スキル使用時は `references/moru-notes.md` の存在を確認し、無ければリポジトリ側のパス(`.claude/skills/<skill>/references/moru-notes.md`)を明示的に読むこと。原本 SKILL.md からこのノートへの参照は無い(原本は変更禁止のため CLAUDE.md 絶対ルール10で担保している) |

---

## 0-0. その前のセッション(2026-08-23 後半)

**ブランチ `claude/moru-living-shopify-dev-yvnmni` / HEAD `f5636b0`。git・ストアとも一致済み。**

### やったこと

1. **CTA広告バナー** `moru-cta-banners` を新設。画像1枚+リンク先だけを持つ形
   (推奨解像度 **1440×480 / 3:1**。テーマエディタで外れた画像に警告が出る)
2. **トップページを参考HTML `docs/mockups/home_20260823_full.html` に寄せた。**
   新セクション4本(安心バー / ベストセラー / 暮らし+読みもの横並び / 今週のおすすめ)、
   カテゴリーを四角に、フッターに3列のリンクを配線
3. **ストア側**: コレクション4つ作成・メインメニューを日本語化・フッターメニュー3本・
   ブログを「読みもの」にリネーム・フラワーラウンジに `ペット` タグ追加

詳細な決定理由は **§3「トップページを参考HTMLに寄せた(2026-08-23)」** に書いてある。
**安心バーの文言は事実に紐づいている。参考HTMLに戻さないこと。**

### ⚠️ 次のセッションが最初に確認すべきこと

| 状態 | 内容 |
|---|---|
| **未解決** | トップに「税込15,000円以上で送料無料」と出しているが、**ストアの配送設定は ¥7,700 のまま。**<br>Admin API が拒否したため管理画面から手で直す必要がある(理由は §3) |
| **未回答** | ヒーロー見出しを参考HTMLの「猫が心地よく眠れる、わたしも好きな部屋へ。」に差し替えるか。<br>現状は「猫が寝転ぶと、部屋が完成する。」のまま |
| 保留 | 読みもの(ブログ)はメニューから外してある。記事が入ったら戻す |
| 保留 | ベストセラーの5枠は**商品未選択**。テーマエディタから選ぶ(商品が1点しかないため) |
| 保留 | CTAバナー・今週のおすすめ・Instagram の**画像が未設定**。プレースホルダー表示 |

### 検証の状態

`shopify theme check` **74ファイル・0件**。ストアへ push 済み・Liquid エラー0。
docs/07 §4 の手順で PC(1440px)/ モバイル(390px)の**実描画まで確認済み**。
**ストアのパスワードは docs に書いていない。ユーザーに聞くこと。**

---

## 0-1. その前のセッション(2026-08-22〜23 前半)

**HEAD `c4431a3` 時点の記録。**

### やったこと

**A. 残っていたページ・UIを完成**
- 検索結果ページ(`moru-search`)/ 404(`moru-404`)/ カートドロワー(`moru-cart-drawer`)/
  検索モーダル(`moru-search-modal` + `moru-predictive-search`)
- Skeleton の未使用セクション8本を削除

**B. 商品コンテンツをメタフィールド化**(管理画面=入力フォーム、テーマ=表示)
- `custom.catch_copy` / `custom.subtitle` / `custom.specs` / `custom.features` /
  `custom.swatch_colors`。すべて**メタフィールド優先 → セクション設定へフォールバック**なので未入力でも壊れない
- メタオブジェクト `moru_feature`(画像+見出し+本文)、`moru_color`(カラー名+色)
- 新セクション `moru-product-features`(この商品の特徴)

**C. 実商品「MORU フラワーラウンジ」を登録**
- 旧ドラフトの作り替え。ACTIVE / ¥9,980 / カラー2色 / 在庫各5 / バリアント画像割当 / メタフィールド全投入
- コレクション `new-arrivals` / `cat-life` を作成し、トップ・商品テンプレートに接続
- 英語サンプル商品4点は削除(ユーザー指示)

**D. 在庫とカートの挙動(ユーザー指示による設計)**
- 「残りわずか(残りN点)」を**常時表示**(閾値20)。在庫追跡オン
- 表示値 = **実在庫 − そのお客様自身のカート内数量**。閲覧者ごとに違う数字が出る。実在庫は注文時のみ動く
- 全数をカートに入れている間は「カートに全数入っています」(売り切れとは区別)
- **カートは24時間で自動削除**。`_added_at` プロパティ + カウントダウン + `cart/change.js` で実削除

### このセッションで見つけた仕様上の落とし穴(次も踏みやすい)

| 事象 | 実際の原因 |
|---|---|
| テーマ `166203621616` は**公開テーマ(MAIN)** | **書き込み禁止。**フロント作業は `166341181680`(MORU Frontend Dev / UNPUBLISHED)に対して行う。push 前に必ず role 確認(docs/07 §2) |
| 検索モーダルの候補が出ない | **Predictive Search API は日本語非対応**。`/search/suggest` が 417。通常の検索インデックスから出すフォールバックに変更済み |
| 商品ページが404 | 仕入れアプリ経由の商品は **POSチャネルにしか公開されない**ことがある。`publishablePublish` でオンラインストアへ公開 |
| スウォッチが灰色 | `value.swatch.color` は **API から直接書けない**。商品メタフィールド `custom.swatch_colors` を読む実装を追加して解決 |
| 共有CSSで theme check 警告 | `ValidScopedCSSClass`。複数セクションで使うクラスは `assets/base.css` に置く |

### 検証の状態

`shopify theme check` **0件**(67ファイル)。docs/07 §4 の手順で**実描画まで確認済み**
(検索/0件/404/モバイル、商品ページ、モーダル・ドロワーの操作テスト、A/B 2セッションでの在庫表示、
期限切れカートの実削除)。Liquid エラー・翻訳漏れなし。

⚠️ Dev MCP(`learn_shopify_api` / `validate_theme`)は**2セッション連続で接続失敗**したため使えず、
代わりに npm の Shopify CLI で `shopify theme check` を実行した。
**原因は特定済み(npx のキャッシュ破損)。復旧コマンドと代替手段は docs/07 §6 を読むこと。**

### 補助ツール

**スウォッチスポイト**(商品写真から色を拾う。Shopify管理画面にこの機能が無いため作成)
https://claude.ai/code/artifact/c96a39ae-17d7-4eac-b559-9dd4c5642863
## 1. 現状サマリー

Skeleton Theme をベースに、**トップ / 商品 / カテゴリー / カート** の4ページをワイヤーフレームとして構築済み。
デザインはユーザーが ChatGPT で生成した参考HTMLを、デザイントークンに載せ替えて再現している。

作業サイクルは固定:

1. 参考HTMLを受け取る(**そのまま移植せず、形とコンポーネントだけ参考にする**)
2. `sections/moru-*.liquid` を実装 or 修正
3. `shopify theme check` と Dev MCP `validate_theme` を通す
   (このコンテナに Shopify CLI は無い。`npm i @shopify/cli` で入れれば `shopify theme check` が使える)
4. git commit → git push
5. `shopify theme push --store=rgy5ee-fv.myshopify.com --theme 166341181680` で反映(**MAIN への push・`--allow-live` は禁止**)
   **※ 公開テーマなので `--allow-live` が必要。push 前に role を確認する(docs/07 §2)**
6. Admin API で MD5 照合(docs/07 §1)→ テーマエディタのリンクをユーザーに渡す

---

## 2. 完成済み

### テンプレート

| テンプレート | セクション構成 |
|---|---|
| `templates/index.json` | hero / **usp-bar** / **bestsellers** / product-grid(新着) / shop-the-room / cta-banners / category-browser / product-grid(猫のくらし) / cta-banners / **community-journal** / **weekly-picks** |
| `templates/product.json` | main-product / bundle / details / styling / product-grid×2 / recently-viewed |
| `templates/collection.json` | collection-banner / collection-grid / recently-viewed |
| `templates/cart.json` | main-cart / recently-viewed |
| `templates/search.json` | moru-search / recently-viewed |
| `templates/404.json` | moru-404 / recently-viewed |
| `templates/page.json` | page-header / page-content(汎用の固定ページ) |
| `templates/page.about.json` | page-header / page-story×3 / page-cta |
| `templates/page.tokushoho.json` | page-header / page-legal(法定13項目) |
| `templates/page.privacy.json` | page-header / page-content(目次あり) |
| `templates/page.terms.json` | page-header / page-content(目次あり) |
| `templates/page.faq.json` | page-header / page-faq / page-cta |
| `sections/header-group.json` | moru-announcement / moru-header / moru-search-modal / moru-cart-drawer |
| `sections/footer-group.json` | moru-footer |

### セクション(すべて schema 付き・日本語ラベル・presets 付き)

- `moru-announcement` — アナウンスバー
- `moru-header` — sticky ヘッダー(ロゴ画像差し替え可・モバイルはドロワー)
- `moru-hero` — フェード式スライドショー(スライド=ブロック最大5枚、下部ドットのみ、矢印なし、自動再生・スワイプ・reduced-motion対応)
- `moru-product-grid` — 汎用商品グリッド(見出し/NEWバッジ/サブタイトル/下部ボタン/列数の各設定あり。1ページに複数配置して使い回す)
- `moru-shop-the-room` — 部屋で見る(ホットスポット=ブロック、%で位置指定)
- `moru-category-browser` — 円形カテゴリ(ブロック)
- `moru-journal` — 読みもの/スタイリングガイド(3カラム横型カード)
- `moru-instagram` — 罫線帯レイアウト+正方形5枚
- `moru-footer` — 明るい5カラムフッター+ニュースレター+SNS
- `moru-main-product` — 商品メイン(ギャラリー/バリアント選択/数量/カート/エクスプレス/安心カード/お届けバー)
- `moru-product-details` — レビュー(スコア+5段階バー+カード)+アコーディオン
- `moru-product-bundle` — あわせて楽しむ(2点セット・割引%表示)
- `moru-product-styling` — スタイリングインスピレーション
- `moru-collection-banner` — カテゴリーバナー(英字/和文タイトル+説明+画像)
- `moru-collection-grid` — タグピル絞り込み+並び替え+4列グリッド+さらに表示する
- `moru-main-cart` — カート(明細/クーポン/内訳/合計/おすすめ/レビュー)
- `moru-recently-viewed` — 閲覧した商品(localStorage)
- `moru-page-header` — 固定ページ見出し(パンくず/英字サブ/見出し/リード文/最終更新日/背景切替)
- `moru-page-content` — ページ本文(管理画面「ページ」の本文をRTEスタイルで表示・目次自動生成・幅切替)
- `moru-page-legal` — 表形式の項目(項目名+内容のブロック)。特商法ページ用
- `moru-page-faq` — よくある質問(カテゴリ見出し+質問ブロックのアコーディオン)
- `moru-page-story` — 画像+テキストの交互ブロック。Aboutページ用
- `moru-page-cta` — ページ下部の案内(見出し/説明/ボタン2つ)
- `moru-search` — 検索結果(検索フォーム/種類タブ/並び替え/さらに表示する/0件時の導線+おすすめキーワードのブロック)
- `moru-404` — 404(見出し/説明/検索フォーム/導線リンクのブロック)
- `moru-search-modal` — ヘッダーの検索モーダル(予測検索・最近の検索・おすすめキーワード)。**header グループ専用**
- `moru-cart-drawer` — 右から出るカートドロワー(数量変更/削除/小計/購入手続き)。**header グループ専用**
- `moru-predictive-search` — 検索候補の描画専用。テンプレートには置かない・schema なし(下記「検索・カートドロワーの仕組み」参照)
- `moru-product-features` — 「この商品の特徴」(メタフィールド `custom.features` 優先・ブロックにフォールバック)
- `moru-cta-banners` — CTA広告バナー(ブロック=バナー1枚。画像1枚+リンク先だけを持つ。
  何枚でも追加でき、1枚ごとに表示/非表示。ページのどこにでも何個でも置ける)
- `moru-usp-bar` — 安心バー(送料・お届け目安・返品・選定方針の4項目。ブロックで増減可)
- `moru-bestsellers` — ベストセラー(**手動で並べた順が順位**。1〜5の丸バッジが自動で付く)
- `moru-community-journal` — #MORUのある暮らし + 読みものの**横並び**(PC2カラム / スマホ縦積み)
- `moru-weekly-picks` — 今週のおすすめ(部屋写真 → 商品ページへリンク)

### スニペット

- `snippets/moru-product-card.liquid` — 商品カード(NEWバッジ・お気に入りアイコン・カラースウォッチ・サブタイトルをパラメータで切替)
- `snippets/css-variables.liquid` — テーマ設定 → CSSカスタムプロパティ
- `snippets/moru-swatch-color.liquid` — カラースウォッチの色を解決(Shopifyスウォッチ → 商品メタフィールド → テーマ設定)

---

## 3. 守るべき設計ルール

### デザイントークン

- 色・フォント・角丸は `config/settings_schema.json` → `snippets/css-variables.liquid` → CSS変数。
  **セクション内でHEX直書き禁止**(`var(--color-*)` を使う)。
- 現在の初期値は参考HTMLに合わせた白ベース:
  背景 `#FFFFFF` / 切替面 `#F7F5F0` / 文字 `#191919`。
  docs/01 のブランドパレット(Warm Ivory 等)はテーマ設定から1クリックで戻せる。
- フォントは3系統: `--font-display--family`(Cormorant・ロゴ/英字)、`--font-heading--family`(Noto Serif JP)、`--font-body--family`(Noto Sans JP・14px)。
- 共有クラス(`.moru-breadcrumbs` `.moru-rating-stars` `.moru-button` `.moru-section-header` `.moru-card`)は `assets/base.css` に置く。
  セクションの `{% stylesheet %}` に他セクションのクラスを書くと theme check が警告する。

### 文言

- **日本語がデフォルトロケール**: `locales/ja.default.json` / `ja.default.schema.json`。英語は `en.json` / `en.schema.json` にミラー。
- Liquid に日本語を直書きしない。schema の `default` も `t:` 参照にする。
- ただし `templates/*.json` の初期コンテンツ(アコーディオン本文・安心カードの文言など)はリテラル日本語で入れている(マーチャントが編集する内容のため)。

### 検証(CLAUDE.md の必須ルール)

- Liquid を書いたら Dev MCP の `validate_theme` を必ず通す(ツール名は `validate_theme_codeblocks` から改称済み)。
  **Dev MCP が接続失敗しているときは docs/07 §6 の代替(`shopify theme check`)で進めてよい。**
- `learn_shopify_api` を先に呼んで conversationId を取得する(Dev MCP が無いセッションでは呼べないので省略可)。
- Shopify の仕様は記憶で答えず `search_docs_chunks` で確認する。
- コミット前に `shopify theme check` を通す(現在オフェンス0)。

### トップページを参考HTMLに寄せた(2026-08-23)

参考: `docs/mockups/home_20260823_full.html`。ユーザー承認済みの決定事項:

| 項目 | 決定 |
|---|---|
| ヘッダーの日本語化 | **テーマではなくストアのメニュー設定**。コレクションを4つ作ってから組んだ |
| 安心バーの文言 | 「当日発送」「翌日お届け」は**使わない**(事実に反する)。下記参照 |
| ベストセラーの順位 | **手動で並べた順**。売上実績順ではない(実売がまだ無いため) |
| Instagram と読みもの | **左=Instagram / 右=読みもの** |
| カテゴリーのサムネ | **四角**(設定で丸にも戻せる) |
| フッターのタグライン | 「猫との暮らしを、もっと心地よく、**もっと楽しく**。」 |

#### 安心バーの文言は事実に紐づいている。勝手に変えないこと

参考HTMLは「最短翌日お届け」「ペットのための品質基準」だったが、どちらも使えない:

| 参考HTML | 実装 | 理由 |
|---|---|---|
| 最短翌日お届け | **お届けの目安は2〜3週間** / 商品により4週間以上いただく場合があります | 配送は2〜3週間。CLAUDE.md 絶対ルール4(配送目安を隠さず明示)そのもの |
| ペットのための品質基準 | **猫と暮らす目線でセレクト** / 置く場所と手ざわりを見て選んでいます | 「品質基準」と言うと定義された基準の存在を意味するが実在しない(docs/00 第5章) |

#### ⚠️ 未解決: 送料無料の金額がストア設定と食い違っている

トップに「**税込15,000円以上で送料無料**」と出しているが、
**ストアの配送設定は ¥7,700 のまま。** 変更を試みたが Admin API が拒否した:

```
このメソッド定義は、Shopifyの更新されたAPIでのみ利用可能な新しい設定を
使用しているため、更新できません。
```

このストアの配送オプションは新しいAPI形状(`rateGroups` / `freeConditions`)で
作られており、MCP が話せるAPIバージョンの `deliveryProfileUpdate` では書き換えられない。
**管理画面から手で直す必要がある**(設定 → 配送と配達 → 一般プロフィール → 国内配送)。
直すまで、表示と実際の請求が食い違う。

#### ストア側で作ったもの(テーマではない)

| 種類 | 内容 |
|---|---|
| コレクション | `pet` / `interior` / `goods` / `sale`(すべてタグ条件の自動コレクション) |
| 商品タグ | フラワーラウンジに `ペット` を追加(これが無いと全コレクションが空になる) |
| メインメニュー | 新着 / ペット / インテリア / 雑貨 / セール。**読みものは記事0件のため外してある** |
| フッターメニュー | `footer-shopping` / `footer-guide` / `footer-about` |
| ブログ | 「News」→「読みもの」にリネーム(handle は `news` のまま) |

**参考HTMLのご利用ガイドは「送料・配送について」「返品・交換について」「お支払いについて」を
含むが、これらのページは存在しない。** 実在するページだけでメニューを組んである。

#### 実装で踏んだ落とし穴

- **`range` 設定は最低3ステップ必要**(前述)。`theme check` は検出せず push で落ちる
- **モバイルで記事カードを `flex-direction: row` にすると、画像・タグ・タイトル・日付が
  横一列に並ぶ。** タイトルが 12px 幅になり1文字ずつ縦に折り返した。
  文字要素は必ず入れ物(`__article-body`)でまとめること
- **`placeholder_svg_tag` は縦横比を持たない。** 枠側で `aspect-ratio` を指定しないと、
  推奨比 3:1 のバナー枠に正方形に近い巨大なプレースホルダーが出る

### CTA広告バナーの設計(2026-08-23 追加)

参考デザイン: `docs/mockups/cta_banners_20260823.jpg`(+ 仕様は `home_20260823_cta_banners.md` §3)。

**バナーの本体は画像1枚とリンク先だけ。** 見出し・説明文・ボタンをテーマ側で組み立てない。
文字も装飾も価格も、すべて画像の中にある。これはユーザーの明示指示で、
テーマ側にも文字入力欄を作ると画像内の文言と二重管理になり必ず食い違うため。

| 設定 | 場所 | 役割 |
|---|---|---|
| 画像 | ブロック | 1枚のみ。**PC用/モバイル用の出し分けはしない** |
| リンク先 | ブロック | `url` 型。コレクション・商品・ページを一覧から選べる |
| 画像の説明(alt) | ブロック | 文言が画像内にあるため、空だと読み上げに何も届かない |
| このバナーを表示する | ブロック | オフでも消さずに残る。キャンペーンの出し戻し用 |
| 横に並べる数 | セクション | **1 or 2 のみ。** モバイルは常に1 |
| 幅 / 上下の余白 | セクション | ページ幅 or 画面いっぱい / 通常・狭い・なし |

**画像を切らないことが設計の中心。**
文字が焼き込まれている以上、`object-fit: cover` でトリミングすると文言が欠ける。
そのため縦横比の設定を持たず、`height: auto` でアップされた画像の比率のまま置く。
基準はスマホでの表示サイズで、PCではそれが横に2枚並ぶ。

#### 画像の推奨解像度: **1440 × 480 px(3:1)**

2026-08-23 にユーザーが「決まった解像度で必ず作るルールにする」と決めたため、
テーマ側から明確な1つの数字を出している。根拠はテーマの実寸から逆算:

| 条件 | バナー1枚の実寸(CSS px) | Retina(2倍)で必要 |
|---|---|---|
| ページ幅・2列(標準の使い方) | (1400 − 20) ÷ 2 = **690** | 1380 |
| モバイル最大(ブレークポイント 749px) | 749 − 40 = **709** | 1418 |

→ **横 1440 px あれば全ケースを2倍で満たす。** 高さは 3:1 の 480 px。
(`--page-width` 90rem = 1440px、`--page-margin` 20px、列の gap は `--space-md` 20px から算出)

許容範囲は **横 1200 px 以上 / 比率 2.5:1〜3.6:1**。
参考画像のバナーは実測 3.44:1 だったので、この範囲に収まる。

**テーマエディタでのみ、外れた画像に注意書きを出す。** `request.design_mode` で分岐し、
ストアフロントには一切出力しない。判定は3種類(優先順):

| 条件 | 出す文言 |
|---|---|
| 横幅 < 1200 px | `moru.cta_banners.notice_too_small` |
| 比率が 2.5:1〜3.6:1 の外 | `moru.cta_banners.notice_ratio` |
| 同じ行の1枚目と比率が 0.05 以上違う | `moru.cta_banners.notice_mismatch` |

比率は `width × 100 ÷ height` の**整数**で持つ(Liquid の割り算が整数のため。3:1 なら 300)。

⚠️ **この注意書きの文言は `locales/ja.default.json`(schema用ではない)に置く。**
Liquid 本文の `| t` はストアフロント用ロケールを見るため、`ja.default.schema.json` に
書くと `TranslationKeyExists` で theme check が落ちる。実際に一度踏んだ。

#### ⚠️ `range` 設定は最低3ステップ必要(2026-08-23 に踏んだ)

「横に並べる数」を `range` の `min:1 / max:2 / step:1` で作ったところ、
**`shopify theme push` がセクションごと拒否した**:

```
Invalid schema: setting with id="columns"
stepは無効です。範囲設定には少なくとも3つのステップが必要です
```

**`shopify theme check` はこれを検出しない。** 通ったのに push で落ちる。
さらにセクションが拒否されると `templates/index.json` の参照も芋づるで
「既存のセクションファイルを参照していません」エラーになる。
**公開テーマに push していたので、一時的にトップページが壊れた状態になった。**

選択肢が2つしかない設定は `range` ではなく `select` を使う。
その場合 **値は文字列で返る**ので、比較や割り算の前に `| plus: 0` で数値に変換すること。

同種の問題が他に無いかは、全セクションの schema を舐めて
`(max - min) / step + 1 < 3` を探せば機械的に確認できる(確認済み・他にはなし)。

副作用として、**隣り合う2枚の画像サイズが違うと高さがそろわない。**
グリッドは `align-items: start` で上端を揃える。これは仕様であって不具合ではない
(揃えるには切るしかなく、切ると文言が欠けるため)。

その他:
- 表示中が0枚ならセクションごと出力しない(空の余白を残さない)
- リンク未設定なら `<a>` にせず `<div>` で置く
- **プリセットに割引の数字を入れていない。** 「最大30%OFF」等は画像の中に入れるもの
  (docs/00 第11章の偽割引の禁止)

### 検索・カートドロワーの仕組み(2026-08-22 追加)

**予測検索 — 日本語では Predictive Search API が使えない**
`#shopify-features` の `predictiveSearch` が `false`(日本語は対応言語外)なので、
`/search/suggest` は 417 を返す。`sections/moru-predictive-search.liquid` は
そのため2種類のリクエストに同じマークアップで答える:

| 経路 | 使うオブジェクト | いつ |
|---|---|---|
| `/search/suggest?...&section_id=moru-predictive-search` | `predictive_search` | 対応言語のとき |
| `/search?q=...&options[prefix]=last&section_id=moru-predictive-search` | `search` | **現在の日本語ストアはこちら** |

モーダル側の JS が `#shopify-features` を読んで URL を選ぶ。取得した HTML の
`[data-predictive-root]` の中身を差し込む。
テンプレートには置かないので **schema を付けていない**(付けるとテーマエディタから
単体で配置できてしまい、常に空表示になる)。CLAUDE.md 絶対ルール9 の例外はこの1ファイルだけ。

**共有CSSの置き場**
`theme check` の `ValidScopedCSSClass` は、あるセクションの `{% stylesheet %}` に
そのファイルで使っていないクラスを書くと警告する。
そのため複数セクションから使うクラスは `assets/base.css` に置く。
今回 `.moru-pill`(商品一覧・検索ページ・検索モーダルで共有)と
`.moru-predictive__*`(描画元と表示先が別ファイル)を base.css に移した。

**JavaScript が無効なときの動作**
ヘッダーの検索アイコンは `/search` への `<a>`、カートアイコンは `/cart` への `<a>`。
モーダル/ドロワーの JS が `preventDefault()` して初めて上書きされるので、
セクションを外しても JS が落ちてもリンクとして機能する。

**カートドロワーが動かない場所**
`/cart` ページでは `request.page_type == 'cart'` を見てドロワーを開かない
(同じ内容が二重になるため)。カートアイコンは通常のリンクとして働く。

### 空状態フォールバック

商品・コレクション・ブログ・画像が未設定でも崩れないこと。プレースホルダー表示は必ず「これはサンプルです」と分かる文言にする。

---

## 4. 次にやること(優先度順)

**開発の前に、ユーザー側の作業が先に効く段階に入っている。** テーマの主要ページは揃っているので、
次に価値が出るのは「ストアを公開できる状態にする」ことと「2商品目を入れて設計が本当に回るか確かめる」こと。

| 優先 | 内容 | 誰が |
|---|---|---|
| **高** | `docs/08_store_checklist.md` §2 の残タスク(スウォッチ色は対応済み、メニュー差し替え・割引作成・特商法の事業者情報・固定ページ公開) | ユーザー |
| **高** | **2商品目を登録して、メタフィールド設計が実際に回るか検証** — 商品ごとのリード文・特徴・スウォッチが別々に出るか。1商品では確認できていない | 両方 |
| **高** | **ベストセラー(1〜5位ランキング)セクション** — 2026-08-23 の希望構成に含まれるが、ユーザー判断で後回し。着手時はデータ源(`best-selling` 並びのコレクション or 手動選択)と、実商品が5点に満たないときの見せ方を先に決める | 判断 |
| 中 | メインメニューが Home / Catalog / Contact のまま。新着アイテム・猫のくらし・MORUについて等へ | ユーザー |
| 中 | 商品写真がすべて仕入元由来。ブランド写真への差し替え | ユーザー |
| 中 | Search &amp; Discovery アプリ導入(検索の同義語・並び順) | ユーザー |
| 低 | `moru-category-browser` のタブ切替(同一ページ内フェード) | 開発 |
| 低 | お気に入り(ウィッシュリスト)の保存 — アプリが必要 | 判断 |
| 保留 | 読みもの(ブログ)一覧・記事詳細 — **ユーザー判断で準備中。着手指示待ち** | 判断 |

### まだ作っていないページ(Skeletonの素のまま)

| 優先 | テンプレート | 現状のセクション | 内容 |
|---|---|---|---|
| 保留 | `templates/blog.json` | `sections/blog.liquid` | 読みもの一覧。**ユーザー判断で「準備中」**。着手指示が出るまで作らない |
| 保留 | `templates/article.json` | `sections/article.liquid` | 読みもの詳細(記事本文・関連記事)。同じく準備中 |
| 低 | `templates/list-collections.json` | `sections/collections.liquid` | コレクション一覧 |
| 低 | `templates/password.json` | `sections/password.liquid` | パスワードページ |
| 低 | `templates/gift_card.liquid` | — | ギフトカード |

### 読みもの(ブログ)を作るときの前提 — 現在は準備中

ユーザーの判断で読みものは当面「準備中」。作れる状態は維持してあるので、着手指示が出たら以下から始める:

- `sections/moru-journal.liquid` の3カラム横型カードをそのまま一覧・関連記事に流用できる(`blog` / `article` オブジェクトで動く作り)
- 記事のカテゴリ表示は `article.tags | first`、日付は `article.published_at`。ブログ未選択時のプレースホルダ実装も済み
- 必要になるのは `templates/blog.json` + `sections/moru-blog.liquid`(一覧・ページネーション)と
  `templates/article.json` + `sections/moru-article.liquid`(本文・関連記事)の2セット
- 管理画面側では「ブログ」と記事の作成が必要(現在ブログ記事なし)

**注意:** トップページの `journal` セクションはブログ未選択のためサンプルカードを表示している。
読みものを公開しないままストアを公開する場合は、テーマエディタでこのセクションを非表示にすること。

### ページ以外で未実装

- **`moru-category-browser` のタブ切替** — 現状は円形カテゴリのリンクのみ(クリックでコレクションへ遷移)。同一ページ内でのフェード切替は未実装
- **お気に入り(ウィッシュリスト)** — 商品ページ・カードのボタンは見た目のみ。保存にはアプリが必要

### 掃除したもの(2026-08-22 実施済み)

Skeleton の未使用セクションを削除した。削除前に `templates/*.json` と `*-group.json` から参照が無いことを確認済み:
`header.liquid` `footer.liquid` `product.liquid` `collection.liquid` `hello-world.liquid` `custom-section.liquid` `search.liquid` `404.liquid`
(`page.liquid` は固定ページ実装時に削除済み)

**まだ残しているもの**(参照するテンプレートが素のまま残っているため):
`article.liquid` `blog.liquid` `collections.liquid` `password.liquid`

---

## 5. ストア側でユーザーの対応が必要なこと

| 項目 | 内容 |
|---|---|
| 商品データ | 「MORU フラワーラウンジ」登録済み(ACTIVE・2色・在庫各3)。英語サンプル4点は削除済み。新商品の登録手順は docs/08 §1 |
| タグ | カテゴリーページのタブは商品タグから生成。タグ未設定だとタブが出ない |
| カラースウォッチ | 管理画面「設定 → 商品のオプション」でカラーオプションにスウォッチ色を設定すると表示される |
| エクスプレスチェックアウト | 「設定 → 決済 → スピードアップチェックアウト」を有効にすると Shop Pay / Apple Pay / Google Pay が出る |
| セット割引 | カート/商品ページの割引表示は見た目のみ。実際に効かせるには管理画面「割引」で自動割引を作成する |
| クーポン | カートのクーポン欄は Shopify の `/discount/CODE` を使うので、割引コードを作れば実際に効く |
| 検索の精度 | 予測検索・検索結果の並びは Shopify の **Search & Discovery** アプリ(無料)で調整できる。同義語・除外・並び順など。未インストール |
| 検索の種類タブ | 検索ページの「読みもの」タブはブログ記事が無いと常に0件。読みもの公開までは `moru-search` の「種類タブを表示」をオフにしてよい |
| 固定ページの作成 | **作成済み(すべて非公開/下書き)**。about / tokushoho / privacy / terms / faq の5ページを Admin API で作成し、テンプレートも割り当て済み。内容確認後にユーザーが公開する |
| 事業者情報 | 特商法ページの「販売業者・責任者・所在地・電話番号・メールアドレス・支払方法/時期・商品代金以外の必要料金」は**未入力**。テーマエディタで実際の情報を入力するまで、店頭に「未記入です」と表示される(架空の事業者情報は入れていない) |
| ポリシー本文 | プライバシーポリシー・利用規約の本文は管理画面「ページ」の本文に入力する(見出し2を使うと目次が自動生成される)。**注意: Shopifyの「設定 → ポリシー」の既定文は英語かつ `{{ shop_name }}` などのLiquidタグ入りで、ページ本文に貼るとタグがそのまま表示される。** 日本語で書き直すか、タグを実値に置換してから貼ること |

---

## 6. 既知の制約(仕様上できないこと)

- **チェックアウト画面(連絡先・配送先住所・支払い)はテーマで作れない。** Shopify がホストしており、カスタマイズは Shopify Plus の checkout extensibility 限定
- **カート画面では税額・送料は確定しない。** 現在は税込価格からの逆算表示。実額はチェックアウトで計算される
- `shopify theme dev` はこのクラウド環境では使えない(localhost プレビューがユーザーのブラウザから開けないため)。**確認は必ず未公開テーマへ push → テーマエディタ**で行う
- **セッションのコンテナは毎回作り直されるため、Shopify CLI の認証は毎回消える。** `shopify theme push` を実行するとデバイス認証コードが出るので、ユーザーがリンクを開いて承認する必要がある(有効期限15分)。
  この環境には `xdg-open` が無く、無いと CLI が即エラー終了するので `~/bin/xdg-open`(exit 0 のダミー)を PATH に置いてから実行する。
  恒久対応は管理画面の **Theme Access** アプリでパスワードを発行し、`SHOPIFY_CLI_THEME_TOKEN` に設定する運用
- 非公開(下書き)のページはストアフロントのURL直打ちでは表示されない。確認はテーマエディタのテンプレート選択から行う

---

## 7. ブランドルールで注意していること

docs/00 の絶対ルールと、ユーザーの「参考HTMLを完全再現してほしい」という指示が衝突した場面がある。
**ユーザーが再指示した内容が優先**(当日発送・送料無料・30日返品などの文言はユーザーの商業判断として反映済み)。

ただし以下は事実に基づく実装のままにしてある。勝手に固定値のダミーへ変えないこと:

- **レビュー** — メタフィールドかブロック入力から算出。未入力時は「レビュー準備中」とプレースホルダー表示(架空の評価値は入れていない)
- **在庫「残りわずか」** — 実在庫に追従(「常に表示」「非表示」も設定で選べる)
- **セット割引** — 表示のみで決済に反映されない旨をエディタの説明文に明記済み
- **事業者情報(特商法)** — 未入力の項目は空欄のままにし、テーマエディタで入力を促す表示にしている(架空の住所・電話番号は入れない)

### 未解決の文言の衝突

アナウンスバーの初期値「本日15:00までのご注文で当日発送」と、
固定ページ・商品ページの配送表示「通常2〜3週間前後」は内容が食い違う。
docs/00 第12章は「『即納』『国内発送』と誤認させない」としているため、
どちらの表記に寄せるかユーザーの判断が必要(現状は両方そのまま)。

---

## 8. よく使うリンク

- テーマエディタ(**作業用** MORU Frontend Dev): https://rgy5ee-fv.myshopify.com/admin/themes/166341181680/editor
- テーマエディタ(MAIN / 参照のみ): https://rgy5ee-fv.myshopify.com/admin/themes/166203621616/editor
- 商品ページ: 上記 + `?previewPath=/products/asset-pack-108447793154-example-product-4`
- カテゴリーページ: 上記 + `?previewPath=/collections/asset-pack-108447793154-example-products`
- カート: 上記 + `?previewPath=/cart`
