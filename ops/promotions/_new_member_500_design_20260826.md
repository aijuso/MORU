# 新規会員登録 ¥500OFF — 実装設計(READ ONLY 調査 / 2026-08-26)

**Owner 承認前。Shopify への書き込みは一切していない。**

顧客向け訴求は **「新規会員登録で¥500OFFクーポンプレゼント」**(Frontend に表示済み)。
**表示だけで終わらせず、実際に受け取って使える状態にする**のが目的。

---

## 1. 現状(実測)

| 項目 | 値 |
|---|---|
| プラン | **Basic** |
| 顧客アカウント方式 | **`NEW_CUSTOMER_ACCOUNTS`**(新しい顧客アカウント) |
| ログイン必須 | `customerAccounts: OPTIONAL` / `loginRequiredAtCheckout: false` |
| アカウント URL | `https://shopify.com/85743927536/account` |
| 既存 Discount | **1件のみ** — `MORU 販促割引(統合)` / ACTIVE |
| 既存顧客 | **0人**(まだ誰も登録していない) |
| Shopify Flow | **Basic で使える**(無料アプリ)。ただし **Send HTTP Request / Send Admin API request は Grow 以上** |
| Customer Segment | 使える。既定5件あり |
| 使えるセグメント条件 | `customer_account_status`(ENABLED/INVITED/DISABLED/DECLINED)/ `number_of_orders` / `customer_tags` / `customer_added_date` ほか |

### 新しい顧客アカウントの効き方

**パスワードが無い。** メールにワンタイムコードが届いてログインする方式。
つまり **「会員登録」= 初回ログイン**で、その時点で Customer レコードが `ENABLED` になる。

**「アカウント有効化メール」が存在しない。** 旧アカウント方式にあった
"Customer account activation" 通知が新方式には無いので、
**そこにクーポンコードを差し込むことはできない。**

---

## 2. 方式比較

| | 方式 | 1顧客1回 | 乱用耐性 | コスト | 保守 |
|---|---|---|---|---|---|
| A | 共通コード(全員可) | ✕ | **✕ 誰でも使える** | 低 | 低 |
| **C** | **共通コード + 顧客セグメント制限** | **○** | **○** | **低** | **低** |
| B | 顧客ごとユニークコード | ○ | ◎ | **高**(発行基盤が要る) | 高 |
| D | Shopify Flow 単体 | — | — | 低 | 中 |
| E | ストアクレジット ¥500 | ◎ | ◎ | **Basic では自動発行できない** | 中 |
| F | 既存 Function に取り込む(自動適用) | △ | ○ | 中 | 中 |

### なぜ B が現実的でないか

顧客ごとにコードを発行するには **Customer created を受けて Admin API を叩く仕組み**が要る。
Flow の `Send Admin API request` は **Grow 以上**。Basic では動かない。
外部アプリを入れると月額と保守が増える。**32商品・顧客0人の段階では重すぎる。**

### なぜ E(ストアクレジット)を推さないか

**割引ではなく決済手段**なので、他の割引と一切干渉しない。理屈としては最もきれい。
だが **自動発行に `Send Admin API request` が要り、Basic では使えない。**
手動発行は人数が増えると回らない。**将来 Grow 以上に上げたときの第一候補。**

---

## 3. 推奨: C(共通コード + 顧客セグメント制限)

```
Discount code:  MORU500
種別:           Amount off order(¥500 OFF)
customerSelection: customerSegments = 「新規会員(登録済み・未購入)」
appliesOncePerCustomer: true
usageLimit:     なし(セグメントと once-per-customer で足りる)
最低購入金額:   設定しない(Owner 指示)
有効期限:       設定しない(Owner 指示)
```

新規セグメント(1件だけ作る):

```
customer_account_status = 'ENABLED' AND number_of_orders = 0
```

- `customer_account_status = 'ENABLED'` … **実際にログインした=会員登録した人だけ。**
  メルマガ登録だけの人を除外できる
- `number_of_orders = 0` … **初回購入のみ。** 1回買った時点で自動的に対象外になる

### 1顧客1回をどう保証するか(二重)

1. **`appliesOncePerCustomer: true`** … 同じ顧客が2回目に使おうとすると弾かれる
2. **`number_of_orders = 0`** … 1回注文した時点でセグメントから外れる

**コード文字列が漏れても、セグメント外の人は使えない。**
Shopify がチェックアウト時にサーバ側で判定する。

⚠️ **ログインしていないと使えない。** `loginRequiredAtCheckout: false` なので、
未ログインのまま入力すると「このコードは使えません」になる。
**「ログインしてご利用ください」と併記する必要がある。**

⚠️ 複数アカウントを作れば複数回使える。これはどのクーポン方式でも同じで、
**¥500 という金額に対して追加対策を積むのは割に合わない。**

---

## 4. 登録後に顧客へどう伝えるか

新方式には有効化メールが無いので、**3か所に置く**:

| 場所 | 内容 | 担当 |
|---|---|---|
| **アカウントページ** | ログイン直後に「¥500OFFコード: MORU500」を表示 | Frontend Dev |
| **登録導線のサンクス表示** | 登録完了時にコードを出す | Frontend Dev |
| **Shopify Flow(任意)** | `Customer created` → マーケティングメール送信 | 要 Owner 判断 |

**Flow は必須ではない。** アカウントページに出るだけで「受け取って使える」は成立する。
Flow の `Send internal email` は**スタッフ宛**なので顧客には使えない。
顧客へ送るなら **マーケティングオートメーション(Shopify Messaging)** 側で組む。
これは Basic でも使えるが、**メール配信の同意状況に左右される**ので確実な導線にはならない。

---

## 5. 🔴 既存 Sale / Multi-buy / PAIR / 送料無料との関係 — ここに落とし穴がある

現在 `MORU 販促割引(統合)` は **`combinesWith` が全て `false`**。
つまり **¥500 コードとは併用されない。**「加算しない」という Owner 方針とは一致する。

Shopify のドキュメント上、併用できない割引が両方成立しうる場合は
**「顧客にとって最も得な方」が適用される**とされている。

**問題は、この統合 Discount が `PRODUCT` / `ORDER` / `SHIPPING` の3クラスを1件で持っていること。**

¥500 コードが勝つと **統合 Discount が丸ごと落ちる。**
すると **Function が走らないので送料無料も消える。**

```
カート ¥7,960
 ├ 統合Discount適用 : −¥796(まとめ買い10%) + 送料無料      → 支払 ¥7,164
 └ ¥500コード適用   : −¥500 / 送料 ¥870(¥7,460 < ¥7,700)  → 支払 ¥8,330
```

**¥500 のクーポンを使ったほうが ¥1,166 高くなる。** D-127 で潰したのと同じ形の事故。

Shopify の「最も得な方」の比較に **送料が入っているかどうかが分からない。**
入っていれば統合 Discount が選ばれて事故は起きない。入っていなければ起きる。
**ここは推測せず実測する。**

### 構造的な結論

**「¥500 は商品割引と加算しない」と「送料無料は必ず残る」は、
Discount を2件に分ける限り両立しない。** 送料無料が商品割引と同じ1件の中にあるため。

選べるのは次の3つ:

| | 方針 | 結果 |
|---|---|---|
| **C-1** | 加算しないを優先(推奨・現状のまま) | **要実測。** 送料無料が消えるケースが残りうる |
| C-2 | 送料無料維持を優先 | `combinesWith` を開ける = **¥500 が商品割引に加算される** |
| F | 既存 Function に ¥500 を取り込む | 事故ゼロ・完全に制御できるが **Function 改修が要る**(Owner の「変更しない」に触れる) |

**F は技術的には確認済み。** Discount Function の入力で
`cart.buyerIdentity.customer { numberOfOrders hasAnyTag hasTags metafield }` が読めることを
スキーマ検証で確認した。**ただしこれは自動適用になり「クーポン」ではなくなる。**

---

## 6. 必要な Shopify 変更(Owner GO 後)

| # | 変更 | 種別 |
|---|---|---|
| 1 | セグメント「新規会員(登録済み・未購入)」を作成 | `segmentCreate` |
| 2 | Discount code `MORU500` を作成(¥500 OFF / セグメント限定 / once per customer) | `discountCodeBasicCreate` |
| 3 | 実測: ¥7,960 のカートで ¥500 コードを入れ、**送料と合計を確認** | 実機 |
| 4 | 結果を docs と decisions log に記録 | repo |

**Discount resource は2件になる**(統合 Automatic 1件 + コード 1件)。
これまでの「1件のみ」は**統合 Function 用 Automatic の話**なので抵触しない。
念のため Owner 確認事項として挙げておく。

### 触らないもの

Product 価格 / Product metafield / status / publication / MAIN theme /
Frontend Dev theme / 既存 Function のコード / `_discount_config` の中身。

---

## 7. Owner に決めてほしいこと

1. **C-1 で進めてよいか**(まず作って実測 → 事故が出たら C-2 か F へ)
2. Discount resource が2件になることの承認
3. Flow でのメール送信を入れるか(入れなくても成立する)
4. コード文字列(案: `MORU500`)

---

# 追記(2026-08-26)— Owner GO を受けて実行した内容

## 8. 訂正: アカウントページには出さない

**初版で「アカウントページに Frontend Dev から MORU500 を表示」と書いたのは誤り。**
新しい顧客アカウントのページは Liquid テーマから自由に差し込める場所ではなく、
追加コンテンツは Checkout and Accounts Editor / Customer Account UI Extension /
アプリブロック側の領分。**Owner 指摘のとおり。**

**正しい置き場所はストア側(通常の Liquid テーマ)。**
ログイン中は `customer` がグローバルで使えるので:

```liquid
{% if customer != nil and customer.orders_count == 0 %}
  新規会員限定 ¥500 OFF / コード: MORU500 [コピーする]
{% endif %}
```

**セグメントの条件(`customer_account_status = ENABLED AND number_of_orders = 0`)と
表示条件(`customer != nil and customer.orders_count == 0`)が一致している。**
ログインしている時点で `ENABLED`、`orders_count == 0` が `number_of_orders = 0` に対応する。
**見えている人 = 使える人。**

ログイン後のストア側リダイレクトもテーマから制御できるので、
**登録直後にこのブロックへ着地させるのが最短。**(Frontend Dev 担当)

## 9. 作成したもの(2026-08-26)

| 種別 | ID | 内容 |
|---|---|---|
| Segment | `gid://shopify/Segment/578826076400` | 新規会員(登録済み・未購入)<br>`customer_account_status = 'ENABLED' AND number_of_orders = 0` |
| Discount | `gid://shopify/DiscountCodeNode/1484417040624` | 新規会員登録 ¥500OFF |

```
code                    MORU500
status                  ACTIVE
discountClasses         ["ORDER"]
customerGets            ¥500 / appliesOnEachItem: false / AllDiscountItems
context                 DiscountCustomerSegments → 上記セグメント1件
appliesOncePerCustomer  true
usageLimit              null(無制限。セグメント + once-per-customer で足りる)
minimumRequirement      null(最低購入金額なし)
endsAt                  null(有効期限なし)
combinesWith            order / product / shipping すべて false
```

**Discount resource は 2件**(`MORU 販促割引(統合)` + `新規会員登録 ¥500OFF`)。

## 10. 🔴 実測はまだできていない

**理由は2つ。どちらも回避できない。**

1. **顧客が0人。** `MORU500` はセグメント限定なので、
   **ログイン済みの新規会員が1人もいないと発動しない。**
   サンドボックスからは新しい顧客アカウントにログインできない
   (メールのワンタイムコードを受け取れない)
2. **ストアのパスワード保護が戻っている**(`passwordProtection.enabled: true`)。
   これは前回こちらから戻すよう進言した状態で、正しい。
   **`/password` は叩かない**(前回 429 を連発した経緯があるため)

**したがって実測は Owner の手元で1回だけ行う必要がある。** 手順は §11。

## 11. Owner にお願いする実測(3カート・注文は確定しない)

**前提: 会員登録(ログイン)を1回済ませておく。** その時点でセグメントに入る。
セグメントの反映に数分かかることがある。

### 🔴 テスト1(本番)— 統合 Discount と競合させる

カート: **フェイクファー クリームホワイト 150×200 を 2点**(¥7,960)
`MORU500` を入力してチェックアウト直前まで進み、**送料込みの合計**を見る。

| 出た数字 | 意味 | 判定 |
|---|---|---|
| **¥7,164** | 統合 Discount が残った(−¥796 / 送料無料)。コードは適用されない | ✅ **PASS** |
| **¥8,330** | MORU500 が勝ち、送料 ¥870 が復活した | 🔴 **NG。この状態では公開しない** |
| ¥6,664 | 両方効いた(−¥1,296 / 送料無料) | ⚠️ 想定外。`combinesWith` が全 false なので起きないはず |

### テスト2 — 競合しないカートでコードが効くか

カート: **ソラ キャットハンモック 1点**(¥20,480・施策対象外・元から送料無料)
期待: **−¥500 → ¥19,980 / 送料 ¥0**

### テスト3 — しきい値未満

カート: **ミニ アラームクロック 1点**(¥4,480)
期待: **−¥500 → ¥3,980 / 送料 ¥870 → 合計 ¥4,850**

### そのほか確認してほしいこと

- ログアウト状態で `MORU500` を入れると**弾かれる**こと(セグメント制限が効いている証拠)

## 12. テスト1が NG だった場合 — Plan S(送料無料を独立させる)

**すぐ C-2(併用可にして加算させる)にはしない。** Owner 指示のとおり、
**送料無料を商品販促から切り離す構造**を先に検討する。

### いまの構造が問題を作っている

```
MORU 販促割引(統合)  … PRODUCT + ORDER + SHIPPING を1件で持つ / combinesWith 全 false
```

**送料無料が商品割引と同じ1件に同居しているせいで、
商品割引が負けると送料無料まで道連れになる。**

### Plan S

**配送割引だけを別の Automatic Discount に分離する。**

```
① MORU 販促割引(商品)   PRODUCT     combinesWith: shipping ✅ / order ✕ / product ✕
② MORU 送料無料          SHIPPING    combinesWith: product ✅ / order ✅ / shipping ✕
③ MORU500                ORDER       combinesWith: shipping ✅ / product ✕ / order ✕
```

- ① ⟷ ② … 併用される → **商品割引 + 送料無料**(いまと同じ)
- ③ ⟷ ② … 併用される → **¥500 + 送料無料**
- ① ⟷ ③ … **併用されない** → Shopify がどちらか得な方を選ぶ

**どちらが選ばれても送料無料は残る。** 「¥500 は商品割引と加算しない」も守られる。

### 必要な作業

1. `moru-promotions-discount` から配送ターゲットを外し、
   **配送専用の Function extension を新設**(`shipping.js` はそのまま流用できる)
2. Automatic Discount をもう1件作成(Discount resource は **3件**になる)
3. 3件の `combinesWith` を上表のとおり設定
4. 21ケース + 送料の実測をやり直す

**①②③ の分離は Function の改修を伴う。Owner GO なしには着手しない。**

### Plan S を採らない場合の代替

- **C-2**: `combinesWith` を開けて ¥500 を常に加算する(送料無料は残るが、割引は重なる)
- **F**: ¥500 を統合 Function の中に取り込む(クーポンではなく自動適用になる)

---

## 13. 🔴 セグメント条件を修正した(2026-08-26)

**Owner が会員登録した直後に確認したところ、セグメントのメンバーが 0人だった。**

```
Customer  高木海飛 / createdAt 2026-08-26T09:12:31Z / numberOfOrders 0
          tags: ["Login with Shop", "Shop"]
          state: DISABLED        ← ここ
```

**新しい顧客アカウントでは `Customer.state` が `ENABLED` にならない。**
`state` は旧アカウント方式(パスワード + アクティベーションメール)の名残で、
新方式で登録しても `DISABLED` のまま。

つまり **`customer_account_status = 'ENABLED'` は新方式では誰にもマッチしない。**
この条件のままだと **MORU500 は永久に誰も使えなかった。**

### 修正後

```
customer_account_status = 'ENABLED' AND number_of_orders = 0   ← 誰もマッチしない
                          ↓
number_of_orders = 0                                           ← 修正後
```

セグメント名も「新規会員(未購入)」に変更。**メンバー 1人**(Owner)を確認済み。

### `number_of_orders = 0` だけで足りる理由

このセグメントには**メルマガ登録だけの人も入る**。
だが **`MORU500` は割引コードなので、チェックアウト時にログインしていないと
そもそも顧客が特定されず弾かれる。**

**ログインしている = 会員登録している。**
したがって `number_of_orders = 0` に絞れば、実効的には
**「会員登録済み かつ 未購入」**と同じになる。

**ストア側の表示条件ともぴったり一致する:**

```liquid
{% if customer != nil and customer.orders_count == 0 %}
```

`customer != nil` = ログイン済み、`orders_count == 0` = `number_of_orders = 0`。
**見えている人 = 使える人。**

---

## 14. 実測結果(2026-08-26 / Owner 実施)

| # | カート | 結果 |
|---|---|---|
| 1 | フェイクファー 150×200 ×2(¥7,960) | **MORU500 は適用されなかった** → 統合 Discount が残った ✅ **PASS** |
| 3 | ミニ アラームクロック ×1(¥4,480) | **MORU500 が適用された** ✅ |

**C-1 は成立した。** 併用できない2つが競合したとき、Shopify は
**顧客にとって得なほう(まとめ買い10% + 送料無料)を残した。**
**送料無料が消える事故は起きない。Plan S は不要。**

## 15. 🔴 カートの UX に問題が2つ見つかった

Owner の報告:

> クーポンコードを入力する前からカートのドロワー画面で -500 という割引が効いていて、
> クーポンコードを入力しなくても -500 になっていました。
> クーポンコードを押して適用を押すと、適用されたとか適用されなかったとかは何も表示されない

### 問題1: 前に入れたコードが残り続け、それがコードだと分からない

Shopify は一度入れた割引コードを**カートに保持し続ける**。
テスト3 で入れた `MORU500` が、そのあとのカートにも効いていた。**Shopify の仕様どおり。**

問題は見え方のほう。ドロワーもカートページも
`cart_level_discount_applications` の **`title`(=「新規会員登録 ¥500OFF」)しか出していなかった。**
自動割引と区別がつかず、**クーポンが入っていること自体が分からない。外す手段も無い。**

### 問題2: 「適用」を押しても何も言わない

```js
window.location.href = '/discount/' + code + '?redirect=/cart';
```

**成否にかかわらず `/cart` へリダイレクトするだけ。**
コードが通っても通らなくても画面は同じなので、**押した結果が分からない。**

これはテスト1の状況(コードは生きているが、他の割引のほうが得なので使われない)で特に悪い。
**顧客には「クーポンが無効になった」ようにしか見えない。**

## 16. 直した内容

### 使える材料の確認(先に潰した)

- **`cart.discount_codes` は Liquid に存在しない。** 使えるのは
  `cart.discount_applications` で、`type == 'discount_code'` が「コードで入った割引」
- **`/cart/update.js` は `discount` パラメータを受け付ける**(2025-05 追加)。
  `{ discount: 'CODE' }` で適用、`{ discount: '' }` で全コード解除。
  **自動割引は影響を受けない**(コードではないため)
- **「入力されたが効かなかったコード」を返す口は Liquid にも Ajax にも無い。**
  したがって入力直後の結果は**カートが実際に変わったかどうかで判定する**

### カートページ(`sections/moru-main-cart.liquid`)

1. **適用中のクーポンをコード名と金額で表示**し、**「クーポンを削除する」**を置いた
   (`{ discount: '' }`)
2. **リダイレクトをやめて Ajax 化。** `/cart/update.js` を叩き、
   **結果を必ず1行出す**(`role="status"` / `aria-live="polite"`)
3. 判定は**カートの変化**で行う。コード割引が増えた、または割引総額が増えた → 適用
4. **Enter キーでも適用できる**ようにした
5. セクションを差し替えると文言が消えるので、**差し替え後に出し直す**

### 効かなかったときの文言

原因は2つ混ざる(コードの誤り / 他の割引のほうが得)。
**Shopify 側に区別する手段が無いので、どちらでも正しい言い方にした:**

> コード MORU500 は、いまのカートには適用されませんでした。すでに適用中の割引のほうが
> お得な場合、クーポンは使われません(クーポンは無効になっていないので、別のご注文で
> お使いいただけます)。コードの入力に誤りがないか、会員限定のクーポンの場合は
> ログインしているかもご確認ください。

**「無効になった」と誤解させないことを優先した。**

### カートドロワー(`sections/moru-cart-drawer.liquid`)

コードで入った割引があるときだけ **「クーポンを確認する」** をカートページへ出す。
ドロワーで外させると操作が二重になるので、**外すのはカートページ1箇所に寄せた。**

### 文言

`locales/ja.default.json` / `locales/en.json` に追加。**Liquid 直書きはしていない。**
`{% javascript %}` 内では Liquid が展開されないので、
セクションが JSON script タグへ書き出し、JS がそれを読む。差し込みは `%code%`。

## 17. ⚠️ デプロイ前に解決が要る — テーマが分岐している

| | `sections/moru-main-cart.liquid` |
|---|---|
| リポジトリ | 41,505 bytes / `0da03aa7…`(今回の変更前) |
| **MAIN** `166203621616` | **41,505 bytes / `0da03aa7…` = リポジトリと同一** |
| **Frontend Dev** `166341181680` | **31,437 bytes / `6ff9e3db…` / 2026-08-25 更新** |

**Frontend Dev 側は ChatGPT が別バージョンに書き換えている。**
Owner が実機で見たのは MAIN 側(= リポジトリ版)。

**このまま Dev → MAIN と反映すると、今回の修正は上書きで消える。**

`sections/moru-cart-drawer.liquid` は3者とも同一(`69c760c9…`)なので競合しない。

**どのテーマへ push するかは Owner の指示待ち。こちらからは push していない。**

### 検証済み

- `shopify theme check` … **88ファイル / 0 offense**
- `{% javascript %}` ブロックの JS 構文 … `node --check` 通過
- `ja.default.json` / `en.json` … JSON パース通過・キー対応あり

⚠️ Dev MCP の `validate_theme_codeblocks` はこのセッションで接続できなかったため、
`docs/07_session_protocol.md` §6 に従い `shopify theme check` で代替した。

---

## 18. Frontend Dev への統合(2026-08-26)

Owner 判断で **`MORU Frontend Dev`(166341181680)をフロントエンドの正本**とし、
repo/MAIN 版で上書きせず、Dev 版へクーポン差分だけを載せ直した。

### 統合前に分かったこと

**Dev は cart 周りが大きく作り替わっていた。** repo と同名ファイルを直すだけでは届かない:

| Dev の状態 | 影響 |
|---|---|
| `sections/moru-cart-drawer-v2.liquid` が新設され、**`header-group.json` はこちらを使っている** | **repo で直した `moru-cart-drawer.liquid` は Dev では死んでいた** |
| `sections/moru-main-cart.liquid` が**圧縮版に書き換え**(41,505 → 31,437 bytes) | repo 版を push すると ChatGPT の作業を消す |
| `moru-cart-discount-summary` / `moru-header-v2` / `moru-promo-hub` / `moru-quantity-offers` など**新規セクション8件** | repo には存在しない |
| `locales/*.json` は **2026-08-23 の初回 push から未更新** | repo と内容一致(差分 468/446 bytes は Shopify が剥がすヘッダーコメント分) |

**`moru-cart-drawer.liquid` への変更は取り消した。** 生きているのは v2 のほう。

### やった手順

1. Dev の現物を Admin API で取得し、**ローカルで byte 単位に復元**
2. **復元物の md5 が Dev の `checksumMd5` と一致することを確認してから**パッチを当てた
   - `moru-main-cart.liquid` … `6ff9e3db5a23a3592821dab98d77599f` 一致
   - `moru-cart-drawer-v2.liquid` … `fd8acbd8c8d49966ae0437db872db760` 一致
   - **一致しなければ復元ミスなので、そこで止める前提**にした
3. クーポン差分だけを再適用(Dev の圧縮スタイルに合わせた)
4. 検証 → Dev のみへ upsert → checksum で readback

⚠️ `shopify theme pull/push` はこの環境では使えない(対話ログインが要り、
Theme Access トークンも無い)。**Admin API の `themeFilesUpsert` を使った。**
38KB の本文を手で書き写すと転記ミスの危険があるため、
`stagedUploadsCreate` で実ファイルをアップロードし、`body: { type: URL }` で取り込ませた。
**手入力を挟まないので転記ミスが起こり得ない。**

### 反映結果(`MORU Frontend Dev` のみ)

| ファイル | ローカル md5 | Dev の checksumMd5 | size | 判定 |
|---|---|---|---|---|
| `sections/moru-main-cart.liquid` | `e24172bc3f876164439e3c1f12fcae1f` | `e24172bc3f876164439e3c1f12fcae1f` | 38,607 | ✅ |
| `sections/moru-cart-drawer-v2.liquid` | `67452f9cb22d07fbe7809188a963f66d` | `67452f9cb22d07fbe7809188a963f66d` | 18,492 | ✅ |
| `locales/ja.default.json` | `e8968d0d1936dd9168aa6d7c8826a835` | `e8968d0d1936dd9168aa6d7c8826a835` | 12,187 | ✅ |
| `locales/en.json` | `38c5e2a1b24630512b9bf903068a5375` | `38c5e2a1b24630512b9bf903068a5375` | 9,733 | ✅ |

**4ファイルすべて完全一致。**

### MAIN は未変更

`166203621616` / `updatedAt: 2026-08-24T07:51:57Z`(据え置き)。
`moru-main-cart.liquid` は `0da03aa7…` のまま、`locales/ja.default.json` は `54d9414e…` のまま。

### 検証

- `shopify theme check` … **74ファイル / 0 offense**(Dev 構成に合わせた作業ツリーで実行)
- `{% javascript %}` の JS 構文 … 両ファイルとも `node --check` 通過
- `ja.default.json` / `en.json` … JSON パース通過・coupon キー11件が両言語で対応
- ⚠️ Dev MCP の `validate_theme_codeblocks` は本セッションで接続できず、
  `docs/07_session_protocol.md` §6 に従い `shopify theme check` で代替

---

## 19. 訂正と追加確認(2026-08-26)

### 訂正: Discount は **2件**

**前回「Discount 1件」と書いたのは古い数え方だった。** `MORU500` を作った時点で2件になっている。

| # | ID | 種別 | title | code | status |
|---|---|---|---|---|---|
| 1 | `DiscountAutomaticNode/1484384305392` | Automatic (App) | MORU 販促割引(統合) | — | ACTIVE |
| 2 | `DiscountCodeNode/1484417040624` | Code (Basic) | 新規会員登録 ¥500OFF | `MORU500` | ACTIVE |

```
1) discountClasses: PRODUCT / ORDER / SHIPPING
   combinesWith:    order false / product false / shipping false
   functionId:      01a03b6e-7661-7590-8dbf-d5b2e47e837d
   errorHistory:    null

2) discountClasses: ORDER
   combinesWith:    order false / product false / shipping false
   appliesOncePerCustomer: true / usageLimit: null / asyncUsageCount: 0
   startsAt: 2026-08-26T00:00:00Z / endsAt: null
```

**「Discount resource は常に1件」は統合 Function 用 Automatic に対する取り決めで、
コード割引はその枠外**という整理で運用する。

### ソラ キャットハンモック — **購入可能な状態**

`Product/10218060906736` / handle `sora-cat-hammock` / **ACTIVE**

| | |
|---|---|
| オンラインストア | **公開済み**(2026-08-23T10:03:55Z) |
| POS | 公開済み |
| Variant | 4件すべて `availableForSale: true` / ¥20,480 |
| 在庫追跡 | **オフ**(`tracked: false`)= 在庫切れにならない |
| タグ | `pet-furniture` / `tier-core` |

**「市場確認 Hold / 非ローンチ候補」の判断と、いまの公開状態が食い違っている。**
publication は**変更していない。** どう扱うか指示待ち。

### ピボ テーブルランプ — **中国語テキストが残っている**

`Product/10218008510704` / handle `pivo-table-lamp` / ACTIVE / メディア23枚。

**ギャラリー写真4枚(webp)は文字なしで問題なし。**
**説明画像19枚(png)のうち17枚に中国語が残っている。**

| 画像 | 中国語 | 内容 |
|---|---|---|
| 3 | あり | 包豪斯・中古・设计 / 呈现光效与Loft情调风格的融合… |
| 4 | **なし** | 英字のみ(PERSONALITY / NORTHERN FURNITURE / ORIGINALITY) |
| 5 | あり | Design concept / 家 / 释放欲望,诠释个性 / 心境之美,给心灵一个居所 |
| 6 | あり | 优质 电镀铬色灯体 / 经多重工序处理 / 色泽均匀，质感细腻 / **防腐防锈，经久耐用** |
| **7** | **あり 🔴** | **恒流无可视频闪 / 节能护眼 / 手机显示器无直线横纹，无可视频闪，健康护眼 / 高亮度・高显色・寿命长** |
| 8 | あり | 给生活一点情调 / 灯就像人生的伴侣… |
| 9 | **なし** | 文字なし(グリーンの物撮り) |
| 10 | あり | /做一个有格调的都市人，那就让它与你相伴而行/ |
| 11 | あり | 设计灵感 / 光与影在空间中共舞… |
| 12 | あり | 功能介绍 / 旋钮调光&可三色调光(色温 3000k/4000k/6000k は数字表記) |
| 13 | あり | 产品展示 / 开灯效果 |
| 14 | あり | 关灯效果 |
| 15 | あり | 开灯效果 |
| 16 | あり | 关灯效果 |
| 17 | あり | 开灯效果 |
| 18 | あり | 关灯效果 |
| **19** | **あり 🔴** | **产品参数(仕様表)**: 品名 台灯 / 材质 铁艺+亚克力 / 尺寸 如图所示 / 光源 E27*1(5W) / 高46CM / 长27*宽23CM |
| 20 | あり | 产品细节 / 高质感铁艺灯罩 / 光滑铁艺灯罩，外观富有质感… |
| 21 | あり | 精工电镀底盘 / 优质铁艺电镀处理，表面光滑有质感 / 精益制造优良，经久耐用 |

**特に問題が大きいのは2枚:**

- **画像7** … 「**护眼**(目にやさしい)」「**节能护眼**」「**健康护眼**」。
  **CLAUDE.md 絶対ルール15 がランプ画像の実例として名指しで禁じている表現。**
  健康に関わる未検証の主張なので、**日本語化ではなく削除または差し替えが要る。**
  「无可视频闪(ちらつきが見えない)」も同種の未検証主張。
- **画像19** … **寸法・材質・光源の仕様表が中国語のまま。**
  docs/11 §4 の「必須の日本語化」対象そのもの。

画像・status・publication は**変更していない。**

### MORU500 の失敗時文言を中立表現へ変更

「クーポンは無効になっていないので別のご注文で使える」という**断定を削除**した。
Shopify 側にコードの有効性を確かめる手段が無いため、断定できない。

```
コードは現在のカートに適用されませんでした。すでに適用中の割引が優先されている
場合があります。コードの入力内容、ログイン状態、利用条件をご確認ください。
```

文言からコード名の差し込みが無くなったので、セクション側の `| t: code:` と
JS の `.replace('%code%', code)` も併せて外した。

**`MORU Frontend Dev` のみへ反映。**

| ファイル | ローカル md5 | Dev の checksumMd5 | size |
|---|---|---|---|
| `sections/moru-main-cart.liquid` | `cce54ae670928bf6669118e9a4778833` | `cce54ae670928bf6669118e9a4778833` | 38,582 |
| `locales/ja.default.json` | `4a9af23de4d9902c452720b402097e8d` | `4a9af23de4d9902c452720b402097e8d` | 12,001 |
| `locales/en.json` | `91cbf55479b1ea580c23c7d6df71ae30` | `91cbf55479b1ea580c23c7d6df71ae30` | 9,666 |

`shopify theme check` … 74ファイル / 0 offense。JS 構文通過。
**MAIN は `updatedAt 2026-08-24T07:51:57Z` のまま未変更。**

---

## 20. 🔴 Shopify built-in policies への同期は実行できず(2026-08-26)

**`write_legal_policies` スコープが無いため、指示どおり変更せず停止した。**

### 確認したこと

`currentAppInstallation.accessScopes` に:

- ✅ `read_legal_policies`(読み取りはできる)
- ❌ **`write_legal_policies` が無い**

`shopPolicyUpdate` 自体は存在する(引数は `type` と `body`。`id` は受け付けない)。
**スコープが無いので呼んでも通らない。**
中身が壊れる可能性のある試し書き(空文字や仮テキストの投入)は行っていない。

### 同期元のページ(READ ONLY で確認済み・いずれも公開中)

| handle | title | updatedAt | 冒頭 |
|---|---|---|---|
| `privacy` | プライバシーポリシー | 2026-08-26T13:08:32Z | 最終更新日：2026年8月26日 / MORU LIVING（以下「当店」といいます）は… |
| `terms` | 利用規約 | 2026-08-26T13:08:32Z | 最終更新日：2026年8月26日 / 本利用規約（以下「本規約」といいます）は… |
| `refund-policy` | 返品・返金ポリシー | 2026-08-26T13:10:00Z | 最終更新日：2026年8月26日 / 商品到着後30日間の「30日間安心保証」… |
| `shipping-policy` | 配送ポリシー | 2026-08-26T13:10:00Z | 最終更新日：2026年8月26日 / 通常配送の送料は1注文につき870円… |
| `tokushoho` | 特定商取引法に基づく表記 | 2026-08-26T13:08:33Z | 最終更新日：2026年8月26日 / 販売業者の氏名（名称）… |

**5ページとも MORU の本文が入っており、内容は現行の運用と一致している**
(送料 ¥870 / 割引前小計 ¥7,700 以上で無料 / 日本国内のみ / 30日間安心保証)。

### いまの built-in policies の状態

| type | 状態 |
|---|---|
| `PRIVACY_POLICY` | **Shopify のひな形のまま**(`{{ shop_name }}` などのテンプレート変数入り) |
| `TERMS_OF_SERVICE` | **未設定** |
| `REFUND_POLICY` | **未設定** |
| `SHIPPING_POLICY` | **未設定** |
| `LEGAL_NOTICE` | **未設定** |

**チェックアウトのポリシーリンクは built-in policies からしか出ない。**
したがって現状のチェックアウトは:

- 返品・配送・利用規約・特商法のリンクが**出ない**
- プライバシーポリシーのリンクは出るが、**MORU の本文ではなくひな形**を指す

**ストアフロント側の `/pages/...` は5本とも公開済みなので、そちらの導線は生きている。**
食い違っているのは**チェックアウト側だけ。**

### 再開に必要なもの

`write_legal_policies` を持つ接続。付与されれば、
**ページ本文を一字一句そのまま** `shopPolicyUpdate` へ流す。

⚠️ 法務文面を手で書き写すと転記ミスの危険があるため、
`bulkOperationRunQuery` でページ本文を JSONL に書き出し、
`bulkOperationRunMutation` で流し込む(手入力を挟まない)方式を予定する。
テーマ反映で使ったのと同じ考え方。
