/**
 * SENA LUXE - Top Page View
 * Premium Game Collection
 * Structure priority: SENA LUXE logo -> Concept -> Game Title Selector -> Stone Rates / Requests / LINE Links
 */

import React from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowRight, Sparkles, Gem, HelpCircle, MessageCircle, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
import { ProductCardImage } from '../components/ProductCardImage';
import { GameCardIcon } from '../components/GameCardIcon';

export const TopView: React.FC = () => {
  const { games, navigateToGameProducts, navigateToStoneRates, setCurrentView, products } = useStore();

  return (
    <div className="space-y-16 pb-12 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#d4af37]/20 py-16 sm:py-24 bg-gradient-to-b from-[#0e0f14] via-[#0b0c0e] to-[#0b0c0e]">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-radial-luxury pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-xs font-cinzel tracking-widest uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ESTABLISHED 2026 · STONE ACCOUNT COLLECTION</span>
          </div>

          <h1 className="font-cinzel text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4">
            <span className="text-gold-gradient">SENA LUXE</span>
          </h1>

          <p className="font-cinzel text-sm sm:text-base tracking-[0.28em] text-[#d4af37] uppercase font-semibold mb-6">
            PREMIUM GAME COLLECTION
          </p>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-stone-300 leading-relaxed font-sans mb-10">
            ゲーム内通貨を保有した石垢アカウントを掲載・販売する専門店です。<br className="hidden sm:inline" />
            掲載商品の内容・在庫・価格は、ご購入前に公式LINEでご確認ください。
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <button
              onClick={() => {
                const el = document.getElementById('games-selector');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-lg font-semibold text-black bg-[#d4af37] hover:bg-[#e6c158] transition-all duration-200 shadow-[0_4px_20px_rgba(212,175,55,0.25)] flex items-center gap-2"
            >
              <span>ゲームタイトルから探す</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigateToStoneRates()}
              className="px-5 py-3 rounded-lg font-medium text-stone-200 bg-[#141519] border border-stone-700 hover:border-[#d4af37]/60 hover:text-white transition-all flex items-center gap-2"
            >
              <Gem className="w-4 h-4 text-[#d4af37]" />
              <span>石垢料金表を見る</span>
            </button>

            <a
              href="https://lin.ee/6uy8hu9"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-lg font-medium text-white bg-[#06C755] hover:bg-[#05b34c] transition-all flex items-center gap-2 shadow-sm"
            >
              <MessageCircle className="w-4 h-4 fill-white stroke-none" />
              <span>LINE公式で相談</span>
            </a>
          </div>
        </div>
      </section>

      {/* Primary Section: Select by Game Title (ゲームタイトルから探す) */}
      <section id="games-selector" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] font-cinzel tracking-widest text-[#d4af37] uppercase">TITLES ARCHIVE</span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mt-1">ゲームタイトルから探す</h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-2">
            取扱中のゲームタイトル。まず対象のゲームをお選びください。
          </p>
        </div>

        {/* 8 Handled Games Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => navigateToGameProducts(game.id)}
              className="group cursor-pointer rounded-xl bg-[#111216] border border-stone-800 hover:border-[#d4af37]/60 p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.12)] hover:-translate-y-1"
            >
              <div>
                {/* Large App Icon or Black x Gold Luxury Crest */}
                <GameCardIcon game={game} />

                {/* Game Title */}
                <h3 className="text-sm sm:text-base font-semibold text-stone-100 group-hover:text-gold-subtle transition-colors line-clamp-1">
                  {game.name}
                </h3>
                <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                  {game.description}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3.5 mt-3 border-t border-stone-800/80 space-y-1.5">
                {!products.some((p) => p.gameId === game.id && p.status === '掲載中' && p.verifiedForPublic === true && p.category === 'ゲーム内通貨・石垢') && (
                  <div className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>現在商品を準備中です</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#d4af37] font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    商品一覧
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToStoneRates(game.id);
                    }}
                    className="text-[11px] text-stone-400 hover:text-white underline underline-offset-2"
                  >
                    石垢料金表
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Split Shortcut Highlights: Stone Rate Table & Custom Game Request */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stone Rates Banner */}
          <div
            onClick={() => navigateToStoneRates()}
            className="group cursor-pointer rounded-xl bg-gradient-to-br from-[#14151a] to-[#0e0f13] border border-[#d4af37]/30 hover:border-[#d4af37] p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_35px_rgba(212,175,55,0.15)]"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] mb-4 group-hover:scale-105 transition-transform">
                <Gem className="w-6 h-6" />
              </div>
              <span className="text-[10px] tracking-widest text-[#d4af37] font-cinzel uppercase">EXCLUSIVE RATE TABLE</span>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mt-1">石垢専用料金表</h3>
              <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
                掲載中の石垢アカウント情報をご案内します。価格・在庫・通貨数量は購入前に公式LINEでご確認ください。
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#d4af37] group-hover:translate-x-1.5 transition-transform">
              <span>石垢料金表をチェックする</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Game Request Banner */}
          <div
            onClick={() => setCurrentView('faq')}
            className="group cursor-pointer rounded-xl bg-gradient-to-br from-[#14151a] to-[#0e0f13] border border-stone-800 hover:border-[#d4af37]/60 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-stone-800/80 border border-stone-700 flex items-center justify-center text-[#d4af37] mb-4 group-hover:scale-105 transition-transform">
                <HelpCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] tracking-widest text-stone-400 font-cinzel uppercase">STONE ACCOUNT SALES</span>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mt-1">石垢販売について</h3>
              <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
                販売対象は掲載中の石垢アカウントのみです。掲載外商品の個別手配・取り寄せ・予約・代行は承っておりません。
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-stone-300 group-hover:text-[#d4af37] group-hover:translate-x-1.5 transition-transform">
              <span>販売内容・注意事項を確認する</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Selection Preview (Secondary to Game Selector) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] tracking-widest text-[#d4af37] font-cinzel uppercase">PREMIUM SELECTION</span>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mt-0.5">掲載商品コレクション</h2>
          </div>
          <button
            onClick={() => setCurrentView('games')}
            className="text-xs text-[#d4af37] hover:underline flex items-center gap-1"
          >
            すべてのタイトルを見る
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {products.filter((p) => p.status === '掲載中' && p.verifiedForPublic === true && p.category === 'ゲーム内通貨・石垢').length === 0 ? (
          <div className="rounded-xl bg-[#111216] border border-stone-800 p-8 sm:p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-semibold text-white">現在商品を準備中です</h3>
              <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto leading-relaxed">
                掲載準備が完了した石垢アカウントを商品ページに掲載します。<br className="hidden sm:inline" />
                掲載中の商品がない場合は、現在商品を準備中です。掲載外商品の個別手配・取り寄せ・予約は承っておりません。
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://lin.ee/6uy8hu9"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center gap-2"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-black stroke-none" />
                <span>公式LINEで掲載商品について問い合わせる</span>
              </a>
              <button
                onClick={() => setCurrentView('faq')}
                className="px-5 py-2.5 rounded-lg text-xs font-medium text-stone-300 bg-stone-800 hover:bg-stone-700 transition-colors"
              >
                販売内容・注意事項を確認する
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products
              .filter((p) => p.status === '掲載中' && p.verifiedForPublic === true && p.category === 'ゲーム内通貨・石垢')
              .slice(0, 3)
              .map((item) => {
                const game = games.find((g) => g.id === item.gameId);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl bg-[#121316] border border-stone-800 hover:border-[#d4af37]/40 p-5 flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                        <span className="font-mono text-[#d4af37] font-semibold">{item.productNumber}</span>
                        <span className="text-stone-400">{item.category}</span>
                      </div>

                      <div className="mb-3">
                        <ProductCardImage
                          category={item.category}
                          gameName={item.gameName}
                          gameCode={item.gameCode}
                          currencyName={game?.currencyName}
                          imageUrl={item.imageUrl}
                          currencyIconUrl={item.currencyIconUrl}
                          title={item.title}
                        />
                      </div>

                      <h4 className="text-sm font-semibold text-stone-100 line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">{item.summary}</p>
                      <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between">
                        <div className="text-xs text-stone-400">
                          価格・在庫:{' '}
                          <span className="font-medium text-amber-400">LINEで要確認</span>
                        </div>
                        <span className="text-[11px] text-emerald-400 px-2 py-0.5 bg-emerald-950/60 rounded border border-emerald-800/60">
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-800/60">
                      <a
                        href="https://lin.ee/6uy8hu9"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-black stroke-none" />
                        <span>商品詳細・お問い合わせ</span>
                      </a>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Transaction Notice & FAQ Guide Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-gradient-to-r from-[#17140e] via-[#121317] to-[#17140e] border border-[#d4af37]/40 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#d4af37] text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ご購入前のご確認・透明な安全管理</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              お取引に関する注意事項 & よくあるご質問（FAQ）
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              石垢はゲーム内通貨を保有したアカウント本体の販売です。ゲーム運営会社の利用規約・利用制限リスク、掲載商品の内容・価格・在庫、引き継ぎ時の注意事項を案内しています。
            </p>
          </div>
          <button
            onClick={() => setCurrentView('faq')}
            className="shrink-0 px-6 py-3 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-all flex items-center gap-2 shadow-md hover:shadow-[#d4af37]/20 whitespace-nowrap"
          >
            <span>注意事項・FAQを確認する</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Trust & Guarantee Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-[#0f1013] border border-stone-800 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="space-y-1.5">
              <div className="flex items-center justify-center md:justify-start gap-2 text-[#d4af37]">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-semibold text-white text-sm">掲載内容を購入前に確認</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                商品ページの説明・通貨数量・在庫状況を、購入前に公式LINEで確認してください。
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-center md:justify-start gap-2 text-[#d4af37]">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold text-white text-sm">公式LINEでの問い合わせ</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                商品番号と確認したい内容をお知らせください。返信までお時間をいただく場合があります。
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-center md:justify-start gap-2 text-[#d4af37]">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold text-white text-sm">商品番号の管理</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                発行済みの商品番号は再利用しない運用です。
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
