# 07. セッション運用プロトコル(再発防止)

> 2026-08-21 追加。複数セッションが並行して同じストアを触り、
> 「作業が消えた」「参考デザインが食い違う」という事故が起きたため、その再発防止として定める。
> **このファイルは docs/00〜06 と同じ強さの拘束力を持つ。セッション開始時に必ず実行すること。**

---

## 事故の記録(何が起きたか)

2026-08-21、2つのセッションが同時に動いていた。

1. セッションAが `claude/moru-living-shopify-dev-yvnmni` で固定ページ・ヘッダー・フッターを実装し、
   commit → push → `shopify theme push` を回していた
2. セッションBは `claude/shopify-wireframe-japanese-cuzrnd` で起動した。
   このクローンには **A のブランチが fetch されていなかった**ため `git branch -a` に映らず、
   B は「ストアだけが24ファイル進んでいる=未コミットの作業がある」と誤認した
3. B はストアから24ファイルを引き戻して「同期コミット」を作った。
   後で照合したところ **A の 29fb843 とバイト単位で完全一致**しており、実害はなかったが、丸ごと無駄な作業だった
4. さらに、ユーザーが B に渡したデザイン参考画像を A が持っておらず、
   A は別の参考を「正」として実装していたため、両者の見た目の判断が正面から衝突した

**根本原因は3つ。以下の対策はこの3つに1対1で対応する。**

| # | 根本原因 | 対策 |
|---|---|---|
| 1 | セッションのクローンに他ブランチが無く、他セッションの作業が見えない | §1 セッション開始時の必須手順 |
| 2 | git とストアの正・不正が定義されておらず、ドリフトを検知する手段がなかった | §2 ブランチと反映の規律 |
| 3 | 参考デザインがチャット画像のままでリポジトリに無く、セッションごとに違うものを見ていた | §3 デザインの正の管理 |

---

## §1 セッション開始時の必須手順

**何か1行でもコードを書く前に、この4つを必ず実行する。**

```bash
# 1. 全ブランチを取得する。ローカルに見えていないブランチが必ずあると疑う
git fetch origin --prune
git branch -r

# 2. どのブランチが最新かを目で見る
git log --oneline --graph --all -20

# 3. 自分の指定ブランチと、最も進んでいるブランチの差分を確認する
git diff --stat <自分のブランチ> origin/<最も進んでいるブランチ> -- \
  assets blocks config layout locales sections snippets templates
```

4. `docs/06_handoff.md` 冒頭の「作業ブランチ」を読む。ここが現在の trunk。

**`git branch -a` に2本しか出ないからといって、ブランチが2本だとは限らない。**
fetch していないリモートブランチは表示されない。今回の事故はここから始まった。

### ストアと git がズレていないかの確認

ズレを見つけたら、**引き戻す前に必ず「他ブランチに既にコミットされていないか」を確認する。**
Admin API でストア側の MD5 を取り、作業ツリーと突き合わせる:

```graphql
query {
  theme(id: "gid://shopify/OnlineStoreTheme/166203621616") {
    files(first: 50) { nodes { filename checksumMd5 } pageInfo { hasNextPage endCursor } }
  }
}
```

```python
# 取得した checksumMd5 と作業ツリーの md5 を比較する
import hashlib, os
for filename, remote_md5 in live.items():
    local = hashlib.md5(open(filename, 'rb').read()).hexdigest()
    if local != remote_md5:
        print('差分:', filename)
```

**注意: `config/settings_data.json` と `locales/*.json` は常に差分として出る。**
Shopify が保存時に自動生成コメント行を落として正規化するため。中身は同一。これを「ドリフト」と誤認しないこと。

---

## §2 ブランチと反映の規律

### ブランチ

- **trunk は常に1本。** 現行は `claude/moru-living-shopify-dev-yvnmni`。
  trunk が移ったら `docs/06_handoff.md` 冒頭を必ず書き換える
- 新しいセッションが別ブランチ名を指定されて起動した場合、
  **trunk から派生させる**。古いブランチや `main` から派生しない
- 作業ブランチを消すときは、そのブランチにしか無いコミットが無いことを
  `git log trunk..<消すブランチ>` で確認してから

### ストアへの反映

このストアのテーマは **GitHub と連携していない。**
git に push してもストアは1バイトも変わらない。これは確認済みの事実で、推測ではない。

反映は Shopify CLI のみ:

```bash
shopify theme push --store=rgy5ee-fv.myshopify.com --theme 166203621616
```

**⚠️ 2026-08-22 追記: theme 166203621616 は `role: MAIN`(公開テーマ)になっている。**
それまでの docs は「未公開」と書いていたが誤りだった。push はライブテーマの上書きになるため、
CLI は `--allow-live` を要求する。**push の前に必ず role を確認する:**

```graphql
query { themes(first: 20) { nodes { id name role } } }
```

`MAIN` だった場合、勝手に上書きしない。ユーザーに確認するか、
`themeDuplicate` で未公開テーマを作ってそちらへ push し、確認後に公開切替する。

**順序は必ず commit → git push → theme push。** 逆にしない。
「ストアだけ直して git は後で」を一度でもやると、次のセッションが今回と同じ誤認をする。

CLI 認証はコンテナ再作成のたびに消えるため、認証できないセッションでは
**ストアに書き込まない。** git に積んで、ユーザーに theme push を依頼する。
Admin API で直接ファイルを上書きするのは、大きな Liquid を手で送ることになり
書き損ないのリスクがあるため、最後の手段とする(実施したら必ず MD5 照合する)。

### 恒久対策(未実施・要判断)

GitHub 連携を有効にすればドリフトは構造的に起きなくなる。
ただし連携できるのは**新規テーマとして追加する場合のみ**で、既存のライブテーマへの後付けはできない。
「新テーマとして GitHub 接続 → 確認 → 公開切替」という手順になる。実施するかはユーザーの判断。

---

## §3 デザインの正の管理

**今回いちばん高くついた原因。チャットに貼られた画像は、次のセッションからは見えない。**

### ルール

1. ユーザーから参考デザイン(画像・HTML)を受け取ったら、
   **実装を始める前に `docs/mockups/` にコミットする。** 例外なし
2. ファイル名に受領日を入れる: `home_YYYYMMDD_<内容>.png`
3. 下の「現在の正」表を更新する。**最新1件だけが正で、それ以外は履歴**
4. 表と実装が食い違っていたら、実装ではなく**まず表を疑い、ユーザーに確認する**
5. HTML で受け取った参考は `.html` のまま `docs/mockups/` に置く。
   **参考HTMLの扱いはユーザーが都度指定する**(「完全再現」なのか「色以外だけ」なのかが変わるため)。
   指定内容も上の表の「状態」欄に書き残す

### 現在の正

| 受領日 | ファイル | 対象 | 状態 |
|---|---|---|---|
| 2026-08-21 | `docs/mockups/header_20260821.html` | ヘッダー(告知バー・ナビ・検索・モバイルドロワー) | **ヘッダーの正**(色は参考にする) |
| 2026-08-21 | `docs/mockups/footer_20260821.html` | フッター | **フッターの正**(ただし**色は参考にしない**。ユーザー指示により、レイアウト・フォント・配置のみ再現し、配色は既存トークンに載せ替える) |
| 2026-08-23 | `docs/mockups/cta_banners_20260823.jpg` | CTA広告バナー | **CTAバナーの正。** 仕様は画像1枚+内部リンク・PC最大2列・モバイル1列・モバイル用画像なし(詳細は `home_20260823_cta_banners.md` §3) |
| 2026-08-23 | `docs/mockups/home_20260823_cta_banners.md`(**全体画像は未コミット**) | トップページ全体 | **トップ全体構成の正。** スクリーンショット2枚を受領したが実行環境にバイナリが落ちてこなかったため、読み取った内容を文章で記録してある。画像が届いたら `home_20260823_full.png` としてコミットしてこの行を更新する |
| 2026-08-21 | (**未コミット** — ユーザーに再送を依頼中) | トップページ | 履歴。2026-08-23 版に置き換わった |
| (不明) | `docs/mockups/home_v2_final.png` | トップページ | 履歴。下記の差分あり |

2026-08-21 の参考画像は `home_v2_final.png` からこう変わっている:

- MORUワードマークが**テラコッタ**(`home_v2_final.png` ではチャコール)
- 「カテゴリーから探す」(丸サムネ5個)が「**ムードから探す**」(横長カード3枚 / MID CENTURY・NEW RETRO・PLAYFUL ACCENT)に
- アナウンスバーの文言が「新規会員登録で500ptプレゼントキャンペーン実施中!」

**逆に、`home_v2_final.png` と 2026-08-21 版で一致している点**(=ずっと変わっていない仕様):

- アナウンスバーは**黒地・白文字**
- 見出し(新着アイテム / 部屋で見る)は**ゴシック体**であって明朝体ではない
- 商品カードの角はほぼ直角

---

## §4 見た目の検証手順(CLI 認証が無いセッター向け)

ストアはパスワード保護されているため、ブラウザで開いても中身が見えない。
また実行環境によってはブラウザから外部への通信が遮断されている。
その場合でも、以下でストアの実HTMLにローカルCSSを当てて描画確認できる。

```bash
# 1. パスワードを通してトップページのHTMLを取得する
#    (プライマリドメイン moruliving.myshopify.com を使う。rgy5ee-fv だと cookie が付かない)
curl -s -c cj.txt -b cj.txt -o /dev/null https://moruliving.myshopify.com/password
curl -s -c cj.txt -b cj.txt -o /dev/null -X POST https://moruliving.myshopify.com/password \
  --data-urlencode "form_type=storefront_password" \
  --data-urlencode "utf8=✓" --data-urlencode "password=<ストアのパスワード>"
curl -s -c cj.txt -b cj.txt -L -o ja.html https://moruliving.myshopify.com/

# 2. CSS とフォントを落とす(section の CSS は compiled_assets/styles.css にまとまっている)
curl -s -o compiled.css "https://moruliving.myshopify.com/cdn/shop/t/8/compiled_assets/styles.css"
for u in $(grep -oE '//moruliving\.myshopify\.com/cdn/fonts/[^"]+\.woff2' ja.html | sort -u); do
  curl -s -o "$(basename "$u" | cut -d. -f1).woff2" "https:$u"
done
```

3. `ja.html` から `<link rel=stylesheet>` と外部 `<script src>` を除去し、
   フォントURLをローカルファイル名に書き換え、`assets/critical.css` +
   **編集中の** `assets/base.css` + `compiled.css` を `<style>` で流し込む
4. Playwright(`/opt/node22/lib/node_modules/playwright`、Chromium は同梱)で
   `file://` を開いてスクリーンショット。外部通信は `page.route` で `file:` 以外を abort する

トークンだけを変えた場合は、`:root` の上書きブロックを最後に足せば before/after を並べて比較できる。
実際のセクション実装を触った場合は `compiled.css` が古くなるので、その差分も上書きで足す。

---

## §5 コミット前チェック(既存ルールの再掲)

- Dev MCP `validate_theme` を通す(Liquid・schema・locale・CSS すべて)
  — 使えない場合は §6 の代替を使う
- 日本語文言は `locales/ja.default.json`。Liquid 直書き禁止
- 色は必ず CSS 変数経由。セクションCSSに生の HEX を書かない

---

## §6 Dev MCP が接続失敗しているとき(2026-08-23 追記)

`learn_shopify_api` / `validate_theme` が**ツール一覧に出てこない**セッションがある。
2026-08-22・23 の2セッション連続で発生した。

### 原因(実測で特定済み)

パッケージは壊れていない。`.mcp.json` の `npx -y @shopify/dev-mcp@latest` が
**セッション開始時に約50MBをダウンロードし、MCPクライアントの起動タイムアウトに間に合わず中断**する。
中断すると npx キャッシュに中途半端なディレクトリが残り、以降は毎回 `ENOTEMPTY` で失敗し続ける。

キャッシュを消して手で起動すると正常に立ち上がることを確認済み:

```
Shopify Dev MCP Server v1.14.5 running on stdio
```

### 復旧コマンド

```bash
rm -rf /root/.npm/_npx/*
```

**ただしセッション途中で MCP を再接続できるとは限らない。** 効くのは次の起動時からの可能性が高い。
消しても直らない場合は深追いせず、下の代替で進めること(実績あり)。

### 代替手段(これで十分やれる)

| 使えないもの | 代わりに |
|---|---|
| `validate_theme` | **`shopify theme check`**。このコンテナに Shopify CLI は無いので `npm i @shopify/cli` で入れる。Liquid構文・schema・翻訳キー・CSSスコープまで検出できる |
| `learn_shopify_api` | 呼ばずに進めてよい。仕様確認は Admin側 Shopify MCP の `search_docs_chunks` で行う(記憶で答えないルールは維持) |
| GraphQL の検証 | Admin側 Shopify MCP の `validate_graphql_codeblocks`(こちらは生きている) |

さらに JS / CSS は手元で機械的に検証できる:

```bash
# 全セクションの {% javascript %} を連結して構文チェック
node --check bundle.js
# CSS は css-tree でパースチェック
```

### テーマ反映の制約

Admin側 Shopify MCP の `graphql_mutation` は**公開(MAIN)テーマへのファイル書き込みをブロックする**。
現在のテーマ `166203621616` は MAIN なので、反映は CLI の
`shopify theme push --allow-live` **一択**。これはデバイス認証(有効期限15分)が要るため、
**push のタイミングでユーザーが席にいる必要がある**。
実装だけなら承認不要なので、「まとめて実装 → 最後に一度だけ承認」が効率的。
