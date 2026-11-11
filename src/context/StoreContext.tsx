/**
 * SENA LUXE - Store Context & State Management
 * Connects directly to Firebase Firestore & Firebase Authentication
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  collection,
  onSnapshot,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, testFirestoreConnection } from '../lib/firebase';
import {
  createProductAtomic,
  updateProductDoc,
  deleteProductDoc,
  updateStoneRatePriceDoc,
  updateStoneRateDoc,
  addStoneRatePlanDoc,
  addGameDoc,
  updateGameDoc,
  promoteCandidateDoc,
  submitGameRequestDoc,
  updateRequestStatusDoc,
  saveSettingsDoc,
  checkIsUserAdmin,
  ensureAdminDocument,
  seedInitialDataIfEmpty,
} from '../services/firestoreService';
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

export const OFFICIAL_LINE_URL = 'https://lin.ee/6uy8hu9';

export type AppView =
  | 'top'
  | 'games'
  | 'game_products'
  | 'retired_accounts'
  | 'stone_rates'
  | 'candidates'
  | 'request'
  | 'faq'
  | 'shop_info'
  | 'terms'
  | 'privacy'
  | 'law'
  | 'admin_login'
  | 'admin_dashboard';

interface LineInquiryModalState {
  isOpen: boolean;
  gameName: string;
  productNumber: string;
  planName?: string;
  formattedText: string;
  copiedSuccessfully: boolean;
}

interface StoreContextType {
  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  selectedGameId: string | null;
  setSelectedGameId: (gameId: string | null) => void;
  selectedCategory: ProductCategory | 'ALL';
  setSelectedCategory: (cat: ProductCategory | 'ALL') => void;
  navigateToGameProducts: (gameId: string, category?: ProductCategory | 'ALL') => void;
  navigateToStoneRates: (gameId?: string) => void;

  // Master Data
  games: GameTitle[];
  candidateGames: GameTitle[];
  products: ProductItem[];
  stoneRates: StoneRatePlan[];
  requests: GameRequestItem[];
  sequences: Record<string, SerialSequence>;
  settings: AdminSettings;
  isFirestoreConnected: boolean;

  // Product Actions
  addNewProduct: (data: {
    gameId: string;
    category: ProductCategory;
    title: string;
    summary: string;
    price: number | null;
    imageUrl?: string;
    videoUrl?: string;
    videoStorageId?: string;
    deviceCompatibility?: ProductItem['deviceCompatibility'];
    keyHighlights: string[];
    status?: ProductStatus;
    verifiedForPublic?: boolean;
  }) => Promise<ProductItem>;
  updateProduct: (id: string, updates: Partial<ProductItem>) => Promise<void>;
  deleteProduct: (id: string, reason?: string) => Promise<void>;
  toggleProductStatus: (id: string, status: ProductStatus) => Promise<void>;

  // Stone Rate Actions
  updateStoneRatePrice: (id: string, newPrice: number | null, reason?: string) => Promise<void>;
  updateStoneRatePlan: (id: string, updates: Partial<StoneRatePlan>) => Promise<void>;
  addNewStoneRatePlan: (plan: Omit<StoneRatePlan, 'id' | 'priceHistory'>) => Promise<void>;
  setAllStoneRatesPreparation: () => Promise<void>;

  // Game & Candidate Actions
  updateGameDetails: (id: string, updates: Partial<GameTitle>) => Promise<void>;
  promoteCandidateToHandled: (candidateId: string) => Promise<void>;
  addNewCandidateGame: (candidate: Omit<GameTitle, 'id' | 'isHandled'>) => Promise<void>;
  addNewGameTitle: (game: Omit<GameTitle, 'id'>) => Promise<void>;

  // Request Actions
  submitGameRequest: (req: Omit<GameRequestItem, 'id' | 'createdAt' | 'status'>) => Promise<GameRequestItem>;
  updateRequestStatus: (id: string, status: GameRequestItem['status'], adminNotes?: string) => Promise<void>;

  // Settings
  updateSettings: (updates: Partial<AdminSettings>) => Promise<void>;

  // Admin Auth via Firebase Authentication
  currentUser: User | null;
  isAdminLoggedIn: boolean;
  authLoading: boolean;
  loginAdminWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;

  // LINE Modal State & Actions
  lineModal: LineInquiryModalState;
  openLineInquiry: (gameName: string, productNumber: string, planName?: string) => void;
  closeLineModal: () => void;
  copyToClipboardAndOpenModal: (textToCopy: string, gameName: string, productNumber: string, planName?: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>('top');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL');

  // Firebase connection status
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Master Data State
  const [allGames, setAllGames] = useState<GameTitle[]>(() => [...INITIAL_GAMES, ...INITIAL_CANDIDATE_GAMES]);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [stoneRates, setStoneRates] = useState<StoneRatePlan[]>(INITIAL_STONE_RATES);
  const [requests, setRequests] = useState<GameRequestItem[]>([]);
  const [sequences, setSequences] = useState<Record<string, SerialSequence>>(INITIAL_SEQUENCES);
  const [settings, setSettings] = useState<AdminSettings>(INITIAL_SETTINGS);

  // LINE Modal State
  const [lineModal, setLineModal] = useState<LineInquiryModalState>({
    isOpen: false,
    gameName: '',
    productNumber: '',
    planName: undefined,
    formattedText: '',
    copiedSuccessfully: false,
  });

  // Derived games: Officially handled games and genuine upcoming candidates
  const games = allGames.filter((g) => g.isHandled);
  const handledCodes = new Set(games.map((g) => g.code?.trim().toUpperCase()).filter(Boolean));
  const candidateGames = allGames.filter(
    (g) => !g.isHandled && !handledCodes.has(g.code?.trim().toUpperCase())
  );

  // Scroll to top on navigation change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedGameId]);

  // Initialize and test connection
  useEffect(() => {
    async function initConnection() {
      const ok = await testFirestoreConnection();
      setIsFirestoreConnected(ok);
      if (ok) {
        // Attempt initial seed if empty
        await seedInitialDataIfEmpty();
      }
    }
    initConnection();
  }, []);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const isAdmin = await checkIsUserAdmin(user.uid, user.email);
        setIsAdminLoggedIn(isAdmin);
        if (isAdmin) {
          await ensureAdminDocument(user.uid, user.email || 'ked160117@gmail.com');
        }
      } else {
        setIsAdminLoggedIn(false);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firestore Realtime Listeners for Public Data
  useEffect(() => {
    // 1. Games collection listener
    const unsubGames = onSnapshot(
      collection(db, 'games'),
      (snapshot) => {
        if (!snapshot.empty) {
          const allInitialMap = new Map<string, GameTitle>(
            [...INITIAL_GAMES, ...INITIAL_CANDIDATE_GAMES].map((g) => [g.code.toUpperCase(), g])
          );

          const loadedGames: GameTitle[] = snapshot.docs.map((d) => {
            const data = d.data() as GameTitle;
            const fallback = allInitialMap.get(data.code?.toUpperCase() || '');
            let description = data.description;

            // Ensure neutral description without fictional inventory claims
            if (
              !description ||
              description.includes('取り扱い') ||
              description.includes('所持データ') ||
              description.includes('ストック') ||
              description.includes('取扱候補') ||
              description.includes('オーダー')
            ) {
              if (fallback) {
                description = fallback.description;
              }
            }

            let iconUrl = data.iconUrl || fallback?.iconUrl || '';
            let currencyIconUrl = data.currencyIconUrl || fallback?.currencyIconUrl || '';
            // Remove unverified stock images
            if (iconUrl.includes('images.unsplash.com')) {
              iconUrl = '';
            }
            if (currencyIconUrl.includes('images.unsplash.com')) {
              currencyIconUrl = '';
            }

            return {
              ...data,
              description,
              iconUrl,
              currencyIconUrl,
            };
          });

          // Keep the master catalog available even when public Firestore writes are restricted.
          // Existing Firestore records always win, so administrator edits are preserved.
          const loadedGameIds = new Set(loadedGames.map((game) => game.id));
          const missingInitialGames = [...INITIAL_GAMES, ...INITIAL_CANDIDATE_GAMES]
            .filter((game) => !loadedGameIds.has(game.id));
          const mergedGames = [...loadedGames, ...missingInitialGames];
          mergedGames.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
          setAllGames(mergedGames);
        }
      },
      (error) => {
        console.warn('Games onSnapshot note:', error.message);
      }
    );

    // 2. Products collection listener
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedProducts: ProductItem[] = snapshot.docs.map((d) => {
            const data = d.data() as ProductItem;
            const verified =
              data.verifiedForPublic === true &&
              (data.category === 'ゲーム内通貨・石垢' || data.category === '引退垢') &&
              typeof data.price === 'number' &&
              data.price > 0 &&
              Boolean(data.title?.trim()) &&
              Boolean(data.summary?.trim());
            return {
              ...data,
              verifiedForPublic: verified,
              status: verified ? data.status : '掲載停止',
            };
          });
          // sort by createdAt desc
          loadedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setProducts(loadedProducts);
        }
      },
      (error) => {
        console.warn('Products onSnapshot note:', error.message);
      }
    );

    // 3. Stone Rates collection listener
    const unsubRates = onSnapshot(
      collection(db, 'stoneRates'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedRates: StoneRatePlan[] = snapshot.docs.map((d) => {
            const data = d.data() as StoneRatePlan;
            const catalogFallback = INITIAL_STONE_RATES.find((plan) => plan.id === data.id);
            // Older Firestore records had their public prices cleared during the
            // temporary preparation state. Restore only the original catalog price
            // for entries already marked 取扱中 in that source catalog.
            const restoreCatalogPrice =
              data.currentPrice == null &&
              catalogFallback?.verifiedForPublic === true &&
              typeof catalogFallback.currentPrice === 'number';
            const merged: StoneRatePlan = restoreCatalogPrice && catalogFallback
              ? {
                  ...catalogFallback,
                  ...data,
                  currentPrice: catalogFallback.currentPrice,
                  referencePrice: catalogFallback.referencePrice,
                  confirmedDate: catalogFallback.confirmedDate,
                  status: '取扱中',
                  currencyAmount: data.currencyAmount?.trim() ? data.currencyAmount : catalogFallback.currencyAmount,
                  planName: data.planName?.trim() ? data.planName : catalogFallback.planName,
                  conditions: data.conditions?.trim() ? data.conditions : catalogFallback.conditions,
                  isPreparation: false,
                  verifiedForPublic: true,
                }
              : data;
            const confirmedForDisplay =
              merged.verifiedForPublic === true &&
              merged.status === '取扱中' &&
              merged.isPreparation === false &&
              typeof merged.currentPrice === 'number' &&
              merged.currentPrice > 0 &&
              Boolean(merged.currencyAmount?.trim()) &&
              Boolean(merged.planName?.trim()) &&
              Boolean(merged.conditions?.trim());
            return {
              ...merged,
              status: confirmedForDisplay ? '取扱中' : '価格確認中',
              stockStatus: '在庫要確認',
              isPreparation: !confirmedForDisplay,
              verifiedForPublic: confirmedForDisplay,
            };
          });
          setStoneRates(loadedRates);
        }
      },
      (error) => {
        console.warn('StoneRates onSnapshot note:', error.message);
      }
    );

    // 4. Settings listener
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'general'),
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as AdminSettings);
        }
      },
      (error) => {
        console.warn('Settings onSnapshot note:', error.message);
      }
    );

    return () => {
      unsubGames();
      unsubProducts();
      unsubRates();
      unsubSettings();
    };
  }, []);

  // Firestore Listeners for Admin-Only Data (only attached if admin is authenticated)
  useEffect(() => {
    if (!isAdminLoggedIn) {
      return;
    }

    // 1. Sequences listener
    const unsubSeq = onSnapshot(
      collection(db, 'sequences'),
      (snapshot) => {
        if (!snapshot.empty) {
          const seqMap: Record<string, SerialSequence> = {};
          snapshot.docs.forEach((d) => {
            seqMap[d.id] = d.data() as SerialSequence;
          });
          setSequences(seqMap);
        }
      },
      (error) => {
        console.warn('Sequences onSnapshot note:', error.message);
      }
    );

    // 2. Requests listener
    const unsubReq = onSnapshot(
      collection(db, 'requests'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedReqs = snapshot.docs.map((d) => d.data() as GameRequestItem);
          loadedReqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRequests(loadedReqs);
        }
      },
      (error) => {
        console.warn('Requests onSnapshot note:', error.message);
      }
    );

    return () => {
      unsubSeq();
      unsubReq();
    };
  }, [isAdminLoggedIn]);

  // Navigation helpers
  const navigateToGameProducts = (gameId: string, category: ProductCategory | 'ALL' = 'ALL') => {
    setSelectedGameId(gameId);
    setSelectedCategory(category);
    setCurrentView('game_products');
  };

  const navigateToStoneRates = (gameId?: string) => {
    if (gameId) {
      setSelectedGameId(gameId);
    }
    setCurrentView('stone_rates');
  };

  // Safe Atomic Product Creation using Firestore Transaction
  const addNewProduct = async (data: {
    gameId: string;
    category: ProductCategory;
    title: string;
    summary: string;
    price: number | null;
    imageUrl?: string;
    videoUrl?: string;
    videoStorageId?: string;
    deviceCompatibility?: ProductItem['deviceCompatibility'];
    keyHighlights: string[];
    status?: ProductStatus;
    verifiedForPublic?: boolean;
  }): Promise<ProductItem> => {
    const game = allGames.find((g) => g.id === data.gameId);
    const gameCode = game ? game.code.toUpperCase() : 'GEN';
    const gameName = game ? game.name : 'ゲームタイトル';

    const newProd = await createProductAtomic({
      gameId: data.gameId,
      gameCode,
      gameName,
      category: data.category,
      title: data.title,
      summary: data.summary,
      price: data.price,
      imageUrl: data.imageUrl,
      videoUrl: data.videoUrl,
      videoStorageId: data.videoStorageId,
      deviceCompatibility: data.deviceCompatibility,
      keyHighlights: data.keyHighlights,
      status: data.status,
      verifiedForPublic: data.verifiedForPublic,
    });

    return newProd;
  };

  const updateProduct = async (id: string, updates: Partial<ProductItem>) => {
    await updateProductDoc(id, updates);
  };

  const deleteProduct = async (id: string, reason?: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    await deleteProductDoc(target, reason);
  };

  const toggleProductStatus = async (id: string, status: ProductStatus) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    if (status === '掲載中' && (!target.verifiedForPublic || (target.category !== 'ゲーム内通貨・石垢' && target.category !== '引退垢') || target.price === null || target.price <= 0 || !target.title.trim() || !target.summary.trim())) return;
    await updateProductDoc(id, { status });
  };

  // Stone Rate Actions
  const updateStoneRatePrice = async (id: string, newPrice: number | null, reason?: string) => {
    const target = stoneRates.find((r) => r.id === id);
    if (!target) return;
    await updateStoneRatePriceDoc(id, target, newPrice, reason || '管理者による価格改定');
  };

  const updateStoneRatePlan = async (id: string, updates: Partial<StoneRatePlan>) => {
    await updateStoneRateDoc(id, updates);
  };

  const addNewStoneRatePlan = async (plan: Omit<StoneRatePlan, 'id' | 'priceHistory'>) => {
    await addStoneRatePlanDoc(plan);
  };

  const setAllStoneRatesPreparation = async () => {
    try {
      const batch = writeBatch(db);
      for (const plan of stoneRates) {
        const ref = doc(db, 'stoneRates', plan.id);
        batch.set(
          ref,
          {
            status: '現在準備中',
            stockStatus: '在庫要確認',
            isPreparation: true,
            verifiedForPublic: false,
          },
          { merge: true }
        );
      }
      await batch.commit();
    } catch (err) {
      console.warn('Batch preparation update notice:', err);
    }
    setStoneRates((prev) =>
      prev.map((p) => ({
        ...p,
        status: '現在準備中',
        stockStatus: '在庫要確認',
        isPreparation: true,
        verifiedForPublic: false,
      }))
    );
  };

  // Game & Candidate Actions
  const updateGameDetails = async (id: string, updates: Partial<GameTitle>) => {
    await updateGameDoc(id, updates);
  };

  const addNewGameTitle = async (gameData: Omit<GameTitle, 'id'>) => {
    const newId = `game-${gameData.code.toLowerCase()}-${Date.now()}`;
    const newGame: GameTitle = {
      ...gameData,
      id: newId,
    };
    await addGameDoc(newGame);
  };

  const promoteCandidateToHandled = async (candidateId: string) => {
    const candidate = allGames.find((c) => c.id === candidateId);
    if (!candidate) return;
    await promoteCandidateDoc(candidate);
  };

  const addNewCandidateGame = async (candidate: Omit<GameTitle, 'id' | 'isHandled'>) => {
    const newId = `candidate-${Date.now()}`;
    const fullCandidate: GameTitle = {
      ...candidate,
      id: newId,
      isHandled: false,
    };
    await updateGameDoc(newId, fullCandidate);
  };

  // Request Submission directly to Firestore
  const submitGameRequest = async (
    req: Omit<GameRequestItem, 'id' | 'createdAt' | 'status'>
  ): Promise<GameRequestItem> => {
    return await submitGameRequestDoc(req);
  };

  const updateRequestStatus = async (id: string, status: GameRequestItem['status'], adminNotes?: string) => {
    await updateRequestStatusDoc(id, status, adminNotes);
  };

  // Settings
  const updateSettings = async (updates: Partial<AdminSettings>) => {
    await saveSettingsDoc(updates);
  };

  // Firebase Authentication: Email & Password
  const loginAdminWithEmail = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const isAdmin = await checkIsUserAdmin(userCredential.user.uid, userCredential.user.email);
      if (!isAdmin) {
        await signOut(auth);
        return {
          success: false,
          error: 'このアカウントには管理者権限が付与されていません。',
        };
      }
      await ensureAdminDocument(userCredential.user.uid, userCredential.user.email || email.trim());
      setIsAdminLoggedIn(true);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase Auth Login Error:', err);
      let errorMsg = 'ログインに失敗しました。メールアドレスまたはパスワードを確認してください。';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errorMsg = 'ユーザーが見つかりません、または認証情報が間違っています。';
      } else if (err.code === 'auth/wrong-password') {
        errorMsg = 'パスワードが正しくありません。';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = '有効なメールアドレス形式を入力してください。';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = '試行回数が制限を超えました。しばらく待ってから再試行してください。';
      }
      return { success: false, error: errorMsg };
    }
  };

  const logoutAdmin = async () => {
    try {
      await signOut(auth);
      setIsAdminLoggedIn(false);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  // Copy the inquiry message first, then let the customer open LINE and paste it.
  const copyToClipboardAndOpenModal = async (
    textToCopy: string,
    gameName: string,
    productNumber: string,
    planName?: string
  ) => {
    let copiedSuccessfully = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        copiedSuccessfully = true;
      }
    } catch {
      copiedSuccessfully = false;
    }
    setLineModal({
      isOpen: true,
      gameName,
      productNumber,
      planName,
      formattedText: textToCopy,
      copiedSuccessfully,
    });
  };

  const openLineInquiry = (gameName = 'お問い合わせ', productNumber = '一般相談', planName?: string) => {
    const message = [
      '【SENA LUXE お問い合わせ】',
      `ゲーム名：${gameName}`,
      `商品番号：${productNumber}`,
      planName ? `商品・プラン：${planName}` : '',
      '確認したい内容：',
    ].filter(Boolean).join('\n');
    void copyToClipboardAndOpenModal(message, gameName, productNumber, planName);
  };

  const closeLineModal = () => {
    setLineModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <StoreContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedGameId,
        setSelectedGameId,
        selectedCategory,
        setSelectedCategory,
        navigateToGameProducts,
        navigateToStoneRates,

        games,
        candidateGames,
        products,
        stoneRates,
        requests,
        sequences,
        settings,
        isFirestoreConnected,

        addNewProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,

        updateStoneRatePrice,
        updateStoneRatePlan,
        addNewStoneRatePlan,
        setAllStoneRatesPreparation,

        updateGameDetails,
        promoteCandidateToHandled,
        addNewCandidateGame,
        addNewGameTitle,

        submitGameRequest,
        updateRequestStatus,

        updateSettings,

        currentUser,
        isAdminLoggedIn,
        authLoading,
        loginAdminWithEmail,
        logoutAdmin,

        lineModal,
        openLineInquiry,
        closeLineModal,
        copyToClipboardAndOpenModal,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
};
