import React from 'react';
import { AlertTriangle, TrendingUp, Package, Sparkles } from 'lucide-react';
import { formatRupiah } from '../utils/format';

interface BannerHeroProps {
  totalProducts: number;
  lowStockCount: number;
  todayRevenue: number;
  onFilterLowStock: () => void;
  onOpenSalesHistory: () => void;
}

export const BannerHero: React.FC<BannerHeroProps> = ({
  totalProducts,
  lowStockCount,
  todayRevenue,
  onFilterLowStock,
  onOpenSalesHistory,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-800 via-emerald-800 to-emerald-950 text-white p-3.5 sm:p-5 shadow-sm shadow-emerald-900/20">
      {/* Background soft geometric circles */}
      <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
      <div className="absolute right-20 -bottom-10 w-28 h-28 bg-emerald-500/20 rounded-full blur-lg pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Friendly Greeting & Storekeeper Icon */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/15 backdrop-blur-md p-1 flex items-center justify-center shrink-0 border border-white/20">
            {/* Friendly grocery storekeeper graphic in earth tone apron */}
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
            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 p-0.5 rounded-full text-[9px] leading-none shadow">
              <Sparkles className="w-2.5 h-2.5" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight whitespace-nowrap">
                Halo Pengelola Toko
              </h2>
            </div>
          </div>
        </div>

        {/* Right Side: 3 Metric Cards (Stacked number on second line for tablet) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 w-full md:w-auto">
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
              <span className="text-[10px] text-emerald-200">macam</span>
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
            title="Klik untuk melihat barang stok sedikit"
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
                {lowStockCount > 0 ? 'perlu' : 'aman'}
              </span>
            </div>
          </button>

          {/* 3. Kas Masuk */}
          <button
            type="button"
            onClick={onOpenSalesHistory}
            className="bg-white text-slate-900 border border-white rounded-xl px-3 py-2 sm:px-3 sm:py-2.5 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center gap-1 sm:gap-1.5 min-w-[120px] md:min-w-[135px] shadow-xs hover:bg-emerald-50 transition-all cursor-pointer active:scale-95"
            title="Klik untuk rincian penjualan hari ini"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-800" />
              </div>
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                Kas Masuk
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
    </div>
  );
};
