import {
  Store,
  BarChart3,
  Package,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';
import { ActiveTab, SessionUser, ShopSettings } from '../types';
import { ShopLogo } from './ShopLogo';

interface HeaderNavProps {
  settings: ShopSettings;
  user: SessionUser;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onLogout: () => void;
}

const ADMIN_TABS: Array<{ id: ActiveTab; label: string; icon: typeof Store }> = [
  { id: 'pos', label: 'หน้าร้าน', icon: Store },
  { id: 'sales', label: 'ยอดขาย', icon: BarChart3 },
  { id: 'products', label: 'สินค้า', icon: Package },
  { id: 'users', label: 'ผู้ใช้งาน', icon: Users },
  { id: 'settings', label: 'ตั้งค่า', icon: Settings },
];

const STAFF_TABS: Array<{ id: ActiveTab; label: string; icon: typeof Store }> = [
  { id: 'pos', label: 'หน้าร้าน', icon: Store },
];

export function HeaderNav({
  settings,
  user,
  activeTab,
  onSelectTab,
  onLogout,
}: HeaderNavProps) {
  const tabs = user.role === 'admin' ? ADMIN_TABS : STAFF_TABS;

  return (
    <>
      <header className="sticky top-0 z-30 h-14 md:h-16 bg-[var(--theme-surface)]/95 backdrop-blur-md border-b border-[var(--theme-border)]">
        <div className="max-w-[1440px] mx-auto h-full px-4 lg:px-6 flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Brand lockup (single-line) */}
          <button
            type="button"
            onClick={() => onSelectTab('pos')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] rounded-xl pr-1"
          >
            <ShopLogo
              logoBase64={settings.logoBase64}
              shopName={settings.shopName}
              sizeClass="w-9 h-9"
            />
            <span className="text-base md:text-lg font-bold tracking-tight text-[var(--theme-ink)] whitespace-nowrap">
              {settings.shopName}
            </span>
          </button>

          {/* Zone 2: Desktop & iPad navigation links (single-line) */}
          <nav
            aria-label="เมนูหลัก"
            className="hidden md:flex items-center gap-1 lg:gap-2 overflow-x-auto no-scrollbar"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative h-10 px-3.5 text-sm font-semibold whitespace-nowrap shrink-0 rounded-xl transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[var(--theme-accent-ink)] bg-[var(--theme-soft)]'
                      : 'text-[var(--theme-muted)] hover:text-[var(--theme-ink)] hover:bg-[var(--theme-bg)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single primary session action */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline text-xs font-medium text-[var(--theme-muted)] whitespace-nowrap max-w-[140px] truncate">
              {user.displayName} · {user.role === 'admin' ? 'แอดมิน' : 'พนักงาน'}
            </span>
            <button
              type="button"
              onClick={onLogout}
              aria-label="ออกจากระบบ"
              className="h-10 px-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-soft)] text-xs sm:text-sm font-semibold text-[var(--theme-ink)] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[var(--theme-muted)]" aria-hidden="true" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (Admin only; staff stays purely on POS) */}
      {user.role === 'admin' && (
        <nav
          aria-label="เมนูหลักมือถือ"
          className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--theme-surface)]/95 backdrop-blur-md border-t border-[var(--theme-border)] pb-safe"
        >
          <div className="grid grid-cols-5 h-14">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[var(--theme-primary)]'
                      : 'text-[var(--theme-muted)] hover:text-[var(--theme-ink)]'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span className="whitespace-nowrap leading-none">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
