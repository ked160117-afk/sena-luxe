/**
 * SENA LUXE - Stone Account Dedicated Rate Table View (石垢専用料金表)
 * Grouped by game title with verified vs reference price display, LINE inquiry modal, and revision log.
 */

import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { StoneRatePlan } from '../types';
import { Gem, ArrowUpRight, MessageCircle, ShieldCheck, X, History } from 'lucide-react';

const PROXY_RATE_PATTERN = /(代行|作業|追加オプション|追加料金|追加費用|プレイ代行|育成代行|ガチャ代行|通貨追加)/i;

export const StoneRatesView: React.FC = () => {
  const { stoneRates, games, selectedGameId, setSelectedGameId, setCurrentView, copyToClipboardAndOpenModal } =
    useStore();
  const [activeHistoryPlan, setActiveHistoryPlan] = useState<StoneRatePlan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const allowedPlans = stoneRates.filter((plan) => {
    const searchable = [
      plan.id,
      plan.gameName,
      plan.planName,
      plan.currencyName,
      plan.currencyAmount,
      plan.conditions,
      plan.deviceRequirement,
      plan.accountType,
      plan.notes,
    ]
      .filter(Boolean)
      .join(' ');
    return !PROXY_RATE_PATTERN.test(searchable);
  });

  const gameFilteredPlans = allowedPlans.filter((p) => !selectedGameId || p.gameId === selectedGameId);

  const filteredPlans = gameFilteredPlans.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.gameName.toLowerCase().includes(q) ||
      p.planName.toLowerCase().includes(q) ||
      p.currencyName.toLowerCase().includes(q) ||
      p.currencyAmount.toLowerCase().includes(q) ||
      p.conditions.toLowerCase().includes(q) ||
      (p.deviceRequirement && p.deviceRequirement.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.priceDisplay && p.priceDisplay.toLowerCase().includes(q))
    );
  });

  const groupedGames = Array.from(
    new Map<string, string>(
      filteredPlans.map((p) => [p.gameId || p.gameName, p.gameName])
    ).entries()
  );



  // Inquiry-only items from GameTrade listings (no image assets; prices adjusted as requested).
  const inquiryOnlyItems = [
  {
    "game": "呪術廻戦 ファントムパレード",
    "title": "初期アカウント｜廻珠15万・夏虎杖3凸・領域五条",
    "price": 4900,
    "summary": "廻珠約76,000個。2周年キャラクターコンプリート、五条2凸、幻虎杖2凸などを所持しています。"
  },
  {
    "game": "呪術廻戦 ファントムパレード",
    "title": "初期アカウント｜廻珠7.7万・限定夏虎杖3凸・五条ほか",
    "price": 4800,
    "summary": "初期アカウント。廻珠約77,000個。限定夏虎杖3凸、五条、東堂、真人、開宿儺など。"
  },
  {
    "game": "呪術廻戦 ファントムパレード",
    "title": "引退アカウント｜廻珠2万・虎杖＆伏黒3凸・乙骨ほか",
    "price": 5100,
    "summary": "引退アカウント。廻珠約21,000個以上。虎杖＆伏黒3凸、影宿儺、乙骨など。ストーリー進行あり。"
  },
  {
    "game": "呪術廻戦 ファントムパレード",
    "title": "初期アカウント｜廻珠1.6万・2周年コンプ・五条2凸",
    "price": 4400,
    "summary": "初期アカウント。廻珠約16,000個。2周年コンプ、虎杖＆伏黒3凸、五条2凸など。"
  },
  {
    "game": "呪術廻戦 ファントムパレード",
    "title": "初期アカウント｜廻珠8.4万・虎杖＆伏黒",
    "price": 4000,
    "summary": "初期アカウント。廻珠約84,000個。虎杖＆伏黒所持。"
  },
  {
    "game": "呪術廻戦 ファントムパレード",
    "title": "2周年コンプアカウント｜夏五条3凸・フーガ宿儺・乙骨",
    "price": 13900,
    "summary": "2周年コンプ。虎杖＆伏黒、夏五条3凸、フーガ、宿儺、乙骨など。ストーリー進行中。"
  },
  {
    "game": "呪術廻戦 ファントムパレード",
    "title": "初期アカウント｜廻珠7.6万・2周年コンプ・幻虎杖2凸",
    "price": 5790,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-[#d4af37]/20 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gem className="w-4 h-4 text-[#d4af37]" />
            <span className="text-[11px] font-cinzel tracking-widest text-[#d4af37] uppercase">
              EXCLUSIVE STONE RATE TABLE
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white">石垢専用料金表</h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-2 max-w-3xl leading-relaxed">
            通常商品一覧とは分けて、石垢プランの内容を掲載しています。
            確認済みの販売価格を掲載し、取扱条件・価格の確認が必要なプランも参考価格を含めて表示しています。在庫状況・商品内容・お支払いなど、不明点は公式LINEでお問い合わせください。
          </p>
        </div>

        <div className="rounded-lg bg-[#121316] border border-stone-800 p-3 text-xs text-stone-400 self-start md:self-end">
          <div className="text-[10px] text-stone-500 uppercase font-cinzel">LISTED PLANS</div>
          <div className="text-stone-300 font-medium">掲載中のプラン</div>
          <div className="text-[11px] text-stone-500 mt-0.5">{allowedPlans.length}件</div>
        </div>
      </div>

      {/* Stone Account Notice Banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#17140c] via-[#121316] to-[#17140c] border border-[#d4af37]/40 p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#d4af37] shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#d4af37] px-2 py-0.5 rounded bg-[#d4af37]/10 border border-[#d4af37]/30">
                  【重要】石垢の仕様・事前確認事項
                </span>
                <span className="text-[11px] text-stone-400">ご購入前に必ずご確認ください</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-200 font-medium leading-relaxed">
                当店で取り扱う「石垢」は、ゲーム内で無料で入手できる
                <strong className="text-white underline decoration-[#d4af37] underline-offset-2">
                  無償石・無償通貨のみ
                </strong>
                を所持した新規または進行済みアカウント本体をお渡しする商品です。有償石・課金石・有料通貨は一切取り扱いません。
              </p>
              <p className="text-xs text-stone-400 leading-relaxed">
                ※お客様が現在プレイされている既存アカウントへのゲーム内通貨の追加は承っておりません。<br />
                ※ゲーム運営会社の利用規約によるアカウント制限リスク、引き継ぎ時の通信環境の留意点、受取後のパスワード変更義務等がございます。
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('faq')}
            className="self-start sm:self-center shrink-0 px-4 py-2.5 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37]/50 text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm"
          >
            <span>お取引注意事項・FAQを確認</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ゲーム名、キャラ名、条件（例: ルシファー, iOS, 進行済み）で検索..."
            className="w-full bg-[#121316] border border-stone-800 focus:border-[#d4af37] rounded-lg px-3.5 py-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-200 text-xs"
            >
              クリア
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-stone-400 font-medium">対象タイトルを選択：</label>
            <span className="text-[11px] text-stone-500">{filteredPlans.length}件表示中</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedGameId(null)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedGameId === null
                  ? 'bg-[#d4af37] text-black font-semibold'
                  : 'bg-[#121316] text-stone-300 hover:text-white border border-stone-800'
              }`}
            >
              全タイトル ({allowedPlans.length})
            </button>
            {games.map((g) => {
              const count = allowedPlans.filter((r) => r.gameId === g.id).length;
              const isSelected = selectedGameId === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGameId(g.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-[#d4af37] text-black font-semibold'
                      : 'bg-[#121316] text-stone-300 hover:text-white border border-stone-800'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {g.iconUrl && (
                      <img src={g.iconUrl} alt="" className="w-5 h-5 rounded object-cover" loading="lazy" />
                    )}
                    {g.shortName} ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grouped Rate Tables */}
      {filteredPlans.length === 0 ? (
        <div className="rounded-xl bg-[#111216] border border-stone-800 p-12 text-center text-stone-400">
          <p className="text-sm font-semibold text-stone-200">
            {gameFilteredPlans.length === 0
              ? selectedGameId
                ? '現在石垢の取り扱いはしておりません。'
                : '表示する石垢プランがありません。'
              : '検索条件に一致する石垢プランが見つかりませんでした'}
          </p>
          <p className="mt-2 text-xs text-stone-400">
            {gameFilteredPlans.length === 0
              ? selectedGameId
                ? 'ご用意できましたら対応します。'
                : '各ゲームタイトルを選択すると、石垢の取り扱い状況をご確認いただけます。'
              : '検索条件を変更するか、フィルターをリセットしてください。'}
          </p>
          <button
            onClick={() => {
              setSelectedGameId(null);
              setSearchQuery('');
            }}
            className="mt-3 text-xs text-[#d4af37] underline"
          >
            フィルターをリセット
          </button>
        </div>
      ) : (
        <div className="space-y-7">
          {groupedGames.map(([groupKey, groupGameName]) => {
            const plansForGame = filteredPlans.filter((p) => (p.gameId || p.gameName) === groupKey);
            const game = games.find((g) => g.id === groupKey);
            const headerIcon = game?.currencyIconUrl || game?.iconUrl;

            return (
              <section
                key={groupKey}
                className="rounded-xl bg-[#111216] border border-[#d4af37]/30 overflow-hidden"
              >
                <div className="px-4 sm:px-5 py-4 bg-gradient-to-r from-[#201a0d] to-[#111216] border-b border-[#d4af37]/25 flex items-center gap-2">
                  {headerIcon ? (
                    <img
                      src={headerIcon}
                      alt={`${groupGameName} ${game?.currencyIconUrl ? 'ガチャ石アイコン' : 'アプリアイコン'}`}
                      className="w-9 h-9 rounded-lg object-contain bg-black/40 border border-[#d4af37]/30 p-1"
                      loading="lazy"
                      onError={(e) => {
                        if (game?.iconUrl && e.currentTarget.src !== game.iconUrl) {
                          e.currentTarget.src = game.iconUrl;
                        } else {
                          e.currentTarget.style.visibility = 'hidden';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-black/40 border border-[#d4af37]/30 flex items-center justify-center">
                      <Gem className="w-5 h-5 text-[#d4af37]" />
                    </div>
                  )}
                  <h2 className="text-base sm:text-lg font-bold text-[#f7e7ce]">{groupGameName}</h2>
                </div>

                <div className="divide-y divide-stone-800">
                  {plansForGame.map((plan) => {
                    const isVerifiedPrice =
                      plan.verifiedForPublic === true &&
                      !plan.isPreparation &&
                      plan.status === '取扱中' &&
                      typeof plan.currentPrice === 'number' &&
                      plan.currentPrice > 0;
                    const priceText = isVerifiedPrice
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
                          {plan.conditions && isVerifiedPrice && (
                            <div className="text-[11px] text-stone-500 mt-1">{plan.conditions}</div>
                          )}
                        </div>

                        <div className="sm:text-right">
                          <div className="text-[10px] text-stone-500 mb-0.5">販売価格</div>
                          <div className="text-lg font-bold font-mono text-[#f7e7ce]">{priceText}</div>
                          <div className="text-[10px] text-stone-500">在庫はLINEにてご確認ください</div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboardAndOpenModal(
                              [
                                `ゲーム名：${plan.gameName}`,
                                `石の数：${plan.currencyAmount || '確認中'}`,
                                `値段：${priceText}`,
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
                  在庫は公式LINEにてお問い合わせください。ご不明点もLINEでご案内します。
                </div>
              </section>
            );
          })}
        </div>
      )}


      {/* GameTrade listings with direct LINE inquiry */}
      <section className="space-y-4">
        <div className="border-b border-[#d4af37]/20 pb-4">
          <h2 className="text-xl font-bold text-[#f7e7ce]">掲載商品・個別お問い合わせ</h2>
          <p className="text-xs text-stone-400 mt-2">掲載商品ごとの内容・価格を確認し、公式LINEから直接お問い合わせいただけます。</p>
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
              <article key={`stone-inquiry-${index}`} className="rounded-xl bg-[#111216] border border-stone-800 p-4 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] text-stone-400">{item.game}</p>
                  <h3 className="text-sm font-semibold text-white leading-snug">{item.title}</h3>
                  <p className="text-xs text-stone-400 leading-relaxed">{item.summary}</p>
                  <div className="border-t border-stone-800 pt-3 text-right text-lg font-bold text-[#f7e7ce]">¥{item.price.toLocaleString()}</div>
                </div>
                <button type="button" onClick={() => copyToClipboardAndOpenModal(inquiryText, item.game, '掲載商品問い合わせ', item.title)} className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" /> 公式LINEで商品を問い合わせる <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* Bottom Clarification */}
      <div className="rounded-xl bg-[#0e0f12] border border-stone-800 p-5 sm:p-6 text-xs text-stone-400 space-y-2">
        <div className="flex items-center gap-2 text-stone-200 font-semibold text-sm">
          <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
          <span>石垢プランの確認について</span>
        </div>
        <p className="leading-relaxed">
          このページは石垢アカウントの掲載情報を案内するものです。掲載情報だけで在庫や販売可能な状態を保証するものではありません。
        </p>
        <p className="leading-relaxed">
          確認済みの価格は販売価格として、取扱条件・価格の確認が必要なプランは参考価格として表示しています。在庫はすべて公式LINEでご確認ください。掲載外の商品や新しいゲームタイトルも公式LINEでご相談いただけます。
        </p>
      </div>

      {/* Price History Modal (preserved for compatibility) */}
      {activeHistoryPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveHistoryPlan(null)}
        >
          <div
            className="relative w-full max-w-lg bg-[#121316] border border-[#d4af37]/40 rounded-xl p-6 shadow-2xl text-[#f4efe6]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveHistoryPlan(null)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <History className="w-4 h-4 text-[#d4af37]" />
              <span className="text-[10px] font-cinzel uppercase text-[#d4af37]">PRICE REVISION LOG</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">価格変更履歴</h3>
            <p className="text-xs text-stone-400 mb-4">
              {activeHistoryPlan.gameName} - {activeHistoryPlan.planName}
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {activeHistoryPlan.priceHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#0b0c0e] border border-stone-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="text-stone-400 font-mono text-[11px]">{item.date}</div>
                    <div className="text-stone-200 font-medium">{item.reason || '価格見直し'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-stone-500 line-through font-mono">
                      ¥{item.oldPrice.toLocaleString()}
                    </div>
                    <div className="text-sm font-bold text-[#f7e7ce] font-mono">
                      ¥{item.newPrice.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => setActiveHistoryPlan(null)}
                className="px-4 py-2 rounded text-xs text-stone-300 hover:text-white bg-stone-800"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
