import React from 'react';
import { ShoppingCart, LayoutGrid, Package, History, Store } from 'lucide-react';
import { formatRupiah } from '../utils/format';

interface BottomNavProps {
  activeTab: 'catalog' | 'inventory' | 'history' | 'settings';
  onSelectTab: (tab: 'catalog' | 'inventory' | 'history' | 'settings') => void;
  cartItemCount: number;
  cartTotalAmount: number;
  onOpenCart: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  cartItemCount,
  cartTotalAmount,
  onOpenCart,
}) => {
  return (
    <>
      {/* Floating Action Button (Earth Green Circular Cart Button) */}
      <div className="fixed bottom-20 right-4 sm:right-8 z-40">
        <button
          type="button"
          onClick={onOpenCart}
          className="relative w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-emerald-700 hover:bg-emerald-800 active:scale-90 text-white shadow-xl shadow-emerald-900/30 flex items-center justify-center transition-all cursor-pointer border-2 border-white"
          title="Buka Kasir / Keranjang"
          aria-label="Keranjang Kasir"
        >
          <ShoppingCart className="w-7 h-7" />

          {/* Cart Count Badge */}
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
              {cartItemCount}
            </span>
          )}
        </button>

        {/* Small floating subtotal pill if cart has items */}
        {cartItemCount > 0 && (
          <div
            onClick={onOpenCart}
            className="hidden sm:block absolute -top-8 right-0 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-md cursor-pointer"
          >
            {formatRupiah(cartTotalAmount)}
          </div>
        )}
      </div>

      {/* Fixed Bottom Bar on Mobile/Tablet */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-2">
          
          {/* Tab 1: Etalase / Kasir */}
          <button
            type="button"
            onClick={() => onSelectTab('catalog')}
            className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
              activeTab === 'catalog' ? 'text-emerald-800 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Etalase</span>
          </button>

          {/* Tab 2: Stok Gudang */}
          <button
            type="button"
            onClick={() => onSelectTab('inventory')}
            className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
              activeTab === 'inventory' ? 'text-emerald-800 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Stok Barang</span>
          </button>

          {/* Tab 3: Penjualan */}
          <button
            type="button"
            onClick={() => onSelectTab('history')}
            className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
              activeTab === 'history' ? 'text-emerald-800 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Penjualan</span>
          </button>

          {/* Tab 4: Info Toko */}
          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer ${
              activeTab === 'settings' ? 'text-emerald-800 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Toko Saya</span>
          </button>
        </div>
      </nav>
    </>
  );
};
