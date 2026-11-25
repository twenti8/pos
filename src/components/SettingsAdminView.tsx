import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  Upload,
  Trash2,
  CloudUpload,
  Save,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import { ShopSettings, ThemePresetId } from '../types';
import {
  buildCustomPreviewGradient,
  DARK_THEME_PRESETS,
  DEFAULT_LOGO_PATH,
  LIGHT_THEME_PRESETS,
  normalizeHexColor,
} from '../constants/themes';
import { processStorefrontImage } from '../utils/imageCompress';
import { resolveDocumentTitle } from '../utils/posLogic';
import { isValidPromptPayId } from '../utils/promptpay';

interface SettingsAdminViewProps {
  settings: ShopSettings;
  onSaveSettings: (nextSettings: ShopSettings, customSuccessMsg?: string) => Promise<void>;
  onPreviewTheme: (preview: { themeId: ThemePresetId; customThemeColor: string } | null) => void;
  onManualSyncAll: (currentDraftSettings: ShopSettings) => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function SettingsAdminView({
  settings,
  onSaveSettings,
  onPreviewTheme,
  onManualSyncAll,
  onNotify,
}: SettingsAdminViewProps) {
  const [draft, setDraft] = useState<ShopSettings>(settings);
  const [isProcessingProfile, setIsProcessingProfile] = useState(false);
  const [isProcessingBanner, setIsProcessingBanner] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  // Clear live theme preview if user leaves Settings without saving theme
  useEffect(() => {
    return () => {
      onPreviewTheme(null);
    };
  }, [onPreviewTheme]);

  const handleProfileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingProfile(true);
    try {
      const processed = await processStorefrontImage(file, 400);
      const nextSettings: ShopSettings = {
        ...draft,
        logoBase64: processed.dataUrl,
      };
      setDraft(nextSettings);
      await onSaveSettings(
        nextSettings,
        processed.isGif
          ? 'อัปเดตรูปโปรไฟล์ GIF เคลื่อนไหวและซิงก์ขึ้นคลาวด์แล้ว'
          : 'อัปเดตรูปโปรไฟล์และซิงก์ขึ้นคลาวด์เรียบร้อยแล้ว'
      );
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้ กรุณาลองไฟล์อื่น'
      );
    } finally {
      setIsProcessingProfile(false);
      e.target.value = '';
    }
  };

  const handleRemoveProfile = async () => {
    const nextSettings: ShopSettings = {
      ...draft,
      logoBase64: '',
    };
    setDraft(nextSettings);
    await onSaveSettings(nextSettings, 'ลบรูปโปรไฟล์ที่กำหนดเองและกลับไปใช้รูปเริ่มต้นแล้ว');
  };

  const handleBannerUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingBanner(true);
    try {
      const processed = await processStorefrontImage(file, 960);
      const nextSettings: ShopSettings = {
        ...draft,
        bannerBase64: processed.dataUrl,
      };
      setDraft(nextSettings);
      await onSaveSettings(
        nextSettings,
        processed.isGif
          ? 'อัปเดตแบนเนอร์ GIF เคลื่อนไหวและซิงก์ขึ้นคลาวด์แล้ว'
          : 'อัปเดตแบนเนอร์หน้าร้านและซิงก์ขึ้นคลาวด์เรียบร้อยแล้ว'
      );
    } catch (err) {
      onNotify(
        'error',
        err instanceof Error ? err.message : 'ไม่สามารถอัปโหลดแบนเนอร์ได้ กรุณาลองไฟล์อื่น'
      );
    } finally {
      setIsProcessingBanner(false);
      e.target.value = '';
    }
  };

  const handleRemoveBanner = async () => {
    const nextSettings: ShopSettings = {
      ...draft,
      bannerBase64: '',
    };
    setDraft(nextSettings);
    await onSaveSettings(nextSettings, 'ลบแบนเนอร์หน้าร้านเรียบร้อยแล้ว');
  };

  const handleSelectTheme = (themeId: ThemePresetId) => {
    setDraft((prev) => ({ ...prev, themeId }));
    onPreviewTheme({
      themeId,
      customThemeColor: draft.customThemeColor,
    });
  };

  const handleCustomColorChange = (rawColor: string) => {
    const normalized = normalizeHexColor(rawColor, draft.customThemeColor);
    setDraft((prev) => ({
      ...prev,
      themeId: 'custom',
      customThemeColor: normalized,
    }));
    onPreviewTheme({
      themeId: 'custom',
      customThemeColor: normalized,
    });
  };

  const handleSaveTheme = async () => {
    setIsSavingTheme(true);
    const nextSettings: ShopSettings = {
      ...settings,
      ...draft,
      themeId: draft.themeId,
      customThemeColor: normalizeHexColor(draft.customThemeColor, '#2E8ED6'),
    };
    await onSaveSettings(nextSettings, 'บันทึกธีมสีและซิงก์ไปยังทุกอุปกรณ์เรียบร้อยแล้ว');
    onPreviewTheme(null);
    setIsSavingTheme(false);
  };

  const handleSaveGeneral = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.shopName.trim()) {
      onNotify('error', 'กรุณากรอกชื่อร้าน');
      return;
    }
    if (draft.promptPayId.trim() && !isValidPromptPayId(draft.promptPayId)) {
      onNotify('error', 'หมายเลข PromptPay ควรเป็นเบอร์มือถือ 10 หลัก หรือเลขบัตรประชาชน 13 หลัก');
      return;
    }
    setIsSaving(true);
    await onSaveSettings({
      ...draft,
      shopName: draft.shopName.trim(),
      shopSubtitle: draft.shopSubtitle.trim(),
      tabTitle: draft.tabTitle.trim(),
      promptPayId: draft.promptPayId.trim(),
      receiptFooterNote: draft.receiptFooterNote.trim(),
    });
    onPreviewTheme(null);
    setIsSaving(false);
  };

  const handleSyncNow = async () => {
    setIsSyncingAll(true);
    await onManualSyncAll(draft);
    onPreviewTheme(null);
    setIsSyncingAll(false);
  };

  const previewTitle = resolveDocumentTitle(draft);
  const profilePreviewSrc = draft.logoBase64?.trim() ? draft.logoBase64 : DEFAULT_LOGO_PATH;

  return (
    <main className="max-w-4xl mx-auto px-4 lg:px-6 py-6 pb-24 md:pb-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--theme-ink)]">ตั้งค่าร้านและธีม</h1>
          <p className="text-sm text-[var(--theme-muted)] mt-0.5">
            ข้อมูลทั้งหมดจะซิงก์ไปยัง Google Sheets เพื่อให้ PC, iPhone และ iPad แสดงผลตรงกัน
          </p>
        </div>

        <button
          type="button"
          onClick={handleSyncNow}
          disabled={isSyncingAll}
          className="h-11 px-4 rounded-xl bg-[var(--theme-soft)] hover:bg-[var(--theme-soft-hover)] text-[var(--theme-accent-ink)] font-bold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-60"
        >
          {isSyncingAll ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <CloudUpload className="w-4 h-4" aria-hidden="true" />
          )}
          <span>ซิงก์ข้อมูลขึ้นคลาวด์ทันที (Sync to Sheets)</span>
        </button>
      </div>

      {/* Storefront Images Card (รูปหน้าร้าน) */}
      <section
        aria-label="รูปหน้าร้าน"
        className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-5 sm:p-6 space-y-5"
      >
        <div>
          <h2 className="text-base font-bold text-[var(--theme-ink)]">รูปหน้าร้าน</h2>
          <p className="text-xs text-[var(--theme-muted)] mt-0.5">
            อัปโหลดรูปโปรไฟล์และแบนเนอร์เพื่อแสดงบนหน้าร้าน หน้าล็อกอิน และใบเสร็จ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {/* Box 1: รูปโปรไฟล์ */}
          <div className="rounded-2xl bg-[var(--theme-bg)] border border-[var(--theme-border)] p-4 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--theme-ink)]">รูปโปรไฟล์</h3>
              <p className="text-xs text-[var(--theme-muted)] mt-1 leading-relaxed">
                จัตุรัส เช่น 400×400 · ใส่ GIF เคลื่อนไหวได้ ไม่เกิน 10 MB
              </p>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="w-28 h-28 rounded-2xl overflow-hidden relative border border-[var(--theme-border)] bg-[#FFFDF9] shrink-0">
                <img
                  src={profilePreviewSrc}
                  alt="ตัวอย่างรูปโปรไฟล์ร้าน"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center block"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex-1 h-10 px-3.5 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap">
                {isProcessingProfile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{isProcessingProfile ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูป'}</span>
                <input
                  type="file"
                  accept="image/*,.gif"
                  aria-label="เปลี่ยนรูปโปรไฟล์"
                  onChange={handleProfileUpload}
                  className="sr-only"
                />
              </label>
              <button
                type="button"
                onClick={handleRemoveProfile}
                disabled={!draft.logoBase64 || isProcessingProfile}
                aria-label="ลบรูปโปรไฟล์"
                className="h-10 px-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-soft)] text-xs font-semibold text-[var(--theme-ink)] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>ลบ</span>
              </button>
            </div>
          </div>

          {/* Box 2: แบนเนอร์ */}
          <div className="rounded-2xl bg-[var(--theme-bg)] border border-[var(--theme-border)] p-4 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--theme-ink)]">แบนเนอร์</h3>
              <p className="text-xs text-[var(--theme-muted)] mt-1 leading-relaxed">
                ใต้ส่วนหัวร้าน · 1920×800 px · ใส่ GIF เคลื่อนไหวได้ ไม่เกิน 10 MB · รูปสัดส่วนอื่นจะถูกครอปตรงกลางให้พอดี
              </p>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="w-full aspect-[12/5] rounded-2xl overflow-hidden relative border border-[var(--theme-border)] bg-[var(--theme-surface)]">
                {draft.bannerBase64 ? (
                  <img
                    src={draft.bannerBase64}
                    alt="ตัวอย่างแบนเนอร์หน้าร้าน"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center block"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[var(--theme-muted)] px-4 text-center">
                    <ImageIcon className="w-6 h-6 opacity-70" aria-hidden="true" />
                    <span className="text-xs">ยังไม่ได้ตั้งค่าแบนเนอร์</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex-1 h-10 px-3.5 rounded-xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap">
                {isProcessingBanner ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{isProcessingBanner ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูป'}</span>
                <input
                  type="file"
                  accept="image/*,.gif"
                  aria-label="เปลี่ยนรูปแบนเนอร์"
                  onChange={handleBannerUpload}
                  className="sr-only"
                />
              </label>
              <button
                type="button"
                onClick={handleRemoveBanner}
                disabled={!draft.bannerBase64 || isProcessingBanner}
                aria-label="ลบแบนเนอร์"
                className="h-10 px-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-soft)] text-xs font-semibold text-[var(--theme-ink)] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>ลบ</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Theme Card (ธีมสีของร้าน) */}
      <section
        aria-label="ธีมสีของร้าน"
        className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)]/80 shadow-[0_8px_28px_rgba(30,80,140,0.06)] p-6 sm:p-7 space-y-5"
      >
        <div>
          <h2 className="text-base font-bold text-[var(--theme-accent-ink)]">ธีมสีของร้าน</h2>
          <p className="text-sm text-[var(--theme-muted)] mt-1.5">
            สีของหน้าชำระเงินทั้งหน้า · ปุ่ม การ์ด ตัวหนังสือ และไอคอนเปลี่ยนตามกัน
          </p>
        </div>

        {/* Unified 6-column grid: Row 1 (6 Light) + Row 2 (6 Dark) + Row 3 (Custom tile) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {LIGHT_THEME_PRESETS.map((preset) => {
            const isSelected = draft.themeId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectTheme(preset.id)}
                aria-pressed={isSelected}
                aria-label={`เลือกธีมสี ${preset.name}`}
                className={`group flex flex-col items-center gap-2.5 p-2.5 pb-3 rounded-2xl bg-[var(--theme-surface)] transition-all cursor-pointer ${
                  isSelected
                    ? 'border-2 border-[var(--theme-primary)] shadow-[0_0_0_2px_var(--theme-soft)]'
                    : 'border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/60'
                }`}
              >
                <span
                  className="w-full h-9 rounded-xl block border border-black/5"
                  style={{ background: preset.previewGradient }}
                  aria-hidden="true"
                />
                <span className="text-[13px] font-bold text-[var(--theme-accent-ink)] whitespace-nowrap leading-none">
                  {preset.name}
                </span>
              </button>
            );
          })}

          {DARK_THEME_PRESETS.map((preset) => {
            const isSelected = draft.themeId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectTheme(preset.id)}
                aria-pressed={isSelected}
                aria-label={`เลือกธีมสี ${preset.name}`}
                className={`group flex flex-col items-center gap-2.5 p-2.5 pb-3 rounded-2xl bg-[var(--theme-surface)] transition-all cursor-pointer ${
                  isSelected
                    ? 'border-2 border-[var(--theme-primary)] shadow-[0_0_0_2px_var(--theme-soft)]'
                    : 'border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/60'
                }`}
              >
                <span
                  className="w-full h-9 rounded-xl block border border-white/10"
                  style={{ background: preset.previewGradient }}
                  aria-hidden="true"
                />
                <span className="text-[13px] font-bold text-[var(--theme-accent-ink)] whitespace-nowrap leading-none">
                  {preset.name}
                </span>
              </button>
            );
          })}

          {/* Row 3, Col 1: สีของร้านเอง tile with native color picker */}
          <label
            className={`relative flex flex-col items-center gap-2.5 p-2.5 pb-3 rounded-2xl bg-[var(--theme-surface)] transition-all cursor-pointer ${
              draft.themeId === 'custom'
                ? 'border-2 border-[var(--theme-primary)] shadow-[0_0_0_2px_var(--theme-soft)]'
                : 'border border-[var(--theme-border)] hover:border-[var(--theme-primary)]/60'
            }`}
          >
            <input
              id="custom-theme-color-picker"
              type="color"
              aria-label="เลือกสีของร้านเอง"
              value={normalizeHexColor(draft.customThemeColor, '#74A8DF')}
              onClick={() => handleSelectTheme('custom')}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              className="sr-only"
            />
            <span
              className="w-full h-9 rounded-xl block border border-black/5"
              style={{
                background: buildCustomPreviewGradient(draft.customThemeColor),
              }}
              aria-hidden="true"
            />
            <span className="text-[13px] font-bold text-[var(--theme-accent-ink)] whitespace-nowrap leading-none">
              สีของร้านเอง
            </span>
          </label>
        </div>

        {/* Bottom-left Save Theme pill button + subtle hex display when custom selected */}
        <div className="flex flex-wrap items-center justify-start gap-3 pt-1">
          <button
            type="button"
            onClick={handleSaveTheme}
            disabled={isSavingTheme}
            className="h-10 px-5 rounded-full bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap shadow-xs transition-colors"
          >
            {isSavingTheme ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="w-4 h-4" aria-hidden="true" />
            )}
            <span>บันทึกธีมสี</span>
          </button>

          {draft.themeId === 'custom' && (
            <span className="text-xs font-semibold text-[var(--theme-muted)] tabular-nums">
              สีที่เลือก: {normalizeHexColor(draft.customThemeColor, '#2E8ED6')}
            </span>
          )}
        </div>
      </section>

      {/* General Shop Info & Browser Title Form */}
      <form onSubmit={handleSaveGeneral} className="space-y-5">
        <section className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-5 sm:p-6 space-y-5">
          <h2 className="text-base font-bold text-[var(--theme-ink)]">ข้อมูลร้านและแบรนด์</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="setting-shop-name"
                className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5"
              >
                ชื่อร้าน
              </label>
              <input
                id="setting-shop-name"
                type="text"
                required
                value={draft.shopName}
                onChange={(e) => setDraft((prev) => ({ ...prev, shopName: e.target.value }))}
                placeholder="finedaevibe."
                className="w-full h-11 px-3.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm text-[var(--theme-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
              />
            </div>

            <div>
              <label
                htmlFor="setting-shop-subtitle"
                className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5"
              >
                คำอธิบายใต้ชื่อร้าน (บนหน้าล็อกอินและใบเสร็จ)
              </label>
              <input
                id="setting-shop-subtitle"
                type="text"
                value={draft.shopSubtitle}
                onChange={(e) => setDraft((prev) => ({ ...prev, shopSubtitle: e.target.value }))}
                placeholder="Cozy Cafe & Homemade Bakery"
                className="w-full h-11 px-3.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm text-[var(--theme-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="setting-tab-title"
              className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5"
            >
              ชื่อแท็บเบราว์เซอร์ (Browser Tab Title)
            </label>
            <input
              id="setting-tab-title"
              type="text"
              value={draft.tabTitle}
              onChange={(e) => setDraft((prev) => ({ ...prev, tabTitle: e.target.value }))}
              placeholder={`${draft.shopName || 'finedaevibe.'} POS · ระบบขายหน้าร้าน`}
              className="w-full h-11 px-3.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm text-[var(--theme-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
            />
            <p className="text-xs text-[var(--theme-muted)] mt-1.5">
              ตัวอย่างบนแท็บเบราว์เซอร์:{' '}
              <span className="font-semibold text-[var(--theme-ink)]">{previewTitle}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="setting-promptpay"
                className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5"
              >
                รหัส PromptPay สำหรับรับเงิน
              </label>
              <input
                id="setting-promptpay"
                type="text"
                inputMode="numeric"
                value={draft.promptPayId}
                onChange={(e) => setDraft((prev) => ({ ...prev, promptPayId: e.target.value }))}
                placeholder="0812345678 หรือเลขบัตร 13 หลัก"
                className="w-full h-11 px-3.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm tabular-nums text-[var(--theme-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
              />
              <p className="text-xs text-[var(--theme-muted)] mt-1">
                ใช้สร้าง QR Code แบบล็อกยอดเงินอัตโนมัติที่ท้ายใบเสร็จทุกใบ
              </p>
            </div>

            <div>
              <label
                htmlFor="setting-footer-note"
                className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5"
              >
                ข้อความขอบคุณท้ายใบเสร็จ
              </label>
              <input
                id="setting-footer-note"
                type="text"
                value={draft.receiptFooterNote}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, receiptFooterNote: e.target.value }))
                }
                placeholder="ขอบคุณที่แวะมาเติมความสดใสนะคะ"
                className="w-full h-11 px-3.5 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm text-[var(--theme-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSaving || isProcessingProfile || isProcessingBanner}
              className="h-11 px-6 rounded-2xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="w-4 h-4" aria-hidden="true" />
              )}
              <span>บันทึกข้อมูลร้าน</span>
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}
