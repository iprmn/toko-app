import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  CheckSquare,
  Square,
  Check,
  X,
  Search,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { Product } from '../types/store';
import { formatRupiah, formatThousands } from '../utils/format';
import { PRESET_ICONS, CATEGORIES } from '../data/initialProducts';

export type StockStatusFilter = 'all' | 'safe' | 'low' | 'out';

interface InventoryViewProps {
  products: Product[];
  initialStatusFilter?: StockStatusFilter;
  onStatusFilterChange?: (status: StockStatusFilter) => void;
  onQuickAdjustStock: (product: Product, delta: number) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteMultipleProducts?: (productIds: string[]) => void;
  onOpenRestock: (productId?: string) => void;
  onOpenAddProduct: () => void;
  highlightedProductId?: string | null;
  onClearHighlight?: () => void;
}

const renderProfitBadge = (sellPrice: number, buyPrice: number, sizeClass = 'text-[11px] sm:text-xs') => {
  const diff = sellPrice - buyPrice;
  if (diff > 0) {
    return (
      <span className={`${sizeClass} text-emerald-600 font-bold truncate leading-tight`}>
        Untung + {formatRupiah(diff)}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className={`${sizeClass} text-rose-600 font-bold truncate leading-tight`}>
        Rugi - {formatRupiah(Math.abs(diff))}
      </span>
    );
  }
  return (
    <span className={`${sizeClass} text-amber-800 font-bold truncate leading-tight`}>
      Tidak untung
    </span>
  );
};

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  initialStatusFilter = 'all',
  onStatusFilterChange,
  onQuickAdjustStock,
  onEditProduct,
  onDeleteProduct,
  onDeleteMultipleProducts,
  onOpenAddProduct,
  highlightedProductId,
  onClearHighlight,
}) => {
  const [selectedShelf, setSelectedShelf] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<StockStatusFilter>(initialStatusFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Sync when navigated from "Stok Kritis" card on Main Page
  useEffect(() => {
    setSelectedStatus(initialStatusFilter);
  }, [initialStatusFilter]);

  // When navigated directly from "Tambah Stok" on out-of-stock card in Etalase:
  // Reset all filters so product is visible, smoothly scroll to it, and focus its stock input
  useEffect(() => {
    if (!highlightedProductId) return;

    setSelectedStatus('all');
    setSelectedShelf('all');
    setSelectedCategory('all');
    setSearch('');

    const timer = setTimeout(() => {
      const el = document.getElementById(`inventory-item-${highlightedProductId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = el.querySelector('input');
        if (input) {
          input.focus();
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [highlightedProductId]);

  const handleStatusChange = (status: StockStatusFilter) => {
    setSelectedStatus(status);
    onStatusFilterChange?.(status);
  };

  // Unique shelves & counts
  const availableShelves = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.shelf && p.shelf.trim()) set.add(p.shelf.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  const shelfCounts = useMemo(() => {
    const counts: { [shelf: string]: number } = {};
    products.forEach((p) => {
      if (p.shelf && p.shelf.trim()) {
        const key = p.shelf.trim().toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Status counts
  const safeStockCount = useMemo(
    () => products.filter((p) => p.stock > p.minStock).length,
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.stock <= 0).length,
    [products]
  );

  // Category options & counts
  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = { all: products.length };
    products.forEach((p) => {
      const cat = p.category.toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  const categoryOptions = useMemo(() => {
    const base = CATEGORIES.filter((c) => c.id !== 'all' && c.id !== 'low-stock');
    const existingIds = new Set(base.map((c) => c.id.toLowerCase()));

    Object.keys(categoryCounts).forEach((catKey) => {
      if (catKey === 'all' || catKey === 'low-stock') return;
      if (!existingIds.has(catKey.toLowerCase()) && categoryCounts[catKey] > 0) {
        base.push({
          id: catKey,
          label: catKey.charAt(0).toUpperCase() + catKey.slice(1).replace(/-/g, ' '),
          icon: '🏷️',
        });
      }
    });

    return base.filter((c) => (categoryCounts[c.id.toLowerCase()] || 0) > 0);
  }, [categoryCounts]);

  // Long press tracking for all devices
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressActiveRef = useRef<boolean>(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const query = search.trim().toLowerCase();
      if (query) {
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCat = p.category.toLowerCase().includes(query);
        const matchesShelf = p.shelf ? p.shelf.toLowerCase().includes(query) : false;
        if (!matchesName && !matchesCat && !matchesShelf) return false;
      }

      // 1. Filter Rak
      if (selectedShelf !== 'all') {
        const itemShelf = p.shelf && p.shelf.trim() ? p.shelf.trim() : 'Etalase Utama';
        if (itemShelf.toLowerCase() !== selectedShelf.toLowerCase()) {
          return false;
        }
      }

      // 2. Filter Status
      if (selectedStatus === 'safe' && !(p.stock > p.minStock)) return false;
      if (selectedStatus === 'low' && !(p.stock > 0 && p.stock <= p.minStock)) return false;
      if (selectedStatus === 'out' && !(p.stock <= 0)) return false;

      // 3. Filter Kategori
      if (selectedCategory !== 'all') {
        if (p.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      return true;
    });
  }, [products, search, selectedShelf, selectedStatus, selectedCategory]);

  const isSelectionMode = selectedIds.length > 0;
  const isAllFilterReset =
    selectedShelf === 'all' && selectedStatus === 'all' && selectedCategory === 'all';

  // Bulk delete selected
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (onDeleteMultipleProducts) {
      onDeleteMultipleProducts(selectedIds);
    } else {
      selectedIds.forEach((id) => onDeleteProduct(id));
    }
    setSelectedIds([]);
  };

  const toggleSelect = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  // Long press events (unified across mobile, tablet, desktop)
  const startLongPress = (productId: string) => {
    isLongPressActiveRef.current = false;
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      toggleSelect(productId);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch {
          // Ignore
        }
      }
    }, 500);
  };

  const cancelLongPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  return (
    <div className="space-y-2">
      {/* Top Green Card (Same style as BannerHero on Main Page) */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-800 via-emerald-800 to-emerald-950 text-white p-2.5 sm:p-5 shadow-sm shadow-emerald-900/20 space-y-2.5 sm:space-y-3.5">
        {/* Background soft geometric circles */}
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-28 h-28 bg-emerald-500/20 rounded-full blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-2.5 flex-wrap">
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Pengelolaan Stock
            </h2>
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/25 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              title="Buka petunjuk pengelolaan barang"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-100" />
              <span>Petunjuk</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenAddProduct}
            className="w-full sm:w-auto px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white border border-emerald-400/80 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-950/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Barang Baru</span>
          </button>
        </div>

        {/* Search box inside Green Card */}
        <div className="relative z-10 pt-1.5 sm:pt-2 border-t border-white/15">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-emerald-700" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama barang, kategori, atau lokasi rak..."
              className="w-full h-9 sm:h-11 pl-9 pr-8 bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-semibold rounded-xl border border-white/40 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200/50 transition-all outline-none shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                type="button"
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Hapus pencarian stok"
              >
                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                  <X className="w-3 h-3 text-slate-600" />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Popup Petunjuk */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-4 sm:p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Petunjuk
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
              Klik/tap kartu barang untuk melakukan ubah, dan tekan lama kartu barang untuk melakukan hapus.
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors shadow-sm"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Horizontal Scrollable Filter Row (Same style as Etalase Page):
          1. Dropdown Rak
          2. Dropdown Status
          3. Dropdown Kategori
          4. Button Semua Barang */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar select-none">
        {/* 1. Dropdown Rak */}
        <div className="relative shrink-0">
          <select
            value={selectedShelf}
            onChange={(e) => setSelectedShelf(e.target.value)}
            aria-label="Filter Lokasi Rak"
            className={`min-h-[38px] sm:min-h-[44px] pl-3 sm:pl-3.5 pr-8 sm:pr-9 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold appearance-none transition-all cursor-pointer outline-none border ${
              selectedShelf !== 'all'
                ? 'bg-amber-800 text-white border-amber-900 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80 shadow-2xs'
            }`}
          >
            <option value="all" className="bg-white text-slate-800 font-semibold">
              🗄️ Semua Rak ({products.length})
            </option>
            {availableShelves.map((shelf) => {
              const count = shelfCounts[shelf.toLowerCase()] || 0;
              return (
                <option
                  key={shelf}
                  value={shelf}
                  className="bg-white text-slate-800 font-semibold"
                >
                  🗄️ {shelf} ({count})
                </option>
              );
            })}
          </select>
          <ChevronDown
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 ${
              selectedShelf !== 'all' ? 'text-white' : 'text-slate-500'
            }`}
          />
        </div>

        {/* 2. Dropdown Status */}
        <div className="relative shrink-0">
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value as StockStatusFilter)}
            aria-label="Filter Status Stok"
            className={`min-h-[38px] sm:min-h-[44px] pl-3 sm:pl-3.5 pr-8 sm:pr-9 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold appearance-none transition-all cursor-pointer outline-none border ${
              selectedStatus === 'low'
                ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                : selectedStatus === 'out'
                ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                : selectedStatus === 'safe'
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80 shadow-2xs'
            }`}
          >
            <option value="all" className="bg-white text-slate-800 font-semibold">
              📊 Semua Status ({products.length})
            </option>
            <option value="safe" className="bg-white text-slate-800 font-semibold">
              ✅ Stok Tersedia ({safeStockCount})
            </option>
            <option value="low" className="bg-white text-slate-800 font-semibold">
              ⚠️ Stok Kritis ({lowStockCount})
            </option>
            <option value="out" className="bg-white text-slate-800 font-semibold">
              🚫 Stok Habis ({outOfStockCount})
            </option>
          </select>
          <ChevronDown
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 ${
              selectedStatus !== 'all' ? 'text-white' : 'text-slate-500'
            }`}
          />
        </div>

        {/* 3. Dropdown Kategori */}
        <div className="relative shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter Kategori Barang"
            className={`min-h-[38px] sm:min-h-[44px] pl-3 sm:pl-3.5 pr-8 sm:pr-9 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold appearance-none transition-all cursor-pointer outline-none border ${
              selectedCategory !== 'all'
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80 shadow-2xs'
            }`}
          >
            <option value="all" className="bg-white text-slate-800 font-semibold">
              🏷️ Semua Kategori ({products.length})
            </option>
            {categoryOptions.map((cat) => {
              const count = categoryCounts[cat.id.toLowerCase()] || 0;
              return (
                <option
                  key={cat.id}
                  value={cat.id}
                  className="bg-white text-slate-800 font-semibold"
                >
                  {cat.icon} {cat.label} ({count})
                </option>
              );
            })}
          </select>
          <ChevronDown
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 ${
              selectedCategory !== 'all' ? 'text-white' : 'text-slate-500'
            }`}
          />
        </div>

        {/* 4. Button Semua Barang */}
        <button
          type="button"
          onClick={() => {
            setSelectedShelf('all');
            handleStatusChange('all');
            setSelectedCategory('all');
            setSearch('');
          }}
          className={`shrink-0 min-h-[38px] sm:min-h-[44px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer border ${
            isAllFilterReset
              ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm shadow-emerald-800/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80 shadow-2xs'
          }`}
        >
          <span className="text-sm sm:text-base leading-none">🏪</span>
          <span className="whitespace-nowrap">Semua Barang</span>
          <span
            className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
              isAllFilterReset
                ? 'bg-white/25 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {products.length}
          </span>
        </button>
      </div>

      {/* Sticky Multi-Select Delete Action Bar (Triggered by Long Press) */}
      {isSelectionMode && (
        <div className="sticky top-4 z-30 bg-slate-900 text-white rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center justify-between gap-2 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="p-1 rounded-lg hover:bg-slate-800 text-emerald-400 cursor-pointer"
              title="Pilih Semua"
            >
              {selectedIds.length === filteredProducts.length ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
            <span className="text-xs font-bold text-slate-100">
              {selectedIds.length} barang dipilih
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              title="Hapus barang terpilih"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors ml-1"
              title="Batal seleksi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* List of items */}
      <div className="space-y-2 sm:space-y-2.5 pt-0.5">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 text-center border border-stone-200/90 shadow-sm">
            <p className="text-xs sm:text-sm font-semibold text-slate-600">
              Tidak ada barang yang cocok dengan filter
            </p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock > 0 && p.stock <= p.minStock;
            const preset = PRESET_ICONS[p.iconType] || PRESET_ICONS['box'];
            const isSelected = selectedIds.includes(p.id);
            const isHighlighted = highlightedProductId === p.id;
            const shelfLabel = p.shelf && p.shelf.trim() ? p.shelf.trim() : 'Etalase Utama';

            return (
              <div
                id={`inventory-item-${p.id}`}
                key={p.id}
                onPointerDown={() => {
                  if (isHighlighted) onClearHighlight?.();
                  startLongPress(p.id);
                }}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onClick={() => {
                  if (isHighlighted) onClearHighlight?.();
                  if (isLongPressActiveRef.current) {
                    isLongPressActiveRef.current = false;
                    return;
                  }
                  if (isSelectionMode) {
                    toggleSelect(p.id);
                  } else {
                    onEditProduct(p);
                  }
                }}
                className={`relative bg-white rounded-xl lg:rounded-2xl px-3 py-3.5 lg:p-4 border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 lg:gap-4 min-h-0 select-none cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-emerald-600 bg-emerald-50/50 border-emerald-300 shadow-md'
                    : isHighlighted
                    ? 'animate-water-ripple'
                    : 'border-stone-200/90 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Bagian 1: Header Barang (Foto + Judul) & Info Harga Jual/Beli/Margin */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 w-full lg:w-auto lg:flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 lg:gap-3 w-full lg:w-auto lg:flex-1 min-w-0">
                    {isSelectionMode && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(p.id);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'border-2 border-slate-300 bg-white hover:border-emerald-600'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                    )}

                    <div
                      className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl ${
                        preset.bg
                      } flex items-center justify-center text-xl lg:text-2xl shrink-0 overflow-hidden relative shadow-2xs ${
                        isOutOfStock ? 'opacity-60 grayscale-[0.5]' : ''
                      }`}
                    >
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{preset.icon}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm lg:text-base font-bold text-slate-900 break-words leading-snug">
                          {p.name}
                        </h4>
                        {isHighlighted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 animate-pulse">
                            <span>💧</span> Tambah stok di sini
                          </span>
                        )}
                      </div>

                      {/* Tampilan Web / Tab Landscape: Harga sejajar & rapi di bawah nama produk dengan container soft badge */}
                      <div className="hidden lg:inline-flex items-center gap-2.5 mt-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/90 rounded-lg text-xs leading-normal whitespace-nowrap shadow-2xs">
                        <span className="text-slate-600 font-semibold">
                          Jual:{' '}
                          <span className="text-emerald-700 font-extrabold tabular-nums">
                            {formatRupiah(p.sellPrice)}
                          </span>
                        </span>
                        <span className="text-slate-300 select-none">|</span>
                        <span className="text-amber-900/80 font-semibold">
                          Beli:{' '}
                          <span className="text-amber-800 font-extrabold tabular-nums">
                            {formatRupiah(p.buyPrice)}
                          </span>
                        </span>
                        <span className="text-slate-300 select-none">|</span>
                        <div className="shrink-0">
                          {renderProfitBadge(p.sellPrice, p.buyPrice, 'text-xs')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tampilan HP & Tab Portrait (Saat space sempit): Strip Full Width Khusus Harga & Status Untung/Rugi */}
                  <div className="lg:hidden w-full bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-1 text-[10.5px] xs:text-[11px] sm:text-xs leading-normal whitespace-nowrap">
                    <span className="text-slate-600 font-semibold truncate shrink-0">
                      Jual:{' '}
                      <span className="text-emerald-700 font-extrabold tabular-nums">
                        {formatRupiah(p.sellPrice)}
                      </span>
                    </span>
                    <span className="text-slate-300 select-none shrink-0">|</span>
                    <span className="text-amber-900/80 font-semibold truncate shrink-0">
                      Beli:{' '}
                      <span className="text-amber-800 font-extrabold tabular-nums">
                        {formatRupiah(p.buyPrice)}
                      </span>
                    </span>
                    <span className="text-slate-300 select-none shrink-0">|</span>
                    <div className="shrink-0 truncate">
                      {renderProfitBadge(p.sellPrice, p.buyPrice, 'text-[10.5px] xs:text-[11px] sm:text-xs')}
                    </div>
                  </div>
                </div>

                {/* Bagian 2: Chip Info Rak & Chip Kategori */}
                <div className="w-full lg:w-auto border-t border-slate-200/80 lg:border-t-0 pt-2 lg:pt-0 flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 lg:gap-1.5 shrink-0">
                  <span
                    className="inline-flex items-center justify-center max-w-[60%] lg:max-w-none lg:w-44 text-center text-[10px] lg:text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 lg:py-1 rounded border border-amber-200/90 shadow-2xs truncate shrink-0"
                    title={`Rak / Etalase: ${shelfLabel}`}
                  >
                    🏷️ {shelfLabel}
                  </span>
                  <span className="inline-flex items-center justify-center min-w-[80px] lg:w-44 text-center text-[10px] lg:text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 lg:py-1 rounded uppercase font-bold tracking-wider border border-slate-300 shadow-2xs whitespace-nowrap shrink-0">
                    {p.category}
                  </span>
                </div>

                {/* Bagian 3: Status & Stepper Stok */}
                <div
                  className="flex items-center justify-between lg:justify-end gap-2 lg:gap-3 pt-2 lg:pt-0 border-t border-slate-200/80 lg:border-t-0 w-full lg:w-auto shrink-0"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Status Aman / Menipis / Habis */}
                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center justify-center w-20 py-1 rounded-xl text-xs font-bold border ${
                        isOutOfStock
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isLowStock
                          ? 'bg-orange-50 text-orange-600 border-orange-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isOutOfStock ? 'Habis' : isLowStock ? 'Menipis' : 'Tersedia'}
                    </span>
                  </div>

                  {/* Stepper Stok dengan [-] [input] [+] */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200/80 shadow-2xs">
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isHighlighted) onClearHighlight?.();
                          onQuickAdjustStock(p, -1);
                        }}
                        disabled={p.stock <= 0}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white disabled:opacity-30 disabled:cursor-not-allowed text-slate-800 hover:text-rose-600 flex items-center justify-center shadow-2xs active:scale-90 transition-transform cursor-pointer"
                        title="Kurang 1 stok"
                        aria-label="Kurangi stok"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9.]*"
                        value={formatThousands(p.stock.toString())}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isHighlighted) onClearHighlight?.();
                        }}
                        onFocus={() => {
                          if (isHighlighted) onClearHighlight?.();
                        }}
                        onChange={(e) => {
                          if (isHighlighted) onClearHighlight?.();
                          const digits = e.target.value.replace(/\D/g, '');
                          const newQty = digits === '' ? 0 : parseInt(digits, 10);
                          onQuickAdjustStock(p, newQty - p.stock);
                        }}
                        className="w-12 sm:w-14 text-center font-black text-slate-900 text-xs sm:text-sm bg-transparent outline-none focus:bg-white focus:rounded-md tabular-nums py-0.5"
                        title="Ketik jumlah stok (hanya angka)"
                        aria-label="Jumlah stok"
                      />

                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isHighlighted) onClearHighlight?.();
                          onQuickAdjustStock(p, 1);
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-slate-800 hover:text-emerald-700 flex items-center justify-center shadow-2xs active:scale-90 transition-transform cursor-pointer"
                        title="Tambah 1 stok"
                        aria-label="Tambah stok"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 mt-0.5 text-center truncate max-w-[80px]">
                      {p.unit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
