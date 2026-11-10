/**
 * SENA LUXE - Top Navigation Bar
 * Conforms to Top Bar Contract: Brand Wordmark — 4-5 single-line links — 1 primary action
 */

import React, { useState } from 'react';
import { useStore, AppView } from '../context/StoreContext';
import { Menu, X, Shield, MessageCircle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentView, setCurrentView, isAdminLoggedIn } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: AppView) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const navItems: { label: string; view: AppView }[] = [
    { label: 'おすすめ‼️引退垢一覧‼️', view: 'retired_accounts' },
    { label: 'ゲーム一覧', view: 'games' },
    { label: '石垢料金表', view: 'stone_rates' },
    { label: '注意事項・FAQ', view: 'faq' },
    { label: '追加候補', view: 'candidates' },
    { label: '掲載商品問い合わせ', view: 'request' },
    { label: 'ショップ情報', view: 'shop_info' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0b0c0e]/95 backdrop-blur-md border-b border-[#d4af37]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => handleNav('top')}
            className="flex items-center gap-3 text-left focus:outline-none group shrink-0"
          >
            <div className="w-8 h-8 rounded-full border border-[#d4af37]/60 flex items-center justify-center bg-black/60 shadow-[0_0_10px_rgba(212,175,55,0.2)] group-hover:border-[#d4af37] transition-all">
              <span className="font-cinzel text-xs font-bold text-gold-gradient">SL</span>
            </div>
            <div className="flex flex-col">
              <span className="font-cinzel text-xl sm:text-2xl font-bold tracking-wider text-gold-gradient">
                SENA LUXE
              </span>
              <span className="text-[9px] tracking-[0.22em] text-[#d4af37]/80 uppercase font-sans font-medium -mt-1 hidden sm:block">
                PREMIUM GAME COLLECTION
              </span>
            </div>
          </button>

          {/* Zone 2: 4-5 single-line nav links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => handleNav(item.view)}
                  className={`whitespace-nowrap transition-colors py-1 relative ${
                    isActive
                      ? 'text-[#f7e7ce] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#d4af37]'
                      : 'text-stone-300 hover:text-[#d4af37]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            {isAdminLoggedIn && (
              <button
                onClick={() => handleNav('admin_dashboard')}
                className="flex items-center gap-1.5 text-xs text-[#d4af37] hover:text-[#f7e7ce] px-2.5 py-1 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 whitespace-nowrap"
              >
                <Shield className="w-3.5 h-3.5" />
                管理画面
              </button>
            )}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://lin.ee/6uy8hu9"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-semibold rounded-md text-black bg-[#d4af37] hover:bg-[#e6c158] transition-colors shadow-[0_2px_12px_rgba(212,175,55,0.25)] flex items-center gap-2 whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 fill-black stroke-none" />
              <span>LINE問い合わせ</span>
            </a>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-stone-300 hover:text-white rounded-md border border-stone-800 focus:outline-none"
              aria-label="メニューを開く"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-800 bg-[#0b0c0e]/98 px-5 py-6 space-y-4 shadow-2xl animate-fade-in">
          <div className="text-[10px] tracking-widest text-[#d4af37] uppercase font-cinzel mb-2">
            PREMIUM GAME COLLECTION
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleNav('top')}
              className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentView === 'top' ? 'bg-[#d4af37]/15 text-[#f7e7ce] font-semibold' : 'text-stone-300'
              }`}
            >
              トップページ
            </button>
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => handleNav(item.view)}
                  className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-[#d4af37]/15 text-[#f7e7ce] font-semibold' : 'text-stone-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-stone-800/80 space-y-2.5">
            <a
              href="https://lin.ee/6uy8hu9"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-lg text-xs font-semibold text-black bg-[#06C755] flex items-center justify-center gap-2 shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-black stroke-none" />
              <span>公式LINEで問い合わせる</span>
            </a>

            {isAdminLoggedIn ? (
              <button
                onClick={() => handleNav('admin_dashboard')}
                className="w-full py-2.5 rounded-lg text-xs font-medium text-[#d4af37] border border-[#d4af37]/40 text-center"
              >
                管理者ダッシュボードを開く
              </button>
            ) : (
              <button
                onClick={() => handleNav('admin_login')}
                className="w-full py-2 text-[11px] text-stone-500 hover:text-stone-400 text-center"
              >
                管理者ログイン
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
