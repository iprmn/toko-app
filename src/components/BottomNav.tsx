import React from 'react';
import { Store, Package, ShoppingCart, ClipboardList, Settings } from 'lucide-react';
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
      {/* Floating Cart Bar (Muncul saat ada barang di keranjang kasir) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-30 px-4 pointer-events-none">
          <div className="max-w-lg mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={onOpenCart}
              className="w-full p-3.5 sm:p-4 bg-emerald-900 hover:bg-emerald-950 text-white rounded-2xl shadow-xl shadow-emerald-950/30 flex items-center justify-between transition-all active:scale-98 cursor-pointer border border-emerald-700"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 font-black text-base flex items-center justify-center shadow-xs">
                  {cartItemCount}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                    Keranjang Kasir Aktif
                  </div>
                  <div className="text-base sm:text-lg font-black text-white tabular-nums">
                    {formatRupiah(cartTotalAmount)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white text-emerald-950 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-xs">
                <ShoppingCart className="w-4 h-4 text-emerald-800" />
                <span>Bayar / Hitung</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Navigation Bar (4 Main Tabs) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200/80 shadow-lg">
        <div className="max-w-lg mx-auto px-2 h-16 grid grid-cols-4 gap-1 items-center">
          {/* 1. Etalase / Jualan */}
          <button
            type="button"
            onClick={() => onSelectTab('catalog')}
            className={`h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-emerald-50 text-emerald-800 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-xs lg:text-[11px] leading-tight">Etalase</span>
          </button>

          {/* 2. Stok Barang */}
          <button
            type="button"
            onClick={() => onSelectTab('inventory')}
            className={`h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-emerald-50 text-emerald-800 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="text-xs lg:text-[11px] leading-tight">Stok Barang</span>
          </button>

          {/* 3. Catatan Kas (7 Hari) */}
          <button
            type="button"
            onClick={() => onSelectTab('history')}
            className={`h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-50 text-emerald-800 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-xs lg:text-[11px] leading-tight">Catatan Kas</span>
          </button>

          {/* 4. Pengaturan & Multi-Toko */}
          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            className={`h-13 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-50 text-emerald-800 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs lg:text-[11px] leading-tight">Kelola Toko</span>
          </button>
        </div>
      </nav>
    </>
  );
};
