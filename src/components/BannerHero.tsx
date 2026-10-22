import React, { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Package,
  Sparkles,
  ChevronDown,
  Check,
  Plus,
  Settings,
  Search,
  X,
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeStore = stores.find((s) => s.id === activeStoreId) || stores[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative rounded-2xl bg-linear-to-br from-emerald-800 via-emerald-800 to-emerald-950 text-white p-3.5 sm:p-5 shadow-sm shadow-emerald-900/20 space-y-3.5">
      {/* Background soft geometric circles (clipped inside its own container so dropdown can overflow) */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-xl" />
        <div className="absolute right-20 -bottom-10 w-28 h-28 bg-emerald-500/20 rounded-full blur-lg" />
      </div>

      {/* Top Row: Store Switcher Dropdown (Replacing Halo Pengelola Toko) + 3 Metric Cards */}
      <div className="relative z-20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Store Icon + Store Name & Switcher Dropdown */}
        <div className="relative min-w-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-1.5 -m-1.5 rounded-2xl hover:bg-white/10 active:scale-[0.99] transition-all cursor-pointer text-left group"
            title="Ganti atau kelola toko"
            aria-label="Pilih Toko"
          >
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/15 backdrop-blur-md p-1 flex items-center justify-center shrink-0 border border-white/20 overflow-hidden">
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

            <div className="min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black text-white truncate tracking-tight max-w-[200px] sm:max-w-[260px] md:max-w-xs leading-snug">
                  {activeStore?.name || 'Toko Saya'}
                </h1>
                <ChevronDown
                  className={`w-4 h-4 text-emerald-200 shrink-0 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </div>
              <p className="text-xs text-emerald-100/90 font-medium truncate leading-normal">
                {activeStore?.categoryOrType || 'Toko Kelontong'} · ({stores.length}/3 toko)
              </p>
            </div>
          </button>

          {/* Store Switcher Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-stone-200 py-2 z-50 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Pilih Toko ({stores.length}/3)
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Maks. 3 Toko
                </span>
              </div>

              <div className="p-1.5 space-y-1">
                {stores.map((store, index) => {
                  const isActive = store.id === activeStoreId;
                  return (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => {
                        onSelectStore(store.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80 shadow-2xs'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${
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
                          <div className="text-xs sm:text-sm font-bold truncate leading-snug">
                            {store.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate leading-snug">
                            {store.categoryOrType || 'Usaha Toko'} · Pemilik: {store.ownerName}
                          </div>
                        </div>
                      </div>

                      {isActive && (
                        <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-2 border-t border-slate-100 pt-2 space-y-1">
                {stores.length < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenAddStore();
                    }}
                    className="w-full h-10 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Tambah Toko Baru ({3 - stores.length} slot tersisa)</span>
                  </button>
                ) : (
                  <div className="px-3 py-2 bg-slate-50 rounded-xl text-center text-[11px] text-slate-500 font-medium">
                    🔒 Kuota maksimal 3 toko telah penuh
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenAddStore();
                  }}
                  className="w-full py-2 px-3 text-center text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Kelola & Atur Semua Toko</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: 3 Metric Cards (Below Store Name on Tablet, Side-by-side on Desktop lg:) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 w-full lg:w-auto">
          {/* 1. Total Item */}
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 sm:px-3 sm:py-2.5 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1 sm:gap-1.5 min-w-[110px] md:min-w-[125px]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Package className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-emerald-100 whitespace-nowrap">
                Total Item
              </span>
            </div>
            <div className="flex items-baseline gap-1 shrink-0 sm:pl-0.5">
              <span className="text-base sm:text-lg font-black text-white tabular-nums">
                {totalProducts}
              </span>
              <span className="text-[10px] text-emerald-200">barang</span>
            </div>
          </div>

          {/* 2. Stok Kritis */}
          <button
            type="button"
            onClick={onFilterLowStock}
            className={`border rounded-xl px-3 py-2 sm:px-3 sm:py-2.5 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1 sm:gap-1.5 min-w-[110px] md:min-w-[125px] transition-all cursor-pointer ${
              lowStockCount > 0
                ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-xs active:scale-95 hover:bg-amber-300'
                : 'bg-white/15 text-white border-white/20 hover:bg-white/20'
            }`}
            title="Klik untuk melihat barang stok kritis di halaman stok"
          >
            <div className="flex items-center gap-2">
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
            <div className="flex items-baseline gap-1 shrink-0 sm:pl-0.5">
              <span className="text-base sm:text-lg font-black tabular-nums">
                {lowStockCount}
              </span>
              <span className="text-[10px] font-medium opacity-80">
                barang
              </span>
            </div>
          </button>

          {/* 3. Kas Masuk Harian */}
          <button
            type="button"
            onClick={onOpenSalesHistory}
            className="bg-white text-slate-900 border border-white rounded-xl px-3 py-2 sm:px-3 sm:py-2.5 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1 sm:gap-1.5 min-w-[120px] md:min-w-[145px] shadow-xs hover:bg-emerald-50 transition-all cursor-pointer active:scale-95"
            title="Klik untuk rincian penjualan hari ini"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-800" />
              </div>
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                Kas Masuk Harian
              </span>
            </div>
            <div className="shrink-0 sm:pl-0.5">
              <span className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">
                {formatRupiah(todayRevenue)}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Row inside Green Hero Section: Searchbox */}
      <div className="relative z-10 pt-2 border-t border-white/15">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-emerald-700" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama barang, kategori, atau lokasi rak..."
            className="w-full h-10 sm:h-11 pl-10 pr-9 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-semibold rounded-xl border border-white/40 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
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
  );
};
