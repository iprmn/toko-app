import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Store, ChevronDown, Check, Plus, Settings } from 'lucide-react';
import { StoreAccount } from '../types/store';

interface HeaderProps {
  stores: StoreAccount[];
  activeStoreId: string;
  onSelectStore: (storeId: string) => void;
  onOpenAddStore: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  stores,
  activeStoreId,
  onSelectStore,
  onOpenAddStore,
  searchQuery,
  onSearchChange,
  showSearch = true,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeStore = stores.find((s) => s.id === activeStoreId) || stores[0];

  // Close dropdown on outside click
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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Store Switcher Dropdown (Replaces Ubah) */}
          <div className="relative min-w-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-100/80 active:scale-[0.98] transition-all cursor-pointer text-left group"
              title="Ganti atau kelola toko"
              aria-label="Pilih Toko"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-emerald-950/20 shrink-0 group-hover:bg-emerald-700 transition-colors overflow-hidden">
                {activeStore?.logoUrl ? (
                  <img
                    src={activeStore.logoUrl}
                    alt={activeStore.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate tracking-tight max-w-[140px] sm:max-w-[200px] md:max-w-xs leading-normal">
                    {activeStore?.name || 'Toko Saya'}
                  </h1>
                  <ChevronDown
                    className={`w-4 h-4 text-emerald-800 shrink-0 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180 text-emerald-900' : ''
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate leading-normal">
                  {activeStore?.categoryOrType || 'Toko Kelontong'} · ({stores.length}/3 toko)
                </p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Pilih Toko ({stores.length}/3)
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    Maks. 3 Toko
                  </span>
                </div>

                {/* Stores List */}
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

                {/* Footer Action: Add Store if < 3 */}
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
                      onOpenAddStore(); // Takes to SettingsView
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

          {/* Search Bar in Nav Bar (Hanya tampil pada halaman utama) */}
          {showSearch && (
            <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md ml-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4 text-emerald-700" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari beras, minyak, mie..."
                className="w-full h-10 pl-9 pr-9 bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-medium rounded-xl border border-transparent focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
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
          )}
        </div>
      </div>
    </header>
  );
};
