/**
 * SENA LUXE - Type Definitions
 * Premium Game Collection
 */

export type GameCode = 'FP' | 'UM' | 'KT' | 'NK' | 'EF' | 'KO' | 'PS' | 'KB' | string;

export interface GameTitle {
  id: string;
  code: string; // e.g. FP, UM, KT
  name: string; // Official full name e.g. 呪術廻戦 ファントムパレード
  shortName: string; // Short nickname e.g. ファンパレ
  category: string; // e.g. RPG / 育成 / アクション
  currencyName: string; // e.g. 廻珠, ジュエル, 虹のコトダマ
  currencyUnit: string; // e.g. 個, コイン, 金券, ダイヤ
  iconUrl: string; // App icon image
  currencyIconUrl?: string; // In-game currency icon image (e.g. 廻珠, ジュエル, オーブ, 聖晶石)
  logoUrl?: string; // Small game logo
  isHandled: boolean; // true for handled games, false for candidates
  description: string;
  order?: number; // display order index
}

export type ProductCategory =
  | 'ゲームアカウント'
  | 'ゲーム内通貨・石垢'
  | '引退垢'
  | '育成済みデータ'
  | '限定キャラクター・アイテム';

export type ProductStatus = '掲載中' | '商談中' | '売り切れ' | '掲載停止';

export interface ProductItem {
  id: string;
  productNumber: string; // e.g. SL-FP-001
  gameId: string;
  gameCode: string;
  gameName: string;
  category: ProductCategory;
  title: string;
  summary: string;
  price: number | null; // null represents '価格確認中'
  priceDisplay?: string; // e.g. "¥49,800" or "価格確認中"
  status: ProductStatus;
  verifiedForPublic?: boolean;
  imageUrl?: string;
  videoUrl?: string; // Legacy external MP4/WebM URL
  videoStorageId?: string; // Video file stored in Firestore chunks under the free-tier quota
  deviceCompatibility?: 'iOSのみ' | 'Androidのみ' | 'iOS・Android両方可';
  currencyIconUrl?: string; // for stone accounts
  keyHighlights: string[]; // High-level highlights without revealing confidential account credentials
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistoryRecord {
  date: string;
  oldPrice: number;
  newPrice: number;
  reason?: string;
}

export interface StoneRatePlan {
  id: string;
  gameId: string;
  gameCode: string;
  gameName: string;
  planName: string; // e.g. スタンダード天井確保プラン
  currencyName: string; // e.g. 廻珠
  currencyAmount: string; // e.g. 80,000個+
  conditions: string; // e.g. 初期進行・SSR確定チケット未受取・即納
  referencePrice: number; // 参考サイト基準価格
  currentPrice: number | null; // 現在販売価格 (null = 価格確認中)
  priceDisplay?: string; // e.g. "3,000円〜", "2,000〜3,000円", "要相談"
  deviceRequirement?: string; // e.g. "iOS版", "Android版", "スマートフォンのみ"
  accountType?: string; // e.g. "初期垢", "進行済み"
  confirmedDate: string; // e.g. 2026/11/01
  status: '取扱中' | '価格確認中' | '在庫準備中' | '現在準備中' | '要相談' | '要確認';
  stockStatus?: '在庫要確認' | '在庫あり' | '売り切れ';
  isPreparation?: boolean;
  verifiedForPublic?: boolean;
  priceHistory: PriceHistoryRecord[];
  notes?: string;
  order?: number;
}

export interface GameRequestItem {
  id: string;
  gameTitle: string;
  requestType: string; // アカウント / 石垢 / 育成済み / 指定アイテム
  desiredQuantity: string;
  budget: string;
  contactNotes: string;
  createdAt: string;
  status: '受付済' | '確認中' | '案内済' | '対応不可';
  adminNotes?: string;
}

export interface SerialSequence {
  gameCode: string;
  lastSequence: number; // e.g. 1 -> SL-FP-001
  retiredNumbers: {
    productNumber: string;
    productTitle: string;
    issuedAt: string;
    retiredAt?: string;
    reason: string;
  }[];
}

export interface AdminSettings {
  lineUrl: string;
  shopNotice: string;
  enableDirectLineCopy: boolean;
  contactDeskHours: string;
}
