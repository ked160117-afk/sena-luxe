/**
 * SENA LUXE - Legal & Policy Views
 * Includes: Shop Information, Terms of Service, Privacy Policy, and Specified Commercial Transactions Act
 * Designed with transparent disclosures, compliance principles, and no fictitious data.
 */

import React from 'react';
import { useStore } from '../context/StoreContext';
import { Shield, FileText, Lock, Building, MessageCircle } from 'lucide-react';

export const ShopInfoView: React.FC = () => {
  const { settings } = useStore();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in text-stone-300 text-xs sm:text-sm">
      <div className="border-b border-[#d4af37]/20 pb-6">
        <div className="flex items-center gap-2 mb-1 text-[#d4af37]">
          <Building className="w-4 h-4" />
          <span className="text-[11px] font-cinzel tracking-widest uppercase">ABOUT SENA LUXE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">ショップ情報・運営方針</h1>
      </div>

      <div className="rounded-xl bg-[#111216] border border-stone-800 p-6 sm:p-8 space-y-6 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#d4af37] rounded-full inline-block" />
            コンセプト：PREMIUM GAME COLLECTION
          </h2>
          <p>
            「SENA LUXE（セナ・リュクス）」は、ゲーム内通貨を保有した石垢アカウントを掲載・販売するオンラインショップです。販売対象は、商品ページに掲載した石垢アカウントに限ります。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#d4af37] rounded-full inline-block" />
            当店の3大ポリシー
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-[#0a0b0d] border border-stone-800 space-y-1">
              <span className="text-[#d4af37] font-semibold text-xs block">01. 商品情報の事前確認</span>
              <p className="text-xs text-stone-400">
                商品ページに記載した内容・通貨数量・在庫状況を、購入前に公式LINEでご確認いただきます。
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#0a0b0d] border border-stone-800 space-y-1">
              <span className="text-[#d4af37] font-semibold text-xs block">02. 永久欠番制による追跡性</span>
              <p className="text-xs text-stone-400">
                発行された商品番号（SL-XX-001形式）は永久欠番となり、重複販売や過去データの再利用を防止。
              </p>
            </div>
            <div className="p-4 rounded-lg bg-[#0a0b0d] border border-stone-800 space-y-1">
              <span className="text-[#d4af37] font-semibold text-xs block">03. 公式LINEでのお問い合わせ</span>
              <p className="text-xs text-stone-400">
                掲載商品の在庫・内容・価格・引き継ぎ条件について、公式LINEでお問い合わせいただけます。返信までお時間をいただく場合があります。
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#d4af37] rounded-full inline-block" />
            販売対象について
          </h2>
          <p>
            当店は石垢アカウントの販売専門店です。掲載一覧にない商品や新しいゲームタイトルも、公式LINEでご相談いただければ取扱い・在庫を確認して対応します。既存アカウントへの通貨追加、ゲームのプレイ代行・育成代行などの代行サービスは行っておりません。
          </p>
        </section>

        <section className="space-y-2 pt-2 border-t border-stone-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-stone-400">お問い合わせ受付：</span>
            <span className="text-stone-200 font-medium">公式LINE窓口（{settings.contactDeskHours || '公式LINEにてご案内'}）</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone-400">お支払い・決済形態：</span>
            <span className="text-stone-200 font-medium">Web自動決済なし（LINE個別相談・条件合意後の個別案内）</span>
          </div>
        </section>

        <div className="pt-4 text-center">
          <a
            href="https://lin.ee/6uy8hu9"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors inline-flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 fill-black stroke-none" />
            <span>公式LINEで問い合わせる</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export const TermsView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in text-stone-300 text-xs sm:text-sm">
      <div className="border-b border-[#d4af37]/20 pb-6">
        <div className="flex items-center gap-2 mb-1 text-[#d4af37]">
          <FileText className="w-4 h-4" />
          <span className="text-[11px] font-cinzel tracking-widest uppercase">TERMS OF SERVICE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">利用規約</h1>
      </div>

      <div className="rounded-xl bg-[#111216] border border-stone-800 p-6 sm:p-8 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-white">第1条（総則および本規約の適用）</h2>
          <p>
            本利用規約（以下「本規約」）は、SENA LUXE（以下「当店」）が提供する石垢アカウントの商品情報の掲載および販売（以下「本サービス」）の利用条件を定めるものです。利用者は本サービスを利用することにより、本規約に同意したものとみなされます。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-white">第2条（ゲーム各社の利用規約および法令の尊重）</h2>
          <p>
            1. 利用者は、各ゲーム配信事業者が定める利用規約、利用約款、及び関連諸法令を十分に確認・理解した上で本サービスを利用するものとします。<br />
            2. 各種ゲームアカウントの譲渡や取引等に関する制限事項については利用者の自己責任において判断いただくものとし、当店では不正アクセスやチートツール等による不正生成データの取扱いは一切いたしません。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-white">第3条（お問い合わせおよび取引の成立）</h2>
          <p>
            1. 当Webサイトの商品情報は、掲載商品の内容を案内するものです。価格・在庫・通貨数量・引き継ぎ条件は、購入前に公式LINEで最新の内容をご確認ください。<br />
            2. お取引の条件・成立時点については、購入前に個別にご案内します。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-white">第4条（免責事項）</h2>
          <p>
            1. 当店では引き継ぎ完了後のパスワード変更やセキュリティ設定をお客様自身で行っていただくことを強く推奨しております。<br />
            2. お引き渡し完了後に生じた利用者の過失によるアカウント停止、紛失、規約改定に伴う損害等について、当店の故意または重過失を除き、一切の責任を負いかねます。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-white">第5条（規約の改定）</h2>
          <p>
            当店は、法令の改正やサービス改善に伴い、本規約を適宜改定できるものとし、当サイトに掲載された時点でその効力を生じるものとします。
          </p>
        </section>
      </div>
    </div>
  );
};

export const PrivacyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in text-stone-300 text-xs sm:text-sm">
      <div className="border-b border-[#d4af37]/20 pb-6">
        <div className="flex items-center gap-2 mb-1 text-[#d4af37]">
          <Lock className="w-4 h-4" />
          <span className="text-[11px] font-cinzel tracking-widest uppercase">PRIVACY POLICY</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">プライバシーポリシー</h1>
      </div>

      <div className="rounded-xl bg-[#111216] border border-stone-800 p-6 sm:p-8 space-y-6 leading-relaxed">
        <p>
          SENA LUXE（以下「当店」）は、お客様のプライバシーを尊重し、個人情報の保護に関する法令を遵守するとともに、以下のプライバシーポリシーに従って安全かつ適切に取り扱います。
        </p>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-white">1. 取得する情報</h2>
          <p>
            当店は、LINE公式アカウントでのお問い合わせ時やリクエスト送信時に、お客様のニックネーム、ご希望商品内容、連絡事項等、円滑なお取引に必要な最低限の情報のみを取得します。Webサイト閲覧のみでクレジットカード情報や過剰な個人情報を取得することはありません。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-white">2. 利用目的</h2>
          <ul className="list-disc list-inside space-y-1 text-stone-400">
            <li>お問い合わせに対する回答および在庫確認のご案内</li>
            <li>商品の引き継ぎサポートおよびアフターフォローの提供</li>
            <li>サービスの品質向上および重要なお知らせの伝達</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-white">3. 第三者への開示・提供の制限</h2>
          <p>
            当店は、法令に基づく正当な開示請求がある場合を除き、お客様の同意を得ることなく個人情報を第三者に提供・販売することは一切いたしません。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-white">4. 安全管理措置</h2>
          <p>
            取得した情報は、お問い合わせ対応および取引に必要な範囲で適切に管理します。保管期間や削除のご希望については、法令および対応可能な範囲に従って取り扱います。
          </p>
        </section>
      </div>
    </div>
  );
};

export const LawView: React.FC = () => {
  const { settings } = useStore();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in text-stone-300 text-xs sm:text-sm">
      <div className="border-b border-[#d4af37]/20 pb-6">
        <div className="flex items-center gap-2 mb-1 text-[#d4af37]">
          <Shield className="w-4 h-4" />
          <span className="text-[11px] font-cinzel tracking-widest uppercase">COMMERCIAL DISCLOSURE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">特定商取引法に基づく表記</h1>
        <p className="text-xs text-stone-400 mt-2">
          実在する透明な運営体制と、Web上での直接決済非導入に伴うご案内
        </p>
      </div>

      <div className="rounded-xl bg-[#111216] border border-stone-800 divide-y divide-stone-800 text-xs sm:text-sm">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-semibold text-white sm:w-1/3">ショップ名称</span>
          <span className="sm:w-2/3 text-stone-300">SENA LUXE (セナ・リュクス)</span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-semibold text-white sm:w-1/3">運営責任者・所在地</span>
          <span className="sm:w-2/3 text-stone-300">
            ※事業者の氏名（名称）・住所・電話番号は、消費者から請求があった場合、購入申込み前に遅滞なく書面または電磁的記録で提供します。<br />
            ※請求を受けた際に、遅滞なく提供できる体制を整えておく必要があります。
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-semibold text-white sm:w-1/3">公式お問い合わせ窓口</span>
          <span className="sm:w-2/3 text-stone-300">
            SENA LUXE 公式LINE窓口<br />
            受付時間：{settings.contactDeskHours || '公式LINEにてご案内'}
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-semibold text-white sm:w-1/3">販売価格</span>
          <span className="sm:w-2/3 text-stone-300">
            掲載中の商品は、商品ページに販売価格を表示します。税金や通信料・送金手数料など別途ご負担いただく費用がある場合は、購入前に明示します。
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-semibold text-white sm:w-1/3">商品代金以外の必要料金</span>
          <span className="sm:w-2/3 text-stone-300">
            インターネット接続に伴う通信料および送金手数料（お客様ご負担）
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-semibold text-white sm:w-1/3">お支払い方法および決済時期</span>
          <span className="sm:w-2/3 text-stone-300 leading-relaxed">
            本サイト上でのクレジットカード等の直接決済機能は設けておりません。<br />
            お支払い方法はPayPayおよびAmazonギフトカードに対応しています。お支払い手順やその他の不明点は、購入前に公式LINEでご確認ください。
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-semibold text-white sm:w-1/3">商品引き渡し時期</span>
          <span className="sm:w-2/3 text-stone-300">
            商品ごとに異なります。引き渡し時期・方法は、お支払い前に商品ごとの条件としてご案内します。
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-semibold text-white sm:w-1/3">返品・交換・キャンセル条件</span>
          <span className="sm:w-2/3 text-stone-300 leading-relaxed">
            返品・キャンセルの可否、条件、返金の取扱いは、購入前に商品ごとの条件として明示します。商品説明と実際の内容に相違がある場合は、適用される法令および取引条件に基づいて対応します。
          </span>
        </div>
      </div>
    </div>
  );
};
