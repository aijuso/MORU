#!/usr/bin/env python3
"""
docs/13 の価格設計ロジックで、新通常価格案の採算を Variant 単位で再計算する。

    python3 ops/tools/price_audit.py     # 先にこれ(着地原価の確定)
    python3 ops/tools/price_plan.py

入力:
  ops/products/_price_audit_20260824_variants.csv        Variant 台帳(Shopify 実査)
  ops/products/_ckb_costs.csv                            CKB 商品原価(生値)
  ops/products/_new_price_map_20260825.csv               Owner 承認済み 新通常価格
  ops/products/_product_classification_20260825.csv      商品ごとの販売施策分類
  ops/products/_pair_definitions.csv                     PAIR 候補

出力:
  ops/products/_price_plan_variants_20260825.csv         Variant 単位
  ops/products/_price_plan_by_product_20260825.csv       商品単位(Owner 確認表)
  標準出力に警告一覧

**docs/13 が最新の価格ルール。×3.0 / 割引後 ×2.6 は Hard Gate ではなく参考指標。**

着地原価の採用順は price_audit.py と同じ(D-112):
  1. landed 実測  2. ckb_cost + ship_est  3. 原価待ち
⚠️ ship_est は実送料ではなく **価格設計用の送料概算**(小物 ¥800 / 中型 ¥1,750 / 大型 ¥3,500)。
"""
import csv, os, sys
from collections import defaultdict

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P      = lambda *a: os.path.join(ROOT, 'products', *a)
LEDGER = P('_price_audit_20260824_variants.csv')
COSTS  = P('_ckb_costs.csv')
PMAP   = P('_new_price_map_20260825.csv')
CLASS  = P('_product_classification_20260825.csv')
PAIRS  = P('_pair_definitions.csv')
OUT_V  = P('_price_plan_variants_20260825.csv')
OUT_P  = P('_price_plan_by_product_20260825.csv')
OUT_S  = P('_refund_scenarios_20260825.csv')

# docs/10 §4。いずれも実測ではない。
PAYMENT_FEE_RATE = 0.036   # 仮置き(実測なし)
CPA_RATIO        = 0.70
# 30日間安心保証(D-125 / **D-130 で式を訂正**)の返金引当。
# **実績がないための暫定引当**であって「返品率が 5% である」という主張ではない。
# 中心値 5% で判断し、3% / 8% も併記する。
REFUND_RESERVES  = (0.03, 0.05, 0.08)
REFUND_CENTRAL   = 0.05
# 返金1件あたりに **追加で** かかる費用(返送料 / 再配送費 / 決済手数料の非返還分 /
# 返金処理費用)。**いずれも実測が無いので現在 0 円**。値が分かったらここを直す。
# 0 のまま「費用は無い」と読まないこと。未計上であることを出力にも明記している。
REFUND_EXTRA_PER_CASE = 0
FREE_SHIP        = 7700    # 送料無料しきい値(割引後 subtotal で判定)

# docs/13 のスクリーニング目安。Hard Gate にしない。
GM_TARGET        = 0.55    # 粗利率の目安
CM_LARGE_MIN     = 5000    # 大型商品で確保したい限界利益(絶対額)の目安
CM_MID_MIN       = 2500    # 中型
CM_SMALL_MIN     = 800     # 小物


def num(v):
    if v is None: return None
    v = str(v).strip().replace(',', '').replace('¥', '')
    if v in ('', '未確認'): return None
    try: return float(v)
    except ValueError: return None


def econ(price, landed, refund=REFUND_CENTRAL):
    """1点あたりの採算。landed が無ければ None を返す。

    refund は 30日間安心保証の返金引当率。

        返金引当額 = 売価 × refund + 追加費用 × refund

    **着地原価は引当に入れない(D-130)。**粗利額の時点で
    `売価 − 着地原価` として既に控除しているため、引当にも入れると二重控除になる。
    返送料・再配送費・決済手数料の非返還分などが分かれば
    REFUND_EXTRA_PER_CASE に入れる(現在 0・未計上)。
    """
    if landed is None or price is None:
        return None
    gross = price - landed
    fee   = price * PAYMENT_FEE_RATE
    reserve = (price + REFUND_EXTRA_PER_CASE) * refund
    cm    = gross - fee - reserve
    return {
        'price': round(price),
        'gross': round(gross),
        'gm':    gross / price if price else 0.0,
        'fee':   round(fee),
        'reserve': round(reserve),
        'refund_rate': refund,
        'cm':    round(cm),
        'roas':  (price / cm) if cm > 0 else None,
        'cpa':   round(cm * CPA_RATIO) if cm > 0 else 0,
        'mult':  (price / landed) if landed else None,
    }


def load_costs():
    out = {}
    with open(COSTS, newline='', encoding='utf-8-sig') as f:
        for r in csv.DictReader(f):
            parts = [num(r.get(k)) for k in ('ckb_cost','ship_domestic_cn','agent_qc','intl_ship','duty_tax')]
            landed = num(r.get('landed'))
            if landed is None and all(p is not None for p in parts):
                landed = sum(parts)
            out[(r['product'].strip(), r['variant'].strip())] = {'ckb': parts[0], 'landed': landed}
    return out


def load_map():
    out = {}
    with open(PMAP, newline='', encoding='utf-8-sig') as f:
        for r in csv.DictReader(f):
            out[(r['product'].strip(), int(r['current_price']))] = (int(r['new_price']), r['note'])
    return out


def load_class():
    out = {}
    with open(CLASS, newline='', encoding='utf-8-sig') as f:
        for r in csv.DictReader(f):
            out[r['product'].strip()] = (r['classification'], r['reason'])
    return out


def load_pairs():
    with open(PAIRS, newline='', encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))


def main():
    costs, pmap, klass = load_costs(), load_map(), load_class()
    pairdefs = load_pairs()
    # PAIR 15% は「PAIR 定義に載っている商品」だけに立てる。載っていない商品に
    # PAIR 価格を書くと、存在しない割引の採算を並べることになる。
    pair_of = defaultdict(list)
    for pr in pairdefs:
        for side in (pr['product_a'], pr['product_b']):
            pair_of[side.strip()].append(pr['pair_id'])
    rows, warn = [], []
    unmapped = set()

    with open(LEDGER, newline='', encoding='utf-8-sig') as f:
        ledger = list(csv.DictReader(f))

    for r in ledger:
        p, v = r['product'].strip(), r['variant'].strip()
        cls, reason = klass.get(p, ('未分類', ''))
        cur = int(num(r['price']))
        c = costs.get((p, v), {})
        ship_est = num(r['ship_est'])
        landed = c.get('landed')
        src = '実測'
        if landed is None and c.get('ckb') is not None and ship_est is not None:
            landed, src = c['ckb'] + ship_est, '推定(ckb_cost + ship_est)'
        elif landed is None:
            src = '原価待ち'

        # D-126: ハル 2脚セットは Summer Sale から外す。
        # セット価格に既にセットメリットが入っているため、その上に 10% を重ねない。
        sale_excluded = (p == 'ハル ダイニングチェア' and '2脚' in v)
        if cls in ('SUMMER_SALE', 'MULTI_BUY'):
            hit = pmap.get((p, cur))
            if hit is None:
                unmapped.add((p, cur))
                new, note = cur, '⚠️ 新価格マップに無い'
            else:
                new, note = hit
        else:
            new, note = cur, f'価格設計対象外({cls})'

        row = {
            '商品': p, 'variant': v, 'sku': r['sku'], 'status': r['status'],
            'tier': r['tier'], 'cat': r['cat'], '分類': cls,
            'ship_bucket': r['ship_bucket'], 'ship_est': int(ship_est) if ship_est else '',
            'ckb_cost': int(c['ckb']) if c.get('ckb') is not None else '',
            '推定着地原価': int(landed) if landed is not None else '原価待ち',
            'cost_source': src, 'Sale除外': 'YES(セット価格のため)' if sale_excluded else '',
            '現価格': cur, '新通常価格': new, '備考': note,
        }

        # シナリオ。適用しない施策は空欄にする(捏造した数字を並べない)。
        scen = {'通常': 1.00}
        if cls == 'SUMMER_SALE' and not sale_excluded:
            scen['SummerSale10'] = 0.90
        if cls == 'MULTI_BUY':
            scen['MB2点'] = 0.90
            scen['MB3点以上'] = 0.85
        pair_ids = pair_of.get(p, [])
        if pair_ids:
            scen['PAIR15'] = 0.85
        row['PAIR対象'] = ' / '.join(pair_ids) if pair_ids else '—'

        for label, mul in (('通常',1.0),('SummerSale10',0.90),('MB2点',0.90),('MB3点以上',0.85),('PAIR15',0.85)):
            if label not in scen:
                for k in ('売価','粗利額','粗利率','限界利益','BE_ROAS','CPA上限','返金引当','倍率'):
                    row[f'{label}_{k}'] = ''
                continue
            e = econ(new * mul, landed)
            if e is None:
                for k in ('売価','粗利額','粗利率','限界利益','BE_ROAS','CPA上限','返金引当','倍率'):
                    row[f'{label}_{k}'] = '原価待ち'
                continue
            row[f'{label}_売価']     = e['price']
            row[f'{label}_粗利額']   = e['gross']
            row[f'{label}_粗利率']   = f"{e['gm']*100:.1f}%"
            row[f'{label}_限界利益'] = e['cm']
            row[f'{label}_BE_ROAS']  = f"{e['roas']:.2f}" if e['roas'] else '赤字'
            row[f'{label}_CPA上限']  = e['cpa']
            row[f'{label}_返金引当']  = e['reserve']
            row[f'{label}_倍率']     = f"{e['mult']:.2f}" if e['mult'] else ''

        # ---- 警告(§12) ----
        if landed is not None and cls in ('SUMMER_SALE', 'MULTI_BUY'):
            # 最悪ケース = その商品に実際に適用され得るいちばん深い割引
            worst_label, worst_mul = ('通常', 1.00)
            for label, mul in scen.items():
                if mul < worst_mul:
                    worst_label, worst_mul = label, mul
            worst = econ(new * worst_mul, landed)
            if worst['gross'] <= 0:
                warn.append(('🔴 赤字', p, v, f"{worst_label} 売価 ¥{worst['price']:,} < 着地原価 ¥{int(landed):,}"))
            elif worst['gm'] < 0.40:
                warn.append(('🔴 粗利が極端に薄い', p, v, f"{worst_label} 粗利率 {worst['gm']*100:.1f}%"))
            elif worst['gm'] < GM_TARGET:
                warn.append(('🟡 粗利率が目安55%未満', p, v, f"{worst_label} 粗利率 {worst['gm']*100:.1f}%"))
            floor = {'大型': CM_LARGE_MIN, '中型': CM_MID_MIN}.get(r['ship_bucket'], CM_SMALL_MIN)
            if worst['cm'] < floor:
                warn.append(('🟡 絶対粗利額が薄い', p, v,
                             f"{r['ship_bucket']} / {worst_label} 限界利益 ¥{worst['cm']:,} < 目安 ¥{floor:,}"))
            # free shipping 境界
            if new >= FREE_SHIP and worst['price'] < FREE_SHIP:
                warn.append(('🟡 送料無料の境界', p, v,
                             f"通常 ¥{new:,} は無料だが {worst_label} ¥{worst['price']:,} で ¥{FREE_SHIP:,} を割る"))
        rows.append(row)

    # ---- Variant 価格逆転(原価が高いのに価格が同じ/安い) ----
    by_p = defaultdict(list)
    for row in rows:
        by_p[row['商品']].append(row)
    for p, vs in by_p.items():
        pts = [(v['ckb_cost'], v['新通常価格'], v['variant']) for v in vs
               if isinstance(v['ckb_cost'], int)]
        for i in range(len(pts)):
            for j in range(len(pts)):
                if pts[i][0] > pts[j][0] and pts[i][1] < pts[j][1]:
                    warn.append(('🟡 Variant価格逆転', p, pts[i][2],
                                 f"原価 ¥{pts[i][0]:,} > ¥{pts[j][0]:,} なのに価格 ¥{pts[i][1]:,} < ¥{pts[j][1]:,}"))
                    break
            else:
                continue
            break

    # ---- 返金引当 3 / 5 / 8% のシナリオ(D-125) ----
    scen_rows = []
    for row in rows:
        if row['分類'] not in ('SUMMER_SALE', 'MULTI_BUY') or row['推定着地原価'] == '原価待ち':
            continue
        # その商品に実際に適用され得るいちばん深い割引で評価する
        deepest, mul = '通常', 1.00
        for label, m in (('SummerSale10', 0.90), ('MB3点以上', 0.85), ('PAIR15', 0.85)):
            if row.get(f'{label}_売価') not in ('', None, '原価待ち') and m < mul:
                deepest, mul = label, m
        out = {'商品': row['商品'], 'variant': row['variant'], '分類': row['分類'],
               'ship_bucket': row['ship_bucket'], '推定着地原価': row['推定着地原価'],
               '新通常価格': row['新通常価格'], '最悪ケース施策': deepest,
               '最悪ケース売価': round(row['新通常価格'] * mul)}
        for rr in REFUND_RESERVES:
            e = econ(row['新通常価格'] * mul, row['推定着地原価'], refund=rr)
            tag = f'{int(rr*100)}%'
            out[f'引当{tag}_返金引当額'] = e['reserve']
            out[f'引当{tag}_粗利率']     = f"{e['gm']*100:.1f}%"
            out[f'引当{tag}_限界利益']   = e['cm']
            out[f'引当{tag}_BE_ROAS']    = f"{e['roas']:.2f}" if e['roas'] and e['roas'] > 0 else '赤字'
            out[f'引当{tag}_CPA上限']    = e['cpa']
        scen_rows.append(out)
    with open(OUT_S, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(scen_rows[0].keys())); w.writeheader(); w.writerows(scen_rows)

    # ---- カート単位の送料無料しきい値(§12) ----
    for p_, vs in by_p.items():
        if vs[0]['分類'] != 'MULTI_BUY':
            continue
        for v in vs:
            new = v['新通常価格']
            for n, mul in ((2, 0.90), (3, 0.85)):
                plain, disc = new * n, round(new * n * mul)
                if plain >= FREE_SHIP > disc:
                    warn.append(('🟡 送料無料の境界(まとめ買い)', p_, v['variant'],
                                 f'{n}点 通常合計 ¥{plain:,} は無料だが割引後 ¥{disc:,} で ¥{FREE_SHIP:,} を割る'))
                    break

    with open(OUT_V, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

    # ---- 商品単位(Owner 確認表) ----
    def rng(vals, fmt='¥{:,.0f}'):
        # 空欄(その施策を適用しない)と「原価待ち」は別物。混ぜない。
        if all(v in ('', None) for v in vals): return '—'
        vals = [v for v in vals if v not in ('', None, '原価待ち')]
        if not vals: return '原価待ち'
        vals = [float(str(v).replace('%','').replace('¥','').replace(',','')) for v in vals]
        lo, hi = min(vals), max(vals)
        return fmt.format(lo) if lo == hi else f'{fmt.format(lo)} 〜 {fmt.format(hi)}'

    prows = []
    for p, vs in by_p.items():
        cls = vs[0]['分類']
        landed_vals = [v['推定着地原価'] for v in vs if v['推定着地原価'] != '原価待ち']
        waiting = not landed_vals
        # 最悪ケース = いちばん割引が深いシナリオ × いちばん条件の悪い Variant
        worst_key = None
        for cand in ('PAIR15', 'MB3点以上', 'SummerSale10'):
            if any(v.get(f'{cand}_売価') not in ('', None) for v in vs):
                worst_key = cand
                break
        gms = [float(v[f'{worst_key}_粗利率'].rstrip('%')) for v in vs
               if worst_key and v.get(f'{worst_key}_粗利率') not in ('', '原価待ち')] if worst_key else []
        cms = [v[f'{worst_key}_限界利益'] for v in vs
               if worst_key and isinstance(v.get(f'{worst_key}_限界利益'), int)] if worst_key else []
        prows.append({
            '商品': p, 'Status': vs[0]['status'], 'Variant数': len(vs), '分類': cls,
            'CKB原価レンジ': rng([v['ckb_cost'] for v in vs]),
            'ship_est': rng([v['ship_est'] for v in vs]),
            '推定着地原価': rng(landed_vals),
            '現価格': rng([v['現価格'] for v in vs]),
            '新通常価格案': rng([v['新通常価格'] for v in vs]),
            'SummerSale実売': rng([v['SummerSale10_売価'] for v in vs]),
            'MB2点': rng([v['MB2点_売価'] for v in vs]),
            'MB3点以上': rng([v['MB3点以上_売価'] for v in vs]),
            'PAIR15実売': rng([v['PAIR15_売価'] for v in vs]),
            'PAIR対象': vs[0].get('PAIR対象', '—'),
            '最悪ケース施策': worst_key or '—',
            '通常粗利率': rng([v['通常_粗利率'] for v in vs], '{:.1f}%'),
            '通常粗利額': rng([v['通常_粗利額'] for v in vs]),
            '通常限界利益': rng([v['通常_限界利益'] for v in vs]),
            '最悪ケース粗利率': (f'{min(gms):.1f}%' if gms else ('原価待ち' if waiting else '—')),
            '最悪ケース限界利益': (f'¥{min(cms):,}' if cms else ('原価待ち' if waiting else '—')),
            '判断': ('価格設計対象外' if cls not in ('SUMMER_SALE', 'MULTI_BUY') else
                     '原価待ち' if waiting else
                     ('要確認' if (gms and min(gms) < GM_TARGET*100) else
                      ('価格設計対象外' if worst_key is None else 'OK'))),
        })
    prows.sort(key=lambda r: ({'SUMMER_SALE':0,'MULTI_BUY':1}.get(r['分類'], 2), r['商品']))
    with open(OUT_P, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(prows[0].keys())); w.writeheader(); w.writerows(prows)

    # ---- PAIR ----
    pair_out = []
    lookup = {p: vs for p, vs in by_p.items()}
    for pr in pairdefs:
            a, b = lookup.get(pr['product_a']), lookup.get(pr['product_b'])
            pct = float(pr['percentage']) / 100
            if not a or not b:
                pair_out.append((pr['pair_id'], pr['pair_name'], '商品が見つからない')); continue
            def pick(vs):  # 最悪ケース = いちばん原価の高い(=粗利の薄い)Variant
                ok = [v for v in vs if v['推定着地原価'] != '原価待ち']
                return max(ok, key=lambda v: v['推定着地原価']) if ok else None
            va, vb = pick(a), pick(b)
            if not va or not vb:
                pair_out.append((pr['pair_id'], pr['pair_name'], '原価待ち')); continue
            price = va['新通常価格'] + vb['新通常価格']
            landed = va['推定着地原価'] + vb['推定着地原価']
            e = econ(price * (1 - pct), landed)
            # 比較: 単品を各自の施策で買った場合
            def solo(v):
                return v['新通常価格'] * (0.90 if v['分類'] == 'SUMMER_SALE' else 1.00)
            alt = solo(va) + solo(vb)
            if price >= FREE_SHIP > e['price']:
                warn.append(('🟡 送料無料の境界(PAIR)', pr['pair_id'], pr['pair_name'],
                             f"通常合計 ¥{price:,} は無料だが PAIR後 ¥{e['price']:,} で ¥{FREE_SHIP:,} を割る"))
            elif price < FREE_SHIP:
                warn.append(('🟡 PAIRでも送料無料に届かない', pr['pair_id'], pr['pair_name'],
                             f"通常合計 ¥{price:,} / PAIR後 ¥{e['price']:,} < ¥{FREE_SHIP:,}"))
            pair_out.append((pr['pair_id'], pr['pair_name'],
                             f"通常合計 ¥{price:,} / PAIR{int(pct*100)}% ¥{e['price']:,} / "
                             f"着地 ¥{landed:,} / 粗利 ¥{e['gross']:,}({e['gm']*100:.1f}%) / "
                             f"限界利益 ¥{e['cm']:,} / 倍率 ×{e['mult']:.2f} / "
                             f"単品施策合計 ¥{round(alt):,} → 差 ¥{e['price']-round(alt):+,}"))

    print(f'出力: {OUT_V}  ({len(rows)} Variant)')
    print(f'出力: {OUT_P}  ({len(prows)} 商品)')
    print(f'出力: {OUT_S}  ({len(scen_rows)} Variant)\n')
    print(f'=== 返金引当シナリオ(最悪ケース施策で評価・中心値 {int(REFUND_CENTRAL*100)}%) ===')
    for rr in REFUND_RESERVES:
        tag = f'{int(rr*100)}%'
        gms = [float(x[f'引当{tag}_粗利率'].rstrip('%')) for x in scen_rows]
        cms = [x[f'引当{tag}_限界利益'] for x in scen_rows]
        neg = [x for x in scen_rows if x[f'引当{tag}_限界利益'] <= 0]
        u50 = [x for x in scen_rows if float(x[f'引当{tag}_粗利率'].rstrip('%')) < 50]
        u55 = [x for x in scen_rows if float(x[f'引当{tag}_粗利率'].rstrip('%')) < 55]
        print(f'引当 {tag:>3}: 粗利率 {min(gms):.1f}〜{max(gms):.1f}% / 限界利益 ¥{min(cms):,}〜¥{max(cms):,} '
              f'/ 限界利益ゼロ以下 {len(neg)} / 粗利率50%未満 {len(u50)} / 55%未満 {len(u55)}')
    tag = f'{int(REFUND_CENTRAL*100)}%'
    bad = sorted(scen_rows, key=lambda x: float(x[f'引当{tag}_粗利率'].rstrip('%')))[:8]
    print(f'\n--- 引当 {tag} で粗利率がいちばん低い8 Variant ---')
    for x in bad:
        print(f"  {float(x[f'引当{tag}_粗利率'].rstrip('%')):.1f}% | 限界利益 ¥{x[f'引当{tag}_限界利益']:,} | "
              f"BE_ROAS {x[f'引当{tag}_BE_ROAS']} | CPA上限 ¥{x[f'引当{tag}_CPA上限']:,} | "
              f"{x['商品']} / {x['variant'][:24]} ({x['最悪ケース施策']})")
    print()
    if unmapped:
        print('⚠️ 新価格マップに無い現価格:')
        for p, c in sorted(unmapped): print(f'   {p} ¥{c:,}')
        print()
    print('=== PAIR 採算(いちばん原価の高い Variant 同士 = 最悪ケース) ===')
    for pid, name, s in pair_out: print(f'{pid} {name}: {s}')
    seen, uniq = set(), []
    for kind, p, v, msg in warn:
        k = (kind, p, msg)
        if k in seen: continue
        seen.add(k); uniq.append((kind, p, v, msg))
    print(f'\n=== 警告 {len(uniq)}件(重複除去後) ===')
    for kind, p, v, msg in uniq:
        print(f'{kind} | {p} | {v[:30]} | {msg}')
    print('\n※ 着地原価は 223/257 Variant が **推定**(ckb_cost + ship_est)。')
    print('※ ship_est は実送料ではなく価格設計用の送料概算。docs/10 §4 / docs/13 §2。')


if __name__ == '__main__':
    main()
