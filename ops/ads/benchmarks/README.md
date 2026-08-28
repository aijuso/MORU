# ops/ads/benchmarks — 競合広告の分析結果の置き場

**分析の作法・ツールの使い方・借りる/捨てるの線引きは
`.claude/skills/ad-benchmark-creative/` が正**(D-160)。
本ディレクトリは、そのスキルのステップ8が保存する**分析結果の置き場**。

- スキル本文: `.claude/skills/ad-benchmark-creative/SKILL.md`(8ステップのワークフロー)
- AdWhispr の使い方・brandId表・数字の信頼度: 同 `references/adwhispr.md`
- 借りる/捨てる: 同 `references/translation-rules.md`

## このディレクトリのルール

- ブランドごとに `{brand}.md` を1枚。**必ず取得日を書く**
  (数字は動く。実例: 2026-08-28 実測で Kocol は43本 — 分析時の44本から変化)
- **3ヶ月以上前の分析は取り直してから使う**(スキル前提の再掲)
- 新しいベンチマークブランドは `ops/research/sites.md` のサイトDBとも突き合わせる

## 現在の分析

| ファイル | 対象 | 位置づけ |
|---|---|---|
| `kocol.md` | Kocol(インテリア側) | 完成型。特集型=AOV装置 |
| `desk-nest-cat-bed.md` | Desk Nest Cat Bed(ペット側) | 探索型。問題提起・逆張りフック |
