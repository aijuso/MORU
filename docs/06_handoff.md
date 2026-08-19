# 06. 引き継ぎメモ(セッション間の申し送り)

> 最終更新: 2026-08-19
> 作業ブランチ: `claude/moru-living-shopify-setup-tg2rzr`
> 対象ストア: `rgy5ee-fv.myshopify.com`
> 作業用テーマ: **MORU LIVING (Skeleton構築)** / theme id `166203621616`(未公開)

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
| `sections/header-group.json` | moru-announcement / moru-header |
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

### 空状態フォールバック

商品・コレクション・ブログ・画像が未設定でも崩れないこと。プレースホルダー表示は必ず「これはサンプルです」と分かる文言にする。

---

## 4. まだ作っていないページ(Skeletonの素のまま)

優先度順:

| 優先 | テンプレート | 現状のセクション | 内容 |
|---|---|---|---|
| 高 | `templates/page.json` | `sections/page.liquid` | 固定ページ。About / 特定商取引法 / プライバシーポリシー / 利用規約 / よくある質問。docs/00 第12章の文言が必要 |
| 高 | `templates/search.json` | `sections/search.liquid` | 検索結果。`moru-collection-grid` の作りを流用できる |
| 中 | `templates/blog.json` | `sections/blog.liquid` | 読みもの一覧。`moru-journal` のカードを流用 |
| 中 | `templates/article.json` | `sections/article.liquid` | 読みもの詳細(記事本文・関連記事) |
| 中 | `templates/404.json` | `sections/404.liquid` | 404 ページ |
| 低 | `templates/list-collections.json` | `sections/collections.liquid` | コレクション一覧 |
| 低 | `templates/password.json` | `sections/password.liquid` | パスワードページ |
| 低 | `templates/gift_card.liquid` | — | ギフトカード |

### ページ以外で未実装

- **カートドロワー** — ヘッダーのカートアイコンは現在 `/cart` へのリンク。ドロワー化は未実装
- **検索モーダル** — ヘッダーの検索アイコンは `/search` へのリンク
- **`moru-category-browser` のタブ切替** — 現状は円形カテゴリのリンクのみ(クリックでコレクションへ遷移)。同一ページ内でのフェード切替は未実装
- **お気に入り(ウィッシュリスト)** — 商品ページ・カードのボタンは見た目のみ。保存にはアプリが必要

### 掃除したいもの

Skeleton の未使用ファイルが残っている。`moru-*` に置き換え済みなので削除してよい:
`sections/header.liquid` `sections/footer.liquid` `sections/product.liquid` `sections/collection.liquid` `sections/hello-world.liquid` `sections/custom-section.liquid`
(削除前に `templates/*.json` と `*-group.json` から参照が無いことを確認する)

---

## 5. ストア側でユーザーの対応が必要なこと

| 項目 | 内容 |
|---|---|
| 商品データ | ACTIVE商品はサンプル4点のみ・**在庫0・バリエーションなし**。そのためカートボタンが「売り切れ」、カラー/サイズ選択が出ない。ドラフトに猫ベッド商品(2バリアント・在庫3)あり |
| タグ | カテゴリーページのタブは商品タグから生成。タグ未設定だとタブが出ない |
| カラースウォッチ | 管理画面「設定 → 商品のオプション」でカラーオプションにスウォッチ色を設定すると表示される |
| エクスプレスチェックアウト | 「設定 → 決済 → スピードアップチェックアウト」を有効にすると Shop Pay / Apple Pay / Google Pay が出る |
| セット割引 | カート/商品ページの割引表示は見た目のみ。実際に効かせるには管理画面「割引」で自動割引を作成する |
| クーポン | カートのクーポン欄は Shopify の `/discount/CODE` を使うので、割引コードを作れば実際に効く |

---

## 6. 既知の制約(仕様上できないこと)

- **チェックアウト画面(連絡先・配送先住所・支払い)はテーマで作れない。** Shopify がホストしており、カスタマイズは Shopify Plus の checkout extensibility 限定
- **カート画面では税額・送料は確定しない。** 現在は税込価格からの逆算表示。実額はチェックアウトで計算される
- `shopify theme dev` はこのクラウド環境では使えない(localhost プレビューがユーザーのブラウザから開けないため)。**確認は必ず未公開テーマへ push → テーマエディタ**で行う

---

## 7. ブランドルールで注意していること

docs/00 の絶対ルールと、ユーザーの「参考HTMLを完全再現してほしい」という指示が衝突した場面がある。
**ユーザーが再指示した内容が優先**(当日発送・送料無料・30日返品などの文言はユーザーの商業判断として反映済み)。

ただし以下は事実に基づく実装のままにしてある。勝手に固定値のダミーへ変えないこと:

- **レビュー** — メタフィールドかブロック入力から算出。未入力時は「レビュー準備中」とプレースホルダー表示(架空の評価値は入れていない)
- **在庫「残りわずか」** — 実在庫に追従(「常に表示」「非表示」も設定で選べる)
- **セット割引** — 表示のみで決済に反映されない旨をエディタの説明文に明記済み

---

## 8. よく使うリンク

- テーマエディタ: https://rgy5ee-fv.myshopify.com/admin/themes/166203621616/editor
- 商品ページ: 上記 + `?previewPath=/products/asset-pack-108447793154-example-product-4`
- カテゴリーページ: 上記 + `?previewPath=/collections/asset-pack-108447793154-example-products`
- カート: 上記 + `?previewPath=/cart`
