/**
 * SENA LUXE - Stone Account Dedicated Rate Table View (石垢専用料金表)
 * Completely separated from regular product list.
 * Features benchmark pricing, reference prices, confirmed dates, price change histories, and LINE inquiry.
 */

import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { StoneRatePlan, PriceHistoryRecord } from '../types';
import { Gem, History, ArrowUpRight, MessageCircle, ExternalLink, ShieldCheck, X, Clock } from 'lucide-react';
import { ProductCardImage } from '../components/ProductCardImage';

export const StoneRatesView: React.FC = () => {
  const { stoneRates, games, selectedGameId, setSelectedGameId, setCurrentView, copyToClipboardAndOpenModal } = useStore();
  const [activeHistoryPlan, setActiveHistoryPlan] = useState<StoneRatePlan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Show the complete stone-rate catalog. Unconfirmed prices remain clearly marked.
  const publishedPlans = stoneRates;
  const plansForSelectedGame = publishedPlans.filter((plan) =>
    selectedGameId ? plan.gameId === selectedGameId : true
  );
  const filteredPlans = plansForSelectedGame.filter((p) => {
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

        {/* Listing count only; no unverified benchmark claim */}
        <div className="rounded-lg bg-[#121316] border border-stone-800 p-3 text-xs text-stone-400 self-start md:self-end">
          <div className="text-[10px] text-stone-500 uppercase font-cinzel">LISTED PLANS</div>
          <div className="text-stone-300 font-medium">掲載中のプラン</div>
          <div className="text-[11px] text-stone-500 mt-0.5">{publishedPlans.length}件</div>
        </div>
      </div>

      {/* Stone Account Definition & Transaction Notice Banner */}
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
                当店で取り扱う「石垢」は、ゲーム内で無料で入手できる<strong className="text-white underline decoration-[#d4af37] underline-offset-2">無償石・無償通貨のみ</strong>を所持した新規または進行済みアカウント本体をお渡しする商品です。有償石・課金石・有料通貨は一切取り扱いません。
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
        {/* Search input */}
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

        {/* Game Filter Pills */}
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
              全タイトル ({stoneRates.length})
            </button>
            {games.map((g) => {
              const count = stoneRates.filter((r) => r.gameId === g.id).length;
              if (count === 0) return null;
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
                  {g.shortName} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grouped game title rate table */}
      {filteredPlans.length === 0 ? (
        <div className="rounded-xl bg-[#111216] border border-stone-800 p-12 text-center text-stone-400">
          <p className="text-sm font-semibold text-stone-200">
            {plansForSelectedGame.length === 0 ? '現在商品を準備中です' : '検索条件に一致する石垢プランが見つかりませんでした'}
          </p>
          <p className="mt-2 text-xs text-stone-400">
            {plansForSelectedGame.length === 0
              ? '一覧にない商品や新しいゲームタイトルも公式LINEでご相談いただけます。'
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
          {Array.from(new Map(filteredPlans.map((plan) => [plan.gameId || plan.gameName, plan.gameName])).entries()).map(([gameId, gameName]) => {
            const gamePlans = filteredPlans.filter((plan) => (plan.gameId || plan.gameName) === gameId);
            return (
              <section key={gameId} className="rounded-xl bg-[#111216] border border-[#d4af37]/30 overflow-hidden">
                <div className="px-4 sm:px-5 py-4 bg-gradient-to-r from-[#201a0d] to-[#111216] border-b border-[#d4af37]/25 flex items-center gap-2">
                  <Gem className="w-5 h-5 text-[#d4af37]" />
                  <h2 className="text-base sm:text-lg font-bold text-[#f7e7ce]">{gameName}</h2>
                </div>
                <div className="divide-y divide-stone-800">
                  {gamePlans.map((plan) => {
                    const confirmed = plan.verifiedForPublic && !plan.isPreparation && plan.status === '取扱中' && typeof plan.currentPrice === 'number' && plan.currentPrice > 0;
                    return (
                      <div key={plan.id} className="px-4 sm:px-5 py-4 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] gap-3 sm:gap-5 sm:items-center">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white">{plan.currencyAmount?.trim() || '無償石の数量確認中'}</div>
                          <div className="text-xs text-stone-400 mt-1">{plan.planName}</div>
                          {plan.conditions && confirmed && <div className="text-[11px] text-stone-500 mt-1">{plan.conditions}</div>}
                        </div>
                        <div className="sm:text-right">
                          <div className="text-[10px] text-stone-500 mb-0.5">販売価格</div>
                          <div className="text-lg font-bold font-mono text-[#f7e7ce]">
                            {confirmed ? `¥${plan.currentPrice!.toLocaleString()}` : plan.priceDisplay?.trim() ? `参考価格：${plan.priceDisplay}（要LINE確認）` : '価格確認中'}
                          </div>
                          <div className="text-[10px] text-stone-500">在庫はLINEにてご確認ください</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const inquiryText = [
                              '【SENA LUXE 石垢料金・在庫問い合わせ】',
                              `ゲーム名：${plan.gameName}`,
                              `無償石の数・通貨数量：${plan.currencyAmount || '確認中'}`,
                              `プラン名：${plan.planName}`,
                              `掲載価格：${confirmed ? `¥${plan.currentPrice!.toLocaleString()}` : '価格確認中'}`,
                              '確認したい内容：在庫・商品内容・引き継ぎ方法など',
                            ].join('\\n');
                            copyToClipboardAndOpenModal(inquiryText, plan.gameName, '無償石（無料入手分）石垢料金表', plan.planName);
                          }}
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

      {/* Listing and confirmation policy */}
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

      {/* Price History Modal */}
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
