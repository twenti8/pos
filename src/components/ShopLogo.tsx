import { useState, useEffect } from 'react';
import { DEFAULT_LOGO_PATH } from '../constants/themes';

interface ShopLogoProps {
  logoBase64?: string;
  shopName: string;
  sizeClass?: string;
  className?: string;
}

export function ShopLogo({
  logoBase64,
  shopName,
  sizeClass = 'w-10 h-10',
  className = '',
}: ShopLogoProps) {
  const activeSrc = logoBase64?.trim() ? logoBase64 : DEFAULT_LOGO_PATH;
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [activeSrc]);

  if (hasError) {
    return (
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-[var(--theme-border)] bg-[var(--theme-soft)] text-[var(--theme-accent-ink)] ${className}`}
        aria-label={`โลโก้ร้าน ${shopName}`}
      >
        <svg viewBox="0 0 48 48" className="w-3/4 h-3/4" fill="none" aria-hidden="true">
          <path
            d="M12 22h22v8a10 10 0 0 1-10 10h-2a10 10 0 0 1-10-10v-8Z"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="#FFFDF9"
          />
          <path
            d="M34 24h3a4 4 0 0 1 0 8h-3"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M16 22v-5l4 3h6l4-3v5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="20.5" cy="24.5" r="1.2" fill="currentColor" />
          <circle cx="25.5" cy="24.5" r="1.2" fill="currentColor" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden shrink-0 border border-[var(--theme-border)] bg-[#FFFDF9] ${className}`}
    >
      <img
        src={activeSrc}
        alt={`โลโก้ร้าน ${shopName}`}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover object-center block"
      />
    </div>
  );
}
