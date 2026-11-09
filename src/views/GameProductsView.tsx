/**
 * SENA LUXE - Normal Product Catalog View (通常商品一覧)
 * Categorized products with automated product numbers (SL-CODE-001)
 * Complies with strict inventory & image rules:
 * - Unconfirmed / Sample products are unpublished.
 * - If no products are ready for a game, displays "現在商品を準備中です".
 * - Uses ProductCardImage with black x gold shared stone placeholder or admin-registered image.
 */

import React, { useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCategory, ProductStatus } from '../types';
import { MessageCircle, ShieldAlert, Clock, ArrowRight, HelpCircle } from 'lucide-react';
import { ProductCardImage } from '../components/ProductCardImage';

const CATEGORIES: (ProductCategory | 'ALL')[] = [
  'ALL',
  'ゲーム内通貨・石垢',
];

export const GameProductsView: React.FC = () => {
  const {
    products,
    games,
    stoneRates,
    selectedGameId,
    setSelectedGameId,
    selectedCategory,
    setSelectedCategory,
    setCurrentView,
  } = useStore();

  const selectedGame = games.find((g) => g.id === selectedGameId);

  // Filter only active, publicly published products (excluding 掲載停止)
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.status === '掲載中' && p.verifiedForPublic === true && p.category === 'ゲーム内通貨・石垢')
      .filter((p) => {
        const matchesGame = selectedGameId ? p.gameId === selectedGameId : true;
        const matchesCat = selectedCategory === 'ALL' ? true : p.category === selectedCategory;
        return matchesGame && matchesCat;
      });
  }, [products, selectedGameId, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-[#d4af37]/20 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-cinzel tracking-widest text-[#d4af37] uppercase">PRODUCT COLLECTION</span>
          <div className="flex items-center gap-3 mt-1">
            {selectedGame?.iconUrl ? (
              <img
                src={selectedGame.iconUrl}
                alt={selectedGame.name}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg object-cover border border-[#d4af37]/40 shadow-sm shrink-0"
              />
            ) : null}
            <h1 className="text-2xl sm:text-4xl font-bold text-white">
              {selectedGame ? `${selectedGame.name} 石垢一覧` : '石垢アカウント一覧'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-2">
            掲載中の石垢アカウントを表示しています。商品内容・在庫・価格は購入前にご確認ください。
          </p>
        </div>

        {/* Game Filter Selector */}
        <div className="flex items-center gap-2 self-start md:self-end">
          <label htmlFor="game-select" className="text-xs text-stone-400 font-medium whitespace-nowrap">
            ゲーム切替:
          </label>
          <select
            id="game-select"
            value={selectedGameId || 'ALL'}
            onChange={(e) => setSelectedGameId(e.target.value === 'ALL' ? null : e.target.value)}
            className="text-xs bg-[#121316] text-[#f7e7ce] border border-stone-800 rounded-lg px-3 py-2 focus:outline-none focus:border-[#d4af37]"
          >
            <option value="ALL">すべてのゲーム</option>
            {games.map((g) => {
              const count = products.filter((p) => p.gameId === g.id && p.status === '掲載中' && p.verifiedForPublic === true && p.category === 'ゲーム内通貨・石垢').length;
              return (
                <option key={g.id} value={g.id}>
                  {g.name} ({count > 0 ? `${count}件` : '準備中'})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Category Tabs (Segmented Control) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#d4af37] text-black font-semibold shadow-sm'
                  : 'bg-[#121316] text-stone-300 hover:text-white border border-stone-800'
              }`}
            >
              {cat === 'ALL' ? '全カテゴリー' : cat}
            </button>
          );
        })}
      </div>

      {/* Security & Verification Notice Banner */}
      <div className="rounded-lg bg-[#0e0f12] border border-stone-800/80 p-4 text-xs text-stone-400 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="text-stone-300 font-medium">実態確認・セキュリティ保護方針：</span>
          掲載情報は購入前にご確認ください。通貨数量・在庫・引き継ぎ条件は、公式LINEで最新の内容をご確認ください。
        </div>
      </div>

      {/* Product Grid or Preparation State */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-xl bg-[#111216] border border-stone-800 p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-semibold text-white">現在商品を準備中です</h3>
            <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto leading-relaxed">
              {selectedGame ? `「${selectedGame.name}」の石垢アカウントは現在準備中です。` : '石垢アカウントは現在準備中です。'}
              <br className="hidden sm:inline" />
              掲載準備が完了した石垢アカウントから掲載します。掲載外商品の個別手配・取り寄せ・予約は承っておりません。
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <div className="px-5 py-2.5 rounded-lg text-xs font-medium text-stone-400 bg-stone-900 border border-stone-800">
              掲載開始はこのページでご案内します
            </div>
            <button
              onClick={() => setCurrentView('faq')}
              className="px-5 py-2.5 rounded-lg text-xs font-medium text-stone-300 bg-stone-800 hover:bg-stone-700 transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>お取引注意事項を確認する</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((item) => {
            const game = games.find((g) => g.id === item.gameId);

            return (
              <div
                key={item.id}
                className="group rounded-xl bg-[#111216] border border-stone-800 hover:border-[#d4af37]/50 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.1)]"
              >
                <div>
                  {/* Top Bar on Card: Product Number & Category */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#f7e7ce] px-2 py-0.5 rounded bg-black/60 border border-[#d4af37]/30 tracking-wider">
                      {item.productNumber}
                    </span>
                    <span className="text-[11px] text-stone-400">{item.category}</span>
                  </div>

                  {/* Compliant Image Container: Never arbitrary gem or fake game renders */}
                  <div className="mb-3.5">
                    <ProductCardImage
                      category={item.category}
                      gameName={item.gameName}
                      gameCode={item.gameCode}
                      currencyName={stoneRates.find((plan) => plan.gameId === item.gameId && plan.verifiedForPublic === true)?.currencyName}
                      imageUrl={item.imageUrl}
                      currencyIconUrl={stoneRates.some((plan) => plan.gameId === item.gameId && plan.verifiedForPublic === true) ? item.currencyIconUrl || game?.currencyIconUrl : undefined}
                      title={item.title}
                    />
                  </div>

                  {/* Game Name */}
                  <div className="text-[11px] text-[#d4af37] font-medium mb-1">
                    {item.gameName}
                  </div>

                  {/* Title & Summary */}
                  <h3 className="text-sm sm:text-base font-semibold text-stone-100 group-hover:text-gold-subtle transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>

                  {/* Highlights */}
                  {item.keyHighlights && item.keyHighlights.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-stone-800/80 space-y-1">
                      {item.keyHighlights.slice(0, 3).map((h, i) => (
                        <div key={i} className="text-[11px] text-stone-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                          <span className="truncate">{h}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer: Price & Inquiry Button */}
                <div className="mt-5 pt-3.5 border-t border-stone-800">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-xs text-stone-400">販売価格</span>
                    <div className="text-right">
                      <span className="font-mono text-lg font-bold text-[#f7e7ce] tabular-nums">¥{item.price?.toLocaleString() ?? '確認中'}</span>
                    </div>
                  </div>

                  <a
                    href="https://lin.ee/6uy8hu9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4 fill-black stroke-none" />
                    <span>{item.category === 'ゲーム内通貨・石垢' ? 'LINEで在庫・購入について問い合わせる' : '商品詳細・お問い合わせ'}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
