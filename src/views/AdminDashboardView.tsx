/**
 * SENA LUXE - Admin Dashboard View
 * Full mobile-first smartphone & desktop administration suite:
 * - Product Management (Add, Edit, Price change, 価格確認中, Unpublish, File upload from camera/photos, Delete)
 * - Stone Rate Management (Add, Edit plan details, Price revision with history log, 価格確認中)
 * - Game Title Management (Add new game title, Change display order with Up/Down, Icon upload/update)
 * - Serial Number Permanent Registry (永久欠番台帳)
 * - Requests Management (Status updates & notes)
 * - Settings & LINE URL / Contact Hours Configuration
 * - Firebase Connection & Security Architecture
 */

import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { seedInitialDataIfEmpty, syncAllStoneRatesAndGamesToFirestore } from '../services/firestoreService';
import { ProductCategory, ProductStatus, StoneRatePlan, GameTitle, ProductItem } from '../types';
import { GameCardIcon } from '../components/GameCardIcon';
import {
  ShieldCheck,
  ShoppingBag,
  Gem,
  Sparkles,
  HelpCircle,
  Hash,
  Settings,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  LogOut,
  Save,
  Database,
  ArrowUp,
  ArrowDown,
  Upload,
  Image as ImageIcon,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';

type AdminTab = 'products' | 'rates' | 'games' | 'sequences' | 'requests' | 'settings' | 'firebase';

export const AdminDashboardView: React.FC = () => {
  const {
    products,
    addNewProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    stoneRates,
    updateStoneRatePrice,
    updateStoneRatePlan,
    addNewStoneRatePlan,
    games,
    candidateGames,
    promoteCandidateToHandled,
    updateGameDetails,
    addNewGameTitle,
    sequences,
    requests,
    updateRequestStatus,
    settings,
    updateSettings,
    logoutAdmin,
    setCurrentView,
    currentUser,
    isFirestoreConnected,
    setAllStoneRatesPreparation,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  // File input refs for mobile photo upload
  const newProductFileInputRef = useRef<HTMLInputElement>(null);
  const editProductFileInputRef = useRef<HTMLInputElement>(null);
  const newGameFileInputRef = useRef<HTMLInputElement>(null);
  const gameIconFileInputRef = useRef<HTMLInputElement>(null);
  const currencyIconFileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // Game Icon & Currency Icon Management Modal State
  // ==========================================
  const [iconEditGame, setIconEditGame] = useState<GameTitle | null>(null);
  const [tempIconUrl, setTempIconUrl] = useState('');
  const [tempCurrencyIconUrl, setTempCurrencyIconUrl] = useState('');
  const [isSavingIcon, setIsSavingIcon] = useState(false);
  const [isBulkSettingPrep, setIsBulkSettingPrep] = useState(false);

  // ==========================================
  // Product Registration Modal State
  // ==========================================
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProdGameId, setNewProdGameId] = useState(games[0]?.id || '');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('ゲームアカウント');
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdSummary, setNewProdSummary] = useState('');
  const [newProdIsPriceConfirmed, setNewProdIsPriceConfirmed] = useState(false); // default to 価格確認中
  const [newProdPrice, setNewProdPrice] = useState<string>('');
  const [newProdImageUrl, setNewProdImageUrl] = useState('');
  const [newProdHighlights, setNewProdHighlights] = useState('');
  const [newProdStatus, setNewProdStatus] = useState<ProductStatus>('掲載中');

  // ==========================================
  // Product Edit Modal State
  // ==========================================
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editProdTitle, setEditProdTitle] = useState('');
  const [editProdCategory, setEditProdCategory] = useState<ProductCategory>('ゲームアカウント');
  const [editProdIsPriceConfirmed, setEditProdIsPriceConfirmed] = useState(true);
  const [editProdPrice, setEditProdPrice] = useState<string>('');
  const [editProdSummary, setEditProdSummary] = useState('');
  const [editProdHighlights, setEditProdHighlights] = useState('');
  const [editProdImageUrl, setEditProdImageUrl] = useState('');
  const [editProdStatus, setEditProdStatus] = useState<ProductStatus>('掲載中');
  const [editProdOrder, setEditProdOrder] = useState<string>('0');

  // ==========================================
  // Stone Rate Price Edit State
  // ==========================================
  const [rateEditPlanId, setRateEditPlanId] = useState<string | null>(null);
  const [rateEditNewPrice, setRateEditNewPrice] = useState<string>('');
  const [rateEditReason, setRateEditReason] = useState<string>('');

  // Stone Rate Full Edit Modal State
  const [editingRatePlan, setEditingRatePlan] = useState<StoneRatePlan | null>(null);
  const [editRatePlanName, setEditRatePlanName] = useState('');
  const [editRateAmount, setEditRateAmount] = useState('');
  const [editRateConditions, setEditRateConditions] = useState('');
  const [editRateRefPrice, setEditRateRefPrice] = useState('');
  const [editRateIsPriceConfirmed, setEditRateIsPriceConfirmed] = useState(true);
  const [editRateCurrPrice, setEditRateCurrPrice] = useState('');
  const [editRateNotes, setEditRateNotes] = useState('');

  // Add Stone Rate Modal State
  const [isAddRateModalOpen, setIsAddRateModalOpen] = useState(false);
  const [newRateGameId, setNewRateGameId] = useState(games[0]?.id || '');
  const [newRatePlanName, setNewRatePlanName] = useState('');
  const [newRateAmount, setNewRateAmount] = useState('');
  const [newRateConditions, setNewRateConditions] = useState('');
  const [newRateRefPrice, setNewRateRefPrice] = useState('3500');
  const [newRateIsPriceConfirmed, setNewRateIsPriceConfirmed] = useState(false);
  const [newRateCurrPrice, setNewRateCurrPrice] = useState('');

  // Bulk Sync to Firestore State
  const [isSyncingRates, setIsSyncingRates] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleBulkSyncRates = async () => {
    setIsSyncingRates(true);
    setSyncFeedback(null);
    try {
      const res = await syncAllStoneRatesAndGamesToFirestore();
      setSyncFeedback(`Firestore一括同期完了: ゲーム${res.gamesSynced}件、石垢料金プラン${res.ratesSynced}件を反映・永続保存しました。`);
    } catch {
      setSyncFeedback('Firestoreへの一括同期に失敗しました。');
    } finally {
      setIsSyncingRates(false);
    }
  };

  // Bulk set all stone rates to preparation status
  const handleBulkSetPreparation = async () => {
    if (!window.confirm('全33タイトルの石垢全プランを一括で「現在準備中」「在庫要確認」に変更しますか？\n（価格や商品データは維持されます）')) {
      return;
    }
    setIsBulkSettingPrep(true);
    setSyncFeedback(null);
    try {
      await setAllStoneRatesPreparation();
      setSyncFeedback('全石垢プランを一括で「現在準備中」「在庫要確認」に変更しました。');
    } catch {
      setSyncFeedback('一括変更に失敗しました。');
    } finally {
      setIsBulkSettingPrep(false);
    }
  };

  // Open game icon modal
  const openGameIconModal = (game: GameTitle) => {
    setIconEditGame(game);
    setTempIconUrl(game.iconUrl || '');
    setTempCurrencyIconUrl(game.currencyIconUrl || '');
  };

  // Save game icons to Firestore
  const handleSaveGameIcons = async () => {
    if (!iconEditGame) return;
    setIsSavingIcon(true);
    try {
      await updateGameDetails(iconEditGame.id, {
        iconUrl: tempIconUrl.trim(),
        currencyIconUrl: tempCurrencyIconUrl.trim(),
      });
      setIconEditGame(null);
    } catch {
      alert('アイコン画像の更新に失敗しました。');
    } finally {
      setIsSavingIcon(false);
    }
  };

  // Canvas image optimization for icons (256x256 WebP, <30KB)
  const handleCompressedIconUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result !== 'string') return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/webp', 0.88);
          onComplete(dataUrl);
        } else {
          onComplete(event.target!.result as string);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ==========================================
  // Add Game Title Modal State
  // ==========================================
  const [isAddGameModalOpen, setIsAddGameModalOpen] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameCode, setNewGameCode] = useState('');
  const [newGameShortName, setNewGameShortName] = useState('');
  const [newGameCategory, setNewGameCategory] = useState('RPG');
  const [newGameCurrencyName, setNewGameCurrencyName] = useState('');
  const [newGameCurrencyUnit, setNewGameCurrencyUnit] = useState('個');
  const [newGameIconUrl, setNewGameIconUrl] = useState('');
  const [newGameDescription, setNewGameDescription] = useState('');

  // ==========================================
  // Settings State
  // ==========================================
  const [tempLineUrl, setTempLineUrl] = useState(settings.lineUrl);
  const [tempNotice, setTempNotice] = useState(settings.shopNotice);
  const [tempContactHours, setTempContactHours] = useState(settings.contactDeskHours || '公式LINEにてご案内');
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Helper: Read image file as Data URL (mobile camera / photo roll)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('画像サイズは5MB以下にしてください。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onComplete(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Product Add
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdTitle.trim() || !newProdGameId) return;

    const highlightsArr = newProdHighlights
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    await addNewProduct({
      gameId: newProdGameId,
      category: newProdCategory,
      title: newProdTitle.trim(),
      summary: newProdSummary.trim() || '専任スタッフによる動作・安全性検証済みアカウント。',
      price: newProdIsPriceConfirmed && newProdPrice ? Number(newProdPrice) : null,
      imageUrl: newProdImageUrl.trim() || undefined,
      keyHighlights: highlightsArr,
      status: newProdStatus,
    });

    setIsProductModalOpen(false);
    setNewProdTitle('');
    setNewProdSummary('');
    setNewProdHighlights('');
    setNewProdImageUrl('');
    setNewProdPrice('');
    setNewProdIsPriceConfirmed(false);
    setNewProdStatus('掲載中');
  };

  // Open Product Edit Modal
  const openEditProductModal = (product: ProductItem) => {
    setEditingProduct(product);
    setEditProdTitle(product.title);
    setEditProdCategory(product.category);
    setEditProdIsPriceConfirmed(product.price !== null);
    setEditProdPrice(product.price !== null ? String(product.price) : '');
    setEditProdSummary(product.summary || '');
    setEditProdHighlights(product.keyHighlights?.join('\n') || '');
    setEditProdImageUrl(product.imageUrl || '');
    setEditProdStatus(product.status);
    setEditProdOrder(product.order !== undefined ? String(product.order) : '0');
  };

  // Save Edited Product
  const handleSaveEditedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const highlightsArr = editProdHighlights
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    await updateProduct(editingProduct.id, {
      title: editProdTitle.trim(),
      category: editProdCategory,
      price: editProdIsPriceConfirmed && editProdPrice ? Number(editProdPrice) : null,
      summary: editProdSummary.trim(),
      keyHighlights: highlightsArr,
      imageUrl: editProdImageUrl.trim() || undefined,
      status: editProdStatus,
      order: editProdOrder ? Number(editProdOrder) : 0,
    });

    setEditingProduct(null);
  };

  // Handle Stone Rate Price Update
  const handleSaveRatePrice = (planId: string) => {
    const val = rateEditNewPrice.trim() === '' ? null : Number(rateEditNewPrice);
    updateStoneRatePrice(planId, val, rateEditReason.trim() || '管理者による価格改定');
    setRateEditPlanId(null);
    setRateEditNewPrice('');
    setRateEditReason('');
  };

  // Open Stone Rate Full Edit Modal
  const openEditRateModal = (plan: StoneRatePlan) => {
    setEditingRatePlan(plan);
    const isVerified = plan.verifiedForPublic === true;
    setEditRatePlanName(isVerified ? plan.planName : '');
    setEditRateAmount(isVerified ? plan.currencyAmount : '');
    setEditRateConditions(isVerified ? plan.conditions : '');
    setEditRateRefPrice(isVerified ? String(plan.referencePrice) : '0');
    setEditRateIsPriceConfirmed(isVerified && plan.currentPrice !== null);
    setEditRateCurrPrice(isVerified && plan.currentPrice !== null ? String(plan.currentPrice) : '');
    setEditRateNotes(isVerified ? plan.notes || '' : '');
  };

  // Save Stone Rate Full Edit
  const handleSaveEditedRatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRatePlan) return;

    const currPriceVal = editRateIsPriceConfirmed && editRateCurrPrice ? Number(editRateCurrPrice) : null;
    await updateStoneRatePlan(editingRatePlan.id, {
      planName: editRatePlanName.trim(),
      currencyAmount: editRateAmount.trim(),
      conditions: editRateConditions.trim(),
      referencePrice: Number(editRateRefPrice) || 0,
      currentPrice: currPriceVal,
      status: currPriceVal === null ? '価格確認中' : '取扱中',
      isPreparation: currPriceVal === null,
      verifiedForPublic: currPriceVal !== null,
      notes: editRateNotes.trim() || undefined,
      confirmedDate: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
    });

    setEditingRatePlan(null);
  };

  // Handle Add Stone Rate Plan
  const handleCreateStoneRate = (e: React.FormEvent) => {
    e.preventDefault();
    const game = games.find((g) => g.id === newRateGameId);
    if (!game) return;

    const currPriceVal = newRateIsPriceConfirmed && newRateCurrPrice ? Number(newRateCurrPrice) : null;

    addNewStoneRatePlan({
      gameId: game.id,
      gameCode: game.code,
      gameName: game.name,
      planName: newRatePlanName.trim(),
      currencyName: game.currencyName,
      currencyAmount: newRateAmount.trim(),
      conditions: newRateConditions.trim() || '初期状態・即納対応',
      referencePrice: Number(newRateRefPrice) || 0,
      currentPrice: currPriceVal,
      confirmedDate: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
      status: currPriceVal === null ? '価格確認中' : '取扱中',
      isPreparation: currPriceVal === null,
      verifiedForPublic: currPriceVal !== null,
    });

    setIsAddRateModalOpen(false);
    setNewRatePlanName('');
    setNewRateAmount('');
    setNewRateConditions('');
    setNewRateCurrPrice('');
    setNewRateIsPriceConfirmed(false);
  };

  // Handle Create Game Title
  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim() || !newGameCode.trim()) return;

    await addNewGameTitle({
      name: newGameName.trim(),
      code: newGameCode.trim().toUpperCase(),
      shortName: newGameShortName.trim() || newGameName.trim(),
      category: newGameCategory.trim() || 'RPG',
      currencyName: newGameCurrencyName.trim() || '通貨',
      currencyUnit: newGameCurrencyUnit.trim() || '個',
      iconUrl: newGameIconUrl.trim() || '',
      description: newGameDescription.trim() || `${newGameName.trim()}のゲーム紹介`,
      isHandled: true,
      order: games.length + 1,
    });

    setIsAddGameModalOpen(false);
    setNewGameName('');
    setNewGameCode('');
    setNewGameShortName('');
    setNewGameCurrencyName('');
    setNewGameIconUrl('');
    setNewGameDescription('');
  };

  // Change Game Order (Up / Down)
  const handleMoveGameOrder = async (game: GameTitle, direction: 'up' | 'down') => {
    const currentIndex = games.findIndex((g) => g.id === game.id);
    if (direction === 'up' && currentIndex > 0) {
      const prevGame = games[currentIndex - 1];
      const currentOrder = game.order ?? currentIndex;
      const prevOrder = prevGame.order ?? (currentIndex - 1);
      await updateGameDetails(game.id, { order: prevOrder });
      await updateGameDetails(prevGame.id, { order: currentOrder });
    } else if (direction === 'down' && currentIndex < games.length - 1) {
      const nextGame = games[currentIndex + 1];
      const currentOrder = game.order ?? currentIndex;
      const nextOrder = nextGame.order ?? (currentIndex + 1);
      await updateGameDetails(game.id, { order: nextOrder });
      await updateGameDetails(nextGame.id, { order: currentOrder });
    }
  };

  // Handle Settings Save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      lineUrl: tempLineUrl.trim(),
      shopNotice: tempNotice.trim(),
      contactDeskHours: tempContactHours.trim(),
    });
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in text-stone-200">
      {/* Top Header */}
      <div className="border-b border-[#d4af37]/20 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#d4af37] text-xs font-cinzel tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>SENA LUXE EXECUTIVE PORTAL</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 ml-2">
              FIREBASE: sena-luxe
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">管理者ダッシュボード</h1>
          <p className="text-xs text-stone-400 mt-1">
            ログイン中: <span className="text-stone-200 font-mono font-medium">{currentUser?.email || '認証管理者'}</span> {currentUser?.uid && <span className="text-[#d4af37] font-mono text-[11px] ml-1">({currentUser.uid})</span>} | スマートフォン・PC対応リアルタイム管理
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentView('top')}
            className="px-3 py-2 rounded-lg text-xs font-medium text-stone-300 bg-stone-900 hover:bg-stone-800 border border-stone-800 transition-colors"
          >
            サイトプレビュー
          </button>
          <button
            onClick={() => {
              logoutAdmin();
              setCurrentView('top');
            }}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ログアウト</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Scrollable on mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-stone-800">
        {[
          { id: 'products', label: '商品管理', icon: ShoppingBag, count: products.length },
          { id: 'rates', label: '石垢料金表', icon: Gem, count: stoneRates.length },
          { id: 'games', label: 'ゲームタイトル', icon: Sparkles, count: games.length },
          { id: 'sequences', label: '商品番号・台帳', icon: Hash },
          { id: 'requests', label: 'リクエスト', icon: HelpCircle, count: requests.length },
          { id: 'settings', label: '運営・LINE設定', icon: Settings },
          { id: 'firebase', label: 'Firebase接続', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-[#d4af37] text-black font-semibold shadow-sm'
                  : 'bg-[#121316] text-stone-400 hover:text-white border border-stone-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-black/20 text-black' : 'bg-stone-800 text-stone-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: Products Management */}
      {/* ======================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">商品カタログ管理</h2>
              <p className="text-xs text-stone-400">
                商品追加時は選択ゲームコードに応じた次回番号（例: SL-FP-004）がサーバー側で安全に自動採番されます。
              </p>
            </div>
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="px-4 py-2.5 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>新規商品を登録（自動採番）</span>
            </button>
          </div>

          {/* Products Table (Responsive horizontal scroll for mobile) */}
          <div className="overflow-x-auto rounded-xl border border-stone-800 bg-[#111216]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0c0e] text-stone-400 border-b border-stone-800 font-medium whitespace-nowrap">
                <tr>
                  <th className="py-3 px-3 sm:px-4">商品番号</th>
                  <th className="py-3 px-3 sm:px-4 min-w-[160px]">タイトル / ゲーム</th>
                  <th className="py-3 px-3 sm:px-4">カテゴリー</th>
                  <th className="py-3 px-3 sm:px-4">価格</th>
                  <th className="py-3 px-3 sm:px-4">掲載状況</th>
                  <th className="py-3 px-3 sm:px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-900/40 transition-colors">
                    <td className="py-3 px-3 sm:px-4 font-mono font-bold text-[#f7e7ce] whitespace-nowrap">
                      {p.productNumber}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <div className="font-semibold text-white line-clamp-1">{p.title}</div>
                      <div className="text-[11px] text-[#d4af37]">{p.gameName}</div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-stone-400 whitespace-nowrap">{p.category}</td>
                    <td className="py-3 px-3 sm:px-4 font-mono whitespace-nowrap">
                      {p.price !== null ? (
                        <span className="font-bold text-stone-200">¥{p.price.toLocaleString()}</span>
                      ) : (
                        <span className="text-amber-400 font-medium">価格確認中</span>
                      )}
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <select
                        value={p.status}
                        onChange={(e) => toggleProductStatus(p.id, e.target.value as ProductStatus)}
                        className={`text-[11px] font-medium rounded px-2 py-1 border bg-stone-900 focus:outline-none ${
                          p.status === '掲載中'
                            ? 'text-emerald-300 border-emerald-800'
                            : p.status === '売り切れ'
                            ? 'text-stone-400 border-stone-700'
                            : p.status === '商談中'
                            ? 'text-amber-300 border-amber-800'
                            : 'text-rose-400 border-rose-800'
                        }`}
                      >
                        <option value="掲載中">掲載中</option>
                        <option value="商談中">商談中</option>
                        <option value="売り切れ">売り切れ</option>
                        <option value="掲載停止">掲載停止 (非公開)</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditProductModal(p)}
                          className="p-1.5 text-stone-400 hover:text-[#d4af37] rounded hover:bg-stone-800 transition-colors"
                          title="商品編集・画像アップロード"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`商品「${p.productNumber}」を削除しますか？\n※番号は永久欠番として記録され再利用されません。`)) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 text-stone-500 hover:text-rose-400 rounded hover:bg-stone-800 transition-colors"
                          title="削除（永久欠番化）"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: Stone Rates Management */}
      {/* ======================================================== */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">石垢専用料金表管理</h2>
              <p className="text-xs text-stone-400">
                全33タイトル・118プランの参考市場価格と現在価格の分離管理・未確認商品の「価格確認中」「要相談」「要確認」設定
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleBulkSetPreparation}
                disabled={isBulkSettingPrep}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                title="全33タイトルの石垢全プランを一括で「現在準備中」「在庫要確認」に変更"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{isBulkSettingPrep ? '一括変更中...' : '全石垢プランを準備中に一括変更'}</span>
              </button>
              <button
                onClick={handleBulkSyncRates}
                disabled={isSyncingRates}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 border border-[#d4af37]/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                title="初期マスタの全33タイトル・118プランをFirestoreへ一括反映"
              >
                <Database className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>{isSyncingRates ? 'Firestore同期中...' : '料金表一括同期 (Firestoreへ反映)'}</span>
              </button>
              <button
                onClick={() => setIsAddRateModalOpen(true)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>石垢プラン新規追加</span>
              </button>
            </div>
          </div>

          {/* Sync Feedback Toast */}
          {syncFeedback && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between">
              <span>{syncFeedback}</span>
              <button
                onClick={() => setSyncFeedback(null)}
                className="text-emerald-400 hover:text-emerald-200 ml-3 font-semibold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Rates Table */}
          <div className="overflow-x-auto rounded-xl border border-stone-800 bg-[#111216]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0c0e] text-stone-400 border-b border-stone-800 font-medium whitespace-nowrap">
                <tr>
                  <th className="py-3 px-3 sm:px-4">ゲーム / プラン名</th>
                  <th className="py-3 px-3 sm:px-4">通貨数量・条件・端末</th>
                  <th className="py-3 px-3 sm:px-4">参考市場価格</th>
                  <th className="py-3 px-3 sm:px-4">現在提供価格</th>
                  <th className="py-3 px-3 sm:px-4">ステータス</th>
                  <th className="py-3 px-3 sm:px-4">最終確認日</th>
                  <th className="py-3 px-3 sm:px-4">改定履歴</th>
                  <th className="py-3 px-3 sm:px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {stoneRates.map((plan) => (
                  <tr key={plan.id} className="hover:bg-stone-900/40 transition-colors">
                    <td className="py-3 px-3 sm:px-4">
                      <div className="text-[11px] text-[#d4af37] font-medium">{plan.gameName}</div>
                      <div className="font-semibold text-white">{plan.verifiedForPublic ? plan.planName : '未確認プラン（非公開）'}</div>
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      {plan.verifiedForPublic ? (
                        <>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[#f7e7ce] font-bold">{plan.currencyAmount}</span>
                            {plan.deviceRequirement && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60">
                                {plan.deviceRequirement}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-400 line-clamp-1">{plan.conditions}</div>
                          {plan.notes && (
                            <div className="text-[10px] text-amber-400/90 italic">※ {plan.notes}</div>
                          )}
                        </>
                      ) : (
                        <div className="text-[11px] text-amber-400">数量・条件は未確認（編集画面で再入力）</div>
                      )}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-mono text-stone-400 whitespace-nowrap">
                      {plan.verifiedForPublic && plan.referencePrice > 0 ? `¥${plan.referencePrice.toLocaleString()}` : '未確認・非公開'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-mono whitespace-nowrap">
                      {plan.verifiedForPublic && plan.priceDisplay ? (
                        <span className="font-bold text-[#f7e7ce]">{plan.priceDisplay}</span>
                      ) : plan.verifiedForPublic && plan.currentPrice !== null ? (
                        <span className="font-bold text-white">¥{plan.currentPrice.toLocaleString()}</span>
                      ) : (
                        <span className="text-amber-400 font-medium">{plan.verifiedForPublic ? (plan.status === '要相談' ? '要相談' : '価格確認中') : '未確認・非公開'}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded border flex items-center gap-1 ${
                            plan.status === '現在準備中'
                              ? 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                              : plan.status === '取扱中'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              : plan.status === '価格確認中'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                              : plan.status === '要相談'
                              ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
                              : plan.status === '要確認'
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                              : 'bg-stone-900 text-stone-400 border-stone-800'
                          }`}
                        >
                          {plan.status === '現在準備中' && <Clock className="w-2.5 h-2.5 text-amber-400" />}
                          {plan.status}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-800">
                          {plan.stockStatus || '在庫要確認'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-stone-400 font-mono text-[11px] whitespace-nowrap">
                      {plan.confirmedDate}
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                      <span className="text-[11px] text-stone-400">
                        {plan.priceHistory?.length || 0}件
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                      {rateEditPlanId === plan.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            placeholder="新価格 (空欄で確認中)"
                            value={rateEditNewPrice}
                            onChange={(e) => setRateEditNewPrice(e.target.value)}
                            className="w-24 text-xs bg-stone-900 border border-[#d4af37] text-white px-2 py-1 rounded"
                          />
                          <input
                            type="text"
                            placeholder="改定理由"
                            value={rateEditReason}
                            onChange={(e) => setRateEditReason(e.target.value)}
                            className="w-28 text-xs bg-stone-900 border border-stone-700 text-stone-200 px-2 py-1 rounded hidden sm:inline-block"
                          />
                          <button
                            onClick={() => handleSaveRatePrice(plan.id)}
                            className="p-1 rounded bg-[#d4af37] text-black"
                            title="保存"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRateEditPlanId(null)}
                            className="p-1 rounded bg-stone-800 text-stone-400"
                            title="キャンセル"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditRateModal(plan)}
                            className="p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300"
                            title="プラン全項目を編集"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={async () => {
                              const nextStatus = plan.verifiedForPublic ? '現在準備中' : '取扱中';
                              const canActivate =
                                plan.currentPrice !== null &&
                                plan.currentPrice > 0 &&
                                Boolean(plan.planName?.trim()) &&
                                Boolean(plan.currencyAmount?.trim()) &&
                                Boolean(plan.conditions?.trim());
                              if (nextStatus === '取扱中' && !canActivate) return;
                              await updateStoneRatePlan(plan.id, {
                                status: nextStatus,
                                stockStatus: '在庫要確認',
                                isPreparation: nextStatus !== '取扱中',
                                verifiedForPublic: nextStatus === '取扱中',
                              });
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                              !plan.verifiedForPublic
                                ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60'
                                : 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border-amber-700/60'
                            }`}
                            disabled={!plan.verifiedForPublic && !(plan.currentPrice !== null && plan.currentPrice > 0 && Boolean(plan.planName?.trim()) && Boolean(plan.currencyAmount?.trim()) && Boolean(plan.conditions?.trim()))}
                            title="価格・商品名・通貨数量・条件を入力してから取扱中に変更できます"
                          >
                            {plan.verifiedForPublic ? '準備中に変更' : '内容確認済みとして公開'}
                          </button>
                          <button
                            onClick={() => {
                              setRateEditPlanId(plan.id);
                              setRateEditNewPrice(plan.verifiedForPublic && plan.currentPrice !== null ? String(plan.currentPrice) : '');
                              setRateEditReason('');
                            }}
                            className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[11px] text-[#d4af37] border border-stone-700"
                          >
                            価格変更
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: Games Title & Candidate Management */}
      {/* ======================================================== */}
      {activeTab === 'games' && (
        <div className="space-y-8">
          {/* Handled Games with Order adjustment and Add game */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white">取扱ゲームタイトル管理 & 掲載順変更</h2>
                <p className="text-xs text-stone-400">
                  ▲▼ボタンでトップページの掲載順序を変更できます。アイコン画像の変更や新規タイトルの追加も可能です。
                </p>
              </div>
              <button
                onClick={() => setIsAddGameModalOpen(true)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>新規ゲームタイトルを追加</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {games.map((game, idx) => (
                <div key={game.id} className="p-4 rounded-xl bg-[#111216] border border-stone-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-[#d4af37] border border-[#d4af37]/30">
                        {game.code} (掲載順 #{idx + 1})
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveGameOrder(game, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 disabled:opacity-30 disabled:pointer-events-none"
                          title="掲載順を上へ"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveGameOrder(game, 'down')}
                          disabled={idx === games.length - 1}
                          className="p-1 rounded bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 disabled:opacity-30 disabled:pointer-events-none"
                          title="掲載順を下へ"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <GameCardIcon game={game} size="sm" />
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-white truncate">{game.name}</div>
                        <div className="text-[11px] text-stone-400">
                          通貨: <span className="text-[#d4af37]">{game.currencyName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Image Status Row */}
                    <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400 text-[10px]">通貨画像:</span>
                        {game.currencyIconUrl ? (
                          <div className="flex items-center gap-1">
                            <img
                              src={game.currencyIconUrl}
                              alt="Currency"
                              className="w-4 h-4 rounded object-cover border border-[#d4af37]/40"
                            />
                            <span className="text-emerald-400 text-[10px]">設定済</span>
                          </div>
                        ) : (
                          <span className="text-stone-500 text-[10px]">未登録 (共通)</span>
                        )}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        game.iconUrl ? 'text-emerald-400 bg-emerald-950/40' : 'text-stone-500 bg-stone-900'
                      }`}>
                        {game.iconUrl ? 'アイコン登録済' : 'アイコン未登録'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-stone-800/80">
                    <button
                      onClick={() => openGameIconModal(game)}
                      className="w-full py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 rounded-lg border border-amber-800/60 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>アイコン・画像設定</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Candidate Games */}
          {candidateGames.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-stone-800">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white">取扱候補ゲーム (ワンタップで取扱開始)</h2>
                <p className="text-xs text-stone-400">
                  「取扱ゲームへ昇格」ボタンを押すと、正式取扱ゲーム一覧へ追加され、石垢初期プラン枠が生成されます。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {candidateGames.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl bg-[#111216] border border-stone-800/80 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <GameCardIcon game={c} size="sm" />
                      <div className="overflow-hidden">
                        <div className="text-[10px] font-cinzel text-amber-400 font-bold">{c.code}</div>
                        <div className="text-xs font-semibold text-white truncate">{c.name}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-stone-400 truncate">{c.description}</div>

                    <div className="flex items-center gap-2 pt-1 border-t border-stone-800/80">
                      <button
                        onClick={() => openGameIconModal(c)}
                        className="flex-1 py-1 text-[11px] text-stone-300 hover:text-white bg-stone-900 hover:bg-stone-800 rounded border border-stone-800 transition-colors flex items-center justify-center gap-1"
                        title="画像設定"
                      >
                        <ImageIcon className="w-3 h-3 text-[#d4af37]" />
                        <span>画像設定</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`「${c.name}」を正式取扱ゲームへ昇格しますか？`)) {
                            promoteCandidateToHandled(c.id);
                          }
                        }}
                        className="flex-1 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>取扱昇格</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: Serial Number & Retired Number Ledger (永久欠番台帳) */}
      {/* ======================================================== */}
      {activeTab === 'sequences' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white">商品番号発行・永久欠番台帳</h2>
            <p className="text-xs text-stone-400">
              形式: SL-ゲームコード-3桁連番（例: SL-FP-001）。一度発行された番号は削除後も永久欠番として記録され、再利用を完全に防止します。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(sequences).map(([code, seq]) => (
              <div key={code} className="p-5 rounded-xl bg-[#111216] border border-stone-800 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#d4af37] bg-black px-2 py-0.5 rounded border border-[#d4af37]/30">
                      {code}
                    </span>
                    <span className="text-xs font-semibold text-white">ゲームコード系列</span>
                  </div>
                  <div className="text-xs text-stone-400">
                    最新連番: <span className="font-mono text-white font-bold">{seq.lastSequence}</span> (次回: SL-{code}-{String(seq.lastSequence + 1).padStart(3, '0')})
                  </div>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <div className="text-[11px] text-stone-400 font-medium">発番・欠番履歴一覧:</div>
                  {seq.retiredNumbers.map((r, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-[#0a0b0d] border border-stone-800/70 text-[11px] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-bold text-stone-200 mr-2">{r.productNumber}</span>
                        <span className="text-stone-400">{r.productTitle}</span>
                      </div>
                      <div className="text-right text-[10px] text-stone-500">
                        {r.issuedAt} {r.retiredAt ? `(欠番化: ${r.retiredAt})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: Requests Management */}
      {/* ======================================================== */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white">その他・ゲームリクエスト管理</h2>
            <p className="text-xs text-stone-400">
              ユーザーが「その他・ゲームリクエスト」フォームより送信した問い合わせ一覧。
            </p>
          </div>

          {requests.length === 0 ? (
            <div className="p-10 text-center rounded-xl bg-[#111216] border border-stone-800 text-stone-400 text-xs">
              現在新規リクエストはありません。
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="p-5 rounded-xl bg-[#111216] border border-stone-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{req.gameTitle}</span>
                      <span className="text-[10px] text-stone-400 px-2 py-0.5 rounded bg-stone-900 border border-stone-800">
                        {req.requestType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-stone-500 font-mono">
                        {req.createdAt.split('T')[0]}
                      </span>
                      <select
                        value={req.status}
                        onChange={(e) => updateRequestStatus(req.id, e.target.value as any)}
                        className="text-xs bg-stone-900 border border-stone-700 text-[#d4af37] rounded px-2 py-1"
                      >
                        <option value="受付済">受付済</option>
                        <option value="確認中">確認中</option>
                        <option value="案内済">案内済</option>
                        <option value="対応不可">対応不可</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-stone-500 block text-[11px]">希望数量・条件:</span>
                      <span className="text-stone-300 font-medium">{req.desiredQuantity}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[11px]">希望予算:</span>
                      <span className="text-stone-300 font-medium">{req.budget}</span>
                    </div>
                  </div>

                  {req.contactNotes && (
                    <div className="text-xs bg-stone-900/60 p-2.5 rounded border border-stone-800/80 text-stone-300">
                      <span className="text-stone-500 text-[10px] block">ユーザー連絡事項:</span>
                      {req.contactNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: Settings & Operating Info */}
      {/* ======================================================== */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white">サイト運営情報・LINE公式連携設定</h2>
            <p className="text-xs text-stone-400">
              全ページの問い合わせ先、特商法表記の受付時間、フッター告知文を自由にカスタマイズできます。
            </p>
          </div>

          {settingsSavedToast && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>サイト運営情報を正常に更新・保存いたしました。</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-200">LINE公式アカウント URL</label>
            <input
              type="url"
              required
              value={tempLineUrl}
              onChange={(e) => setTempLineUrl(e.target.value)}
              placeholder="https://lin.ee/6uy8hu9"
              className="w-full text-xs sm:text-sm bg-[#0a0b0d] text-white border border-stone-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>運営・受付時間表記（フッター・特商法・ショップ情報に反映）</span>
            </label>
            <input
              type="text"
              required
              value={tempContactHours}
              onChange={(e) => setTempContactHours(e.target.value)}
              placeholder="例: 公式LINEにてご案内 / 平日10:00 - 22:00"
              className="w-full text-xs sm:text-sm bg-[#0a0b0d] text-white border border-stone-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#d4af37]"
            />
            <p className="text-[11px] text-stone-500">
              ※確証のない「24時間対応」「年中無休」等は避け、実際の運営体制に合わせた文言を設定してください。
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-200">フッター・アナウンス告知文</label>
            <textarea
              rows={3}
              value={tempNotice}
              onChange={(e) => setTempNotice(e.target.value)}
              className="w-full text-xs sm:text-sm bg-[#0a0b0d] text-white border border-stone-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#d4af37] resize-none"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>サイト運営情報を保存する</span>
          </button>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 7: Firebase Setup & Auth Guidance */}
      {/* ======================================================== */}
      {activeTab === 'firebase' && (
        <div className="max-w-3xl space-y-6">
          <div>
            <div className="flex items-center gap-2 text-[#d4af37] text-xs font-cinzel tracking-wider uppercase mb-1">
              <Database className="w-4 h-4" />
              <span>FIREBASE LIVE BACKEND ARCHITECTURE</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">Firebase「sena-luxe」接続状況 & セキュリティ</h2>
            <p className="text-xs text-stone-400 mt-1">
              Firestore Database（トランザクション採番・永続化）および Firebase Authentication（メール/PW認証）の稼働ステータスです。
            </p>
          </div>

          {/* Current Live Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0e0f13] border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-stone-400 font-medium">接続プロジェクトID</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  CONNECTED
                </span>
              </div>
              <div className="font-mono text-sm font-bold text-[#f7e7ce]">sena-luxe</div>
              <div className="text-[10px] text-stone-500">Google Cloud / Firebase 本番プロジェクト</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e0f13] border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-stone-400 font-medium">Firestore Database ID</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ONLINE
                </span>
              </div>
              <div className="font-mono text-xs font-bold text-stone-200 truncate" title="ai-studio-senaluxe-db843e7b-ccb6-43a4-9c9e-55c8dd6ab699">
                ai-studio-senaluxe-db843e7b-ccb6-43a4-9c9e-55c8dd6ab699
              </div>
              <div className="text-[10px] text-stone-500">Named Enterprise Firestore</div>
            </div>
          </div>

          {/* Security & Rules Info */}
          <div className="rounded-xl bg-[#111216] border border-stone-800 p-6 space-y-4 text-xs text-stone-300 leading-relaxed">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#d4af37] rounded-full inline-block" />
              セキュリティルール（firestore.rules）適用概要
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-[#0a0b0d] border border-stone-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">一般ユーザー（閲覧専用・未認証保護）</div>
                  <div className="text-stone-400 text-[11px] mt-0.5">
                    取扱ゲーム一覧・公開商品カタログ・石垢料金表の「読み取り（get / list）」のみ許可。内部情報や番号発番台帳へのアクセスは拒否。
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0a0b0d] border border-stone-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">商品番号の安全なアトミック採番（Transaction）</div>
                  <div className="text-stone-400 text-[11px] mt-0.5">
                    商品登録時はFirestoreのトランザクション機能により、同時書き込み時でも連番の重複が発生せず、削除後も永久欠番として確実に記録。
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0a0b0d] border border-stone-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">管理者権限のサーバー側検証（admins / verified email）</div>
                  <div className="text-stone-400 text-[11px] mt-0.5">
                    商品の新規追加、編集、価格改定、非公開化、削除はFirebase Authenticationで認証された正規の管理者のみ書き込みが許可されます。
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-stone-400">
                マスターデータの初期同期状態：{isFirestoreConnected ? '同期稼働中' : '確認中'}
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await seedInitialDataIfEmpty();
                    alert('Firestoreコレクションの初期データ確認および同期を実行いたしました。');
                  } catch (e: any) {
                    alert('同期エラー: ' + (e.message || String(e)));
                  }
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 transition-colors"
              >
                マスターデータ再確認・初期同期
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: New Product (Auto-Numbering & File Upload) */}
      {/* ======================================================== */}
      {isProductModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={() => setIsProductModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-[#121316] border border-[#d4af37]/40 rounded-xl p-5 sm:p-6 shadow-2xl text-stone-200 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#d4af37]" />
                新規商品登録（自動発番システム）
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-stone-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">対象ゲームタイトル</label>
                  <select
                    value={newProdGameId}
                    onChange={(e) => setNewProdGameId(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                  >
                    {games.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">カテゴリー</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as ProductCategory)}
                    className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="ゲームアカウント">ゲームアカウント</option>
                    <option value="ゲーム内通貨・石垢">ゲーム内通貨・石垢</option>
                    <option value="育成済みデータ">育成済みデータ</option>
                    <option value="限定キャラクター・アイテム">限定キャラクター・アイテム</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-stone-300 block mb-1 font-semibold">商品タイトル *</label>
                <input
                  type="text"
                  required
                  placeholder="例: 初期リセマラ・限定SSR共存アカウント"
                  value={newProdTitle}
                  onChange={(e) => setNewProdTitle(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                />
              </div>

              {/* Price & Price-confirmed toggle */}
              <div className="p-3 rounded-lg bg-[#0a0b0d] border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-stone-300 font-semibold">販売価格 (円)</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-stone-300">
                    <input
                      type="checkbox"
                      checked={!newProdIsPriceConfirmed}
                      onChange={(e) => setNewProdIsPriceConfirmed(!e.target.checked)}
                      className="rounded accent-[#d4af37]"
                    />
                    <span className="text-amber-400 font-medium">価格確認中（価格未確定）にする</span>
                  </label>
                </div>
                {newProdIsPriceConfirmed && (
                  <input
                    type="number"
                    placeholder="例: 28000"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-white"
                  />
                )}
              </div>

              {/* Image Upload for Mobile */}
              <div className="space-y-2">
                <label className="text-stone-300 block font-semibold">商品画像（スマホ写真・カメラ・URL）</label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="file"
                    ref={newProductFileInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, (dataUrl) => setNewProdImageUrl(dataUrl))}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => newProductFileInputRef.current?.click()}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 flex items-center justify-center gap-2 shrink-0 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>写真をアップロード (カメラ/写真)</span>
                  </button>
                  <input
                    type="url"
                    placeholder="または画像URL (https://...)"
                    value={newProdImageUrl}
                    onChange={(e) => setNewProdImageUrl(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white text-[11px]"
                  />
                </div>
                {newProdImageUrl && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#d4af37]/40 bg-black">
                    <img src={newProdImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewProdImageUrl('')}
                      className="absolute top-1 right-1 bg-black/80 text-rose-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Summary Description */}
              <div>
                <label className="text-stone-300 block mb-1 font-semibold">概要説明 (商品説明)</label>
                <textarea
                  rows={2}
                  placeholder="商品の概要・特徴（詳細な秘密情報は記載しないでください）"
                  value={newProdSummary}
                  onChange={(e) => setNewProdSummary(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white resize-none"
                />
              </div>

              {/* Highlights */}
              <div>
                <label className="text-stone-300 block mb-1 font-semibold">ハイライト（改行区切り）</label>
                <textarea
                  rows={2}
                  placeholder="限定SSR所持&#10;ワンオーナー安心データ&#10;即納対応"
                  value={newProdHighlights}
                  onChange={(e) => setNewProdHighlights(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-stone-300 block mb-1 font-semibold">掲載状況</label>
                <select
                  value={newProdStatus}
                  onChange={(e) => setNewProdStatus(e.target.value as ProductStatus)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                >
                  <option value="掲載中">掲載中 (公開)</option>
                  <option value="掲載停止">掲載停止 (非公開)</option>
                  <option value="商談中">商談中</option>
                  <option value="売り切れ">売り切れ</option>
                </select>
              </div>

              <div className="p-2.5 rounded bg-stone-900 border border-stone-800 text-[11px] text-stone-400">
                自動発番予定番号: <span className="font-mono text-[#d4af37] font-bold">
                  SL-{games.find((g) => g.id === newProdGameId)?.code || 'GEN'}-{String((sequences[games.find((g) => g.id === newProdGameId)?.code || 'FP']?.lastSequence || 0) + 1).padStart(3, '0')}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded bg-stone-800 text-stone-300"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e]"
                >
                  発番して登録
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Edit Product (Update description, price, unpublish, photo) */}
      {/* ======================================================== */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={() => setEditingProduct(null)}
        >
          <div
            className="relative w-full max-w-lg bg-[#121316] border border-[#d4af37]/40 rounded-xl p-5 sm:p-6 shadow-2xl text-stone-200 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#d4af37]" />
                  商品情報の編集
                </h3>
                <div className="text-xs font-mono text-[#d4af37] mt-0.5">
                  {editingProduct.productNumber} ({editingProduct.gameName})
                </div>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-stone-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedProduct} className="space-y-4 text-xs">
              <div>
                <label className="text-stone-300 block mb-1 font-semibold">カテゴリー</label>
                <select
                  value={editProdCategory}
                  onChange={(e) => setEditProdCategory(e.target.value as ProductCategory)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                >
                  <option value="ゲームアカウント">ゲームアカウント</option>
                  <option value="ゲーム内通貨・石垢">ゲーム内通貨・石垢</option>
                  <option value="育成済みデータ">育成済みデータ</option>
                  <option value="限定キャラクター・アイテム">限定キャラクター・アイテム</option>
                </select>
              </div>

              <div>
                <label className="text-stone-300 block mb-1 font-semibold">商品タイトル *</label>
                <input
                  type="text"
                  required
                  value={editProdTitle}
                  onChange={(e) => setEditProdTitle(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                />
              </div>

              {/* Price & Price Confirmed Toggle */}
              <div className="p-3 rounded-lg bg-[#0a0b0d] border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-stone-300 font-semibold">販売価格 (円)</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-stone-300">
                    <input
                      type="checkbox"
                      checked={!editProdIsPriceConfirmed}
                      onChange={(e) => setEditProdIsPriceConfirmed(!e.target.checked)}
                      className="rounded accent-[#d4af37]"
                    />
                    <span className="text-amber-400 font-medium">価格確認中（未確定）</span>
                  </label>
                </div>
                {editProdIsPriceConfirmed && (
                  <input
                    type="number"
                    placeholder="例: 35000"
                    value={editProdPrice}
                    onChange={(e) => setEditProdPrice(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2.5 text-white"
                  />
                )}
              </div>

              {/* Image Upload for Mobile */}
              <div className="space-y-2">
                <label className="text-stone-300 block font-semibold">商品画像（スマホ写真・カメラ・URL）</label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="file"
                    ref={editProductFileInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, (dataUrl) => setEditProdImageUrl(dataUrl))}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editProductFileInputRef.current?.click()}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 flex items-center justify-center gap-2 shrink-0 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>写真をアップロード (カメラ/写真)</span>
                  </button>
                  <input
                    type="url"
                    placeholder="または画像URL (https://...)"
                    value={editProdImageUrl}
                    onChange={(e) => setEditProdImageUrl(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white text-[11px]"
                  />
                </div>
                {editProdImageUrl && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#d4af37]/40 bg-black">
                    <img src={editProdImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditProdImageUrl('')}
                      className="absolute top-1 right-1 bg-black/80 text-rose-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Summary Description */}
              <div>
                <label className="text-stone-300 block mb-1 font-semibold">概要説明 (商品説明)</label>
                <textarea
                  rows={3}
                  value={editProdSummary}
                  onChange={(e) => setEditProdSummary(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white resize-none"
                />
              </div>

              {/* Highlights */}
              <div>
                <label className="text-stone-300 block mb-1 font-semibold">ハイライト（改行区切り）</label>
                <textarea
                  rows={2}
                  value={editProdHighlights}
                  onChange={(e) => setEditProdHighlights(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-stone-300 block mb-1 font-semibold">掲載状況</label>
                <select
                  value={editProdStatus}
                  onChange={(e) => setEditProdStatus(e.target.value as ProductStatus)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                >
                  <option value="掲載中">掲載中 (一般公開)</option>
                  <option value="掲載停止">掲載停止 (非公開)</option>
                  <option value="商談中">商談中</option>
                  <option value="売り切れ">売り切れ</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded bg-stone-800 text-stone-300"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e]"
                >
                  変更を保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: New Stone Rate Plan */}
      {/* ======================================================== */}
      {isAddRateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={() => setIsAddRateModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-[#121316] border border-[#d4af37]/40 rounded-xl p-5 sm:p-6 shadow-2xl text-stone-200 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gem className="w-4 h-4 text-[#d4af37]" />
                石垢料金プラン新規登録
              </h3>
              <button onClick={() => setIsAddRateModalOpen(false)} className="text-stone-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStoneRate} className="space-y-4 text-xs">
              <div>
                <label className="text-stone-300 block mb-1 font-semibold">対象ゲームタイトル</label>
                <select
                  value={newRateGameId}
                  onChange={(e) => setNewRateGameId(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                >
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (通貨: {g.currencyName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-stone-300 block mb-1 font-semibold">プラン名 *</label>
                <input
                  type="text"
                  required
                  placeholder="例: スタンダード天井確保プラン"
                  value={newRatePlanName}
                  onChange={(e) => setNewRatePlanName(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-stone-300 block mb-1 font-semibold">通貨数量表記 *</label>
                <input
                  type="text"
                  required
                  placeholder="例: 100,000個+ / 3,000金券+"
                  value={newRateAmount}
                  onChange={(e) => setNewRateAmount(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-stone-300 block mb-1 font-semibold">商品条件・進行状況</label>
                <input
                  type="text"
                  placeholder="例: 初期リセマラ・SSR確定チケット未受取"
                  value={newRateConditions}
                  onChange={(e) => setNewRateConditions(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">参考市場価格 (円)</label>
                  <input
                    type="number"
                    required
                    value={newRateRefPrice}
                    onChange={(e) => setNewRateRefPrice(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-stone-300 font-semibold">現在価格 (円)</label>
                    <label className="text-[10px] text-amber-400 flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!newRateIsPriceConfirmed}
                        onChange={(e) => setNewRateIsPriceConfirmed(!e.target.checked)}
                        className="rounded accent-[#d4af37]"
                      />
                      <span>確認中</span>
                    </label>
                  </div>
                  {newRateIsPriceConfirmed ? (
                    <input
                      type="number"
                      placeholder="例: 3000"
                      value={newRateCurrPrice}
                      onChange={(e) => setNewRateCurrPrice(e.target.value)}
                      className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                    />
                  ) : (
                    <div className="p-2.5 rounded bg-stone-900 border border-stone-800 text-amber-400 text-xs">
                      価格確認中として登録
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRateModalOpen(false)}
                  className="px-4 py-2 rounded bg-stone-800 text-stone-300"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e]"
                >
                  料金プランを追加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: Edit Stone Rate Plan Details */}
      {/* ======================================================== */}
      {editingRatePlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={() => setEditingRatePlan(null)}
        >
          <div
            className="relative w-full max-w-lg bg-[#121316] border border-[#d4af37]/40 rounded-xl p-5 sm:p-6 shadow-2xl text-stone-200 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#d4af37]" />
                  石垢プラン詳細編集
                </h3>
                <div className="text-xs text-[#d4af37]">{editingRatePlan.gameName}</div>
              </div>
              <button onClick={() => setEditingRatePlan(null)} className="text-stone-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedRatePlan} className="space-y-4 text-xs">
              <div>
                <label className="text-stone-300 block mb-1 font-semibold">プラン名 *</label>
                <input
                  type="text"
                  required
                  value={editRatePlanName}
                  onChange={(e) => setEditRatePlanName(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-stone-300 block mb-1 font-semibold">通貨数量表記 *</label>
                <input
                  type="text"
                  required
                  value={editRateAmount}
                  onChange={(e) => setEditRateAmount(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-stone-300 block mb-1 font-semibold">商品条件・進行状況</label>
                <input
                  type="text"
                  value={editRateConditions}
                  onChange={(e) => setEditRateConditions(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">参考市場価格 (円)</label>
                  <input
                    type="number"
                    required
                    value={editRateRefPrice}
                    onChange={(e) => setEditRateRefPrice(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-stone-300 font-semibold">現在価格 (円)</label>
                    <label className="text-[10px] text-amber-400 flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!editRateIsPriceConfirmed}
                        onChange={(e) => setEditRateIsPriceConfirmed(!e.target.checked)}
                        className="rounded accent-[#d4af37]"
                      />
                      <span>確認中</span>
                    </label>
                  </div>
                  {editRateIsPriceConfirmed ? (
                    <input
                      type="number"
                      value={editRateCurrPrice}
                      onChange={(e) => setEditRateCurrPrice(e.target.value)}
                      className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                    />
                  ) : (
                    <div className="p-2.5 rounded bg-stone-900 border border-stone-800 text-amber-400 text-xs">
                      価格確認中として保存
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-stone-300 block mb-1 font-semibold">備考・注意事項</label>
                <input
                  type="text"
                  value={editRateNotes}
                  onChange={(e) => setEditRateNotes(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRatePlan(null)}
                  className="px-4 py-2 rounded bg-stone-800 text-stone-300"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e]"
                >
                  変更を保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: Add New Game Title */}
      {/* ======================================================== */}
      {isAddGameModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={() => setIsAddGameModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-[#121316] border border-[#d4af37]/40 rounded-xl p-5 sm:p-6 shadow-2xl text-stone-200 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                新規ゲームタイトルを追加
              </h3>
              <button onClick={() => setIsAddGameModalOpen(false)} className="text-stone-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGame} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">ゲーム正式名称 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例: 崩壊：スターレイル"
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">ゲームコード (英数2-4文字) *</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="例: HSR"
                    value={newGameCode}
                    onChange={(e) => setNewGameCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">略称・通称</label>
                  <input
                    type="text"
                    placeholder="例: スタレ"
                    value={newGameShortName}
                    onChange={(e) => setNewGameShortName(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">ジャンル / カテゴリー</label>
                  <input
                    type="text"
                    placeholder="例: スペースファンタジーRPG"
                    value={newGameCategory}
                    onChange={(e) => setNewGameCategory(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">石垢通貨名称 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例: 星玉 / 星軌専用チケット"
                    value={newGameCurrencyName}
                    onChange={(e) => setNewGameCurrencyName(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-stone-300 block mb-1 font-semibold">通貨単位</label>
                  <input
                    type="text"
                    placeholder="例: 個 / 枚"
                    value={newGameCurrencyUnit}
                    onChange={(e) => setNewGameCurrencyUnit(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              {/* Game Icon upload / URL */}
              <div className="space-y-2">
                <label className="text-stone-300 block font-semibold">アプリアイコン画像</label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="file"
                    ref={newGameFileInputRef}
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, (dataUrl) => setNewGameIconUrl(dataUrl))}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => newGameFileInputRef.current?.click()}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 flex items-center justify-center gap-2 shrink-0 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>写真をアップロード (カメラ/写真)</span>
                  </button>
                  <input
                    type="url"
                    placeholder="または画像URL (https://...)"
                    value={newGameIconUrl}
                    onChange={(e) => setNewGameIconUrl(e.target.value)}
                    className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white text-[11px]"
                  />
                </div>
                {newGameIconUrl && (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#d4af37]/40 bg-black">
                    <img src={newGameIconUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewGameIconUrl('')}
                      className="absolute top-1 right-1 bg-black/80 text-rose-400 rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-stone-300 block mb-1 font-semibold">説明・取扱い詳細</label>
                <textarea
                  rows={2}
                  placeholder="ゲームの特徴や当店における取り扱い基準"
                  value={newGameDescription}
                  onChange={(e) => setNewGameDescription(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-stone-700 rounded-lg p-2.5 text-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddGameModalOpen(false)}
                  className="px-4 py-2 rounded bg-stone-800 text-stone-300"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e]"
                >
                  ゲームタイトルを追加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Game Icon & Currency Icon Editor Modal */}
      {/* ======================================================== */}
      {iconEditGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#111216] border border-[#d4af37]/40 p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <div className="text-[10px] font-cinzel text-[#d4af37] tracking-wider uppercase">
                  GAME ICON & ASSET MANAGEMENT
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                  <ImageIcon className="w-4 h-4 text-[#d4af37]" />
                  <span>{iconEditGame.name} の画像設定</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIconEditGame(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={gameIconFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                handleCompressedIconUpload(e, (dataUrl) => setTempIconUrl(dataUrl))
              }
            />
            <input
              type="file"
              ref={currencyIconFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                handleCompressedIconUpload(e, (dataUrl) => setTempCurrencyIconUrl(dataUrl))
              }
            />

            {/* Section 1: Game App Icon */}
            <div className="p-4 rounded-xl bg-[#0a0b0d] border border-stone-800/80 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#d4af37]" />
                    <span>ゲームアプリアイコン</span>
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    トップページ、ゲーム一覧、商品詳細ヘッダーに表示されるゲームの代表アイコンです。
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                  tempIconUrl
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                    : 'bg-stone-900 text-stone-400 border-stone-800'
                }`}>
                  {tempIconUrl ? '登録中' : '未登録'}
                </span>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-stone-900/60 border border-stone-800">
                {tempIconUrl ? (
                  <img
                    src={tempIconUrl}
                    alt="App Icon Preview"
                    className="w-14 h-14 rounded-xl object-cover border border-[#d4af37]/40 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-b from-[#181920] to-[#0a0b0e] border border-[#d4af37]/30 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-cinzel font-bold text-[#d4af37]">
                      {iconEditGame.code}
                    </span>
                  </div>
                )}
                <div className="text-[11px] text-stone-400 leading-relaxed">
                  {tempIconUrl ? (
                    <div className="space-y-1">
                      <span className="text-emerald-400 font-medium block">プレビュー表示中</span>
                      <button
                        type="button"
                        onClick={() => setTempIconUrl('')}
                        className="text-rose-400 hover:text-rose-300 underline text-[10px]"
                      >
                        アイコンをクリア（未登録に戻す）
                      </button>
                    </div>
                  ) : (
                    <span>未登録時はSENA LUXE専用の黒×ゴールド家紋風プレースホルダーが自動表示されます。</span>
                  )}
                </div>
              </div>

              {/* Action Buttons: File upload & URL input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => gameIconFileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>端末の写真 / ファイルから選択</span>
                  </button>
                  <span className="text-[10px] text-stone-500">（自動最適化）</span>
                </div>

                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">または画像URLを直接入力:</label>
                  <input
                    type="url"
                    value={tempIconUrl}
                    onChange={(e) => setTempIconUrl(e.target.value)}
                    placeholder="https://example.com/icon.png または空欄"
                    className="w-full text-xs bg-[#121316] border border-stone-700 focus:border-[#d4af37] text-white px-3 py-2 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: In-Game Currency Icon */}
            <div className="p-4 rounded-xl bg-[#0a0b0d] border border-stone-800/80 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>ゲーム内通貨アイコン（石垢プラン専用）</span>
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {iconEditGame.currencyName || '石・オーブ・ダイヤ'}のアイコン画像です。登録すると該当ゲームの石垢プラン商品画像として優先表示されます。
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                  tempCurrencyIconUrl
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                    : 'bg-stone-900 text-stone-400 border-stone-800'
                }`}>
                  {tempCurrencyIconUrl ? '登録中' : '未登録'}
                </span>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-stone-900/60 border border-stone-800">
                {tempCurrencyIconUrl ? (
                  <img
                    src={tempCurrencyIconUrl}
                    alt="Currency Icon Preview"
                    className="w-14 h-14 rounded-xl object-cover border border-[#d4af37]/40 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[#0c0d10] border border-[#d4af37]/30 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-[#d4af37]">石垢</span>
                    <span className="text-[9px] text-stone-500 font-mono">{iconEditGame.code}</span>
                  </div>
                )}
                <div className="text-[11px] text-stone-400 leading-relaxed">
                  {tempCurrencyIconUrl ? (
                    <div className="space-y-1">
                      <span className="text-emerald-400 font-medium block">通貨アイコン表示中</span>
                      <button
                        type="button"
                        onClick={() => setTempCurrencyIconUrl('')}
                        className="text-rose-400 hover:text-rose-300 underline text-[10px]"
                      >
                        通貨アイコンをクリア（未登録に戻す）
                      </button>
                    </div>
                  ) : (
                    <span>未登録時はSENA LUXE専用の黒×ゴールド石垢プレースホルダーが表示されます。レイアウト崩れは発生しません。</span>
                  )}
                </div>
              </div>

              {/* Action Buttons: File upload & URL input */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => currencyIconFileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-black bg-[#d4af37] hover:bg-[#e2bd4e] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>端末の写真 / ファイルから選択</span>
                  </button>
                  <span className="text-[10px] text-stone-500">（自動最適化）</span>
                </div>

                <div>
                  <label className="text-[10px] text-stone-400 block mb-1">または画像URLを直接入力:</label>
                  <input
                    type="url"
                    value={tempCurrencyIconUrl}
                    onChange={(e) => setTempCurrencyIconUrl(e.target.value)}
                    placeholder="https://example.com/currency.png または空欄"
                    className="w-full text-xs bg-[#121316] border border-stone-700 focus:border-[#d4af37] text-white px-3 py-2 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIconEditGame(null)}
                disabled={isSavingIcon}
                className="px-4 py-2 text-xs font-medium text-stone-300 hover:text-white bg-stone-800 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSaveGameIcons}
                disabled={isSavingIcon}
                className="px-5 py-2 text-xs font-bold text-black bg-[#d4af37] hover:bg-[#e2bd4e] rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingIcon ? '保存中...' : '画像設定を保存'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
