import React, { useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Trash2,
  Clock,
  Receipt,
  Copy,
  BarChart3,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { Transaction } from '../types/store';
import { formatRupiah } from '../utils/format';

interface SalesHistoryViewProps {
  transactions: Transaction[];
  onClearHistory: () => void;
  storeName: string;
  onBackToCatalog: () => void;
}

const MONDAY_TO_SUNDAY = [
  { dayOfWeek: 1, dayLabel: 'Sen', fullDayName: 'Senin' },
  { dayOfWeek: 2, dayLabel: 'Sel', fullDayName: 'Selasa' },
  { dayOfWeek: 3, dayLabel: 'Rab', fullDayName: 'Rabu' },
  { dayOfWeek: 4, dayLabel: 'Kam', fullDayName: 'Kamis' },
  { dayOfWeek: 5, dayLabel: 'Jum', fullDayName: 'Jumat' },
  { dayOfWeek: 6, dayLabel: 'Sab', fullDayName: 'Sabtu' },
  { dayOfWeek: 0, dayLabel: 'Min', fullDayName: 'Minggu' },
];

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  transactions,
  onClearHistory,
  storeName,
  onBackToCatalog,
}) => {
  const todayStr = new Date().toDateString();

  // Filter today's transactions
  const todayTransactions = useMemo(
    () => transactions.filter((t) => new Date(t.timestamp).toDateString() === todayStr),
    [transactions, todayStr]
  );

  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const todayProfit = todayTransactions.reduce((sum, t) => sum + t.totalProfit, 0);

  const weekRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const weekProfit = transactions.reduce((sum, t) => sum + t.totalProfit, 0);

  // Build 7-day daily chart buckets ordered from Monday (Senin) to Sunday (Minggu) by default
  const dailyStats = useMemo(() => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 (Min) .. 6 (Sab)
    // Calculate Monday of the current week
    const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    return MONDAY_TO_SUNDAY.map((dayInfo, idx) => {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + idx);

      const dateLabel = `${targetDate.getDate()}/${targetDate.getMonth() + 1}`;
      const isToday = currentDayOfWeek === dayInfo.dayOfWeek;

      // Match transactions falling on this day of the week within the 7-day window
      const dayTxs = transactions.filter(
        (t) => new Date(t.timestamp).getDay() === dayInfo.dayOfWeek
      );
      const revenue = dayTxs.reduce((sum, t) => sum + t.totalAmount, 0);
      const profit = dayTxs.reduce((sum, t) => sum + t.totalProfit, 0);

      return {
        dateStr: targetDate.toDateString(),
        dayLabel: dayInfo.dayLabel,
        fullDayName: dayInfo.fullDayName,
        dateLabel,
        revenue,
        profit,
        count: dayTxs.length,
        isToday,
      };
    });
  }, [transactions]);

  const maxDailyRevenue = Math.max(...dailyStats.map((d) => d.revenue), 1);

  return (
    <div className="space-y-5 pb-6">
      {/* Page Title & Action Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 sm:hidden"
            title="Kembali ke Etalase"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-emerald-800 text-white hidden sm:flex items-center justify-center shadow-sm shadow-emerald-950/20 shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Laporan Kas & Penjualan
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Senin – Minggu (7 Hari)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Toko Aktif: <strong className="text-slate-700">{storeName}</strong> · Laporan mingguan mulai hari Senin s/d Minggu
            </p>
          </div>
        </div>

        {transactions.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Kosongkan Riwayat</span>
          </button>
        )}
      </div>

      {/* Summary Cards Grid (Hari Ini vs 7 Hari Terakhir) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Card 1: Hari Ini */}
        <div className="bg-linear-to-br from-emerald-800 to-emerald-950 text-white p-5 rounded-3xl shadow-sm shadow-emerald-950/15 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 bg-white/10 px-2.5 py-1 rounded-lg">
              Hari Ini ({todayTransactions.length} Transaksi)
            </span>
            <TrendingUp className="w-5 h-5 text-emerald-300" />
          </div>

          <div className="my-3">
            <div className="text-xs sm:text-sm text-emerald-100/80 font-medium">
              Uang Kas Masuk Hari Ini:
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums mt-0.5">
              {formatRupiah(todayRevenue)}
            </div>
          </div>

          <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-emerald-100 font-medium">Perkiraan Untung Bersih:</span>
            <span className="font-black text-amber-300 text-sm sm:text-base tabular-nums">
              +{formatRupiah(todayProfit)}
            </span>
          </div>
        </div>

        {/* Card 2: Total 7 Hari Terakhir (Senin - Minggu) */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              Minggu Ini · Senin – Minggu ({transactions.length} Nota)
            </span>
            <Calendar className="w-5 h-5 text-emerald-700" />
          </div>

          <div className="my-3">
            <div className="text-xs sm:text-sm text-slate-500 font-medium">
              Total Omzet 7 Hari (Sen – Min):
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5">
              {formatRupiah(weekRevenue)}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500 font-medium">Total Untung 7 Hari:</span>
            <span className="font-black text-emerald-700 text-sm sm:text-base tabular-nums">
              +{formatRupiah(weekProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* 7-Day Visual Bar Chart (Default: Senin s/d Minggu) */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-800" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              Grafik Omzet Mingguan (Senin – Minggu)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            Sen s/d Min
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-40 pt-6 pb-1 px-1">
          {dailyStats.map((day, idx) => {
            const heightPercent =
              day.revenue > 0 ? Math.max(14, Math.round((day.revenue / maxDailyRevenue) * 100)) : 6;
            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                {/* Amount label above bar */}
                <span
                  className={`text-[11px] sm:text-xs font-bold tabular-nums mb-1 truncate max-w-full ${
                    day.isToday ? 'text-emerald-800' : 'text-slate-500'
                  }`}
                >
                  {day.revenue > 0 ? `${Math.round(day.revenue / 1000)}rb` : '-'}
                </span>

                {/* Bar column */}
                <div className="w-full max-w-[40px] bg-slate-100 rounded-t-xl h-24 flex items-end p-0.5 overflow-hidden">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      day.isToday
                        ? 'bg-emerald-700'
                        : day.revenue > 0
                        ? 'bg-emerald-500/70 group-hover:bg-emerald-600'
                        : 'bg-slate-200'
                    }`}
                    title={`${day.fullDayName} (${day.dateLabel}): ${formatRupiah(day.revenue)} (${day.count} transaksi)`}
                  />
                </div>

                {/* Day label (Sen .. Min) */}
                <div className="mt-1.5 text-center">
                  <div
                    className={`text-xs font-bold leading-none ${
                      day.isToday ? 'text-emerald-800' : 'text-slate-700'
                    }`}
                  >
                    {day.dayLabel}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {day.dateLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-700 uppercase tracking-wider px-1">
          Daftar Nota Transaksi ({transactions.length} Transaksi)
        </h3>

        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-stone-200/90 p-6 shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8" />
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-700">
              Belum Ada Penjualan Minggu Ini
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs mx-auto">
              Transaksi dari kasir akan otomatis tercatat di sini untuk laporan Senin hingga Minggu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {transactions.map((tx) => {
              const dateObj = new Date(tx.timestamp);
              const isTxToday = dateObj.toDateString() === todayStr;
              const formattedTime = dateObj.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const formattedDate = isTxToday
                ? 'Hari Ini'
                : dateObj.toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  });

              return (
                <div
                  key={tx.id}
                  className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                            isTxToday
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {formattedDate}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formattedTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">
                          #{tx.id.slice(-6)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const itemsText = tx.items
                              .map(
                                (i) =>
                                  `- ${i.quantity}x ${i.productName}: ${formatRupiah(
                                    i.sellPrice * i.quantity
                                  )}`
                              )
                              .join('\n');
                            const receipt = `*NOTA PENJUALAN - ${storeName}*\nWaktu: ${formattedDate}, ${formattedTime}\n${itemsText}\n*Total: ${formatRupiah(
                              tx.totalAmount
                            )}*`;
                            navigator.clipboard.writeText(receipt);
                            alert('Salinan nota berhasil disalin ke clipboard!');
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Salin Nota ke WhatsApp"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Items Sold */}
                    <div className="space-y-1.5 pt-2.5">
                      {tx.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs sm:text-sm text-slate-700"
                        >
                          <span className="truncate max-w-[210px]">
                            <strong className="text-slate-900">{item.quantity}x</strong>{' '}
                            {item.productName}
                          </span>
                          <span className="tabular-nums font-medium text-slate-600">
                            {formatRupiah(item.sellPrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Total & Profit */}
                  <div className="pt-2.5 border-t border-dashed border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                      Untung +{formatRupiah(tx.totalProfit)}
                    </span>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 mr-1.5">Total:</span>
                      <span className="text-sm sm:text-base font-black text-slate-900 tabular-nums">
                        {formatRupiah(tx.totalAmount)}
                      </span>
                    </div>
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
