/**
 * SENA LUXE - X (Twitter) Share Button Component
 */

import React from 'react';

const HASHTAG_ALIASES: Record<string, { full: string; short: string }> = {
  EF: { full: 'イーフットボール', short: 'イーフト' },
  KO: { full: '荒野行動', short: '荒野' },
};

const sanitizeHashtag = (value: string): string =>
  value.replace(/\s+/g, '').replace(/[^\p{L}\p{N}_]/gu, '');

interface XShareButtonProps {
  gameName: string;
  gameShortName?: string;
  gameCode?: string;
  productTitle: string;
  category: string;
  productId?: string;
}

export const XShareButton: React.FC<XShareButtonProps> = ({
  gameName,
  gameShortName,
  gameCode,
  productTitle,
  category,
  productId,
}) => {
  const alias = HASHTAG_ALIASES[(gameCode || '').toUpperCase()];
  const fullTag = sanitizeHashtag(alias?.full || gameName);
  const shortTag = sanitizeHashtag(alias?.short || gameShortName || '');
  const categoryTag =
    category === 'ゲーム内通貨・石垢' || category === '石垢'
      ? '石垢'
      : category === '初期垢'
      ? '初期垢'
      : '引退垢';

  const hashtagLine = Array.from(
    new Set([fullTag, shortTag, categoryTag, 'アカウント販売', '垢販売', 'SENALUXE'].filter(Boolean))
  )
    .map((tag) => `#${tag}`)
    .join(' ');

  const baseUrl = 'https://sena-luxe.sena-luxejp.workers.dev';
  const isAccountCategory = category === '引退垢' || category === '初期垢';
  const productShareUrl = productId && isAccountCategory ? `${baseUrl}/share/${encodeURIComponent(productId)}` : baseUrl;

  const text = [
    productTitle,
    '',
    'SENA LUXE',
    productShareUrl,
    '',
    hashtagLine,
  ].join('\n');

  const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={intentUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`「${productTitle}」をXで投稿`}
      className="w-full mt-2 py-2.5 px-3 rounded-lg text-xs font-semibold text-[#f7e7ce] bg-[#17181d] border border-[#d4af37]/50 hover:bg-[#24252b] transition-colors flex items-center justify-center gap-2"
    >
      <span aria-hidden="true" className="text-sm font-black leading-none">
        𝕏
      </span>
      Xで投稿する
    </a>
  );
};
