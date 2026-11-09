/**
 * SENA LUXE - Game Card Icon Component
 * Enforces brand image discipline:
 * - Prohibits unrelated stock photos, gem CGs, and AI-generated game art.
 * - When an official authentic image is not registered (or unverified Unsplash URL),
 *   renders the official SENA LUXE Black x Gold luxury crest placeholder.
 */

import React, { useState } from 'react';
import { GameTitle } from '../types';

interface GameCardIconProps {
  game: Pick<GameTitle, 'name' | 'code'> & {
    shortName?: string;
    category?: string;
    iconUrl?: string;
  };
  className?: string;
  size?: 'sm' | 'lg';
  showBadges?: boolean;
}

export const GameCardIcon: React.FC<GameCardIconProps> = ({
  game,
  className = '',
  size = 'lg',
  showBadges = true,
}) => {
  const [imageError, setImageError] = useState(false);

  // Consider unverified stock photos (Unsplash) or empty strings as "unregistered"
  const hasOfficialImage =
    Boolean(game.iconUrl?.trim()) &&
    !game.iconUrl!.includes('images.unsplash.com') &&
    !game.iconUrl!.includes('placeholder') &&
    !imageError;

  // 1. Small thumbnail (used in admin lists, small badges)
  if (size === 'sm') {
    if (hasOfficialImage) {
      return (
        <img
          src={game.iconUrl}
          alt={game.name}
          onError={() => setImageError(true)}
          className={`rounded-lg object-cover border border-stone-700 shrink-0 ${className || 'w-11 h-11'}`}
          loading="lazy"
        />
      );
    }

    return (
      <div
        className={`rounded-lg bg-gradient-to-b from-[#181920] to-[#0a0b0e] border border-[#d4af37]/40 flex flex-col items-center justify-center shrink-0 shadow select-none ${className || 'w-11 h-11'}`}
      >
        <span className="text-[10px] font-cinzel font-bold text-[#d4af37] tracking-wider leading-none">
          {game.code}
        </span>
      </div>
    );
  }

  // 2. Large Card Thumbnail (used on Top page, Game Catalog, Candidates)
  if (hasOfficialImage) {
    return (
      <div className={`relative aspect-square w-full rounded-lg overflow-hidden bg-stone-900 border border-stone-800 mb-3.5 group-hover:border-[#d4af37]/40 transition-colors ${className}`}>
        <img
          src={game.iconUrl}
          alt={game.name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {showBadges && (
          <>
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md border border-[#d4af37]/40 text-[10px] font-cinzel font-bold text-[#d4af37]">
              {game.code}
            </div>
            {game.category && (
              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-[10px] text-stone-300">
                {game.category}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Official SENA LUXE Black x Gold Shared Placeholder for Games
  return (
    <div
      className={`relative aspect-square w-full rounded-lg overflow-hidden bg-gradient-to-b from-[#191a22] via-[#101115] to-[#07080a] border border-stone-800/90 group-hover:border-[#d4af37]/50 mb-3.5 flex flex-col items-center justify-center p-4 text-center select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all ${className}`}
    >
      {/* Subtle Luxury Radial Gold Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#d4af37]/12 via-transparent to-transparent pointer-events-none" />

      {/* Decorative Gold Corner Accents */}
      <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t border-l border-[#d4af37]/40 pointer-events-none" />
      <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t border-r border-[#d4af37]/40 pointer-events-none" />
      <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b border-l border-[#d4af37]/40 pointer-events-none" />
      <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b border-r border-[#d4af37]/40 pointer-events-none" />

      {/* Central Black & Gold Seal */}
      <div className="relative z-10 flex flex-col items-center space-y-2">
        <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-[#0a0b0d] border border-[#d4af37]/50 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.8),0_0_12px_rgba(212,175,55,0.15)] group-hover:scale-105 transition-transform duration-500">
          <span className="text-base sm:text-lg font-bold font-cinzel text-[#f7e7ce] tracking-widest pl-0.5">
            {game.code}
          </span>
        </div>

        <div className="text-[11px] sm:text-xs font-semibold text-stone-200 line-clamp-1 max-w-[140px]">
          {game.shortName || game.name}
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/75 border border-[#d4af37]/30 text-[9px] font-mono tracking-widest text-[#d4af37] uppercase">
          OFFICIAL TITLE
        </div>
      </div>

      {/* Optional Overlay Badges */}
      {showBadges && (
        <>
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md border border-[#d4af37]/40 text-[10px] font-cinzel font-bold text-[#d4af37]">
            {game.code}
          </div>
          {game.category && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-[10px] text-stone-300">
              {game.category}
            </div>
          )}
        </>
      )}
    </div>
  );
};
