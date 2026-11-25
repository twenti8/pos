import { useState, FormEvent } from 'react';
import { Eye, EyeOff, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { ShopSettings } from '../types';
import { ShopLogo } from './ShopLogo';

interface LoginScreenProps {
  settings: ShopSettings;
  isSyncingInit: boolean;
  onLogin: (username: string, password: string) => Promise<string | null>;
}

export function LoginScreen({ settings, isSyncingInit, onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    const errMsg = await onLogin(username.trim(), password);
    setIsSubmitting(false);

    if (errMsg) {
      setError(errMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--theme-bg)]">
      <main className="w-full max-w-md rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-sm p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-7">
          <ShopLogo
            logoBase64={settings.logoBase64}
            shopName={settings.shopName}
            sizeClass="w-24 h-24"
            className="mb-4 shadow-xs"
          />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--theme-ink)] text-balance">
            {settings.shopName}
          </h1>
          {settings.shopSubtitle && (
            <p className="text-sm text-[var(--theme-muted)] mt-1">{settings.shopSubtitle}</p>
          )}
          <p className="text-xs text-[var(--theme-muted)] mt-3">
            ระบบขายหน้าร้าน {isSyncingInit ? '· กำลังอัปเดตข้อมูลร้าน...' : '· เข้าสู่ระบบเพื่อเริ่มการขาย'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="login-username"
              className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5"
            >
              ชื่อผู้ใช้
            </label>
            <div className="relative">
              <User
                className="w-4 h-4 text-[var(--theme-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="เช่น admin"
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[var(--theme-ink)] placeholder:text-[var(--theme-muted)]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40 focus:border-[var(--theme-primary)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-semibold text-[var(--theme-ink)] mb-1.5"
            >
              รหัสผ่าน
            </label>
            <div className="relative">
              <Lock
                className="w-4 h-4 text-[var(--theme-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                className="w-full h-12 pl-10 pr-12 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-[var(--theme-ink)] placeholder:text-[var(--theme-muted)]/60 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40 focus:border-[var(--theme-primary)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-[var(--theme-muted)] hover:text-[var(--theme-ink)] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl bg-[#FFF5F5] border border-[#F5C2C7] px-3.5 py-2.5 text-sm text-[#842029]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C92A2A]" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl font-semibold text-sm bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>กำลังตรวจสอบสิทธิ์...</span>
              </>
            ) : (
              <span>เข้าสู่ระบบ</span>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
