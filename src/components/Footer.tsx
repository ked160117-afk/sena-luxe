/**
 * SENA LUXE - Footer Component
 * Luxury brand aesthetics, compliance disclaimers, and legal navigation
 */

import React from 'react';
import { useStore, AppView } from '../context/StoreContext';
import { ShieldCheck, MessageCircle, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentView, settings } = useStore();

  const handleNav = (view: AppView) => {
    setCurrentView(view);
  };

  return (
    <footer className="w-full bg-[#08080a] border-t border-[#d4af37]/20 text-stone-400 text-xs mt-20">
      {/* Notice Banner */}
      <div className="border-b border-stone-800/80 bg-[#0e0f12]/80 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2.5 text-stone-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
            <span>石垢アカウントの掲載内容・価格・在庫は、購入前に公式LINEでご確認ください。掲載外商品の個別手配・取り寄せ・予約は承っておりません。</span>
          </div>
          <a
            href="https://lin.ee/6uy8hu9"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded text-xs font-medium text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors whitespace-nowrap shrink-0"
          >
            公式LINEで問い合わせ
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-xl font-bold tracking-wider text-gold-gradient">
                SENA LUXE
              </span>
            </div>
            <p className="text-[10px] tracking-widest text-[#d4af37] font-cinzel uppercase">
              PREMIUM GAME COLLECTION
            </p>
            <p className="text-xs text-stone-400 leading-relaxed">
              ゲーム内通貨を保有した石垢アカウントを掲載・販売しています。
            </p>
            <div className="pt-2">
              <a
                href="https://lin.ee/6uy8hu9"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#121316] border border-stone-800 hover:border-[#d4af37]/50 text-stone-200 text-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#06C755]" />
                <span>公式LINEで問い合わせ</span>
              </a>
            </div>
          </div>

          {/* Service Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200">サービス一覧</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNav('games')} className="hover:text-[#d4af37] transition-colors">
                  取扱ゲームタイトル一覧
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('stone_rates')} className="hover:text-[#d4af37] transition-colors">
                  石垢専用料金表
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('faq')} className="hover:text-[#d4af37] transition-colors">
                  お取引注意事項・FAQ
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('candidates')} className="hover:text-[#d4af37] transition-colors">
                  人気ゲーム追加候補
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('request')} className="hover:text-[#d4af37] transition-colors">
                  石垢販売について
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200">規約・法務情報</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNav('law')} className="hover:text-[#d4af37] transition-colors">
                  特定商取引法に基づく表記
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('terms')} className="hover:text-[#d4af37] transition-colors">
                  利用規約
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('faq')} className="hover:text-[#d4af37] transition-colors">
                  お取引前の重要注意事項
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('privacy')} className="hover:text-[#d4af37] transition-colors">
                  プライバシーポリシー
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('shop_info')} className="hover:text-[#d4af37] transition-colors">
                  ショップ情報・運営方針
                </button>
              </li>
            </ul>
          </div>

          {/* Security & Admin */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200">サポート・運営</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              対応時間：{settings.contactDeskHours || '公式LINEにてご案内'}<br />
              お問い合わせへの返信にはお時間をいただく場合があります。
            </p>
            <div className="pt-2">
              <button
                onClick={() => handleNav('admin_login')}
                className="text-stone-500 hover:text-stone-300 transition-colors text-[11px] underline underline-offset-4"
              >
                管理者ログイン
              </button>
            </div>
          </div>
        </div>

        {/* Compliance Notice Box */}
        <div className="p-4 rounded-lg bg-[#0e0f12] border border-stone-800/80 mb-8 text-[11px] leading-relaxed text-stone-400 space-y-1.5">
          <div className="flex items-center gap-1.5 text-stone-300 font-semibold mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>コンプライアンス及びお取引に関する重要事項</span>
          </div>
          <p>
            当サイトでは石垢アカウントを掲載しています。Webサイト上での自動決済機能は提供しておらず、価格・在庫・商品内容は購入前に公式LINEでご確認ください。
          </p>
          <p>
            掲載外商品の個別手配・取り寄せ・予約・代行は承っておりません。ゲームごとの利用規約やアカウント譲渡に関する制限を事前にご確認ください。
          </p>
        </div>

        {/* Bottom Line */}
        <div className="pt-6 border-t border-stone-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} SENA LUXE. All Rights Reserved. PREMIUM GAME COLLECTION.
          </div>
          <div className="flex items-center gap-4">
            <span>石垢アカウント販売</span>
            <span aria-hidden="true">·</span>
            <span>公式LINE窓口</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
