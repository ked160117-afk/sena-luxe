/**
 * SENA LUXE - Stone Account Dedicated Rate Table View (石垢専用料金表)
 * Completely separated from regular product list.
 * Features benchmark pricing, reference prices, confirmed dates, price change histories, and LINE inquiry.
 */

import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { StoneRatePlan, PriceHistoryRecord } from '../types';
import { Gem, Calendar, History, ArrowUpRight, MessageCircle, ExternalLink, ShieldCheck, X, Clock } from 'lucide-react';
import { ProductCardImage } from '../components/ProductCardImage';

export const StoneRatesView: React.FC = () => {
  const { stoneRates, games, selectedGameId, setSelectedGameId, setCurrentView } = useStore();
  const [activeHistoryPlan, setActiveHistoryPlan] = useState<StoneRatePlan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter stone rate plans by game and search query
  const filteredPlans = stoneRates.filter((p) => {
    const matchesGame = selectedGameId ? p.gameId === selectedGameId : true;
    if (!matchesGame) return false;

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
            通常商品一覧とは完全に分離された、全33タイトルのゲーム内通貨・石垢専用ベンチマークレート一覧です。
            参考水準を基準に、実際に確認できた適正価格のみを掲載し、端末別条件や必要補足事項を正確に保持して公開しています。
          </p>
        </div>

        {/* Benchmark Reference Source Badge */}
        <div className="rounded-lg bg-[#121316] border border-stone-800 p-3 text-xs text-stone-400 self-start md:self-end">
          <div className="text-[10px] text-stone-500 uppercase font-cinzel">BENCHMARK SOURCE</div>
          <div className="text-stone-300 font-medium">公式ベンチマーク料金連動</div>
          <div className="text-[11px] text-stone-500 mt-0.5">登録プラン総数: {stoneRates.length}件</div>
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
                当店で取り扱う「石垢」は、指定されたゲーム内通貨・石を所持した<strong className="text-white underline decoration-[#d4af37] underline-offset-2">新規または進行済みアカウント本体をお渡しする商品</strong>です。
              </p>
              <p className="text-xs text-stone-400 leading-relaxed">
                ※お客様が現在プレイされている既存アカウントへのゲーム内通貨チャージ・追加代行サービスではありません。<br />
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

      {/* Plans List / Cards */}
      {filteredPlans.length === 0 ? (
        <div className="rounded-xl bg-[#111216] border border-stone-800 p-12 text-center text-stone-400">
          <p className="text-sm">該当する石垢料金プランが見つかりませんでした。</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const game = games.find((g) => g.id === plan.gameId || g.name === plan.gameName || g.code === plan.gameCode);
            const isAvailable = plan.status === '取扱中';

            return (
              <div
                key={plan.id}
                className="rounded-xl bg-[#111216] border border-stone-800 hover:border-[#d4af37]/50 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.12)]"
              >
                <div>
                  {/* Currency / Stone Account Image Banner */}
                  <div className="mb-3.5">
                    <ProductCardImage
                      category="ゲーム内通貨・石垢"
                      gameName={plan.gameName}
                      gameCode={plan.gameCode}
                      currencyName={plan.currencyName}
                      currencyIconUrl={game?.currencyIconUrl || (game?.iconUrl ? game.iconUrl : undefined)}
                      title={plan.planName}
                      className="w-full h-32 rounded-lg"
                    />
                  </div>

                  {/* Header: Game Name & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-[#d4af37] tracking-wide">
                      {plan.gameName}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {plan.deviceRequirement && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60">
                          {plan.deviceRequirement}
                        </span>
                      )}
                      {plan.accountType && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                          {plan.accountType}
                        </span>
                      )}
                      {/* Product Status: 現在準備中 (or 取扱中 if toggled) */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 border ${
                          isAvailable
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                            : 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                        }`}
                      >
                        {!isAvailable && <Clock className="w-3 h-3 text-amber-400" />}
                        <span>{isAvailable ? '取扱中' : '現在準備中'}</span>
                      </span>
                      {/* Stock Status: 在庫要確認 */}
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-stone-900 text-stone-300 border border-stone-700">
                        {plan.stockStatus || '在庫要確認'}
                      </span>
                    </div>
                  </div>

                  {/* Plan Title */}
                  <h3 className="text-base font-semibold text-white">{plan.planName}</h3>

                  {/* Currency Amount Display Box */}
                  <div className="my-3.5 p-3 rounded-lg bg-[#0a0b0d] border border-[#d4af37]/25 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">
                        数量・内訳 ({plan.currencyName})
                      </span>
                      <span className="text-sm sm:text-base font-bold text-gold-gradient font-mono">
                        {plan.currencyAmount}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#d4af37]/15 flex items-center justify-center text-[#d4af37] shrink-0 ml-2">
                      <Gem className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Conditions / Details */}
                  <div className="space-y-1.5 text-xs text-stone-300 mb-4">
                    <div className="text-[11px] text-stone-400 font-medium">プラン条件・仕様：</div>
                    <p className="bg-stone-900/40 p-2 rounded border border-stone-800/60 text-stone-300 text-xs leading-relaxed">
                      {plan.conditions}
                    </p>
                    {plan.notes && (
                      <div className="p-2 rounded bg-amber-950/20 border border-amber-700/40 text-[11px] text-amber-300 leading-relaxed">
                        ※ {plan.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Block & Action */}
                <div className="pt-4 border-t border-stone-800/80 space-y-3">
                  {/* Reference Price vs Current Price */}
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[10px] text-stone-500 block">参考市場価格</span>
                      {plan.referencePrice > 0 ? (
                        <span className="text-xs text-stone-400 font-mono">
                          ¥{plan.referencePrice.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-500">基準価格設定中</span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#d4af37] block font-medium">現在提供価格</span>
                      {plan.priceDisplay ? (
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-lg sm:text-xl font-bold font-mono text-[#f7e7ce]">
                            {plan.priceDisplay}
                          </span>
                        </div>
                      ) : plan.currentPrice !== null ? (
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-xl sm:text-2xl font-bold font-mono text-[#f7e7ce] tabular-nums">
                            ¥{plan.currentPrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-stone-400 font-normal">(税込)</span>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-amber-400">
                          {plan.status === '要相談' ? '要相談' : '価格確認中'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price Confirmed Date & History Trigger */}
                  <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-500" />
                      確認日: {plan.confirmedDate}
                    </span>

                    {plan.priceHistory && plan.priceHistory.length > 0 ? (
                      <button
                        onClick={() => setActiveHistoryPlan(plan)}
                        className="text-[#d4af37] hover:underline flex items-center gap-1"
                      >
                        <History className="w-3 h-3" />
                        <span>改定履歴 ({plan.priceHistory.length})</span>
                      </button>
                    ) : (
                      <span className="text-stone-600 text-[10px]">改定履歴なし</span>
                    )}
                  </div>

                  {/* Order / Inquiry Button */}
                  <a
                    href="https://lin.ee/6uy8hu9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-black stroke-none" />
                    <span>LINEで在庫・購入について問い合わせる</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compliance / Benchmark Clarification */}
      <div className="rounded-xl bg-[#0e0f12] border border-stone-800 p-5 sm:p-6 text-xs text-stone-400 space-y-2">
        <div className="flex items-center gap-2 text-stone-200 font-semibold text-sm">
          <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
          <span>石垢専用料金表の運用方針と安全性</span>
        </div>
        <p className="leading-relaxed">
          当店の石垢料金表は、提携する優良サプライヤー及び参考ベンチマーク（tools-a等）の相場価格を常時追従し、不当な高額販売や不正生成データを排除した安心価格でご案内しております。
        </p>
        <p className="leading-relaxed">
          確認が取れていない価格につきましては「価格確認中」と明記し、適正な仕入れ確認後にのみ現在価格を更新いたします。また、すべての価格変更ログは改定履歴として保存・公開しております。
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
