import React, { useState, useMemo, useRef } from 'react';
import {
  TrendingUp,
  Calendar,
  Copy,
  Trash2,
  BarChart3,
  Clock,
  Coins,
  ShoppingBag,
  ChevronDown,
  RotateCcw,
  Ban,
  HelpCircle,
  X,
  AlertCircle,
} from 'lucide-react';
import { Transaction } from '../types/store';
import { formatRupiah, formatDateIndo, formatTime } from '../utils/format';

interface SalesHistoryViewProps {
  transactions: Transaction[];
  onClearHistory: () => void;
  onCancelTransaction?: (transaction: Transaction) => void;
  storeName: string;
  onBackToCatalog?: () => void;
}

const getDynamicFontSize = (text: string): string => {
  const len = text.length;
  if (len > 16) return 'text-[11px] sm:text-sm';
  if (len > 13) return 'text-xs sm:text-base';
  if (len > 10) return 'text-sm sm:text-lg';
  return 'text-base sm:text-xl';
};

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  transactions,
  onClearHistory,
  onCancelTransaction,
  storeName,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [expandedTxIds, setExpandedTxIds] = useState<string[]>([]);
  const [swipedTxId, setSwipedTxId] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showLastDayWarningModal, setShowLastDayWarningModal] = useState(false);

  // Track horizontal swipe/slide gesture per card
  const dragStateRef = useRef<{
    txId: string | null;
    startX: number;
    startY: number;
    currentDeltaX: number;
    isHorizontalSwipe: boolean;
  }>({
    txId: null,
    startX: 0,
    startY: 0,
    currentDeltaX: 0,
    isHorizontalSwipe: false,
  });

  const toggleTxExpand = (id: string) => {
    setExpandedTxIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 1. Prepare 7 daily buckets for the visual chart (Monday to Sunday of the current real-time week)
  const last7DaysData = useMemo(() => {
    const now = new Date();
    // In JS getDay(): 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    // Distance back to Monday: Sunday = 6 days ago, Monday = 0 days ago, etc.
    const dayOfWeek = now.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toDateString();

      // Find all transactions on this date (for display list)
      const dayTransactions = transactions.filter(
        (t) => new Date(t.timestamp).toDateString() === dateStr
      );

      // Calculate revenue & profit only from non-cancelled transactions
      const activeDayTxs = dayTransactions.filter((t) => t.status !== 'cancelled');
      const dayRevenue = activeDayTxs.reduce((acc, t) => acc + t.totalAmount, 0);
      const dayProfit = activeDayTxs.reduce((acc, t) => acc + t.totalProfit, 0);

      const dayDateLabel = `${d.getDate()}/${d.getMonth() + 1}`;

      days.push({
        dayOfWeek: d.getDay(),
        date: d,
        dateStr,
        dayName: dayNames[i],
        dayDateLabel,
        revenue: dayRevenue,
        profit: dayProfit,
        transactionCount: activeDayTxs.length,
        transactions: dayTransactions,
        index: i,
        isToday: dateStr === now.toDateString(),
        isFuture: d.getTime() > now.getTime() && dateStr !== now.toDateString(),
      });
    }

    return days;
  }, [transactions]);

  // Check if today is the last day of the 7-day weekly period (Sunday)
  const isLastDayOfWeek = useMemo(() => {
    return last7DaysData[6]?.isToday || new Date().getDay() === 0;
  }, [last7DaysData]);

  const weeklyDateStrings = useMemo(() => {
    return new Set(last7DaysData.map((d) => d.dateStr));
  }, [last7DaysData]);

  // Transactions within the current week's 7 days
  const valid7DaysTransactions = useMemo(() => {
    return transactions.filter((t) =>
      weeklyDateStrings.has(new Date(t.timestamp).toDateString())
    );
  }, [transactions, weeklyDateStrings]);

  // Active (non-cancelled) transactions for revenue/profit metrics
  const active7DaysTransactions = useMemo(
    () => valid7DaysTransactions.filter((t) => t.status !== 'cancelled'),
    [valid7DaysTransactions]
  );

  // Max daily revenue to calculate chart bar percentages
  const maxRevenue = useMemo(() => {
    const max = Math.max(...last7DaysData.map((d) => d.revenue));
    return max > 0 ? max : 100000; // minimum baseline
  }, [last7DaysData]);

  // Total 7 days metrics (from non-cancelled transactions)
  const total7DayRevenue = useMemo(() => {
    return active7DaysTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
  }, [active7DaysTransactions]);

  const total7DayProfit = useMemo(() => {
    return active7DaysTransactions.reduce((acc, t) => acc + t.totalProfit, 0);
  }, [active7DaysTransactions]);

  const averageDailyRevenue = Math.round(total7DayRevenue / 7);

  // Active filtered transactions (either all 7 days or one selected day)
  const displayedTransactions = useMemo(() => {
    if (selectedDayIndex !== null && last7DaysData[selectedDayIndex]) {
      return last7DaysData[selectedDayIndex].transactions;
    }
    return valid7DaysTransactions;
  }, [selectedDayIndex, last7DaysData, valid7DaysTransactions]);

  // Copy WhatsApp summary report
  const handleCopyReport = () => {
    const isTodayOnly =
      selectedDayIndex !== null &&
      last7DaysData[selectedDayIndex]?.dateStr === new Date().toDateString();
    const title = isTodayOnly ? 'LAPORAN PENJUALAN HARI INI' : 'LAPORAN KAS & PENJUALAN 7 HARI';

    const activeDisplayedTxs = displayedTransactions.filter((t) => t.status !== 'cancelled');

    const lines = [
      `📊 *${title}*`,
      `🏪 Toko: ${storeName}`,
      `📅 Tanggal: ${formatDateIndo(new Date().toISOString())}`,
      `--------------------------------`,
      `💰 *Total Omzet Masuk:* ${formatRupiah(selectedDayIndex !== null ? last7DaysData[selectedDayIndex].revenue : total7DayRevenue)}`,
      `📈 *Estimasi Keuntungan:* ${formatRupiah(selectedDayIndex !== null ? last7DaysData[selectedDayIndex].profit : total7DayProfit)}`,
      `🧾 *Jumlah Transaksi:* ${activeDisplayedTxs.length} transaksi`,
      `--------------------------------`,
      `*Rincian 7 Hari Terakhir:*`,
      ...displayedTransactions.slice(0, 15).map((t, idx) => {
        const dObj = new Date(t.timestamp);
        const dateFormatted = dObj.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        const itemNames = t.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ');
        const cancelLabel = t.status === 'cancelled' ? ' (DIBATALKAN)' : '';
        return `${idx + 1}. [${dateFormatted}, ${formatTime(t.timestamp)}] ${formatRupiah(t.totalAmount)}${cancelLabel} - ${itemNames}`;
      }),
    ];

    if (displayedTransactions.length > 15) {
      lines.push(`...dan ${displayedTransactions.length - 15} transaksi lainnya.`);
    }

    navigator.clipboard.writeText(lines.join('\n'));
    alert('Laporan 7 hari berhasil disalin! Siap ditempel ke WhatsApp.');
  };

  // Swipe/Slide handlers for revealing "Batalkan Transaksi" button on the right
  const handlePointerStart = (txId: string, isCancelled: boolean, clientX: number, clientY: number) => {
    if (isCancelled) return;
    dragStateRef.current = {
      txId,
      startX: clientX,
      startY: clientY,
      currentDeltaX: 0,
      isHorizontalSwipe: false,
    };
  };

  const handlePointerMove = (txId: string, isCancelled: boolean, clientX: number, clientY: number) => {
    if (isCancelled || dragStateRef.current.txId !== txId) return;
    const dx = clientX - dragStateRef.current.startX;
    const dy = clientY - dragStateRef.current.startY;

    if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      dragStateRef.current.isHorizontalSwipe = true;
      dragStateRef.current.currentDeltaX = dx;
      if (dx < -35) {
        setSwipedTxId(txId);
      } else if (dx > 35 && swipedTxId === txId) {
        setSwipedTxId(null);
      }
    }
  };

  const handlePointerEnd = () => {
    setTimeout(() => {
      dragStateRef.current.isHorizontalSwipe = false;
      dragStateRef.current.txId = null;
    }, 30);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-2.5 sm:space-y-4 pb-4">
      {/* Top Page Header Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-stone-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xl shadow-sm shadow-emerald-950/20 shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 leading-normal">
                Penjualan
              </h2>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Icon Peringatan Hari Terakhir Periode 7 Hari */}
              {isLastDayOfWeek && (
                <button
                  type="button"
                  onClick={() => setShowLastDayWarningModal(true)}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white flex items-center justify-center cursor-pointer shadow-md transition-all shrink-0 animate-bounce"
                  title="Peringatan Hari Terakhir Minggu Ini"
                  aria-label="Peringatan Hari Terakhir Periode 7 Hari"
                >
                  <span className="absolute -inset-1 rounded-full bg-amber-400 opacity-75 animate-ping pointer-events-none" />
                  <AlertCircle className="w-5 h-5 relative z-10 stroke-[2.5]" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-bold border border-sky-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs shrink-0"
                title="Buka petunjuk aturan 7 hari"
              >
                <HelpCircle className="w-3.5 h-3.5 text-sky-700" />
                <span>Petunjuk</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyReport}
              className="h-9 sm:h-10 px-3 sm:px-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Laporan WA</span>
            </button>
            {valid7DaysTransactions.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="w-full sm:w-auto h-9 sm:h-10 px-3 sm:px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Kosongkan seluruh riwayat penjualan"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Riwayat</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Popup Peringatan Hari Terakhir Periode 7 Hari */}
      {showLastDayWarningModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowLastDayWarningModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-amber-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 leading-tight">
                  Peringatan Hari Terakhir
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLastDayWarningModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
                Ini adalah hari terakhir pada minggu ini, jangan lupa untuk melakukan pembukuan laporan penjualan mingguan dengan cara <strong>Salin Laporan WA</strong>, dan tempel/paste ke pesan WA anda.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleCopyReport();
                  setShowLastDayWarningModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Laporan WA</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLastDayWarningModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Petunjuk Aturan 7 Hari */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-4 sm:p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Petunjuk Aturan 7 Hari
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-sky-50/90 border border-sky-200/90 rounded-2xl p-3.5 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-sky-950 font-medium leading-relaxed">
                <strong>Aturan 7 Hari:</strong> Riwayat transaksi otomatis disimpan dan ditampilkan untuk <strong>7 hari terakhir</strong>. Transaksi yang lebih lama dari 7 hari otomatis direset dari awal agar pencatatan warung tetap rapi dan ringan. Jangan lupa menyalin laporan WA pada hari terakhir kemudian tempel/paste ke pesan WA anda, agar riwayat transaksi tetap tercatat.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors shadow-sm"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* 4 Metric Summary Cards (Hanya Judul & Angka) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {/* Total Omzet 7 Hari */}
        <div className="bg-white rounded-2xl p-2.5 sm:p-4 border border-stone-200/90 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-800 shrink-0" />
            <span className="truncate">Omzet 7 Hari</span>
          </div>
          <div className={`${getDynamicFontSize(formatRupiah(total7DayRevenue))} font-black text-slate-900 tabular-nums leading-snug truncate`}>
            {formatRupiah(total7DayRevenue)}
          </div>
        </div>

        {/* Total Keuntungan 7 Hari */}
        <div className="bg-white rounded-2xl p-2.5 sm:p-4 border border-stone-200/90 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 shrink-0" />
            <span className="truncate">Untung Bersih</span>
          </div>
          <div className={`${getDynamicFontSize(`+${formatRupiah(total7DayProfit)}`)} font-black text-emerald-800 tabular-nums leading-snug truncate`}>
            +{formatRupiah(total7DayProfit)}
          </div>
        </div>

        {/* Total Transaksi 7 Hari */}
        <div className="bg-white rounded-2xl p-2.5 sm:p-4 border border-stone-200/90 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-700 shrink-0" />
            <span className="truncate">Total Transaksi</span>
          </div>
          <div className={`${getDynamicFontSize(`${active7DaysTransactions.length} kali`)} font-black text-slate-900 tabular-nums leading-snug truncate`}>
            {active7DaysTransactions.length} <span className="text-xs font-normal text-slate-500">kali</span>
          </div>
        </div>

        {/* Rata-Rata per Hari */}
        <div className="bg-white rounded-2xl p-2.5 sm:p-4 border border-stone-200/90 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 shrink-0" />
            <span className="truncate">Rata-Rata / Hari</span>
          </div>
          <div className={`${getDynamicFontSize(formatRupiah(averageDailyRevenue))} font-black text-slate-900 tabular-nums leading-snug truncate`}>
            {formatRupiah(averageDailyRevenue)}
          </div>
        </div>
      </div>

      {/* 7-Day Visual Sales Chart */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-stone-200/90 shadow-sm space-y-2.5 sm:space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2 sm:pb-3">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-normal flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-800" />
            <span>Grafik Penjualan 7 Hari Terakhir</span>
          </h3>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-1">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3 items-end h-44 sm:h-56 pt-3 pb-1">
            {last7DaysData.map((d, idx) => {
              const isSelected = selectedDayIndex === idx;
              const heightPercent = maxRevenue > 0 ? Math.max(12, Math.round((d.revenue / maxRevenue) * 100)) : 12;
              const hasSales = d.revenue > 0;

              return (
                <div
                  key={d.dateStr}
                  onClick={() => setSelectedDayIndex(isSelected ? null : idx)}
                  className="flex flex-col items-center h-full justify-end group cursor-pointer"
                  title={`${d.dayName} (${d.dayDateLabel}): ${formatRupiah(d.revenue)}`}
                >
                  {/* Tooltip / Value on top of bar */}
                  <div
                    className={`text-[10px] sm:text-[11px] font-bold leading-relaxed py-0.5 mb-1 transition-all truncate text-center shrink-0 ${
                      isSelected
                        ? 'text-emerald-900 scale-105 font-black'
                        : hasSales
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {hasSales ? (
                      d.revenue >= 1000000
                        ? `${(d.revenue / 1000000).toFixed(1)}jt`
                        : `${Math.round(d.revenue / 1000)}rb`
                    ) : (
                      '0'
                    )}
                  </div>

                  {/* Vertical Bar */}
                  <div
                    className={`w-full max-w-[42px] sm:max-w-[50px] bg-slate-100 rounded-t-xl overflow-hidden flex items-end flex-1 transition-all ${
                      d.isToday ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs' : ''
                    }`}
                  >
                    <div
                      style={{ height: `${hasSales ? heightPercent : 6}%` }}
                      className={`w-full rounded-t-xl transition-all duration-300 ${
                        isSelected
                          ? 'bg-emerald-700 ring-2 ring-emerald-900 shadow-md scale-y-[1.02]'
                          : hasSales
                          ? 'bg-linear-to-t from-emerald-800 to-emerald-600 group-hover:from-emerald-700 group-hover:to-emerald-500'
                          : 'bg-slate-200/80'
                      }`}
                    />
                  </div>

                  {/* Day Label Below */}
                  <div className="mt-2 text-center">
                    <span
                      className={`block text-[11px] sm:text-xs font-bold leading-tight ${
                        d.isToday
                          ? 'text-emerald-600 font-extrabold'
                          : isSelected
                          ? 'text-emerald-900'
                          : 'text-slate-800'
                      }`}
                    >
                      {d.dayName}
                    </span>
                    <span
                      className={`block text-[9px] sm:text-[10px] ${
                        d.isToday
                          ? 'text-emerald-600 font-semibold'
                          : 'text-slate-400 font-medium'
                      }`}
                    >
                      {d.dayDateLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Summary Pill */}
        {selectedDayIndex !== null && (
          <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Hari Terpilih: {last7DaysData[selectedDayIndex].dayName} ({last7DaysData[selectedDayIndex].dayDateLabel})
              </span>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                Omzet: {formatRupiah(last7DaysData[selectedDayIndex].revenue)} · Untung: +{formatRupiah(last7DaysData[selectedDayIndex].profit)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDayIndex(null)}
              className="text-xs bg-white text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-stone-200/90 shadow-sm space-y-2.5 sm:space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2 sm:pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-normal">
              {selectedDayIndex !== null
                ? `Transaksi: ${last7DaysData[selectedDayIndex].dayName} (${displayedTransactions.length})`
                : `Semua Transaksi 7 Hari Terakhir (${displayedTransactions.length})`}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Geser kartu ke kiri untuk membatalkan transaksi
            </p>
          </div>
        </div>

        {displayedTransactions.length === 0 ? (
          <div className="text-center py-8 sm:py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Calendar className="w-9 h-9 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">
              Belum ada transaksi pada periode ini
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Setiap transaksi kasir di etalase toko akan otomatis dicatat dan ditampilkan di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedTransactions.map((t) => {
              const dateObj = new Date(t.timestamp);
              const isExpanded = expandedTxIds.includes(t.id);
              const isCancelled = t.status === 'cancelled';
              const isSwiped = !isCancelled && swipedTxId === t.id;
              const totalItems = t.items.reduce((acc, i) => acc + i.quantity, 0);

              return (
                <div
                  key={t.id}
                  className="relative rounded-2xl overflow-hidden select-none"
                >
                  {/* Right-Side Action Button (Revealed when card is slid to the left) */}
                  {!isCancelled && (
                    <div className="absolute inset-y-0 right-0 w-[148px] bg-rose-600 flex items-center justify-end rounded-2xl">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSwipedTxId(null);
                          onCancelTransaction?.(t);
                        }}
                        className="w-full h-full px-3 flex flex-col items-center justify-center gap-1 text-white font-bold text-[11px] hover:bg-rose-700 active:bg-rose-800 transition-colors cursor-pointer text-center leading-tight"
                      >
                        <RotateCcw className="w-4 h-4 shrink-0" />
                        <span>Batalkan Transaksi</span>
                      </button>
                    </div>
                  )}

                  {/* Foreground Sliding Transaction Card */}
                  <div
                    onTouchStart={(e) => {
                      const touch = e.touches[0];
                      handlePointerStart(t.id, isCancelled, touch.clientX, touch.clientY);
                    }}
                    onTouchMove={(e) => {
                      const touch = e.touches[0];
                      handlePointerMove(t.id, isCancelled, touch.clientX, touch.clientY);
                    }}
                    onTouchEnd={handlePointerEnd}
                    onMouseDown={(e) => handlePointerStart(t.id, isCancelled, e.clientX, e.clientY)}
                    onMouseMove={(e) => {
                      if (e.buttons === 1) {
                        handlePointerMove(t.id, isCancelled, e.clientX, e.clientY);
                      }
                    }}
                    onMouseUp={handlePointerEnd}
                    style={{
                      transform: isSwiped ? 'translateX(-148px)' : 'translateX(0px)',
                    }}
                    className={`relative z-10 border rounded-2xl transition-all duration-200 overflow-hidden ${
                      isCancelled
                        ? 'bg-slate-100 border-slate-200/90 opacity-75'
                        : isExpanded
                        ? 'bg-white border-emerald-300 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200/90'
                    }`}
                  >
                    {/* ACCORDION HEADER */}
                    <button
                      type="button"
                      onClick={() => {
                        if (dragStateRef.current.isHorizontalSwipe) return;
                        if (isSwiped) {
                          setSwipedTxId(null);
                          return;
                        }
                        toggleTxExpand(t.id);
                      }}
                      className="w-full p-2.5 sm:p-3.5 flex items-center justify-between gap-2.5 text-left cursor-pointer transition-colors"
                    >
                      {/* Kiri: Jam & Tanggal (Tanpa Nama Hari) */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isCancelled
                              ? 'bg-slate-200 text-slate-400'
                              : 'bg-slate-200/70 text-slate-700'
                          }`}
                        >
                          {isCancelled ? (
                            <Ban className="w-4 h-4 text-slate-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`text-xs sm:text-sm font-bold tabular-nums leading-snug ${
                              isCancelled ? 'text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            {formatTime(t.timestamp)}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium truncate leading-snug">
                            {dateObj.toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Kanan: Chip "Dibatalkan" di Kanan Atas (bila batal) + Total Transaksi & Icon Dropdown */}
                      <div className="flex flex-col items-end justify-center gap-1 shrink-0">
                        {isCancelled && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300 leading-none">
                            Dibatalkan
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm sm:text-base font-black tabular-nums ${
                              isCancelled
                                ? 'text-slate-400 line-through'
                                : 'text-slate-900'
                            }`}
                          >
                            {formatRupiah(t.totalAmount)}
                          </span>
                          <div
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-transform ${
                              isExpanded
                                ? isCancelled
                                  ? 'bg-slate-200 text-slate-700 rotate-180'
                                  : 'bg-emerald-100 text-emerald-800 rotate-180'
                                : 'bg-slate-200/60 text-slate-500'
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* ACCORDION BODY: List kebawah barang transaksi & Untungnya berapa */}
                    {isExpanded && (
                      <div
                        className={`px-3 pb-3 pt-1 sm:px-4 sm:pb-4 border-t border-slate-100 space-y-2.5 animate-in slide-in-from-top-1 duration-150 ${
                          isCancelled ? 'bg-slate-50/90 text-slate-500' : 'bg-white'
                        }`}
                      >
                        {isCancelled && (
                          <div className="mt-2 p-2.5 rounded-xl bg-slate-200/70 border border-slate-300/80 text-[11px] font-semibold text-slate-600 flex items-center gap-2">
                            <RotateCcw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>
                              Transaksi ini telah dibatalkan dan stok barang telah dikembalikan ke etalase.
                            </span>
                          </div>
                        )}

                        {/* List Barang yang Dibeli */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100">
                            <span>Daftar Barang ({totalItems} item)</span>
                            <span>Subtotal</span>
                          </div>

                          {t.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 text-xs py-1 border-b border-slate-50 last:border-0"
                            >
                              <div className="min-w-0">
                                <span
                                  className={`font-bold ${
                                    isCancelled ? 'text-slate-500 line-through' : 'text-slate-800'
                                  }`}
                                >
                                  {item.quantity}x {item.productName}
                                </span>
                                <span className="text-[11px] text-slate-400 block">
                                  @ {formatRupiah(item.sellPrice)} / {item.unit}
                                </span>
                              </div>
                              <span
                                className={`font-bold tabular-nums shrink-0 ${
                                  isCancelled ? 'text-slate-400 line-through' : 'text-slate-800'
                                }`}
                              >
                                {formatRupiah(item.sellPrice * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Detail Keuntungan & Pembayaran */}
                        <div
                          className={`pt-2 border-t border-slate-100 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            isCancelled ? 'bg-slate-200/50' : 'bg-emerald-50/70'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Coins
                              className={`w-4 h-4 shrink-0 ${
                                isCancelled ? 'text-slate-400' : 'text-emerald-700'
                              }`}
                            />
                            <span
                              className={`text-xs font-bold ${
                                isCancelled ? 'text-slate-500' : 'text-emerald-950'
                              }`}
                            >
                              Keuntungan Transaksi:
                            </span>
                          </div>
                          <span
                            className={`text-xs sm:text-sm font-black tabular-nums ${
                              isCancelled
                                ? 'text-slate-400 line-through'
                                : 'text-emerald-800'
                            }`}
                          >
                            +{formatRupiah(t.totalProfit)}
                          </span>
                        </div>

                        {/* Info Bayar Tunai & Kembalian jika ada */}
                        {t.cashPaid > 0 && (
                          <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                            <span>Tunai Diterima: {formatRupiah(t.cashPaid)}</span>
                            <span>Kembalian: {formatRupiah(t.change)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
