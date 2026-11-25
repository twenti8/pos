export type LightThemePresetId =
  | 'pastel-pink'
  | 'peach'
  | 'butter-yellow'
  | 'mint'
  | 'clear-sky'
  | 'lavender';

export type DarkThemePresetId =
  | 'dark-pink'
  | 'dark-peach'
  | 'dark-butter'
  | 'dark-mint'
  | 'dark-blue'
  | 'dark-purple';

export type ThemePresetId = LightThemePresetId | DarkThemePresetId | 'custom';

export type UserRole = 'admin' | 'staff';

export type PaymentMethod = 'cash' | 'promptpay';

export type ActiveTab = 'pos' | 'sales' | 'products' | 'users' | 'settings';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
}

export interface ShopSettings {
  shopName: string;
  shopSubtitle: string;
  tabTitle: string;
  promptPayId: string;
  logoBase64: string;
  bannerBase64: string;
  themeId: ThemePresetId;
  customThemeColor: string;
  categories: string[];
  receiptFooterNote: string;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  displayName: string;
  role: UserRole;
  active?: boolean;
}

export interface SessionUser {
  username: string;
  name: string;
  displayName: string;
  role: UserRole;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItemSnapshot {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderRecord {
  receiptId: string;
  createdAt: string; // ISO string
  items: OrderItemSnapshot[];
  itemsSummary: string;
  netTotal: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeAmount?: number;
  cashierName: string;
  receiptImage?: string;
  syncedToCloud?: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
