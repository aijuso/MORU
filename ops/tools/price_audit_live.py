#!/usr/bin/env python3
"""
現行(ライブ)価格の監査。D-162 の全商品 +¥500 後の現物を正として、
docs/13 §4 のものさし(手数料3.6% / 返金引当3・5・8% / 限界利益 / BE ROAS / CPA上限)で再計算する。

    python3 ops/tools/price_audit_live.py

- 価格はストアフロント products.json(ACTIVE のみ)から実取得
- 原価は _ckb_costs.csv の生値 + 旧台帳の ship_est(3バケット概算)= 推定着地原価(D-112)
- 原価が無い Variant は「原価待ち」のまま。推測で埋めない(絶対ルール15)
- 併用化(D-161 追記9)後の最悪ケース = 最強の商品割引 − MORU500 ¥500(単品注文)も併記
"""
import csv, json, os, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = os.path.join(ROOT, 'products', '_price_audit_20260824_variants.csv')
COSTS  = os.path.join(ROOT, 'products', '_ckb_costs.csv')
OUT    = os.path.join(ROOT, 'products', '_price_audit_variants_20260829.csv')

FEE = 0.036          # 決済手数料(仮置き・実測なし)
RESERVES = [0.03, 0.05, 0.08]   # 返金引当 3/5/8%(中心値5%・D-125/D-130: 基数は売価のみ)
CPA_RATIO = 0.70

# Function config(shop metafield custom.moru_promotions_config・2026-08-29 実読)
SALE_PRODUCT_IDS = {10214219743472,10218006315248,10218006348016,10218058318064,10218008084720,
 10218008150256,10218006479088,10218008379632,10218006511856,10218009198832,10218009231600,
 10218008510704,10218060808432,10218058350832,10218008248560,10218008051952,10218057924848,10218006577392}
SALE_EXCLUDED_VARIANT_IDS = {50296095768816,50296095670512}  # ハル2脚セット(D-126)
SALE_RATE = 0.10
# multi_buy_eligible=true(2026-08-29 Admin API 実読・ACTIVE のみ)
MB_PRODUCT_IDS = {10218058285296,10218057892080,10218008183024,10218009329904,10218008969456,
 10218005397744,10218057531632,10218006446320,10218005364976,10218009133296,10218008346864}
MB_RATE = 0.15   # 3点以上
COUPON = 500     # MORU500(全顧客・1人1回・併用可)

ABS_MIN = {'小物': 800, '中型': 2500, '大型': 5000}  # 限界利益の絶対額目安(docs/13 §4)

def num(v):
    v = str(v or '').strip().replace(',', '').replace('¥', '')
    if v in ('', '未確認'): return None
    try: return float(v)
    except ValueError: return None

# --- 原価と ship_est(旧台帳・生値CSV) ---
ship = {}
with open(LEDGER, encoding='utf-8') as f:
    for r in csv.DictReader(f):
        ship[(r['product'], r['variant'])] = (r['ship_bucket'], num(r['ship_est']))
costs = {}
with open(COSTS, encoding='utf-8') as f:
    for r in csv.DictReader(f):
        landed = num(r.get('landed'))
        parts = [num(r.get(k)) for k in ('ckb_cost','ship_domestic_cn','agent_qc','intl_ship','duty_tax')]
        if landed is None and all(p is not None for p in parts):
            landed = sum(parts)
        costs[(r['product'], r['variant'])] = (num(r.get('ckb_cost')), landed)

# --- 現行価格(ストアフロント実取得) ---
products = []
for page in (1, 2):
    with urllib.request.urlopen(f'https://moruliving.com/products.json?limit=250&page={page}', timeout=40) as res:
        products += json.load(res)['products']

def metrics(price, landed):
    gp = price - landed
    out = {'gp': gp, 'gp_rate': gp / price}
    for rr in RESERVES:
        mp = gp - price * FEE - price * rr
        out[rr] = mp
    mp5 = out[0.05]
    out['be_roas'] = price / mp5 if mp5 > 0 else None
    out['cpa'] = mp5 * CPA_RATIO
    return out

rows, missing, inversions = [], [], []
for p in products:
    pid = p['id']; title = p['title']
    in_sale = pid in SALE_PRODUCT_IDS
    in_mb = pid in MB_PRODUCT_IDS
    per_variant_costed = []
    for v in p['variants']:
        key = (title, v['title'])
        price = float(v['price'])   # products.json は円の文字列(例 '100480')
        bucket, ship_est = ship.get(key, (None, None))
        ckb, landed_real = costs.get(key, (None, None))
        if landed_real is not None:
            landed, src = landed_real, '実測'
        elif ckb is not None and ship_est is not None:
            landed, src = ckb + ship_est, '推定(ckb+ship_est)'
        else:
            landed, src = None, '原価待ち'
        sale_ok = in_sale and v['id'] not in SALE_EXCLUDED_VARIANT_IDS
        # シナリオ売価
        p_now = price
        p_sale = round(price * (1 - SALE_RATE)) if sale_ok else None
        p_mb   = round(price * (1 - MB_RATE)) if in_mb else None
        best_disc = min([x for x in (p_sale, p_mb, p_now) if x is not None])
        p_worst = best_disc - COUPON   # 単品注文に MORU500 全額(最保守)
        row = {'product': title, 'status': 'ACTIVE', 'variant': v['title'], 'variant_id': v['id'],
               'price': int(price), 'bucket': bucket or '?', 'cost_source': src,
               'landed_est': int(landed) if landed is not None else '',
               'sale': 'SALE10' if sale_ok else ('MB15' if in_mb else '-')}
        if landed is None:
            missing.append((title, v['title']))
            rows.append(row); continue
        for name, sp in (('normal', p_now), ('best_disc', best_disc), ('worst', p_worst)):
            m = metrics(sp, landed)
            row[f'{name}_price'] = int(sp)
            row[f'{name}_gp_rate'] = round(m['gp_rate'], 3)
            row[f'{name}_mp5'] = int(m[0.05])
            row[f'{name}_mp8'] = int(m[0.08])
        m5 = metrics(best_disc, landed)
        row['cpa_at_disc'] = int(m5['cpa'])
        row['be_roas_at_disc'] = round(m5['be_roas'], 2) if m5['be_roas'] else ''
        row['mult_now'] = round(price / landed, 2)
        rows.append(row)
        per_variant_costed.append((v['title'], price, landed))
    # 価格逆転チェック(同一商品内: 原価が高いのに売価が安い)
    for a in per_variant_costed:
        for b in per_variant_costed:
            if a[2] > b[2] and a[1] < b[1]:
                inversions.append((title, a[0], int(a[2]), int(a[1]), b[0], int(b[2]), int(b[1])))

with open(OUT, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()) | rows[-1].keys() if False else
        ['product','status','variant','variant_id','price','bucket','cost_source','landed_est','sale',
         'normal_price','normal_gp_rate','normal_mp5','normal_mp8',
         'best_disc_price','best_disc_gp_rate','best_disc_mp5','best_disc_mp8',
         'worst_price','worst_gp_rate','worst_mp5','worst_mp8',
         'cpa_at_disc','be_roas_at_disc','mult_now'])
    w.writeheader()
    for r in rows: w.writerow(r)

# --- サマリ ---
print(f"ACTIVE {len(products)}商品 / {len(rows)} Variant を監査。原価待ち {len(missing)} Variant")
print("\n== 原価待ち ==")
seen=set()
for t,_ in missing:
    if t not in seen: print(' ', t); seen.add(t)
print("\n== 価格逆転(原価高いのに売価安い) ==")
seen=set()
for x in inversions:
    k=(x[0],x[1],x[4])
    if k in seen: continue
    seen.add(k)
    print(f"  {x[0]}: {x[1]}(原価{x[2]}→¥{x[3]}) < {x[4]}(原価{x[5]}→¥{x[6]})")
if not inversions: print("  なし")

def flag_rows(cond, label):
    hits = {}
    for r in rows:
        if r['cost_source'] == '原価待ち': continue
        if cond(r): hits.setdefault(r['product'], []).append(r)
    print(f"\n== {label}: {len(hits)}商品 ==")
    for prod, rs in hits.items():
        r = min(rs, key=lambda x: x.get('worst_mp5', 0))
        print(f"  {prod} [{r['bucket']}] 通常¥{r['price']} {r['sale']} → 最悪実効¥{r['worst_price']} 限界利益(5%){r['worst_mp5']} (必要{ABS_MIN.get(r['bucket'],'?')})")

flag_rows(lambda r: r['normal_gp_rate'] < 0.55, '通常価格で粗利率55%未満')
flag_rows(lambda r: r['worst_mp5'] < ABS_MIN.get(r['bucket'], 0), '最悪実効価格(割引+MORU500)で限界利益が絶対額目安を割る')
flag_rows(lambda r: r['worst_mp5'] <= 0, '最悪実効価格で限界利益がマイナス(逆ざや)')
