#!/usr/bin/env python3
"""
Variant 単位の監査結果を、Owner が判断しやすい **商品単位** に畳む。

    python3 ops/tools/price_audit.py      # 先にこれ
    python3 ops/tools/product_summary.py

入力: ops/products/_price_audit_variants_computed.csv
出力: ops/products/_price_summary_by_product.csv + 標準出力の表

**原価待ちの商品は「原価待ち」のまま残す。推測で埋めない。**

判定(docs/12 §3-4 のスクリーニング):
  OK        … 15%OFF 後も ×2.6 以上
  要検討    … 15%OFF 後に ×2.6 を割る Variant がある
  再設計必要 … 通常価格ですら ×3.0 を割る Variant がある
  原価待ち   … ckb_cost / landed のどちらも無い
"""
import csv, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'products', '_price_audit_variants_computed.csv')
OUT = os.path.join(ROOT, 'products', '_price_summary_by_product.csv')


def num(v):
    if v is None:
        return None
    v = str(v).strip().replace(',', '').replace('¥', '').replace('%', '')
    if v in ('', '未確認', '原価待ち', '赤字'):
        return None
    try:
        return float(v)
    except ValueError:
        return None


def rng(values, fmt='¥{:,.0f}'):
    vals = [v for v in values if v is not None]
    if not vals:
        return '原価待ち'
    lo, hi = min(vals), max(vals)
    return fmt.format(lo) if lo == hi else f'{fmt.format(lo)} – {fmt.format(hi)}'


def main():
    if not os.path.exists(SRC):
        raise SystemExit(f'先に price_audit.py を走らせる: {SRC} が無い')

    by_product = {}
    order = []
    with open(SRC, newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f):
            p = r['product']
            if p not in by_product:
                by_product[p] = []
                order.append(p)
            by_product[p].append(r)

    rows = []
    for p in order:
        vs = by_product[p]
        prices  = [num(r['price']) for r in vs]
        ckb     = [num(r['ckb_cost']) for r in vs]
        ship    = [num(r['ship_est']) for r in vs]
        landed  = [num(r['landed']) for r in vs]
        waiting = all(l is None for l in landed)

        row = {
            '商品名': p,
            'status': vs[0]['status'],
            'tier': vs[0]['tier'],
            'Variant数': len(vs),
            'CKB原価レンジ': rng(ckb),
            'ship_est': rng(ship),
            '推定着地原価レンジ': rng(landed),
            '現価格レンジ': rng(prices),
        }

        if waiting:
            for k in ('現在倍率', '通常価格再設計案', '再設計後倍率',
                      '0%粗利率', '10%OFF粗利率', '15%OFF粗利率',
                      '限界利益(通常)', '限界利益(15%OFF)',
                      'BE_ROAS(通常)', 'BE_ROAS(15%OFF)',
                      'CPA上限(通常)', 'CPA上限(15%OFF)', '判定'):
                row[k] = '原価待ち'
            rows.append(row)
            continue

        mult   = [num(r['mult_now']) for r in vs]
        prop   = [num(r['price_proposed']) for r in vs]
        pmult  = [num(r['mult_proposed']) for r in vs]
        g0     = [num(r['通常_粗利率']) for r in vs]
        g10    = [num(r['10%OFF_粗利率']) for r in vs]
        g15    = [num(r['15%OFF_粗利率']) for r in vs]
        cm0    = [num(r['通常_限界利益']) for r in vs]
        cm15   = [num(r['15%OFF_限界利益']) for r in vs]
        roas0  = [num(r['通常_BE_ROAS']) for r in vs]
        roas15 = [num(r['15%OFF_BE_ROAS']) for r in vs]
        cpa0   = [num(r['通常_CPA上限']) for r in vs]
        cpa15  = [num(r['15%OFF_CPA上限']) for r in vs]

        # 判定は「いちばん悪い Variant」で決める。平均で隠さない。
        worst_now = min([m for m in mult if m is not None], default=None)
        worst_15  = min([(num(r['price']) * 0.85) / num(r['landed'])
                         for r in vs if num(r['landed'])], default=None)
        if worst_now is not None and worst_now < 3.0:
            verdict = f'再設計必要(通常でも ×{worst_now:.2f})'
        elif worst_15 is not None and worst_15 < 2.6:
            verdict = f'要検討(15%OFF後 ×{worst_15:.2f})'
        else:
            verdict = 'OK'

        row.update({
            '現在倍率': rng(mult, '×{:.2f}'),
            '通常価格再設計案': rng(prop),
            '再設計後倍率': rng(pmult, '×{:.2f}'),
            '0%粗利率': rng(g0, '{:.1f}%'),
            '10%OFF粗利率': rng(g10, '{:.1f}%'),
            '15%OFF粗利率': rng(g15, '{:.1f}%'),
            '限界利益(通常)': rng(cm0),
            '限界利益(15%OFF)': rng(cm15),
            'BE_ROAS(通常)': rng(roas0, '{:.2f}'),
            'BE_ROAS(15%OFF)': rng(roas15, '{:.2f}'),
            'CPA上限(通常)': rng(cpa0),
            'CPA上限(15%OFF)': rng(cpa15),
            '判定': verdict,
        })
        rows.append(row)

    with open(OUT, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)

    print(f'出力: {OUT}  ({len(rows)} 商品)\n')
    hdr = ['商品名', 'Variant数', 'CKB原価レンジ', 'ship_est', '推定着地原価レンジ',
           '現価格レンジ', '現在倍率', '通常価格再設計案', '15%OFF粗利率',
           'BE_ROAS(15%OFF)', 'CPA上限(15%OFF)', '判定']
    print(' | '.join(hdr))
    for r in rows:
        print(' | '.join(str(r[h]) for h in hdr))

    from collections import Counter
    c = Counter(r['判定'].split('(')[0] for r in rows)
    print('\n判定の内訳:', dict(c))
    print('\n※ 着地原価はほぼ全て **推定**(ckb_cost + ship_est)。')
    print('※ ship_est は実送料ではなく価格設計用の送料概算。docs/10 §4。')


if __name__ == '__main__':
    main()
