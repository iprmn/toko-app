import React from 'react';
import { X, Edit3, Trash2, ShoppingCart, Plus, Minus, PackagePlus, AlertCircle } from 'lucide-react';
import { Product } from '../types/store';
import { formatRupiah } from '../utils/format';
import { PRESET_ICONS } from '../data/initialProducts';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onQuickAdjustStock: (product: Product, delta: number) => void;
  onOpenRestockForProduct: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onEditProduct,
  onDeleteProduct,
  onAddToCart,
  onQuickAdjustStock,
  onOpenRestockForProduct,
}) => {
  if (!isOpen || !product) return null;

  const preset = PRESET_ICONS[product.iconType] || PRESET_ICONS['box'];
  const profitPerItem = product.sellPrice - product.buyPrice;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minStock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header with Visual Card */}
        <div className={`p-6 ${preset.bg} flex flex-col items-center justify-center relative`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          {product.imageUrl ? (
            <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-md my-1 border-2 border-white/80">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <span className="text-7xl select-none drop-shadow-sm">
              {preset.icon}
            </span>
          )}
          <span className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-600 bg-white/70 px-3 py-1 rounded-full backdrop-blur-xs">
            Kategori: {product.category}
          </span>
        </div>

        {/* Info Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {product.name}
            </h2>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-800 tabular-nums">
                {formatRupiah(product.sellPrice)}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                per {product.unit}
              </span>
            </div>
          </div>

          {/* Pricing & Profit Matrix */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div>
              <span className="text-xs text-slate-500 font-medium">Harga Beli:</span>
              <div className="text-sm font-bold text-slate-800 mt-0.5 tabular-nums">
                {formatRupiah(product.buyPrice)}
              </div>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Untung Tiap {product.unit}:</span>
              <div className="text-sm font-bold text-emerald-700 mt-0.5 tabular-nums">
                +{formatRupiah(profitPerItem)}
              </div>
            </div>
          </div>

          {/* Stock Status & Quick Adjustment */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700">Jumlah Stok Toko:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {product.stock}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {product.unit}
                  </span>
                </div>
              </div>

              {isOutOfStock ? (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                  Stok Habis
                </span>
              ) : isLowStock ? (
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full">
                  Perlu Ditambah (≤ {product.minStock})
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Stok Aman
                </span>
              )}
            </div>

            {/* In-place Stepper */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">Koreksi Stok Cepat:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onQuickAdjustStock(product, -1)}
                  disabled={product.stock <= 0}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-800 flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer"
                  title="Kurang 1"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm text-slate-900 w-8 text-center tabular-nums">
                  {product.stock}
                </span>
                <button
                  type="button"
                  onClick={() => onQuickAdjustStock(product, 1)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer"
                  title="Tambah 1"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRestockForProduct(product.id);
                  }}
                  className="ml-2 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Jumlah Besar
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditProduct(product);
              }}
              className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ubah Rincian</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  `⚠️ KONFIRMASI HAPUS\n\nApakah Anda yakin ingin menghapus barang "${product.name}"?\nData barang ini akan dihapus dari toko.`
                );
                if (confirmed) {
                  onDeleteProduct(product.id);
                  onClose();
                }
              }}
              className="h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Barang</span>
            </button>
          </div>
        </div>

        {/* Sticky Bottom Cart Action */}
        <div className="p-4 bg-white border-t border-slate-100 shadow-md">
          <button
            type="button"
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            disabled={isOutOfStock}
            className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-800/20 active:scale-95 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Masukkan ke Kasir ({formatRupiah(product.sellPrice)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
