/**
 * SENA LUXE - Firestore Service
 * Handles data synchronization, atomic serial numbering with Firestore transactions,
 * and security-compliant operations.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  GameTitle,
  ProductItem,
  StoneRatePlan,
  GameRequestItem,
  SerialSequence,
  AdminSettings,
  ProductCategory,
  ProductStatus,
} from '../types';
import {
  INITIAL_GAMES,
  INITIAL_CANDIDATE_GAMES,
  INITIAL_PRODUCTS,
  INITIAL_STONE_RATES,
  INITIAL_SEQUENCES,
  INITIAL_SETTINGS,
} from '../data/initialData';


const PRODUCT_VIDEO_COLLECTION = 'productVideos';
const PRODUCT_VIDEO_MAX_BYTES = 15 * 1024 * 1024;
const PRODUCT_VIDEO_CHUNK_BYTES = 300 * 1024;

// Client-side guard for clearer failures; Firestore Security Rules remain the real boundary.
async function requireAdminForVideoAccess(): Promise<void> {
  const user = auth.currentUser;
  if (!user || !(await checkIsUserAdmin(user.uid, user.email))) {
    throw new Error('動画データへのアクセスには管理者認証が必要です。');
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  }
  return btoa(binary);
}

/**
 * Store a short product video directly from the admin device in Firestore.
 * This intentionally uses the existing Firestore service, not Firebase Storage,
 * Cloudflare R2, YouTube, or any paid video provider.
 */
export async function uploadProductVideoToFirestore(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  await requireAdminForVideoAccess();
  if (!file.type.startsWith('video/')) throw new Error('動画ファイルを選択してください。');
  if (file.size <= 0 || file.size > PRODUCT_VIDEO_MAX_BYTES) {
    throw new Error('動画は15MB以下にしてください。スマホ側で短く録画するか、画質を下げてください。');
  }

  const videoId = `video-${Date.now()}-${crypto.randomUUID()}`;
  const chunkCount = Math.ceil(file.size / PRODUCT_VIDEO_CHUNK_BYTES);
  const chunksRef = collection(db, PRODUCT_VIDEO_COLLECTION, videoId, 'chunks');

  try {
    for (let batchStart = 0; batchStart < chunkCount; batchStart += 5) {
      const batch = writeBatch(db);
      const batchEnd = Math.min(batchStart + 5, chunkCount);
      for (let index = batchStart; index < batchEnd; index += 1) {
        const start = index * PRODUCT_VIDEO_CHUNK_BYTES;
        const end = Math.min(start + PRODUCT_VIDEO_CHUNK_BYTES, file.size);
        const bytes = new Uint8Array(await file.slice(start, end).arrayBuffer());
        batch.set(doc(chunksRef, String(index).padStart(4, '0')), {
          index,
          data: bytesToBase64(bytes),
        });
      }
      await batch.commit();
      onProgress?.(Math.round((batchEnd / chunkCount) * 95));
    }

    await setDoc(doc(db, PRODUCT_VIDEO_COLLECTION, videoId), {
      id: videoId,
      contentType: file.type || 'video/mp4',
      fileName: file.name.slice(0, 120),
      fileSize: file.size,
      chunkCount,
      createdAt: new Date().toISOString(),
    });
    onProgress?.(100);
    return videoId;
  } catch (error) {
    try {
      await deleteProductVideoFromFirestore(videoId);
    } catch (cleanupError) {
      console.warn('Could not clean incomplete video upload:', cleanupError);
    }
    throw error;
  }
}

/** Fetch a saved video only when a visitor presses the play button. */
export async function getProductVideoBlob(videoId: string): Promise<Blob> {
  await requireAdminForVideoAccess();
  const metadata = await getDoc(doc(db, PRODUCT_VIDEO_COLLECTION, videoId));
  if (!metadata.exists()) throw new Error('登録動画が見つかりません。');
  const details = metadata.data();
  const chunkSnapshot = await getDocs(collection(db, PRODUCT_VIDEO_COLLECTION, videoId, 'chunks'));
  const ordered = chunkSnapshot.docs
    .map((snapshot) => snapshot.data() as { index: number; data: string })
    .sort((a, b) => a.index - b.index);

  if (ordered.length !== Number(details.chunkCount)) {
    throw new Error('動画データが不足しています。管理画面から再登録してください。');
  }

  const parts = ordered.map((chunk) => {
    const binary = atob(chunk.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  });
  return new Blob(parts, { type: details.contentType || 'video/mp4' });
}

/** Remove a video after it has been replaced or its product is deleted. */
export async function deleteProductVideoFromFirestore(videoId: string): Promise<void> {
  await requireAdminForVideoAccess();
  const chunks = await getDocs(collection(db, PRODUCT_VIDEO_COLLECTION, videoId, 'chunks'));
  for (let start = 0; start < chunks.docs.length; start += 400) {
    const batch = writeBatch(db);
    chunks.docs.slice(start, start + 400).forEach((snapshot) => batch.delete(snapshot.ref));
    await batch.commit();
  }
  await deleteDoc(doc(db, PRODUCT_VIDEO_COLLECTION, videoId));
}



/**
 * Build sanitized, read-only public mirrors from canonical records.
 * This is an admin-triggered migration step only; it never modifies canonical data.
 * Product videos, private notes, price history, requests, settings, and sequence ledgers
 * are deliberately excluded.
 */
export async function rebuildPublicCatalogMirrors(): Promise<{ games: number; products: number; rates: number; settings: number }> {
  const user = auth.currentUser;
  if (!user || !(await checkIsUserAdmin(user.uid, user.email))) {
    throw new Error('公開カタログの同期には管理者認証が必要です。');
  }

  const [gamesSnap, productsSnap, ratesSnap, settingsSnap, publicGamesSnap, publicProductsSnap, publicRatesSnap, publicSettingsSnap] = await Promise.all([
    getDocs(collection(db, 'games')),
    getDocs(collection(db, 'products')),
    getDocs(collection(db, 'stoneRates')),
    getDoc(doc(db, 'settings', 'general')),
    getDocs(collection(db, 'publicGames')),
    getDocs(collection(db, 'publicProducts')),
    getDocs(collection(db, 'publicStoneRates')),
    getDoc(doc(db, 'publicSettings', 'general')),
  ]);

  const publicGames = gamesSnap.docs
    .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() } as GameTitle))
    .filter((game) => game.isHandled === true)
    .map((game) => ({
      id: game.id,
      code: game.code,
      name: game.name,
      shortName: game.shortName,
      category: game.category,
      currencyName: game.currencyName,
      currencyUnit: game.currencyUnit,
      iconUrl: game.iconUrl || '',
      currencyIconUrl: game.currencyIconUrl || '',
      isHandled: true,
      description: game.description || '',
      order: game.order ?? 999,
    }));

  const publicProducts = productsSnap.docs
    .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() } as ProductItem))
    .filter((product) =>
      product.verifiedForPublic === true &&
      product.status === '掲載中' &&
      (product.category === 'ゲーム内通貨・石垢' || product.category === '引退垢') &&
      typeof product.price === 'number' &&
      product.price > 0 &&
      Boolean(product.title?.trim()) &&
      Boolean(product.summary?.trim())
    )
    .map((product) => ({
      id: product.id,
      productNumber: product.productNumber,
      gameId: product.gameId,
      gameCode: product.gameCode,
      gameName: product.gameName,
      category: product.category,
      title: product.title,
      summary: product.summary,
      price: product.price,
      status: '掲載中' as const,
      verifiedForPublic: true,
      imageUrl: product.imageUrl || '',
      deviceCompatibility: product.deviceCompatibility || '',
      keyHighlights: Array.isArray(product.keyHighlights) ? product.keyHighlights.slice(0, 5) : [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      order: product.order ?? 0,
    }));

  const publicRates = ratesSnap.docs
    .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() } as StoneRatePlan))
    .filter((rate) =>
      rate.verifiedForPublic === true &&
      rate.status === '取扱中' &&
      rate.isPreparation === false &&
      typeof rate.currentPrice === 'number' &&
      rate.currentPrice > 0 &&
      Boolean(rate.currencyAmount?.trim()) &&
      Boolean(rate.planName?.trim()) &&
      Boolean(rate.conditions?.trim())
    )
    .map((rate) => ({
      id: rate.id,
      gameId: rate.gameId,
      gameCode: rate.gameCode,
      gameName: rate.gameName,
      planName: rate.planName,
      currencyName: rate.currencyName,
      currencyAmount: rate.currencyAmount,
      conditions: rate.conditions,
      currentPrice: rate.currentPrice,
      confirmedDate: rate.confirmedDate,
      status: '取扱中' as const,
      stockStatus: '在庫要確認',
      isPreparation: false,
      verifiedForPublic: true,
    }));

  // Only fields intended for customer-facing display are copied. Internal settings stay private.
  const sourceSettings = settingsSnap.exists() ? settingsSnap.data() : {};
  const publicSettings = {
    lineUrl: typeof sourceSettings.lineUrl === 'string' ? sourceSettings.lineUrl : '',
    shopNotice: typeof sourceSettings.shopNotice === 'string' ? sourceSettings.shopNotice : '',
    enableDirectLineCopy: sourceSettings.enableDirectLineCopy === true,
    contactDeskHours: typeof sourceSettings.contactDeskHours === 'string' ? sourceSettings.contactDeskHours : '公式LINEにてご案内',
  };

  const desired = [
    { collectionName: 'publicGames', rows: publicGames, existing: publicGamesSnap.docs },
    { collectionName: 'publicProducts', rows: publicProducts, existing: publicProductsSnap.docs },
    { collectionName: 'publicStoneRates', rows: publicRates, existing: publicRatesSnap.docs },
  ];

  let batch = writeBatch(db);
  let operationCount = 0;
  const commitIfNeeded = async () => {
    if (operationCount >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }
  };

  for (const group of desired) {
    const allowedIds = new Set(group.rows.map((row) => row.id));
    for (const row of group.rows) {
      batch.set(doc(db, group.collectionName, row.id), row);
      operationCount += 1;
      await commitIfNeeded();
    }
    // Remove stale public mirrors only; canonical source records are untouched.
    for (const stale of group.existing) {
      if (!allowedIds.has(stale.id)) {
        batch.delete(stale.ref);
        operationCount += 1;
        await commitIfNeeded();
      }
    }
  }
  if (operationCount > 0) await batch.commit();

  // Settings are a single explicitly allowlisted public document.
  await setDoc(doc(db, 'publicSettings', 'general'), publicSettings);

  return { games: publicGames.length, products: publicProducts.length, rates: publicRates.length, settings: 1 };
}

const COLLECTIONS = {
  GAMES: 'games',
  PRODUCTS: 'products',
  STONE_RATES: 'stoneRates',
  SEQUENCES: 'sequences',
  REQUESTS: 'requests',
  SETTINGS: 'settings',
  ADMINS: 'admins',
};

/**
 * Add-only catalog sync to Firestore.
 * Creates missing records only; existing products, prices, histories, icons, and sequence ledgers are never overwritten.
 */
export async function syncAllStoneRatesAndGamesToFirestore(): Promise<{ gamesSynced: number; ratesSynced: number }> {
  try {
    // Defense in depth: this helper reads canonical games, rates, and sequence ledgers.
    // Do not rely only on the dashboard being hidden from non-admin users.
    const user = auth.currentUser;
    if (!user || !(await checkIsUserAdmin(user.uid, user.email))) {
      throw new Error('マスターカタログの同期には管理者認証が必要です。');
    }

    console.log('Initiating safe catalog sync to Firestore...');
    const [gamesSnapshot, ratesSnapshot, sequencesSnapshot] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.GAMES)),
      getDocs(collection(db, COLLECTIONS.STONE_RATES)),
      getDocs(collection(db, COLLECTIONS.SEQUENCES)),
    ]);

    const existingGameIds = new Set(gamesSnapshot.docs.map((d) => d.id));
    const existingRateIds = new Set(ratesSnapshot.docs.map((d) => d.id));
    const existingSequenceIds = new Set(sequencesSnapshot.docs.map((d) => d.id));
    const batch = writeBatch(db);
    let gamesSynced = 0;
    let ratesSynced = 0;

    // Create only missing game records. Existing icons and admin edits are never overwritten.
    const allGames = [...INITIAL_GAMES, ...INITIAL_CANDIDATE_GAMES];
    for (const game of allGames) {
      if (existingGameIds.has(game.id)) continue;
      batch.set(doc(db, COLLECTIONS.GAMES, game.id), game);
      gamesSynced += 1;
    }

    // Create only missing sequence ledgers. Existing numbering and retired numbers are preserved.
    for (const [code, seq] of Object.entries(INITIAL_SEQUENCES)) {
      if (existingSequenceIds.has(code)) continue;
      batch.set(doc(db, COLLECTIONS.SEQUENCES, code), seq);
    }

    // Create only missing stone plans in preparation state. Never overwrite prices or histories.
    for (const plan of INITIAL_STONE_RATES) {
      if (existingRateIds.has(plan.id)) continue;
      batch.set(doc(db, COLLECTIONS.STONE_RATES, plan.id), {
        ...plan,
        referencePrice: 0,
        currentPrice: null,
        confirmedDate: '価格確認中',
        status: '現在準備中',
        stockStatus: '在庫要確認',
        isPreparation: true,
        verifiedForPublic: false,
      });
      ratesSynced += 1;
    }

    if (gamesSynced + ratesSynced > 0 || Object.keys(INITIAL_SEQUENCES).some((code) => !existingSequenceIds.has(code))) {
      await batch.commit();
    }
    console.log(`Safe Firestore sync complete: ${gamesSynced} new games, ${ratesSynced} new rate plans. Existing records were preserved.`);
    return { gamesSynced, ratesSynced };
  } catch (error) {
    console.warn('syncAllStoneRatesAndGamesToFirestore notice:', error);
    return { gamesSynced: 0, ratesSynced: 0 };
  }
}

// Seed master data if collections are empty or need update
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    // Defense in depth: never inspect or seed canonical collections from a public session.
    const user = auth.currentUser;
    if (!user || !(await checkIsUserAdmin(user.uid, user.email))) {
      console.info('Skipping canonical Firestore seed: administrator authentication required.');
      return;
    }

    const gamesSnapshot = await getDocs(collection(db, COLLECTIONS.GAMES));
    const ratesSnapshot = await getDocs(collection(db, COLLECTIONS.STONE_RATES));

    // If catalog collections are incomplete, add only missing records
    if (gamesSnapshot.empty || ratesSnapshot.empty || gamesSnapshot.size < INITIAL_GAMES.length || ratesSnapshot.size < INITIAL_STONE_RATES.length) {
      console.log('Syncing / Seeding SENA LUXE catalog into Firestore...');
      await syncAllStoneRatesAndGamesToFirestore();

      // Seed Products if none exist (do not overwrite existing products)
      const prodsSnap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
      if (prodsSnap.empty) {
        const prodBatch = writeBatch(db);
        for (const product of INITIAL_PRODUCTS) {
          prodBatch.set(doc(db, COLLECTIONS.PRODUCTS, product.id), product);
        }
        await prodBatch.commit();
      }

      // Seed Settings if not exists
      const settingsSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'general'));
      if (!settingsSnap.exists()) {
        await setDoc(doc(db, COLLECTIONS.SETTINGS, 'general'), INITIAL_SETTINGS);
      }
    }
  } catch (error) {
    console.warn('Initial seeding note (will fallback if permissions not yet seeded):', error);
  }
}

// Atomic Product Issuance with Firestore Transaction
export async function createProductAtomic(data: {
  gameId: string;
  gameCode: string;
  gameName: string;
  category: ProductCategory;
  title: string;
  summary: string;
  price: number | null;
  imageUrl?: string;
  videoUrl?: string;
  videoStorageId?: string;
  deviceCompatibility?: ProductItem['deviceCompatibility'];
  currencyIconUrl?: string;
  keyHighlights: string[];
  status?: ProductStatus;
  verifiedForPublic?: boolean;
}): Promise<ProductItem> {
  const code = data.gameCode.toUpperCase();
  const seqDocRef = doc(db, COLLECTIONS.SEQUENCES, code);

  try {
    const newProduct = await runTransaction(db, async (transaction) => {
      const seqDoc = await transaction.get(seqDocRef);

      let lastSequence = 0;
      let retiredNumbers: SerialSequence['retiredNumbers'] = [];

      if (seqDoc.exists()) {
        const seqData = seqDoc.data() as SerialSequence;
        lastSequence = seqData.lastSequence || 0;
        retiredNumbers = seqData.retiredNumbers || [];
      }

      const nextSequence = lastSequence + 1;
      const formattedSeq = String(nextSequence).padStart(3, '0');
      const productNumber = `SL-${code}-${formattedSeq}`;

      const nowStr = new Date().toISOString();
      const newProdId = `prod-${code.toLowerCase()}-${Date.now()}`;
      const prodDocRef = doc(db, COLLECTIONS.PRODUCTS, newProdId);

      const productToSave: ProductItem = {
        id: newProdId,
        productNumber,
        gameId: data.gameId,
        gameCode: code,
        gameName: data.gameName,
        category: data.category,
        title: data.title,
        summary: data.summary,
        price: data.price,
        status: data.status || '掲載停止',
        verifiedForPublic: data.verifiedForPublic === true,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        videoStorageId: data.videoStorageId,
        deviceCompatibility: data.deviceCompatibility,
        currencyIconUrl: data.currencyIconUrl,
        keyHighlights: data.keyHighlights,
        createdAt: nowStr,
        updatedAt: nowStr,
      };

      const updatedRetired = [
        ...retiredNumbers,
        {
          productNumber,
          productTitle: data.title,
          issuedAt: nowStr.split('T')[0],
          reason: '新規商品登録により安全発番',
        },
      ];

      // Atomic Writes in transaction
      transaction.set(prodDocRef, productToSave);
      transaction.set(
        seqDocRef,
        {
          gameCode: code,
          lastSequence: nextSequence,
          retiredNumbers: updatedRetired,
        },
        { merge: true }
      );

      return productToSave;
    });

    return newProduct;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.PRODUCTS);
  }
}

// Product Update
export async function updateProductDoc(id: string, updates: Partial<ProductItem>): Promise<void> {
  try {
    const prodRef = doc(db, COLLECTIONS.PRODUCTS, id);
    await updateDoc(prodRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.PRODUCTS}/${id}`);
  }
}

// Product Deletion (permanently retiring the number in sequences ledger)
export async function deleteProductDoc(product: ProductItem, reason: string = '管理者による商品削除'): Promise<void> {
  const code = product.gameCode.toUpperCase();
  const seqDocRef = doc(db, COLLECTIONS.SEQUENCES, code);
  const prodRef = doc(db, COLLECTIONS.PRODUCTS, product.id);

  try {
    await runTransaction(db, async (transaction) => {
      const seqDoc = await transaction.get(seqDocRef);
      if (seqDoc.exists()) {
        const seqData = seqDoc.data() as SerialSequence;
        const retiredList = seqData.retiredNumbers || [];

        const updated = retiredList.map((r) =>
          r.productNumber === product.productNumber
            ? {
                ...r,
                retiredAt: new Date().toISOString().split('T')[0],
                reason: `${r.reason} -> 永久欠番化 (${reason})`,
              }
            : r
        );

        transaction.update(seqDocRef, { retiredNumbers: updated });
      }

      transaction.delete(prodRef);
    });
    if (product.videoStorageId) {
      try {
        await deleteProductVideoFromFirestore(product.videoStorageId);
      } catch (videoError) {
        console.warn('Deleted product but could not remove its video chunks:', videoError);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.PRODUCTS}/${product.id}`);
  }
}

// Update Stone Rate Price with history
export async function updateStoneRatePriceDoc(
  planId: string,
  existingPlan: StoneRatePlan,
  newPrice: number | null,
  reason: string
): Promise<void> {
  const planRef = doc(db, COLLECTIONS.STONE_RATES, planId);
  const now = new Date();
  const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

  const oldPrice = existingPlan.verifiedForPublic ? existingPlan.currentPrice : null;
  const history =
    oldPrice !== null && newPrice !== null && newPrice !== oldPrice
      ? [
          {
            date: dateStr,
            oldPrice,
            newPrice,
            reason: reason || '管理者による価格改定',
          },
          ...(existingPlan.priceHistory || []),
        ]
      : existingPlan.priceHistory || [];

  try {
    await updateDoc(planRef, {
      currentPrice: newPrice,
      confirmedDate: dateStr,
      status: newPrice === null ? '価格確認中' : '現在準備中',
      isPreparation: true,
      verifiedForPublic: false,
      priceHistory: history,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.STONE_RATES}/${planId}`);
  }
}

// Add New Stone Rate Plan
export async function addStoneRatePlanDoc(plan: Omit<StoneRatePlan, 'id' | 'priceHistory'>): Promise<void> {
  const newId = `rate-${plan.gameCode.toLowerCase()}-${Date.now()}`;
  try {
    await setDoc(doc(db, COLLECTIONS.STONE_RATES, newId), {
      ...plan,
      id: newId,
      priceHistory: [],
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTIONS.STONE_RATES}/${newId}`);
  }
}

// Update stone rate plan document
export async function updateStoneRateDoc(id: string, updates: Partial<StoneRatePlan>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.STONE_RATES, id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.STONE_RATES}/${id}`);
  }
}

// Add New Game Title
export async function addGameDoc(game: GameTitle): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.GAMES, game.id), game);
    // Initialize sequence ledger if not exists
    const code = game.code.toUpperCase();
    const seqRef = doc(db, COLLECTIONS.SEQUENCES, code);
    const seqSnap = await getDoc(seqRef);
    if (!seqSnap.exists()) {
      await setDoc(seqRef, {
        gameCode: code,
        lastSequence: 0,
        retiredNumbers: [],
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTIONS.GAMES}/${game.id}`);
  }
}

// Game details update
export async function updateGameDoc(id: string, updates: Partial<GameTitle>): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.GAMES, id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.GAMES}/${id}`);
  }
}

// Promote Candidate Game to Handled
export async function promoteCandidateDoc(candidate: GameTitle): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.GAMES, candidate.id), {
      isHandled: true,
    });

    // Do not create a sample plan or estimated price when a title is promoted.
    // A real plan must be entered and explicitly verified by an admin.
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.GAMES}/${candidate.id}`);
  }
}

// Submit Game Request (Public Write)
export async function submitGameRequestDoc(
  req: Omit<GameRequestItem, 'id' | 'createdAt' | 'status'>
): Promise<GameRequestItem> {
  const newId = `req-${crypto.randomUUID()}`;
  const newItem: GameRequestItem = {
    ...req,
    id: newId,
    createdAt: new Date().toISOString(),
    status: '受付済',
  };

  try {
    await setDoc(doc(db, COLLECTIONS.REQUESTS, newId), newItem);
    return newItem;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTIONS.REQUESTS}/${newId}`);
  }
}

// Update Game Request Status (Admin only)
export async function updateRequestStatusDoc(
  id: string,
  status: GameRequestItem['status'],
  adminNotes?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.REQUESTS, id), {
      status,
      ...(adminNotes !== undefined ? { adminNotes } : {}),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.REQUESTS}/${id}`);
  }
}

// Save Settings
export async function saveSettingsDoc(updates: Partial<AdminSettings>): Promise<void> {
  try {
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'general'), updates, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.SETTINGS}/general`);
  }
}

// Check Admin role on server
export async function checkIsUserAdmin(uid: string, email?: string | null): Promise<boolean> {
  if (email === 'ked160117@gmail.com' || uid === 'cjUzsc6SK4ZBrsddvFQjuhPphBA2') {
    return true;
  }
  try {
    const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, uid));
    return adminDoc.exists();
  } catch {
    return false;
  }
}

// Ensure Admin document exists in Firestore 'admins' collection
export async function ensureAdminDocument(uid: string, email: string): Promise<void> {
  try {
    const adminRef = doc(db, COLLECTIONS.ADMINS, uid);
    const snap = await getDoc(adminRef);
    if (!snap.exists()) {
      await setDoc(adminRef, {
        uid,
        email,
        role: 'super_admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`Admin document registered: admins/${uid}`);
    }
  } catch (error) {
    console.warn('ensureAdminDocument notice:', error);
  }
}
