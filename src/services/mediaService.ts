/**
 * SENA LUXE - Card-Free Media Optimization & Chunked Firestore Storage Service
 *
 * Works 100% on Firebase Spark (free) plan without credit card registration or paid storage:
 * 1. Automatically resizes & compresses product/icon images (WebP / JPEG) under ~220KB
 *    so high-resolution smartphone photos never exceed Firestore's 1MB document limit.
 * 2. Stores videos up to 10MB safely:
 *    - Compact videos that fit comfortably inside the product document stay inline.
 *    - Larger videos (and overflow payloads) are split into <=550KB chunks in the
 *      `productMedia` Firestore collection and referenced via `fs-media://<mediaId>`,
 *      completely preventing the 1MB single-document limit error during registration.
 */

import { doc, getDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const PRODUCT_MEDIA_COLLECTION = 'productMedia';
export const FS_MEDIA_PREFIX = 'fs-media://';

export const MAX_PRODUCT_IMAGES = 5;
export const PRODUCT_IMAGE_MAX_DIMENSION = 1024;
export const PRODUCT_IMAGE_TARGET_CHARS = 120_000; // ~120KB per photo so 5 photos stay safely under Firestore 1MB limit
export const MAX_RAW_IMAGE_INPUT_BYTES = 20 * 1024 * 1024; // 20 MB raw photo input allowed
export const MAX_VIDEO_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB video input (chunked in Firestore)
const INLINE_VIDEO_MAX_DATAURL_CHARS = 420_000; // keep inline only when ~<= 310KB raw
const CHUNK_CHAR_SIZE = 550_000; // safely below 1,048,487 bytes per Firestore document

interface ProductMediaMetaDoc {
  id: string;
  kind: 'video' | 'image';
  mimeType: string;
  fileName: string;
  totalSize: number;
  totalChunks: number;
  createdAt: string;
}

interface ProductMediaChunkDoc {
  mediaId: string;
  index: number;
  data: string;
}

const resolvedBlobUrlCache = new Map<string, string>();
const inFlightResolutions = new Map<string, Promise<string>>();

/**
 * Normalizes video MIME types so iPhone .mov (`video/quicktime`) or empty/generic
 * `application/octet-stream` files resolve to browser-compatible `<video>` MIME types.
 */
export function normalizeVideoMimeType(mimeType?: string | null, fileName?: string | null): string {
  const cleanMime = (mimeType || '').split(';')[0].trim().toLowerCase();
  const lowerName = (fileName || '').toLowerCase();

  if (cleanMime === 'video/webm' || lowerName.endsWith('.webm')) {
    return 'video/webm';
  }
  if (cleanMime === 'video/ogg' || lowerName.endsWith('.ogg') || lowerName.endsWith('.ogv')) {
    return 'video/ogg';
  }
  // Never label QuickTime/MOV bytes as MP4: MIME relabeling does not transcode
  // the container and can cause mobile browsers to reject the video.
  if (cleanMime === 'video/quicktime' || lowerName.endsWith('.mov')) {
    return 'video/quicktime';
  }
  if (
    cleanMime === 'video/mp4' ||
    cleanMime === 'video/x-m4v' ||
    lowerName.endsWith('.m4v') ||
    lowerName.endsWith('.mp4')
  ) {
    return 'video/mp4';
  }
  if (!cleanMime || cleanMime === 'application/octet-stream') {
    // For unknown file types only use MP4 when there is no stronger signal.
    return 'video/mp4';
  }
  if (cleanMime.startsWith('video/')) {
    return cleanMime;
  }
  return 'video/mp4';
}

function normalizeInlineVideoDataUrl(
  dataUrl: string,
  fallbackMime?: string,
  fileName?: string
): string {
  if (!dataUrl.startsWith('data:')) return dataUrl;
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return dataUrl;

  const header = dataUrl.slice(5, commaIdx);
  const rawMime = header.split(';')[0].trim();
  const normalizedMime = normalizeVideoMimeType(rawMime || fallbackMime, fileName);
  const restHeader = header.includes(';') ? header.slice(header.indexOf(';')) : ';base64';
  return `data:${normalizedMime}${restHeader}${dataUrl.slice(commaIdx)}`;
}

/**
 * Decodes a Base64 Data URL directly into a Blob URL without `fetch(dataUrl)`,
 * preventing data-URL size/MIME issues across mobile & desktop browsers.
 */
function dataUrlToBlobUrl(dataUrl: string, fallbackMime?: string, fileName?: string): string {
  const commaIdx = dataUrl.indexOf(',');
  const header = dataUrl.startsWith('data:') && commaIdx !== -1 ? dataUrl.slice(5, commaIdx) : '';
  const headerMime = header.split(';')[0].trim();
  const resolvedMime = normalizeVideoMimeType(headerMime || fallbackMime, fileName);

  const rawBase64 = (commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl).replace(/\s+/g, '');
  if (!rawBase64) {
    throw new Error('動画データが空です。');
  }

  // Decode in 64KB multiples of 4 characters to maintain valid base64 quartet alignment
  const SLICE_CHARS = 65536;
  const byteArrays: BlobPart[] = [];

  for (let offset = 0; offset < rawBase64.length; offset += SLICE_CHARS) {
    const chunkStr = rawBase64.slice(offset, offset + SLICE_CHARS);
    const binary = atob(chunkStr);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    byteArrays.push(bytes);
  }

  const blob = new Blob(byteArrays, { type: resolvedMime });
  return URL.createObjectURL(blob);
}

export function isChunkedMediaUrl(url?: string | null): boolean {
  return Boolean(url && url.startsWith(FS_MEDIA_PREFIX));
}

export function extractMediaId(url: string): string {
  return url.slice(FS_MEDIA_PREFIX.length).trim();
}

export function estimateUtf8Bytes(value: unknown): number {
  const json = JSON.stringify(value);
  return new TextEncoder().encode(json).length;
}

export async function verifyFileReadable(file: File, label: '画像' | '動画'): Promise<void> {
  try {
    const headSlice = await file.slice(0, 1).arrayBuffer();
    if (file.size === 0 || headSlice.byteLength === 0) {
      throw new Error('EXPIRED_OR_EMPTY_FILE');
    }
  } catch (sliceErr: any) {
    const errName = sliceErr?.name || '';
    if (
      sliceErr?.message === 'EXPIRED_OR_EMPTY_FILE' ||
      errName === 'NotReadableError' ||
      errName === 'NotFoundError' ||
      errName === 'SecurityError'
    ) {
      throw new Error(
        `選択された${label}ファイルの参照が失効したか、端末側でファイルにアクセスできません（一時キャッシュ切れ・ファイル移動・権限変更などの可能性があります）。${
          label === '動画'
            ? '「動画を削除」を押してから動画を再選択するか、動画なしで登録してください。'
            : '再度画像を選択してください。'
        }`
      );
    }
    throw new Error(
      `${label}ファイルの事前検証中に読み込みエラーが発生しました（${sliceErr?.message || '不明なエラー'}）。ファイルを再選択してください。`
    );
  }
}

export function readFileAsDataUrl(file: File, label: '画像' | '動画'): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string' && result.length > 0) {
        resolve(result);
      } else {
        reject(
          new Error(
            `${label}データの読み込み結果が空でした。Fileオブジェクトの参照が失効した可能性があるため、再度ファイルを選択してください。`
          )
        );
      }
    };
    reader.onerror = () => {
      const domErrName = reader.error?.name || '';
      if (domErrName === 'NotReadableError' || domErrName === 'NotFoundError') {
        reject(
          new Error(
            `${label}ファイルを読み込めませんでした（${domErrName}：ファイルの参照が失効、または移動・削除された可能性があります）。再度ファイルを選択してください。`
          )
        );
      } else if (domErrName === 'SecurityError') {
        reject(
          new Error(
            `セキュリティ制限により${label}ファイルを読み込めませんでした。別のファイルを選択してください。`
          )
        );
      } else {
        reject(
          new Error(
            `${label}ファイルの読み込みに失敗しました（${reader.error?.message || '読み込みエラー'}）。ファイルを再選択してください。`
          )
        );
      }
    };
    reader.onabort = () => {
      reject(new Error(`${label}ファイルの読み込みが中断されました。再度お試しください。`));
    };

    try {
      reader.readAsDataURL(file);
    } catch (readErr: any) {
      reject(
        new Error(
          `${label}ファイルの読み込み開始に失敗しました（${readErr?.message || '参照エラー'}）。ファイルを再選択してください。`
        )
      );
    }
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error('画像のデコードに失敗しました。JPG・PNG・WebP形式の画像を選択してください。'));
    img.src = src;
  });
}

/**
 * Compresses an uploaded image file via Canvas (WebP with JPEG fallback) so even
 * up to 5 high-resolution smartphone screenshots fit comfortably within Firestore's 1MB limit.
 */
export async function optimizeImageForFirestore(
  file: File,
  options: { maxDimension?: number; targetMaxChars?: number } = {}
): Promise<string> {
  await verifyFileReadable(file, '画像');

  if (file.size > MAX_RAW_IMAGE_INPUT_BYTES) {
    throw new Error('画像ファイルが大きすぎます（20MB以下の画像を選択してください）。');
  }

  const rawDataUrl = await readFileAsDataUrl(file, '画像');

  const initialMaxDim = options.maxDimension ?? PRODUCT_IMAGE_MAX_DIMENSION;
  const targetMaxChars = options.targetMaxChars ?? PRODUCT_IMAGE_TARGET_CHARS;

  // Preserve small animated GIFs directly if already compact
  if (file.type === 'image/gif' && rawDataUrl.length <= targetMaxChars) {
    return rawDataUrl;
  }

  const img = await loadImageElement(rawDataUrl);

  const scaleSteps = [1, 0.8, 0.65, 0.5, 0.38];
  const qualitySteps = [0.82, 0.7, 0.58, 0.45, 0.35];

  let bestDataUrl = '';

  for (const scale of scaleSteps) {
    const maxDim = Math.round(initialMaxDim * scale);
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width > height) {
      if (width > maxDim) {
        height = Math.max(1, Math.round((height * maxDim) / width));
        width = maxDim;
      }
    } else if (height > maxDim) {
      width = Math.max(1, Math.round((width * maxDim) / height));
      height = maxDim;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('画像最適化用の描画コンテキストを取得できませんでした。');
    }

    ctx.drawImage(img, 0, 0, width, height);

    for (const quality of qualitySteps) {
      const webpUrl = canvas.toDataURL('image/webp', quality);
      const jpegUrl = canvas.toDataURL('image/jpeg', quality);
      const candidate = webpUrl.startsWith('data:image/webp') && webpUrl.length <= jpegUrl.length
        ? webpUrl
        : jpegUrl;

      if (!bestDataUrl || candidate.length < bestDataUrl.length) {
        bestDataUrl = candidate;
      }
      if (candidate.length <= targetMaxChars) {
        return candidate;
      }
    }
  }

  if (bestDataUrl && bestDataUrl.length <= 350_000) {
    return bestDataUrl;
  }

  throw new Error(
    '画像の圧縮後も容量上限を超えています。解像度の低い画像をお選びいただくか、画像URLをご入力ください。'
  );
}

/**
 * Saves a product video cleanly within Firestore Spark free tier:
 * - Compact videos (< ~310KB raw) stay inline if the combined product document fits safely.
 * - Larger videos (up to 10MB) are stored in `productMedia` chunk documents and referenced
 *   via `fs-media://<mediaId>`, avoiding the 1MB Firestore single-document limit error.
 */
export async function saveVideoForProduct(
  file: File,
  existingImages?: string | string[]
): Promise<string> {
  await verifyFileReadable(file, '動画');

  if (file.size > MAX_VIDEO_INPUT_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `選択された動画ファイル（${sizeMb}MB）が上限（10MB）を超えています。10MB以下の動画を選択するか、外部動画URLをご入力いただくか、「動画を削除」を押して画像のみで登録してください。`
    );
  }

  const rawDataUrl = await readFileAsDataUrl(file, '動画');
  const dataUrl = normalizeInlineVideoDataUrl(rawDataUrl, file.type, file.name);
  const existingImageLen = Array.isArray(existingImages)
    ? existingImages.reduce((sum, url) => sum + (url ? url.length : 0), 0)
    : existingImages
    ? existingImages.length
    : 0;

  // Keep tiny videos inline to avoid extra Firestore reads
  if (
    dataUrl.length <= INLINE_VIDEO_MAX_DATAURL_CHARS &&
    dataUrl.length + existingImageLen <= 750_000
  ) {
    return dataUrl;
  }

  // Otherwise split into Firestore `productMedia` chunks (~550KB per doc)
  const mediaId = `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const totalChunks = Math.ceil(dataUrl.length / CHUNK_CHAR_SIZE);
  const nowStr = new Date().toISOString();
  const normalizedMime = normalizeVideoMimeType(file.type, file.name);

  const metaDoc: ProductMediaMetaDoc = {
    id: mediaId,
    kind: 'video',
    mimeType: normalizedMime,
    fileName: file.name.slice(0, 120),
    totalSize: file.size,
    totalChunks,
    createdAt: nowStr,
  };

  try {
    const ops: Array<{ ref: ReturnType<typeof doc>; data: ProductMediaMetaDoc | ProductMediaChunkDoc }> = [
      {
        ref: doc(db, PRODUCT_MEDIA_COLLECTION, mediaId),
        data: metaDoc,
      },
    ];

    for (let i = 0; i < totalChunks; i++) {
      const slice = dataUrl.slice(i * CHUNK_CHAR_SIZE, (i + 1) * CHUNK_CHAR_SIZE);
      ops.push({
        ref: doc(db, PRODUCT_MEDIA_COLLECTION, `${mediaId}_chunk_${i}`),
        data: {
          mediaId,
          index: i,
          data: slice,
        },
      });
    }

    // Commit in batches of 10 docs (~5.5MB max per batch) for reliable Spark-tier writes
    const BATCH_LIMIT = 10;
    for (let start = 0; start < ops.length; start += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const slice = ops.slice(start, start + BATCH_LIMIT);
      for (const item of slice) {
        batch.set(item.ref, item.data);
      }
      await batch.commit();
    }

    // Cache playable blob URL immediately so UI preview stays instant
    try {
      const blobUrl = dataUrlToBlobUrl(dataUrl, normalizedMime, file.name);
      resolvedBlobUrlCache.set(`${FS_MEDIA_PREFIX}${mediaId}`, blobUrl);
    } catch {
      // Cache warm-up is best-effort only
    }

    return `${FS_MEDIA_PREFIX}${mediaId}`;
  } catch (err: any) {
    const rawMsg = err?.message || String(err);
    if (rawMsg.includes('permission') || rawMsg.includes('Missing or insufficient')) {
      throw new Error(
        '大容量動画用のFirestoreチャンク領域への書き込み権限が確認できませんでした。300KB以下の軽量動画・外部動画URLをご使用いただくか、「動画を削除」を押して画像のみで登録してください。'
      );
    }
    throw new Error(
      `動画データの保存中にエラーが発生しました（${rawMsg}）。「動画を削除」を押して画像のみで登録するか、別の動画をお試しください。`
    );
  }
}

/**
 * Resolves `fs-media://<mediaId>` and `data:` video URLs into a cached, browser-compatible
 * Blob URL for `<video>` tags. Lifecycle of cached Blob URLs is managed solely here
 * (components MUST NOT revoke URLs returned by this function).
 */
export async function resolveMediaPlayableUrl(url?: string | null): Promise<string> {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Convert inline data: video URLs to Blob URLs with normalized MIME so `<video>` plays reliably
  if (trimmed.startsWith('data:')) {
    const cached = resolvedBlobUrlCache.get(trimmed);
    if (cached) return cached;
    try {
      const blobUrl = dataUrlToBlobUrl(trimmed);
      resolvedBlobUrlCache.set(trimmed, blobUrl);
      return blobUrl;
    } catch {
      return trimmed;
    }
  }

  if (!isChunkedMediaUrl(trimmed)) return trimmed;

  const cached = resolvedBlobUrlCache.get(trimmed);
  if (cached) return cached;

  const existingFlight = inFlightResolutions.get(trimmed);
  if (existingFlight) return existingFlight;

  const mediaId = extractMediaId(trimmed);
  if (!mediaId) return '';

  const promise = (async () => {
    const metaSnap = await getDoc(doc(db, PRODUCT_MEDIA_COLLECTION, mediaId));
    if (!metaSnap.exists()) {
      throw new Error('動画メタデータが見つかりません。');
    }

    const meta = metaSnap.data() as ProductMediaMetaDoc;
    const totalChunks = typeof meta.totalChunks === 'number' ? meta.totalChunks : 0;
    if (totalChunks <= 0) {
      throw new Error('動画チャンク情報が空です。');
    }

    const chunkPromises: Array<Promise<string>> = [];
    for (let i = 0; i < totalChunks; i++) {
      chunkPromises.push(
        getDoc(doc(db, PRODUCT_MEDIA_COLLECTION, `${mediaId}_chunk_${i}`)).then((snap) => {
          if (!snap.exists()) {
            throw new Error(`動画チャンク(${i})が見つかりません。`);
          }
          const chunkData = snap.data() as ProductMediaChunkDoc;
          return chunkData.data;
        })
      );
    }

    const parts = await Promise.all(chunkPromises);
    const fullDataUrl = parts.join('');
    const blobUrl = dataUrlToBlobUrl(fullDataUrl, meta.mimeType, meta.fileName);
    resolvedBlobUrlCache.set(trimmed, blobUrl);
    return blobUrl;
  })();

  inFlightResolutions.set(trimmed, promise);
  try {
    return await promise;
  } finally {
    inFlightResolutions.delete(trimmed);
  }
}

/**
 * Cleans up chunked `fs-media://` documents from Firestore when a product or video is deleted.
 */
export async function deleteChunkedMediaIfManaged(url?: string | null): Promise<void> {
  if (!isChunkedMediaUrl(url)) return;
  const mediaId = extractMediaId(url!);
  if (!mediaId) return;

  try {
    const cached = resolvedBlobUrlCache.get(url!);
    if (cached && cached.startsWith('blob:')) {
      URL.revokeObjectURL(cached);
    }
    resolvedBlobUrlCache.delete(url!);

    const metaRef = doc(db, PRODUCT_MEDIA_COLLECTION, mediaId);
    const metaSnap = await getDoc(metaRef);
    if (!metaSnap.exists()) return;

    const meta = metaSnap.data() as ProductMediaMetaDoc;
    const deletions: Array<Promise<void>> = [deleteDoc(metaRef)];
    for (let i = 0; i < meta.totalChunks; i++) {
      deletions.push(deleteDoc(doc(db, PRODUCT_MEDIA_COLLECTION, `${mediaId}_chunk_${i}`)));
    }
    await Promise.all(deletions);
  } catch {
    // Non-blocking cleanup
  }
}
