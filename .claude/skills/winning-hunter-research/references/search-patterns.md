# 検索パターン定義 — 「この時はこのパターン」(2026-08-31 制定)

目的ごとに使うツール・フィルタ・クレジット予算を固定する。
**その場でフィルタを発明しない。ここに無い目的が出たら、まずパターンを追記してから実行する。**
指標の全カタログは `filter-catalog.md`、閾値の根拠は SKILL.md §1。

凡例: 💳 = 想定クレジット(1呼び出し=1)

---

## P1 市場パルス — 「いま何が勝っているか」を広く見る

**使う時**: 新ブランドの方向探し・月次の定点観測。カテゴリ未定。
**ツール**: `find_winning_products`(強制: active + winning + 商品LP)
**条件**: `country=US, sort_by=longestrunning, sort_order=desc`(カテゴリを絞らない)
**💳 1〜2**(2ページ目は scroll)
**出口**: 気になるカテゴリを2〜3個メモ → P2 へ。

## P2 カテゴリ偵察 — 特定カテゴリの勝ちパターンを掴む

**使う時**: カテゴリ候補があり、ロングリスト(SKILL §2)を作る時。**リサーチの主力。**
**ツール**: `search_facebook_ads`
**条件(既定)**:
```
niche=<コード>, country=US,
min_duplicates=3,            # 広告数条件(同一クリエイティブ併走3本+)
min_active_ads=10,           # ページの投資規模
sort_by=longestrunning       # 出稿継続日数条件の代替(min_days_runningはティア制限時)
media_type・価格帯(min/max_price)は目的に応じて
```
ティアが許せば `min_days_running=14` を明示。
**💳 1〜3**(条件を変えて連打しない。1回広く→ローカルで絞る)
**出口**: 商品10〜20件のロングリスト。

## P3 商品検証 — 特定商品の需要の証拠を積む(SKILL §3)

**使う時**: ロングリストの本命候補を深掘りする時。
**手順**(1商品あたり 💳 2〜3):
1. `search_facebook_ads keyword=<商品名>, searchkeyword=productname` — 競合広告主が何社いるか・各社の継続日数
2. `search_shopify_stores keyword=<商品名>` — 扱うストア数と推定売上(=競合の厚み2〜4店の判定)
3. (必要時)`get_store_top_ads` か `brief_competitor` — 最有力1社だけ
**出口**: SKILL §3 の証拠表(継続性・競合の厚み・完売シグナル)。

## P4 TikTokトレンド — 販売実数で裏を取る

**使う時**: Meta で見つけた商品の「実際に売れた数」を確認する時。TikTok発の商品を探す時。
**ツール**: `get_tiktok_trending_products`(country, timeframe)→ 当たりがあれば
`search_tiktok_products`(`min_units_sold` / `min_revenue` / `category_id`)
**条件(既定)**: `country=US` 起点。`country=JP` の可否は初回に実測して結果をここに追記する
**💳 1〜3**
**強み**: Meta には無い**販売個数・売上額**で「宣伝している」ではなく「売れている」が取れる。

## P5 ストア逆引き — 勝っている店から商品を読む

**使う時**: 「どの店が伸びているか」から入る時。**日本市場の観測はこのパターンが本命**
(Meta広告検索に JP ターゲットが無いため)。
**ツール**: `search_shopify_stores`
**条件(日本向けの既定)**:
```
visitor_country_main=JP,       # 日本人が最も訪れている店
min_revenue=10000,             # 30日推定売上の下限(USD想定。実測で調整)
sort_by=visits_growth_pct_m1, sort_order=desc
niche・aov_min/max は目的に応じて
```
**💳 1〜2** + 最有力の店だけ `get_store_details` / `get_store_top_ads`(各💳1)
**出口**: 伸びている店のベストセラー → ロングリストへ合流。

## P6 先行トレンド — 広告に出る前の兆しを拾う

**使う時**: 半歩先のカテゴリを仕込みたい時(P1〜P5 の補助。単独で商品は決めない)。
**ツール**: `search_exploding_topics`(category / timeframe)
**💳 1〜2**

## P7 定点観測 — 決めた対象を追い続ける

**使う時**: 本命カテゴリ・競合が確定した後の継続ウォッチ。
**ツール**: `daily_radar`(💳1/回)。`track_brand` / `track_store` は**枠を消費する書き込み系 —
Owner 確認後のみ**(AdWhispr の add_brand と同じ扱い)。

---

## 1回のリサーチの標準予算

| 工程 | パターン | 💳 |
|---|---|---|
| 全体観測 | P1 | 1〜2 |
| カテゴリ偵察 ×2カテゴリ | P2 | 2〜6 |
| 商品検証 ×3〜5商品 | P3 | 6〜15 |
| 裏取り | P4 / P5 | 2〜4 |
| **合計** | | **11〜27** |

残クレジットが合計予算を下回るときは、着手前に Owner に報告して優先順位を決める。
実行後は消費数と「どのパターンを何回使ったか」を記録に残す(SKILL §7)。

## パターン選択の早見表

| 状況 | パターン |
|---|---|
| 何を売るか全く決まっていない | P1 → P2 |
| カテゴリはある・商品を探したい | P2 → P3 |
| 商品候補がある・需要の証拠が欲しい | P3(+P4で販売実数) |
| 日本市場で何が売れているか知りたい | **P5**(visitor_country_main=JP) |
| 競合ブランドを1社深掘りしたい | P3-3 / brief_competitor(広告分析主体なら ad-benchmark-creative へ) |
| 次に来るカテゴリを仕込みたい | P6 |
| 決めた対象を監視したい | P7 |
