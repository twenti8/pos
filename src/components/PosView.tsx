import { useMemo, useState } from 'react';
import {
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Banknote,
  QrCode,
  Coffee,
  ChevronUp,
} from 'lucide-react';
import { CartItem, PaymentMethod, Product } from '../types';
import {
  calculateCartTotals,
  calculateChange,
  formatBaht,
  formatBahtCompact,
  getQuickCashAmounts,
} from '../utils/posLogic';

interface PosViewProps {
  products: Product[];
  categories: string[];
  cart: CartItem[];
  isAdmin: boolean;
  onAddToCart: (product: Product) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onConfirmCheckout: (options: {
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    changeAmount?: number;
  }) => void;
}

export function PosView({
  products,
  categories,
  cart,
  isAdmin,
  onAddToCart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onConfirmCheckout,
}: PosViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashInput, setCashInput] = useState<string>('');
  const [mobileCartOpen, setMobileCartOpen] = useState<boolean>(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const { itemCount, netTotal } = useMemo(() => calculateCartTotals(cart), [cart]);
  const quickCashAmounts = useMemo(() => getQuickCashAmounts(netTotal), [netTotal]);

  const cashReceivedNum = cashInput.trim() === '' ? 0 : Number(cashInput);
  const isCashValid =
    paymentMethod === 'promptpay' ||
    (Number.isFinite(cashReceivedNum) && cashReceivedNum >= netTotal && netTotal > 0);
  const changeAmount =
    paymentMethod === 'cash' ? calculateChange(netTotal, cashReceivedNum) : 0;

  const cartQtyById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart) {
      map[item.product.id] = item.quantity;
    }
    return map;
  }, [cart]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (!p.available) return false;
      if (selectedCategory !== 'ทั้งหมด' && p.category !== selectedCategory) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleCheckout = () => {
    if (cart.length === 0 || !isCashValid) return;
    onConfirmCheckout({
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? cashReceivedNum : netTotal,
      changeAmount: paymentMethod === 'cash' ? changeAmount : 0,
    });
    setCashInput('');
    setMobileCartOpen(false);
  };

  const renderCartPanel = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--theme-border)]">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[var(--theme-primary)]" aria-hidden="true" />
          <h2 className="text-base font-bold text-[var(--theme-ink)]">ตะกร้าสินค้า</h2>
          <span className="text-xs font-medium text-[var(--theme-muted)] tabular-nums">
            · {itemCount} ชิ้น
          </span>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onClearCart();
              setCashInput('');
            }}
            className="text-xs font-semibold text-[var(--theme-muted)] hover:text-[#C92A2A] transition-colors cursor-pointer px-2 py-1 rounded-lg"
          >
            ล้างตะกร้า
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-[var(--theme-border)]/70">
        {cart.length === 0 ? (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-[var(--theme-soft)] flex items-center justify-center mb-3 text-[var(--theme-primary)]">
              <ShoppingBag className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-[var(--theme-ink)]">ยังไม่มีรายการในตะกร้า</p>
            <p className="text-xs text-[var(--theme-muted)] mt-1">
              แตะเลือกเมนูทางด้านซ้ายเพื่อเพิ่มลงออเดอร์
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.product.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--theme-ink)] truncate">
                  {item.product.name}
                </p>
                <p className="text-xs text-[var(--theme-muted)] tabular-nums mt-0.5">
                  {formatBahtCompact(item.product.price)} × {item.quantity} ·{' '}
                  <span className="font-semibold text-[var(--theme-ink)]">
                    {formatBaht(item.product.price * item.quantity)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.product.id, -1)}
                  aria-label={`ลดจำนวน ${item.product.name}`}
                  className="w-9 h-9 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] hover:bg-[var(--theme-soft)] flex items-center justify-center text-[var(--theme-ink)] transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center text-sm font-bold tabular-nums text-[var(--theme-ink)]">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.product.id, 1)}
                  aria-label={`เพิ่มจำนวน ${item.product.name}`}
                  className="w-9 h-9 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] hover:bg-[var(--theme-soft)] flex items-center justify-center text-[var(--theme-ink)] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.product.id)}
                  aria-label={`ลบ ${item.product.name} ออกจากตะกร้า`}
                  className="w-9 h-9 rounded-xl text-[var(--theme-muted)] hover:text-[#C92A2A] hover:bg-[#FFF5F5] flex items-center justify-center transition-colors cursor-pointer ml-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment & Checkout Footer */}
      <div className="border-t border-[var(--theme-border)] p-5 bg-[var(--theme-surface)] space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-[var(--theme-muted)]">ยอดสุทธิ</span>
          <span
            data-testid="cart-net-total"
            className="text-2xl font-bold tabular-nums text-[var(--theme-ink)]"
          >
            {formatBaht(netTotal)}
          </span>
        </div>

        {/* Payment Method Segmented Buttons */}
        <div
          role="group"
          aria-label="ช่องทางชำระเงิน"
          className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[var(--theme-bg)] border border-[var(--theme-border)]"
        >
          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            aria-pressed={paymentMethod === 'cash'}
            className={`h-10 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              paymentMethod === 'cash'
                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                : 'text-[var(--theme-muted)] hover:text-[var(--theme-ink)]'
            }`}
          >
            <Banknote className="w-4 h-4" aria-hidden="true" />
            <span>เงินสด</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('promptpay')}
            aria-pressed={paymentMethod === 'promptpay'}
            className={`h-10 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              paymentMethod === 'promptpay'
                ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)] shadow-xs'
                : 'text-[var(--theme-muted)] hover:text-[var(--theme-ink)]'
            }`}
          >
            <QrCode className="w-4 h-4" aria-hidden="true" />
            <span>PromptPay</span>
          </button>
        </div>

        {/* Cash calculator */}
        {paymentMethod === 'cash' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="cash-received-input"
                className="text-xs font-semibold text-[var(--theme-muted)] whitespace-nowrap"
              >
                รับเงินมา (บาท)
              </label>
              <input
                id="cash-received-input"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                placeholder={netTotal > 0 ? String(netTotal) : '0'}
                className="w-36 h-10 px-3 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-right text-sm font-bold tabular-nums text-[var(--theme-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
              />
            </div>

            {netTotal > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {quickCashAmounts.map((amt, idx) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashInput(String(amt))}
                    className="h-9 px-3 rounded-xl bg-[var(--theme-soft)] hover:bg-[var(--theme-soft-hover)] text-xs font-semibold tabular-nums text-[var(--theme-accent-ink)] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {idx === 0 && Math.abs(amt - netTotal) < 0.01
                      ? `พอดี ${formatBahtCompact(amt)}`
                      : formatBahtCompact(amt)}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-1 text-sm">
              <span className="text-[var(--theme-muted)] font-medium">เงินทอน</span>
              {netTotal > 0 && cashInput.trim() !== '' && cashReceivedNum < netTotal ? (
                <span className="text-xs font-semibold tabular-nums text-[#C92A2A]">
                  ขาดอีก {formatBaht(netTotal - cashReceivedNum)}
                </span>
              ) : (
                <span
                  data-testid="cart-change-amount"
                  className="text-base font-bold tabular-nums text-[var(--theme-success)]"
                >
                  {formatBaht(changeAmount)}
                </span>
              )}
            </div>
          </div>
        )}

        {paymentMethod === 'promptpay' && (
          <p className="text-xs text-[var(--theme-muted)] leading-relaxed">
            เมื่อกดยืนยัน ระบบจะสร้างใบเสร็จพร้อมคิวอาร์โค้ด PromptPay ล็อกยอด{' '}
            <span className="font-semibold text-[var(--theme-ink)] tabular-nums">
              {formatBaht(netTotal)}
            </span>{' '}
            ให้ลูกค้าสแกนได้ทันที
          </p>
        )}

        <button
          type="button"
          disabled={cart.length === 0 || !isCashValid}
          onClick={handleCheckout}
          className="w-full h-12 rounded-2xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] font-bold text-sm tabular-nums transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
        >
          ยืนยันชำระเงิน · {formatBaht(netTotal)}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`max-w-[1440px] mx-auto px-4 lg:px-6 py-4 lg:py-6 ${isAdmin ? 'pb-36 md:pb-6' : 'pb-24 lg:pb-6'}`}>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left: Product Catalog */}
        <section aria-label="รายการสินค้า" className="flex-1 min-w-0 w-full space-y-4">
          {/* Search & Category Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search
                className="w-4 h-4 text-[var(--theme-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="ค้นหาเมนู"
                placeholder="ค้นหาชื่อเมนูหรือหมวดหมู่..."
                className="w-full h-11 pl-10 pr-9 rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] text-sm text-[var(--theme-ink)] placeholder:text-[var(--theme-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40 focus:border-[var(--theme-primary)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="ล้างคำค้นหา"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-[var(--theme-muted)] hover:text-[var(--theme-ink)]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div
              role="tablist"
              aria-label="หมวดหมู่สินค้า"
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
            >
              {['ทั้งหมด', ...categories].map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedCategory(category)}
                    className={`h-10 px-4 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)]'
                        : 'bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-ink)] hover:bg-[var(--theme-soft)]'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] py-16 px-6 text-center">
              <Coffee
                className="w-10 h-10 mx-auto text-[var(--theme-muted)] mb-3"
                aria-hidden="true"
              />
              <p className="text-base font-semibold text-[var(--theme-ink)]">ไม่พบเมนูที่ค้นหา</p>
              <p className="text-sm text-[var(--theme-muted)] mt-1">
                ลองเลือกหมวดหมู่อื่น หรือล้างคำค้นหาเพื่อดูเมนูทั้งหมด
              </p>
              {(selectedCategory !== 'ทั้งหมด' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('ทั้งหมด');
                    setSearchQuery('');
                  }}
                  className="mt-4 h-10 px-4 rounded-xl bg-[var(--theme-soft)] text-[var(--theme-accent-ink)] text-sm font-semibold hover:bg-[var(--theme-soft-hover)] transition-colors cursor-pointer"
                >
                  แสดงเมนูทั้งหมด
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
              {filteredProducts.map((product) => {
                const qtyInCart = cartQtyById[product.id] || 0;
                const imgBroken = !product.image || failedImages[product.id];
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => onAddToCart(product)}
                    aria-label={`เพิ่ม ${product.name} ราคา ${product.price} บาท`}
                    className={`group text-left rounded-2xl bg-[var(--theme-surface)] border transition-all overflow-hidden flex flex-col cursor-pointer active:scale-[0.98] ${
                      qtyInCart > 0
                        ? 'border-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)]/20'
                        : 'border-[var(--theme-border)] hover:-translate-y-0.5 hover:shadow-sm'
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full bg-[var(--theme-soft)] overflow-hidden">
                      {!imgBroken ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [product.id]: true }))
                          }
                          className="w-full h-full object-cover object-center block group-hover:scale-[1.03] transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[var(--theme-accent-ink)]/60 gap-1.5 p-3">
                          <Coffee className="w-8 h-8" aria-hidden="true" />
                          <span className="text-xs font-medium truncate max-w-full">
                            {product.category}
                          </span>
                        </div>
                      )}
                      {qtyInCart > 0 && (
                        <span
                          aria-label={`อยู่ในตะกร้า ${qtyInCart} ชิ้น`}
                          className="absolute top-2 right-2 min-w-7 h-7 px-2 rounded-xl bg-[var(--theme-primary)] text-[var(--theme-primary-text)] text-xs font-bold tabular-nums flex items-center justify-center shadow-xs"
                        >
                          {qtyInCart}
                        </span>
                      )}
                    </div>

                    <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between gap-1.5">
                      <div>
                        <p className="text-[11px] font-medium text-[var(--theme-muted)] truncate">
                          {product.category}
                        </p>
                        <h3 className="text-sm sm:text-[15px] font-semibold text-[var(--theme-ink)] leading-snug line-clamp-2 mt-0.5">
                          {product.name}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-base font-bold tabular-nums text-[var(--theme-accent-ink)]">
                          {formatBahtCompact(product.price)}
                        </span>
                        <span
                          aria-hidden="true"
                          className="w-7 h-7 rounded-xl bg-[var(--theme-soft)] text-[var(--theme-accent-ink)] group-hover:bg-[var(--theme-primary)] group-hover:text-[var(--theme-primary-text)] flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Desktop Cart Sidebar */}
        <aside
          aria-label="สรุปรายการสั่งซื้อ"
          className="hidden lg:block w-[370px] xl:w-[390px] shrink-0 sticky top-20 h-[calc(100vh-6.5rem)] rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] overflow-hidden"
        >
          {renderCartPanel()}
        </aside>
      </div>

      {/* Mobile & iPad Portrait Slim Floating Cart Trigger */}
      {itemCount > 0 && !mobileCartOpen && (
        <div
          className={`lg:hidden fixed inset-x-4 z-20 ${
            isAdmin ? 'bottom-16 md:bottom-4' : 'bottom-4'
          }`}
        >
          <button
            type="button"
            onClick={() => setMobileCartOpen(true)}
            className="w-full h-12 px-4 rounded-2xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] shadow-lg flex items-center justify-between text-sm font-bold cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span className="tabular-nums">ดูตะกร้า ({itemCount} ชิ้น)</span>
            </span>
            <span className="flex items-center gap-1.5 tabular-nums">
              <span>{formatBaht(netTotal)}</span>
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            </span>
          </button>
        </div>
      )}

      {/* Mobile Slide-Up Cart Drawer */}
      {mobileCartOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ตะกร้าสินค้าและการชำระเงิน"
          className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end bg-black/45 backdrop-blur-xs"
        >
          <button
            type="button"
            aria-label="ปิดตะกร้าสินค้า"
            onClick={() => setMobileCartOpen(false)}
            className="flex-1 w-full cursor-default"
          />
          <div className="bg-[var(--theme-surface)] rounded-t-3xl max-h-[86vh] flex flex-col overflow-hidden pb-safe">
            <div className="flex items-center justify-center pt-2.5 pb-1">
              <span className="w-10 h-1.5 rounded-full bg-[var(--theme-border)]" />
            </div>
            <div className="flex justify-end px-4">
              <button
                type="button"
                onClick={() => setMobileCartOpen(false)}
                aria-label="ปิดหน้าต่างตะกร้า"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--theme-muted)] hover:bg-[var(--theme-soft)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">{renderCartPanel()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
