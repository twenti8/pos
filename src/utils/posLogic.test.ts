import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildItemsSummary,
  calculateCartTotals,
  calculateChange,
  formatBaht,
  formatThaiDateTime,
  generateReceiptId,
  getQuickCashAmounts,
  normalizeProduct,
  normalizeSettings,
  resolveDocumentTitle,
} from './posLogic';
import {
  DARK_THEME_PRESETS,
  DEFAULT_SETTINGS,
  LIGHT_THEME_PRESETS,
  resolveThemeConfig,
} from '../constants/themes';
import { isGifFile } from './imageCompress';

test('generateReceiptId produces RCyymmdd-xxxx format', () => {
  const date = new Date(2026, 10, 24, 17, 18, 0); // Nov 24, 2026
  const id = generateReceiptId(date, 42);
  assert.equal(id, 'RC261124-0042');
  assert.match(generateReceiptId(date), /^RC261124-\d{4}$/);
});

test('formatBaht formats currency with 2 decimal places', () => {
  assert.equal(formatBaht(315), '฿315.00');
  assert.equal(formatBaht(1250.5), '฿1,250.50');
});

test('calculateCartTotals and calculateChange compute exact totals', () => {
  const totals = calculateCartTotals([
    {
      product: { id: '1', name: 'Latte', price: 75, category: 'กาแฟ', available: true },
      quantity: 2,
    },
    {
      product: { id: '2', name: 'Croissant', price: 85, category: 'เบเกอรี', available: true },
      quantity: 1,
    },
  ]);
  assert.equal(totals.itemCount, 3);
  assert.equal(totals.netTotal, 235);
  assert.equal(calculateChange(235, 500), 265);
  assert.equal(calculateChange(235, 200), 0);
});

test('getQuickCashAmounts starts with exact total and includes practical Thai banknotes', () => {
  const amounts = getQuickCashAmounts(185);
  assert.equal(amounts[0], 185);
  assert.ok(amounts.includes(200));
  assert.ok(amounts.includes(500));
  assert.ok(amounts.includes(1000));
});

test('buildItemsSummary joins item names and quantities cleanly', () => {
  const summary = buildItemsSummary([
    { id: '1', name: 'คาราเมลลาเต้เย็น', price: 75, quantity: 2, subtotal: 150 },
    { id: '2', name: 'ครัวซองต์เนยฝรั่งเศส', price: 75, quantity: 1, subtotal: 75 },
  ]);
  assert.equal(summary, 'คาราเมลลาเต้เย็น x2, ครัวซองต์เนยฝรั่งเศส x1');
});

test('resolveDocumentTitle uses custom tabTitle or falls back to shopName pattern', () => {
  assert.equal(
    resolveDocumentTitle({ shopName: 'finedaevibe.', tabTitle: '' }),
    'finedaevibe. POS · ระบบขายหน้าร้าน'
  );
  assert.equal(
    resolveDocumentTitle({ shopName: 'finedaevibe.', tabTitle: 'หน้าร้านสาขาอารีย์' }),
    'หน้าร้านสาขาอารีย์'
  );
});

test('formatThaiDateTime converts Gregorian year to Thai Buddhist Era', () => {
  const dt = new Date(2026, 10, 24, 9, 5, 0); // 24 Nov 2026 09:05 -> 2569 BE
  assert.equal(formatThaiDateTime(dt), '24 พ.ย. 2569 09:05 น.');
});

test('normalizeProduct and normalizeSettings safely coerce Google Sheets payloads', () => {
  const product = normalizeProduct({
    id: 101,
    name: 'ชาไทยเย็น',
    price: '65',
    category: 'ชาและนม',
    available: 'TRUE',
  });
  assert.equal(product.id, '101');
  assert.equal(product.price, 65);
  assert.equal(product.available, true);

  const settings = normalizeSettings(
    {
      shopName: 'Meow Cafe',
      themeId: 'dark-pink',
      customThemeColor: '#ff5599',
      bannerBase64: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      categories: '["กาแฟ","ชา"]',
    },
    DEFAULT_SETTINGS
  );
  assert.equal(settings.shopName, 'Meow Cafe');
  assert.equal(settings.themeId, 'dark-pink');
  assert.equal(settings.customThemeColor, '#FF5599');
  assert.ok(settings.bannerBase64.startsWith('data:image/gif;base64,'));
  assert.deepEqual(settings.categories, ['กาแฟ', 'ชา']);
});

test('theme presets include 6 light, 6 dark, clear-sky default, and custom color generator', () => {
  assert.equal(LIGHT_THEME_PRESETS.length, 6);
  assert.equal(DARK_THEME_PRESETS.length, 6);
  assert.equal(DEFAULT_SETTINGS.themeId, 'clear-sky');

  const darkBlue = resolveThemeConfig('dark-blue');
  assert.equal(darkBlue.mode, 'dark');
  assert.equal(darkBlue.vars['--theme-primary'], '#38BDF8');

  const customLight = resolveThemeConfig('custom', '#FACC15');
  assert.equal(customLight.id, 'custom');
  assert.equal(customLight.vars['--theme-primary'], '#FACC15');
  assert.equal(customLight.vars['--theme-primary-text'], '#1A1A1E');

  const customDarkPrimary = resolveThemeConfig('custom', '#1E3A8A');
  assert.equal(customDarkPrimary.vars['--theme-primary-text'], '#FFFFFF');
});

test('isGifFile accurately detects GIF MIME types and filenames', () => {
  assert.equal(isGifFile({ type: 'image/gif', name: 'cat.bin' }), true);
  assert.equal(isGifFile({ type: '', name: 'banner.GIF' }), true);
  assert.equal(isGifFile({ type: 'image/png', name: 'logo.png' }), false);
});
