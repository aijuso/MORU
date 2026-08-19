# 04. 実装メモ — Skeletonベースのゼロ構築方針

## 方針

- ベーステーマ: **Shopify Skeleton Theme**(公式の最小テーマ。装飾なし、必須の配管のみ)
  - 取得: `shopify theme init`(Skeletonを選択)または https://github.com/Shopify/skeleton-theme
  - Horizonからのコード流用はしない。デザイン・CSS・セクションは100% MORU専用に自作
- Skeletonを初期コミットとして取り込み、以後の差分がすべてMORUの実装になるようにする
- OS 2.0構成(JSON templates + sections + blocks)。settings_schemaでdesign tokenを定義

## ストア

- `rgy5ee-fv.myshopify.com`
- ローカルプレビュー: `shopify theme dev --store=rgy5ee-fv.myshopify.com`(development themeとして動作、本番非破壊)
- 納品: `shopify theme package` またはリポジトリZIP化 → 管理画面アップロード

## MCPセットアップ(初回に実施)

### 1. Shopify Dev MCP(必須・認証不要)
```bash
claude mcp add --transport stdio shopify-dev-mcp -- npx -y @shopify/dev-mcp@latest
```
- 用途: ドキュメント検索 / Admin・Storefront GraphQLスキーマ / **Liquid・GraphQLのコード検証**
- CLAUDE.mdの使用ルール(learn_shopify_api / validate_*)を厳守

### 2. Admin API MCP(任意・ストア実データの読み書き)
- Shopify管理画面 → 設定 → アプリと販売チャネル → アプリ開発 → カスタムアプリ作成
- スコープは最小権限: まず `read_products` `read_orders` のみ。商品登録を任せる段階で `write_products` を追加
- トークンは環境変数で管理。設定ファイルへのハードコード・コミット禁止
- 用途例: フラワーラウンジの商品・バリアント登録、テスト販売の注文確認

### 3. Higgsfield MCP(任意・画像/動画生成)
- Higgsfield公式コネクタをClaude設定から接続(APIキー不要、アカウントログイン)
- 用途: 部屋の背景素材・バナー・絵コンテ・Journal用イメージ
- **禁止**: 商品本体の形状・サイズ・猫の沈み込みを誤認させる生成/合成(docs/00 第8章)。商品が写る正式ビジュアルは実物撮影が正

## design token(最初のタスク)

`config/settings_schema.json` にカラー(docs/01のBase+Accent)とフォントピッカーを定義し、
`snippets/` または `assets/base.css` でCSSカスタムプロパティに変換:
```css
:root {
  --color-bg: #F4EEE5;        /* Warm Ivory */
  --color-bg-alt: #E8DDCD;    /* Soft Cream */
  --color-wood: #C69A6A;      /* Natural Wood */
  --color-text: #2C2926;      /* Charcoal */
  --color-accent-olive: #777A52;
  --color-accent-terracotta: #C9653D;
  --color-accent-blue: #71899A;
  --color-accent-burgundy: #713C3D;
}
```
以後、色のHEX直書き禁止。すべて変数参照。

## 構築するセクション一覧(すべて新規自作)

| ファイル | 対応 |
|---|---|
| `sections/moru-announcement.liquid` | docs/02 §1 |
| `sections/moru-header.liquid` | docs/02 §2(header-group) |
| `sections/moru-hero.liquid` | docs/02 §3 |
| `sections/moru-product-carousel.liquid` | docs/02 §4(汎用: コレクション差し替えでBest Sellers等に転用可) |
| `sections/moru-shop-the-room.liquid` | docs/02 §5 |
| `sections/moru-category-browser.liquid` | docs/02 §6 |
| `sections/moru-journal.liquid` | docs/02 §7 |
| `sections/moru-instagram.liquid` | docs/02 §8 |
| `sections/moru-footer.liquid` | docs/02 §9(footer-group) |
| `sections/moru-product-*.liquid` 群 | docs/03(main-product + 下部セクション) |

## 実装順(推奨)

1. Skeleton取り込み+リポジトリ初期化+MCPセットアップ
2. design token(settings_schema + base.css)+タイポグラフィ
3. Header / Announcement / Footer
4. 商品カード snippet(正方形画像・スウォッチ対応)← 以後の全セクションが依存
5. Hero+新着カルーセル → index.json組み上げ
6. 商品ページ(フラワーラウンジをdevストアに登録して実データ検証)
7. 部屋で見る / カテゴリーから探す / 読みもの / Instagram
8. コレクションページ(最小)・カート・404等のシステムページを世界観に揃える
9. theme check全通過+モバイル確認+ZIPパッケージ

## 品質基準

- `shopify theme check` エラーゼロ
- 画像は width/height or aspect-ratio指定でCLSゼロを目標
- `prefers-reduced-motion` 対応(カルーセルautoplay停止)
- Lighthouse(モバイル)Performance 80+ を目安
- JSはvanilla(custom elements推奨)。外部ライブラリ禁止
