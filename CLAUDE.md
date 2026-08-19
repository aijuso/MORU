# CLAUDE.md — MORU LIVING Shopify テーマ開発ガイド(ゼロ構築版)

このリポジトリは、ライフスタイルブランド **MORU(正式名称: MORU LIVING)** の
Shopifyテーマを **Skeleton Theme をベースにゼロから構築する** プロジェクトです。
旧プロジェクト(Horizonテーマ改修)は廃止。このリポジトリが唯一の正です。

**作業前に必ず `docs/` 配下をすべて読むこと。特に `docs/00_brand_master.md` が最上位のブランド文書。**

## ドキュメント構成

| ファイル | 内容 | 位置づけ |
|---|---|---|
| `docs/00_brand_master.md` | ブランド引き継ぎドキュメント全文(戦略・商品・広告・KPI) | **最上位の正。** 他のdocsと矛盾したらこちらが勝つ |
| `docs/01_brand_guidelines.md` | 実装用に要約したデザイン規定(カラー/フォント/トーン/NG) | デザイン判断の実装リファレンス |
| `docs/02_homepage_spec.md` | トップページ確定構成(docs/mockups/home_v2_final.png が見た目の正) | 実装仕様 |
| `docs/03_product_page_spec.md` | 商品ページ仕様(フラワーラウンジ基準・配送表示ルール) | 実装仕様 |
| `docs/04_implementation_notes.md` | Skeletonベースのゼロ構築方針・MCP設定・開発フロー | 技術方針 |
| `docs/05_build_workflow.md` | モックからセクションを構築する手順 | 毎セクション共通の作業手順 |
| `docs/06_handoff.md` | 現状・完成済みセクション・未着手ページ・制約 | **セッション引き継ぎ時に最初に読む** |
| `docs/mockups/` | 確定デザイン(home_v2_final.png) | 見た目の正 |
| `docs/brand/` | ロゴ(logo_terracotta.png)・商品参考写真 | ブランド素材 |

## Shopify Dev MCP 使用ルール(必須)

このプロジェクトは Shopify Dev MCP を使用する。以下を厳守:

- セッション開始時、Shopify関連の質問に答える前に `learn_shopify_api` を一度呼ぶ
- GraphQLを提案する前に必ず `validate_graphql_codeblocks` を通す。検証に失敗したコードは提示しない
- Liquidコードを提案・生成する前に必ず `validate_theme_codeblocks` を通す。バリデータが認識しないフィルタ・タグを出荷しない
- 記憶に頼ってShopifyの仕様を答えない。必ずMCPのドキュメント検索で確認する

## 絶対ルール

1. ブランド名は **MORU**(表記)、補助表記 **MORU LIVING**。商標クリアランス未完了のため、名称・ロゴはテーマ設定から差し替え可能に保つ
2. ロゴは `docs/brand/logo_terracotta.png`(テラコッタのワードマーク)。**猫耳・肉球・猫シルエットをUIに入れない**
3. カラー・フォント・トーンは docs/01 が実装上の正。アクセント色は1画面1〜2色
4. 「ドロップシッピング」を顧客向けに出さない。配送目安(2〜3週間、場合により4週間以上)を隠さず明示する
5. docs/00 第11章の「避けるコピー」(絶対に使ってくれる/100%安全/完全防水/残りわずか 等)と、
   偽レビュー・偽割引・偽在庫・偽カウントダウンの実装は**いかなる形でも作らない**
6. 未確認の品質表現をしない: 「無垢材」「丸洗い可能」「完全防水」等は docs/00 第5章の表現注意に従う
7. 右サイドバー禁止。Full-widthセクションの縦積み
8. UIの基本言語は日本語。文言は `locales/ja.json` の翻訳キーで管理(Liquid直書き禁止)
9. すべてのセクションはテーマエディタから編集可能に(schema必須、ラベル日本語、presets必須)
10. 依存ライブラリ・CSSフレームワーク追加禁止。CSSとJSは自作(軽量・可読性優先)

## 開発フロー

- ベース: Shopify **Skeleton Theme**(公式最小テーマ)を初期コミットとして取り込み、デザインは100%自作
- ローカルプレビュー: `shopify theme dev --store=rgy5ee-fv.myshopify.com`
- コミット前: `shopify theme check` 必須
- ブランチ: `main` 保護、作業は `feature/*` → PR
- セクション命名: `sections/moru-*.liquid`
- 納品形態: テーマZIP(管理画面アップロード可能な構造)

## 現在のステータス

- [x] ブランド再定義完了(猫用家具から始まるライフスタイルブランド / トーンは旧比で親しみやすく)
- [x] トップページ構成・ビジュアル確定(docs/02 + docs/mockups/home_v2_final.png)
- [x] ロゴ確定(テラコッタのワードマーク)
- [x] Skeletonベースの初期セットアップ(upstream a4f32d3 取り込み・Dev MCP登録済み)
- [x] design token(カラー/フォント/spacing)整備(settings_schema + css-variables + base.css)
- [x] トップページのセクション構築(hero スライドショー / 商品グリッド / 部屋で見る / カテゴリー / 読みもの / Instagram / フッター)
- [x] 商品ページ(ギャラリー・バリアント選択・レビュー・アコーディオン・クロスセル)
- [x] カテゴリーページ(バナー・タグ絞り込み・並び替え・さらに表示する)
- [x] カートページ(明細・クーポン・内訳・おすすめ・レビュー)+ 閲覧した商品
- [ ] 固定ページ(About / 特商法 / プライバシー / 利用規約 / FAQ)
- [ ] 検索結果・読みもの一覧・記事詳細・404
- [ ] カートドロワー / 検索モーダル
- [ ] 実商品(フラワーラウンジ)の登録と実データ検証

> 詳細な申し送りは `docs/06_handoff.md` を参照。
