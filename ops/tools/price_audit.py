#!/usr/bin/env python3
"""
Variant 単位の価格監査を、CKB 原価が入った分だけ完成させる。

    python3 ops/tools/price_audit.py

入力:
  ops/products/_price_audit_20260824_variants.csv   Variant 台帳(Shopify 実査)
  ops/products/_ckb_costs.csv                       Owner が埋めた CKB 原価(任意)

出力:
  ops/products/_price_audit_variants_computed.csv   算出済み監査表
  標準出力に「完成した商品 / 原価待ちの商品」のサマリ

**原価が入っていない Variant は「原価待ち」のまま残す。推測で補完しない。**
docs/12 §2・CLAUDE.md 絶対ルール15。

着地原価の採用順(2026-08-25・D-112):
  1. landed 実測値がある            → landed(cost_source = 実測)
  2. landed 無し + ckb_cost あり    → **landed_est = ckb_cost + ship_est**(cost_source = 推定)
  3. ckb_cost も無い                → 原価待ち

⚠️ **ship_est は実送料ではない。**台帳 `_price_audit_20260824_variants.csv` の
`ship_est` 列にある **価格設計用の送料概算**(小物 ¥800 / 中型 ¥1,750 / 大型 ¥3,500)。
国内送料・代行手数料・国際送料・関税の実測値はまだ取得していない。
**ckb_cost は CKB の商品原価そのもの。送料概算を足して上書きしない**(生値は _ckb_costs.csv に保つ)。

_ckb_costs.csv の列(Owner 入力):
  product,variant,ckb_cost,ship_domestic_cn,agent_qc,intl_ship,duty_tax,landed
  - 分解できない場合は landed だけ埋めてよい(他は空 or 未確認)
  - 分解が全部埋まっていて landed が空なら、合計を landed とみなす
"""
import csv, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = os.path.join(ROOT, 'products', '_price_audit_20260824_variants.csv')
COSTS  = os.path.join(ROOT, 'products', '_ckb_costs.csv')
OUT    = os.path.join(ROOT, 'products', '_price_audit_variants_computed.csv')

# docs/10 §4。いずれも実測ではない。変わったら docs/10 と一緒に直す。
PAYMENT_FEE_RATE = 0.036   # 仮置き(実測なし)
RETURN_RESERVE   = 0.0     # 未確認(現在 0 として計算)
CPA_RATIO        = 0.70    # CPA上限 = 限界利益 × 0.70
DISCOUNTS        = [('通常', 1.00), ('10%OFF', 0.90), ('15%OFF', 0.85)]

# docs/10 §1 の丸め: ×3.0 以上でいちばん近い ¥X,480 / ¥X,980
def round_up_price(x):
    base = (int(x) // 1000) * 1000
    for cand in (base + 480, base + 980, base + 1480, base + 1980):
        if cand >= x:
            return cand
    return base + 1980

def num(v):
    if v is None: return None
    v = str(v).strip().replace(',', '').replace('¥', '')
    if v == '' or v == '未確認': return None
    try: return float(v)
    except ValueError: return None

def load_costs():
    if not os.path.exists(COSTS):
        return {}
    out = {}
    with open(COSTS, newline='', encoding='utf-8-sig') as f:
        for r in csv.DictReader(f):
            key = (r.get('product', '').strip(), r.get('variant', '').strip())
            parts = [num(r.get(k)) for k in ('ckb_cost','ship_domestic_cn','agent_qc','intl_ship','duty_tax')]
            landed = num(r.get('landed'))
            if landed is None and all(p is not None for p in parts):
                landed = sum(parts)
            out[key] = dict(zip(('ckb_cost','ship_domestic_cn','agent_qc','intl_ship','duty_tax'), parts),
                            landed=landed)
    return out

def main():
    if not os.path.exists(LEDGER):
        sys.exit(f'台帳がない: {LEDGER}')
    costs = load_costs()
    rows, done, waiting = [], set(), set()

    with open(LEDGER, newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f):
            product, variant = r['product'], r['variant']
            price = float(r['price'])
            c = costs.get((product, variant), {})
            ship_est = num(r.get('ship_est'))

            # 着地原価の採用順(D-112)。推測で ckb_cost を作らない。
            landed = c.get('landed')
            ckb = c.get('ckb_cost')
            if landed is not None and landed > 0:
                cost_source = '実測'
            elif ckb is not None and ckb > 0 and ship_est is not None:
                landed = ckb + ship_est
                cost_source = '推定(ckb_cost + ship_est)'
            else:
                landed = None
                cost_source = '原価待ち'

            out = {
                'product': product, 'variant': variant, 'sku': r['sku'],
                'status': r['status'], 'tier': r['tier'], 'cat': r['cat'],
                'ckb_cost': c.get('ckb_cost') or '未確認',
                'ship_domestic_cn': c.get('ship_domestic_cn') or '未確認',
                'agent_qc': c.get('agent_qc') or '未確認',
                'intl_ship': c.get('intl_ship') or '未確認',
                'duty_tax': c.get('duty_tax') or '未確認',
                'ship_est': int(ship_est) if ship_est is not None else '未確認',
                'landed': landed if landed is not None else '未確認',
                'cost_source': cost_source,
                'price': int(price),
            }

            if landed is None or landed <= 0:
                # 原価が無い列は「原価待ち」。0 や推測で埋めない。
                for k in ('mult_now','price_proposed','mult_proposed'):
                    out[k] = '原価待ち'
                for label, _ in DISCOUNTS:
                    for suffix in ('売価','粗利額','粗利率','限界利益','BE_ROAS','CPA上限'):
                        out[f'{label}_{suffix}'] = '原価待ち'
                out['判定'] = '原価待ち'
                waiting.add(product)
                rows.append(out); continue

            done.add(product)
            out['mult_now'] = round(price / landed, 2)
            proposed = round_up_price(landed * 3.0)
            out['price_proposed'] = proposed
            out['mult_proposed'] = round(proposed / landed, 2)

            for label, rate in DISCOUNTS:
                sell = round(price * rate)
                gross = sell - landed
                fee = sell * PAYMENT_FEE_RATE
                cm = gross - fee - sell * RETURN_RESERVE      # 限界利益(docs/10 §4)
                out[f'{label}_売価'] = sell
                out[f'{label}_粗利額'] = round(gross)
                out[f'{label}_粗利率'] = f'{gross / sell * 100:.1f}%'
                out[f'{label}_限界利益'] = round(cm)
                out[f'{label}_BE_ROAS'] = f'{sell / cm:.2f}' if cm > 0 else '赤字'
                out[f'{label}_CPA上限'] = round(cm * CPA_RATIO) if cm > 0 else 0

            # docs/12 §3-4 のスクリーニング(15%OFF 後に ×2.6 以上)
            m15 = price * 0.85 / landed
            # f-string を使う。'15%OFF' を % 書式に混ぜると %O が書式指定子として
            # 解釈されて ValueError になる(2026-08-25 に実際に踏んだ)。
            out['判定'] = 'OK' if m15 >= 2.6 else f'要検討: 15%OFF後 ×{m15:.2f} < 2.6'
            rows.append(out)

    with open(OUT, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)

    n_done = sum(1 for x in rows if x['cost_source'] != '原価待ち')
    n_est  = sum(1 for x in rows if x['cost_source'].startswith('推定'))
    n_real = sum(1 for x in rows if x['cost_source'] == '実測')
    print(f'出力: {OUT}  ({len(rows)} Variant 行)')
    print(f'算出できた Variant: {n_done} / {len(rows)}'
          f'  (landed 実測 {n_real} / 推定 {n_est})')
    print(f'原価待ちの Variant: {len(rows) - n_done}')
    print(f'算出できた商品: {len(done)}')
    for p in sorted(done): print(f'  ✅ {p}')
    print(f'原価待ちの商品: {len(waiting - done)}')
    for p in sorted(waiting - done): print(f'  ⏳ {p}')
    if not costs:
        print('\n⚠️ ops/products/_ckb_costs.csv が無いので全件「原価待ち」。'
              '\n   Owner が _ckb_cost_request_20260824.md を埋めたら、その内容を'
              '\n   _ckb_costs.csv(product,variant,ckb_cost,...,landed)に写して再実行する。')
    print('\n※ 着地原価の大半は **推定**: ckb_cost(CKB の商品原価)+ ship_est。')
    print('※ **ship_est は実送料ではない。**価格設計用の送料概算'
          '(小物 ¥800 / 中型 ¥1,750 / 大型 ¥3,500)。')
    print('※ 国内送料・代行手数料・国際送料・関税の実測値は未取得。実測が入れば landed 列を埋めて再実行する。')
    print('※ 決済手数料 3.6% は仮置き / 返品コストは 0(未確認)。docs/10 §4・§6。')

if __name__ == '__main__':
    main()
