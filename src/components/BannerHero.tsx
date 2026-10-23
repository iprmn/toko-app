import React, { useState } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Package,
  Sparkles,
  ArrowUpDown,
  Check,
  Plus,
  Search,
  X,
  Store,
} from 'lucide-react';
import { StoreAccount } from '../types/store';
import { formatRupiah } from '../utils/format';

interface BannerHeroProps {
  stores: StoreAccount[];
  activeStoreId: string;
  onSelectStore: (storeId: string) => void;
  onOpenAddStore: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalProducts: number;
  lowStockCount: number;
  todayRevenue: number;
  onFilterLowStock: () => void;
  onOpenSalesHistory: () => void;
}

export const BannerHero: React.FC<BannerHeroProps> = ({
  stores,
  activeStoreId,
  onSelectStore,
  onOpenAddStore,
  searchQuery,
  onSearchChange,
  totalProducts,
  lowStockCount,
  todayRevenue,
  onFilterLowStock,
  onOpenSalesHistory,
}) => {
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  const activeStore = stores.find((s) => s.id === activeStoreId) || stores[0];

  return (
    <>
      <div className="relative rounded-2xl bg-linear-to-br from-emerald-800 via-emerald-800 to-emerald-950 text-white p-2.5 sm:p-5 shadow-sm shadow-emerald-900/20 space-y-2.5 sm:space-y-3.5">
        {/* Background soft geometric circles */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-xl" />
          <div className="absolute right-20 -bottom-10 w-28 h-28 bg-emerald-500/20 rounded-full blur-lg" />
        </div>

        {/* Top Row: Store Switcher + 3 Metric Cards */}
        <div className="relative z-20 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
          {/* Left Side: Store Icon + Store Name & Right-Aligned Switch Button */}
          <div className="relative min-w-0 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setIsStoreModalOpen(true)}
              className="w-full lg:w-auto flex items-center justify-between gap-2.5 sm:gap-3 p-1 -m-1 rounded-2xl hover:bg-white/10 active:scale-[0.99] transition-all cursor-pointer text-left group"
              title="Ganti toko"
              aria-label="Pilih Toko"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-white/15 backdrop-blur-md p-1 flex items-center justify-center shrink-0 border border-white/20 overflow-hidden">
                  {activeStore?.logoUrl ? (
                    <img
                      src={activeStore.logoUrl}
                      alt={activeStore.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full drop-shadow-sm"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="50" cy="50" r="48" fill="#FFFFFF" fillOpacity="0.25" />
                      <circle cx="50" cy="38" r="20" fill="#FFE0BD" />
                      <path
                        d="M32 32C32 20 40 14 50 14C60 14 68 20 68 32C68 34 66 35 64 35C60 30 54 28 50 28C46 28 40 30 36 35C34 35 32 34 32 32Z"
                        fill="#332115"
                      />
                      <circle cx="43" cy="37" r="5" stroke="#1E293B" strokeWidth="2.2" fill="white" />
                      <circle cx="57" cy="37" r="5" stroke="#1E293B" strokeWidth="2.2" fill="white" />
                      <path d="M48 37H52" stroke="#1E293B" strokeWidth="2.2" />
                      <circle cx="43" cy="37" r="2" fill="#1E293B" />
                      <circle cx="57" cy="37" r="2" fill="#1E293B" />
                      <path
                        d="M44 48C46 51 54 51 56 48"
                        stroke="#065F46"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                      <circle cx="38" cy="44" r="3" fill="#FDA4AF" />
                      <circle cx="62" cy="44" r="3" fill="#FDA4AF" />
                      <path
                        d="M26 88C26 70 34 60 50 60C66 60 74 70 74 88H26Z"
                        fill="#065F46"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <rect x="42" y="70" width="16" height="14" rx="3" fill="#047857" />
                    </svg>
                  )}
                  <span className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 p-0.5 rounded-full text-[9px] leading-none shadow">
                    <Sparkles className="w-2.5 h-2.5" />
                  </span>
                </div>

                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-black text-white truncate tracking-tight leading-snug">
                    {activeStore?.name || 'Toko Saya'}
                  </h1>
                  <p className="text-xs text-emerald-100/90 font-medium truncate leading-normal">
                    {activeStore?.categoryOrType || 'Toko Kelontong'} · ({stores.length}/3 toko)
                  </p>
                </div>
              </div>

              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 group-hover:bg-white/25 border border-white/25 flex items-center justify-center text-emerald-100 shrink-0 transition-colors ml-2">
                <ArrowUpDown className="w-4 h-4 stroke-[2.5]" />
              </span>
            </button>
          </div>

          {/* Right Side: 3 Metric Cards (Horizontal Side-by-Side, Scrollable if needed) */}
          <div className="flex items-stretch gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar w-full lg:w-auto pb-0.5">
            {/* 1. Total Item */}
            <div className="flex-1 shrink-0 min-w-[112px] sm:min-w-[125px] bg-white/15 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 flex flex-col items-start justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Package className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-semibold text-emerald-100 whitespace-nowrap">
                  Total Item
                </span>
              </div>
              <div className="flex items-baseline gap-1 shrink-0 pl-0.5">
                <span className="text-sm sm:text-lg font-black text-white tabular-nums">
                  {totalProducts}
                </span>
                <span className="text-[11px] text-emerald-200">barang</span>
              </div>
            </div>

            {/* 2. Stok Kritis */}
            <button
              type="button"
              onClick={onFilterLowStock}
              className={`flex-1 shrink-0 min-w-[112px] sm:min-w-[125px] border rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 flex flex-col items-start justify-between gap-1.5 transition-all cursor-pointer ${
                lowStockCount > 0
                  ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-xs active:scale-95 hover:bg-amber-300'
                  : 'bg-white/15 text-white border-white/20 hover:bg-white/20'
              }`}
              title="Klik untuk melihat barang stok kritis di halaman stok"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    lowStockCount > 0 ? 'bg-amber-950/15' : 'bg-white/20'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                </div>
                <span className="text-xs font-semibold whitespace-nowrap">
                  Stok Kritis
                </span>
              </div>
              <div className="flex items-baseline gap-1 shrink-0 pl-0.5">
                <span className="text-sm sm:text-lg font-black tabular-nums">
                  {lowStockCount}
                </span>
                <span className="text-[11px] font-medium opacity-80">
                  barang
                </span>
              </div>
            </button>

            {/* 3. Kas Masuk Harian */}
            <button
              type="button"
              onClick={onOpenSalesHistory}
              className="flex-1 shrink-0 min-w-[132px] sm:min-w-[150px] bg-white text-slate-900 border border-white rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 flex flex-col items-start justify-between gap-1.5 shadow-xs hover:bg-emerald-50 transition-all cursor-pointer active:scale-95"
              title="Klik untuk rincian penjualan hari ini"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-800" />
                </div>
                <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                  Kas Masuk Harian
                </span>
              </div>
              <div className="shrink-0 pl-0.5">
                <span className="text-xs sm:text-sm font-black text-slate-900 tabular-nums whitespace-nowrap">
                  {formatRupiah(todayRevenue)}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom Row inside Green Hero Section: Searchbox */}
        <div className="relative z-10 pt-1.5 sm:pt-2 border-t border-white/15">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-emerald-700" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama barang, kategori, atau lokasi rak..."
              className="w-full h-9 sm:h-11 pl-9 pr-8 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-semibold rounded-xl border border-white/40 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                type="button"
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                  <X className="w-3 h-3 text-slate-600" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Popup Modal Peralihan Toko */}
      {isStoreModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsStoreModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full border border-stone-200 shadow-2xl space-y-3.5 text-slate-900 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  Pilih Toko ({stores.length}/3)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Tutup popup toko"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[55vh] overflow-y-auto">
              {stores.map((store, index) => {
                const isActive = store.id === activeStoreId;
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => {
                      onSelectStore(store.id);
                      setIsStoreModalOpen(false);
                    }}
                    className={`w-full p-3 sm:p-3.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 font-bold border-emerald-200/80 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-700 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden ${
                          isActive
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {store.logoUrl ? (
                          <img
                            src={store.logoUrl}
                            alt={store.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-bold truncate leading-snug">
                          {store.name}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-500 truncate leading-snug mt-0.5">
                          {store.categoryOrType || 'Usaha Toko'}
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 ml-2">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {stores.length < 3 && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsStoreModalOpen(false);
                    onOpenAddStore();
                  }}
                  className="w-full h-11 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Tambah Toko Baru ({3 - stores.length} slot tersisa)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
