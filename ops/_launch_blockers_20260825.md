# ローンチ阻害事項の全件監査(2026-08-25)

> 実査対象: ストア `rgy5ee-fv.myshopify.com` / テーマ **MORU Frontend Dev**(`166341181680`)と
> **MORU LIVING (Skeleton構築)**(`166203621616` = MAIN)の両方。
> **テーマファイルは1バイトも変更していない。**Frontend の修正は ChatGPT 側の担当なので、
> **指摘としてまとめてある**(§B)。

**分類:** 🔴 BLOCKER = 公開してはいけない / 🟡 WARNING = 公開できるが直したほうがよい / 🟢 OK

---

## A. Owner 指定の確認項目

| # | 項目 | 判定 | 実査で分かったこと |
|---|---|---|---|
| 1 | 送料無料 ¥7,700 / ¥15,000 不整合 | 🔴 **BLOCKER** | **ストアの実設定は ¥7,700**(`deliveryProfiles` 国内配送 TOTAL_PRICE ≧ 7700 で送料0)。MAIN テーマは **¥15,000 と表示している**(アナウンスバー・PDP 信頼バッジ・ホーム USP)。**現状は虚偽表示。** DEV テーマ側は既に ¥7,700 に直っている(§C) |
| 2 | 30日返品表記 | 🔴 **BLOCKER** | ホーム USP「**30日間の返品・交換**」/ PDP 信頼バッジ「**30日返品対応**」/ カート「30日返品対応」。一方 PDP のアコーディオン本文は「**不良・誤配送の場合は商品到着後7日以内**」「お客様都合のキャンセル・変更は原則承れません」。**同じページの中で矛盾している** |
| 3 | 返品/キャンセルポリシーとの矛盾 | 🔴 **BLOCKER** | 上記と同じ。さらに **返品ポリシーページが未公開**なので、正となる文書が客に見えない |
| 4 | 新規会員 ¥500pt 表記 | 🔴 **BLOCKER** | アナウンスバーが「**新規会員登録で¥500ptプレゼント**」と言っている。**ストアにポイント制度の実体を確認できなかった**(Shopify Basic・ロイヤルティアプリの導入を Admin API から確認できず)。**実体が無ければ虚偽。**Owner に事実確認をお願いする |
| 5 | About / FAQ 等の未公開ページ | 🔴 **BLOCKER** | **6ページ中5ページが未公開。**`about`・`tokushoho`(特定商取引法)・`privacy`・`terms`・`faq` すべて `isPublished: false`。**特商法とプライバシーポリシーは法令上必須。**公開済みは `contact` のみ |
| 6 | 空リンク | 🟡 WARNING | ホーム下部 CTA バナー2枚(`cta_banners_2`)の `link` が **両方とも空**。フッターの `instagram_url` / `pinterest_url` / `line_url` / `legal_menu` も空 |
| 7 | CTA banner リンク | 🔴 **BLOCKER** | 上部 CTA バナー2枚目が `/collections/sale#promo` を指しているが、**セールコレクションは0商品**。押すと空のページに着く |
| 8 | Sale collection 空 | 🔴 **BLOCKER** | handle `sale` / smart(rule: TAG = `sale`)/ **0商品**。#7 の原因 |
| 9 | Discount 0件 | 🔴 **BLOCKER** | `discountNodes` = **0件**。にもかかわらず Frontend は「SEASONAL SALE 10%」「PAIR IT YOUR WAY 15%」「まとめて買うとお得 2点10%/3点15%」を表示している(`preview_mode: true`)。**表示されている割引が1円も存在しない** |
| 10 | 「ベストセラー」の根拠 | 🔴 **BLOCKER** | **注文0件**(`ordersCount` = 0・EXACT)。ホームの「ベストセラー」は**手動で選んだ5商品に順位を振っているだけ**で、販売実績の裏付けが無い。docs/01 §4 の「その表示が事実か」に反する |
| 11 | Bought together の内容 | 🔴 **BLOCKER** | PDP の「**よく一緒に購入されています**」が collection `cat-life` を出しているだけ。**`cat-life` は1商品しか入っていない**(rule: TYPE=猫用ベッド OR TAG=猫のくらし)。かつ注文0件なので「よく一緒に購入されて」いる事実が無い |
| 12 | 未公開ページへのリンク | 🔴 **BLOCKER** | フッターのメニュー(`footer-guide` / `footer-about`)から #5 の未公開ページへ導線がある想定。**未公開ページへのリンクは 404 になる** |
| 13 | fake scarcity | 🟢 OK | 在庫カウントダウン・「残りわずか」・偽タイマーは**実装されていない**。PDP の在庫表示は `stock_display: "inventory"` で実在庫連動 |
| 14 | fake compare-at | 🟡 → 🔴 | **商品の `compare_at_price` は1件も設定されていない**(✅)。**ただし MAIN テーマの PDP に `moru-product-bundle` の `discount_percent: 5` が入っている。**実在しない5%割引を表示している = **偽割引**。DEV テーマでは `0` に直っている(§C) |

### 追加で見つかったもの(Owner 指定リスト外)

| # | 項目 | 判定 | 内容 |
|---|---|---|---|
| 15 | **カートの偽レビュー** | 🔴 **BLOCKER** | `templates/cart.json` に `review` ブロック(`stars: "5"` / `verified_label: "検証済みの購入者"`)。**注文0件のストアで「検証済みの購入者」の星5レビューを出している。DEV・MAIN の両方に存在する** |
| 16 | **PDP のプレースホルダーレビュー** | 🔴 **BLOCKER**(MAIN のみ) | MAIN の `moru-product-details.liquid` は、レビューが無いとき**ダミーのレビューカードを3枚描画する**。ストアフロントに出る。**DEV ではレビュー UI ごと削除されているので DEV 側は解消済み** |
| 17 | 「2年保証」 | 🔴 **BLOCKER** | カートの信頼バッジに「**2年保証**」。**保証の実体を確認できなかった。**海外取り寄せモデルで2年保証を出すなら、保証主体と範囲の文書が要る |
| 18 | 在庫が実質ゼロ | 🔴 **BLOCKER** | **36商品中35商品の `totalInventory` が 0。**在庫があるのは MORU フラワーラウンジ(10)のみ。この状態で公開すると**ほぼ全商品が売り切れ表示か、在庫追跡なしで無制限に売れる**かのどちらかになる。**どちらも事故** |
| 19 | 「新着アイテム」が全商品 | 🟡 WARNING | collection `new-arrivals` の rule が **VARIANT_PRICE > 0** = 全36商品。ホームの「新着アイテム」に NEW バッジ付きで全商品が出る。**ローンチ時点では事実として正しい**が、1ヶ月後には嘘になる。運用の期限を決めておく |
| 20 | 「あわせて楽しむアイテム」も全商品 | 🟡 WARNING | PDP の関連商品が collection `new-arrivals`(=全商品)。関連性が無い |
| 21 | DRAFT 商品4件 | 🟡 WARNING | アブストラクト オブジェ / セル モジュールキャビネット / プラッシュ クッション / ルナ ウォールライト。**ルナ ウォールライトは multi-buy 推奨13に入っている**ので、公開しないと対象にできない |
| 22 | `review-required` タグ2件 | 🟡 WARNING | 手編みコースター / レジン スカルプチャーオブジェ。**手編みコースターは multi-buy 推奨13の筆頭** |
| 23 | 未確認の寸法・素材 | 🟡 WARNING | `ops/products/_unverified_report.md` に一覧。「確認中」表記のまま公開するかは Owner 判断 |

### 集計

**🔴 BLOCKER 15件 / 🟡 WARNING 7件 / 🟢 OK 1件**

---

## B. Frontend 側で直す必要があるもの(ChatGPT 担当)

**Claude Code はテーマファイルを変更していない。**以下は指摘のみ。

### B-1. バックエンド仕様と矛盾しているもの

| # | 場所 | 何が矛盾しているか | どう直すか(提案) |
|---|---|---|---|
| F-1 | `templates/product.json` → `quantity_offers` の `offer_scope: "all"` | **Function は `custom.multi_buy_eligible` が true の商品にしか割引しない(fail-closed)。**`offer_scope: "all"` だと**対象外の商品にも「2点10%」が表示される**。表示と実計算が食い違う | `offer_scope` を **metafield 連動**にする。`product.metafields.custom.multi_buy_eligible` が true のときだけ描画する |
| F-2 | `moru-quantity-offers` の「4点/5点/6点」表示 | Function の刻みは **2点=10% / 3点以上=15% の2段だけ**。4点でも5点でも15%のまま。**「もっと買うともっと安くなる」と読める表示は事実に反する** | 4点以降は「3点以上 15%」と同じ表示にする。段を増やして見せない |
| F-3 | `moru-product-promotions` の `mix_two_rate` / `mix_three_rate` | Variant 混在時の率(10% / 15%)は Function と**一致している** ✅。ただし**「同一 Product 内の Variant 混在」に限る**。別 Product を混ぜても数量割引は付かない | 文言を「**同じ商品の中で**色や柄を混ぜても合算されます」に限定する |
| F-4 | PDP の「想定10% / 15%」表示が最小価格基準の場合 | ベルベット クッション(価格4段)・パイピング(3段)・ブランケット(2段)は**Variant で単価が違う**ため、最小価格で計算した想定額は実額とズレる | 選択中の Variant 価格で計算する |
| F-5 | `templates/cart.json` の `review` ブロック | **注文0件で「検証済みの購入者」星5レビュー。**偽レビュー(docs/00 第11章・絶対ルール6) | **ブロックごと削除** |
| F-6 | `moru-product-bundle` の `discount_percent` | MAIN は `5`。**実在しない5%割引**。DEV は `0` で解消済み | MAIN 側の値を promotion で上書きする(§C の allowlist に含めた) |
| F-7 | ホーム「ベストセラー」 | 注文0件で順位を表示している | **「注目のアイテム」等、実績を主張しない見出しに変える。**または非表示 |
| F-8 | PDP「よく一緒に購入されています」 | 注文0件。かつ参照先 collection `cat-life` は1商品 | **「あわせて使うと」等に変え、参照先を意味のあるコレクションに変える。**または非表示 |
| F-9 | USP / 信頼バッジの「30日間の返品・交換」「2年保証」 | 実ポリシー(不良・誤配送のみ7日以内)と矛盾 | **実ポリシーに合わせて書き換える。**Owner が実際に30日返品を運用するなら、逆にアコーディオン本文を直す |
| F-10 | アナウンスバー「新規会員登録で¥500ptプレゼント」 | ポイント制度の実体を確認できなかった | 実体が無ければ**削除** |
| F-11 | ホーム下部 CTA バナー2枚の `link` が空 | 押しても何も起きない | リンクを入れるか、バナーを外す |
| F-12 | `preview_mode: true` のまま公開する場合 | Discount が0件なので、表示だけがある状態 | **Discount を作るまでは preview セクションを非表示にする**か、「準備中」と明示する |

### B-2. Frontend 側が既に直しているもの(確認済み・良い)

| 場所 | 内容 |
|---|---|
| `sections/header-group.json` | アナウンスバーを **¥7,700** に修正済み ✅ |
| `templates/product.json` | 信頼バッジを **¥7,700** に修正済み ✅ / `bundle.discount_percent` を **0** に修正済み ✅ / `show_rating: false` ✅ |
| `templates/index.json` | ホーム USP を **税込7,700円以上** に修正済み ✅ |
| `sections/moru-product-details.liquid` | **レビュー UI(プレースホルダー含む)を削除**し、アコーディオンだけにした ✅ |
| `templates/index.json` | `community_journal` / `weekly_picks` を **disabled**(空セクションを出さない)✅ |
| `templates/cart.json` | `moru-cart-discount-summary` を追加(**実 Shopify Discount を表示する**)✅ |

⚠️ ただし `moru-product-details.liquid` からレビューを消した副作用として、
**`{% schema %}` の `@app` ブロック対応も消えている。**将来レビューアプリを入れるとき、
PDP のこの位置にアプリブロックを差せなくなる。**意図的かどうか Owner に確認したい。**

⚠️ もう1点。DEV 版の同ファイルは schema の `name` を **`"商品詳細アコーディオン"` と日本語直書き**にしている。
MAIN 版は `t:moru.product_details.name` の翻訳キー。**CLAUDE.md 絶対ルール12(Liquid 直書き禁止)に反する。**

---

## C. 送料無料 ¥7,700 — repo 内の ¥15,000 表記(全件)

Owner 決定により **¥7,700 が正式値**。ストアの配送設定は既に ¥7,700 なので**変更不要**(触っていない)。

### C-1. テーマファイル(ChatGPT 担当・Claude Code は触らない)

| ファイル | 行 | 内容 | DEV テーマの現状 |
|---|---|---|---|
| `sections/header-group.json` | 17 | `"¥15,000以上のご購入で送料無料 / 新規会員登録で¥500ptプレゼント"` | ✅ **DEV は ¥7,700 に修正済み** |
| `templates/product.json` | 20 | `"¥15,000以上のご注文で\n全国送料無料"` | ✅ **DEV は ¥7,700 に修正済み** |
| `templates/index.json` | 73 | `"heading": "税込15,000円以上で送料無料"` | ✅ **DEV は 税込7,700円 に修正済み** |
| `locales/ja.default.schema.json` | 142 | `"text_default": "¥15,000以上のご購入で送料無料 / 新規会員登録で¥500ptプレゼント"` | ❌ **未修正**(schema の既定値) |
| `locales/ja.default.schema.json` | 266 | `"notice_text_default": "¥15,000以上のご注文で送料無料"` | ❌ **未修正** |
| `locales/en.schema.json` | 142 | `"Free shipping over ¥15,000 / ¥500 in points when you sign up"` | ❌ **未修正** |
| `locales/en.schema.json` | 266 | `"Free shipping on orders over ¥15,000"` | ❌ **未修正** |

> 🔴 **locales の4箇所が残っている。**これはテーマエディタで**セクションを追加し直したときの既定値**なので、
> 今は画面に出ていなくても**将来 ¥15,000 が復活する。**ChatGPT 側で直してほしい。
> あわせて「¥500ptプレゼント」も §A-4 の確認結果しだいで消す必要がある。

### C-2. docs(Claude Code 担当・**このセッションで ¥7,700 に統一済み**)

`docs/02_homepage_spec.md` / `docs/06_handoff.md` / `docs/06_decisions_log.md` /
`docs/08_store_checklist.md` / `docs/10_pricing_rules.md` / `docs/12_price_redesign_and_multibuy.md` /
`docs/_next_session_prompt.md` / `ops/products/_price_audit_20260824.md`

「¥15,000 と ¥7,700 のどちらに寄せるか未決」という記述をすべて
「**¥7,700 が正式値(D-101)。¥15,000 表記は不整合**」に書き換えた。

### C-3. 数量割引後に ¥7,700 を下回るケース

`ops/products/_multibuy_final_20260825.md` §D に全件。要点だけ:

| 割引 | 危険帯(割引前の小計) |
|---|---|
| 10%(2点) | ¥7,700 〜 ¥8,555 |
| 15%(3点以上) | ¥7,700 〜 ¥9,058 |
| ペア15% | ¥7,700 〜 ¥9,058 |

推奨13商品だけのカゴで実際に起きるのは **6パターン、いずれも ¥7,960 → ¥7,164**
(ガラスフラワー/ジャカード/バルーンドッグ/手編みコースター が ¥3,980×2、
フェイクファー/フランネル が ¥3,480+¥4,480)。
割引 ¥796 を受けて送料 ¥870 を失うため、**実質 ¥74 の損**になる。

ペア割引では **P-1(ベルベット+フランネル)の最小構成 ¥8,960 → ¥7,616** が該当。

> **新しい送料無料金額をこちらで設定していない。**選択肢の提示のみ。

---

## D. ローンチまでの最短順序(提案)

| 順 | やること | 担当 | 依存 |
|---|---|---|---|
| 1 | **在庫を入れる**(§A-18)。35商品が在庫0のまま公開できない | Owner | — |
| 2 | **5ページを公開する**(特商法・プライバシー・利用規約・FAQ・About) | Owner | 本文入力 |
| 3 | **返品ポリシーを1つに決める**(30日 or 7日)。決めてから表示を揃える | Owner | — |
| 4 | **¥500pt の実体を確認する**。無ければ表記を消す | Owner | — |
| 5 | **「2年保証」の実体を確認する**。無ければ表記を消す | Owner | — |
| 6 | Frontend の §B-1 を直す | ChatGPT | 3・4・5 の決定 |
| 7 | locales の ¥15,000 既定値4箇所を直す | ChatGPT | — |
| 8 | CKB 原価を入れる → Phase A 監査 → 価格確定 | Owner → Claude Code | — |
| 9 | SALE 対象を確定 → タグ付け → Discount 作成 | Owner → Claude Code | 8 |
| 10 | multi-buy 対象を確定 → metafield 設定 → Discount 作成 | Owner → Claude Code | 8 |
| 11 | ペア対象を確定 → Discount + config metafield | Owner → Claude Code | 8 |
| 12 | DEV → MAIN の promotion(`ops/theme/_dev_to_main_20260825.md`) | Owner 承認 → Claude Code | 6・7 |

**1〜5 は Owner にしかできない。**ここが今の実質的なクリティカルパス。
