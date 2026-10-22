import React from 'react';
import { X, TrendingUp, Calendar, Copy, Trash2, CheckCircle2 } from 'lucide-react';
import { Transaction } from '../types/store';
import { formatRupiah, formatDateIndo, formatTime } from '../utils/format';

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onClearHistory: () => void;
  storeName: string;
}

export const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onClearHistory,
  storeName,
}) => {
  if (!isOpen) return null;

  // Filter today's transactions
  const todayStr = new Date().toDateString();
  const todayTransactions = transactions.filter(
    (t) => new Date(t.timestamp).toDateString() === todayStr
  );

  const todayRevenue = todayTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
  const todayProfit = todayTransactions.reduce((acc, t) => acc + t.totalProfit, 0);

  const handleCopyReport = () => {
    const lines = [
      `📊 *LAPORAN PENJUALAN HARIAN*`,
      `🏪 Toko: ${storeName}`,
      `📅 Tanggal: ${formatDateIndo(new Date().toISOString())}`,
      `--------------------------------`,
      `💰 *Total Uang Masuk:* ${formatRupiah(todayRevenue)}`,
      `📈 *Estimasi Keuntungan:* ${formatRupiah(todayProfit)}`,
      `🧾 *Jumlah Transaksi:* ${todayTransactions.length} kali`,
      `--------------------------------`,
      `*Rincian Transaksi:*`,
      ...todayTransactions.map((t, idx) => {
        const itemNames = t.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ');
        return `${idx + 1}. [${formatTime(t.timestamp)}] ${formatRupiah(t.totalAmount)} (${itemNames})`;
      }),
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    alert('Laporan berhasil disalin! Siap dikirim ke WhatsApp.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                Catatan Penjualan & Kas
              </h2>
              <p className="text-xs text-emerald-100">
                Ringkasan uang masuk hari ini · {storeName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4">
              <span className="text-xs font-bold text-emerald-800">Total Uang Hari Ini:</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tabular-nums">
                {formatRupiah(todayRevenue)}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Dari {todayTransactions.length} kali transaksi
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4">
              <span className="text-xs font-bold text-emerald-800">Estimasi Untung Bersih:</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-800 mt-1 tabular-nums">
                +{formatRupiah(todayProfit)}
              </div>
              <span className="text-[11px] text-emerald-600 mt-0.5 block">
                Selisih harga jual & modal
              </span>
            </div>
          </div>

          {/* Quick WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleCopyReport}
            className="w-full h-11 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Copy className="w-4 h-4 text-slate-600" />
            <span>Salin Ringkasan untuk WhatsApp</span>
          </button>

          {/* Transaction List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Daftar Transaksi ({todayTransactions.length})
              </h3>
              {transactions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('⚠️ KONFIRMASI HAPUS RIWAYAT\n\nApakah Anda yakin ingin menghapus seluruh catatan penjualan? Data omzet dan kas masuk akan direset.')) {
                      onClearHistory();
                    }
                  }}
                  className="text-[11px] text-slate-400 hover:text-rose-600 font-medium cursor-pointer"
                >
                  Hapus Riwayat
                </button>
              )}
            </div>

            {todayTransactions.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">
                  Belum ada transaksi hari ini
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Transaksi baru akan muncul di sini setelah dicatat di kasir
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 tabular-nums">
                          {formatTime(t.timestamp)}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.2 rounded">
                          Untung +{formatRupiah(t.totalProfit)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-1">
                        {t.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-slate-900 tabular-nums">
                        {formatRupiah(t.totalAmount)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {t.items.reduce((s, i) => s + i.quantity, 0)} barang
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
