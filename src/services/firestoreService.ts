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
 * Bulk sync all 36 games and 118 stone rate plans to Firestore using safe batches.
 * Preserves existing documents and merges updates safely without deleting products or sequence ledgers.
 */
export async function syncAllStoneRatesAndGamesToFirestore(): Promise<{ gamesSynced: number; ratesSynced: number }> {
  try {
    console.log('Initiating bulk sync of games and stone rates to Firestore...');
    const batch = writeBatch(db);

    // 1. Sync Games
    const allGames = [...INITIAL_GAMES, ...INITIAL_CANDIDATE_GAMES];
    for (const game of allGames) {
      const ref = doc(db, COLLECTIONS.GAMES, game.id);
      batch.set(ref, game, { merge: true });
    }

    // 2. Sync Sequences for all game codes
    for (const [code, seq] of Object.entries(INITIAL_SEQUENCES)) {
      const ref = doc(db, COLLECTIONS.SEQUENCES, code);
      // Use merge to prevent overwriting existing lastSequence or retired numbers
      batch.set(ref, seq, { merge: true });
    }

    // 3. Sync Stone Rates (all 118 plans across 33 games + preserved plans)
    for (const plan of INITIAL_STONE_RATES) {
      const ref = doc(db, COLLECTIONS.STONE_RATES, plan.id);
      batch.set(
        ref,
        {
          ...plan,
          status: '現在準備中',
          stockStatus: '在庫要確認',
          isPreparation: true,
        },
        { merge: true }
      );
    }

    await batch.commit();
    console.log(`Firestore batch sync complete: ${allGames.length} games, ${INITIAL_STONE_RATES.length} rate plans.`);
    return { gamesSynced: allGames.length, ratesSynced: INITIAL_STONE_RATES.length };
  } catch (error) {
    console.warn('syncAllStoneRatesAndGamesToFirestore notice:', error);
    return { gamesSynced: 0, ratesSynced: 0 };
  }
}

// Seed master data if collections are empty or need update
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const gamesSnapshot = await getDocs(collection(db, COLLECTIONS.GAMES));
    const ratesSnapshot = await getDocs(collection(db, COLLECTIONS.STONE_RATES));

    // If games or stone rates count is below expected catalog, execute safe merge sync
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
  currencyIconUrl?: string;
  keyHighlights: string[];
  status?: ProductStatus;
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
        status: data.status || '掲載中',
        imageUrl: data.imageUrl,
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

  const oldPrice = existingPlan.currentPrice;
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

    // Add initial stone plan
    await addStoneRatePlanDoc({
      gameId: candidate.id,
      gameCode: candidate.code,
      gameName: candidate.name,
      planName: `${candidate.shortName} 取扱開始記念プラン`,
      currencyName: candidate.currencyName,
      currencyAmount: '初期ストック大量',
      conditions: '新規取扱開始・即納対応',
      referencePrice: 3500,
      currentPrice: 3200,
      confirmedDate: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
      status: '取扱中',
      notes: '取扱開始に伴う特別提供',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.GAMES}/${candidate.id}`);
  }
}

// Submit Game Request (Public Write)
export async function submitGameRequestDoc(
  req: Omit<GameRequestItem, 'id' | 'createdAt' | 'status'>
): Promise<GameRequestItem> {
  const newId = `req-${Date.now()}`;
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
