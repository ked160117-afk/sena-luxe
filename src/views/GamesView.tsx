/**
 * SENA LUXE - Game Catalog View (ゲーム一覧)
 * Full list of 8 handled titles with large app icons, details, and shortcuts
 */

import React from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowRight, Gem, ShoppingBag, MessageCircle, Sparkles } from 'lucide-react';
import { GameCardIcon } from '../components/GameCardIcon';

export const GamesView: React.FC = () => {
  const { games, candidateGames, stoneRates, navigateToGameProducts, navigateToStoneRates, setCurrentView } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-[#d4af37]/20 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-cinzel tracking-widest text-[#d4af37] uppercase">HANDLED TITLES</span>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mt-1">取扱ゲーム一覧</h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-2 max-w-2xl">
            石垢アカウントの掲載対象タイトル一覧です。各タイトルの掲載内容・在庫・価格は購入前にご確認ください。
          </p>
        </div>

        <button
          onClick={() => setCurrentView('candidates')}
          className="text-xs text-[#d4af37] hover:underline flex items-center gap-1.5 self-start md:self-end"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>人気ゲーム追加候補（{candidateGames.length}タイトル）を見る</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Handled Games 8 Titles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {games.map((game) => {
          const currencyVerified = stoneRates.some((plan) => plan.gameId === game.id && plan.verifiedForPublic === true);
          return (
          <div
            key={game.id}
            className="group rounded-xl bg-[#111216] border border-stone-800 hover:border-[#d4af37]/60 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.12)]"
          >
            <div>
              {/* Large App Icon or Black x Gold Luxury Crest */}
              <GameCardIcon game={game} />

              {/* Game Title & Currency Info */}
              <h3 className="text-base font-semibold text-stone-100 group-hover:text-gold-subtle transition-colors">
                {game.name}
              </h3>
              <div className="text-[11px] text-[#d4af37]/90 font-medium mt-1">
                {currencyVerified ? `取扱通貨: ${game.currencyName} (${game.currencyUnit})` : 'ゲーム内通貨情報確認中'}
              </div>
              <p className="text-xs text-stone-400 mt-2 line-clamp-3 leading-relaxed">
                {game.description}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 mt-4 border-t border-stone-800/80 space-y-2">
              <button
                onClick={() => navigateToGameProducts(game.id)}
                className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>石垢商品一覧を見る</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigateToStoneRates(game.id)}
                  className="py-2 px-2 rounded-lg text-[11px] font-medium text-stone-300 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-[#d4af37]/40 transition-colors flex items-center justify-center gap-1"
                >
                  <Gem className="w-3 h-3 text-[#d4af37]" />
                  <span>石垢料金表</span>
                </button>
                <a
                  href="https://lin.ee/6uy8hu9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-2 rounded-lg text-[11px] font-medium text-white bg-[#06C755]/20 hover:bg-[#06C755]/30 border border-[#06C755]/40 transition-colors flex items-center justify-center gap-1"
                >
                  <MessageCircle className="w-3 h-3 text-[#06C755]" />
                  <span>LINE問い合わせ</span>
                </a>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Candidate Teaser Strip */}
      <div className="rounded-xl bg-gradient-to-r from-[#111216] via-[#14151a] to-[#111216] border border-stone-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[10px] tracking-widest text-[#d4af37] font-cinzel uppercase">UPCOMING TITLES</span>
          <h3 className="text-lg font-semibold text-white mt-0.5">追加取扱候補（ドッカンバトル、ポケポケ、原神等）</h3>
          <p className="text-xs text-stone-400 mt-1">
            現在{candidateGames.length}タイトルを候補として選定中。ご要望の多いタイトルから順次正式取扱へと移行いたします。
          </p>
        </div>
        <button
          onClick={() => setCurrentView('candidates')}
          className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-stone-800 hover:bg-stone-700 border border-[#d4af37]/40 transition-all whitespace-nowrap"
        >
          候補一覧を見る
        </button>
      </div>
    </div>
  );
};
