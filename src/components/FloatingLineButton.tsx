/**
 * SENA LUXE - Floating LINE Contact Button
 * Compact on mobile so it never covers game cards or product actions.
 */

import React from 'react';
import { MessageCircle } from 'lucide-react';

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
        <div className="w-8 h-8 rounded-full bg-[#06C755] flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
          <MessageCircle className="w-5 h-5 fill-white stroke-none" />
        </div>
        <div className="hidden sm:flex flex-col text-left pr-1">
          <span className="text-[10px] tracking-widest text-[#d4af37] font-cinzel leading-none">OFFICIAL LINE</span>
          <span className="text-xs font-semibold text-stone-100 whitespace-nowrap">LINEお問い合わせ</span>
        </div>
      </a>
    </div>
  );
};
