# moru-living-theme

**MORU LIVING** — 人とペットのトレンド・インテリアブランドのShopifyテーマ。
Shopify **Skeleton Theme** ベースのゼロ構築(旧Horizon改修プロジェクトは廃止)。

## セットアップ手順(新リポジトリ)

1. GitHubで空のprivateリポジトリ `moru-living-theme` を作成
2. このドキュメントパッケージ(`CLAUDE.md`, `README.md`, `docs/`)をリポジトリ直下に配置して初回コミット
3. Claude Codeをリポジトリのフォルダで起動し、下の「最初の指示」を貼る
   (Skeletonの取り込み・MCP設定・初期化はClaude Codeが実施。認証のブラウザ承認のみ手動)

```
moru-living-theme/
├── CLAUDE.md                     ← Claude Codeの開発ガイド(最初に読む)
├── README.md
├── docs/
│   ├── 00_brand_master.md        ← ブランド引き継ぎドキュメント(最上位の正)
│   ├── 01_brand_guidelines.md    ← 実装用デザイン規定
│   ├── 02_homepage_spec.md       ← トップページ確定仕様
│   ├── 03_product_page_spec.md   ← 商品ページ仕様(フラワーラウンジ基準)
│   ├── 04_implementation_notes.md← Skeletonゼロ構築方針・MCP設定
│   ├── 05_build_workflow.md      ← セクション構築の標準手順
│   ├── mockups/
│   │   └── home_v2_final.png     ← トップページ確定デザイン
│   └── brand/
│       ├── logo_terracotta.png   ← ロゴ(ワードマーク)
│       ├── product_flower_lounge_ivory.webp
│       └── product_flower_lounge_olive.webp
└── (Skeleton Theme一式はClaude Codeが取り込み後にここへ入る)
```

## Claude Code への最初の指示(コピペ用)

> このリポジトリは、ライフスタイルブランド MORU LIVING のShopifyテーマを
> Skeleton Themeベースでゼロから構築するプロジェクトです。
> まず CLAUDE.md と docs/ 配下をすべて読み、docs/mockups/home_v2_final.png と
> docs/brand/ の素材を確認してください。
> その後、docs/04 の実装順に従って進めます。最初のタスク:
> 1. Shopify Skeleton Theme をリポジトリに取り込む(shopify theme init または公式リポジトリから)
> 2. Shopify Dev MCP をセットアップし、CLAUDE.mdのMCP使用ルールが機能することを確認
> 3. shopify theme dev --store=rgy5ee-fv.myshopify.com でプレビューを起動(認証は私が承認します)
> 4. design token(docs/01のカラー・フォント)を settings_schema と base.css に実装
> ここまで完了したら、実装内容と次の提案を報告してください。

## 補足

- Admin API MCP(ストア実データ連携)と Higgsfield MCP(画像生成)は任意。導入手順は docs/04 参照
- 納品形態はテーマZIP(Shopify管理画面アップロード可能な構造)
