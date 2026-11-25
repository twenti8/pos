import {
  DarkThemePresetId,
  LightThemePresetId,
  Product,
  ShopSettings,
  ThemePresetId,
} from '../types';

export const DEFAULT_LOGO_PATH = '/src/assets/images/cat_coffee_logo_1795569521264.jpg';

export interface ThemeCssVars {
  '--theme-bg': string;
  '--theme-surface': string;
  '--theme-soft': string;
  '--theme-soft-hover': string;
  '--theme-border': string;
  '--theme-primary': string;
  '--theme-primary-hover': string;
  '--theme-primary-text': string;
  '--theme-accent-ink': string;
  '--theme-ink': string;
  '--theme-muted': string;
  '--theme-success': string;
}

export interface ThemePreset<TId extends ThemePresetId = ThemePresetId> {
  id: TId;
  name: string;
  mode: 'light' | 'dark';
  swatch: string;
  swatchBg: string;
  previewGradient: string;
  vars: ThemeCssVars;
}

export const LIGHT_THEME_PRESETS: ThemePreset<LightThemePresetId>[] = [
  {
    id: 'pastel-pink',
    name: 'ชมพูพาสเทล',
    mode: 'light',
    swatch: '#D64F84',
    swatchBg: '#FCE7F0',
    previewGradient: 'linear-gradient(125deg, #FCEAF2 0%, #F7C7DC 52%, #E28BAE 100%)',
    vars: {
      '--theme-bg': '#FFF7FA',
      '--theme-surface': '#FFFFFF',
      '--theme-soft': '#FCE7F0',
      '--theme-soft-hover': '#F8D4E4',
      '--theme-border': '#F3CFE0',
      '--theme-primary': '#D64F84',
      '--theme-primary-hover': '#BD3D70',
      '--theme-primary-text': '#FFFFFF',
      '--theme-accent-ink': '#9F2B5B',
      '--theme-ink': '#2B1D24',
      '--theme-muted': '#765D6A',
      '--theme-success': '#1F7A3E',
    },
  },
  {
    id: 'peach',
    name: 'พีช',
    mode: 'light',
    swatch: '#D9663B',
    swatchBg: '#FDECE0',
    previewGradient: 'linear-gradient(125deg, #FDEEE5 0%, #F7CCA9 52%, #DF8D63 100%)',
    vars: {
      '--theme-bg': '#FFF9F5',
      '--theme-surface': '#FFFFFF',
      '--theme-soft': '#FDECE0',
      '--theme-soft-hover': '#FADBC7',
      '--theme-border': '#F4D5BF',
      '--theme-primary': '#C9592E',
      '--theme-primary-hover': '#B04922',
      '--theme-primary-text': '#FFFFFF',
      '--theme-accent-ink': '#953D1B',
      '--theme-ink': '#2D211B',
      '--theme-muted': '#796256',
      '--theme-success': '#1F7A3E',
    },
  },
  {
    id: 'butter-yellow',
    name: 'เนยเหลือง',
    mode: 'light',
    swatch: '#EAB938',
    swatchBg: '#FCF4CF',
    previewGradient: 'linear-gradient(125deg, #FCF6D8 0%, #F5DC8E 52%, #D7A83A 100%)',
    vars: {
      '--theme-bg': '#FFFDF3',
      '--theme-surface': '#FFFFFF',
      '--theme-soft': '#FCF4CF',
      '--theme-soft-hover': '#F7E9AF',
      '--theme-border': '#EFE0A3',
      '--theme-primary': '#EAB938',
      '--theme-primary-hover': '#D8A624',
      '--theme-primary-text': '#2A2006',
      '--theme-accent-ink': '#8A5F04',
      '--theme-ink': '#2B2414',
      '--theme-muted': '#75684B',
      '--theme-success': '#1F7A3E',
    },
  },
  {
    id: 'mint',
    name: 'มินต์',
    mode: 'light',
    swatch: '#269470',
    swatchBg: '#DDF5EA',
    previewGradient: 'linear-gradient(125deg, #E2F6EC 0%, #B4E2C9 52%, #68B892 100%)',
    vars: {
      '--theme-bg': '#F4FCF8',
      '--theme-surface': '#FFFFFF',
      '--theme-soft': '#DDF5EA',
      '--theme-soft-hover': '#C7EBD9',
      '--theme-border': '#BBE7D4',
      '--theme-primary': '#1E8262',
      '--theme-primary-hover': '#166D51',
      '--theme-primary-text': '#FFFFFF',
      '--theme-accent-ink': '#146148',
      '--theme-ink': '#182C25',
      '--theme-muted': '#506E63',
      '--theme-success': '#166D51',
    },
  },
  {
    id: 'clear-sky',
    name: 'ฟ้าใส',
    mode: 'light',
    swatch: '#2E8ED6',
    swatchBg: '#E0F1FE',
    previewGradient: 'linear-gradient(125deg, #E7F2FD 0%, #BEDBF8 52%, #74A8DF 100%)',
    vars: {
      '--theme-bg': '#F2F8FE',
      '--theme-surface': '#FFFFFF',
      '--theme-soft': '#E0F1FE',
      '--theme-soft-hover': '#CBE6FC',
      '--theme-border': '#D0E4F8',
      '--theme-primary': '#1E7CC2',
      '--theme-primary-hover': '#1767A4',
      '--theme-primary-text': '#FFFFFF',
      '--theme-accent-ink': '#1B5E98',
      '--theme-ink': '#172736',
      '--theme-muted': '#5D738A',
      '--theme-success': '#1F7A3E',
    },
  },
  {
    id: 'lavender',
    name: 'ลาเวนเดอร์',
    mode: 'light',
    swatch: '#7B5BC2',
    swatchBg: '#EFE7FC',
    previewGradient: 'linear-gradient(125deg, #F1E9FD 0%, #D4BEF8 52%, #9B77DF 100%)',
    vars: {
      '--theme-bg': '#FAF7FF',
      '--theme-surface': '#FFFFFF',
      '--theme-soft': '#EFE7FC',
      '--theme-soft-hover': '#E1D4FA',
      '--theme-border': '#DDD0F7',
      '--theme-primary': '#7353BA',
      '--theme-primary-hover': '#5F41A1',
      '--theme-primary-text': '#FFFFFF',
      '--theme-accent-ink': '#563A96',
      '--theme-ink': '#241E33',
      '--theme-muted': '#685E7D',
      '--theme-success': '#1F7A3E',
    },
  },
];

export const DARK_THEME_PRESETS: ThemePreset<DarkThemePresetId>[] = [
  {
    id: 'dark-pink',
    name: 'ดำชมพู',
    mode: 'dark',
    swatch: '#F472B6',
    swatchBg: '#1E161E',
    previewGradient: 'linear-gradient(130deg, #1E1319 0%, #2C1924 48%, #C85A8B 100%)',
    vars: {
      '--theme-bg': '#130F14',
      '--theme-surface': '#1D171F',
      '--theme-soft': '#2F2030',
      '--theme-soft-hover': '#3D293E',
      '--theme-border': '#402D41',
      '--theme-primary': '#F472B6',
      '--theme-primary-hover': '#EC4899',
      '--theme-primary-text': '#1C0D16',
      '--theme-accent-ink': '#F9A8D4',
      '--theme-ink': '#FAF2F7',
      '--theme-muted': '#B7A0B1',
      '--theme-success': '#4ADE80',
    },
  },
  {
    id: 'dark-peach',
    name: 'ดำพีช',
    mode: 'dark',
    swatch: '#FB923C',
    swatchBg: '#201815',
    previewGradient: 'linear-gradient(130deg, #211611 0%, #311F17 48%, #C46F48 100%)',
    vars: {
      '--theme-bg': '#15100E',
      '--theme-surface': '#201815',
      '--theme-soft': '#33241D',
      '--theme-soft-hover': '#422F26',
      '--theme-border': '#46332A',
      '--theme-primary': '#FB923C',
      '--theme-primary-hover': '#F97316',
      '--theme-primary-text': '#1E1007',
      '--theme-accent-ink': '#FDBA74',
      '--theme-ink': '#FAF4F0',
      '--theme-muted': '#BBA69A',
      '--theme-success': '#4ADE80',
    },
  },
  {
    id: 'dark-butter',
    name: 'ดำเนย',
    mode: 'dark',
    swatch: '#FACC15',
    swatchBg: '#1F1D14',
    previewGradient: 'linear-gradient(130deg, #1F1C10 0%, #2F2A16 48%, #B89432 100%)',
    vars: {
      '--theme-bg': '#14130D',
      '--theme-surface': '#1F1D14',
      '--theme-soft': '#312C1C',
      '--theme-soft-hover': '#403924',
      '--theme-border': '#443E28',
      '--theme-primary': '#FACC15',
      '--theme-primary-hover': '#EAB308',
      '--theme-primary-text': '#1B1705',
      '--theme-accent-ink': '#FDE047',
      '--theme-ink': '#FAF8EE',
      '--theme-muted': '#B9B197',
      '--theme-success': '#4ADE80',
    },
  },
  {
    id: 'dark-mint',
    name: 'ดำมินต์',
    mode: 'dark',
    swatch: '#34D399',
    swatchBg: '#14201C',
    previewGradient: 'linear-gradient(130deg, #111F19 0%, #172F24 48%, #4BA37B 100%)',
    vars: {
      '--theme-bg': '#0D1512',
      '--theme-surface': '#14201C',
      '--theme-soft': '#1E332C',
      '--theme-soft-hover': '#274239',
      '--theme-border': '#2B453C',
      '--theme-primary': '#34D399',
      '--theme-primary-hover': '#10B981',
      '--theme-primary-text': '#062017',
      '--theme-accent-ink': '#6EE7B7',
      '--theme-ink': '#EFFAF6',
      '--theme-muted': '#99B8AE',
      '--theme-success': '#6EE7B7',
    },
  },
  {
    id: 'dark-blue',
    name: 'ดำน้ำเงิน',
    mode: 'dark',
    swatch: '#38BDF8',
    swatchBg: '#141D28',
    previewGradient: 'linear-gradient(130deg, #111924 0%, #182538 48%, #598FD1 100%)',
    vars: {
      '--theme-bg': '#0D131B',
      '--theme-surface': '#141D28',
      '--theme-soft': '#1E2D40',
      '--theme-soft-hover': '#273A52',
      '--theme-border': '#2C4059',
      '--theme-primary': '#38BDF8',
      '--theme-primary-hover': '#0EA5E9',
      '--theme-primary-text': '#061926',
      '--theme-accent-ink': '#7DD3FC',
      '--theme-ink': '#F0F6FC',
      '--theme-muted': '#99B0C5',
      '--theme-success': '#4ADE80',
    },
  },
  {
    id: 'dark-purple',
    name: 'ดำม่วง',
    mode: 'dark',
    swatch: '#A78BFA',
    swatchBg: '#1B1726',
    previewGradient: 'linear-gradient(130deg, #1A1426 0%, #261B3A 48%, #855FD0 100%)',
    vars: {
      '--theme-bg': '#110F1A',
      '--theme-surface': '#1B1726',
      '--theme-soft': '#2A233D',
      '--theme-soft-hover': '#362D4F',
      '--theme-border': '#3B3256',
      '--theme-primary': '#A78BFA',
      '--theme-primary-hover': '#8B5CF6',
      '--theme-primary-text': '#140C28',
      '--theme-accent-ink': '#C4B5FD',
      '--theme-ink': '#F5F2FC',
      '--theme-muted': '#ABA2C2',
      '--theme-success': '#4ADE80',
    },
  },
];

export const THEME_PRESETS: ThemePreset[] = [
  ...LIGHT_THEME_PRESETS,
  ...DARK_THEME_PRESETS,
];

const LEGACY_THEME_MAP: Record<string, ThemePresetId> = {
  'strawberry-milk': 'pastel-pink',
  'matcha-cream': 'mint',
  'caramel-latte': 'peach',
  'taro-lavender': 'lavender',
  'sky-soda': 'clear-sky',
  'cocoa-mocha': 'peach',
};

export function normalizeThemeId(rawId?: string): ThemePresetId {
  if (!rawId) return 'clear-sky';
  if (rawId === 'custom') return 'custom';
  if (THEME_PRESETS.some((t) => t.id === rawId)) {
    return rawId as ThemePresetId;
  }
  return LEGACY_THEME_MAP[rawId] ?? 'clear-sky';
}

export function normalizeHexColor(raw?: string, fallback = '#2E8ED6'): string {
  const trimmed = String(raw || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = normalizeHexColor(hex).slice(1);
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  weightB: number
): string {
  const wA = 1 - weightB;
  return rgbToHex(
    a[0] * wA + b[0] * weightB,
    a[1] * wA + b[1] * weightB,
    a[2] * wA + b[2] * weightB
  );
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function buildCustomPreviewGradient(customHex: string): string {
  const primary = normalizeHexColor(customHex, '#74A8DF');
  const rgb = hexToRgb(primary);
  const white: [number, number, number] = [255, 255, 255];
  const start = mixRgb(rgb, white, 0.85);
  const mid = mixRgb(rgb, white, 0.5);
  return `linear-gradient(125deg, ${start} 0%, ${mid} 52%, ${primary} 100%)`;
}

export function buildCustomThemeVars(customHex: string): ThemeCssVars {
  const primary = normalizeHexColor(customHex, '#2E8ED6');
  const rgb = hexToRgb(primary);
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [20, 20, 24];
  const lum = relativeLuminance(rgb);

  const primaryText = lum > 0.42 ? '#1A1A1E' : '#FFFFFF';
  const primaryHover = lum > 0.2 ? mixRgb(rgb, black, 0.14) : mixRgb(rgb, white, 0.14);
  const accentInk = lum > 0.28 ? mixRgb(rgb, black, 0.38) : primary;

  return {
    '--theme-bg': mixRgb(rgb, white, 0.94),
    '--theme-surface': '#FFFFFF',
    '--theme-soft': mixRgb(rgb, white, 0.86),
    '--theme-soft-hover': mixRgb(rgb, white, 0.76),
    '--theme-border': mixRgb(rgb, white, 0.72),
    '--theme-primary': primary,
    '--theme-primary-hover': primaryHover,
    '--theme-primary-text': primaryText,
    '--theme-accent-ink': accentInk,
    '--theme-ink': '#1F2329',
    '--theme-muted': '#5E6673',
    '--theme-success': '#1F7A3E',
  };
}

export function resolveThemeConfig(
  themeId?: string,
  customColor?: string
): { id: ThemePresetId; mode: 'light' | 'dark'; vars: ThemeCssVars } {
  const id = normalizeThemeId(themeId);
  if (id === 'custom') {
    return {
      id: 'custom',
      mode: 'light',
      vars: buildCustomThemeVars(customColor || '#2E8ED6'),
    };
  }
  const found =
    THEME_PRESETS.find((t) => t.id === id) ??
    LIGHT_THEME_PRESETS.find((t) => t.id === 'clear-sky')!;
  return {
    id: found.id,
    mode: found.mode,
    vars: found.vars,
  };
}

export const DEFAULT_CATEGORIES: string[] = [
  'กาแฟ',
  'ชาและนม',
  'เบเกอรี',
  'เมนูพิเศษ',
];

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'finedaevibe.',
  shopSubtitle: 'Cozy Cafe & Homemade Bakery',
  tabTitle: '',
  promptPayId: '0812345678',
  logoBase64: '',
  bannerBase64: '',
  themeId: 'clear-sky',
  customThemeColor: '#2E8ED6',
  categories: DEFAULT_CATEGORIES,
  receiptFooterNote: 'ขอบคุณที่แวะมาเติมความสดใสนะคะ',
};

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p-caramel-latte',
    name: 'คาราเมลลาเต้เย็น',
    price: 75,
    category: 'กาแฟ',
    image: '/src/assets/images/iced_latte_drink_1795569522023.jpg',
    available: true,
  },
  {
    id: 'p-uji-matcha',
    name: 'อุจิมัทฉะลาเต้เย็น',
    price: 85,
    category: 'ชาและนม',
    image: '/src/assets/images/matcha_latte_drink_1795569522112.jpg',
    available: true,
  },
  {
    id: 'p-strawberry-milk',
    name: 'นมสดสตรอว์เบอร์รีเกาหลี',
    price: 80,
    category: 'ชาและนม',
    image: '/src/assets/images/strawberry_milk_drink_1795569521474.jpg',
    available: true,
  },
  {
    id: 'p-butter-croissant',
    name: 'ครัวซองต์เนยฝรั่งเศส',
    price: 75,
    category: 'เบเกอรี',
    image: '/src/assets/images/butter_croissant_bakery_1795569522691.jpg',
    available: true,
  },
  {
    id: 'p-americano',
    name: 'อเมริกาโน่เย็นคั่วกลาง',
    price: 65,
    category: 'กาแฟ',
    image: '/src/assets/images/iced_latte_drink_1795569522023.jpg',
    available: true,
  },
  {
    id: 'p-dirty-coffee',
    name: 'เดอร์ตี้คอฟฟี่นมนัว',
    price: 90,
    category: 'เมนูพิเศษ',
    image: '/src/assets/images/iced_latte_drink_1795569522023.jpg',
    available: true,
  },
  {
    id: 'p-hojicha-latte',
    name: 'โฮจิฉะคั่วหอมลาเต้',
    price: 80,
    category: 'ชาและนม',
    image: '/src/assets/images/matcha_latte_drink_1795569522112.jpg',
    available: true,
  },
  {
    id: 'p-croffle-honey',
    name: 'ครอฟเฟิลน้ำผึ้งป่า',
    price: 95,
    category: 'เบเกอรี',
    image: '/src/assets/images/butter_croissant_bakery_1795569522691.jpg',
    available: true,
  },
];
