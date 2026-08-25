# ローンチ阻害事項の全件監査(2026-08-25 / rev.2)

> **rev.2 で2点を訂正した。** 詳細は §0。
> 実査対象: ストア `rgy5ee-fv.myshopify.com` / テーマ **MORU Frontend Dev**(`166341181680`)と
> **MORU LIVING (Skeleton構築)**(`166203621616` = MAIN)。
> **テーマファイルは1バイトも変更していない。**Frontend の修正は ChatGPT 側の担当。

**分類:** 🔴 BLOCKER = 公開してはいけない / 🟡 WARNING = 公開できるが直したほうがよい / 🟢 OK

---

## 0. rev.2 の訂正

### 訂正1 — 「36商品中35商品が在庫0」は誤りだった

`product.totalInventory` が 0 と返るのを見て BLOCKER にしたが、
**`totalInventory` は在庫を追跡している商品しか集計しない。**

実測すると **257 Variant 中 255 が `inventoryItem.tracked = false`(在庫を追跡しない)** で、
**`availableForSale` は 257/257 すべて true。全商品が購入可能。**

→ **在庫はローンチ阻害ではない。BLOCKER から取り下げる。**
詳細は `ops/products/_inventory_audit_20260825.md`。

### 訂正2 — Frontend の現状認識

前回「未修正」として挙げた項目のうち、**以下は DEV で既に解消済み**(Owner 確認済み)。
**再度 BLOCKER として扱わない。**

| 解消済み(DEV) | 前回の扱い |
|---|---|
| PDP のプレースホルダーレビュー UI / レビューセクション / 上部 Rating(`show_rating=false`) | 🔴 → ✅ |
| 実在しない 5% bundle discount(DEV は `discount_percent=0`) | 🔴 → ✅ |
| 送料無料表示 ¥7,700(Header / PDP / Homepage) | 🔴 → ✅ |
| Cart **Drawer** のレビュー表示(v2 には存在しない) | 🔴 → ✅ |
| Cart Drawer は実際に適用された Discount のみ表示 | 🔴 → ✅ |
| 数量まとめ買い UI(1点/2点/3点以上/Variant混在/4点以上/Variant別価格再計算) | — → ✅ 実装済み |

**MAIN には上記の問題が残っている**が、それは DEV → MAIN の promotion で解消する話であり、
Frontend の未修正項目ではない。

---

## A. Owner 指定の確認項目(rev.2)

| # | 項目 | 判定 | 実査で分かったこと |
|---|---|---|---|
| 1 | 送料無料 ¥7,700 / ¥15,000 不整合 | 🟡 **WARNING** | ストア実設定は **¥7,700**(正式値・D-101)。**DEV の実表示は3箇所とも ¥7,700 に修正済み。**残るのは `locales/*.schema.json` の既定値4箇所のみ(新規セクション追加時に復活しうる)。ChatGPT が対応予定 |
| 2 | 30日返品表記 | 🔴 **BLOCKER** | **DEV にも残っている**(Homepage USP / PDP trust badge / Cart page)。文書側は「**不良・誤配送のみ・到着後7日以内**」。**同じサイトで正反対のことを言っている** |
| 3 | 返品/キャンセルポリシーとの矛盾 | 🔴 **BLOCKER** | 上記に加え、**Shopify に返金ポリシーが1件も存在しない**(実査)。チェックアウトにポリシーリンクが出ない |
| 4 | 新規会員 ¥500pt 表記 | 🔴 **BLOCKER** | DEV の Header announcement に残存。**ポイント制度の実体を確認できなかった。**実体が無ければ虚偽 |
| 5 | About / FAQ 等の未公開ページ | 🔴 **BLOCKER** | **6ページ中5ページが未公開**(`about` / `tokushoho` / `privacy` / `terms` / `faq`)。**特商法とプライバシーは法令上必須** |
| 6 | 空リンク | 🟡 WARNING | ホーム下部 CTA バナー2枚の `link` が空。フッターの `instagram_url` / `pinterest_url` / `line_url` / `legal_menu` も空 |
| 7 | CTA banner リンク | 🔴 **BLOCKER** | 上部 CTA バナー2枚目が `/collections/sale#promo`。**セールコレクションは0商品** |
| 8 | Sale collection 空 | 🔴 **BLOCKER** | handle `sale` / smart(TAG=`sale`)/ **0商品**。メインメニューの「セール」も同じ先 |
| 9 | Discount 0件 | 🔴 **BLOCKER** | `discountNodes` = 0件。Frontend は `preview_mode: true` で「SEASONAL SALE 10%」「PAIR 15%」「2点10%/3点15%」を表示している。**表示されている割引が1円も存在しない** |
| 10 | 「ベストセラー」の根拠 | 🔴 **BLOCKER** | **注文0件**(`ordersCount` = 0・EXACT)。DEV にも順位1〜5が残存。ChatGPT が表現変更予定 |
| 11 | Bought together の内容 | 🔴 **BLOCKER** | 注文0件。参照先 collection `cat-life` は**1商品しか入っていない**。DEV にも残存。ChatGPT が再設計予定 |
| 12 | 未公開ページへのリンク | 🔴 **BLOCKER** | フッターメニュー `footer-guide` / `footer-about` が**未公開5ページを指している → 404**(実査) |
| 13 | fake scarcity | 🟢 **OK** | 在庫カウントダウン・「残りわずか」・偽タイマーは**実装されていない**。PDP の在庫表示は追跡なし商品では**何も出さない**作り(実装を確認) |
| 14 | fake compare-at | 🟢 **OK**(DEV) | 商品の `compare_at_price` は**1件も設定されていない**。DEV の `moru-product-bundle` も `discount_percent: 0`。**MAIN には `5` が残っているが、promotion で解消する** |

### 追加で見つかったもの(Owner 指定リスト外)

| # | 項目 | 判定 | 内容 |
|---|---|---|---|
| 15 | **カートページの偽レビュー** | 🔴 **BLOCKER** | `templates/cart.json` の `review` ブロック(`stars: "5"` / `verified_label: "検証済みの購入者"`)。**DEV にも残存。**Cart **Drawer** ではなく `/cart` ページ側。ChatGPT が削除予定 |
| 16 | **「2年保証」** | 🔴 **BLOCKER** | DEV の Cart page に残存。保証主体と範囲の文書が無い。ChatGPT が削除予定 |
| 17 | **国際配送ゾーンが有効 × 全商品の重量 0kg** | 🔴 **BLOCKER** | 国際ゾーンの条件は「総重量 **0〜2kg** で ¥3,000」。**全商品の重量が 0kg**(実測)。つまり **¥92,480 のキャビネットが国際送料 ¥3,000 で注文できる。赤字確定** |
| 18 | **「速達 ¥3,762」** | 🔴 **BLOCKER** | 国内配送に条件なしの速達がある。実際の納期は**海外取り寄せで2〜3週間**。速達に見合う実態が無い(CLAUDE.md 絶対ルール5) |
| 19 | **返金ポリシー / 利用規約 / 配送ポリシーが存在しない** | 🔴 **BLOCKER** | `shop.shopPolicies` にあるのは**プライバシーポリシーのみ**。しかもそれは Shopify 既定テンプレートのままで、差し込みの `{{ phone }}` が**空** |
| 20 | **特商法の9項目が空** | 🔴 **BLOCKER** | 販売業者 / 運営統括責任者 / 所在地 / 電話番号 / メールアドレス / URL / 商品代金以外の必要料金 / 支払方法 / 支払時期。**すべて法定必須** |
| 21 | **プライバシー・利用規約のページが白紙** | 🔴 **BLOCKER** | テンプレートに見出ししか無く、Shopify 側の `body` も空。**公開すると白紙が出る** |
| 22 | **Contact のテンプレートが存在しない** | 🟡 WARNING | `templateSuffix: "contact"` を指しているが `templates/page.contact.json` が DEV・MAIN のどちらにも無い。**唯一の公開ページ**なので実機確認が要る |
| 23 | **在庫0の Variant が3件**(追跡なしなので売れてしまう) | 🟡 WARNING | マッシュルーム コードレステーブルランプ1件 / フラワー フロアクッション2件。**CKB 側で切れている可能性。発注可能か確認が要る** |
| 24 | 「新着アイテム」が全商品 | 🟡 WARNING | collection `new-arrivals` の rule が `VARIANT_PRICE > 0` = 全36商品。NEW バッジ付きで全商品が出る。**ローンチ時点では事実だが、1ヶ月後には嘘になる** |
| 25 | 「あわせて楽しむアイテム」も全商品 | 🟡 WARNING | PDP の関連商品が `new-arrivals`(=全商品)。関連性が無い |
| 26 | DRAFT 商品4件 | 🟡 WARNING | アブストラクト オブジェ / セル モジュールキャビネット / プラッシュ クッション / **ルナ ウォールライト**。ルナは**まとめ買い推奨13に入っている** |
| 27 | `review-required` タグ2件 | 🟡 WARNING | 手編みコースター / レジン スカルプチャーオブジェ。**手編みコースターは推奨13の筆頭** |
| 28 | MORU フラワーラウンジだけ在庫追跡あり | 🟡 WARNING | 唯一 `tracked=true`・10点。**10点売れたら売り切れになる。**他35商品と運用が違う |
| 29 | About の画像が未設定 / 見出しが猫寄り | 🟡 WARNING | 3ブロックとも画像なし。見出し「猫用品だから、インテリアを諦めない」は v0.2 の **Pet-first, Interior-always.** と方向が違う |
| 30 | 未確認の寸法・素材 | 🟡 WARNING | `ops/products/_unverified_report.md` に一覧 |

### 集計(rev.2)

**🔴 BLOCKER 15件 / 🟡 WARNING 13件 / 🟢 OK 2件**

BLOCKER の内訳:

| 種類 | 件数 | 内容 |
|---|---|---|
| **Owner にしかできない** | **7** | #2/#3(返品条件の決定)・#4(¥500pt の事実確認)・#5(5ページ公開)・#19(ポリシー作成)・#20(特商法9項目)・#21(本文用意)・#16(2年保証の事実確認) |
| **Backend(Claude Code が承認後にやる)** | **4** | #7/#8(SALE collection と Discount)・#9(Discount 作成)・#17(国際配送)・#18(速達) |
| **Frontend(ChatGPT が対応予定)** | **4** | #2(30日返品表示)・#10(ベストセラー)・#11(Bought together)・#15(カート偽レビュー) |

---

## B. Frontend に伝える追加の不整合(ChatGPT 担当)

**F-1〜F-8 は Owner から共有済みの既知項目なので繰り返さない。**以下は**今回新しく出たもの**。

| # | 場所 | 内容 | 提案 |
|---|---|---|---|
| **N-1** | `moru-quantity-offers` の「4点以上」表示 | Function の刻みは **2点=10% / 3点以上=15% の2段だけ**。4点でも5点でも6点でも **15%のまま**。「もっと買うともっと安くなる」と読める段組みは事実に反する | 4点以降は「3点以上 15%」と同じ扱いで見せる。**段を増やして見せない** |
| **N-2** | `moru-product-promotions` の `mix_two_rate` / `mix_three_rate` | 率(10%/15%)は Function と**一致している** ✅。ただし合算されるのは **同一 Product 内の Variant 混在だけ**。別 Product を混ぜても数量割引は付かない | 文言を「**同じ商品の中で**色や柄を混ぜても合算されます」に限定する |
| **N-3** | PDP の想定割引額の計算基準 | ベルベット クッション(価格4段)・パイピング(3段)・ブランケット(2段)・セラミック ブックエンド(2段)は **Variant で単価が違う**。最小価格で計算すると実額とズレる | **選択中の Variant 価格で計算する**(Owner 情報では「Variant別価格再計算」まで実装済みとのことなので、既に対応済みなら不要) |
| **N-4** | ペア割引の表示 | Pair Function は **`setCount`(= 各商品の数量の最小値)で頭打ち**にしている。「A×2 + B×3」なら **B の3個目は割引対象外** | PDP / カートで「ペアが何組成立しているか」を出すなら、この上限に合わせる |
| **N-5** | 割引と送料無料の干渉 | しきい値は**割引後の小計**で判定される。10%: 小計 ¥7,700〜¥8,555 / 15%: ¥7,700〜¥9,058 が危険帯。**推奨13商品だけのカゴで6パターン**が実際に該当(全て ¥7,960 → ¥7,164) | カートで「**あと ¥536 で送料無料**」を出して買い足しに誘導するのが、金額を変えずにできる最も素直な対処 |
| **N-6** | PDP の `inventory_json` | `moru-main-product.liquid` 316行目で全 Variant の `inventory_quantity` を HTML に埋めている。**Admin 側には仕入れ元の在庫がそのまま入っており、最大 773,835 という値がある**。Liquid が追跡なし Variant に 0 を返すか生値を返すかは要確認 | **表示ロジックには影響しない**(`inventory_management != blank` でガードされている)。HTML に出るかだけ実機確認 |
| **N-7** | `sections/moru-product-details.liquid`(DEV) | レビュー UI を消したのは良いが、**`{% schema %}` の `@app` ブロック対応も一緒に消えている**。将来レビューアプリを入れるとき PDP のこの位置にアプリブロックを差せない。加えて schema の `name` が **`"商品詳細アコーディオン"` と日本語直書き**で、CLAUDE.md 絶対ルール12(翻訳キー管理)に反する | `@app` を schema に残すか、意図的に外したのかを確認。`name` は `t:` キーに戻す |
| **N-8** | Contact ページ | `templateSuffix: "contact"` を指しているが **`templates/page.contact.json` が DEV・MAIN のどちらにも無い** | 実機で `/pages/contact` を確認。必要ならテンプレートを作る |

---

## C. 送料無料 ¥7,700 — 残っている ¥15,000(rev.2)

**ストア設定は元から ¥7,700。変更していない。**

### 🔴 未修正(ChatGPT 側)

| ファイル | 行 | 内容 |
|---|---|---|
| `locales/ja.default.schema.json` | 142 | `"¥15,000以上のご購入で送料無料 / 新規会員登録で¥500ptプレゼント"` |
| `locales/ja.default.schema.json` | 266 | `"¥15,000以上のご注文で送料無料"` |
| `locales/en.schema.json` | 142 | `"Free shipping over ¥15,000 / ¥500 in points when you sign up"` |
| `locales/en.schema.json` | 266 | `"Free shipping on orders over ¥15,000"` |

**セクションを追加し直したときの既定値**なので、今は画面に出ていなくても将来復活する。
「¥500ptプレゼント」も §A-4 の確認結果しだいで消す必要がある。

⚠️ **`locales` は MAIN のほうがファイルサイズが大きい。**DEV の内容で単純上書きすると
MAIN のセクションが使っている `t:` キーが消えるおそれがある。**マージが要る**(`ops/theme/_dev_to_main_20260825.md`)。

### ✅ 修正済み(DEV)

`sections/header-group.json`(アナウンスバー)/ `templates/product.json`(信頼バッジ)/
`templates/index.json`(ホーム USP)— 3箇所とも ¥7,700。

### docs

`docs/02` `docs/06_handoff` `docs/08` `docs/10` `docs/12` を ¥7,700 に統一済み(D-101)。

---

## D. ローンチまでの最短順序(rev.2)

| 順 | やること | 担当 | 依存 |
|---|---|---|---|
| 1 | **返品条件を決める**(7日・不良のみ / 30日・お客様都合可) | Owner | — |
| 2 | **Shopify に返金ポリシー・利用規約を作成する**(現在ゼロ) | Owner | 1 |
| 3 | **特商法の空欄9項目を埋める**+ ストア設定の電話番号を入れる | Owner | — |
| 4 | **プライバシー・利用規約の本文を用意する**(ページが白紙) | Owner | 2 |
| 5 | **¥500pt と 2年保証 の実体を確認する。**無ければ表記を消す | Owner | — |
| 6 | **5ページを公開する** | Owner | 3・4 |
| 7 | **国際配送ゾーンを止める(または重量条件を直す)** | Owner 承認 → Claude Code | — |
| 8 | **「速達 ¥3,762」を止める** | Owner 承認 → Claude Code | — |
| 9 | Frontend の §B と既知 F-1〜F-8 を直す | ChatGPT | 1・5 |
| 10 | `locales` の ¥15,000 既定値4箇所を直す | ChatGPT | — |
| 11 | **CKB 原価を入れる → Phase A 監査 → 価格確定** | Owner → Claude Code | — |
| 12 | SALE 対象確定 → タグ付け → Discount 作成 | Owner → Claude Code | 11 |
| 13 | multi-buy 対象確定 → metafield 設定 → Discount 作成 | Owner → Claude Code | 11 |
| 14 | ペア対象確定 → Discount + config metafield | Owner → Claude Code | 11 |
| 15 | **DEV → MAIN の差分を取り直して** promotion manifest を再作成 | Claude Code | 9・10 |
| 16 | MAIN 反映(Owner が「MAIN反映実行」と明示した後のみ) | Owner → Claude Code | 15 + theme token |

**1〜6 は Owner にしかできない。**ここが今の実質的なクリティカルパス。
**在庫は阻害要因ではなくなった**ので、その分だけ道は短くなっている。
