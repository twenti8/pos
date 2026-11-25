import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { Download, Printer, X, Loader2, CheckCircle2 } from 'lucide-react';
import { OrderRecord, SessionUser, ShopSettings } from '../types';
import { DEFAULT_LOGO_PATH } from '../constants/themes';
import { formatBaht, formatThaiDateTime, resolveCashierName } from '../utils/posLogic';
import { generatePromptPayPayload } from '../utils/promptpay';

interface ReceiptModalProps {
  order: OrderRecord;
  settings: ShopSettings;
  currentUser?: SessionUser | null;
  autoUploadOnMount?: boolean;
  onClose: () => void;
  onReceiptImageReady?: (receiptId: string, base64Png: string) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export function ReceiptModal({
  order,
  settings,
  currentUser,
  autoUploadOnMount = false,
  onClose,
  onReceiptImageReady,
  onNotify,
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const uploadedRef = useRef<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isSavingPng, setIsSavingPng] = useState(false);
  const [isUploading, setIsUploading] = useState(autoUploadOnMount);
  const [logoSrc, setLogoSrc] = useState<string>(
    settings.logoBase64?.trim() ? settings.logoBase64 : DEFAULT_LOGO_PATH
  );
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoSrc(settings.logoBase64?.trim() ? settings.logoBase64 : DEFAULT_LOGO_PATH);
    setLogoFailed(false);
  }, [settings.logoBase64]);

  useEffect(() => {
    let cancelled = false;
    const payload = generatePromptPayPayload(
      settings.promptPayId || '0812345678',
      order.netTotal
    );

    QRCode.toDataURL(payload, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1F1A18',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [settings.promptPayId, order.netTotal]);

  const captureReceiptCanvas = async (): Promise<string> => {
    if (!receiptRef.current) return '';
    const canvas = await html2canvas(receiptRef.current, {
      scale: 2,
      backgroundColor: '#FFFFFF',
      useCORS: true,
      logging: false,
    });
    return canvas.toDataURL('image/png');
  };

  useEffect(() => {
    if (!autoUploadOnMount || !qrDataUrl || !onReceiptImageReady) return;
    if (uploadedRef.current === order.receiptId) return;
    uploadedRef.current = order.receiptId;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const pngDataUrl = await captureReceiptCanvas();
        if (!cancelled) {
          onReceiptImageReady(order.receiptId, pngDataUrl);
        }
      } catch {
        if (!cancelled) {
          onReceiptImageReady(order.receiptId, '');
        }
      } finally {
        if (!cancelled) {
          setIsUploading(false);
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [autoUploadOnMount, qrDataUrl, order.receiptId, onReceiptImageReady]);

  const handleDownloadPng = async () => {
    if (!receiptRef.current || isSavingPng) return;
    setIsSavingPng(true);
    try {
      const dataUrl = await captureReceiptCanvas();
      const link = document.createElement('a');
      link.download = `${order.receiptId}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onNotify('success', `บันทึกภาพใบเสร็จ ${order.receiptId}.png เรียบร้อยแล้ว`);
    } catch {
      onNotify('error', 'ไม่สามารถบันทึกภาพใบเสร็จเป็น PNG ได้');
    } finally {
      setIsSavingPng(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`ใบเสร็จรับเงิน ${order.receiptId}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="w-full max-w-[400px] my-auto flex flex-col gap-3">
        {/* Top Close Row */}
        <div className="flex items-center justify-between text-white px-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>กำลังบันทึกใบเสร็จขึ้นคลาวด์...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#8CE99A]" aria-hidden="true" />
                <span>ใบเสร็จพร้อมใช้งาน</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างใบเสร็จ"
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable & Capturable Thermal Receipt Card (pure hex colors for html2canvas safety) */}
        <div className="max-h-[78vh] overflow-y-auto rounded-3xl bg-[#FFFFFF] shadow-xl">
          <div
            id="printable-receipt"
            ref={receiptRef}
            className="font-receipt-mono bg-[#FFFFFF] text-[#231F1E] px-5 py-4 text-[12.5px] leading-snug"
          >
            {/* Shop Branding */}
            <div className="flex flex-col items-center text-center pb-2.5 border-b border-dashed border-[#D6CEC9]">
              <div className="w-16 h-16 rounded-2xl bg-[#FFFFFF] border border-[#F1F5F9] shadow-[0_1px_2px_rgba(15,23,42,0.06)] p-1.5 mx-auto flex items-center justify-center overflow-hidden mb-2">
                {!logoFailed ? (
                  <img
                    src={logoSrc}
                    alt={`โลโก้ร้าน ${settings.shopName}`}
                    referrerPolicy="no-referrer"
                    onError={() => setLogoFailed(true)}
                    className="w-full h-full object-cover object-center block rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-[#FDECE8] text-[#8E3744] flex items-center justify-center font-bold text-base">
                    {settings.shopName.slice(0, 2)}
                  </div>
                )}
              </div>
              <h2 className="text-base font-bold text-[#231F1E] leading-tight">
                {settings.shopName}
              </h2>
              {settings.shopSubtitle && (
                <p className="text-[11px] text-[#786D69] mt-0.5">{settings.shopSubtitle}</p>
              )}
            </div>

            {/* Receipt Metadata */}
            <div className="py-2 border-b border-dashed border-[#D6CEC9] space-y-0.5 text-[11.5px]">
              <div className="flex justify-between gap-2">
                <span className="text-[#786D69]">เลขที่ใบเสร็จ</span>
                <span
                  data-testid="receipt-id"
                  className="font-semibold text-[#231F1E]"
                >
                  {order.receiptId}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#786D69]">วันที่ / เวลา</span>
                <span className="text-[#231F1E]">
                  {formatThaiDateTime(order.createdAt)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#786D69]">พนักงานขาย</span>
                <span data-testid="receipt-cashier-name" className="text-[#231F1E]">
                  {order.cashierName?.trim() || resolveCashierName(currentUser, 'Staff')}
                </span>
              </div>
            </div>

            {/* Itemized List */}
            <div className="py-2 border-b border-dashed border-[#D6CEC9]">
              <div className="flex justify-between text-[11px] font-semibold text-[#786D69] pb-1">
                <span>รายการ</span>
                <span>จำนวนเงิน</span>
              </div>
              <div className="space-y-1.5">
                {order.items.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#231F1E] leading-snug">{item.name}</p>
                      <p className="text-[11px] text-[#786D69]">
                        {item.quantity} × {item.price > 0 ? formatBaht(item.price) : '-'}
                      </p>
                    </div>
                    <span className="font-semibold text-[#231F1E] shrink-0">
                      {item.subtotal > 0 ? formatBaht(item.subtotal) : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Total & Payment Details */}
            <div className="py-2.5 border-b border-dashed border-[#D6CEC9] space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-[14px] font-bold text-[#231F1E]">ยอดสุทธิ</span>
                <span
                  data-testid="receipt-net-total"
                  className="text-lg font-bold text-[#231F1E]"
                >
                  {formatBaht(order.netTotal)}
                </span>
              </div>

              <div className="space-y-0.5 text-[11.5px]">
                <div className="flex justify-between">
                  <span className="text-[#786D69]">ชำระโดย</span>
                  <span className="font-semibold text-[#231F1E]">
                    {order.paymentMethod === 'promptpay' ? 'PromptPay' : 'เงินสด'}
                  </span>
                </div>
                {order.paymentMethod === 'cash' && order.cashReceived !== undefined && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[#786D69]">รับเงิน</span>
                      <span className="text-[#231F1E]">
                        {formatBaht(order.cashReceived)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#786D69]">เงินทอน</span>
                      <span className="font-semibold text-[#231F1E]">
                        {formatBaht(order.changeAmount ?? 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Dynamic PromptPay QR Code (Shown on EVERY receipt regardless of payment method) */}
            <div
              data-testid="receipt-promptpay-section"
              className="pt-3 pb-0.5 flex flex-col items-center text-center"
            >
              <div className="p-2 rounded-2xl border border-[#EAE2DE] bg-[#FFFFFF]">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`คิวอาร์โค้ด PromptPay ยอด ${formatBaht(order.netTotal)}`}
                    className="w-32 h-32 block"
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center text-xs text-[#786D69]">
                    กำลังสร้างคิวอาร์...
                  </div>
                )}
              </div>
              <p className="mt-2 text-[13px] font-bold text-[#231F1E]">สแกนจ่าย PromptPay</p>
              <p className="text-[15px] font-bold text-[#231F1E]">
                {formatBaht(order.netTotal)}
              </p>
            </div>

            {settings.receiptFooterNote && (
              <p className="mt-2.5 pt-2 border-t border-dashed border-[#D6CEC9] text-center text-[11px] text-[#786D69]">
                {settings.receiptFooterNote}
              </p>
            )}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isSavingPng}
            className="h-12 rounded-2xl bg-[var(--theme-surface)] hover:bg-[var(--theme-soft)] text-[var(--theme-ink)] font-bold text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            {isSavingPng ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="w-4 h-4" aria-hidden="true" />
            )}
            <span>บันทึก PNG</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="h-12 rounded-2xl bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] text-[var(--theme-primary-text)] font-bold text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>พิมพ์ใบเสร็จ</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm transition-colors cursor-pointer"
        >
          ปิดหน้าต่าง / เริ่มบิลใหม่
        </button>
      </div>
    </div>
  );
}
