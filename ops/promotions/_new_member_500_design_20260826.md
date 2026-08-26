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
