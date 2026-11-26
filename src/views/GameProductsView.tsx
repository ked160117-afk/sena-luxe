/**
 * SENA LUXE - Product Catalog View (商品一覧)
 * Categorized products with automated product numbers (SL-CODE-001) + embedded stone rate plans
 * Preserves 5-image multi-image gallery & video playback + adds deviceCompatibility & XShareButton.
 */

import React, { useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCategory, ProductItem, StoneRatePlan } from '../types';
import { MessageCircle, ShieldAlert, Clock, HelpCircle } from 'lucide-react';
import { ProductCardImage } from '../components/ProductCardImage';
import { XShareButton } from '../components/XShareButton';

const CATEGORIES: (ProductCategory | 'ALL')[] = ['ALL', '石垢', '引退垢', '初期垢', '進行垢'];
const ALLOWED_PUBLIC_CATEGORIES: ProductCategory[] = ['石垢', '引退垢', '初期垢', '進行垢', 'ゲーム内通貨・石垢'];
const NON_STONE_GAME_IDS = [
  'game-kitaou',
  'game-czn',
  'game-baki-tsp',
  'game-crows-unlimited',
  'game-racing-master',
  'game-twinklestar',
  'game-hxh-nen-survivor',
];
const PROXY_PRODUCT_PATTERN = /(代行|作業サービス|作業代行|プレイ代行|育成代行|通貨追加)/i;
const PROXY_RATE_PATTERN = /(代行|作業|追加オプション|追加料金|追加費用|プレイ代行|育成代行|ガチャ代行|通貨追加)/i;

const isAllowedPublicProduct = (p: ProductItem): boolean => {
  const searchable = `${p.category} ${p.title} ${p.summary} ${(p.keyHighlights || []).join(' ')}`;
  return ALLOWED_PUBLIC_CATEGORIES.includes(p.category) && !PROXY_PRODUCT_PATTERN.test(searchable);
};

const isAllowedStoneRate = (r: StoneRatePlan): boolean => {
  const searchable = [
    r.id,
    r.gameName,
    r.planName,
    r.currencyName,
    r.currencyAmount,
    r.conditions,
    r.deviceRequirement,
    r.accountType,
    r.notes,
  ]
    .filter(Boolean)
    .join(' ');
  return !PROXY_RATE_PATTERN.test(searchable);
};

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
    copyToClipboardAndOpenModal,
  } = useStore();

  const selectedGame = games.find((g) => g.id === selectedGameId);

  const filteredStonePlans = useMemo(() => {
    return stoneRates.filter(
      (r) => isAllowedStoneRate(r) && (!selectedGameId || r.gameId === selectedGameId)
    );
  }, [stoneRates, selectedGameId]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.status === '掲載中' && p.verifiedForPublic === true && isAllowedPublicProduct(p))
      .filter((p) => {
        const matchesGame = !selectedGameId || p.gameId === selectedGameId;
        const matchesCat =
          selectedCategory === 'ALL'
            ? true
            : selectedCategory === '石垢'
            ? p.category === '石垢' || p.category === 'ゲーム内通貨・石垢'
            : p.category === selectedCategory;
        return matchesGame && matchesCat;
      });
  }, [products, selectedGameId, selectedCategory]);

  const isNonStoneSelected =
    selectedCategory === '石垢' &&
    filteredStonePlans.length === 0 &&
    NON_STONE_GAME_IDS.includes(selectedGame?.id || '');

  const showEmbeddedRates = selectedCategory === '石垢' && filteredStonePlans.length > 0;

  // Static inquiry listings for Phantom Parade, categorized for the game-specific product catalog.
  const phantomInquiryItems = [
    { category: '初期垢', title: '初期アカウント｜廻珠15万・夏虎杖3凸・領域五条', price: 4900, summary: '廻珠約151,000個。夏虎杖3凸、領域五条を所持した初期アカウントです。' },
    { category: '初期垢', title: '初期アカウント｜廻珠7.7万・限定夏虎杖3凸・五条ほか', price: 4800, summary: '廻珠約77,000個。限定夏虎杖3凸をはじめ、五条・東堂・真人・開宿儺などを所持しています。' },
    { category: '進行垢', title: '進行アカウント｜廻珠2万・虎杖＆伏黒3凸・乙骨ほか', price: 5100, summary: '廻珠約21,000個以上。虎杖＆伏黒3凸、影宿儺、乙骨などを所持。ストーリー進行済みです。' },
    { category: '進行垢', title: '進行アカウント｜廻珠1.6万・2周年コンプ・五条2凸', price: 4400, summary: '廻珠約16,000個。2周年キャラクターコンプリート、虎杖＆伏黒3凸、五条2凸などを所持しています。' },
    { category: '初期垢', title: '初期アカウント｜廻珠8.4万・虎杖＆伏黒', price: 4000, summary: '廻珠約84,000個。虎杖＆伏黒を所持した初期アカウントです。' },
    { category: '進行垢', title: '進行アカウント｜2周年コンプ・夏五条3凸・フーガ宿儺・乙骨', price: 13900, summary: '2周年キャラクターコンプリート。夏五条3凸、フーガ宿儺、乙骨、虎杖＆伏黒などを所持。ストーリー進行中です。' },
    { category: '初期垢', title: '初期アカウント｜廻珠7.6万・2周年コンプ・幻虎杖2凸', price: 5790, summary: '廻珠約76,000個。2周年キャラクターコンプリート、五条2凸、幻虎杖2凸などを所持しています。' },
  ];
  const filteredPhantomInquiryItems = selectedGameId === 'game-fp'
    ? phantomInquiryItems.filter((item) => selectedCategory === 'ALL' || item.category === selectedCategory)
    : [];

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
              {selectedGame ? `${selectedGame.name} 商品一覧` : '商品一覧'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-2">
            掲載中の商品をカテゴリー別に表示しています。商品内容・在庫・価格は購入前にご確認ください。
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
              const count = products.filter(
                (p) =>
                  p.gameId === g.id &&
                  p.status === '掲載中' &&
                  p.verifiedForPublic === true &&
                  isAllowedPublicProduct(p)
              ).length;
              return (
                <option key={g.id} value={g.id}>
                  {g.name} ({count > 0 ? `${count}件` : '準備中'})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive =
            selectedCategory === cat ||
            (cat === '石垢' && selectedCategory === 'ゲーム内通貨・石垢');
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

      {/* Security Notice Banner */}
      <div className="rounded-lg bg-[#0e0f12] border border-stone-800/80 p-4 text-xs text-stone-400 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="text-stone-300 font-medium">実態確認・セキュリティ保護方針：</span>
          掲載情報は購入前にご確認ください。通貨数量・在庫・引き継ぎ条件は、公式LINEで最新の内容をご確認ください。
        </div>
      </div>

      {/* Content */}
      {filteredProducts.length === 0 && !showEmbeddedRates && filteredPhantomInquiryItems.length === 0 ? (
        <div className="rounded-xl bg-[#111216] border border-stone-800 p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-semibold text-white">
              {isNonStoneSelected ? '現在石垢の取り扱いはしておりません。' : '現在商品を準備中です'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 max-w-xl mx-auto leading-relaxed">
              {isNonStoneSelected
                ? 'ご用意できましたら対応します。'
                : selectedGame
                ? `「${selectedGame.name}」の商品は現在準備中です。`
                : '商品は現在準備中です。'}
              <br className="hidden sm:inline" />
              掲載中の商品がない場合も、一覧にない商品や新しいゲームタイトルについて公式LINEからご相談いただけます。ご希望を伺い、取扱い・在庫を確認してご案内します。ゲームのプレイ代行・育成代行・通貨追加などの代行サービスは行っておりません。
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() =>
                copyToClipboardAndOpenModal(
                  '【SENA LUXE 商品リクエスト】\nゲームタイトル：\n希望する石垢・商品内容：\nご予算：\nその他ご希望：',
                  selectedGame?.name || '未掲載タイトル',
                  '商品リクエスト',
                  '一覧外商品・新タイトルの相談'
                )
              }
              className="px-5 py-2.5 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center gap-2"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>商品を探してもらう（LINE相談）</span>
            </button>
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
        <div className="space-y-8">
          {/* Embedded Stone Rates Section */}
          {showEmbeddedRates && (
            <section className="rounded-xl bg-[#111216] border border-[#d4af37]/30 overflow-hidden">
              <div className="px-4 sm:px-5 py-4 bg-gradient-to-r from-[#201a0d] to-[#111216] border-b border-[#d4af37]/25 flex items-center gap-3">
                {selectedGame?.currencyIconUrl || selectedGame?.iconUrl ? (
                  <img
                    src={selectedGame.currencyIconUrl || selectedGame.iconUrl}
                    alt={`${selectedGame.name} ${selectedGame.currencyIconUrl ? 'ガチャ石アイコン' : 'アプリアイコン'}`}
                    className="w-9 h-9 rounded-lg object-contain bg-black/40 border border-[#d4af37]/30 p-1"
                    onError={(e) => {
                      if (selectedGame.iconUrl && e.currentTarget.src !== selectedGame.iconUrl) {
                        e.currentTarget.src = selectedGame.iconUrl;
                      } else {
                        e.currentTarget.style.visibility = 'hidden';
                      }
                    }}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-black/40 border border-[#d4af37]/30 flex items-center justify-center">
                    <span className="text-[#d4af37]">◆</span>
                  </div>
                )}
                <div>
                  <h2 className="text-base font-bold text-[#f7e7ce]">石垢 料金表</h2>
                  <p className="text-[11px] text-stone-400">掲載プラン・価格・お問い合わせ</p>
                </div>
              </div>

              <div className="divide-y divide-stone-800">
                {filteredStonePlans.map((plan) => {
                  const isVerifiedPrice =
                    plan.verifiedForPublic === true &&
                    !plan.isPreparation &&
                    plan.status === '取扱中' &&
                    typeof plan.currentPrice === 'number' &&
                    plan.currentPrice > 0;
                  const priceLabel = isVerifiedPrice
                    ? `¥${plan.currentPrice!.toLocaleString()}`
                    : plan.priceDisplay?.trim()
                    ? `参考価格：${plan.priceDisplay}（要LINE確認）`
                    : '価格確認中';

                  return (
                    <div
                      key={plan.id}
                      className="px-4 sm:px-5 py-4 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] gap-3 sm:gap-5 sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">
                          {plan.currencyAmount?.trim() || '石の数を確認中'}
                        </div>
                        <div className="text-xs text-stone-400 mt-1">{plan.planName}</div>
                      </div>
                      <div className="sm:text-right">
                        <div className="text-[10px] text-stone-500">販売価格</div>
                        <div className="text-lg font-bold font-mono text-[#f7e7ce]">{priceLabel}</div>
                        <div className="text-[10px] text-stone-500">在庫はLINEにてご確認ください</div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboardAndOpenModal(
                            [
                              `ゲーム名：${plan.gameName}`,
                              `石の数：${plan.currencyAmount || '確認中'}`,
                              `値段：${priceLabel}`,
                            ].join('\n'),
                            plan.gameName,
                            '石垢料金表',
                            plan.planName
                          )
                        }
                        className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        問い合わせる
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="px-4 sm:px-5 py-2.5 bg-black/20 text-[11px] text-stone-400">
                掲載価格・石の数量は参考情報を含みます。購入前に公式LINEで内容と在庫をご確認ください。取り扱う石は全て無償石です。
              </div>
            </section>
          )}

          {/* Phantom Parade inquiry listings grouped by account category */}
          {filteredPhantomInquiryItems.length > 0 && (
            <section className="space-y-4">
              <div className="border-b border-[#d4af37]/20 pb-3">
                <h2 className="text-lg font-bold text-[#f7e7ce]">ファンパレ お問い合わせ商品</h2>
                <p className="text-xs text-stone-400 mt-1">商品内容・在庫の詳細は公式LINEでご確認ください。</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPhantomInquiryItems.map((item, index) => {
                  const inquiryText = [
                    'ゲーム名：呪術廻戦 ファントムパレード',
                    `商品カテゴリー：${item.category}`,
                    `商品名：${item.title}`,
                    `価格：¥${item.price.toLocaleString()}`,
                    `商品内容：${item.summary}`,
                  ].join('\n');
                  return (
                    <article key={`phantom-inquiry-${index}`} className="rounded-xl bg-[#111216] border border-stone-800 hover:border-[#d4af37]/50 transition-colors p-4 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <span className="inline-block text-[10px] text-[#d4af37] border border-[#d4af37]/30 rounded px-2 py-1">{item.category}</span>
                        <h3 className="text-sm font-semibold text-white leading-snug">{item.title}</h3>
                        <p className="text-xs text-stone-400 leading-relaxed">{item.summary}</p>
                        <div className="border-t border-stone-800 pt-3 text-right text-lg font-bold text-[#f7e7ce]">¥{item.price.toLocaleString()}</div>
                      </div>
                      <button type="button" onClick={() => copyToClipboardAndOpenModal(inquiryText, '呪術廻戦 ファントムパレード', item.category, item.title)} className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-2">
                        <MessageCircle className="w-4 h-4" /> 公式LINEで商品を問い合わせる
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Product Grid */}
          {filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((item) => {
                const game = games.find((g) => g.id === item.gameId);
                const verifiedRate = stoneRates.find(
                  (r) => r.gameId === item.gameId && r.verifiedForPublic === true
                );

                return (
                  <div
                    key={item.id}
                    className="group rounded-xl bg-[#111216] border border-stone-800 hover:border-[#d4af37]/50 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.1)]"
                  >
                    <div>
                      {/* Product Number & Category */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-xs sm:text-sm font-bold text-[#f7e7ce] px-2 py-0.5 rounded bg-black/60 border border-[#d4af37]/30 tracking-wider">
                          {item.productNumber}
                        </span>
                        <span className="text-[11px] text-stone-400">{item.category}</span>
                      </div>

                      {/* Image / 5-image Carousel / Video */}
                      <div className="mb-3.5">
                        <ProductCardImage
                          category={item.category}
                          gameName={item.gameName}
                          gameCode={item.gameCode}
                          currencyName={verifiedRate?.currencyName || game?.currencyName}
                          imageUrl={item.imageUrl}
                          additionalImages={item.additionalImages}
                          imageUrls={item.imageUrls}
                          videoUrl={item.videoUrl}
                          videoStorageId={item.videoStorageId}
                          currencyIconUrl={
                            verifiedRate ? item.currencyIconUrl || game?.currencyIconUrl : undefined
                          }
                          gameIconUrl={game?.iconUrl}
                          title={item.title}
                        />
                      </div>

                      {/* Game Name & OS Badge */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="text-[11px] text-[#d4af37] font-medium">{item.gameName}</div>
                        {item.deviceCompatibility && (
                          <span className="text-[10px] text-stone-300 border border-stone-700 rounded px-2 py-0.5 whitespace-nowrap">
                            {item.deviceCompatibility}
                          </span>
                        )}
                      </div>

                      {/* Game Icon + Title */}
                      <div className="flex items-center gap-2 mt-1.5">
                        {game?.iconUrl && (
                          <img
                            src={game.iconUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-7 h-7 rounded-md object-cover border border-stone-700 shrink-0"
                          />
                        )}
                        <h3 className="text-sm sm:text-base font-semibold text-stone-100 group-hover:text-gold-subtle transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                      </div>

                      <p className="text-xs text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>

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

                    {/* Price, LINE Modal Inquiry, X Share */}
                    <div className="mt-5 pt-3.5 border-t border-stone-800">
                      <div className="flex items-baseline justify-between mb-3">
                        <span className="text-xs text-stone-400">販売価格</span>
                        <div className="text-right">
                          <span className="font-mono text-lg font-bold text-[#f7e7ce] tabular-nums">
                            {item.price != null ? `¥${item.price.toLocaleString()}` : '価格確認中'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const inquiryText = [
                            `ゲーム名：${item.gameName}`,
                            `指定キャラ名：${item.title}`,
                            `石の数：${item.summary}`,
                            `値段：${item.price == null ? '価格確認中' : `¥${item.price.toLocaleString()}`}`,
                          ].join('\n');
                          copyToClipboardAndOpenModal(
                            inquiryText,
                            item.gameName,
                            item.productNumber,
                            item.title
                          );
                        }}
                        className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <MessageCircle className="w-4 h-4 fill-black stroke-none" />
                        <span>在庫は公式LINEにてお問い合わせください</span>
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
