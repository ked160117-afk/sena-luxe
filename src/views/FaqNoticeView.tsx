/**
 * SENA LUXE - FAQ & Transaction Notices View (よくある質問・お取引注意事項)
 * Comprehensive legal, operational, and customer guidelines for purchasing game accounts & stone accounts.
 * Black x Gold luxury aesthetics, mobile-first responsive design, interactive FAQ accordions, and LINE CTA.
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Gem,
  Lock,
  Wifi,
  FileQuestion,
  CreditCard,
  UserCheck,
  Scale,
  Sparkles,
} from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: '決済・料金' | '商品仕様・石垢' | '対応・納期' | '安心・安全';
}

export const FaqNoticeView: React.FC = () => {
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const faqList: FaqItem[] = [
    {
      id: 'faq-1',
      category: '決済・料金',
      question: 'PayPayは使えますか？',
      answer:
        '現在の対応状況・お支払い方法は変更となる場合があるため、ご購入前に公式LINEでご確認ください。利用可能と確認できていない決済方法について、対応をお約束するものではありません。',
    },
    {
      id: 'faq-2',
      category: '決済・料金',
      question: 'Amazonギフトカードは使えますか？',
      answer:
        'Amazonギフトカードでのお支払いには、現在対応していることを確認できていません。ご利用可能な決済方法は、ご購入前に公式LINEでご確認ください。',
    },
    {
      id: 'faq-3',
      category: '商品仕様・石垢',
      question: 'キャラクター指定はできますか？',
      answer:
        'キャラクターや所持内容は、各商品ページに明記された内容をご確認ください。掲載内容と異なるキャラクター指定・組み合わせの個別手配は承っておりません。',
    },
    {
      id: 'faq-4',
      category: '商品仕様・石垢',
      question: '一覧にない商品を探せますか？',
      answer:
        '掲載中の商品について、在庫状況や商品内容をご案内いたします。掲載のない商品・個別条件での取り寄せや調達は承っておりません。',
    },
    {
      id: 'faq-5',
      category: '対応・納期',
      question: 'サービス開始直後の新タイトルは対応できますか？',
      answer:
        '新作ゲームタイトルは、取扱可否・安全性・販売体制を確認した上で、正式に掲載した商品から順次販売いたします。未掲載タイトルの個別手配や予約受付は行っておりません。',
    },
    {
      id: 'faq-6',
      category: '商品仕様・石垢',
      question: 'アカウントの買取・交換はできますか？',
      answer:
        '一般のお客様からのアカウント買取・交換は受け付けておりません。販売するのは、商品ページに掲載している在庫商品のみです。商品ごとの確認事項は、購入前に商品ページと公式LINEでご確認ください。',
    },
    {
      id: 'faq-7',
      category: '対応・納期',
      question: '支払い後、納品まで時間がかかりますか？',
      answer:
        '納品時期は商品ごとに異なります。在庫状況と納品目安を購入前にご案内し、お支払い確認後に商品ページ記載の方法で引き継ぎ情報をお渡しいたします。',
    },
    {
      id: 'faq-8',
      category: '商品仕様・石垢',
      question: '自分のアカウントに石を追加できますか？',
      answer:
        '当店では、お客様が現在プレイされている既存アカウントへの通貨追加は承っておりません。石・オーブ等のゲーム内通貨をあらかじめ所持したゲームアカウント本体の販売のみを行っております。',
    },
    {
      id: 'faq-9',
      category: '安心・安全',
      question: '販売実績はありますか？',
      answer:
        '販売実績の件数や評価について、確認できる根拠のない数字・実績は掲載しておりません。現在掲載中の商品情報と取引条件をご確認のうえ、ご不明点は購入前に公式LINEへお問い合わせください。',
    },
    {
      id: 'faq-10',
      category: '安心・安全',
      question: '購入実績のSNS投稿は必要ですか？',
      answer:
        'いいえ、一切不要です。お客様のプライバシー保護およびアカウントの保全を最重要視しておりますので、SNS等への実績投稿やレビューの強制・依頼は一切行っておりません。完全非公開で安心してお取引いただけます。',
    },
    {
      id: 'faq-11',
      category: '安心・安全',
      question: 'トラブル時はどうなりますか？',
      answer:
        'お渡しした引き継ぎ情報や商品説明に相違がある場合は、商品ページの記載とお取引内容を確認します。対応は確認できた事実および適用される法令・取引条件に基づいて個別にご案内します。問題があった場合は、公式LINEへご連絡ください。',
    },
    {
      id: 'faq-12',
      category: '対応・納期',
      question: '日本語で対応していますか？',
      answer:
        'お問い合わせは公式LINEで日本語にて承ります。返信までお時間をいただく場合があります。商品ごとの引き継ぎ方法や注意事項は、商品ページおよび購入前の案内をご確認ください。',
    },
  ];

  const categories = ['ALL', '決済・料金', '商品仕様・石垢', '対応・納期', '安心・安全'];

  const filteredFaq = selectedCategory === 'ALL'
    ? faqList
    : faqList.filter((item) => item.category === selectedCategory);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fade-in text-[#f4efe6]">
      {/* Page Header */}
      <div className="border-b border-[#d4af37]/20 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-cinzel tracking-widest uppercase mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>CUSTOMER GUIDE & COMPLIANCE</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white font-cinzel tracking-tight">
          お取引注意事項 & よくある質問
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-2 max-w-3xl leading-relaxed">
          SENA LUXEでは、お客様に安心・安全にご利用いただくため、お取引前の重要注意事項およびよくあるご質問を公開しております。
          ご購入の前に必ずご一読いただきますようお願い申し上げます。
        </p>
      </div>

      {/* SECTION 1: 石垢についての重要説明 */}
      <section className="rounded-xl bg-gradient-to-br from-[#16171d] via-[#111216] to-[#0c0d10] border border-[#d4af37]/40 p-6 sm:p-8 space-y-4 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0 mt-0.5">
            <Gem className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-cinzel tracking-widest text-[#d4af37] uppercase font-semibold">
              PRODUCT DEFINITION
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
              石垢（ゲーム内通貨アカウント）についての重要説明
            </h2>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-lg bg-[#0a0b0e] border border-stone-800 space-y-3 text-xs sm:text-sm leading-relaxed text-stone-300">
          <p className="font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0" />
            当店は「ゲームアカウントそのもの」を販売しております
          </p>
          <p>
            「石垢」とは、記載された数量のゲーム内通貨（魔法石、聖晶石、オーブ、ダイヤ、ジュエル等）をあらかじめ所持している<strong className="text-[#f7e7ce]">ゲームアカウント本体をお渡しする商品</strong>です。
          </p>
          <div className="p-3.5 rounded bg-amber-950/25 border border-amber-800/40 text-amber-200/90 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>【ご注意ください】</strong><br />
              お客様が現在使用されている既存のゲームアカウントへの通貨追加は承っておりません。あらかじめ通貨がストックされた新規または進行済みアカウント本体を販売しております。
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: お取引に関する注意事項 */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
          <Scale className="w-5 h-5 text-[#d4af37]" />
          <h2 className="text-xl sm:text-2xl font-bold text-white font-cinzel tracking-wide">
            お取引に関する注意事項
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
          当店では透明性の高い健全なお取引を徹底しております。お客様のアカウント保護およびトラブル防止のため、以下の利用規約・免責・対応条件を事前にご確認いただき、ご了承のうえでお取引をお願いいたします。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Item 1: 規約と制限のリスク */}
          <div className="p-5 rounded-xl bg-[#111216] border border-stone-800/90 space-y-2">
            <div className="flex items-center gap-2 text-stone-200 font-semibold text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>運営会社の利用規約とアカウント制限</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              ゲームタイトルによっては、配信・運営会社の利用規約においてアカウントの譲渡・売買が制限または禁止されている場合がございます。購入後に運営会社の規約改定や判断により、利用制限、アカウント停止（BAN）、データ削除等の措置が講じられるリスクが存在します。
            </p>
          </div>

          {/* Item 2: 購入者のリスク理解と同意 */}
          <div className="p-5 rounded-xl bg-[#111216] border border-stone-800/90 space-y-2">
            <div className="flex items-center gap-2 text-stone-200 font-semibold text-xs sm:text-sm">
              <UserCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
              <span>購入者様のリスク理解と承諾</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              購入者様は、上記のアカウント制限リスクおよび各ゲームの利用規約の性質を十分に理解・同意したうえでご購入いただくものとします。当店では不正チートや規約違反ツールによる生成データは一切取り扱っておりません。
            </p>
          </div>

          {/* Item 3: 補償の範囲と制限 */}
          <div className="p-5 rounded-xl bg-[#111216] border border-stone-800/90 space-y-2">
            <div className="flex items-center gap-2 text-stone-200 font-semibold text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-stone-400 shrink-0" />
              <span>当店の補償範囲について</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              お引き渡し完了後、当店の責任によらないゲーム運営会社の個別判断や、購入者様側の利用環境・規約違反・過失に起因するアカウント停止や損害につきましては、補償いたしかねる場合がございます。
            </p>
          </div>

          {/* Item 4: 引き継ぎ環境の注意 */}
          <div className="p-5 rounded-xl bg-[#111216] border border-stone-800/90 space-y-2">
            <div className="flex items-center gap-2 text-stone-200 font-semibold text-xs sm:text-sm">
              <Wifi className="w-4 h-4 text-blue-400 shrink-0" />
              <span>通信環境の安定した場所での引き継ぎ</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              アカウント引き継ぎ作業を行う際は、必ず通信状態が良好かつ安定したWi-Fi環境等で行ってください。引き継ぎ処理中の回線切断や端末エラーによるデータ破損を防ぐため、十分な充電状態での操作を推奨いたします。
            </p>
          </div>

          {/* Item 5: 引き継ぎ完了後のパスワード変更 */}
          <div className="p-5 rounded-xl bg-[#111216] border border-stone-800/90 space-y-2">
            <div className="flex items-center gap-2 text-stone-200 font-semibold text-xs sm:text-sm">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>引き継ぎ後のパスワード速やか変更</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              引き継ぎが正常に完了した後は、アカウントの安全性を確保するため、連携しているパスワード、メールアドレス、SNS連携等の認証情報を速やかにお客様ご自身のものへとご変更ください。
            </p>
          </div>

          {/* Item 6: 当店側の不備・内容相違への誠実対応 */}
          <div className="p-5 rounded-xl bg-[#111216] border border-stone-800/90 space-y-2">
            <div className="flex items-center gap-2 text-stone-200 font-semibold text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0" />
              <span>データ内容相違・不備への対応</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              万が一、商品説明と実際の納品データ内容に相違がある場合や、当店側が発行した引き継ぎ情報に不備（ログイン不可等）が生じた場合は、当店にて状況を速やかに確認の上、代替品の提供や修正等の対応を誠実に行います。
            </p>
          </div>
        </div>

        {/* 法令遵守と返品・返金条件の明記 */}
        <div className="p-5 rounded-xl bg-[#0f1014] border border-[#d4af37]/30 text-xs sm:text-sm space-y-2 text-stone-300">
          <div className="text-stone-100 font-semibold flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#d4af37]" />
            <span>返品・返金条件および法令順守に関する方針</span>
          </div>
          <p className="text-stone-400 text-xs leading-relaxed">
            デジタルコンテンツおよびアカウントデータの性質上、正常にお引き渡しが完了した後の購入者様都合による返品・交換・返金には原則として応じられません。ただし、当店側の過失による引き継ぎ不能や説明内容との重大な瑕疵が認められる場合、法令に基づき誠実に対応いたします。当店の責任による不備を一律に免責することはございません。
          </p>
        </div>
      </section>

      {/* SECTION 3: FAQ (よくある質問) */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-xl sm:text-2xl font-bold text-white font-cinzel tracking-wide">
              よくある質問（FAQ）
            </h2>
          </div>
          <span className="text-xs text-stone-400">全{faqList.length}問</span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#d4af37] text-black font-semibold'
                  : 'bg-[#121316] text-stone-300 hover:text-white border border-stone-800'
              }`}
            >
              {cat === 'ALL' ? 'すべて表示' : cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFaq.map((item) => {
            const isOpen = openFaqId === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-[#14151b] border-[#d4af37]/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                    : 'bg-[#111216] border-stone-800/80 hover:border-stone-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(item.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-cinzel text-xs font-bold text-[#d4af37] w-6 shrink-0">
                      Q.
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-stone-100 leading-snug">
                      {item.question}
                    </span>
                  </div>
                  <div className="shrink-0 text-stone-400">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#d4af37]" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs sm:text-sm text-stone-300 border-t border-stone-800/70 leading-relaxed animate-fade-in flex items-start gap-3 bg-[#0d0e12]/60">
                    <span className="font-cinzel text-xs font-bold text-gold-gradient w-6 shrink-0 mt-0.5">
                      A.
                    </span>
                    <div className="space-y-2 text-stone-300">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: 公式LINEへの問い合わせ導線 */}
      <section className="rounded-2xl bg-gradient-to-br from-[#16171f] via-[#111217] to-[#0c0d10] border border-[#d4af37]/40 p-6 sm:p-10 text-center space-y-6 shadow-[0_8px_35px_rgba(0,0,0,0.7)]">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#06C755]/15 border border-[#06C755]/30 text-[#06C755] text-xs font-medium">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>SENA LUXE OFFICIAL CONCIERGE</span>
          </div>

          <h3 className="text-xl sm:text-3xl font-bold text-white font-cinzel">
            ご不明な点は公式LINEにてご相談ください
          </h3>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            商品のお探し、希望キャラクターの在庫確認、お支払い方法のご相談など、専任コンシェルジュが1対1で迅速に対応いたします。<br className="hidden sm:inline" />
            ご購入前の事前確認だけでもお気軽にお問い合わせください。
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a
            href="https://lin.ee/6uy8hu9"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#06C755] hover:bg-[#05b34c] transition-all flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(6,199,85,0.3)]"
          >
            <MessageCircle className="w-4 h-4 fill-white stroke-none" />
            <span>公式LINEでコンシェルジュに相談する</span>
          </a>
        </div>

        <div className="pt-2 flex items-center justify-center gap-6 text-[11px] text-stone-500">
          <span>個別非公開対応</span>
          <span aria-hidden="true">·</span>
          <span>日本人スタッフ常駐</span>
          <span aria-hidden="true">·</span>
          <span>事前相談無料</span>
        </div>
      </section>
    </div>
  );
};
