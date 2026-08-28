# Google Sheets 連携 Runbook(2026-08-28〜)

商品リサーチ用スプレッドシート **「MORU 商品リサーチDB」** を、
Claude Code のセッションから読み書きするための手順書。**この文書が唯一の正。**

- スプレッドシート ID: `1W8LczbaYgB7s6hzhmNfNyjou36Jt0tTF1_VqNwskB4w`
- サービスアカウント: `morusheet@shopfiy-506905.iam.gserviceaccount.com`(project `shopfiy-506905`)
- 認証情報の在り処: **環境変数 `GOOGLE_SHEETS_KEY_B64`**(JSON キーを base64 で1行にしたもの)

---

## 1. セットアップ(Owner が一度だけ・完了済み)

1. GCP でサービスアカウントを作成し、**Google Sheets API を有効化**する
2. 対象スプレッドシートを、そのサービスアカウントのメールアドレスに**編集者として共有**する
   (共有しないと `gspread.exceptions.APIError: 404` になる。**キーが正しくても開けない**)
3. JSON キーを base64 で1行にして、**Claude Code(web)の環境変数** `GOOGLE_SHEETS_KEY_B64` に登録する

```bash
base64 -w0 key.json      # Linux。macOS は base64 -i key.json | tr -d '\n'
```

⚠️ **シェルで `export` しても消える。** このサンドボックスはセッションごとに作り直されるため、
環境変数はハーネス側の環境設定に登録すること(`ops/theme/README.md` の Theme Access トークンと同じ扱い)。

⚠️ **キーの中身を出力しない。** `echo $GOOGLE_SHEETS_KEY_B64` や、
デコードした JSON をそのまま print するコードを書かないこと。会話ログに平文で残る。
必要なのは `client_email` / `project_id` 程度で、**`private_key` は決して表示しない**。

---

## 2. セッションごとのセットアップ(毎回必要)

```bash
pip install gspread google-auth
pip install --upgrade cffi
```

**`cffi` の upgrade は省略できない。** 入れないと `import gspread` の時点で
`PanicException` で落ちる(プリインストールの `cffi` が古く、`cryptography` の
Rust 拡張と ABI が合わないため)。

`cryptography` のアンインストールに失敗する旨のエラーが出ることがあるが、**無視してよい**
(実測: 2026-08-28。無視して接続テストは成功している)。

---

## 3. 接続テスト

```python
import os, json, base64, gspread
from google.oauth2.service_account import Credentials

SHEET_ID = "1W8LczbaYgB7s6hzhmNfNyjou36Jt0tTF1_VqNwskB4w"

creds = Credentials.from_service_account_info(
    json.loads(base64.b64decode(os.environ["GOOGLE_SHEETS_KEY_B64"])),
    scopes=["https://www.googleapis.com/auth/spreadsheets"],
)
sh = gspread.authorize(creds).open_by_key(SHEET_ID)
print([ws.title for ws in sh.worksheets()])
```

**タブ名の一覧が出れば成功。**

---

## 4. よく使う操作

```python
ws = sh.worksheet("マスターDB")          # 名前で取得
ws = sh.worksheets()[0]                  # 位置で取得

ws.update_title("マスターDB")             # タブ名の変更
sh.add_worksheet(title="2026-08-28", rows=100, cols=26)   # タブの追加

rows = ws.get_all_values()               # 全セルを読む(list[list[str]])
ws.update("A1", [["見出し1", "見出し2"]]) # 書き込み(range, 2次元配列)
ws.append_row(["値1", "値2"])            # 末尾に1行追加
```

**API のレート制限は「1分あたり60リクエスト / ユーザー」。**
1行ずつ `append_row` を回すと簡単に 429 になる。
**まとめて書くときは `ws.update()` に2次元配列を渡して1リクエストにする。**

---

## 5. 現在のシート構成(2026-08-28 時点)

| タブ | 用途 |
|---|---|
| `マスターDB` | 商品リサーチのマスター(元 `Untitled` をリネーム) |
| `2026-08-28` | 日付単位の作業タブ |

⚠️ **`マスターDB` を消さない・リネームしない。** 日次の作業は日付タブを足す運用にする。

---

## 6. ハマりどころ

| 症状 | 原因 | 対処 |
|---|---|---|
| `import gspread` が `PanicException` で落ちる | `cffi` が古い | `pip install --upgrade cffi` |
| `APIError: 404` | シートがサービスアカウントに共有されていない | シートを `morusheet@…` に共有する |
| `APIError: 403 PERMISSION_DENIED` | Sheets API が無効 / scope 不足 | GCP で API 有効化・scope を確認 |
| `KeyError: 'GOOGLE_SHEETS_KEY_B64'` | 環境変数が未登録(または export しただけ) | ハーネスの環境設定に登録する |
| `429 RESOURCE_EXHAUSTED` | 1分60リクエストの制限 | 1リクエストにまとめる / 待つ |

**ネットワークは通る。** `sheets.googleapis.com` / `oauth2.googleapis.com` とも
このサンドボックスのプロキシから到達できる(2026-08-27 疎通確認・2026-08-28 実接続で確認)。
`shopify-dev-mcp` や Chromium と違い、**プロキシ起因の失敗は起きていない。**

---

## 7. 実施記録

| 日付 | 内容 |
|---|---|
| 2026-08-27 | `sheets.googleapis.com` / `oauth2.googleapis.com` への疎通確認(方式確定) |
| 2026-08-28 | **サービスアカウントで実接続に成功。** タブ `Untitled` → `マスターDB` にリネーム、`2026-08-28` タブを新規追加 |
