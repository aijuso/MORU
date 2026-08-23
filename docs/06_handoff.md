# 06. 引き継ぎメモ(セッション間の申し送り)

> 最終更新: 2026-08-23(v0.2 全面改訂セッション)
> 作業ブランチ: `claude/moru-living-shopify-dev-yvnmni`(旧: `claude/moru-living-shopify-setup-tg2rzr`)
> 対象ストア: `rgy5ee-fv.myshopify.com`
> 作業用テーマ: **MORU LIVING (Skeleton構築)** / theme id `166203621616`
> ⚠️ **2026-08-22 時点でこのテーマは `role: MAIN`(公開テーマ)。** docs は長らく「未公開」と書いていたが誤り。
> ストア自体はパスワード保護されているため一般には見えないが、`shopify theme push` はライブテーマへの上書きになる。
> 実行前に必ず `themes(first: 20) { nodes { id name role } }` で role を確認すること。

---

## 0. 直近のセッション(2026-08-23 夜)— **v0.2 全面改訂(ドキュメントのみ)**

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
| `CLAUDE.md` | 絶対ルール13項目に再編・ステータス更新 |

### ⚠️ 次のセッションが最初に確認すべきこと(v0.2 分)

| 状態 | 内容 |
|---|---|
| **未受領** | **リファレンスシート画像5枚がリポジトリに無い。** オーナーはチャットに添付したが、この実行環境はチャット添付画像をファイル化できなかった(`/mnt/attach` が空)。テキスト版のみ在り |
| **未受領** | **`home_v3_upper.png` / `home_v3_lower.png` は添付そのものが無かった。** docs/02 v3 はプロンプト本文だけを根拠にしている。**余白・比率・カード寸法は未確定** |
| **未着手** | テーマ実装への反映(design token 色替え / ヘッダー改修 / ホーム v3 化)。**オーナー承認待ち** |
| **不整合** | v0.2 プロンプトは「前回の引き継ぎ(`docs/06_decisions_log.md`)」を参照していたが、**そのファイルはこのリポジトリに存在しなかった。** 別クローンの記憶と思われる。今回新設し、2026-08-23 から記録を開始した |
| **不整合** | v0.2 プロンプトは `ops/products/` と `.claude/skills/product-registration/` の「全面改訂」を指示したが、**どちらもこのリポジトリに存在しなかった。** スキルは新規作成した。`ops/` は商品登録の実作業時に作る |
| **不整合** | v0.2 プロンプトは旧 `brand_board.png` に言及したが、**このリポジトリには無い**(あるのは `home_v2_final.png` のみ) |

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
| テーマ `166203621616` は**公開テーマ(MAIN)** | docs が「未公開」と書いていたのが誤り。push 前に必ず role 確認(docs/07 §2) |
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
5. `shopify theme push --store=rgy5ee-fv.myshopify.com --theme 166203621616 --allow-live` で反映
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

- テーマエディタ: https://rgy5ee-fv.myshopify.com/admin/themes/166203621616/editor
- 商品ページ: 上記 + `?previewPath=/products/asset-pack-108447793154-example-product-4`
- カテゴリーページ: 上記 + `?previewPath=/collections/asset-pack-108447793154-example-products`
- カート: 上記 + `?previewPath=/cart`
