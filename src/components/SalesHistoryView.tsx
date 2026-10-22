import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, Copy, Trash2, ArrowLeft, BarChart3, Clock, Coins, ShoppingBag, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Transaction } from '../types/store';
import { formatRupiah, formatDateIndo, formatTime } from '../utils/format';

interface SalesHistoryViewProps {
  transactions: Transaction[];
  onClearHistory: () => void;
  storeName: string;
  onBackToCatalog?: () => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  transactions,
  onClearHistory,
  storeName,
  onBackToCatalog,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [expandedTxIds, setExpandedTxIds] = useState<string[]>([]);

  const toggleTxExpand = (id: string) => {
    setExpandedTxIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 1. Enforce 7-day limit: Transactions within the last 7 days only
  const now = new Date();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const valid7DaysTransactions = useMemo(() => {
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    return transactions.filter((t) => {
      const time = new Date(t.timestamp).getTime();
      return time >= cutoff && time <= Date.now() + 60000;
    });
  }, [transactions, SEVEN_DAYS_MS]);

  // 2. Prepare 7 daily buckets for the visual chart (from 6 days ago up to today)
  const last7DaysData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();

      // Find transactions on this specific date
      const dayTransactions = valid7DaysTransactions.filter(
        (t) => new Date(t.timestamp).toDateString() === dateStr
      );

      const dayRevenue = dayTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
      const dayProfit = dayTransactions.reduce((acc, t) => acc + t.totalProfit, 0);

      // Short day name in Indonesian
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const shortDayName = i === 0 ? 'Hari Ini' : i === 1 ? 'Kemarin' : dayNames[d.getDay()];
      const dayDateLabel = `${d.getDate()}/${d.getMonth() + 1}`;

      days.push({
        index: 6 - i,
        date: d,
        dateStr,
        dayName: shortDayName,
        dayDateLabel,
        revenue: dayRevenue,
        profit: dayProfit,
        transactionCount: dayTransactions.length,
        transactions: dayTransactions,
      });
    }
    return days;
  }, [valid7DaysTransactions]);

  // Max daily revenue to calculate chart bar percentages
  const maxRevenue = useMemo(() => {
    const max = Math.max(...last7DaysData.map((d) => d.revenue));
    return max > 0 ? max : 100000; // minimum baseline
  }, [last7DaysData]);

  // Total 7 days metrics
  const total7DayRevenue = useMemo(() => {
    return valid7DaysTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
  }, [valid7DaysTransactions]);

  const total7DayProfit = useMemo(() => {
    return valid7DaysTransactions.reduce((acc, t) => acc + t.totalProfit, 0);
  }, [valid7DaysTransactions]);

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
    const isTodayOnly = selectedDayIndex === 6;
    const title = isTodayOnly ? 'LAPORAN PENJUALAN HARI INI' : 'LAPORAN KAS & PENJUALAN 7 HARI';
    
    const lines = [
      `📊 *${title}*`,
      `🏪 Toko: ${storeName}`,
      `📅 Tanggal: ${formatDateIndo(new Date().toISOString())}`,
      `--------------------------------`,
      `💰 *Total Omzet Masuk:* ${formatRupiah(selectedDayIndex !== null ? last7DaysData[selectedDayIndex].revenue : total7DayRevenue)}`,
      `📈 *Estimasi Keuntungan:* ${formatRupiah(selectedDayIndex !== null ? last7DaysData[selectedDayIndex].profit : total7DayProfit)}`,
      `🧾 *Jumlah Transaksi:* ${displayedTransactions.length} transaksi`,
      `--------------------------------`,
      `*Rincian Penjualan Terakhir:*`,
      ...displayedTransactions.slice(0, 15).map((t, idx) => {
        const itemNames = t.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ');
        return `${idx + 1}. [${formatTime(t.timestamp)}] ${formatRupiah(t.totalAmount)} - ${itemNames}`;
      }),
    ];

    if (displayedTransactions.length > 15) {
      lines.push(`...dan ${displayedTransactions.length - 15} transaksi lainnya.`);
    }

    navigator.clipboard.writeText(lines.join('\n'));
    alert('Laporan 7 hari berhasil disalin! Siap ditempel ke WhatsApp.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-6">
      
      {/* Top Page Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xl shadow-sm shadow-emerald-950/20 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-normal">
                Penjualan
              </h2>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyReport}
              className="h-10 px-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Laporan WA</span>
            </button>
            {valid7DaysTransactions.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="w-full sm:w-auto h-10 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Kosongkan seluruh riwayat penjualan"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Riwayat</span>
              </button>
            )}
          </div>
        </div>

        {/* 7-Day Rule Notice Badge */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 font-medium leading-relaxed">
            <strong>Aturan 7 Hari:</strong> Riwayat transaksi otomatis disimpan dan ditampilkan untuk <strong>7 hari terakhir</strong>. Transaksi yang lebih lama dari 7 hari otomatis direset dari awal agar pencatatan warung tetap rapi dan ringan.
          </p>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Omzet 7 Hari */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Coins className="w-4 h-4 text-emerald-800" />
            <span>Omzet 7 Hari</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums leading-normal">
            {formatRupiah(total7DayRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium leading-normal">
            Total uang masuk kas
          </div>
        </div>

        {/* Total Keuntungan 7 Hari */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <span>Untung Bersih</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-800 tabular-nums leading-normal">
            +{formatRupiah(total7DayProfit)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium leading-normal">
            Selisih harga jual & modal
          </div>
        </div>

        {/* Total Transaksi 7 Hari */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <ShoppingBag className="w-4 h-4 text-indigo-700" />
            <span>Total Transaksi</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums leading-normal">
            {valid7DaysTransactions.length} <span className="text-xs font-normal text-slate-500">kali</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium leading-normal">
            Aktivitas kasir toko
          </div>
        </div>

        {/* Rata-Rata per Hari */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <BarChart3 className="w-4 h-4 text-amber-700" />
            <span>Rata-Rata / Hari</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums leading-normal">
            {formatRupiah(averageDailyRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium leading-normal">
            Estimasi harian
          </div>
        </div>
      </div>

      {/* 7-Day Visual Sales Chart */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-normal flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-800" />
              <span>Grafik Penjualan 7 Hari Terakhir</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Klik salah satu hari untuk melihat rincian transaksi hari tersebut
            </p>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-4">
          <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-48 sm:h-56 pb-2">
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
                    className={`text-[9px] sm:text-[10px] font-bold mb-1.5 transition-all truncate text-center ${
                      isSelected
                        ? 'text-emerald-900 scale-105 font-black'
                        : hasSales
                        ? 'text-slate-700'
                        : 'text-slate-300'
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
                  <div className="w-full max-w-[42px] sm:max-w-[50px] bg-slate-100 rounded-t-xl overflow-hidden flex items-end h-full">
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
                        isSelected ? 'text-emerald-900' : 'text-slate-800'
                      }`}
                    >
                      {d.dayName}
                    </span>
                    <span className="block text-[9px] sm:text-[10px] text-slate-400 font-medium">
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
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-normal">
              {selectedDayIndex !== null
                ? `Transaksi: ${last7DaysData[selectedDayIndex].dayName} (${displayedTransactions.length})`
                : `Semua Transaksi 7 Hari Terakhir (${displayedTransactions.length})`}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Daftar struk dan transaksi yang telah selesai di kasir
            </p>
          </div>
        </div>

        {displayedTransactions.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">
              Belum ada transaksi pada periode ini
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Setiap transaksi kasir di etalase toko akan otomatis dicatat dan ditampilkan di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedTransactions.map((t) => {
              const dateObj = new Date(t.timestamp);
              const isExpanded = expandedTxIds.includes(t.id);
              const totalItems = t.items.reduce((acc, i) => acc + i.quantity, 0);

              return (
                <div
                  key={t.id}
                  className={`border rounded-2xl transition-all overflow-hidden ${
                    isExpanded
                      ? 'bg-white border-emerald-300 shadow-sm'
                      : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/90'
                  }`}
                >
                  {/* ACCORDION HEADER (Hanya nampilin jam tanggal dan total transaksi) */}
                  <button
                    type="button"
                    onClick={() => toggleTxExpand(t.id)}
                    className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left cursor-pointer transition-colors"
                  >
                    {/* Kiri: Jam & Tanggal */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-200/70 text-slate-700 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums">
                          {formatTime(t.timestamp)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate">
                          {dateObj.toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Kanan: Total Transaksi & Icon Dropdown */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-sm sm:text-base font-black text-slate-900 tabular-nums">
                        {formatRupiah(t.totalAmount)}
                      </span>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${
                        isExpanded ? 'bg-emerald-100 text-emerald-800 rotate-180' : 'bg-slate-200/60 text-slate-500'
                      }`}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {/* ACCORDION BODY: List kebawah barang transaksi & Untungnya berapa */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 bg-white animate-in slide-in-from-top-1 duration-150">
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
                              <span className="font-bold text-slate-800">
                                {item.quantity}x {item.productName}
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                @ {formatRupiah(item.sellPrice)} / {item.unit}
                              </span>
                            </div>
                            <span className="font-bold text-slate-800 tabular-nums shrink-0">
                              {formatRupiah(item.sellPrice * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Detail Keuntungan & Pembayaran */}
                      <div className="pt-2 border-t border-slate-100 bg-emerald-50/70 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Coins className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="text-xs font-bold text-emerald-950">
                            Keuntungan Transaksi:
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-black text-emerald-800 tabular-nums">
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
