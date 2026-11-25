import { ChangeEvent, FormEvent, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Coffee,
  X,
  FolderPlus,
  Loader2,
} from 'lucide-react';
import { Product } from '../types';
import { formatBahtCompact } from '../utils/posLogic';
import { compressImageToBase64 } from '../utils/imageCompress';

interface ProductsAdminViewProps {
  products: Product[];
  categories: string[];
  onSaveProducts: (nextProducts: Product[], nextCategories: string[]) => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function ProductsAdminView({
  products,
  categories,
  onSaveProducts,
  onNotify,
}: ProductsAdminViewProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState(categories[0] || 'กาแฟ');
  const [formImage, setFormImage] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormPrice('');
    setFormCategory(categories[0] || 'กาแฟ');
    setFormImage('');
    setFormAvailable(true);
    setImageSizeKb(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormPrice(String(product.price));
    setFormCategory(product.category || categories[0] || 'กาแฟ');
    setFormImage(product.image || '');
    setFormAvailable(product.available);
    setImageSizeKb(
      product.image?.startsWith('data:image/')
        ? Math.round((product.image.length / 1024) * 10) / 10
        : null
    );
    setIsModalOpen(true);
  };

  const handleImageFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    try {
      const compressed = await compressImageToBase64(file);
      setFormImage(compressed);
      setImageSizeKb(Math.round((compressed.length / 1024) * 10) / 10);
      onNotify(
        'success',
        `บีบอัดรูปภาพเรียบร้อย (${(compressed.length / 1024).toFixed(1)} KB พร้อมลง Sheets)`
      );
    } catch {
      onNotify('error', 'ไม่สามารถประมวลผลรูปภาพได้ กรุณาลองไฟล์อื่น');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleSaveProductForm = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = formName.trim();
    const parsedPrice = Number(formPrice);
    if (!trimmedName) {
      onNotify('error', 'กรุณากรอกชื่อสินค้า');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      onNotify('error', 'กรุณากรอกราคาที่ถูกต้อง');
      return;
    }

    const chosenCategory = formCategory.trim() || 'ทั่วไป';
    const nextCategories = categories.includes(chosenCategory)
      ? categories
      : [...categories, chosenCategory];

    const productData: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: trimmedName,
      price: Math.round(parsedPrice * 100) / 100,
      category: chosenCategory,
      image: formImage,
      available: formAvailable,
    };

    const nextProducts = editingProduct
      ? products.map((p) => (p.id === editingProduct.id ? productData : p))
      : [productData, ...products];

    setIsSaving(true);
    await onSaveProducts(nextProducts, nextCategories);
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleDeleteProduct = async (product: Product) => {
    const nextProducts = products.filter((p) => p.id !== product.id);
    await onSaveProducts(nextProducts, categories);
  };

  const handleToggleAvailable = async (product: Product) => {
    const nextProducts = products.map((p) =>
      p.id === product.id ? { ...p, available: !p.available } : p
    );
    await onSaveProducts(nextProducts, categories);
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed || trimmed === 'ทั้งหมด') return;
    if (categories.includes(trimmed)) {
      onNotify('info', `มีหมวดหมู่ "${trimmed}" อยู่แล้ว`);
      return;
    }
    const nextCategories = [...categories, trimmed];
    setNewCategoryName('');
    await onSaveProducts(products, nextCategories);
  };

  const handleRemoveCategory = async (cat: string) => {
    if (categories.length <= 1) {
      onNotify('error', 'ต้องมีอย่างน้อย 1 หมวดหมู่ในระบบ');
      return;
    }
    const fallbackCategory = categories.find((c) => c !== cat) || 'ทั่วไป';
    const nextCategories = categories.filter((c) => c !== cat);
    const nextProducts = products.map((p) =>
      p.category === cat ? { ...p, category: fallbackCategory } : p
    );
    await onSaveProducts(nextProducts, nextCategories);
  };

  return (
    <main className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--theme-ink)]">จัดการสินค้าและหมวดหมู่</h1>
          <p className="text-sm text-[var(--theme-muted)] mt-0.5">
            บันทึกแล้วซิงก์ขึ้น Google Sheets ทันที พร้อมบีบอัดรูปอัตโนมัติไม่เกิน 35KB
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="h-11 px-5 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] font-bold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>เพิ่มเมนูใหม่</span>
        </button>
      </div>

      {/* Category Manager */}
      <section className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[var(--theme-ink)]">หมวดหมู่สินค้า</h2>
            <p className="text-xs text-[var(--theme-muted)] mt-0.5">
              ใช้สำหรับจัดกลุ่มและกรองเมนูที่หน้าขายหน้าร้าน
            </p>
          </div>
          <form onSubmit={handleAddCategory} className="flex items-center gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              aria-label="ชื่อหมวดหมู่ใหม่"
              placeholder="เพิ่มหมวดหมู่ใหม่..."
              className="h-10 px-3.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm text-[var(--theme-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-xl bg-[var(--theme-soft)] hover:bg-[var(--theme-soft-hover)] text-[var(--theme-accent-ink)] text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" aria-hidden="true" />
              <span>เพิ่ม</span>
            </button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div
              key={cat}
              className="inline-flex items-center gap-2 h-9 pl-3.5 pr-1.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm font-medium text-[var(--theme-ink)]"
            >
              <span>{cat}</span>
              <button
                type="button"
                onClick={() => handleRemoveCategory(cat)}
                aria-label={`ลบหมวดหมู่ ${cat}`}
                className="w-6 h-6 rounded-lg text-[var(--theme-muted)] hover:text-[#C92A2A] hover:bg-[#FFF5F5] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Product List */}
      <section className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--theme-border)] flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--theme-ink)]">
            รายการสินค้าทั้งหมด · {products.length} รายการ
          </h2>
        </div>

        <div className="divide-y divide-[var(--theme-border)]/70">
          {products.map((product) => (
            <div
              key={product.id}
              className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--theme-bg)]/40 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-16 h-12 rounded-xl overflow-hidden bg-[var(--theme-soft)] shrink-0 border border-[var(--theme-border)] flex items-center justify-center">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center block"
                    />
                  ) : (
                    <Coffee className="w-5 h-5 text-[var(--theme-accent-ink)]/60" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-bold text-[var(--theme-ink)] truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-[var(--theme-muted)] mt-0.5">
                    {product.category} ·{' '}
                    <span className="font-bold tabular-nums text-[var(--theme-accent-ink)]">
                      {formatBahtCompact(product.price)}
                    </span>{' '}
                    · {product.available ? 'เปิดขาย' : 'หมดชั่วคราว'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => handleToggleAvailable(product)}
                  className={`h-9 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    product.available
                      ? 'border-[var(--theme-border)] text-[var(--theme-muted)] hover:text-[var(--theme-ink)]'
                      : 'border-[#F5C2C7] bg-[#FFF5F5] text-[#842029]'
                  }`}
                >
                  {product.available ? 'พักการขาย' : 'เปิดขาย'}
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(product)}
                  aria-label={`แก้ไข ${product.name}`}
                  className="h-9 px-3 rounded-xl bg-[var(--theme-soft)] hover:bg-[var(--theme-soft-hover)] text-[var(--theme-accent-ink)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>แก้ไข</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProduct(product)}
                  aria-label={`ลบ ${product.name}`}
                  className="h-9 w-9 rounded-xl text-[var(--theme-muted)] hover:text-[#C92A2A] hover:bg-[#FFF5F5] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มเมนูใหม่'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-xl p-6 my-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[var(--theme-ink)]">
                {editingProduct ? 'แก้ไขสินค้า' : 'เพิ่มเมนูใหม่'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="ปิดหน้าต่างสินค้า"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--theme-muted)] hover:bg-[var(--theme-soft)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductForm} className="space-y-4">
              <div>
                <label
                  htmlFor="prod-name"
                  className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5"
                >
                  ชื่อเมนู
                </label>
                <input
                  id="prod-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น ลาเต้เย็นหวานน้อย"
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm text-[var(--theme-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="prod-price"
                    className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5"
                  >
                    ราคา (บาท)
                  </label>
                  <input
                    id="prod-price"
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="75"
                    className="w-full h-11 px-3.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm font-bold tabular-nums text-[var(--theme-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
                  />
                </div>

                <div>
                  <label
                    htmlFor="prod-category"
                    className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5"
                  >
                    หมวดหมู่
                  </label>
                  <select
                    id="prod-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm text-[var(--theme-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Upload with <35KB Compression */}
              <div>
                <span className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5">
                  รูปสินค้า (บีบอัด JPEG อัตโนมัติไม่เกิน 35KB)
                </span>
                <div className="flex items-center gap-3.5">
                  <div className="w-24 h-18 rounded-xl overflow-hidden bg-[var(--theme-soft)] border border-[var(--theme-border)] shrink-0 flex items-center justify-center">
                    {formImage ? (
                      <img
                        src={formImage}
                        alt="ตัวอย่างรูปสินค้า"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center block"
                      />
                    ) : (
                      <Coffee className="w-6 h-6 text-[var(--theme-accent-ink)]/50" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="h-10 px-3.5 rounded-xl bg-[var(--theme-soft)] hover:bg-[var(--theme-soft-hover)] text-[var(--theme-accent-ink)] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors">
                      {isCompressing ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Upload className="w-4 h-4" aria-hidden="true" />
                      )}
                      <span>{isCompressing ? 'กำลังบีบอัด...' : 'เลือกรูปภาพ'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFile}
                        className="sr-only"
                      />
                    </label>
                    {imageSizeKb !== null && (
                      <p className="text-[11px] text-[var(--theme-muted)] tabular-nums">
                        ขนาดไฟล์หลังบีบอัด: {imageSizeKb} KB
                      </p>
                    )}
                    {formImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormImage('');
                          setImageSizeKb(null);
                        }}
                        className="block text-[11px] font-semibold text-[#C92A2A] hover:underline cursor-pointer"
                      >
                        ลบรูปภาพ
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm font-medium text-[var(--theme-ink)] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formAvailable}
                  onChange={(e) => setFormAvailable(e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--theme-primary)]"
                />
                <span>เปิดขายที่หน้าหน้าร้าน</span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 px-4 rounded-xl border border-[var(--theme-border)] text-sm font-semibold text-[var(--theme-muted)] hover:text-[var(--theme-ink)] cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isCompressing}
                  className="h-11 px-5 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] font-bold text-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  <span>บันทึกและซิงก์</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
