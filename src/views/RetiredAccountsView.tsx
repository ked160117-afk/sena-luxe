/**
 * SENA LUXE - Retired Account Collection
 * Dedicated mixed-title list for verified, publicly published 引退垢 only.
 * Existing per-game product pages are intentionally left unchanged.
 */
import React, { useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCardImage } from '../components/ProductCardImage';
import { ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react';

export const RetiredAccountsView: React.FC = () => {
  const { products, games, copyToClipboardAndOpenModal } = useStore();

  const retiredProducts = useMemo(() => products
    .filter((product) =>
      product.category === '引退垢' &&
      product.status === '掲載中' &&
      product.verifiedForPublic === true
    )
    .sort((a, b) => {
      const dateDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return dateDiff || (b.order || 0) - (a.order || 0);
    }), [products]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 animate-fade-in">
      <section className="text-center border-b border-[#d4af37]/20 pb-8">
        <span className="text-[11px] font-cinzel tracking-[0.2em] text-[#d4af37] uppercase">RETIRED ACCOUNT COLLECTION</span>
        <h1 className="text-2xl sm:text-4xl font-bold text-white mt-2">おすすめ‼️引退垢一覧‼️</h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-3 leading-relaxed">
          ゲームタイトルを横断して、掲載中の引退垢だけをまとめています。
          <br />商品内容・在庫・価格はご購入前に公式LINEでご確認ください。
        </p>
      </section>

      {retiredProducts.length === 0 ? (
        <section className="rounded-xl bg-[#111216] border border-stone-800 p-9 sm:p-12 text-center space-y-3">
          <ShieldCheck className="w-9 h-9 text-[#d4af37] mx-auto" />
          <h2 className="text-lg font-semibold text-white">現在掲載中の引退垢はありません</h2>
          <p className="text-xs text-stone-400">商品が登録・公開されると、この一覧に自動で表示されます。</p>
        </section>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {retiredProducts.map((item) => {
            const game = games.find((entry) => entry.id === item.gameId);
            const inquiryText = [
              `ゲーム名：${item.gameName}`,
              `商品名：${item.title}`,
              `商品番号：${item.productNumber}`,
              `価格：${item.price != null ? `¥${item.price.toLocaleString()}` : '価格確認中'}`,
              item.summary ? `商品内容：${item.summary}` : '',
            ].filter(Boolean).join('\n');

            return (
              <article key={item.id} className="rounded-xl overflow-hidden bg-[#111216] border border-stone-800 hover:border-[#d4af37]/50 transition-colors">
                <ProductCardImage
                  category={item.category}
                  gameName={item.gameName}
                  gameCode={item.gameCode}
                  imageUrl={item.imageUrl}
                  videoUrl={item.videoUrl}
                  title={item.title}
                  className="w-full h-48"
                />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {game?.iconUrl ? (
                      <img src={game.iconUrl} alt="" loading="lazy" decoding="async" className="w-8 h-8 rounded-lg object-cover border border-stone-700 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-black border border-[#d4af37]/40 flex items-center justify-center text-[10px] text-[#d4af37] shrink-0">SL</div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] text-stone-400 truncate">{item.gameName}</p>
                      <h2 className="text-sm font-semibold text-white leading-snug break-words">{item.title}</h2>
                    </div>
                  </div>
                  {item.summary && <p className="text-xs text-stone-400 leading-relaxed line-clamp-3">{item.summary}</p>}
                  <div className="flex items-center justify-between gap-3 border-t border-stone-800 pt-3">
                    <span className="text-[10px] text-stone-500">{item.productNumber}</span>
                    <span className="text-sm font-bold text-[#f7e7ce] tabular-nums">
                      {item.price != null ? `¥${item.price.toLocaleString()}` : '価格確認中'}
                    </span>
                  </div>
                  {item.deviceCompatibility && (
                    <p className="text-[10px] text-stone-300">{item.deviceCompatibility}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => copyToClipboardAndOpenModal(inquiryText, item.gameName, item.productNumber, item.title)}
                    className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    公式LINEで在庫・詳細を確認 <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};
