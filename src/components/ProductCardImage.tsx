/**
 * SENA LUXE - Product Card Image Component
 * Adheres strictly to image guidelines:
 * - Prohibits unrelated gem logos, abstract AI art, or fake game screenshots
 * - For stone accounts: Uses actual currency icon if provided, or the dedicated black x gold shared placeholder with game name and 「石垢」
 * - For other categories: Uses admin-registered authentic image, or high-end verified placeholder
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ProductCategory } from '../types';
import { resolveMediaPlayableUrl } from '../services/mediaService';
import {
  ChevronLeft,
  ChevronRight,
  Gem,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
  Video,
  X,
} from 'lucide-react';

interface ProductCardImageProps {
  category: ProductCategory;
  gameName: string;
  gameCode?: string;
  currencyName?: string;
  imageUrl?: string;
  additionalImages?: string[];
  imageUrls?: string[];
  videoUrl?: string;
  videoStorageId?: string;
  currencyIconUrl?: string;
  gameIconUrl?: string;
  title?: string;
  className?: string;
}

export const ProductCardImage: React.FC<ProductCardImageProps> = ({
  category,
  gameName,
  currencyName,
  imageUrl,
  additionalImages,
  imageUrls,
  videoUrl,
  videoStorageId,
  currencyIconUrl,
  gameIconUrl,
  title,
  className = 'w-full h-44',
}) => {
  const [failedStoneSrc, setFailedStoneSrc] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [extraIndex, setExtraIndex] = useState(0);
  const [failedIndices, setFailedIndices] = useState<Record<number, boolean>>({});
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState('');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoPlayError, setVideoPlayError] = useState<string | null>(null);
  const [videoReloadSeq, setVideoReloadSeq] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const isStoneCategory = category === '石垢' || category === 'ゲーム内通貨・石垢';

  const galleryImages = useMemo(() => {
    const raw =
      Array.isArray(additionalImages) && additionalImages.length > 0
        ? [imageUrl, ...additionalImages]
        : Array.isArray(imageUrls) && imageUrls.length > 0
        ? imageUrls
        : [imageUrl];
    return Array.from(
      new Set(
        raw
          .map((u) => (typeof u === 'string' ? u.trim() : ''))
          .filter(Boolean)
      )
    ).slice(0, 5);
  }, [imageUrl, additionalImages, imageUrls]);

  const effectiveVideoSource = useMemo(() => {
    const direct = typeof videoUrl === 'string' ? videoUrl.trim() : '';
    if (direct) return direct;
    const storageId = typeof videoStorageId === 'string' ? videoStorageId.trim() : '';
    return storageId ? `fs-media://${storageId}` : '';
  }, [videoUrl, videoStorageId]);

  const hasVideo = Boolean(effectiveVideoSource);
  const galleryKey = galleryImages.join('|');

  useEffect(() => {
    setActiveIndex(0);
    setExtraIndex(0);
    setFailedIndices({});
  }, [galleryKey]);

  const loadVideoSource = useCallback(async (source: string, isCancelled: () => boolean) => {
    if (!source) return;
    setIsLoadingVideo(true);
    setVideoPlayError(null);
    setResolvedVideoUrl('');

    try {
      const playable = await resolveMediaPlayableUrl(source);
      if (isCancelled()) return;
      if (playable) {
        setResolvedVideoUrl(playable);
      } else {
        setVideoPlayError('動画データを読み込めませんでした。');
      }
    } catch {
      if (isCancelled()) return;
      setVideoPlayError('動画データの読み込みに失敗しました。');
    } finally {
      if (!isCancelled()) {
        setIsLoadingVideo(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!hasVideo) {
      setResolvedVideoUrl('');
      setVideoPlayError(null);
      setIsLoadingVideo(false);
      return;
    }

    let cancelled = false;
    void loadVideoSource(effectiveVideoSource, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [hasVideo, effectiveVideoSource, videoReloadSeq, loadVideoSource]);

  const getCategoryIcon = () => {
    switch (category) {
      case '育成済みデータ':
        return <Trophy className="w-5 h-5 text-[#d4af37]" />;
      case '限定キャラクター・アイテム':
        return <Sparkles className="w-5 h-5 text-[#d4af37]" />;
      case '石垢':
      case 'ゲーム内通貨・石垢':
        return <Gem className="w-5 h-5 text-[#d4af37]" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-[#d4af37]" />;
    }
  };

  // 1. Stone Account Category without video & without authentic product images -> currency/game icon or placeholder
  if (isStoneCategory && !hasVideo && galleryImages.length === 0) {
    if (currencyIconUrl && failedStoneSrc !== currencyIconUrl) {
      return (
        <div
          className={`relative overflow-hidden bg-[#0c0d10] rounded-lg border border-stone-800 flex items-center justify-center ${className}`}
        >
          <img
            src={currencyIconUrl}
            alt={`${gameName} ${currencyName || 'ゲーム内通貨'}`}
            className="w-full h-full object-contain p-3"
            loading="lazy"
            decoding="async"
            onError={() => setFailedStoneSrc(currencyIconUrl)}
          />
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/85 border border-[#d4af37]/40 text-[10px] font-semibold text-[#d4af37]">
            石垢
          </div>
        </div>
      );
    }

    if (gameIconUrl && failedStoneSrc !== gameIconUrl) {
      return (
        <div
          className={`relative overflow-hidden bg-[#0c0d10] rounded-lg border border-stone-800 flex items-center justify-center ${className}`}
        >
          <img
            src={gameIconUrl}
            alt={`${gameName} アプリアイコン`}
            className="w-full h-full object-contain p-3"
            loading="lazy"
            decoding="async"
            onError={() => setFailedStoneSrc(gameIconUrl)}
          />
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/85 border border-[#d4af37]/40 text-[10px] font-semibold text-[#d4af37]">
            石垢
          </div>
        </div>
      );
    }

    return (
      <div
        className={`relative overflow-hidden rounded-lg bg-gradient-to-b from-[#131419] to-[#08090b] border border-[#d4af37]/20 flex flex-col items-center justify-center p-4 text-center select-none ${className}`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#d4af37]/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-1.5 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-black/70 border border-[#d4af37]/40 flex items-center justify-center shadow-lg">
            <Gem className="w-5 h-5 text-[#d4af37]" />
          </div>

          <div className="text-[11px] font-medium text-stone-300 max-w-[180px] truncate">
            {gameName}
          </div>

          {currencyName && (
            <div className="text-[10px] font-semibold text-[#d4af37] max-w-[180px] truncate">
              {currencyName}
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-black/80 border border-[#d4af37]/60 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
            <span className="text-xs font-bold font-serif text-[#f7e7ce] tracking-widest">
              石垢
            </span>
          </div>

          <div className="text-[9px] font-mono tracking-widest text-[#d4af37]/70">
            画像準備中
          </div>
        </div>
      </div>
    );
  }

  // 2. Non-stone category with neither images nor video -> Authentic Fallback Placeholder
  if (!hasVideo && galleryImages.length === 0) {
    return (
      <div
        className={`relative overflow-hidden rounded-lg bg-gradient-to-b from-[#14151b] to-[#090a0d] border border-stone-800 flex flex-col items-center justify-center p-4 text-center select-none ${className}`}
      >
        <div className="relative z-10 space-y-1.5 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-black/60 border border-[#d4af37]/30 flex items-center justify-center">
            {getCategoryIcon()}
          </div>
          <div className="text-[11px] font-medium text-stone-300 max-w-[180px] truncate">
            {gameName}
          </div>
          <div className="text-[10px] text-stone-400 font-medium">{category}</div>
          <div className="text-[9px] font-cinzel tracking-widest text-[#d4af37]/60 uppercase">
            SENA LUXE VERIFIED
          </div>
        </div>
      </div>
    );
  }

  // 3. Layout when Video IS Registered:
  //    - Top: Main image (1st image) displayed large (keeps container size)
  //    - Bottom-Left: Registered video preview player
  //    - Bottom-Right: Additional images (2nd - 5th) display & switcher
  if (hasVideo) {
    const mainImage = galleryImages[0];
    const extraImages = galleryImages.slice(1, 5);
    const safeExtraIndex = extraIndex < extraImages.length ? extraIndex : 0;
    const currentExtraSrc = extraImages[safeExtraIndex];
    const currentExtraGalleryIndex = safeExtraIndex + 1;

    const handlePrevExtra = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (extraImages.length <= 1) return;
      setExtraIndex((prev) => (prev <= 0 ? extraImages.length - 1 : prev - 1));
    };

    const handleNextExtra = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (extraImages.length <= 1) return;
      setExtraIndex((prev) => (prev >= extraImages.length - 1 ? 0 : prev + 1));
    };

    return (
      <>
      <div className="w-full space-y-2">
        {/* Top Section: 1st Main Image (Large Display) */}
        <div className={`relative overflow-hidden bg-[#0a0b0d] rounded-lg border border-stone-800/90 ${className}`}>
          {mainImage && !failedIndices[0] ? (
            <>
              <img
                src={mainImage}
                onClick={() => setPreviewImage(mainImage)}
                style={{ cursor: 'zoom-in' }}
                alt={`${title || gameName} メイン画像`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                onError={() => {
                  setFailedIndices((prev) => ({ ...prev, 0: true }));
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 pointer-events-none" />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-[#d4af37]/50 text-[10px] font-semibold text-[#f7e7ce] pointer-events-none">
                メイン画像
              </div>
              {galleryImages.length > 1 && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 border border-stone-700 text-[10px] font-mono text-stone-200 pointer-events-none">
                  画像全{galleryImages.length}枚
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-[#14151b] to-[#090a0d] flex flex-col items-center justify-center p-4 text-center select-none">
              <div className="w-9 h-9 rounded-full bg-black/70 border border-[#d4af37]/40 flex items-center justify-center mb-1.5">
                {getCategoryIcon()}
              </div>
              <div className="text-[11px] font-medium text-stone-300 max-w-[180px] truncate">
                {gameName}
              </div>
              <div className="text-[10px] text-[#d4af37]/80 mt-0.5">
                {mainImage ? '画像を読み込めませんでした' : 'メイン画像未登録'}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Left = Video Preview / Right = Switchable 2nd-5th Additional Images */}
        <div className="grid grid-cols-2 gap-2 items-stretch">
          {/* Bottom-Left: Registered Video Preview */}
          <div
            className="rounded-lg overflow-hidden bg-[#0a0b0d] border border-[#d4af37]/40 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-1 bg-[#14151a] border-b border-stone-800/90 flex items-center justify-between gap-1 text-[10px]">
              <span className="flex items-center gap-1 font-semibold text-[#f7e7ce] truncate">
                <Video className="w-3 h-3 text-[#d4af37] shrink-0" />
                <span className="truncate">動画プレビュー</span>
              </span>
            </div>

            <div className="relative w-full h-28 sm:h-32 bg-black flex items-center justify-center flex-1">
              {isLoadingVideo ? (
                <div className="flex flex-col items-center justify-center gap-1.5 text-stone-300 text-[10px] px-2 text-center">
                  <Loader2 className="w-4 h-4 text-[#d4af37] animate-spin" />
                  <span>動画読込中...</span>
                </div>
              ) : resolvedVideoUrl ? (
                <div className="relative w-full h-full min-h-[7rem]">
                  <video
                    key={resolvedVideoUrl}
                    src={resolvedVideoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain bg-black"
                    onError={(event) => {
                      const mediaError = event.currentTarget.error;
                      const message =
                        mediaError?.code === 2
                          ? '動画の読み込み通信に失敗しました。通信環境を確認して再読込してください。'
                          : mediaError?.code === 3
                          ? '動画のデコードに失敗しました。動画ファイルが破損しているか、対応していないコーデックの可能性があります。'
                          : mediaError?.code === 4
                          ? 'この動画形式・コーデックはブラウザで再生できません。MP4（H.264）形式をお試しください。'
                          : '動画の再生に失敗しました。再読込してください。';
                      setVideoPlayError(message);
                    }}
                  />
                  {videoPlayError && (
                    <div className="absolute inset-x-1 bottom-1 p-1.5 rounded bg-black/85 border border-rose-900/60 text-rose-200 text-[9px] text-center space-y-1">
                      <p className="leading-snug">{videoPlayError}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setVideoReloadSeq((n) => n + 1);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700"
                      >
                        <RefreshCw className="w-2.5 h-2.5 text-[#d4af37]" />
                        <span>動画を再読込</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : videoPlayError ? (
                <div className="p-2 text-center text-[10px] text-rose-300 space-y-1.5">
                  <div className="leading-snug">{videoPlayError}</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setVideoReloadSeq((n) => n + 1);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-[10px]"
                  >
                    <RefreshCw className="w-2.5 h-2.5 text-[#d4af37]" />
                    <span>再読込</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Bottom-Right: Switchable 2nd - 5th Additional Images */}
          <div className="rounded-lg overflow-hidden bg-[#0a0b0d] border border-stone-800/90 flex flex-col">
            <div className="px-2 py-1 bg-[#14151a] border-b border-stone-800/90 flex items-center justify-between gap-1 text-[10px]">
              <span className="flex items-center gap-1 font-semibold text-stone-200 truncate">
                <ImageIcon className="w-3 h-3 text-[#d4af37] shrink-0" />
                <span className="truncate">
                  {extraImages.length > 0 ? `画像 ${currentExtraGalleryIndex + 1}` : '追加画像'}
                </span>
              </span>
              {extraImages.length > 0 && (
                <span className="font-mono text-[9px] text-stone-400 shrink-0">
                  {safeExtraIndex + 1}/{extraImages.length}
                </span>
              )}
            </div>

            <div className="relative w-full h-28 sm:h-32 bg-[#08090c] flex items-center justify-center flex-1 overflow-hidden">
              {extraImages.length > 0 ? (
                <>
                  {!failedIndices[currentExtraGalleryIndex] ? (
                    <img
                      src={currentExtraSrc}
                      onClick={() => setPreviewImage(currentExtraSrc)}
                      style={{ cursor: 'zoom-in' }}
                      alt={`${title || gameName} 追加画像 ${currentExtraGalleryIndex + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={() => {
                        setFailedIndices((prev) => ({ ...prev, [currentExtraGalleryIndex]: true }));
                      }}
                    />
                  ) : (
                    <div className="px-2 text-center text-[10px] text-stone-500">
                      画像を読み込めませんでした
                    </div>
                  )}

                  {extraImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevExtra}
                        aria-label="前の追加画像"
                        className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/80 hover:bg-black border border-stone-700 hover:border-[#d4af37]/70 text-stone-200 flex items-center justify-center transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextExtra}
                        aria-label="次の追加画像"
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/80 hover:bg-black border border-stone-700 hover:border-[#d4af37]/70 text-stone-200 flex items-center justify-center transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="p-2 text-center flex flex-col items-center justify-center gap-1 text-stone-500 select-none">
                  <ImageIcon className="w-4 h-4 text-stone-600" />
                  <span className="text-[10px]">追加画像なし</span>
                </div>
              )}
            </div>

            {extraImages.length > 1 && (
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#111216] border-t border-stone-800/80">
                {extraImages.map((src, idx) => {
                  const galleryIdx = idx + 1;
                  const isSelected = idx === safeExtraIndex;
                  return (
                    <button
                      key={`extra-${galleryIdx}-${src.slice(0, 18)}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setExtraIndex(idx);
                      }}
                      aria-label={`追加画像 ${galleryIdx + 1} を表示`}
                      className={`relative h-7 rounded overflow-hidden bg-black border transition-all ${
                        isSelected
                          ? 'border-[#d4af37] ring-1 ring-[#d4af37]/50 opacity-100'
                          : 'border-stone-800 opacity-65 hover:opacity-100 hover:border-stone-600'
                      }`}
                    >
                      {!failedIndices[galleryIdx] ? (
                        <img
                          src={src}
                          onClick={() => setPreviewImage(src)}
                          style={{ cursor: 'zoom-in' }}
                          alt={`追加画像 ${galleryIdx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={() => {
                            setFailedIndices((prev) => ({ ...prev, [galleryIdx]: true }));
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-stone-600">
                          ×
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 px-1 bg-black/80 text-[8px] font-mono text-stone-200 leading-tight">
                        {galleryIdx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="画像を拡大表示"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            aria-label="拡大画像を閉じる"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 z-[101] w-10 h-10 rounded-full bg-black/80 border border-[#d4af37]/60 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={previewImage}
            alt={`${title || gameName} 拡大画像`}
            className="max-w-[96vw] max-h-[90vh] w-auto h-auto object-contain rounded-md"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-stone-300 pointer-events-none">
            画面の外側をタップすると閉じます
          </p>
        </div>
      )}
      </>
    );
  }

  // 4. Layout when Video is NOT Registered (1 to 5 images):
  //    - Top: Main display image (position & size preserved; switches when thumbnail clicked)
  //    - Bottom: Thumbnails for Main + 2nd - 5th images (switches Top image on click)
  const safeIndex = activeIndex < galleryImages.length ? activeIndex : 0;
  const currentSrc = galleryImages[safeIndex];
  const hasMultipleImages = galleryImages.length > 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveIndex((prev) => (prev <= 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveIndex((prev) => (prev >= galleryImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
    <div className="w-full">
      <div className={`relative overflow-hidden bg-[#0a0b0d] rounded-lg border border-stone-800/80 ${className}`}>
        {!failedIndices[safeIndex] ? (
          <img
            src={currentSrc}
            onClick={() => setPreviewImage(currentSrc)}
            style={{ cursor: 'zoom-in' }}
            alt={`${title || gameName} (${safeIndex + 1}/${galleryImages.length})`}
            className={`w-full h-full ${
              isStoneCategory && !hasMultipleImages ? 'object-contain' : 'object-cover'
            } group-hover:scale-105 transition-transform duration-500`}
            loading="lazy"
            onError={() => {
              setFailedIndices((prev) => ({ ...prev, [safeIndex]: true }));
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-stone-500">
            画像を読み込めませんでした
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

        {isStoneCategory && !hasMultipleImages && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/85 border border-[#d4af37]/40 text-[10px] font-semibold text-[#d4af37] pointer-events-none">
            石垢
          </div>
        )}

        {hasMultipleImages && (
          <>
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-[#d4af37]/40 text-[10px] font-semibold text-[#f7e7ce] pointer-events-none">
              {safeIndex === 0 ? 'メイン' : `画像 ${safeIndex + 1}`}
            </div>

            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 border border-stone-700 text-[10px] font-mono text-stone-200 pointer-events-none">
              {safeIndex + 1} / {galleryImages.length}
            </div>

            <button
              type="button"
              onClick={handlePrev}
              aria-label="前の画像"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/75 hover:bg-black border border-stone-700 hover:border-[#d4af37]/60 text-stone-200 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="次の画像"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/75 hover:bg-black border border-stone-700 hover:border-[#d4af37]/60 text-stone-200 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div className="grid grid-cols-5 gap-1.5 mt-2">
          {galleryImages.map((src, idx) => {
            const isSelected = idx === safeIndex;
            return (
              <button
                key={`${idx}-${src.slice(0, 24)}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setActiveIndex(idx);
                }}
                aria-label={idx === 0 ? 'メイン画像を表示' : `画像 ${idx + 1} を表示`}
                className={`relative h-10 sm:h-11 rounded overflow-hidden bg-[#0a0b0d] border transition-all ${
                  isSelected
                    ? 'border-[#d4af37] ring-1 ring-[#d4af37]/50 opacity-100'
                    : 'border-stone-800 opacity-65 hover:opacity-100 hover:border-stone-600'
                }`}
              >
                {!failedIndices[idx] ? (
                  <img
                    src={src}
                    onClick={() => setPreviewImage(src)}
                    style={{ cursor: 'zoom-in' }}
                    alt={`${title || gameName} サムネイル ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => {
                      setFailedIndices((prev) => ({ ...prev, [idx]: true }));
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-stone-600">
                    ×
                  </div>
                )}
                <span
                  className={`absolute bottom-0 left-0 px-1 text-[8px] font-semibold leading-tight ${
                    isSelected ? 'bg-[#d4af37] text-black' : 'bg-black/80 text-stone-300'
                  }`}
                >
                  {idx === 0 ? 'メイン' : idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="画像を拡大表示"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            aria-label="拡大画像を閉じる"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 z-[101] w-10 h-10 rounded-full bg-black/80 border border-[#d4af37]/60 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={previewImage}
            alt={`${title || gameName} 拡大画像`}
            className="max-w-[96vw] max-h-[90vh] w-auto h-auto object-contain rounded-md"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-stone-300 pointer-events-none">
            画面の外側をタップすると閉じます
          </p>
        </div>
      )}
    </>
  );
};
