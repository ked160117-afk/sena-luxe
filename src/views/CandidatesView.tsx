/**
 * SENA LUXE - Popular Game Candidates View (人気ゲーム追加候補)
 * 8 Candidate titles separated from handled games. Shows '価格確認中' and request actions.
 */

import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, ArrowRight, Clock, ShieldCheck, Check } from 'lucide-react';
import { GameCardIcon } from '../components/GameCardIcon';

export const CandidatesView: React.FC = () => {
  const { candidateGames, setCurrentView, isAdminLoggedIn, promoteCandidateToHandled } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-[#d4af37]/20 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <span className="text-[11px] font-cinzel tracking-widest text-[#d4af37] uppercase">
              CANDIDATE TITLES IN QUEUE
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white">人気ゲーム追加候補</h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-2 max-w-2xl leading-relaxed">
            現在正式取扱中のタイトルとは別枠で管理されている追加候補ゲーム（全{candidateGames.length}タイトル）です。
            市場供給体制および安全性を検証中であり、価格未設定の場合は「価格確認中」と表示しています。
          </p>
        </div>

        <button
          onClick={() => setCurrentView('faq')}
          className="px-4 py-2.5 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center gap-2 self-start md:self-end shrink-0"
        >
          <span>販売方針を確認する</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Distinction Banner */}
      <div className="rounded-xl bg-[#0f1014] border border-stone-800 p-4 sm:p-5 flex items-start gap-3 text-xs text-stone-400">
        <Clock className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="text-stone-200 font-medium">【別区分表示について】</span>
          本ページのタイトルは現在、取扱可否・安全性を確認中です。正式に販売準備が整った商品だけを「取扱ゲーム」に掲載いたします。
        </div>
      </div>

      {/* Candidate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {candidateGames.map((game) => (
          <div
            key={game.id}
            className="group rounded-xl bg-[#111216] border border-stone-800/90 hover:border-[#d4af37]/50 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.1)]"
          >
            <div>
              {/* App Icon or Black x Gold Luxury Crest */}
              <GameCardIcon game={game} />

              {/* Title & Info */}
              <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                <span>{game.category}</span>
                <span className="text-amber-400/90 font-medium">取扱準備中</span>
              </div>
              <h3 className="text-base font-semibold text-stone-100 group-hover:text-gold-subtle transition-colors">
                {game.name}
              </h3>
              <div className="text-[11px] text-[#d4af37]/80 font-medium mt-1">
                予定通貨: {game.currencyName} ({game.currencyUnit})
              </div>
              <p className="text-xs text-stone-400 mt-2 line-clamp-3 leading-relaxed">
                {game.description}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 mt-4 border-t border-stone-800/80 space-y-2">
              <div className="w-full py-2.5 px-3 rounded-lg text-xs font-medium text-stone-400 bg-stone-900 border border-stone-800 text-center">
                現在、販売準備中です
              </div>

              {isAdminLoggedIn && (
                <button
                  onClick={() => promoteCandidateToHandled(game.id)}
                  className="w-full py-2 px-2 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>取扱ゲームへ昇格</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Notice */}
      <div className="rounded-xl bg-[#0c0d10] border border-stone-800 p-6 text-xs text-stone-400 text-center max-w-3xl mx-auto space-y-2">
        <h4 className="text-sm font-semibold text-stone-200">候補タイトルについて</h4>
        <p className="leading-relaxed">
          正式取扱開始前の商品について、個別調達・取り寄せ・予約は承っておりません。販売開始後、商品ページに掲載された在庫のみご購入いただけます。
        </p>
      </div>
    </div>
  );
};
