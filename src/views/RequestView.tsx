/**
 * SENA LUXE - Game Request View (その他・ゲームリクエスト)
 * Form for inquiring unlisted titles, specific builds, or custom requests.
 */

import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { HelpCircle, Send, CheckCircle2, MessageCircle, ExternalLink, ShieldCheck } from 'lucide-react';

export const RequestView: React.FC = () => {
  const { submitGameRequest } = useStore();

  const [gameTitle, setGameTitle] = useState('');
  const [requestType, setRequestType] = useState('ゲームアカウント');
  const [desiredQuantity, setDesiredQuantity] = useState('');
  const [budget, setBudget] = useState('');
  const [contactNotes, setContactNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await submitGameRequest({
        gameTitle: gameTitle.trim(),
        requestType,
        desiredQuantity: desiredQuantity.trim() || '特になし',
        budget: budget.trim() || '要相談',
        contactNotes: contactNotes.trim(),
      });

      // Directly open official LINE link
      if (typeof window !== 'undefined') {
        window.open('https://lin.ee/6uy8hu9', '_blank', 'noopener,noreferrer');
      }

      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-cinzel tracking-wider uppercase mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>CUSTOM GAME PROCUREMENT</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white">その他・ゲームリクエスト</h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-2 leading-relaxed">
          取扱一覧にないゲームタイトルや、特定の限定キャラクター・完凸サポカ・指定条件のアカウント調達をご希望の場合は、下記フォームよりお気軽にご依頼ください。専任コンシェルジュが手配可否とご案内価格を調査いたします。
        </p>
      </div>

      {submitted ? (
        <div className="rounded-xl bg-[#121316] border border-[#d4af37]/40 p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">リクエストを受付いたしました</h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-lg mx-auto leading-relaxed">
            ご入力いただいた内容は管理システムに正常に送信されました。
            公式LINEの友だち追加画面にて、専任コンシェルジュより手配状況とお見積もりをご案内いたします。
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://lin.ee/6uy8hu9"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg text-xs font-semibold text-white bg-[#06C755] hover:bg-[#05b34c] transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-white stroke-none" />
              <span>公式LINEで相談する</span>
            </a>
            <button
              onClick={() => {
                setSubmitted(false);
                setGameTitle('');
                setDesiredQuantity('');
                setBudget('');
                setContactNotes('');
              }}
              className="px-5 py-2.5 rounded-lg text-xs font-medium text-stone-300 bg-stone-800 hover:bg-stone-700 transition-colors"
            >
              続けて別のリクエストを送信
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-[#111216] border border-stone-800 p-6 sm:p-8 space-y-6 shadow-xl"
        >
          {/* Game Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-200 flex items-center justify-between">
              <span>ゲームタイトル <span className="text-rose-400">*</span></span>
              <span className="text-[11px] text-stone-500 font-normal">正式名称または略称</span>
            </label>
            <input
              type="text"
              required
              placeholder="例: ブルーアーカイブ、原神、学園アイドルマスター など"
              value={gameTitle}
              onChange={(e) => setGameTitle(e.target.value)}
              className="w-full text-xs sm:text-sm bg-[#0a0b0d] text-white border border-stone-800 rounded-lg px-4 py-3 focus:outline-none focus:border-[#d4af37] transition-colors"
            />
          </div>

          {/* Request Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-200">
              希望内容 <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                'ゲームアカウント',
                'ゲーム内通貨・石垢',
                '育成済みデータ',
                '指定キャラ・アイテム',
              ].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRequestType(type)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-medium text-center border transition-all ${
                    requestType === type
                      ? 'bg-[#d4af37] text-black font-semibold border-[#d4af37]'
                      : 'bg-[#0a0b0d] text-stone-300 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Desired Quantity & Conditions */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-200 flex items-center justify-between">
              <span>希望数量・指定条件</span>
              <span className="text-[11px] text-stone-500 font-normal">例: 石100,000個 / 限定キャラ完凸 / 誕生日未設定</span>
            </label>
            <input
              type="text"
              placeholder="例: 廻珠 100,000個以上、SSR確定チケット未受取の初期アカウント"
              value={desiredQuantity}
              onChange={(e) => setDesiredQuantity(e.target.value)}
              className="w-full text-xs sm:text-sm bg-[#0a0b0d] text-white border border-stone-800 rounded-lg px-4 py-3 focus:outline-none focus:border-[#d4af37] transition-colors"
            />
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-200 flex items-center justify-between">
              <span>ご希望予算目安</span>
              <span className="text-[11px] text-stone-500 font-normal">例: 3,000円〜5,000円 / 応相談</span>
            </label>
            <input
              type="text"
              placeholder="例: ¥5,000前後、または市場相場に応じる"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full text-xs sm:text-sm bg-[#0a0b0d] text-white border border-stone-800 rounded-lg px-4 py-3 focus:outline-none focus:border-[#d4af37] transition-colors"
            />
          </div>

          {/* Contact Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-200 flex items-center justify-between">
              <span>連絡事項・特記事項</span>
              <span className="text-[11px] text-stone-500 font-normal">任意</span>
            </label>
            <textarea
              rows={3}
              placeholder="ご希望の納品時期や、譲れない条件がございましたら自由にご記入ください。"
              value={contactNotes}
              onChange={(e) => setContactNotes(e.target.value)}
              className="w-full text-xs sm:text-sm bg-[#0a0b0d] text-white border border-stone-800 rounded-lg px-4 py-3 focus:outline-none focus:border-[#d4af37] transition-colors resize-none"
            />
          </div>

          {/* Security & Verification Guarantee */}
          <div className="p-3.5 rounded-lg bg-[#0c0d10] border border-stone-800/80 text-[11px] text-stone-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              当店では安全基準を満たせない商品（不正チャージ・チート・規約重大違反アカウント）はお取り扱いいたしません。
              手配可否の調査結果および見積価格は、専任コンシェルジュよりご案内いたします。
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !gameTitle.trim()}
              className="w-full py-3.5 px-4 rounded-lg font-semibold text-xs sm:text-sm text-black bg-[#d4af37] hover:bg-[#e2bd4e] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
            >
              <Send className="w-4 h-4" />
              <span>リクエストを送信してLINE窓口を開く</span>
            </button>
            <p className="text-[10px] text-stone-500 text-center mt-2">
              送信完了後、公式LINEの友だち追加画面へ直接ご案内いたします。
            </p>
          </div>
        </form>
      )}
    </div>
  );
};
