import { useMemo, useState } from 'react';
import { Search, Receipt, Banknote, QrCode, Calendar, RefreshCw } from 'lucide-react';
import { OrderRecord } from '../types';
import { formatBaht, formatThaiDateTime } from '../utils/posLogic';

interface SalesSummaryViewProps {
  orders: OrderRecord[];
  onViewReceipt: (order: OrderRecord) => void;
  onRefreshFromCloud: () => Promise<void>;
}

export function SalesSummaryView({
  orders,
  onViewReceipt,
  onRefreshFromCloud,
}: SalesSummaryViewProps) {
  const [range, setRange] = useState<'today' | 'all'>('today');
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isToday = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return true;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (range === 'today' && !isToday(o.createdAt)) return false;
      if (
        q &&
        !o.receiptId.toLowerCase().includes(q) &&
        !o.itemsSummary.toLowerCase().includes(q) &&
        !o.cashierName.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [orders, range, search]);

  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let cashTotal = 0;
    let promptPayTotal = 0;
    for (const o of filteredOrders) {
      totalRevenue += Number(o.netTotal) || 0;
      if (o.paymentMethod === 'promptpay') {
        promptPayTotal += Number(o.netTotal) || 0;
      } else {
        cashTotal += Number(o.netTotal) || 0;
      }
    }
    return {
      totalRevenue,
      orderCount: filteredOrders.length,
      cashTotal,
      promptPayTotal,
    };
  }, [filteredOrders]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshFromCloud();
    setIsRefreshing(false);
  };

  return (
    <main className="max-w-[1440px] mx-auto px-4 lg:px-6 py-6 pb-24 md:pb-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--theme-ink)]">สรุปยอดขาย</h1>
          <p className="text-sm text-[var(--theme-muted)] mt-0.5">
            ติดตามยอดขายและเรียกดูใบเสร็จย้อนหลังได้ทันที
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            role="group"
            aria-label="ช่วงเวลาสรุปยอด"
            className="inline-flex p-1 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)]"
          >
            <button
              type="button"
              onClick={() => setRange('today')}
              className={`h-9 px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                range === 'today'
                  ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)]'
                  : 'text-[var(--theme-muted)] hover:text-[var(--theme-ink)]'
              }`}
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => setRange('all')}
              className={`h-9 px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                range === 'all'
                  ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-text)]'
                  : 'text-[var(--theme-muted)] hover:text-[var(--theme-ink)]'
              }`}
            >
              ทั้งหมด
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-11 px-4 rounded-xl bg-[var(--theme-surface)] border border-[var(--theme-border)] hover:bg-[var(--theme-soft)] text-sm font-semibold text-[var(--theme-ink)] inline-flex items-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>อัปเดตข้อมูล</span>
          </button>
        </div>
      </div>

      {/* 4-Column KPI Row */}
      <section aria-label="ตัวเลขยอดขาย" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-4 sm:p-5">
          <p className="text-xs font-semibold text-[var(--theme-muted)]">ยอดขายรวม</p>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-[var(--theme-accent-ink)] mt-2">
            {formatBaht(metrics.totalRevenue)}
          </p>
          <p className="text-xs text-[var(--theme-muted)] mt-1">
            {range === 'today' ? 'ประจำวันนี้' : 'ทั้งหมดในระบบ'}
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-4 sm:p-5">
          <p className="text-xs font-semibold text-[var(--theme-muted)]">จำนวนบิล</p>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-[var(--theme-ink)] mt-2">
            {metrics.orderCount.toLocaleString('en-US')}
          </p>
          <p className="text-xs text-[var(--theme-muted)] mt-1">รายการใบเสร็จ</p>
        </div>

        <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-4 sm:p-5">
          <p className="text-xs font-semibold text-[var(--theme-muted)] inline-flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5" aria-hidden="true" />
            <span>รับเงินสด</span>
          </p>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-[var(--theme-ink)] mt-2">
            {formatBaht(metrics.cashTotal)}
          </p>
          <p className="text-xs text-[var(--theme-muted)] mt-1">ยอดชำระด้วยเงินสด</p>
        </div>

        <div className="rounded-2xl bg-[var(--theme-surface)] border border-[var(--theme-border)] p-4 sm:p-5">
          <p className="text-xs font-semibold text-[var(--theme-muted)] inline-flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
            <span>PromptPay</span>
          </p>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-[var(--theme-ink)] mt-2">
            {formatBaht(metrics.promptPayTotal)}
          </p>
          <p className="text-xs text-[var(--theme-muted)] mt-1">ยอดโอนผ่านคิวอาร์โค้ด</p>
        </div>
      </section>

      {/* Order History Section */}
      <section className="rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[var(--theme-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-[var(--theme-ink)]">ประวัติใบเสร็จ</h2>
          <div className="relative w-full sm:w-72">
            <Search
              className="w-4 h-4 text-[var(--theme-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="ค้นหาใบเสร็จ"
              placeholder="ค้นหาเลขบิล, เมนู, พนักงาน..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--theme-bg)] border border-[var(--theme-border)] text-sm text-[var(--theme-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/40"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <Calendar className="w-10 h-10 mx-auto text-[var(--theme-muted)] mb-3" aria-hidden="true" />
            <p className="text-base font-semibold text-[var(--theme-ink)]">ยังไม่มีรายการขาย</p>
            <p className="text-sm text-[var(--theme-muted)] mt-1">
              เมื่อมีการชำระเงินที่หน้าหน้าร้าน บิลจะถูกบันทึกและแสดงที่นี่ทันที
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--theme-border)] text-xs font-semibold text-[var(--theme-muted)] bg-[var(--theme-bg)]/60">
                  <th className="py-3 px-5 whitespace-nowrap">เลขที่ใบเสร็จ</th>
                  <th className="py-3 px-4 whitespace-nowrap">วันเวลา</th>
                  <th className="py-3 px-4">รายการ</th>
                  <th className="py-3 px-4 whitespace-nowrap">ช่องทาง</th>
                  <th className="py-3 px-4 whitespace-nowrap">พนักงาน</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">ยอดสุทธิ</th>
                  <th className="py-3 px-5 text-right whitespace-nowrap">ใบเสร็จ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--theme-border)]/70 text-sm">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.receiptId}
                    className="hover:bg-[var(--theme-bg)]/50 transition-colors"
                  >
                    <td className="py-3.5 px-5 tabular-nums text-xs font-semibold text-[var(--theme-ink)] whitespace-nowrap">
                      {order.receiptId}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[var(--theme-muted)] whitespace-nowrap tabular-nums">
                      {formatThaiDateTime(order.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--theme-ink)] max-w-xs truncate">
                      {order.itemsSummary || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-[var(--theme-muted)] whitespace-nowrap">
                      {order.paymentMethod === 'promptpay' ? 'PromptPay' : 'เงินสด'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[var(--theme-muted)] whitespace-nowrap">
                      {order.cashierName}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold tabular-nums text-[var(--theme-ink)] whitespace-nowrap">
                      {formatBaht(order.netTotal)}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(order)}
                        aria-label={`ดูใบเสร็จ ${order.receiptId}`}
                        className="h-9 px-3 rounded-xl bg-[var(--theme-soft)] hover:bg-[var(--theme-soft-hover)] text-[var(--theme-accent-ink)] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>ดูบิล</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
