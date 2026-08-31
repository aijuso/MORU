# Winning Hunter 試運転(P1 市場パルス)— 2026-08-31

> 目的: パターン定義(`.claude/skills/winning-hunter-research/references/search-patterns.md`)の
> 動作検証。商品選定が目的ではない(リブランド方向 A/B/C は未決のまま)。

## 実行条件(§1 テンプレート)

| 条件 | 値 |
|---|---|
| パターン | P1 市場パルス(カテゴリ無指定) |
| ツール | ①`find_winning_products` → **ティア制限で失敗**(`upgrade: standard_adscore`)②`search_facebook_ads` で代替 |
| フィルタ | `country=US, min_duplicates=3, min_active_ads=10, page_type=products, sort_by=longestrunning desc` |
| 該当件数 | **133,369件**(上位20件を取得) |
| 消費クレジット | **10**(3呼び出し: 失敗1 + 検索1 + 残量確認1)。残88/100 |

## 結果の要点(上位20件から)

**長期継続 = 実証済みの勝ち筋。** 2023年開始で今も出稿中の広告が上位を占めた。

| 傾向 | 実例(商品URL) | 価格 | 証拠 |
|---|---|---|---|
| 教育玩具×祖父母ギフト訴求 | [Montessori Sensory Book](https://www.projectmontessori.com/products/montessori-sensory-book)(Project Montessori) | $29.95 | ページ広告196本・**1週間で+242%成長**・同一広告48本併走 |
| Q4(クリスマス)を8月から仕込む | [Kids Christmas Tree](https://www.projectmontessori.com/products/kids-christmas-tree)(2024-11開始で継続) / [パーソナライズオーナメント](https://trendingcustom.com/products/kid-sitting-in-grandma-mom-lap-crossed-leg-christmas-gift-psnl-acrylic-ornament-1394283)(ページ広告**2,683本**) | $29前後 | 季節商材のリード時間は2〜3ヶ月 |
| 高単価ニッチ道具 | [Sauna Suit](https://fighthausmma.com/products/contender-sauna-suit-blackout)($119・EU費用$3.7k) / [Meat Bags](https://bornandraisedoutdoors.com/products/meat-bags)($129.99・2023年から) | $119〜129 | 単品高粗利は「専門性×機能」で成立 |
| パーソナライズ・ギフト | [刺繍スウェット](https://godmerch.com/products/godmerch-grandma-nana-embroidered-sweatshirt) / [Paw Necklace](https://www.pawsomecouture.com/collections/jewelry/products/teeny-tiny-paw-necklace)($39・ペット追悼) | $20〜39 | 名入れ=価格競争回避の定番構造 |
| ペット×アパレル/ジュエリー | [Dog Breed Hoodie](https://chrisraw.com/collections/dog-breed-hoodie-unisex) / 上記 Paw Necklace | $39前後 | ペット感情訴求は米国で長期継続の実績 |
| カスタム看板(高単価) | [Metal LED Sign](https://afcultures.com/products/business-neon-signs/)($299.95・Trustpilot 4.5を広告に明記) | $299.95 | レビューの「信頼の証拠」型 |

MORU文脈でのメモ: ペット系で長期継続していたのは**「モノ」より「感情(追悼・犬種アイデンティティ)」**。
インテリア大型は上位に不在。パーソナライズ×ギフトの構造は§4(高単価尖り型B)の参考になる。

## 検証で得た運用上の学び(パターン定義に反映済み)

1. **`find_winning_products` は現プランで使えない**(ad_score=winning がティア制限)。
   P1 の既定を `search_facebook_ads` +併走数フィルタに変更した
2. **クレジットは「1呼び出し=1」ではない。** 3呼び出しで10消費(検索系は重い)。
   1リサーチの予算見積りを引き上げ、`check_credits` を頻繁に叩かない
3. `min_duplicates=3` + `min_active_ads=10` は機能する(フィルタ echo で確認)。
   ただし `longestrunning` は「3年もの」の常勝広告が並ぶ — **市場の地力を見る用**。
   「いま伸びているもの」は `sort_by=adspend` や `min_active_ads_growth` で別途見る
4. ティア制限の実測: `min_days_running` は未検証、`ad_score` は不可。上位プランなら解禁
5. ページングは応答の `scroll` を次回に渡す方式で動作(`has_more: true` 確認)
