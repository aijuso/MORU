# MORU 運用ノート(seedance-scene-director 用・原本非改変の追記)

> 原本(SKILL.md / references/ / assets/)はオーナーの汎用スキルの**完全コピー**。
> このファイルだけが MORU リポジトリ固有の追記。

## 用途(MORUでの主戦場)

- **Meta / TikTok Ads 用の広告動画**のショットリスト・プロンプト作成
  (チャネルは Meta と TikTok Ads の2つのみ。TikTok Shopアフィリエイトは行わない)
- 商品ページ用のショート動画(使用シーン・質感)
- アスペクト比は広告主体なので **9:16 を第一候補**(Reels / TikTok)。指定がなければ 9:16

## ブランド制約(必ず反映)

- 写真の4原則: 明るい自然光 / 抜け感 / 清潔感 / 青アクセント(docs/01 §3)
- 差し色1〜2色。glossy HDR ad look 禁止。猫耳・肉球モチーフ禁止
- **商品の形状・サイズを実物と変える描写は禁止。** 商品が写るショットは
  実物リファレンス(画像 or 実写素材)を固定して生成する
- 猫の反応・沈み込みを誇張して誤認させる演出をしない(docs/00 第8章)
- コピー・字幕は docs/00 第11章の禁止表現(絶対/100%/残りわずか等)を使わない
- 広告に人物UGC風の「体験談」を入れる場合、架空の実績・レビューを断定表現にしない

## Higgsfield MCP で実行する場合

- 動画生成は `generate_video`。モデル・duration・aspect_ratio は `models_explore` で確認
- 実写素材からのモーション転写(V2V)は原本の idiom-v2v-motion.md の手順に従い、
  `motion_control`(Kling系)の利用を検討
- TikTokへの直接投稿は tiktok_prepare_publish → tiktok_publish のフロー
  (AIGC開示フラグ `is_aigc: true` を必ず立てる)
- 生成結果の採否は**必ずオーナーのチェック**(人間ゲート)を通す

## 広告制作の前提データ(ops/pricing 整備までの暫定メモ)

- Hero商品: フラワーラウンジ。競合実績は動画経由が売上の99%(Kalodata)
- 広告の役割は「Problem → Solution が一瞬で分かる」こと(docs/00 v0.2 商品システム4階層のHero)
