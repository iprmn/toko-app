import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, CheckCircle2, RotateCcw, Copy, Share2 } from 'lucide-react';
import { CartItem, Product } from '../types/store';
import { formatRupiah, formatNumber } from '../utils/format';
import { PRESET_ICONS } from '../data/initialProducts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onCompleteSale: (cashPaid: number, change: number) => void;
  storeName: string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onCompleteSale,
  storeName,
}) => {
  const [cashInput, setCashInput] = useState<string>('');
  const [lastReceipt, setLastReceipt] = useState<{
    id: string;
    items: CartItem[];
    total: number;
    cashPaid: number;
    change: number;
    time: string;
  } | null>(null);

  const totalAmount = cart.reduce((sum, item) => sum + item.product.sellPrice * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cashPaid = parseFloat(cashInput.replace(/\D/g, '')) || 0;
  const change = Math.max(0, cashPaid - totalAmount);
  const isCashSufficient = cashPaid >= totalAmount;

  // Reset receipt when reopening cart or cart becomes non-empty
  useEffect(() => {
    if (cart.length > 0) {
      setLastReceipt(null);
    }
  }, [cart]);

  if (!isOpen) return null;

  const handleQuickCash = (amount: number) => {
    setCashInput(amount.toString());
  };

  const handleFinishTransaction = () => {
    if (cart.length === 0) return;
    const effectiveCash = cashPaid > 0 ? cashPaid : totalAmount;
    const finalChange = Math.max(0, effectiveCash - totalAmount);

    // Save temporary receipt for the success screen
    setLastReceipt({
      id: 'TRX-' + Date.now().toString().slice(-6),
      items: [...cart],
      total: totalAmount,
      cashPaid: effectiveCash,
      change: finalChange,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });

    onCompleteSale(effectiveCash, finalChange);
    setCashInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Container */}
      <div className="relative z-10 w-full sm:max-w-xl max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                Keranjang Kasir
              </h2>
              <p className="text-xs text-emerald-100">
                {totalItemsCount} barang dipilih · {storeName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('⚠️ KONFIRMASI KOSONGKAN\n\nApakah Anda yakin ingin mengosongkan seluruh keranjang kasir?')) {
                    onClearCart();
                  }
                }}
                className="text-xs text-emerald-100 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="Kosongkan keranjang"
              >
                Kosongkan
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Tutup kasir"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Either Receipt Success OR Cart Items */}
        {lastReceipt ? (
          /* Struk / Berhasil Selesai */
          <div className="p-6 overflow-y-auto flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Penjualan Berhasil Dicatat!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Stok barang otomatis berkurang dan uang masuk ke pembukuan.
            </p>

            {/* Receipt Card */}
            <div className="w-full mt-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left font-mono text-xs">
              <div className="text-center font-bold pb-2 border-b border-dashed border-slate-300">
                {storeName.toUpperCase()}
                <div className="text-[10px] font-normal text-slate-500">
                  {lastReceipt.id} · {lastReceipt.time}
                </div>
              </div>

              <div className="py-3 space-y-2 max-h-40 overflow-y-auto">
                {lastReceipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700">
                    <span className="truncate max-w-[180px]">
                      {it.quantity}x {it.product.name}
                    </span>
                    <span className="tabular-nums font-semibold">
                      {formatRupiah(it.product.sellPrice * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1">
                <div className="flex justify-between font-bold text-sm text-slate-900">
                  <span>TOTAL</span>
                  <span>{formatRupiah(lastReceipt.total)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Uang Diterima</span>
                  <span>{formatRupiah(lastReceipt.cashPaid)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800 bg-emerald-100/70 px-2 py-1 rounded">
                  <span>KEMBALIAN</span>
                  <span>{formatRupiah(lastReceipt.change)}</span>
                </div>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="w-full mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const text = `*STRUK BELANJA - ${storeName}*\nTotal: ${formatRupiah(lastReceipt.total)}\nBayar: ${formatRupiah(lastReceipt.cashPaid)}\nKembalian: ${formatRupiah(lastReceipt.change)}\nTerima kasih telah berbelanja!`;
                  navigator.clipboard.writeText(text);
                  alert('Struk berhasil disalin! Bisa langsung dipaste ke WhatsApp.');
                }}
                className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Salin Struk (WA)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLastReceipt(null);
                  onClose();
                }}
                className="h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-800/20 cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Transaksi Baru</span>
              </button>
            </div>
          </div>
        ) : cart.length === 0 ? (
          /* Empty Cart View */
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Keranjang Masih Kosong
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Pilih barang di etalase dan tekan tombol "Jual" untuk mencatat transaksi.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm shadow-emerald-800/20"
            >
              Mulai Pilih Barang
            </button>
          </div>
        ) : (
          /* Active Cart Items */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {/* Items List */}
            <div className="space-y-2.5">
              {cart.map((item) => {
                const preset = PRESET_ICONS[item.product.iconType] || PRESET_ICONS['box'];
                const itemSubtotal = item.product.sellPrice * item.quantity;

                return (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                  >
                    {/* Item Icon & Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-12 h-12 rounded-xl ${preset.bg} flex items-center justify-center text-2xl shrink-0 overflow-hidden`}>
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          preset.icon
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.product.name}
                        </h4>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {formatRupiah(item.product.sellPrice)} / {item.product.unit}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper & Subtotal */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity === 1) {
                              if (window.confirm(`Hapus "${item.product.name}" dari keranjang?`)) {
                                onRemoveFromCart(item.product.id);
                              }
                            } else {
                              onUpdateQuantity(item.product.id, item.quantity - 1);
                            }
                          }}
                          className="w-8 h-8 rounded-lg text-slate-700 hover:text-emerald-700 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                          aria-label="Kurangi barang"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-slate-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-8 h-8 rounded-lg text-slate-700 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                          aria-label="Tambah barang"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <div className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                          {formatRupiah(itemSubtotal)}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus "${item.product.name}" dari keranjang kasir?`)) {
                              onRemoveFromCart(item.product.id);
                            }
                          }}
                          className="text-[11px] text-rose-500 hover:text-rose-700 underline font-medium cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculations & Quick Cash Shortcuts */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              {/* Grand Total */}
              <div className="flex items-baseline justify-between bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200/80">
                <span className="text-sm font-bold text-slate-800">Total Tagihan:</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-800 tabular-nums">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              {/* Uang Diterima / Tunai dari Pembeli */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  💵 Uang Tunai Pembeli (Opsional untuk hitung kembalian):
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                    Rp
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    placeholder={formatNumber(totalAmount)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-100 text-slate-900 font-bold rounded-xl border border-transparent focus:border-emerald-600 focus:bg-white outline-none text-base tabular-nums"
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(totalAmount)}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(20000)}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-lg text-xs font-medium tabular-nums transition-all cursor-pointer"
                  >
                    20.000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(50000)}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-lg text-xs font-medium tabular-nums transition-all cursor-pointer"
                  >
                    50.000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(100000)}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-lg text-xs font-medium tabular-nums transition-all cursor-pointer"
                  >
                    100.000
                  </button>
                </div>
              </div>

              {/* Kembalian Highlight Box */}
              {cashPaid > 0 && (
                <div
                  className={`p-3.5 rounded-2xl flex items-center justify-between border ${
                    isCashSufficient
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <span className="text-xs font-bold">
                    {isCashSufficient ? 'Kembalian Pembeli:' : 'Uang Kurang:'}
                  </span>
                  <span className="text-base sm:text-lg font-black tabular-nums">
                    {isCashSufficient ? formatRupiah(change) : formatRupiah(totalAmount - cashPaid)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Action Bar (Pinned Bottom CTA) */}
        {!lastReceipt && cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-slate-100 shadow-lg">
            <button
              type="button"
              onClick={handleFinishTransaction}
              className="w-full h-12 sm:h-14 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-800/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Selesai & Catat ({formatRupiah(totalAmount)})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
