/**
 * SENA LUXE - LINE Inquiry Modal
 * Pops up when customer taps inquiry, copies game and product code, and guides to official LINE.
 */

import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, Copy, ExternalLink, X, MessageCircle } from 'lucide-react';

export const LineInquiryModal: React.FC = () => {
  const { lineModal, closeLineModal, settings } = useStore();

  if (!lineModal.isOpen) return null;

  const handleOpenLine = () => {
    window.open(settings.lineUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReCopy = async () => {
    try {
      await navigator.clipboard.writeText(lineModal.formattedText);
    } catch {
      // fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={closeLineModal}
    >
      <div
        className="relative w-full max-w-md bg-[#121316] border border-[#d4af37]/40 rounded-xl p-6 sm:p-7 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.15)] text-[#f4efe6]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeLineModal}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800/60 transition-colors"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] tracking-widest text-[#d4af37] uppercase font-cinzel">SENA LUXE CONCIERGE</span>
            <h3 className="text-base sm:text-lg font-semibold text-white">お問い合わせ内容をコピーしました</h3>
          </div>
        </div>

        {/* Copy Box */}
        <div className="mb-5 p-4 rounded-lg bg-[#0b0c0e] border border-stone-800">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-1.5">
            <span>コピー済みの問い合わせコード</span>
            <button
              onClick={handleReCopy}
              className="flex items-center gap-1 text-[#d4af37] hover:underline"
            >
              <Copy className="w-3.5 h-3.5" />
              再コピー
            </button>
          </div>
          <div className="font-mono text-sm sm:text-base font-semibold text-[#f7e7ce] select-all break-all py-1">
            {lineModal.formattedText}
          </div>
          {lineModal.planName && (
            <div className="text-xs text-stone-400 mt-1 border-t border-stone-800/80 pt-1.5">
              対象プラン: <span className="text-stone-300">{lineModal.planName}</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs leading-relaxed text-stone-300 space-y-2 mb-6 bg-stone-900/40 p-3.5 rounded-lg border border-stone-800/60">
          <p className="flex items-start gap-2">
            <span className="text-[#d4af37] font-bold">1.</span>
            <span>下のボタンから公式LINEのトーク画面を開きます。</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-[#d4af37] font-bold">2.</span>
            <span>コピーされたテキストを貼り付けてそのまま送信してください。</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-[#d4af37] font-bold">3.</span>
            <span>掲載商品の在庫・内容・価格について確認し、公式LINEでご案内します。返信までお時間をいただく場合があります。</span>
          </p>
        </div>

        {/* Action Button: Open LINE */}
        <div className="space-y-3">
          <button
            onClick={handleOpenLine}
            className="w-full py-3.5 px-4 rounded-lg font-semibold text-black bg-[#06C755] hover:bg-[#05b34c] transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(6,199,85,0.3)] hover:shadow-[0_6px_20px_rgba(6,199,85,0.4)]"
          >
            <MessageCircle className="w-5 h-5 fill-black stroke-none" />
            <span>LINEを開いて問い合わせる</span>
            <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
          </button>

          <button
            onClick={closeLineModal}
            className="w-full py-2.5 px-4 text-xs font-medium text-stone-400 hover:text-stone-200 text-center transition-colors"
          >
            サイトに戻る
          </button>
        </div>
      </div>
    </div>
  );
};
