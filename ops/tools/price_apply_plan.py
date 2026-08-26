#!/usr/bin/env python3
"""
Shopify へ流す価格変更の実行計画を作り、**流す前に全件照合する。**

    python3 ops/tools/price_apply_plan.py <variants.json>

`variants.json` は Admin API から取った Variant 実査
(sku -> {gid, variant, price, compareAt, product, productGid, status})。

出力: ops/promotions/_price_apply_plan_20260826.csv
      ops/promotions/_price_apply_variables_20260826.json(product ごとの bulk update)

**照合に1件でも失敗したら計画を出さずに落とす。**
- 台帳の現価格と Shopify の実価格が一致すること
- SKU が Shopify に存在すること
- 対象分類(SUMMER_SALE / MULTI_BUY)以外を含まないこと
- 変更後の価格が台帳の新通常価格と一致すること
"""
import csv, json, os, sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLAN = os.path.join(ROOT, 'products', '_price_plan_variants_20260825.csv')
OUT_CSV = os.path.join(ROOT, 'promotions', '_price_apply_plan_20260826.csv')
OUT_VAR = os.path.join(ROOT, 'promotions', '_price_apply_variables_20260826.json')

TARGET_CLASSES = ('SUMMER_SALE', 'MULTI_BUY')


def main(variants_path):
    live = json.load(open(variants_path, encoding='utf-8'))
    with open(PLAN, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))

    errors, plan, unchanged, skipped = [], [], [], []
    for r in rows:
        sku = r['sku']
        if r['分類'] not in TARGET_CLASSES:
            skipped.append((r['商品'], r['variant'], r['分類']))
            continue
        v = live.get(sku)
        if v is None:
            errors.append(f"SKU が Shopify に無い: {r['商品']} / {r['variant']} / {sku}")
            continue
        if v['product'] != r['商品']:
            errors.append(f"商品名が一致しない: {sku} 台帳={r['商品']} Shopify={v['product']}")
            continue
        cur, new = int(r['現価格']), int(r['新通常価格'])
        if int(float(v['price'])) != cur:
            errors.append(f"現価格が一致しない: {r['商品']} / {r['variant']} "
                          f"台帳=¥{cur:,} Shopify=¥{int(float(v['price'])):,}")
            continue
        if v['compareAt'] is not None:
            errors.append(f"compare_at_price が既に入っている: {r['商品']} / {r['variant']}")
            continue
        if cur == new:
            unchanged.append((r['商品'], r['variant'], cur))
            continue
        plan.append({
            '商品': r['商品'], 'variant': r['variant'], 'sku': sku,
            'Product GID': v['productGid'], 'Variant GID': v['gid'],
            'status': v['status'], '分類': r['分類'],
            'old_price': cur, 'new_price': new,
        })

    if errors:
        print(f'❌ 照合に失敗した {len(errors)} 件。**何も実行しない。**')
        for e in errors[:40]:
            print('  ', e)
        sys.exit(1)

    # DRAFT / 保留の商品が紛れていないか(分類で弾いているはずだが二重に見る)
    draft = [p for p in plan if p['status'] != 'ACTIVE']
    if draft:
        print('❌ ACTIVE でない商品が計画に入っている。中止する。')
        for p in draft[:10]:
            print('  ', p['商品'], p['status'])
        sys.exit(1)

    with open(OUT_CSV, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(plan[0].keys()))
        w.writeheader(); w.writerows(plan)

    by_product = defaultdict(list)
    for p in plan:
        by_product[p['Product GID']].append({'id': p['Variant GID'], 'price': str(p['new_price'])})
    batches = [{'productId': pid, 'variants': vs} for pid, vs in by_product.items()]
    with open(OUT_VAR, 'w', encoding='utf-8') as f:
        json.dump(batches, f, ensure_ascii=False, indent=2); f.write('\n')

    print(f'出力: {OUT_CSV}')
    print(f'出力: {OUT_VAR}\n')
    print(f'変更する Variant: {len(plan)}  /  {len(by_product)} 商品')
    print(f'価格が同じで変更不要: {len(unchanged)}')
    print(f'対象外(分類が SALE/MB でない): {len(skipped)}')
    print(f'照合エラー: 0\n')
    for pid, vs in by_product.items():
        name = next(p['商品'] for p in plan if p['Product GID'] == pid)
        prices = sorted({(p['old_price'], p['new_price']) for p in plan if p['Product GID'] == pid})
        s = ' / '.join(f'¥{o:,}→¥{n:,}' for o, n in prices)
        print(f'  {name} ({len(vs)} Variant): {s}')


if __name__ == '__main__':
    main(sys.argv[1])
