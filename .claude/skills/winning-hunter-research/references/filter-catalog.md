# Winning Hunter 検索指標カタログ(2026-08-31 スキーマ実測)

MCP ツールスキーマから洗い出した「検索に使える全指標」。
**スキーマの取得(ToolSearch)はクレジット消費ゼロ。ツール実行は1回=1クレジット。**
条件の使い分けは `search-patterns.md`、閾値の既定値は SKILL.md §1 が正。

## 1. Meta(Facebook/Instagram)広告 — `search_facebook_ads` / `find_winning_products`

`find_winning_products` は同じフィルタで **3つが強制固定**:
active(直近4日以内に確認)/ ad_score=winning / page_type=products。
US指定で min_active_ads 未指定だと自動で 50 が入る。自由に組みたいときは `search_facebook_ads`。

### 継続性・規模(「売れている証拠」の主役)

| 指標 | 引数 | 意味・注意 |
|---|---|---|
| 出稿継続日数 | `min_days_running` / `max_days_running` | ⚠️ ティア制限あり。弾かれたら `sort_by=longestrunning` で代替 |
| 同一広告の重複数 | `min_duplicates` / `max_duplicates` | **同じクリエイティブを何本併走させているか。勝ち広告の最重要シグナル** |
| ページの総アクティブ広告数 | `min_active_ads` / `max_active_ads` | 広告主の投資規模 |
| アクティブ広告数の伸び率 | `min/max_active_ads_growth` + `active_ads_growth_period`(1w/1m/3m) | **スケール中の広告主を捕まえる**。%指定・負値可 |
| 広告費(EU圏) | `min/max_ad_spend` + `ad_spend_timeframe`(all/7/30/90) | ローリング合計。EUデータのみ。ティア制限あり |
| リーチ(EU圏) | `min/max_reach` + `reach_timeframe` | 同上。**エンゲージメント率の直接フィルタは無い** — reach・duplicates・scaling が代理指標 |
| スケーリング状態 | `scaling`(rising/stable/declining/upscaling/downscaling/nodownscaling) | 出稿の増減モメンタム |
| ブランド内広告ランク | `min/max_ad_rank`, `rank_growth_filter`(rising/stable/declining) | rank 1 = そのブランドの最強広告 |

### 期間

| 指標 | 引数 | 注意 |
|---|---|---|
| 広告開始日 | `ad_created_from/to` | Meta の started。**必ずペアで指定** |
| 最終確認日 | `last_seen_from/to` | 「今も出ているか」。ペア必須 |
| FBページ作成日 | `page_created_from/to` | 新興ブランドの検出に使える |
| 商品登録日 | `product_created_from/to` | Shopify側の商品作成日 |

「ある月に出稿されていた広告」= `ad_created_to`=月末 + `last_seen_from`=月初。

### 商品・ストア側

| 指標 | 引数 | 注意 |
|---|---|---|
| 価格帯 | `min_price` / `max_price` | LP上の商品価格(ストア通貨のまま) |
| ストア商品数 | `min/max_products_on_store` | 単品ストアの検出(max=5等) |
| 月間訪問数 | `min/max_monthly_visits` | ティア制限あり |
| ページいいね数 | `min/max_page_likes` | |
| LPタイプ | `page_type`(products/collections/funnels/nofunnels) | |
| 技術 | `technology`(SH=Shopify 等40種) / `theme` / `apps` / `exclude_apps` | Shopify限定リサーチは SH |

### 分類・地域・言語・体裁

| 指標 | 引数 | 注意 |
|---|---|---|
| カテゴリ(ニッチ) | `niche` / `niches`(58コード) | コード→ラベル対応は応答の `allowed_niches`。**カテゴリ検索はキーワードでなくこちら** |
| 配信先の国 | `country` / `countries` / `exclude_countries`(23カ国) | **広告のターゲット国。店の所在地ではない**。日本(JP)は無い → 日本向けは keyword に日本語 or `language` では拾えないので注意 |
| 店の所在国 | `store_based_in` | MX/CO/CL 等はこちら |
| 言語 | `language(s)` / `exclude_languages`(14言語。**ja 無し**) | |
| キーワード | `keyword` + `searchkeyword`(All/landingurl/pagename/adtext/productname) | 商品名・ドメイン・フック文用。カテゴリには使わない |
| 形式 | `media_type`(videos/images/carousel/dco), `min/max_video_length`, `min/max_copy_length`, `low_impressions=hide` | |

### 並び替え・ページング

- `sort_by`: relevance / datefound / mostrecent / lastseen / adspend / **longestrunning** /
  reach / adsetamount / **consistency** / monthlyvisits / monthlyrevenue / pageactiveads / toprank
- 深いページングは **`scroll`(応答のカーソルを次回に渡す)**。page 増加だけでは進まない
- `include_filter_reference=true` で全カタログ(niche対応表など)が応答に付く

## 2. TikTok Shop — `search_tiktok_products` ほか

| 指標 | 引数 |
|---|---|
| 売上額 | `min_revenue` / `max_revenue` |
| 販売個数 | `min_units_sold` / `max_units_sold` |
| 価格帯 | `min_price` / `max_price` |
| カテゴリ | `category_id`(`browse_tiktok_categories` で階層取得、`autocomplete_tiktok` で検索) |
| 国 | `country`(既定 US) |
| キーワード | `keyword` |

- トレンド: `get_tiktok_trending_products`(category / country / timeframe)
- ショップ: `search_tiktok_shops`(min/max_revenue)/ クリエイター・動画も同形
- 件数だけ欲しいとき: `count_tiktok_entities`(行データなし=軽い)
- 深掘り(1件単位): `get_tiktok_product(id, slice=detail|history|metrics|creators|videos)`。
  shop は `strategy` スライスあり
- ページング: 応答 `meta.next_cursor` を `after` に渡す(keyset)。sort候補は応答の `mcp_sorting`

## 3. Shopifyストア逆引き — `search_shopify_stores`

売れている「店」から商品を読む。**推定月商・成長率で絞れるのが最大の強み。**

| 指標 | 引数 |
|---|---|
| 推定売上 | `min/max_revenue`(30日)、`min/max_annual_revenue`(年) |
| 売上成長率 | `revenue_change_pct_min/max`(30日、%) |
| トラフィック | `monthly_visits_min/max`、`traffic_growth_rules_json`(1/3ヶ月・growth/loss・%) |
| 訪問者の国 | `visitor_country_main`(最大シェア国)/ `among` / `exclude` — **「日本人が買っている店」は `visitor_country_main=JP`** |
| 店の所在国 | `country`(**JP あり**・45カ国) |
| AOV | `aov_min/max` |
| 商品数 | `product_count_min/max` |
| 開店時期 | `store_created_from/to`(first_product_date・ペア必須) |
| 信頼 | `trustpilot_rating_min/max`, `trustpilot_reviews_min/max` |
| 分類 | `niche`(9種: Clothing/Beauty/Health/Pet Supplies 等)+ `product_taxonomy_l1..l3`(値は `list_shopify_store_filter_options` で取得) |
| 体裁 | `language`(**ja あり**)/ `currency` / `shopify_themes` / `store_apps` |
| 並び | `sort_by`: monthly_visits / 30d_rev_estimated_max / 1d_rev_estimated_max / revenue_1y / aov / visits_growth_pct_m1 / visits_growth_pct_m3 / first_product_date |

深掘り: `get_store_details`(売上・成長・アプリ・テーマ・トラフィック)/
`get_store_top_ads`(その店の勝ち広告 Meta/TikTok/Google)/ `find_similar_shops` /
`find_similar_stores_by_image`(画像から類似ストア)。

## 4. トレンド先行 — `search_exploding_topics`

keyword / category / timeframe(+変化率系)で急上昇トピックを検索。
広告に現れる前の需要の兆しを拾う。詳細は `get_exploding_topic_detail`。

## 5. 定点観測・その他

- `daily_radar`: 日次の注目広告レーダー(limit / view / creative_signals)
- `track_brand` / `track_store` / `list_tracked_brands` / `analyze_tracked_brand`: 追跡(**書き込み系。枠を消費するのでOwner確認後のみ**)
- `brief_competitor`: 競合1社のブリーフ生成
- `scan_ad` / `save_ad` / `get_ad_transcript`: 広告単体の解析・保存・文字起こし(ad-benchmark-creative 側の道具)
- Google広告: `search_google_ads` / `get_google_advertiser`、Pinterest: `search_pinterest_ads`

## 6. 全体の注意(実測・スキーマ由来)

1. **エンゲージメント率の直接フィルタは存在しない。** 代理指標は
   ①同一広告の重複数(duplicates) ②EUリーチ ③scaling/rank momentum ④active_ads_growth
2. **ティア制限**: min_days_running / min_ad_spend / min_reach / min_traffic / ad_score は
   プランによって `{"upgrade":...}` が返る。返ったら sort での代替(longestrunning 等)に切り替え、
   その旨を記録に残す
3. **国の意味が3種類ある**: 広告の配信先(`countries`)/ 店の所在(`store_based_in`・store検索の`country`)/
   訪問者の国(`visitor_country_*`)。混ぜると誤読する
4. **Meta広告検索に日本(JP)ターゲットは無い。** 日本市場の観測は
   ①`search_shopify_stores` の `visitor_country_main=JP` ②TikTok の `country=JP`(可否は実測) ③日本語キーワード、で行う
5. 日付フィルタは**必ずペア**(from/to 片方だけはエラー)
6. 不正なカタログ値を渡すと検索は実行されず `allowed_values` が返る(コード表の取得手段でもある)
