import { OrderRecord, Product, SessionUser, ShopSettings, UserAccount } from '../types';
import {
  normalizeOrder,
  normalizeProduct,
  normalizeSessionUser,
  normalizeSettings,
  normalizeUser,
} from '../utils/posLogic';

export const GAS_URL =
  'https://script.google.com/macros/s/AKfycbxMRCn1rSxjKSc1ucoPCVu1bEkZtXCR4KfIvHgBesS7_ow2zIAX2dLw1s72dvvvf1qz/exec';

export interface GasResponse<T = Record<string, unknown>> {
  ok: boolean;
  data?: T;
  error?: string;
  networkError?: boolean;
}

async function postGas<T = Record<string, unknown>>(
  payload: Record<string, unknown>
): Promise<GasResponse<T>> {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      redirect: 'follow',
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
    } catch {
      return {
        ok: false,
        error: 'ไม่สามารถอ่านข้อมูลตอบกลับจาก Google Apps Script ได้',
      };
    }

    const explicitFalse =
      parsed.success === false ||
      parsed.ok === false ||
      parsed.status === 'error' ||
      parsed.status === 'fail';

    if (!response.ok || explicitFalse) {
      return {
        ok: false,
        data: parsed as T,
        error: String(parsed.message ?? parsed.error ?? 'การเชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ'),
      };
    }

    return {
      ok: true,
      data: parsed as T,
    };
  } catch (err) {
    return {
      ok: false,
      networkError: true,
      error: err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อคลาวด์ได้ในขณะนี้',
    };
  }
}

export interface InitDataPayload {
  products?: Product[];
  settings?: ShopSettings;
  orders?: OrderRecord[];
}

export async function fetchInitData(fallbackSettings: ShopSettings): Promise<{
  ok: boolean;
  data?: InitDataPayload;
  error?: string;
}> {
  const res = await postGas<Record<string, unknown>>({ action: 'getInitData' });
  if (!res.ok || !res.data) {
    return { ok: false, error: res.error };
  }

  const root = (res.data.data && typeof res.data.data === 'object'
    ? (res.data.data as Record<string, unknown>)
    : res.data) as Record<string, unknown>;

  const result: InitDataPayload = {};

  if (Array.isArray(root.products)) {
    result.products = root.products
      .filter((p): p is Record<string, unknown> => Boolean(p && typeof p === 'object'))
      .map((p, idx) => normalizeProduct(p, idx));
  }

  if (root.settings && typeof root.settings === 'object') {
    result.settings = normalizeSettings(
      root.settings as Record<string, unknown>,
      fallbackSettings
    );
  }

  if (Array.isArray(root.orders)) {
    result.orders = root.orders
      .filter((o): o is Record<string, unknown> => Boolean(o && typeof o === 'object'))
      .map((o, idx) => normalizeOrder(o, idx));
  }

  return { ok: true, data: result };
}

export async function syncProductsToCloud(
  products: Product[],
  categories?: string[]
): Promise<GasResponse> {
  return postGas({
    action: 'saveProducts',
    products,
    ...(categories ? { categories } : {}),
  });
}

export async function syncSettingsToCloud(settings: ShopSettings): Promise<GasResponse> {
  return postGas({
    action: 'saveSettings',
    settings,
  });
}

export async function loginWithGas(
  username: string,
  password: string
): Promise<{
  ok: boolean;
  user?: SessionUser;
  error?: string;
  networkError?: boolean;
}> {
  const res = await postGas<Record<string, unknown>>({
    action: 'login',
    username: username.trim(),
    password,
  });

  if (!res.ok || !res.data) {
    return {
      ok: false,
      error: res.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
      networkError: res.networkError,
    };
  }

  const root = (res.data.user && typeof res.data.user === 'object'
    ? (res.data.user as Record<string, unknown>)
    : res.data.data && typeof res.data.data === 'object'
      ? (res.data.data as Record<string, unknown>)
      : res.data) as Record<string, unknown>;

  const normalized = normalizeSessionUser(root, username.trim());
  const resolvedUsername = normalized?.username || username.trim();
  const resolvedName = normalized?.name || '';
  const role = normalized?.role || 'staff';

  return {
    ok: true,
    user: {
      username: resolvedUsername,
      name: resolvedName,
      displayName: resolvedName || resolvedUsername,
      role,
    },
  };
}

export async function fetchUsersFromCloud(): Promise<{
  ok: boolean;
  users?: UserAccount[];
  error?: string;
}> {
  const res = await postGas<Record<string, unknown>>({ action: 'getUsers' });
  if (!res.ok || !res.data) {
    return { ok: false, error: res.error };
  }
  const rawList = Array.isArray(res.data.users)
    ? res.data.users
    : Array.isArray(res.data.data)
      ? res.data.data
      : [];

  const users = rawList
    .filter((u): u is Record<string, unknown> => Boolean(u && typeof u === 'object'))
    .map((u, idx) => normalizeUser(u, idx));

  return { ok: true, users };
}

export async function saveUserToCloud(user: UserAccount): Promise<GasResponse> {
  const cleanName = user.displayName?.trim() || user.username;
  return postGas({
    action: 'saveUser',
    user: { ...user, name: cleanName, displayName: cleanName },
    id: user.id,
    username: user.username,
    password: user.password,
    name: cleanName,
    displayName: cleanName,
    role: user.role,
  });
}

export async function deleteUserFromCloud(user: UserAccount): Promise<GasResponse> {
  return postGas({
    action: 'deleteUser',
    id: user.id,
    username: user.username,
  });
}

export interface SaveOrderPayload {
  receiptId: string;
  itemsSummary: string;
  netTotal: number;
  paymentMethod: string;
  receiptImage: string;
  cashierName: string;
}

export async function saveOrderToCloud(payload: SaveOrderPayload): Promise<GasResponse> {
  return postGas({
    action: 'saveOrder',
    receiptId: payload.receiptId,
    itemsSummary: payload.itemsSummary,
    netTotal: Number(payload.netTotal),
    paymentMethod: payload.paymentMethod,
    receiptImage: payload.receiptImage,
    cashierName: payload.cashierName,
  });
}
