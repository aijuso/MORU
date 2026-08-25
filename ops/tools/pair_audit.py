#!/usr/bin/env python3
"""
ペア・セット割引(15%OFF)の採算を、CKB 原価が入った分だけ判定する。

    python3 ops/tools/price_audit.py     # 先にこれを走らせる
    python3 ops/tools/pair_audit.py

入力:
  ops/products/_price_audit_variants_computed.csv   price_audit.py の出力
  ops/products/_pair_definitions.csv                ペアの定義(下記)

出力:
  標準出力に、ペアごとの最小構成 / 最大構成の採算

**片方でも原価が未入力なら「原価待ち」。推測で埋めない。**
docs/12 §2・CLAUDE.md 絶対ルール15。

_pair_definitions.csv の列:
  pair_id,pair_name,product_a,product_b,percentage
  - product_a / product_b は _price_audit_20260824_variants.csv の product 表記と完全一致
  - percentage を省くと 15
"""
import csv, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMPUTED = os.path.join(ROOT, 'products', '_price_audit_variants_computed.csv')
PAIRS    = os.path.join(ROOT, 'products', '_pair_definitions.csv')

# price_audit.py と同じ前提。変えるときは両方直す(docs/10 §4)。
PAYMENT_FEE_RATE = 0.036
CPA_RATIO        = 0.70
FREE_SHIP_THRESHOLD = 7700   # D-101
SHIPPING_COST       = 870    # 国内 通常配送(実査)


def num(v):
    if v is None:
        return None
    v = str(v).strip().replace(',', '').replace('¥', '')
    if v in ('', '未確認', '原価待ち'):
        return None
    try:
        return float(v)
    except ValueError:
        return None


def load_variants():
    """product -> [ {variant, price, landed} ]。landed が無い Variant も残す。"""
    if not os.path.exists(COMPUTED):
        sys.exit(f'先に price_audit.py を走らせる: {COMPUTED} が無い')
    by_product = {}
    with open(COMPUTED, newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f):
            by_product.setdefault(r['product'], []).append({
                'variant': r['variant'],
                'price': num(r['price']),
                'landed': num(r['landed']),
            })
    return by_product


def load_pairs():
    if not os.path.exists(PAIRS):
        return []
    out = []
    with open(PAIRS, newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f):
            if not r.get('product_a') or not r.get('product_b'):
                continue
            out.append({
                'id': (r.get('pair_id') or '').strip(),
                'name': (r.get('pair_name') or '').strip(),
                'a': r['product_a'].strip(),
                'b': r['product_b'].strip(),
                'pct': num(r.get('percentage')) or 15.0,
            })
    return out


def pick(variants, key, lo=True):
    """price が入っている Variant から、最小 / 最大のものを選ぶ。"""
    have = [v for v in variants if v[key] is not None]
    if not have:
        return None
    return min(have, key=lambda v: v[key]) if lo else max(have, key=lambda v: v[key])


def evaluate(va, vb, pct):
    """原価が両方そろっていれば採算を返す。片方でも無ければ None。"""
    if va is None or vb is None:
        return None
    if va['landed'] is None or vb['landed'] is None:
        return None
    gross_price = va['price'] + vb['price']
    landed = va['landed'] + vb['landed']
    sell = round(gross_price * (100 - pct) / 100)
    gross = sell - landed
    fee = sell * PAYMENT_FEE_RATE
    cm = gross - fee
    ship_lost = gross_price >= FREE_SHIP_THRESHOLD and sell < FREE_SHIP_THRESHOLD
    return {
        'list': gross_price, 'sell': sell, 'landed': round(landed),
        'mult': round(sell / landed, 2) if landed else None,
        'gross': round(gross), 'gross_rate': gross / sell * 100 if sell else 0,
        'cm': round(cm),
        'be_roas': f'{sell / cm:.2f}' if cm > 0 else '赤字',
        'cpa_cap': round(cm * CPA_RATIO) if cm > 0 else 0,
        'ship_lost': ship_lost,
    }


def main():
    by_product = load_variants()
    pairs = load_pairs()
    if not pairs:
        print(f'⚠️ {PAIRS} が無い(または空)。')
        print('   pair_id,pair_name,product_a,product_b,percentage の形式で置くと採算を出す。')
        print('   候補は ops/products/_pair_candidates_20260825.md。')
        return

    waiting, done = [], []
    for p in pairs:
        for side in ('a', 'b'):
            if p[side] not in by_product:
                print(f"❌ {p['id'] or p['name']}: 台帳に '{p[side]}' が無い(表記を確認)")
                break
        else:
            va_lo, vb_lo = pick(by_product[p['a']], 'price', True),  pick(by_product[p['b']], 'price', True)
            va_hi, vb_hi = pick(by_product[p['a']], 'price', False), pick(by_product[p['b']], 'price', False)
            lo = evaluate(va_lo, vb_lo, p['pct'])
            hi = evaluate(va_hi, vb_hi, p['pct'])

            label = f"{p['id']} {p['name']}".strip() or f"{p['a']} × {p['b']}"
            print(f"\n=== {label}  ({p['a']} × {p['b']} / {p['pct']:.0f}%OFF) ===")
            if lo is None and hi is None:
                # 原価が無くても、送料無料を割るかどうかは価格だけで分かる
                if va_lo and vb_lo:
                    gp = va_lo['price'] + vb_lo['price']
                    sell = round(gp * (100 - p['pct']) / 100)
                    warn = '  🚩 送料無料を割る' if gp >= FREE_SHIP_THRESHOLD > sell else ''
                    print(f"  最小構成 定価 ¥{gp:,.0f} → ¥{sell:,}{warn}")
                print('  採算: **原価待ち**(どちらかの landed が未入力)')
                waiting.append(label)
                continue

            for tag, e, va, vb in (('最小構成', lo, va_lo, vb_lo), ('最大構成', hi, va_hi, vb_hi)):
                if e is None:
                    print(f'  {tag}: 原価待ち')
                    continue
                warn = '  🚩 送料無料を割る(送料 ¥%d が復活)' % SHIPPING_COST if e['ship_lost'] else ''
                print(f"  {tag}  {va['variant']} + {vb['variant']}")
                print(f"    定価 ¥{e['list']:,.0f} → 割引後 ¥{e['sell']:,}{warn}")
                print(f"    着地原価 ¥{e['landed']:,} / 倍率 ×{e['mult']}")
                print(f"    粗利 ¥{e['gross']:,}({e['gross_rate']:.1f}%) / 限界利益 ¥{e['cm']:,}")
                print(f"    BE_ROAS {e['be_roas']} / CPA上限 ¥{e['cpa_cap']:,}")
            done.append(label)

    print(f'\n完成 {len(done)} 組 / 原価待ち {len(waiting)} 組')
    if waiting:
        print('原価待ち: ' + ' / '.join(waiting))
    print('\n※ 決済手数料 3.6% は仮置き / 返品コストは 0(未確認)。docs/10 §4・§6。')
    print('※ 送料無料しきい値 ¥7,700・国内通常配送 ¥870 は実査値(D-101)。')


if __name__ == '__main__':
    main()
