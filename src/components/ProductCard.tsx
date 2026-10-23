import React, { useState } from 'react';
import { ShoppingCart, AlertCircle, CheckCircle, Plus, X } from 'lucide-react';
import { Product } from '../types/store';
import { formatRupiah } from '../utils/format';
import { PRESET_ICONS } from '../data/initialProducts';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onRestockProduct?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onRestockProduct,
}) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const preset = PRESET_ICONS[product.iconType] || PRESET_ICONS['box'];

  return (
    <>
      <div
        onClick={() => setIsDetailOpen(true)}
        className={`group relative rounded-xl sm:rounded-2xl p-2 sm:p-3 border transition-all flex flex-col justify-between cursor-pointer ${
          isOutOfStock
            ? 'bg-slate-100/80 border-slate-300/80 shadow-2xs opacity-80 filter grayscale-[0.55]'
            : 'bg-white border-stone-200/90 shadow-sm hover:shadow-md'
        }`}
      >
        {/* Top Header: Category & Stock Status Badge */}
        <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
          <span className="text-[9.5px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
            {product.category}
          </span>

          {/* Stock Status Badge: Only 'Ready' or 'Habis' */}
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-0.5 text-[9.5px] sm:text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-rose-200/60 shadow-2xs shrink-0">
              <AlertCircle className="w-2.5 h-2.5" />
              Habis
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[9.5px] sm:text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-200/60 shadow-2xs shrink-0">
              <CheckCircle className="w-2.5 h-2.5" />
              Ready
            </span>
          )}
        </div>

        {/* Product Visual Container (Compact) */}
        <div
          className={`w-full h-18 sm:h-24 rounded-lg sm:rounded-xl ${
            isOutOfStock ? 'bg-slate-200/70' : preset.bg
          } flex items-center justify-center relative select-none overflow-hidden`}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`w-full h-full object-cover rounded-lg sm:rounded-xl ${
                isOutOfStock ? 'opacity-60 grayscale-[0.6]' : ''
              }`}
            />
          ) : (
            <span className={`text-2xl sm:text-4xl drop-shadow-2xs ${isOutOfStock ? 'opacity-60' : ''}`}>
              {preset.icon}
            </span>
          )}
        </div>

        {/* Shelf Info (Above Product Title), Product Title & Price */}
        <div className="mt-1.5 sm:mt-2.5 space-y-0.5 sm:space-y-1">
          {product.shelf && (
            <div>
              <span
                className="inline-block text-[9.5px] sm:text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200 max-w-full truncate leading-tight"
                title={`Rak: ${product.shelf}`}
              >
                🏷️ {product.shelf}
              </span>
            </div>
          )}

          <h4
            className={`text-[11.5px] sm:text-sm font-bold line-clamp-1 leading-snug ${
              isOutOfStock ? 'text-slate-600' : 'text-slate-900'
            }`}
            title={product.name}
          >
            {product.name}
          </h4>

          <div>
            <div
              className={`text-[13px] sm:text-base font-black tabular-nums leading-tight ${
                isOutOfStock ? 'text-slate-600' : 'text-emerald-800'
              }`}
            >
              {formatRupiah(product.sellPrice)}
            </div>
            <div className="text-[9.5px] sm:text-[10px] text-slate-400 font-medium truncate mt-0.5 leading-tight">
              Untung +{formatRupiah(product.sellPrice - product.buyPrice)}
            </div>
          </div>
        </div>

        {/* Bottom Action Controls: Direct stock number with unit below & CTA */}
        <div className="mt-2 pt-1.5 sm:mt-3 sm:pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-1">
          <div className="min-w-0 flex flex-col justify-center">
            <span
              className={`text-[13px] sm:text-base font-black tabular-nums leading-none ${
                isOutOfStock ? 'text-slate-400' : 'text-slate-800'
              }`}
            >
              {product.stock}
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-medium text-slate-400 capitalize mt-0.5 leading-none truncate">
              {product.unit}
            </span>
          </div>

          {/* Action Button: 'Tambah Stok' when Habis, 'Jual' when Ready */}
          {isOutOfStock ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRestockProduct?.(product);
              }}
              className="h-7 sm:h-8 px-2 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[10.5px] sm:text-xs flex items-center justify-center gap-1 shadow-xs bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/10 cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0"
              title="Tambah stok barang ini"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>Tambah Stok</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[10.5px] sm:text-xs flex items-center justify-center gap-1 shadow-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/10 cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0"
              title="Masukkan ke kasir"
            >
              <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>Jual</span>
            </button>
          )}
        </div>
      </div>

      {/* Popup Detail Card Barang (Tampilan & Susunan Sama, Judul Tidak Terpotong) */}
      {isDetailOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsDetailOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-xs rounded-2xl p-4 border shadow-2xl flex flex-col justify-between animate-in zoom-in-95 duration-150 ${
              isOutOfStock
                ? 'bg-slate-100 border-slate-300'
                : 'bg-white border-stone-200'
            }`}
          >
            {/* Top Header: Category, Stock Status Badge & Close Button */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {product.category}
              </span>

              <div className="flex items-center gap-1.5">
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60 shadow-2xs shrink-0">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Habis
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 shadow-2xs shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Ready
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Tutup detail barang"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Product Visual Container */}
            <div
              className={`w-full h-40 rounded-xl ${
                isOutOfStock ? 'bg-slate-200/70' : preset.bg
              } flex items-center justify-center relative select-none overflow-hidden`}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className={`w-full h-full object-cover rounded-xl ${
                    isOutOfStock ? 'opacity-60 grayscale-[0.6]' : ''
                  }`}
                />
              ) : (
                <span className={`text-5xl drop-shadow-2xs ${isOutOfStock ? 'opacity-60' : ''}`}>
                  {preset.icon}
                </span>
              )}
            </div>

            {/* Shelf Info, Full Product Title & Price */}
            <div className="mt-3 space-y-1.5">
              {product.shelf && (
                <div>
                  <span className="inline-block text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200 break-words leading-snug">
                    🏷️ {product.shelf}
                  </span>
                </div>
              )}

              <h4
                className={`text-base font-bold break-words leading-snug ${
                  isOutOfStock ? 'text-slate-600' : 'text-slate-900'
                }`}
              >
                {product.name}
              </h4>

              <div>
                <div
                  className={`text-lg font-black tabular-nums leading-tight ${
                    isOutOfStock ? 'text-slate-600' : 'text-emerald-800'
                  }`}
                >
                  {formatRupiah(product.sellPrice)}
                </div>
                <div className="text-xs text-slate-400 font-medium mt-0.5 leading-tight">
                  Untung +{formatRupiah(product.sellPrice - product.buyPrice)}
                </div>
              </div>
            </div>

            {/* Bottom Action Controls: Direct stock number with unit below & CTA */}
            <div className="mt-3.5 pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
              <div className="min-w-0 flex flex-col justify-center">
                <span
                  className={`text-base font-black tabular-nums leading-none ${
                    isOutOfStock ? 'text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {product.stock}
                </span>
                <span className="text-xs font-medium text-slate-400 capitalize mt-0.5 leading-none">
                  {product.unit}
                </span>
              </div>

              {isOutOfStock ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailOpen(false);
                    onRestockProduct?.(product);
                  }}
                  className="h-9 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/10 cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Tambah Stok</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(product);
                  }}
                  className="h-9 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/10 cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0"
                >
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  <span>Jual</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
