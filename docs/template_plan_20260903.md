# ブランド立ち上げテンプレート化計画(2026-09-03・Owner すり合わせ用ドラフト)

> **Owner 発言(2026-09-03)**: MORU はやめようと思う。このリポジトリの構成を、
> 新ブランドのたびにクローンして使えるテンプレートにしたい。
> ⚠️ これは方向の表明であり、**MORU 停止の正式決定はまだ D-xxx に起こしていない**。
> 本書はテンプレート設計の提案と資産の棚卸し。実行は下記「Owner 決定 3点」の回答後。

---

## 1. 資産の棚卸し — 何がテンプレートで、何が MORU 固有か

### ✅ そのままテンプレート資産になるもの(ブランド非依存に作ってある)

| 資産 | 中身 |
|---|---|
| `.claude/skills/winning-hunter-research/` | リサーチ標準6フェーズ + 指標カタログ + P1〜P7 パターン。**最初からブランド非依存設計** |
| `docs/consulting/` | ドロップシッピング全体プレイブック / 商品マイニング講座(6特徴・飽和度カーブ・知覚価値6レバー)/ 利益1万円ロジック |
| `.mcp.json` | Winning Hunter + Shopify Dev MCP 接続 |
| `ops/research/winning_hunter_setup.md` | WH 接続手順(APIキー/OAuth・プラン条件・クレジット実測) |
| `docs/07_session_protocol.md` | セッション運用(fetch必須・ブランチ・mockups管理)— ほぼそのまま |
| `ops/theme/README.md` の反映手順 | CLI + Theme Access の運用。ストア名だけ差し替え |
| `ops/tools/` | 価格監査スクリプト等(ドメイン差し替えで動く) |

### 🔧 「雛形化」して持っていくもの(構造は優秀・中身がMORU)

| 資産 | 雛形化の方法 |
|---|---|
| `CLAUDE.md` | 絶対ルールを2層に分離: **全ブランド共通ルール**(偽装広告禁止・配送正直表示・薬機法/景表法・未確認品質表現禁止・Liquid直書き禁止 等)と**ブランド固有欄**(名称・パレット・世界観)を空欄テンプレに |
| `docs/00_brand_master.md` | 章立てだけ残した空テンプレ(ブランド定義を埋める場所) |
| `docs/10_pricing_rules.md` | 汎用値付けルール(着地原価×3.0 / **利益1万円/個** / CPA上限逆算 / 送料区分)— MORU の実測値は例として残す |
| `ops/research/rubric.md` | **6特徴○×チェックリスト**(マイニング講座準拠)を汎用の正にし、世界観適合だけブランド欄に |
| `ops/ads/meta_ops_rules.md` | 学習期間・週次入れ替え・日次KPIは汎用。CPA数値欄をブランド変数化 |
| `ops/products/` `ops/store/` の runbook 構造 | ディレクトリ構造と手順書の型だけ残しデータは空に |
| `.claude/skills/product-registration/` `ad-benchmark-creative/` | ワークフローは汎用・MORU参照(docs/00等)を「ブランドアダプタ参照」に書き換え |
| テーマ一式(Skeletonベース・design token化済み) | settings の色/フォント差し替えで転用可能。`moru-*` 命名の一般化は要判断 |
| `docs/11_product_registration_workflow.md` | CKB→Shopify の手順は汎用。メタフィールド定義そのまま使える |

### 🗄️ MORU 固有(テンプレートに入れない・アーカイブ対象)

- `docs/00〜03` の中身 / `docs/09`(ナビ6分類)/ `docs/brand/`(ロゴ・リファレンスシート)
- `ops/products/` の商品カルテ・価格監査データ / `ops/promotions/`(Function config)
- `ops/ads/benchmarks/`(Kocol等)/ `ops/research/sites.md`・リサーチDBシート
- `docs/06_handoff.md` / `06_decisions_log.md`(D-001〜)/ mockups
- 商標・特商法・ストア設定(rgy5ee-fv / moruliving.com)

## 2. 推奨アーキテクチャ

**新リポジトリ `brand-template`(仮)を作り、新ブランドごとに clone/テンプレート生成**:

```
brand-template/
├── CLAUDE.md               # 共通ルール + [BRAND] 固有欄(空)
├── .mcp.json / .claude/skills/   # WHリサーチ・広告・商品登録(アダプタ参照方式)
├── docs/
│   ├── consulting/         # 知識資産(プレイブック・マイニング講座)← 全ブランドで共有
│   ├── 00_brand_master.md  # 空テンプレ
│   ├── pricing_rules.md    # 利益1万円・×3.0・CPA逆算
│   └── session_protocol.md
├── ops/
│   ├── research/           # rubric(6特徴○×)+ workflow + WH setup
│   ├── ads/                # meta_ops_rules + benchmarks/(空)
│   ├── products/ store/ theme/  # runbook 雛形
└── theme/                  # Skeletonベーステーマ(token差し替え式)
```

- GitHub の **Template repository** 機能を使うと clone より綺麗(「Use this template」で履歴なしの新リポジトリが切れる)
- 知識資産(consulting/)の更新は template 側に集約し、各ブランドは必要時に取り込む
- **MORU リポジトリは現状のままアーカイブ**(履歴・決定ログを壊さない)

## 3. Owner 決定が必要な3点

1. **リポジトリ戦略**: (a)推奨: 新規 `brand-template` リポジトリを作る(このセッションのGitHub権限は
   aijuso/moru のみ → リポジトリ作成の許可 or Owner が作って権限追加が必要)
   (b)この MORU リポジトリを直接テンプレートに改造(履歴にMORUが残り続ける・非推奨)
2. **⚠️ MORU の実務の後始末(お金が動いている)**:
   - **Meta 広告が配信中**(8/29〜)。やめるなら**キャンペーン停止が最優先**(日予算が出続けている)
   - 注文 #1001 の履行 / ストアの扱い(休止 or 当面放置)/ Shopify 月額課金
   - 承認待ちだった価格改定案(D-165関連)は取り下げでよいか
   これらは私からは操作せず、Owner の指示があった項目だけ実行します
3. **テンプレートの範囲**: (a)推奨: リサーチ〜広告〜商品登録〜テーマまでのフルスタック
   (b)リサーチ・広告の仕組みだけ(テーマは毎回ゼロから)

## 4. 決定後の移行手順(見積り)

1. テンプレリポジトリ作成 → 共通資産の移植・雛形化(1セッション)
2. CLAUDE.md の2層化・スキルのアダプタ参照化(同上)
3. 新ブランド1号でテンプレを実戦検証(リサーチから開始 = 週20商品→2絞り込みサイクル)
4. MORU リポジトリに「アーカイブ宣言」を handoff / 決定ログへ記録
