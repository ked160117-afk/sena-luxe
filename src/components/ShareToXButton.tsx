import React from 'react';
import { ProductCategory } from '../types';

interface ShareToXButtonProps {
  gameName: string;
  gameShortName?: string;
  gameCode?: string;
  productTitle: string;
  category: ProductCategory;
}

const X_HASHTAG_NAMES: Record<string, { full: string; short: string }> = {
  EF: { full: 'イーフットボール', short: 'イーフト' },
  KO: { full: '荒野行動', short: '荒野' },
};

const toHashtag = (value: string) =>
  value.replace(/\s+/g, '').replace(/[^\p{L}\p{N}_]/gu, '');

export const ShareToXButton: React.FC<ShareToXButtonProps> = ({
  gameName,
  gameShortName,
  gameCode,
  productTitle,
  category,
}) => {
  const override = X_HASHTAG_NAMES[(gameCode || '').toUpperCase()];
  const fullName = toHashtag(override?.full || gameName);
  const shortName = toHashtag(override?.short || gameShortName || '');
  const accountTag = category === 'ゲーム内通貨・石垢' ? '石垢' : '引退垢';
  const tags = Array.from(new Set([
    fullName,
    shortName,
    accountTag,
    'アカウント販売',
    '垢販売',
    'SENALUXE',
  ].filter(Boolean)));
  const postText = [
    productTitle,
    '',
    'SENA LUXE',
    'https://sena-luxe.sena-luxejp.workers.dev/',
    '',
    tags.map((tag) => `#${tag}`).join(' '),
  ].join('\n');
  const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`;

  return (
    <a
      href={intentUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`「${productTitle}」をXで投稿`}
      className="w-full mt-2 py-2.5 px-3 rounded-lg text-xs font-semibold text-[#f7e7ce] bg-[#17181d] border border-[#d4af37]/50 hover:bg-[#24252b] transition-colors flex items-center justify-center gap-2"
    >
      <span aria-hidden="true" className="text-sm font-black leading-none">𝕏</span>
      Xで投稿する
    </a>
  );
};
