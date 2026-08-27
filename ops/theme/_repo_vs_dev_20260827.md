# repo と `MORU Frontend Dev` の差分(2026-08-27 実測)

Frontend Dev(`166341181680`)の全ファイルの `checksumMd5` を取得し、
repo の作業ツリーと突き合わせた結果。

| | 件数 |
|---|---|
| 一致 | **54** |
| 相違 | **24** |
| repo に無い(Dev 側で新規追加) | **11** |
| Dev に無い(repo だけにある) | **1** |

**⚠️ repo はフロントの正本ではない。** フロントは ChatGPT 側が Frontend Dev に直接実装しており、
repo はその一部しか追随していない。**repo のファイルを見て「本番もこうなっている」と考えないこと。**
触る前に必ず `theme(id:).files(...).checksumMd5` で現物と突き合わせる。

## 相違(24)

```
config/settings_data.json
config/settings_schema.json
layout/theme.liquid
locales/en.schema.json
locales/ja.default.schema.json
sections/footer-group.json
sections/header-group.json
sections/moru-category-browser.liquid
sections/moru-collection-grid.liquid
sections/moru-footer.liquid
sections/moru-header.liquid
sections/moru-hero.liquid
sections/moru-product-details.liquid
sections/moru-product-features.liquid
sections/moru-product-grid.liquid
sections/moru-product-styling.liquid
sections/moru-shop-the-room.liquid
snippets/moru-product-card.liquid   ← セール価格の計算が入っているのは Dev 版だけ
templates/cart.json
templates/collection.json
templates/index.json
templates/page.faq.json
templates/page.tokushoho.json
templates/product.json
```

## repo に存在しない(11)

```
assets/moru-frontend-polish.css
assets/moru-frontend-polish.js
sections/moru-cart-discount-summary.liquid
sections/moru-header-v2.liquid          ← header-group.json が使っているのはこちら
sections/moru-page-contact.liquid
sections/moru-policy-links.liquid
sections/moru-product-promotions.liquid
sections/moru-promo-hub.liquid
sections/moru-promo-landing.liquid
sections/moru-quantity-offers.liquid
templates/page.contact.json
```

## Dev に存在しない(1)

```
templates/collection.new-arrivals.json
```

## 一致していたので安全に編集できたもの

`sections/moru-main-product.liquid` は **repo と Dev の md5 が完全一致していた**
(`8c177bd8049f0b1ac12e900f3fa10b86` / 55,797 bytes)。
そのため 2026-08-27 のセール価格対応は、**現物を取り込み直さずに repo 上で編集できた**
(D-150)。編集後は `a75a9c0df0ec2745b5e387302c776a15` / 60,543 bytes。
