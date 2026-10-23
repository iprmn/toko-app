import React from 'react';
import { ShoppingCart, AlertCircle, CheckCircle, Plus } from 'lucide-react';
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
  const isOutOfStock = product.stock <= 0;
  const preset = PRESET_ICONS[product.iconType] || PRESET_ICONS['box'];

  return (
    <div
      className={`group relative rounded-xl sm:rounded-2xl p-2 sm:p-3 border transition-all flex flex-col justify-between ${
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
            onClick={() => onAddToCart(product)}
            className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[10.5px] sm:text-xs flex items-center justify-center gap-1 shadow-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/10 cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0"
            title="Masukkan ke kasir"
          >
            <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>Jual</span>
          </button>
        )}
      </div>
    </div>
  );
};
