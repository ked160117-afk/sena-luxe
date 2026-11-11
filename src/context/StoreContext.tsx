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
  rebuildPublicCatalogMirrors,
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

  // Master Data (public-facing state)
  games: GameTitle[];
  candidateGames: GameTitle[];
  products: ProductItem[];
  stoneRates: StoneRatePlan[];
  requests: GameRequestItem[];
  sequences: Record<string, SerialSequence>;
  settings: AdminSettings;
  // Canonical data exposed only to the authenticated admin dashboard.
  adminGames: GameTitle[];
  adminCandidateGames: GameTitle[];
  adminProducts: ProductItem[];
  adminStoneRates: StoneRatePlan[];
  adminSettings: AdminSettings;
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
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [stoneRates, setStoneRates] = useState<StoneRatePlan[]>([]);
  const [requests, setRequests] = useState<GameRequestItem[]>([]);
  const [sequences, setSequences] = useState<Record<string, SerialSequence>>(INITIAL_SEQUENCES);
  const [settings, setSettings] = useState<AdminSettings>(INITIAL_SETTINGS);
  // Keep canonical admin data separate from the public catalog state. These
  // values are populated only while an authorized administrator is signed in.
  const [adminAllGames, setAdminAllGames] = useState<GameTitle[]>([]);
  const [adminProducts, setAdminProducts] = useState<ProductItem[]>([]);
  const [adminStoneRates, setAdminStoneRates] = useState<StoneRatePlan[]>([]);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(INITIAL_SETTINGS);

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
  const adminGames = adminAllGames.filter((g) => g.isHandled);
  const adminHandledCodes = new Set(adminGames.map((g) => g.code?.trim().toUpperCase()).filter(Boolean));
  const adminCandidateGames = adminAllGames.filter(
    (g) => !g.isHandled && !adminHandledCodes.has(g.code?.trim().toUpperCase())
  );

  // Scroll to top on navigation change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedGameId]);

  // Initialize and test connection only. Canonical catalog seeding is deferred
  // until the authenticated user has passed the admin check below.
  useEffect(() => {
    async function initConnection() {
      const ok = await testFirestoreConnection();
      setIsFirestoreConnected(ok);
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
          // Only an authenticated administrator may read or seed canonical collections.
          await seedInitialDataIfEmpty();
        } else {
          setAdminAllGames([]);
          setAdminProducts([]);
          setAdminStoneRates([]);
          setAdminSettings(INITIAL_SETTINGS);
          setRequests([]);
          setSequences(INITIAL_SEQUENCES);
        }
      } else {
        setIsAdminLoggedIn(false);
        setAdminAllGames([]);
        setAdminProducts([]);
        setAdminStoneRates([]);
        setAdminSettings(INITIAL_SETTINGS);
        setRequests([]);
        setSequences(INITIAL_SEQUENCES);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Public realtime listeners read only sanitized mirror collections.
  // Canonical collections are never subscribed to by an anonymous storefront session.
  useEffect(() => {
    const unsubGames = onSnapshot(collection(db, 'publicGames'), (snapshot) => {
      const loadedGames: GameTitle[] = snapshot.docs.map((d) => {
        const data = d.data() as GameTitle;
        const fallback = INITIAL_GAMES.find((g) => g.code.toUpperCase() === data.code?.toUpperCase());
        return {
          ...data,
          id: d.id,
          description: data.description || fallback?.description || '',
          iconUrl: data.iconUrl || fallback?.iconUrl || '',
          currencyIconUrl: data.currencyIconUrl || fallback?.currencyIconUrl || '',
          isHandled: true,
        };
      });
      const loadedIds = new Set(loadedGames.map((game) => game.id));
      const missingInitialGames = [...INITIAL_GAMES, ...INITIAL_CANDIDATE_GAMES].filter((game) => !loadedIds.has(game.id));
      const merged = [...loadedGames, ...missingInitialGames].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setAllGames(merged);
    }, (error) => {
      console.warn('Public games listener note:', error.message);
      setAllGames([...INITIAL_GAMES]);
    });

    const unsubProducts = onSnapshot(collection(db, 'publicProducts'), (snapshot) => {
      const loaded: ProductItem[] = snapshot.docs.map((d) => ({
        ...(d.data() as ProductItem),
        id: d.id,
        status: '掲載中',
        verifiedForPublic: true,
      }));
      loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setProducts(loaded);
    }, (error) => {
      console.warn('Public products listener note:', error.message);
      setProducts([]);
    });

    const unsubRates = onSnapshot(collection(db, 'publicStoneRates'), (snapshot) => {
      const loaded: StoneRatePlan[] = snapshot.docs.map((d) => ({
        ...(d.data() as StoneRatePlan),
        id: d.id,
        status: '取扱中',
        stockStatus: '在庫要確認',
        isPreparation: false,
        verifiedForPublic: true,
        priceHistory: [],
      }));
      setStoneRates(loaded);
    }, (error) => {
      console.warn('Public stone rates listener note:', error.message);
      setStoneRates([]);
    });

    const unsubSettings = onSnapshot(doc(db, 'publicSettings', 'general'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setSettings({
          lineUrl: typeof data.lineUrl === 'string' ? data.lineUrl : OFFICIAL_LINE_URL,
          shopNotice: typeof data.shopNotice === 'string' ? data.shopNotice : '',
          enableDirectLineCopy: data.enableDirectLineCopy === true,
          contactDeskHours: typeof data.contactDeskHours === 'string' ? data.contactDeskHours : '公式LINEにてご案内',
        });
      } else {
        setSettings({
          lineUrl: OFFICIAL_LINE_URL,
          shopNotice: '',
          enableDirectLineCopy: false,
          contactDeskHours: '公式LINEにてご案内',
        });
      }
    }, (error) => {
      console.warn('Public settings listener note:', error.message);
      setSettings({ ...INITIAL_SETTINGS, lineUrl: OFFICIAL_LINE_URL });
    });

    return () => {
      unsubGames();
      unsubProducts();
      unsubRates();
      unsubSettings();
    };
  }, []);

  // Canonical Firestore listeners for the admin dashboard only.
  // Public-facing state above remains unchanged until the mirror readers are
  // switched in a later, separately reviewed step.
  useEffect(() => {
    if (!isAdminLoggedIn) {
      setAdminAllGames([]);
      setAdminProducts([]);
      setAdminStoneRates([]);
      setAdminSettings(INITIAL_SETTINGS);
      setRequests([]);
      setSequences(INITIAL_SEQUENCES);
      return;
    }

    const unsubGames = onSnapshot(collection(db, 'games'), (snapshot) => {
      const loaded = snapshot.docs.map((d) => ({ ...(d.data() as GameTitle), id: d.id }));
      loaded.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setAdminAllGames(loaded);
    }, (error) => console.warn('Admin games listener note:', error.message));

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const loaded = snapshot.docs.map((d) => ({ ...(d.data() as ProductItem), id: d.id }));
      loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAdminProducts(loaded);
    }, (error) => console.warn('Admin products listener note:', error.message));

    const unsubRates = onSnapshot(collection(db, 'stoneRates'), (snapshot) => {
      setAdminStoneRates(snapshot.docs.map((d) => ({ ...(d.data() as StoneRatePlan), id: d.id })));
    }, (error) => console.warn('Admin stone rates listener note:', error.message));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (snapshot) => {
      if (snapshot.exists()) setAdminSettings(snapshot.data() as AdminSettings);
    }, (error) => console.warn('Admin settings listener note:', error.message));

    const unsubSeq = onSnapshot(collection(db, 'sequences'), (snapshot) => {
      const seqMap: Record<string, SerialSequence> = {};
      snapshot.docs.forEach((d) => { seqMap[d.id] = d.data() as SerialSequence; });
      setSequences(seqMap);
    }, (error) => console.warn('Sequences onSnapshot note:', error.message));

    const unsubReq = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const loadedReqs = snapshot.docs.map((d) => d.data() as GameRequestItem);
      loadedReqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(loadedReqs);
    }, (error) => console.warn('Requests onSnapshot note:', error.message));

    return () => {
      unsubGames();
      unsubProducts();
      unsubRates();
      unsubSettings();
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

  // Rebuild allowlisted public mirrors after successful canonical admin writes.
  // Canonical data remains authoritative; failures are surfaced instead of hidden.
  const refreshPublicMirrors = async () => {
    try {
      await rebuildPublicCatalogMirrors();
    } catch (error) {
      console.error('Canonical data was saved, but public mirror refresh failed:', error);
      throw new Error('正規データは保存されましたが、公開ページへの反映に失敗しました。管理画面から公開データを再同期してください。');
    }
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
    const game = adminAllGames.find((g) => g.id === data.gameId);
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

    await refreshPublicMirrors();
    return newProd;
  };

  const updateProduct = async (id: string, updates: Partial<ProductItem>) => {
    await updateProductDoc(id, updates);
    await refreshPublicMirrors();
  };

  const deleteProduct = async (id: string, reason?: string) => {
    const target = adminProducts.find((p) => p.id === id);
    if (!target) return;
    await deleteProductDoc(target, reason);
    await refreshPublicMirrors();
  };

  const toggleProductStatus = async (id: string, status: ProductStatus) => {
    const target = adminProducts.find((p) => p.id === id);
    if (!target) return;
    if (status === '掲載中' && (!target.verifiedForPublic || (target.category !== 'ゲーム内通貨・石垢' && target.category !== '引退垢') || target.price === null || target.price <= 0 || !target.title.trim() || !target.summary.trim())) return;
    await updateProductDoc(id, { status });
    await refreshPublicMirrors();
  };

  // Stone Rate Actions
  const updateStoneRatePrice = async (id: string, newPrice: number | null, reason?: string) => {
    const target = adminStoneRates.find((r) => r.id === id);
    if (!target) return;
    await updateStoneRatePriceDoc(id, target, newPrice, reason || '管理者による価格改定');
    await refreshPublicMirrors();
  };

  const updateStoneRatePlan = async (id: string, updates: Partial<StoneRatePlan>) => {
    await updateStoneRateDoc(id, updates);
    await refreshPublicMirrors();
  };

  const addNewStoneRatePlan = async (plan: Omit<StoneRatePlan, 'id' | 'priceHistory'>) => {
    await addStoneRatePlanDoc(plan);
    await refreshPublicMirrors();
  };

  const setAllStoneRatesPreparation = async () => {
    try {
      const batch = writeBatch(db);
      for (const plan of adminStoneRates) {
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
      await refreshPublicMirrors();
    } catch (err) {
      console.warn('Batch preparation update notice:', err);
      throw err;
    }
    setAdminStoneRates((prev) =>
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
    await refreshPublicMirrors();
  };

  const addNewGameTitle = async (gameData: Omit<GameTitle, 'id'>) => {
    const newId = `game-${gameData.code.toLowerCase()}-${Date.now()}`;
    const newGame: GameTitle = {
      ...gameData,
      id: newId,
    };
    await addGameDoc(newGame);
    await refreshPublicMirrors();
  };

  const promoteCandidateToHandled = async (candidateId: string) => {
    const candidate = adminAllGames.find((c) => c.id === candidateId);
    if (!candidate) return;
    await promoteCandidateDoc(candidate);
    await refreshPublicMirrors();
  };

  const addNewCandidateGame = async (candidate: Omit<GameTitle, 'id' | 'isHandled'>) => {
    const newId = `candidate-${Date.now()}`;
    const fullCandidate: GameTitle = {
      ...candidate,
      id: newId,
      isHandled: false,
    };
    await updateGameDoc(newId, fullCandidate);
    await refreshPublicMirrors();
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
    await refreshPublicMirrors();
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
        adminGames,
        adminCandidateGames,
        adminProducts,
        adminStoneRates,
        adminSettings,
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
