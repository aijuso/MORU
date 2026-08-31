# ops/research — 商品リサーチ Runbook(2026-08-28〜)

**目的**: 競合ECサイトから商品候補を発掘し、MORUの基準で評価してスプレッドシートに蓄積する。
「毎回ゼロから考え直さない」ために、判断基準と手順をこのディレクトリに資産化する。

| ファイル | 中身 |
|---|---|
| `README.md`(本書) | セットアップ・認証・シート構成・書き込みルール |
| `rubric.md` | 商品の評価基準(問題解決力 / 世界観適合 / セット候補 / 色展開数) |
| `sites.md` | リサーチ対象サイトDB(基準サイト: kocol.shop) |
| `workflow.md` | 実行手順(取得 → 評価 → シート追記 → 照合 → 商品登録へ) |
| `winning_hunter_setup.md` | Winning Hunter MCP の接続手順(オーナー側の作業を含む) |

**ブランド非依存のリサーチ標準は `.claude/skills/winning-hunter-research/SKILL.md`。**
本ディレクトリの rubric / sites は MORU 固有の「ブランドアダプタ」という位置づけ(スキル §6)。
新ブランドを立ち上げるときはスキル本体を書き換えず、そのブランド用の rubric を新規作成する。

**着手前に `rubric.md` を読むこと(CLAUDE.md 絶対ルール16)。**

---

## セットアップ(毎セッション必要。コンテナが毎回作り直されるため)

```bash
pip install gspread google-auth
pip install --upgrade cffi   # これが無いと import で PanicException(実測済み)
```

**`cffi` の upgrade は省略できない。** プリインストールの `cffi` が古く、
`cryptography` の Rust 拡張と ABI が合わないため、`import gspread` の時点で落ちる。
`cryptography` のアンインストール失敗エラーが出ることがあるが、**無視してよい**(実測済み)。

---

## 認証

環境変数 **`GOOGLE_SHEETS_KEY_B64`**(Claude Code web の環境設定に登録済み)に
サービスアカウントキーが base64 で入っている。

- サービスアカウント: `morusheet@shopfiy-506905.iam.gserviceaccount.com`(project `shopfiy-506905`)
- **GitHub Secrets はプロキシが 403 で使用不可。** 環境変数登録が唯一の経路
- **リポジトリにキーをコミットすることは絶対禁止。**
  デコードした JSON を print するコードも書かない(`private_key` が会話ログに残る)

```python
import os, json, base64, gspread
from google.oauth2.service_account import Credentials
creds = Credentials.from_service_account_info(
    json.loads(base64.b64decode(os.environ["GOOGLE_SHEETS_KEY_B64"])),
    scopes=["https://www.googleapis.com/auth/spreadsheets"],
)
sh = gspread.authorize(creds).open_by_key("1W8LczbaYgB7s6hzhmNfNyjou36Jt0tTF1_VqNwskB4w")
```

タブ名の一覧が出れば接続成功:

```python
print([ws.title for ws in sh.worksheets()])
```

---

## 書き込み時の必須事項

1. **`value_input_option="USER_ENTERED"` を必ず指定する。**
   指定しないと `=IMAGE()` が文字列として入り画像が表示されない。

   ```python
   ws.append_rows(rows, value_input_option="USER_ENTERED")
   ```

2. **1行ずつではなく `append_rows` でまとめて送る。**
   Sheets API には書き込みレート制限(1分あたり60リクエスト / ユーザー)があり、
   1行ずつ `append_row` を回すと簡単に 429 になる。

---

## スプレッドシート構成(ID: `1W8LczbaYgB7s6hzhmNfNyjou36Jt0tTF1_VqNwskB4w`)

シート名: **MORU 商品リサーチDB**

| タブ | 用途 |
|---|---|
| `マスターDB` | 全商品を**商品URLをキーに重複排除**して蓄積。並べ替えて使う |
| `YYYY-MM-DD` | 実行ごとの**追記専用ログ。過去分は書き換えない** |

⚠️ **`マスターDB` を消さない・リネームしない。** 日次の作業は日付タブを足す運用。

### 列定義

```
事実(自動取得): 画像(=IMAGE()) / 商品名 / 元サイト / 商品URL / 販売価格 /
                参考円 / 色展開数 / 登録日
判断(LLM評価):  問題解決力(1-5) / 世界観適合(1-5) / 解決する問題(一文) /
                セット候補 / 判定理由(一文)
照合後に追記:   1688仕入値 / 送料区分 / 着地原価 / 想定販売価格 / 粗利率 / ステータス
```

評価スコアの付け方は `rubric.md` が正。

---

## ハマりどころ

| 症状 | 原因 | 対処 |
|---|---|---|
| `import gspread` が `PanicException` で落ちる | `cffi` が古い | `pip install --upgrade cffi` |
| `=IMAGE()` が文字列のまま表示される | `value_input_option` 未指定 | `USER_ENTERED` を指定 |
| `APIError: 404` | シートがサービスアカウントに共有されていない | シートを `morusheet@…` に共有 |
| `APIError: 403 PERMISSION_DENIED` | Sheets API が無効 / scope 不足 | GCP で API 有効化・scope を確認 |
| `KeyError: 'GOOGLE_SHEETS_KEY_B64'` | 環境変数が未登録(または export しただけ) | ハーネスの環境設定に登録 |
| `429 RESOURCE_EXHAUSTED` | 1分60リクエスト制限 | `append_rows` で1リクエストにまとめる |

**ネットワークは通る。** `sheets.googleapis.com` / `oauth2.googleapis.com` とも
このサンドボックスのプロキシから到達できる(2026-08-27 疎通確認・2026-08-28 実接続で確認)。

---

## 実施記録

| 日付 | 内容 |
|---|---|
| 2026-08-27 | `sheets.googleapis.com` / `oauth2.googleapis.com` への疎通確認(方式確定) |
| 2026-08-28 | サービスアカウントで実接続に成功。タブ `Untitled` → `マスターDB` にリネーム、`2026-08-28` タブを追加 |
| 2026-08-28 | Runbook を v2 化(rubric / sites / workflow を新設。列定義と書き込みルールを確定) |
