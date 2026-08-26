import '@shopify/ui-extensions/preact';
import { render } from 'preact';

/**
 * MORU 販促割引(統合)— 割引詳細ページに出す設定 UI。
 *
 * ## なぜ要るのか(D-141)
 *
 * Function に `[extensions.ui]` が無いと、管理画面の「割引を作成 → アプリを選ぶ」で
 * **アプリの App Home URL(`shopify.app.toml` の `application_url`)へ飛ばされる。**
 * MORU Promotions は Function だけのアプリで App Home を持たず、
 * `application_url` が `https://example.com` のままなので **"Example Domain" が開いていた。**
 *
 * この拡張を `admin.discount-details.function-settings.render` に置くと、
 * **管理画面の中で割引の詳細画面が開く。**
 *
 * ## 読み取り専用にしている理由
 *
 * 割引条件の実データ(対象商品 / PAIR / しきい値)は
 * **すでに shop の `custom.moru_promotions_config` に入っている**(D-138)。
 * ここで再入力させると**同じ設定を2箇所で手管理する**ことになり、
 * どちらが正なのか分からなくなる。
 *
 * したがってこの画面の役目は **「いま何が効くのかを確認して、割引を安全に作ること」** だけ。
 * 入力欄は置かない。設定を変えるときは `ops/promotions/_discount_config_20260826.json` を
 * 直して metafield へ入れ直す(履歴が git に残る)。
 *
 * ⚠️ ここに出している数値は**設定の実値を読んでいるのではなく、リポジトリ側の正**を
 * 転記したもの。**両者がズレたら metafield が実際の挙動を決める。**
 * 変更したらこのファイルも一緒に直すこと。
 */

const CONFIG_SOURCE = 'shop.custom.moru_promotions_config';

const SUMMARY = [
  ['Summer Sale', '対象 18商品 / 10%OFF'],
  ['まとめ買い', '2点 10%OFF / 3点以上 15%OFF(同一商品内でカラー・サイズ違いを合算)'],
  ['PAIR P-6「ソファの脇」', 'クラウド サイドテーブル + マッシュルーム コードレステーブルランプ / 15%OFF'],
  ['送料無料のしきい値', '¥7,700(割引前の小計で判定)'],
  ['送料無料の対象', '通常配送のみ。許可リストに無い配送方法には当てない'],
  ['除外', 'ハル ダイニングチェア 2脚セットは Summer Sale の対象外'],
  ['設定の保存先', CONFIG_SOURCE],
];

const RULES = [
  '割引は加算しない。1商品につき適用されるのは1つだけ。',
  '勝者は ①割引率が高い方 → ②同率なら対象数量が多い方 → ③定義順(PAIR > まとめ買い > Sale)。',
  '設定が読めないときは何も割り引かない(fail-closed)。',
  '送料無料も同じで、許可リスト(freeShippingDeliveryOptionTitles)に無い配送方法は無料にしない。将来 配送方法が増えても勝手に無料にならない。',
  '「商品割引」と「配送割引」の両方を有効にすること。片方だけだとその機能が丸ごと動かない。',
];

function App() {
  return (
    <s-function-settings>
      <s-heading>MORU 販促割引(統合)</s-heading>

      <s-section heading="いま有効になる内容">
        <s-paragraph>
          この割引の条件は Shopify の設定ではなく、ストアの metafield
          <s-text>{` ${CONFIG_SOURCE} `}</s-text>
          から読み込まれます。この画面は確認用で、ここでは変更できません。
        </s-paragraph>
        <s-stack gap="base">
          {SUMMARY.map(([label, value]) => (
            <s-stack key={label} direction="inline" gap="base">
              <s-text type="strong">{label}</s-text>
              <s-text>{value}</s-text>
            </s-stack>
          ))}
        </s-stack>
      </s-section>

      <s-section heading="適用ルール">
        <s-stack gap="base">
          {RULES.map((rule) => (
            <s-text key={rule}>{rule}</s-text>
          ))}
        </s-stack>
      </s-section>

      <s-section heading="設定を変えるとき">
        <s-paragraph>
          リポジトリの ops/promotions/_discount_config_20260826.json
          を直して metafield へ入れ直してください。ここで編集できるようにすると、
          同じ設定を2箇所で手管理することになります。
        </s-paragraph>
      </s-section>
    </s-function-settings>
  );
}

export default async () => {
  render(<App />, document.body);
};
