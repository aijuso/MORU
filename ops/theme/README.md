# テーマ反映の Runbook(2026-08-27〜)

## なぜこの仕組みにしたか

**Claude からは本番テーマを直せなかった。** 2026-08-27 に3経路すべて塞がっていることを実測した。

| 経路 | 結果 |
|---|---|
| MCP `themeFilesUpsert` を公開テーマ宛て | 拒否(`category: live_theme`) |
| MCP `themePublish` | 拒否(`category: destructive`) |
| Shopify CLI | 拒否(ハーネスの権限分類器) |

前の2つは **Shopify MCP サーバー側の設計なので解除できない。**
3つ目だけが解除できるので、**CLI 経路を正式な反映手段にする。**

これがないと「未公開テーマを直す → 管理画面で公開 → そのテーマが MAIN になり書けなくなる →
次はもう片方を同期してから直す」という ping-pong を毎回やることになる。

---

## セットアップ(Owner が一度だけ)

### 1. Theme Access パスワードを発行する

1. Shopify 管理画面 → **アプリ** → `Theme Access` を検索してインストール
2. Owner のメールアドレス宛にパスワードを発行
3. 届いた **`shptka_` で始まる文字列**を控える

### 2. 環境変数に入れる

**このサンドボックスはセッションごとに作り直されるので、シェルで export しても消える。**
Claude Code(web)の**環境設定に登録する**こと。

| 変数 | 値 |
|---|---|
| `SHOPIFY_CLI_THEME_TOKEN` | 発行した `shptka_…` |
| `SHOPIFY_FLAG_STORE` | `rgy5ee-fv.myshopify.com` |
| `SHOPIFY_FLAG_FORCE` | `1`(対話プロンプトを止める) |

⚠️ **`shopify.theme.toml` に password を書かない。** あのファイルは git に入る。

### 3. CLI を入れる

セッションごとに消えるので、必要なときに:

```bash
npm install -g @shopify/cli@latest
```

---

## 使い方

環境は `shopify.theme.toml` に定義してある(`dev` / `live` / `rollback`)。

### 🔴 最初に必ずやること: repo を本番から同期する

**repo は本番テーマの正本ではない。** 2026-08-27 時点で
**相違24ファイル / repo に無いファイル11件**(`_repo_vs_dev_20260827.md`)。

```bash
shopify theme pull -e live
```

**これをやる前に `shopify theme push` を丸ごと打ってはいけない。**
push は「ローカルに無いリモートファイルを削除する」ので、
**本番から11ファイルが消え、24ファイルが古い内容で上書きされる。**

### 1ファイルだけ本番に出す

```bash
shopify theme check                    # 先に通す。0 offense であること
shopify theme push -e live --only sections/moru-main-product.liquid --nodelete
```

- `--only` … そのファイルだけ上げる
- `--nodelete` … リモートの他のファイルを消さない(**保険。必ず付ける**)
- `-e live` … `live = true` なので、テーマが入れ替わっても ID を書き換えなくてよい

### 未公開テーマ(Frontend Dev)に出す

```bash
shopify theme push -e dev --only sections/moru-main-product.liquid --nodelete
```

### 反映後の確認

```bash
shopify theme info -e live
curl -sS https://moruliving.com/products/moru-flower-lounge | grep -o 'moru-product__price[^>]*>[^<]*'
```

**必ずストアフロントの実物で確かめる。** push が通っただけでは表示が正しい保証にならない。

---

## やらないこと

- **`shopify theme push -e live` を `--only` なしで打たない。** 上の理由で本番が壊れる
- `shopify theme delete` / `shopify theme publish` は `.claude/settings.json` で deny 済み。
  公開の切り替えは**人が管理画面で行う**(切り戻しの判断を機械に任せない)
- `shopify.theme.toml` に `password` を書かない

## 切り戻し

```bash
shopify theme push -e rollback   # 切り戻し先テーマへ上げ直す場合
```

公開の切り替え自体は管理画面から:
**オンラインストア → テーマ → 対象テーマの […] → 公開する**
