# 06. 引き継ぎメモ(セッション間の申し送り)

> 最終更新: 2026-08-22
> 作業ブランチ: `claude/moru-living-shopify-dev-yvnmni`(旧: `claude/moru-living-shopify-setup-tg2rzr`)
> 対象ストア: `rgy5ee-fv.myshopify.com`
> 作業用テーマ: **MORU LIVING (Skeleton構築)** / theme id `166203621616`
> ⚠️ **2026-08-22 時点でこのテーマは `role: MAIN`(公開テーマ)。** docs は長らく「未公開」と書いていたが誤り。
> ストア自体はパスワード保護されているため一般には見えないが、`shopify theme push` はライブテーマへの上書きになる。
> 実行前に必ず `themes(first: 20) { nodes { id name role } }` で role を確認すること。

---

## 0. 直近のセッション(2026-08-22)

### 追記: 商品コンテンツのメタフィールド化 + 実商品登録(同日・2回目)

- **商品ごとの文言はメタフィールドで管理する設計に変更**(管理画面=入力フォーム、テーマ=表示)。
  定義: `custom.catch_copy`(リード文)/ `custom.subtitle` / `custom.specs`(素材・サイズ)/
  `custom.features`(メタオブジェクト `moru_feature` のリスト)。いずれも**メタフィールド優先 →
  セクション設定/ブロックにフォールバック**する実装なので、未入力でも壊れない
- 新セクション `moru-product-features`(この商品の特徴・画像と本文の交互レイアウト)を
  details と styling の間に追加
- **実商品「MORU フラワーラウンジ」登録済み**(旧ドラフトの作り替え・ACTIVE・¥9,980・
  カラー2色・在庫各3・バリアント画像割当・メタフィールド全投入)。
  ⚠️ 仕入れアプリ経由の商品は**POSチャネルにしか公開されない**ことがある(今回実際にそうだった)。
  `publishablePublish` でオンラインストアへ公開して解決
- 仕入元の中国語マーケ画像19枚(工場紹介など)をギャラリーから除外(絶対ルール4)
- コレクション `new-arrivals` / `cat-life` を作成し、トップ・商品テンプレートを接続
- 配送文言の衝突は解消: お届けバー初期値=「2〜3週間前後(国際配送)」、
  カート右上=送料無料訴求(ユーザー判断: アナウンスバーは送料無料・クーポン訴求のみ)
- 英語サンプル商品4点は削除(ユーザー指示)
- **残タスクと商品登録マニュアルは `docs/08_store_checklist.md`**



検索結果ページ / 404 / カートドロワー / 検索モーダル(予測検索)を実装し、
Skeleton の未使用セクション8本を削除。ライブテーマ `166203621616` へ push 済み、
MD5 照合で作業ツリーと一致を確認(差分は `config/settings_data.json` のみ = 既知の正規化)。

**検証済み:** docs/07 §4 の手順で実描画まで確認した(検索結果 / 0件時 / 404 / モバイル幅の
スクリーンショット、および検索モーダル・カートドロワーの操作テスト18項目)。
`shopify theme check` 0件、Liquid エラー・翻訳漏れなし。

**このセッションで見つけた仕様上の問題:**
Shopify の Predictive Search API は**日本語に対応していない**。
`#shopify-features` が `"predictiveSearch": false` を返し、`/search/suggest` は 417 を返す。
そのため検索モーダルは通常の検索インデックス(`/search?...&section_id=`)から候補を出している。
将来 Shopify が日本語に対応したら、コード変更なしで自動的に予測検索へ切り替わる。

---

## 1. 現状サマリー

Skeleton Theme をベースに、**トップ / 商品 / カテゴリー / カート** の4ページをワイヤーフレームとして構築済み。
デザインはユーザーが ChatGPT で生成した参考HTMLを、デザイントークンに載せ替えて再現している。

作業サイクルは固定:

1. 参考HTMLを受け取る(**そのまま移植せず、形とコンポーネントだけ参考にする**)
2. `sections/moru-*.liquid` を実装 or 修正
3. `shopify theme check` と Dev MCP `validate_theme` を通す
4. git commit → push
5. `shopify theme push --store=rgy5ee-fv.myshopify.com --theme 166203621616` でストアの未公開テーマへ反映
6. テーマエディタのリンクをユーザーに渡す

---

## 2. 完成済み

### テンプレート

| テンプレート | セクション構成 |
|---|---|
| `templates/index.json` | hero / product-grid(新着) / shop-the-room / category-browser / product-grid(チェア) / journal / instagram |
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
- `moru-predictive-search` — 予測検索の描画専用。テンプレートには置かない・schema なし(下記「検索・カートドロワーの仕組み」参照)

### スニペット

- `snippets/moru-product-card.liquid` — 商品カード(NEWバッジ・お気に入りアイコン・カラースウォッチ・サブタイトルをパラメータで切替)
- `snippets/css-variables.liquid` — テーマ設定 → CSSカスタムプロパティ

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
- `learn_shopify_api` を先に呼んで conversationId を取得する。
- Shopify の仕様は記憶で答えず `search_docs_chunks` で確認する。
- コミット前に `shopify theme check` を通す(現在オフェンス0)。

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

## 4. まだ作っていないページ(Skeletonの素のまま)

優先度順:

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
