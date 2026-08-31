# Winning Hunter MCP セットアップ(2026-08-31 調査)

> リサーチの手順・評価基準は `.claude/skills/winning-hunter-research/SKILL.md` が正。
> 本書は接続方法だけを扱う。

## 前提(オーナー側で必要なもの)

- **Winning Hunter の Basic プラン以上**(MCP アクセスの条件)
- クレジット残量(**ツール呼び出し1回 = 1クレジット消費**。`tools/list` と接続確認は無料)
- レート上限: 300リクエスト/分(通常HTTPの60/分とは別枠)

## 経路1: この環境(Claude Code web / リポジトリ)— APIキー

`.mcp.json` に接続設定はコミット済み(サーバー名 `winninghunter`)。
**残りはオーナーが環境変数 `WH_API_KEY` を登録するだけ:**

1. Winning Hunter の管理画面で API キー(`wh_...`)を発行する
2. Claude Code web の**環境設定**に `WH_API_KEY` として登録する
   (`GOOGLE_SHEETS_KEY_B64` と同じ経路。**リポジトリにキーをコミットするのは絶対禁止**)
3. 新しいセッションを開始すると `winninghunter` の MCP ツールが使えるようになる

接続情報(公式):
- エンドポイント: `https://app.winninghunter.com/mcp`(HTTP transport)
- 認証ヘッダ: `X-API-Key: wh_...`

## 経路2: claude.ai(チャット / コネクタ)— OAuth

チャット側でも使いたい場合:

1. `claude.ai → 設定 → コネクタ → カスタムコネクタを追加`
2. URL に `https://app.winninghunter.com/mcp` を入力
3. Winning Hunter に OAuth サインインしてスコープを承認

## 提供されるツール(公式ドキュメントの記載)

- TikTok Shop の商品・分析 / Meta 広告ライブラリ検索 / ブランド追跡 /
  Shopify ストア監視 / Exploding Topics のトレンド / クレジット残量確認
- 書き込み系: `track_brand` / `track_store` / `save_ad` / `get_ad_transcript`

## AdWhispr との使い分け

| 目的 | 使うもの |
|---|---|
| 商品リサーチ(TikTok Shop・ストア監視・トレンド) | **Winning Hunter** |
| 競合の広告クリエイティブ分析 → 自社広告設計 | AdWhispr(`ad-benchmark-creative` スキル) |

両方 Meta 広告検索を持つが、二重にクレジットを使わない。
商品を探すときは WH、広告の型を読むときは AdWhispr を既定にする。

## 接続確認(セッション開始時)

ツール一覧に `mcp__winninghunter__*` が現れれば接続成功。
現れない場合: ① `WH_API_KEY` が環境設定に登録済みか ② プランが Basic 以上か
③ キーが失効していないか、の順で確認する。

出典: [WinningHunter MCP Setup](https://app.winninghunter.com/docs/mcp)
