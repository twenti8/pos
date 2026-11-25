import {
  CartItem,
  OrderItemSnapshot,
  OrderRecord,
  PaymentMethod,
  Product,
  ShopSettings,
  ThemePresetId,
  UserAccount,
  UserRole,
} from '../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  normalizeHexColor,
  normalizeThemeId,
} from '../constants/themes';

export function formatBaht(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `฿${safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatBahtCompact(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const hasDecimals = Math.abs(safe - Math.round(safe)) > 0.001;
  return `฿${safe.toLocaleString('en-US', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function generateReceiptId(date: Date = new Date(), randomSuffix?: number): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const num =
    typeof randomSuffix === 'number'
      ? Math.abs(Math.floor(randomSuffix)) % 10000
      : Math.floor(1000 + Math.random() * 9000);
  return `RC${yy}${mm}${dd}-${String(num).padStart(4, '0')}`;
}

const THAI_MONTHS_SHORT = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export function formatThaiDateTime(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  const day = date.getDate();
  const month = THAI_MONTHS_SHORT[date.getMonth()];
  const beYear = date.getFullYear() + 543;
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${beYear} ${hh}:${min} น.`;
}

export function calculateCartTotals(items: CartItem[]): {
  itemCount: number;
  netTotal: number;
} {
  let itemCount = 0;
  let netTotal = 0;
  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.quantity));
    itemCount += qty;
    netTotal += Number(item.product.price) * qty;
  }
  return {
    itemCount,
    netTotal: Math.round(netTotal * 100) / 100,
  };
}

export function calculateChange(netTotal: number, cashReceived: number): number {
  if (!Number.isFinite(cashReceived) || cashReceived < netTotal) {
    return 0;
  }
  return Math.round((cashReceived - netTotal) * 100) / 100;
}

export function getQuickCashAmounts(netTotal: number): number[] {
  if (!Number.isFinite(netTotal) || netTotal <= 0) {
    return [100, 500, 1000];
  }
  const exact = Math.ceil(netTotal);
  const candidates = new Set<number>([exact]);
  const bills = [20, 50, 100, 500, 1000];

  // Add next rounded 50 / 100 above exact
  const next50 = Math.ceil(exact / 50) * 50;
  const next100 = Math.ceil(exact / 100) * 100;
  if (next50 > exact) candidates.add(next50);
  if (next100 > exact) candidates.add(next100);

  for (const bill of bills) {
    if (bill >= exact) {
      candidates.add(bill);
    }
  }

  return Array.from(candidates)
    .sort((a, b) => a - b)
    .slice(0, 5);
}

export function buildItemsSummary(items: OrderItemSnapshot[]): string {
  return items.map((item) => `${item.name} x${item.quantity}`).join(', ');
}

export function resolveDocumentTitle(settings: Pick<ShopSettings, 'shopName' | 'tabTitle'>): string {
  const custom = settings.tabTitle?.trim();
  if (custom) {
    return custom;
  }
  const shop = settings.shopName?.trim() || DEFAULT_SETTINGS.shopName;
  return `${shop} POS · ระบบขายหน้าร้าน`;
}

export function extractCategories(products: Product[], savedCategories?: string[]): string[] {
  const set = new Set<string>();
  const base = Array.isArray(savedCategories) && savedCategories.length > 0 ? savedCategories : DEFAULT_CATEGORIES;
  for (const c of base) {
    const trimmed = String(c || '').trim();
    if (trimmed && trimmed !== 'ทั้งหมด') set.add(trimmed);
  }
  for (const p of products) {
    const trimmed = String(p.category || '').trim();
    if (trimmed && trimmed !== 'ทั้งหมด') set.add(trimmed);
  }
  return Array.from(set);
}

export function normalizeProduct(raw: Record<string, unknown>, index = 0): Product {
  const id = String(raw.id ?? raw.productId ?? `prod-${Date.now()}-${index}`);
  const name = String(raw.name ?? raw.title ?? 'สินค้าไม่มีชื่อ').trim();
  const price = Number(raw.price ?? 0);
  const category = String(raw.category ?? 'ทั่วไป').trim() || 'ทั่วไป';
  const image = typeof raw.image === 'string' ? raw.image : typeof raw.imageUrl === 'string' ? raw.imageUrl : '';
  const available = raw.available === undefined ? true : Boolean(raw.available === true || raw.available === 'true' || raw.available === 'TRUE' || raw.available === 1);
  return {
    id,
    name,
    price: Number.isFinite(price) && price >= 0 ? price : 0,
    category,
    image,
    available,
  };
}

export function normalizeSettings(raw: Record<string, unknown> | null | undefined, fallback: ShopSettings = DEFAULT_SETTINGS): ShopSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...fallback };
  }
  const rawTheme = String(raw.themeId ?? raw.theme ?? fallback.themeId);
  const themeId: ThemePresetId = normalizeThemeId(rawTheme);
  const customThemeColor = normalizeHexColor(
    String(raw.customThemeColor ?? raw.customColor ?? fallback.customThemeColor),
    fallback.customThemeColor
  );

  let categories = fallback.categories;
  if (Array.isArray(raw.categories)) {
    categories = raw.categories.map((c) => String(c).trim()).filter(Boolean);
  } else if (typeof raw.categories === 'string' && raw.categories.trim()) {
    try {
      const parsed = JSON.parse(raw.categories);
      if (Array.isArray(parsed)) {
        categories = parsed.map((c) => String(c).trim()).filter(Boolean);
      } else {
        categories = raw.categories.split(',').map((c) => c.trim()).filter(Boolean);
      }
    } catch {
      categories = raw.categories.split(',').map((c) => c.trim()).filter(Boolean);
    }
  }

  return {
    shopName: String(raw.shopName ?? raw.name ?? fallback.shopName).trim() || fallback.shopName,
    shopSubtitle: String(raw.shopSubtitle ?? raw.subtitle ?? fallback.shopSubtitle).trim(),
    tabTitle: String(raw.tabTitle ?? raw.browserTabTitle ?? fallback.tabTitle ?? '').trim(),
    promptPayId: String(raw.promptPayId ?? raw.promptpayId ?? raw.promptpay ?? fallback.promptPayId).trim(),
    logoBase64: typeof raw.logoBase64 === 'string'
      ? raw.logoBase64
      : typeof raw.profileImage === 'string'
        ? raw.profileImage
        : typeof raw.logo === 'string'
          ? raw.logo
          : fallback.logoBase64,
    bannerBase64: typeof raw.bannerBase64 === 'string'
      ? raw.bannerBase64
      : typeof raw.bannerImage === 'string'
        ? raw.bannerImage
        : typeof raw.banner === 'string'
          ? raw.banner
          : fallback.bannerBase64,
    themeId,
    customThemeColor,
    categories: categories.length > 0 ? categories : fallback.categories,
    receiptFooterNote: String(raw.receiptFooterNote ?? raw.footerNote ?? fallback.receiptFooterNote).trim(),
  };
}

export function normalizeUser(raw: Record<string, unknown>, index = 0): UserAccount {
  const roleRaw = String(raw.role ?? 'staff').toLowerCase();
  const role: UserRole = roleRaw === 'admin' ? 'admin' : 'staff';
  const username = String(raw.username ?? raw.user ?? `user${index + 1}`).trim();
  const displayName = String(raw.displayName ?? raw.name ?? username).trim();
  return {
    id: String(raw.id ?? username),
    username,
    password: raw.password !== undefined ? String(raw.password) : undefined,
    displayName,
    role,
    active: raw.active === undefined ? true : Boolean(raw.active),
  };
}

export function normalizeOrder(raw: Record<string, unknown>, index = 0): OrderRecord {
  const receiptId = String(raw.receiptId ?? raw.id ?? `RC-SYNC-${index + 1}`);
  const itemsSummary = String(raw.itemsSummary ?? raw.items ?? '');
  const netTotal = Number(raw.netTotal ?? raw.total ?? 0);
  const pmRaw = String(raw.paymentMethod ?? 'cash').toLowerCase();
  const paymentMethod: PaymentMethod =
    pmRaw.includes('prompt') || pmRaw.includes('qr') || pmRaw.includes('โอน') ? 'promptpay' : 'cash';
  const cashierName = String(raw.cashierName ?? raw.cashier ?? 'พนักงาน');
  const createdAt = raw.createdAt
    ? String(raw.createdAt)
    : raw.timestamp
      ? String(raw.timestamp)
      : new Date().toISOString();

  let items: OrderItemSnapshot[] = [];
  if (Array.isArray(raw.items)) {
    items = raw.items.map((it: Record<string, unknown>, idx: number) => {
      const price = Number(it.price ?? 0);
      const quantity = Number(it.quantity ?? 1);
      return {
        id: String(it.id ?? `item-${idx}`),
        name: String(it.name ?? 'รายการสินค้า'),
        price,
        quantity,
        subtotal: Number(it.subtotal ?? price * quantity),
      };
    });
  } else if (itemsSummary) {
    items = itemsSummary.split(',').map((segment, idx) => {
      const trimmed = segment.trim();
      const match = trimmed.match(/^(.+?)\s*x(\d+)$/i);
      if (match) {
        return {
          id: `parsed-${idx}`,
          name: match[1].trim(),
          price: 0,
          quantity: Number(match[2]),
          subtotal: 0,
        };
      }
      return {
        id: `parsed-${idx}`,
        name: trimmed,
        price: 0,
        quantity: 1,
        subtotal: 0,
      };
    });
  }

  return {
    receiptId,
    createdAt,
    items,
    itemsSummary,
    netTotal: Number.isFinite(netTotal) ? netTotal : 0,
    paymentMethod,
    cashReceived: raw.cashReceived !== undefined ? Number(raw.cashReceived) : undefined,
    changeAmount: raw.changeAmount !== undefined ? Number(raw.changeAmount) : undefined,
    cashierName,
    receiptImage: typeof raw.receiptImage === 'string' ? raw.receiptImage : undefined,
    syncedToCloud: raw.syncedToCloud !== undefined ? Boolean(raw.syncedToCloud) : true,
  };
}

export function canDeleteUserAccount(
  target: Pick<UserAccount, 'id' | 'username' | 'role'>,
  users: ReadonlyArray<Pick<UserAccount, 'id' | 'username' | 'role'>>
): { allowed: boolean; reason?: string } {
  if (target.role === 'admin') {
    const targetUsername = target.username.trim().toLowerCase();
    const otherAdmins = users.filter(
      (u) => u.role === 'admin' && u.username.trim().toLowerCase() !== targetUsername
    );
    if (otherAdmins.length < 1) {
      return {
        allowed: false,
        reason: 'ต้องมีบัญชีแอดมิน (Admin) เหลืออย่างน้อย 1 บัญชี เพื่อป้องกันการล็อกเอาต์ออกจากระบบ',
      };
    }
  }
  return { allowed: true };
}

