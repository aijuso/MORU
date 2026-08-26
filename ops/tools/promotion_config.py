#!/usr/bin/env python3
"""
統合 Function `moru-promotions-discount` に渡す設定 JSON と、
`custom.multi_buy_eligible` の設定予定一覧を生成する。

    python3 ops/tools/promotion_config.py

入力:
  ops/products/_product_classification_20260825.csv   36商品の販売施策分類
  ops/products/_pair_definitions.csv                  PAIR 候補
  ops/promotions/_shopify_gids_20260826.json          商品名 → Product GID(Admin 実査)

出力:
  ops/promotions/_discount_config_20260826.json       Discount app metafield に入れる JSON
  ops/promotions/_multibuy_assignment_20260826.csv    metafield 設定予定一覧(Owner 確認用)

**まとめ買いの対象商品は設定 JSON に入れない(D-134)。**
Product metafield `custom.multi_buy_eligible` が唯一の正本。
Frontend(PDP の UI 出し分け)も同じ metafield を見ているため、
ここに productIds を置くと同じことを2箇所で手管理することになる。

**この スクリプトは Shopify を1件も変更しない。**ファイルを書くだけ。
"""
import csv, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)

FREE_SHIPPING_THRESHOLD = 7700   # docs/13 §9。Owner 決定で ¥7,700 のまま。
SALE_PERCENTAGE         = 10     # docs/13 §3-A
SALE_TITLE              = 'SUMMER SALE'
MULTI_BUY_TIERS         = [{'minQuantity': 2, 'percentage': 10},
                           {'minQuantity': 3, 'percentage': 15}]
# 初回に出す PAIR。ほかの候補は採算まで出してあるが、Owner 決定で P-6 のみ。
ACTIVE_PAIR_IDS         = ['P-6']
# セット価格に既にセットメリットが入っているため Sale を重ねない(D-126)。
# **Product 単位では外せないので Variant で持つ。**
SALE_EXCLUDED_VARIANTS  = {
    'ハル ダイニングチェア': [
        ('gid://shopify/ProductVariant/50296095768816', 'チェリー × ミルクブラウンレザー調（2脚セット）'),
        ('gid://shopify/ProductVariant/50296095670512', 'ウォールナット × グレーレザー調（2脚セット）'),
    ],
}


def main():
    gids = json.load(open(P('promotions', '_shopify_gids_20260826.json'), encoding='utf-8'))
    with open(P('products', '_product_classification_20260825.csv'), encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    with open(P('products', '_pair_definitions.csv'), encoding='utf-8') as f:
        pairdefs = list(csv.DictReader(f))

    cls = {r['product']: r['classification'] for r in rows}
    unknown = [p for p in cls if p not in gids]
    if unknown:
        raise SystemExit(f'GID の無い商品がある: {unknown}')

    sale_products  = [r['product'] for r in rows if r['classification'] == 'SUMMER_SALE']
    multi_products = [r['product'] for r in rows if r['classification'] == 'MULTI_BUY']

    # ---- Discount 設定 JSON ----
    pairs = []
    for pd in pairdefs:
        if pd['pair_id'] not in ACTIVE_PAIR_IDS:
            continue
        pairs.append({
            'id': pd['pair_id'],
            'title': pd['pair_name'],
            'productIds': [gids[pd['product_a']], gids[pd['product_b']]],
            'percentage': int(pd['percentage']),
        })

    excluded = [vid for pairsv in SALE_EXCLUDED_VARIANTS.values() for vid, _ in pairsv]

    config = {
        'freeShippingThreshold': FREE_SHIPPING_THRESHOLD,
        'pairs': pairs,
        # 対象商品リストは持たない。正本は Product metafield(D-134)。
        'multiBuy': {'tiers': MULTI_BUY_TIERS},
        'sale': {
            'title': SALE_TITLE,
            'percentage': SALE_PERCENTAGE,
            'productIds': [gids[p] for p in sale_products],
            'excludedVariantIds': excluded,
        },
    }
    out_json = P('promotions', '_discount_config_20260826.json')
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
        f.write('\n')

    # ---- metafield 設定予定一覧 ----
    # DRAFT / 保留の商品には設定しない。分類が MULTI_BUY のものだけ。
    assign = [{'商品': p, 'Product GID': gids[p], 'namespace': 'custom',
               'key': 'multi_buy_eligible', 'type': 'boolean', 'value': 'true',
               '現在値': '未設定'} for p in multi_products]
    out_csv = P('promotions', '_multibuy_assignment_20260826.csv')
    with open(out_csv, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(assign[0].keys()))
        w.writeheader(); w.writerows(assign)

    print(f'出力: {out_json}')
    print(f'出力: {out_csv}  ({len(assign)} 商品)\n')
    print(f'PAIR:            {[p["id"] for p in pairs]}')
    print(f'Summer Sale:     {len(sale_products)} 商品 / 除外 Variant {len(excluded)} 件')
    print(f'まとめ買い:       {len(multi_products)} 商品(metafield で制御・設定 JSON には入れない)')
    print(f'送料無料しきい値: ¥{FREE_SHIPPING_THRESHOLD:,}')
    skipped = [r['product'] for r in rows if r['classification'] not in ('SUMMER_SALE', 'MULTI_BUY')]
    print(f'\n施策に載せない {len(skipped)} 商品(metafield も設定しない): {skipped}')


if __name__ == '__main__':
    main()
