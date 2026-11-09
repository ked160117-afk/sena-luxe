/**
 * SENA LUXE - Stone Account Inquiry and Consultation
 * This page accepts inquiries about listed and unlisted stone account products.
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
        <h1 className="text-2xl sm:text-4xl font-bold text-white">石垢について相談・問い合わせ</h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-2 leading-relaxed">
          掲載中の石垢の在庫確認はもちろん、一覧にないゲームタイトルや石垢についても、公式LINEからご相談いただけます。ご希望を伺い、取扱可否・在庫を確認してお探しします。
        </p>
      </div>

      <div className="rounded-xl bg-[#111216] border border-stone-800 p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-white">お問い合わせいただける内容</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              掲載商品の在庫・価格・通貨数量の確認、一覧にない石垢や新しいゲームタイトルのご相談、商品内容・引き継ぎ方法などの確認。
            </p>
          </div>
        </div>
        <div className="border-t border-stone-800 pt-4 space-y-2">
          <h2 className="text-sm font-semibold text-white">お受けしていない内容</h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            ゲームのプレイ代行・育成代行・通貨追加などの代行サービス、既存アカウントへの通貨追加は行っておりません。石垢アカウントの販売のみを取り扱います。
          </p>
        </div>
        <a
          href="https://lin.ee/6uy8hu9"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>公式LINEで石垢について相談する</span>
        </a>
      </div>
    </div>
  );
};
