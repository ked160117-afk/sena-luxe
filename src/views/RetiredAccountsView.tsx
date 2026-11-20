/**
 * SENA LUXE - Recommended Retired Accounts View (おすすめ引退アカウント)
 * Displays all published retired accounts across all games.
 */

import React, { useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react';
import { ProductCardImage } from '../components/ProductCardImage';
import { XShareButton } from '../components/XShareButton';

export const RetiredAccountsView: React.FC = () => {
  const { products, games, copyToClipboardAndOpenModal } = useStore();

  const retiredProducts = useMemo(() => {
    // Legacy records may omit or use older values for status/category/recommendation.
    // Show retired/initial account records unless explicitly marked unavailable.
    // Legacy category labels may vary, and recommendations may be flagged separately.
    // Match retired/initial-account category aliases and the recommendation flag,
    // while excluding explicitly unavailable products.
    const unavailableStatuses = new Set(['掲載停止', '売り切れ', '商談中', '非公開']);
    return products
      .filter((p) => {
        const category = typeof p.category === 'string' ? p.category.trim().replace(/\s+/g, '') : '';
        const status = typeof p.status === 'string' ? p.status.trim() : '';
        const isRetiredCategory = category.includes('引退') || category.includes('初期');
        return (isRetiredCategory || p.isRecommended === true) && !unavailableStatuses.has(status);
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime() ||
          (b.order || 0) - (a.order || 0)
      );
  }, [products]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 animate-fade-in">
      {/* Header */}
      <section className="text-center border-b border-[#d4af37]/20 pb-8">
        <span className="text-[11px] font-cinzel tracking-[0.2em] text-[#d4af37] uppercase">
          FEATURED RETIRED ACCOUNTS
        </span>
        <h1 className="text-2xl sm:text-4xl font-bold text-white mt-2">
          おすすめ引退アカウント
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-3 leading-relaxed">
          ゲームタイトルを問わず、掲載中の引退アカウントをまとめてご覧いただけます。<br />
          商品内容・在庫・価格はご購入前に公式LINEでご確認ください。
        </p>
      </section>

      {/* Empty or Grid */}
      {retiredProducts.length === 0 ? (
        <section className="rounded-xl bg-[#111216] border border-stone-800 p-9 sm:p-12 text-center space-y-3">
          <ShieldCheck className="w-9 h-9 text-[#d4af37] mx-auto" />
          <h2 className="text-lg font-semibold text-white">現在掲載中の引退垢はありません</h2>
          <p className="text-xs text-stone-400">
            商品が登録・公開されると、この一覧に自動で表示されます。
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {retiredProducts.map((item) => {
            const game = games.find((g) => g.id === item.gameId);
            const inquiryText = [
              `ゲーム名：${item.gameName}`,
              `商品名：${item.title}`,
              `商品番号：${item.productNumber}`,
              `価格：${item.price == null ? '価格確認中' : `¥${item.price.toLocaleString()}`}`,
              item.summary ? `商品内容：${item.summary}` : '',
            ]
              .filter(Boolean)
              .join('\n');

            return (
              <article
                key={item.id}
                className="rounded-xl overflow-hidden bg-[#111216] border border-stone-800 hover:border-[#d4af37]/50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="p-4 pb-0">
                    <ProductCardImage
                      category={item.category}
                      gameName={item.gameName}
                      gameCode={item.gameCode}
                      imageUrl={item.imageUrl}
                      additionalImages={item.additionalImages}
                      imageUrls={item.imageUrls}
                      videoUrl={item.videoUrl}
                      videoStorageId={item.videoStorageId}
                      gameIconUrl={game?.iconUrl}
                      title={item.title}
                      className="w-full h-48"
                    />
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="min-w-0">
                      <p className="text-[10px] text-stone-400 truncate mb-1">{item.gameName}</p>
                      <div className="flex items-center gap-2 min-w-0">
                        {game?.iconUrl ? (
                          <img
                            src={game.iconUrl}
                            alt={item.gameName}
                            loading="lazy"
                            decoding="async"
                            className="w-8 h-8 rounded-lg object-cover border border-stone-700 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-black border border-[#d4af37]/40 flex items-center justify-center text-[10px] text-[#d4af37] shrink-0">
                            SL
                          </div>
                        )}
                        <h2 className="text-sm font-semibold text-white leading-snug break-words">
                          {item.title}
                        </h2>
                      </div>
                    </div>

                    {item.summary && (
                      <p className="text-xs text-stone-400 leading-relaxed line-clamp-3">
                        {item.summary}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-3 border-t border-stone-800 pt-3">
                      <span className="text-[10px] text-stone-500">{item.productNumber}</span>
                      <span className="text-sm font-bold text-[#f7e7ce] tabular-nums">
                        {item.price == null ? '価格確認中' : `¥${item.price.toLocaleString()}`}
                      </span>
                    </div>

                    {item.deviceCompatibility && (
                      <p className="text-[10px] text-stone-300">{item.deviceCompatibility}</p>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboardAndOpenModal(
                        inquiryText,
                        item.gameName,
                        item.productNumber,
                        item.title
                      )
                    }
                    className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    公式LINEで在庫・詳細を確認
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <XShareButton
                    productId={item.id}
                    gameName={item.gameName}
                    gameShortName={game?.shortName}
                    gameCode={item.gameCode}
                    productTitle={item.title}
                    category={item.category}
                  />
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};
