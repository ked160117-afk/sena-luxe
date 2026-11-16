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
    deviceCompatibility?: string;
    title: string;
    summary: string;
    price: number | null;
    verifiedForPublic?: boolean;
    showInRecommended?: boolean;
    imageUrl?: string;
    additionalImages?: string[];
    videoUrl?: string;
    videoStorageId?: string;
    keyHighlights: string[];
    status?: ProductStatus;
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
            const fallback =
              allInitialMap.get((data.code || '').trim().toUpperCase()) ||
              [...INITIAL_GAMES, ...INITIAL_CANDIDATE_GAMES].find((g) => g.id === (data.id || d.id));
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

            // Prefer the verified catalog artwork over stale Firestore URLs so icon corrections
            // are reflected for existing game documents without deleting or rewriting them.
            let iconUrl = fallback?.iconUrl || data.iconUrl || '';
            let currencyIconUrl = fallback?.currencyIconUrl || data.currencyIconUrl || '';
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

          const existingIds = new Set(loadedGames.map((g) => g.id));
          const missingCatalogGames = [...INITIAL_GAMES, ...INITIAL_CANDIDATE_GAMES].filter(
            (g) => !existingIds.has(g.id)
          );
          const mergedGames = [...loadedGames, ...missingCatalogGames];
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
            const raw = d.data() as ProductItem;
            const normalizedCategory: ProductCategory =
              raw.category === 'ゲーム内通貨・石垢' ? '石垢' : raw.category;
            const isVerified =
              raw.verifiedForPublic === true &&
              ['石垢', '引退垢', '初期垢'].includes(normalizedCategory) &&
              typeof raw.price === 'number' &&
              raw.price > 0 &&
              Boolean(raw.title?.trim()) &&
              Boolean(raw.summary?.trim());

            const primaryImage = raw.imageUrl || raw.imageUrls?.[0];
            const derivedAdditional =
              Array.isArray(raw.additionalImages) && raw.additionalImages.length > 0
                ? raw.additionalImages
                : Array.isArray(raw.imageUrls) && raw.imageUrls.length > 1
                ? raw.imageUrls.slice(1, 5)
                : undefined;

            return {
              ...raw,
              category: normalizedCategory,
              ...(primaryImage ? { imageUrl: primaryImage } : {}),
              ...(derivedAdditional && derivedAdditional.length > 0
                ? { additionalImages: derivedAdditional }
                : {}),
              verifiedForPublic: isVerified,
              status: isVerified ? raw.status : '掲載停止',
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
            const baseline = INITIAL_STONE_RATES.find((r) => r.id === data.id);
            const resolved =
              data.currentPrice == null &&
              baseline?.verifiedForPublic === true &&
              typeof baseline.currentPrice === 'number'
                ? {
                    ...baseline,
                    ...data,
                    currentPrice: baseline.currentPrice,
                    referencePrice: baseline.referencePrice,
                    confirmedDate: baseline.confirmedDate,
                    status: '取扱中' as const,
                    currencyAmount: data.currencyAmount?.trim()
                      ? data.currencyAmount
                      : baseline.currencyAmount,
                    planName: data.planName?.trim() ? data.planName : baseline.planName,
                    conditions: data.conditions?.trim() ? data.conditions : baseline.conditions,
                    isPreparation: false,
                    verifiedForPublic: true,
                  }
                : data;

            const isVerified =
              resolved.verifiedForPublic === true &&
              resolved.status === '取扱中' &&
              resolved.isPreparation === false &&
              typeof resolved.currentPrice === 'number' &&
              resolved.currentPrice > 0 &&
              Boolean(resolved.currencyAmount?.trim()) &&
              Boolean(resolved.planName?.trim()) &&
              Boolean(resolved.conditions?.trim());

            return {
              ...resolved,
              status: isVerified ? '取扱中' : '価格確認中',
              stockStatus: '在庫要確認',
              isPreparation: !isVerified,
              verifiedForPublic: isVerified,
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
    deviceCompatibility?: string;
    title: string;
    summary: string;
    price: number | null;
    verifiedForPublic?: boolean;
    imageUrl?: string;
    additionalImages?: string[];
    videoUrl?: string;
    videoStorageId?: string;
    keyHighlights: string[];
    status?: ProductStatus;
  }): Promise<ProductItem> => {
    const game = allGames.find((g) => g.id === data.gameId);
    const gameCode = game ? game.code.toUpperCase() : 'GEN';
    const gameName = game ? game.name : 'ゲームタイトル';

    const trimmedImageUrl = typeof data.imageUrl === 'string' ? data.imageUrl.trim() : '';
    const cleanAdditionalImages = Array.isArray(data.additionalImages)
      ? data.additionalImages
          .filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
          .map((img) => img.trim())
          .slice(0, 4)
      : [];
    const trimmedVideoUrl = typeof data.videoUrl === 'string' ? data.videoUrl.trim() : '';
    const trimmedVideoStorageId = typeof data.videoStorageId === 'string' ? data.videoStorageId.trim() : '';

    const newProd = await createProductAtomic({
      gameId: data.gameId,
      gameCode,
      gameName,
      category: data.category,
      ...(data.deviceCompatibility ? { deviceCompatibility: data.deviceCompatibility } : {}),
      title: data.title,
      summary: data.summary,
      price: data.price,
      ...(data.verifiedForPublic !== undefined ? { verifiedForPublic: data.verifiedForPublic } : {}),
      showInRecommended: data.showInRecommended !== false,
      ...(trimmedImageUrl ? { imageUrl: trimmedImageUrl } : {}),
      ...(cleanAdditionalImages.length > 0 ? { additionalImages: cleanAdditionalImages } : {}),
      ...(trimmedVideoUrl ? { videoUrl: trimmedVideoUrl } : {}),
      ...(trimmedVideoStorageId ? { videoStorageId: trimmedVideoStorageId } : {}),
      keyHighlights: data.keyHighlights,
      ...(data.status ? { status: data.status } : {}),
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
    if (
      status === '掲載中' &&
      (!target.verifiedForPublic ||
        !['石垢', '引退垢', '初期垢'].includes(target.category) ||
        target.price === null ||
        target.price <= 0 ||
        !target.title.trim() ||
        !target.summary.trim())
    ) {
      return;
    }
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

  // LINE Modal Actions: Copy formatted inquiry text and open LINE guidance modal
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

  const openLineInquiry = (gameName: string = '', productNumber: string = '', planName?: string) => {
    const formattedText = [
      '【SENA LUXE お問い合わせ】',
      gameName ? `ゲーム名：${gameName}` : '',
      productNumber ? `商品番号：${productNumber}` : '',
      planName ? `商品・プラン：${planName}` : '',
      '確認したい内容：',
    ]
      .filter(Boolean)
      .join('\n');

    void copyToClipboardAndOpenModal(formattedText, gameName, productNumber, planName);
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
