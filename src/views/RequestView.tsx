/**
 * SENA LUXE - Listed Stone Account Inquiry
 * This page only directs users to ask about already-listed stone account products.
 */
import React from 'react';
import { MessageCircle, Gem, ShieldCheck } from 'lucide-react';

export const RequestView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-cinzel tracking-wider uppercase mb-3">
          <Gem className="w-3.5 h-3.5" />
          <span>LISTED STONE ACCOUNT INQUIRY</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white">掲載中の石垢について問い合わせ</h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-2 leading-relaxed">
          商品ページに掲載されている石垢アカウントについて、商品番号を添えて公式LINEからお問い合わせください。
        </p>
      </div>

      <div className="rounded-xl bg-[#111216] border border-stone-800 p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-white">お問い合わせいただける内容</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              掲載商品の在庫状況、記載された通貨数量・アカウント内容、価格、引き継ぎ条件の確認。
            </p>
          </div>
        </div>
        <div className="border-t border-stone-800 pt-4 space-y-2">
          <h2 className="text-sm font-semibold text-white">お受けしていない内容</h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            掲載外商品の個別手配・取り寄せ・予約、キャラクター指定、アカウント育成、既存アカウントへの通貨追加、各種代行サービスは承っておりません。
          </p>
        </div>
        <a
          href="https://lin.ee/6uy8hu9"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>公式LINEで掲載商品について問い合わせる</span>
        </a>
      </div>
    </div>
  );
};
