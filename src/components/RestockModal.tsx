import React, { useState } from 'react';
import { X, PackagePlus, Check, ArrowRight } from 'lucide-react';
import { Product } from '../types/store';
import { PRESET_ICONS } from '../data/initialProducts';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddStock: (productId: string, quantityToAdd: number) => void;
  defaultProductId?: string;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  products,
  onAddStock,
  defaultProductId,
}) => {
  const [selectedId, setSelectedId] = useState<string>(defaultProductId || products[0]?.id || '');
  const [amount, setAmount] = useState<number>(10);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedId) || products[0];

  const handleApply = () => {
    if (!currentProduct || amount <= 0) return;
    onAddStock(currentProduct.id, amount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <PackagePlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                Tambah Stok Jumlah Besar
              </h2>
              <p className="text-xs text-emerald-100">
                Catat barang masuk dalam jumlah banyak atau dus
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
        <div className="p-5 space-y-4">
          
          {/* Product Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Barang yang Mau Ditambah:
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full h-12 px-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-emerald-600"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Sisa: {p.stock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Preview */}
          {currentProduct && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-2xs">
                  {PRESET_ICONS[currentProduct.iconType]?.icon || '📦'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {currentProduct.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    Stok saat ini: <strong className="text-slate-900">{currentProduct.stock}</strong> {currentProduct.unit}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-slate-500">Akan menjadi:</div>
                <div className="text-base font-black text-emerald-700 tabular-nums">
                  {currentProduct.stock + (amount || 0)} {currentProduct.unit}
                </div>
              </div>
            </div>
          )}

          {/* Quick Amount Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Jumlah Barang Masuk (+):
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[5, 10, 12, 24, 40, 50, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setAmount(num)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    amount === num
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  +{num}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
              placeholder="Atau ketik jumlah..."
              className="w-full h-11 px-3.5 bg-slate-100 text-slate-900 font-bold rounded-xl border border-transparent focus:border-emerald-600 focus:bg-white outline-none text-base tabular-nums"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleApply}
              className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-800/20 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Simpan Tambahan Stok</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
