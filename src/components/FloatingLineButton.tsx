/**
 * SENA LUXE - Floating LINE Contact Button
 * Compact on mobile so it never covers game cards or product actions.
 */

import React from 'react';

export const FloatingLineButton: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 z-30">
      <a
        href="https://lin.ee/6uy8hu9"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-center gap-2.5 w-12 h-12 sm:w-auto sm:h-auto sm:px-4 sm:py-3 rounded-full bg-[#121316] border border-[#d4af37]/60 text-white shadow-[0_4px_20px_rgba(0,0,0,0.75),0_0_12px_rgba(212,175,55,0.2)] hover:border-[#d4af37] hover:shadow-[0_4px_25px_rgba(212,175,55,0.35)] transition-all duration-300"
        aria-label="LINE問い合わせ"
        title="LINEお問い合わせ"
      >
        <div className="w-8 h-8 rounded-full bg-[#06C755] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
          <svg viewBox="0 0 32 32" className="w-7 h-7" role="img" aria-label="LINE">
            <path
              fill="#FFFFFF"
              d="M16 3.5C8.82 3.5 3 8.48 3 14.62c0 3.31 1.68 6.27 4.34 8.24-.19 1.12-.7 2.58-1.65 3.75-.22.27-.02.68.33.66 2.36-.13 4.5-1.08 6.02-2.05 1.25.34 2.58.52 3.96.52 7.18 0 13-4.98 13-11.12S23.18 3.5 16 3.5Z"
            />
            <text x="16" y="17.4" textAnchor="middle" fontSize="7.1" fontWeight="800" letterSpacing=".15" fill="#06C755">LINE</text>
          </svg>
        </div>
        <div className="hidden sm:flex flex-col text-left pr-1">
          <span className="text-[10px] tracking-widest text-[#d4af37] font-cinzel leading-none">OFFICIAL LINE</span>
          <span className="text-xs font-semibold text-stone-100 whitespace-nowrap">LINEお問い合わせ</span>
        </div>
      </a>
    </div>
  );
};
