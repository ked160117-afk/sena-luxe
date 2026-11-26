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
  const { products, productsLoading, games, copyToClipboardAndOpenModal } = useStore();

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



  // Inquiry-only items from GameTrade listings (no image assets; prices adjusted as requested).
  const inquiryOnlyItems = [
  {
    "game": "呪術廻戦 ファントムパレード",
    "title": "初期アカウント｜廻珠15万・夏虎杖3凸・領域五条",
    "price": 4400,
    "summary": "初期アカウント。廻珠約151,000個。夏虎杖3凸、領域五条など。"
  },
  {
    "game": "呪術廻戦 ファントムパレード",
    "title": "初期アカウント｜廻珠7.7万・限定夏虎杖3凸・五条ほか",
    "price": 4300,
    "summary": "初期アカウント。廻珠約77,000個。限定夏虎杖3凸、五条、東堂、真人、開宿儺など。"
  },
  {
    "game": "呪術廻戦 ファントムパレード",
    "title": "引退アカウント｜廻珠2万・虎杖＆伏黒3凸・乙骨ほか",
    "price": 4600,
    "summary": "引退アカウント。廻珠約21,000個以上。虎杖＆伏黒3凸、影宿儺、乙骨など。ストーリー進行あり。"
  },
  {
    "game": "呪術廻戦 ファントムパレード",
    "title": "初期アカウント｜廻珠1.6万・2周年コンプ・五条2凸",
    "price": 3900,
    "summary": "初期アカウント。廻珠約16,000個。2周年コンプ、虎杖＆伏黒3凸、五条2凸など。"
  },
  {
    "game": "呪術廻戦 ファントムパレード",
    "title": "初期アカウント｜廻珠8.4万・虎杖＆伏黒",
    "price": 3500,
    "summary": "初期アカウント。廻珠約84,000個。虎杖＆伏黒所持。"
  },
  {
    "game": "呪術廻戦 ファントムパレード",
    "title": "2周年コンプアカウント｜夏五条3凸・フーガ宿儺・乙骨",
    "price": 13400,
    "summary": "2周年コンプ。虎杖＆伏黒、夏五条3凸、フーガ、宿儺、乙骨など。ストーリー進行中。"
  },
  {
    "game": "呪術廻戦 ファントムパレード",
    "title": "初期アカウント｜廻珠7.6万・2周年コンプ・幻虎杖2凸",
    "price": 5290,
    "summary": "初期アカウント。廻珠約76,000個。2周年コンプ、五条2凸、幻虎杖2凸など。"
  },
  {
    "game": "eFootball",
    "title": "引退アカウント｜EPIC・BIG TIME多数・日本代表選手豊富",
    "price": 12500,
    "summary": "チームパワー3283。EPIC・BIG TIME選手多数、日本代表・国代表選手豊富。メールアドレス変更可能。Google Play Games未連携。"
  },
  {
    "game": "勝利の女神：NIKKE",
    "title": "初期アカウント｜ジュエル約6.7万・マリアン クイーン3凸",
    "price": 6500,
    "summary": "ジュエル約60,000〜70,000個。マリアン クイーン3凸、紅蓮、神殺、水着シンデレラなど。ストーリー3-11。メールアドレス譲渡可能。"
  }
];

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
      {productsLoading ? (
        <section className="rounded-xl bg-[#111216] border border-stone-800 p-9 sm:p-12 text-center space-y-3">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-[#d4af37]/30 border-t-[#d4af37] animate-spin" role="status" aria-label="商品を読み込み中" />
          <p className="text-sm text-stone-400">商品情報を読み込み中です…</p>
        </section>
      ) : retiredProducts.length === 0 ? (
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

      {/* GameTrade inquiry-only listings */}
      <section className="space-y-4">
        <div className="border-b border-[#d4af37]/20 pb-4">
          <h2 className="text-xl font-bold text-[#f7e7ce]">個別お問い合わせ商品</h2>
          <p className="text-xs text-stone-400 mt-2">掲載内容をご確認のうえ、商品ごとに公式LINEからお問い合わせください。画像は掲載せず、内容・価格を表示しています。</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {inquiryOnlyItems.map((item, index) => {
            const inquiryText = [
              `ゲーム名：${item.game}`,
              `商品名：${item.title}`,
              `価格：¥${item.price.toLocaleString()}`,
              `商品内容：${item.summary}`,
            ].join('\\n');
            return (
              <article key={`inquiry-${index}`} className="rounded-xl bg-[#111216] border border-stone-800 hover:border-[#d4af37]/50 transition-colors p-4 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] text-stone-400">{item.game}</p>
                  <h3 className="text-sm font-semibold text-white leading-snug">{item.title}</h3>
                  <p className="text-xs text-stone-400 leading-relaxed">{item.summary}</p>
                  <div className="border-t border-stone-800 pt-3 text-right text-lg font-bold text-[#f7e7ce]">¥{item.price.toLocaleString()}</div>
                </div>
                <button type="button" onClick={() => copyToClipboardAndOpenModal(inquiryText, item.game, 'GameTrade掲載商品', item.title)} className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" /> 公式LINEで商品を問い合わせる <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </article>
            );
          })}
        </div>
      </section>

    </div>
  );
};
