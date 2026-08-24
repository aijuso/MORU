# MORU Promotions を Shopify に載せるまでの手順(はじめての方向け)

> 2026-08-24 作成。**Owner の作業は「ブラウザで3つ」だけです。**
> ターミナルは使いません。難しい判断もありません。
>
> ⚠️ **前回の案内の訂正:** `SHOPIFY_CLI_PARTNERS_TOKEN` という名前をお伝えしましたが、
> **これは古い方式で、いまは新規発行できません。**
> 正しくは **App Automation Token** を **Dev Dashboard** で作り、
> 環境変数名は **`SHOPIFY_APP_AUTOMATION_TOKEN`** です。

---

## 全体像

```
【Owner がブラウザでやる】          【Claude Code がやる】
 ①アプリ「MORU Promotions」を作る
 ②MORU ストアにインストールする
 ③トークンを作って渡す
        │
        └──────────────────────→  ④shopify app deploy
                                    ⑤shopifyFunctions で確認して報告
```

**なぜ Owner にお願いするのか:** Shopify の Function は、Admin API からは登録できません。
「アプリ」を通してしか store に載らず、そのアプリを作れるのはアカウントを持っている本人だけです。
Claude Code 側にはログイン情報がありません(それが正しい状態です)。

---

## ① アプリ「MORU Promotions」を作る

1. ブラウザで **https://dev.shopify.com/dashboard** を開く
   (いつも Shopify の管理画面に入るアカウントでログインしてください)
2. **Apps** → **Create app** を押す
3. 作り方を聞かれたら **「Use the Dev Dashboard」**(CLI ではないほう)を選ぶ
   — 管理画面UIの無い、API/自動化だけのアプリなのでこちらで十分です
4. 名前に **`MORU Promotions`** と入れる。説明は任意(例: MORU の販促・割引用 Function をまとめる内部アプリ)
5. 作成する

> この時点ではまだ何も動きません。「入れ物」ができただけです。

## ②-1 バージョンを作って権限(scopes)を入れる

アプリは「バージョン」を1つ出さないとストアに入れられません。

1. 左メニューの **Versions** → 右上の **Release**
2. **App URL** は空欄のままで大丈夫です(デフォルトのままでOK)。この Function は画面を持ちません
3. **Webhooks API version** は一番新しいものを選ぶ
4. **Scopes(権限)** に、次の**2つだけ**を入れる:

   ```
   read_products
   write_discounts
   ```

   > これ以外は付けないでください。`write_products` や `read_orders` は要りません。
   > 理由は `extensions/multi-buy-discount/README.md` に書いてあります。

5. **Release** を押す

## ②-2 MORU ストアにインストールする

1. 左メニューの **Home**
2. 下のほうにある **Install app**
3. ストアに **MORU LIVING(`rgy5ee-fv.myshopify.com`)** を選ぶ
4. **Install**

> ここでインストールしても、**割引は1つも作られません。**
> 中身がまだ空だからです。実際の割引は、こちらが Function を deploy して、
> さらに Owner の承認が出てから作ります。

## ③ トークン(App Automation Token)を作る

これが「Claude Code が Owner の代わりに deploy するための鍵」です。

1. 左メニューの **Settings**
2. **App Automation Token** の欄で **Create token**
3. **Expiration(有効期限)** を選ぶ — **1 month をおすすめします**
   (今回の作業は1回で終わるので、短いほうが安全です)
4. **Generate token**
5. **表示された文字列をその場でコピーする**
   ⚠️ **この画面を閉じると二度と表示されません。** 消えたら revoke(失効)して作り直しになります

### ついでにコピーしてほしいもの

同じ **Settings** ページに **Client ID** があります。これも控えてください。
**Client ID があれば、対話式のログイン(`shopify app config link`)を飛ばせます。**

- Client ID … 秘密ではありません。**チャットに貼って大丈夫です**
- Token … **秘密です。チャットに貼らないでください**(下記)

---

## トークンの渡しかた — **チャットに貼らないでください**

チャットに貼ると会話の記録に残り続けます。次のどちらかでお願いします。

### 方法A(推奨): この作業環境の環境変数に入れる

claude.ai/code の**環境(Environment)の設定画面**で、環境変数を追加します。

| 名前 | 値 |
|---|---|
| `SHOPIFY_APP_AUTOMATION_TOKEN` | (コピーしたトークン) |

> **注意: 環境変数を足したあとは、セッションを開き直す必要があります**
> (いまのコンテナは起動時の環境のまま動いているため)。
> 新しいセッションで「トークンを入れたので deploy して」と言っていただければ、そこから進めます。

### 方法B: 貼ってしまった場合

**すぐに Dev Dashboard の Settings → App Automation Token → Revoke** で失効させて、
作り直してください。失効させれば、漏れたトークンは使えなくなります。

---

## ④ 以降(Claude Code がやること)

Client ID を教えていただければ `shopify.app.toml` に書き込み、トークンが環境に入り次第:

```bash
cd apps/moru-promotions
shopify app deploy --allow-updates
```

そのあと Admin API で確認して、Owner 指定の項目を報告します。

```graphql
query { shopifyFunctions(first: 25) { nodes { id title apiType apiVersion app { title } } } }
```

**報告して止まります。** 割引の作成・有効化・商品への metafield 設定・価格変更は、
次の承認をいただくまで行いません。

---

## つまずいたときに見るところ

| 症状 | たぶんこれ |
|---|---|
| Dev Dashboard に入れない / アプリが作れない | Partner アカウントが要ります。`https://www.shopify.com/partners` から無料で作れます。ストアと同じメールで大丈夫です |
| 「App Automation Token」の欄が見当たらない | **アプリの** Settings です(組織の Settings ではありません)。左メニューでアプリを選んでから Settings に入ってください |
| Partner Dashboard(`partners.shopify.com`)にトークンの作成欄が無い | **正常です。** そちらでの新規発行は廃止され、Dev Dashboard に移りました |
| Install app にストアが出てこない | そのアカウントがストアの所有者/コラボレーターになっているか確認してください |
| トークンをコピーし損ねた | Revoke して作り直してください。復元はできません |

## 用語(気にしなくていいけれど、出てきたら)

| 言葉 | 意味 |
|---|---|
| **Function** | Shopify のカート計算に割り込む小さなプログラム。今回の「2点10% / 3点以上15%」の本体 |
| **Extension** | アプリに載せる部品。Function は Extension の一種 |
| **Client ID** | アプリの識別番号。秘密ではない |
| **App Automation Token** | 人が画面でログインする代わりの鍵。**秘密** |
| **scopes** | アプリがストアの何を触れるかの範囲。狭いほど安全 |
| **deploy** | 手元のコードを Shopify に登録すること。**登録しただけでは客に何も起きない** |
