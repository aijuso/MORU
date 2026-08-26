#!/usr/bin/env python3
"""
価格反映と metafield 設定の readback を全件照合する。

    python3 ops/tools/price_readback_verify.py <readback_page1.json> <readback_tail.json>

期待値:
  ops/promotions/_price_apply_plan_20260826.csv        変更した 211 Variant(old → new)
  ops/products/_price_plan_variants_20260825.csv       全 257 Variant(対象外は現価格のまま)
  ops/promotions/_multibuy_assignment_20260826.csv     metafield を立てる 13商品

**1件でも不一致があれば非ゼロで終了する。**
"""
import csv, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)


def load_live(paths):
    live = {}
    for path in paths:
        raw = json.load(open(path, encoding='utf-8'))
        nodes = raw['data']['productVariants']['nodes'] if isinstance(raw, dict) else raw
        for n in nodes:
            live[n['sku']] = n
    return live


def main(paths):
    live = load_live(paths)
    with open(P('products', '_price_plan_variants_20260825.csv'), newline='', encoding='utf-8') as f:
        plan = list(csv.DictReader(f))
    with open(P('promotions', '_price_apply_plan_20260826.csv'), newline='', encoding='utf-8') as f:
        applied = {r['sku']: r for r in csv.DictReader(f)}
    with open(P('promotions', '_multibuy_assignment_20260826.csv'), newline='', encoding='utf-8') as f:
        want_mf = {r['Product GID'] for r in csv.DictReader(f)}

    rows, mismatch = [], []
    for r in plan:
        sku = r['sku']
        n = live.get(sku)
        if n is None:
            mismatch.append(f'readback に SKU が無い: {r["商品"]} / {r["variant"]}')
            continue
        old = int(applied[sku]['old_price']) if sku in applied else int(r['現価格'])
        expected = int(r['新通常価格']) if sku in applied else int(r['現価格'])
        actual = int(float(n['price']))
        ok = actual == expected
        if not ok:
            mismatch.append(f'{r["商品"]} / {r["variant"]}: 期待 ¥{expected:,} 実測 ¥{actual:,}')
        if n.get('compareAtPrice') is not None:
            mismatch.append(f'compare_at_price が入っている: {r["商品"]} / {r["variant"]}')
        rows.append({'商品': r['商品'], 'variant': r['variant'], 'sku': sku, '分類': r['分類'],
                     '変更対象': 'YES' if sku in applied else 'NO',
                     'old_price': old, 'expected_price': expected, 'new_price': actual,
                     'compare_at': n.get('compareAtPrice') or '',
                     '判定': 'match' if ok else 'MISMATCH'})

    out = P('promotions', '_price_readback_20260826.csv')
    with open(out, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

    changed = [r for r in rows if r['変更対象'] == 'YES']
    print(f'出力: {out}')
    print(f'readback した Variant: {len(rows)} / 257')
    print(f'  変更対象:   {len(changed)}  (match {sum(1 for r in changed if r["判定"]=="match")})')
    print(f'  変更対象外: {len(rows)-len(changed)}  (match {sum(1 for r in rows if r["変更対象"]=="NO" and r["判定"]=="match")})')
    print(f'  compare_at_price が入っている: {sum(1 for r in rows if r["compare_at"])}')

    # ---- metafield ----
    got = {}
    for n in live.values():
        p = n.get('product')
        if not p:
            continue
        got[p['id']] = (p['title'], (p.get('multiBuy') or {}).get('value'))
    if got:
        true_set = {pid for pid, (_, v) in got.items() if v == 'true'}
        print(f'\nmetafield custom.multi_buy_eligible = true: {len(true_set)} 商品(期待 {len(want_mf)})')
        missing = want_mf - true_set
        extra = true_set - want_mf
        for pid in missing:
            mismatch.append(f'metafield が立っていない: {pid}')
        for pid in extra:
            mismatch.append(f'metafield を立てるべきでない商品に立っている: {got[pid][0]} {pid}')
        print(f'  設定漏れ: {len(missing)} / 誤設定: {len(extra)}')
        others = [t for pid, (t, v) in got.items() if pid not in want_mf and v is not None]
        print(f'  対象外商品で値が入っているもの: {len(others)} {others}')
    else:
        print('\n(readback に product/metafield が含まれていないので metafield は別途確認)')

    print(f'\n不一致: {len(mismatch)} 件')
    for m in mismatch[:40]:
        print('  ', m)
    sys.exit(1 if mismatch else 0)


if __name__ == '__main__':
    main(sys.argv[1:])
