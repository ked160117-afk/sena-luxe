/**
 * SENA LUXE - Product Card Image Component
 * Adheres strictly to image guidelines:
 * - Prohibits unrelated gem logos, abstract AI art, or fake game screenshots
 * - For stone accounts: Uses actual currency icon if provided, or the dedicated black x gold shared placeholder with game name and 「石垢」
 * - For other categories: Uses admin-registered authentic image, or high-end verified placeholder
 */

import React, { useState } from 'react';
import { ProductCategory } from '../types';
import { Gem, ShieldCheck, Sparkles, Trophy } from 'lucide-react';

interface ProductCardImageProps {
  category: ProductCategory;
  gameName: string;
  gameCode?: string;
  currencyName?: string;
  imageUrl?: string;
  currencyIconUrl?: string;
  title?: string;
  className?: string;
}

export const ProductCardImage: React.FC<ProductCardImageProps> = ({
  category,
  gameName,
  gameCode,
  currencyName,
  imageUrl,
  currencyIconUrl,
  title,
  className = 'w-full h-44',
}) => {
  const [imgError, setImgError] = useState(false);
  const isStoneCategory = category === 'ゲーム内通貨・石垢';

  // 1. Stone Account Category
  if (isStoneCategory) {
    // If an authentic currency icon URL is provided and not errored
    if (currencyIconUrl && !imgError) {
      return (
        <div className={`relative overflow-hidden bg-[#0c0d10] border border-stone-800 flex items-center justify-center ${className}`}>
          <img
            src={currencyIconUrl}
            alt={`${gameName} ${currencyName || '石垢'}`}
            className="w-full h-full object-contain p-3"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/85 border border-[#d4af37]/40 text-[10px] font-semibold text-[#d4af37]">
            石垢
          </div>
        </div>
      );
    }

    // Official Black x Gold Shared Placeholder for Stone Accounts
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-b from-[#131419] to-[#08090b] border-b border-[#d4af37]/20 flex flex-col items-center justify-center p-4 text-center select-none ${className}`}
      >
        {/* Subtle Luxury Pattern / Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#d4af37]/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-1.5 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-black/70 border border-[#d4af37]/40 flex items-center justify-center shadow-lg">
            <Gem className="w-5 h-5 text-[#d4af37]" />
          </div>

          <div className="text-[11px] font-medium text-stone-300 max-w-[180px] truncate">
            {gameName}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-black/80 border border-[#d4af37]/60 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
            <span className="text-xs font-bold font-serif text-[#f7e7ce] tracking-widest">
              石垢
            </span>
          </div>

          <div className="text-[9px] font-mono tracking-widest text-[#d4af37]/70 uppercase">
            AUTHENTIC CURRENCY
          </div>
        </div>
      </div>
    );
  }

  // 2. Admin-registered authentic product image
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-[#0a0b0d] ${className}`}>
        <img
          src={imageUrl}
          alt={gameName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
      </div>
    );
  }

  // 3. Fallback Authentic Placeholder for Account / Data / Items
  const getCategoryIcon = () => {
    switch (category) {
      case '育成済みデータ':
        return <Trophy className="w-5 h-5 text-[#d4af37]" />;
      case '限定キャラクター・アイテム':
        return <Sparkles className="w-5 h-5 text-[#d4af37]" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-[#d4af37]" />;
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b from-[#14151b] to-[#090a0d] border-b border-stone-800 flex flex-col items-center justify-center p-4 text-center select-none ${className}`}
    >
      <div className="relative z-10 space-y-1.5 flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-black/60 border border-[#d4af37]/30 flex items-center justify-center">
          {getCategoryIcon()}
        </div>
        <div className="text-[11px] font-medium text-stone-300 max-w-[180px] truncate">
          {gameName}
        </div>
        <div className="text-[10px] text-stone-400 font-medium">
          {category}
        </div>
        <div className="text-[9px] font-cinzel tracking-widest text-[#d4af37]/60 uppercase">
          SENA LUXE VERIFIED
        </div>
      </div>
    </div>
  );
};
