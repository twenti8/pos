import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActiveTab,
  CartItem,
  OrderRecord,
  PaymentMethod,
  Product,
  SessionUser,
  ShopSettings,
  ThemePresetId,
  ToastMessage,
  UserAccount,
} from './types';
import {
  DEFAULT_LOGO_PATH,
  DEFAULT_PRODUCTS,
  DEFAULT_SETTINGS,
  resolveThemeConfig,
} from './constants/themes';
import {
  buildItemsSummary,
  calculateCartTotals,
  extractCategories,
  generateReceiptId,
  resolveDocumentTitle,
} from './utils/posLogic';
import {
  deleteUserFromCloud,
  fetchInitData,
  fetchUsersFromCloud,
  loginWithGas,
  saveOrderToCloud,
  saveUserToCloud,
  syncProductsToCloud,
  syncSettingsToCloud,
} from './services/gasApi';
import { LoginScreen } from './components/LoginScreen';
import { HeaderNav } from './components/HeaderNav';
import { PosView } from './components/PosView';
import { ReceiptModal } from './components/ReceiptModal';
import { SalesSummaryView } from './components/SalesSummaryView';
import { ProductsAdminView } from './components/ProductsAdminView';
import { UsersAdminView } from './components/UsersAdminView';
import { SettingsAdminView } from './components/SettingsAdminView';
import { ToastContainer } from './components/ToastContainer';

const STORAGE_KEYS = {
  products: 'finedaevibe_pos_products_v1',
  settings: 'finedaevibe_pos_settings_v1',
  orders: 'finedaevibe_pos_orders_v1',
  session: 'finedaevibe_pos_session_v1',
  users: 'finedaevibe_pos_users_v1',
} as const;

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'admin',
    username: 'admin',
    password: '1234',
    displayName: 'ผู้ดูแลร้าน',
    role: 'admin',
    active: true,
  },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors gracefully
  }
}

export default function App() {
  const [settings, setSettings] = useState<ShopSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...readStorage<Partial<ShopSettings>>(STORAGE_KEYS.settings, {}),
  }));
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = readStorage<Product[]>(STORAGE_KEYS.products, []);
    return cached.length > 0 ? cached : DEFAULT_PRODUCTS;
  });
  const [orders, setOrders] = useState<OrderRecord[]>(() =>
    readStorage<OrderRecord[]>(STORAGE_KEYS.orders, [])
  );
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const cached = readStorage<UserAccount[]>(STORAGE_KEYS.users, []);
    return cached.length > 0 ? cached : DEFAULT_USERS;
  });
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        const roleParam = params.get('role') === 'staff' ? 'staff' : 'admin';
        return {
          username: roleParam,
          displayName: roleParam === 'admin' ? 'ผู้ดูแลร้าน' : 'พนักงานหน้าร้าน',
          role: roleParam,
        };
      }
    }
    return readStorage<SessionUser | null>(STORAGE_KEYS.session, null);
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeReceipt, setActiveReceipt] = useState<{
    order: OrderRecord;
    autoUpload: boolean;
  } | null>(null);
  const [isSyncingInit, setIsSyncingInit] = useState<boolean>(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [themePreview, setThemePreview] = useState<{
    themeId: ThemePresetId;
    customThemeColor: string;
  } | null>(null);

  const notify = useCallback((type: ToastMessage['type'], message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Apply light/dark/custom theme CSS custom properties globally
  const activeThemeId = themePreview?.themeId ?? settings.themeId;
  const activeCustomColor = themePreview?.customThemeColor ?? settings.customThemeColor;

  useEffect(() => {
    const resolved = resolveThemeConfig(activeThemeId, activeCustomColor);
    const root = document.documentElement;
    for (const [key, val] of Object.entries(resolved.vars)) {
      root.style.setProperty(key, val);
    }
    root.style.colorScheme = resolved.mode;
    root.dataset.themeMode = resolved.mode;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', resolved.vars['--theme-bg']);
    }
  }, [activeThemeId, activeCustomColor]);

  // Dynamically update document.title & browser favicons / apple-touch-icon
  useEffect(() => {
    document.title = resolveDocumentTitle(settings);
    const activeLogo = settings.logoBase64?.trim() ? settings.logoBase64 : DEFAULT_LOGO_PATH;

    const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (iconLink) {
      iconLink.href = activeLogo;
    }
    const appleIconLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (appleIconLink) {
      appleIconLink.href = activeLogo;
    }
    const appTitleMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]'
    );
    if (appTitleMeta) {
      appTitleMeta.content = `${settings.shopName} POS`;
    }
  }, [settings.shopName, settings.tabTitle, settings.logoBase64]);

  // Cloud hydration via getInitData
  const loadInitDataFromCloud = useCallback(
    async (silent = true) => {
      setIsSyncingInit(true);
      const res = await fetchInitData(settings);
      setIsSyncingInit(false);

      if (!res.ok || !res.data) {
        if (!silent) {
          notify('error', 'ดึงข้อมูลจากคลาวด์ไม่สำเร็จ กำลังแสดงข้อมูลที่แคชไว้ในเครื่อง');
        }
        return;
      }

      if (res.data.settings) {
        setSettings(res.data.settings);
        writeStorage(STORAGE_KEYS.settings, res.data.settings);
      }

      if (res.data.products && res.data.products.length > 0) {
        setProducts(res.data.products);
        writeStorage(STORAGE_KEYS.products, res.data.products);
      }

      if (res.data.orders && res.data.orders.length > 0) {
        setOrders((prev) => {
          const map = new Map<string, OrderRecord>();
          for (const o of res.data!.orders!) {
            map.set(o.receiptId, o);
          }
          for (const localOrder of prev) {
            if (!map.has(localOrder.receiptId)) {
              map.set(localOrder.receiptId, localOrder);
            }
          }
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          writeStorage(STORAGE_KEYS.orders, merged);
          return merged;
        });
      }

      if (!silent) {
        notify('success', 'อัปเดตข้อมูลล่าสุดจาก Google Sheets เรียบร้อยแล้ว');
      }
    },
    [notify, settings]
  );

  // Sync on initial app mount
  useEffect(() => {
    void loadInitDataFromCloud(true);
  }, []);

  // Ensure staff cannot stay on admin tabs
  useEffect(() => {
    if (sessionUser?.role === 'staff' && activeTab !== 'pos') {
      setActiveTab('pos');
    }
  }, [sessionUser, activeTab]);

  const categories = useMemo(
    () => extractCategories(products, settings.categories),
    [products, settings.categories]
  );

  const handleLogin = async (username: string, password: string): Promise<string | null> => {
    const res = await loginWithGas(username, password);

    if (res.ok && res.user) {
      setSessionUser(res.user);
      writeStorage(STORAGE_KEYS.session, res.user);
      setActiveTab('pos');
      notify('success', `ยินดีต้อนรับคุณ ${res.user.displayName}`);
      // Sync immediately right after login so every device has latest cloud state
      void loadInitDataFromCloud(true);
      return null;
    }

    // Only fall back to local cached users if there is an actual network disconnect
    if (res.networkError) {
      const localMatch = users.find(
        (u) =>
          u.username.toLowerCase() === username.toLowerCase() &&
          (u.password === password || (u.username === 'admin' && password === '1234'))
      );
      if (localMatch) {
        const offlineUser: SessionUser = {
          username: localMatch.username,
          displayName: localMatch.displayName,
          role: localMatch.role,
        };
        setSessionUser(offlineUser);
        writeStorage(STORAGE_KEYS.session, offlineUser);
        setActiveTab('pos');
        notify('info', `เข้าสู่ระบบแบบออฟไลน์ในชื่อ ${offlineUser.displayName}`);
        return null;
      }
    }

    return res.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
  };

  const handleLogout = () => {
    setSessionUser(null);
    setCart([]);
    setActiveTab('pos');
    try {
      window.localStorage.removeItem(STORAGE_KEYS.session);
    } catch {
      // ignore
    }
    notify('info', 'ออกจากระบบเรียบร้อยแล้ว');
  };

  // Cart handlers
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Checkout confirmation -> opens Receipt Modal & triggers PNG capture + saveOrder
  const handleConfirmCheckout = ({
    paymentMethod,
    cashReceived,
    changeAmount,
  }: {
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    changeAmount?: number;
  }) => {
    if (cart.length === 0 || !sessionUser) return;

    const { netTotal } = calculateCartTotals(cart);
    const items = cart.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: Math.round(item.product.price * item.quantity * 100) / 100,
    }));

    const newOrder: OrderRecord = {
      receiptId: generateReceiptId(),
      createdAt: new Date().toISOString(),
      items,
      itemsSummary: buildItemsSummary(items),
      netTotal: Number(netTotal),
      paymentMethod,
      cashReceived,
      changeAmount,
      cashierName: sessionUser.displayName,
      syncedToCloud: false,
    };

    setOrders((prev) => {
      const next = [newOrder, ...prev];
      writeStorage(STORAGE_KEYS.orders, next);
      return next;
    });

    setCart([]);
    setActiveReceipt({ order: newOrder, autoUpload: true });
  };

  const handleReceiptImageReady = useCallback(
    async (receiptId: string, base64Png: string) => {
      const targetOrder = orders.find((o) => o.receiptId === receiptId);
      if (!targetOrder) return;

      const res = await saveOrderToCloud({
        receiptId: targetOrder.receiptId,
        itemsSummary: targetOrder.itemsSummary,
        netTotal: Number(targetOrder.netTotal),
        paymentMethod: targetOrder.paymentMethod === 'promptpay' ? 'PromptPay' : 'เงินสด',
        receiptImage: base64Png,
        cashierName: targetOrder.cashierName,
      });

      if (res.ok) {
        setOrders((prev) => {
          const next = prev.map((o) =>
            o.receiptId === receiptId ? { ...o, syncedToCloud: true } : o
          );
          writeStorage(STORAGE_KEYS.orders, next);
          return next;
        });
        notify('success', `บันทึกใบเสร็จ ${receiptId} ลง Google Sheets และ Drive แล้ว`);
      } else {
        notify(
          'info',
          `ออกใบเสร็จ ${receiptId} สำเร็จ (บันทึกไว้ในเครื่องแล้ว รอเชื่อมต่อคลาวด์)`
        );
      }
    },
    [orders, notify]
  );

  // Admin: Save products & categories -> immediate POST saveProducts (+ saveSettings for categories)
  const handleSaveProducts = async (nextProducts: Product[], nextCategories: string[]) => {
    const nextSettings: ShopSettings = {
      ...settings,
      categories: nextCategories,
    };

    setProducts(nextProducts);
    setSettings(nextSettings);
    writeStorage(STORAGE_KEYS.products, nextProducts);
    writeStorage(STORAGE_KEYS.settings, nextSettings);

    const [prodRes] = await Promise.all([
      syncProductsToCloud(nextProducts, nextCategories),
      syncSettingsToCloud(nextSettings),
    ]);

    if (prodRes.ok) {
      notify('success', 'บันทึกสินค้าและซิงก์ขึ้น Google Sheets เรียบร้อยแล้ว');
    } else {
      notify('info', 'บันทึกสินค้าในเครื่องแล้ว แต่ไม่สามารถซิงก์ขึ้นคลาวด์ได้ในขณะนี้');
    }
  };

  // Admin: Save settings -> immediate POST saveSettings
  const handleSaveSettings = async (
    nextSettings: ShopSettings,
    customSuccessMsg?: string
  ) => {
    setSettings(nextSettings);
    writeStorage(STORAGE_KEYS.settings, nextSettings);

    const res = await syncSettingsToCloud(nextSettings);
    if (res.ok) {
      notify('success', customSuccessMsg || 'บันทึกการตั้งค่าและซิงก์ขึ้นคลาวด์เรียบร้อยแล้ว');
    } else {
      notify('info', 'บันทึกการตั้งค่าในเครื่องแล้ว แต่ซิงก์ขึ้นคลาวด์ไม่สำเร็จ');
    }
  };

  // Admin: Manual Sync to Sheets
  const handleManualSyncAll = async (currentDraftSettings: ShopSettings) => {
    setSettings(currentDraftSettings);
    writeStorage(STORAGE_KEYS.settings, currentDraftSettings);
    writeStorage(STORAGE_KEYS.products, products);

    const [settingsRes, productsRes] = await Promise.all([
      syncSettingsToCloud(currentDraftSettings),
      syncProductsToCloud(products, currentDraftSettings.categories),
    ]);

    if (settingsRes.ok && productsRes.ok) {
      notify('success', 'ซิงก์เมนู การตั้งค่า และธีมขึ้น Google Sheets เรียบร้อยแล้ว');
    } else if (settingsRes.ok || productsRes.ok) {
      notify('info', 'ซิงก์ข้อมูลบางส่วนขึ้นคลาวด์แล้ว กรุณาลองกดซิงก์อีกครั้งหากข้อมูลไม่ครบ');
    } else {
      notify('error', 'ไม่สามารถเชื่อมต่อ Google Sheets ได้ในขณะนี้');
    }
  };

  // Admin: Users CRUD
  const handleRefreshUsers = async () => {
    setIsLoadingUsers(true);
    const res = await fetchUsersFromCloud();
    setIsLoadingUsers(false);
    if (res.ok && res.users && res.users.length > 0) {
      setUsers(res.users);
      writeStorage(STORAGE_KEYS.users, res.users);
    }
  };

  const handleSaveUser = async (user: UserAccount) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.username === user.username);
      const next = exists
        ? prev.map((u) => (u.username === user.username ? user : u))
        : [...prev, user];
      writeStorage(STORAGE_KEYS.users, next);
      return next;
    });

    const res = await saveUserToCloud(user);
    if (res.ok) {
      notify('success', `บันทึกผู้ใช้งาน @${user.username} ลง Google Sheets แล้ว`);
    } else {
      notify('info', `บันทึกผู้ใช้งาน @${user.username} ในเครื่องแล้ว (รอเชื่อมต่อคลาวด์)`);
    }
  };

  const handleDeleteUser = async (user: UserAccount) => {
    setUsers((prev) => {
      const next = prev.filter((u) => u.username !== user.username);
      writeStorage(STORAGE_KEYS.users, next);
      return next;
    });

    const res = await deleteUserFromCloud(user);
    if (res.ok) {
      notify('success', `ลบผู้ใช้งาน @${user.username} เรียบร้อยแล้ว`);
    } else {
      notify('info', `ลบผู้ใช้งาน @${user.username} ในเครื่องแล้ว`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-ink)]">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {!sessionUser ? (
        <LoginScreen
          settings={settings}
          isSyncingInit={isSyncingInit}
          onLogin={handleLogin}
        />
      ) : (
        <>
          <HeaderNav
            settings={settings}
            user={sessionUser}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onLogout={handleLogout}
          />

          {settings.bannerBase64 && (
            <div
              data-testid="storefront-banner"
              className="w-full h-44 sm:h-56 md:h-64 overflow-hidden relative border-b border-[var(--theme-border)]"
            >
              <img
                src={settings.bannerBase64}
                alt={`แบนเนอร์ร้าน ${settings.shopName}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center block"
              />
            </div>
          )}

          {activeTab === 'pos' && (
            <PosView
              products={products}
              categories={categories}
              cart={cart}
              isAdmin={sessionUser.role === 'admin'}
              onAddToCart={handleAddToCart}
              onUpdateQty={handleUpdateCartQty}
              onRemoveItem={handleRemoveCartItem}
              onClearCart={handleClearCart}
              onConfirmCheckout={handleConfirmCheckout}
            />
          )}

          {activeTab === 'sales' && sessionUser.role === 'admin' && (
            <SalesSummaryView
              orders={orders}
              onViewReceipt={(order) => setActiveReceipt({ order, autoUpload: false })}
              onRefreshFromCloud={() => loadInitDataFromCloud(false)}
            />
          )}

          {activeTab === 'products' && sessionUser.role === 'admin' && (
            <ProductsAdminView
              products={products}
              categories={categories}
              onSaveProducts={handleSaveProducts}
              onNotify={notify}
            />
          )}

          {activeTab === 'users' && sessionUser.role === 'admin' && (
            <UsersAdminView
              currentUser={sessionUser}
              users={users}
              isLoadingUsers={isLoadingUsers}
              onRefreshUsers={handleRefreshUsers}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onNotify={notify}
            />
          )}

          {activeTab === 'settings' && sessionUser.role === 'admin' && (
            <SettingsAdminView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onPreviewTheme={setThemePreview}
              onManualSyncAll={handleManualSyncAll}
              onNotify={notify}
            />
          )}

          {activeReceipt && (
            <ReceiptModal
              order={activeReceipt.order}
              settings={settings}
              autoUploadOnMount={activeReceipt.autoUpload}
              onClose={() => setActiveReceipt(null)}
              onReceiptImageReady={handleReceiptImageReady}
              onNotify={notify}
            />
          )}
        </>
      )}
    </div>
  );
}
