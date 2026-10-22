import React, { useState, useRef } from 'react';
import {
  Plus,
  Minus,
  AlertTriangle,
  Edit3,
  Trash2,
  CheckSquare,
  Square,
  Check,
  X,
  Search,
  HelpCircle,
} from 'lucide-react';
import { Product } from '../types/store';
import { formatRupiah } from '../utils/format';
import { PRESET_ICONS } from '../data/initialProducts';

interface InventoryViewProps {
  products: Product[];
  onQuickAdjustStock: (product: Product, delta: number) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteMultipleProducts?: (productIds: string[]) => void;
  onOpenRestock: (productId?: string) => void;
  onOpenAddProduct: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onQuickAdjustStock,
  onEditProduct,
  onDeleteProduct,
  onDeleteMultipleProducts,
  onOpenRestock,
  onOpenAddProduct,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');
  const [selectedShelf, setSelectedShelf] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Unique shelves for shelf filter
  const allShelves = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.shelf && p.shelf.trim()) set.add(p.shelf.trim());
    });
    return Array.from(set);
  }, [products]);

  // Long press tracking for mobile
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressActiveRef = useRef<boolean>(false);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.shelf && p.shelf.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;

    if (selectedShelf !== 'all') {
      if ((p.shelf || 'Tanpa Rak') !== selectedShelf) return false;
    }

    if (filterType === 'low') return p.stock > 0 && p.stock <= p.minStock;
    if (filterType === 'out') return p.stock <= 0;
    return true;
  });

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  const isSelectionMode = selectedIds.length > 0;

  // Single delete
  const handleDeleteWithConfirm = (product: Product) => {
    const confirmed = window.confirm(
      `⚠️ KONFIRMASI HAPUS BARANG\n\nApakah Anda yakin ingin menghapus "${product.name}" dari stok toko?\n\nData barang ini akan dihapus secara permanen.`
    );
    if (confirmed) {
      onDeleteProduct(product.id);
      setSelectedIds((prev) => prev.filter((id) => id !== product.id));
    }
  };

  // Bulk delete selected
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const confirmed = window.confirm(
      `⚠️ KONFIRMASI HAPUS ${count} BARANG\n\nApakah Anda yakin ingin menghapus ${count} barang yang dipilih dari stok toko?\n\nData ini akan dihapus secara permanen.`
    );
    if (confirmed) {
      if (onDeleteMultipleProducts) {
        onDeleteMultipleProducts(selectedIds);
      } else {
        selectedIds.forEach((id) => onDeleteProduct(id));
      }
      setSelectedIds([]);
    }
  };

  const handleEditSelected = () => {
    if (selectedIds.length !== 1) return;
    const target = products.find((p) => p.id === selectedIds[0]);
    if (target) {
      onEditProduct(target);
      setSelectedIds([]);
    }
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

  // Long press events for mobile
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
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">
                Pengelolaan Stock
              </h2>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="Buka petunjuk pengelolaan barang"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
                <span>Petunjuk</span>
              </button>
            </div>
            <p className="block lg:hidden text-xs text-slate-500 mt-1.5 leading-relaxed">
              Klik kartu untuk ubah • Tekan lama kartu untuk hapus
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenAddProduct}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-800/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Barang Baru</span>
          </button>
        </div>

        {/* Modal Petunjuk Pengelolaan */}
        {showGuideModal && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setShowGuideModal(false)}
          >
            <div
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4"
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

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs text-slate-700 leading-relaxed">
                <p className="font-bold text-slate-900 text-sm">
                  Klik/tap kartu barang untuk melakukan ubah, dan tekan lama kartu barang untuk melakukan hapus.
                </p>
                <div className="pt-1 space-y-1.5 text-slate-600 text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-700 shrink-0">• Klik/Tap:</span>
                    <span>Membuka formulir untuk mengubah rincian barang (harga, nama, kategori, rak, foto).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-rose-700 shrink-0">• Tekan Lama:</span>
                    <span>Mengaktifkan pilihan untuk menghapus satu atau beberapa barang.</span>
                  </div>
                </div>
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

        {/* 3 Filter Sejajar: Semua, Menipis, Habis */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('low')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
              filterType === 'low'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Menipis ({lowStockCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('out')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
              filterType === 'out'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <span>Habis ({outOfStockCount})</span>
          </button>
        </div>

        {/* Search box di bawah card pengelolaan stock untuk mempermudah pencarian */}
        <div className="pt-2 border-t border-slate-100">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-emerald-700" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama barang atau kategori di stok..."
              className="w-full h-10 pl-10 pr-9 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Hapus pencarian stok"
              >
                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                  <X className="w-3 h-3 text-slate-600" />
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Filter Rak / Etalase */}
        {allShelves.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap shrink-0 flex items-center gap-1">
              <span>🏷️ Filter Rak:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedShelf('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedShelf === 'all'
                  ? 'bg-amber-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Rak
            </button>
            {allShelves.map((sh) => (
              <button
                key={sh}
                type="button"
                onClick={() => setSelectedShelf(sh)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedShelf === sh
                    ? 'bg-amber-800 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100'
                }`}
              >
                {sh}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating / Sticky Mobile & Tablet Multi-Select Action Bar */}
      {isSelectionMode && (
        <div className="sticky top-20 z-30 bg-slate-900 text-white rounded-2xl p-3 shadow-xl flex items-center justify-between gap-2 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="p-1 rounded-lg hover:bg-slate-800 text-emerald-400"
              title="Pilih Semua"
            >
              {selectedIds.length === filteredProducts.length ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
            <span className="text-xs font-bold text-slate-100">
              {selectedIds.length} terpilih
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tombol Ubah (jika hanya 1 barang dipilih) */}
            {selectedIds.length === 1 && (
              <button
                type="button"
                onClick={handleEditSelected}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Ubah rincian barang"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ubah</span>
              </button>
            )}

            {/* Tombol Hapus Barang Terpilih */}
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              title="Hapus barang terpilih"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedIds.length})</span>
            </button>

            {/* Batal seleksi */}
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
      <div className="space-y-2.5">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-stone-200/90 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">
              Tidak ada barang yang cocok dengan filter
            </p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isOutOfStock = p.stock <= 0;
            const isLowStock = p.stock > 0 && p.stock <= p.minStock;
            const preset = PRESET_ICONS[p.iconType] || PRESET_ICONS['box'];
            const isSelected = selectedIds.includes(p.id);

            return (
              <div
                key={p.id}
                onPointerDown={() => startLongPress(p.id)}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onClick={() => {
                  if (isLongPressActiveRef.current) {
                    isLongPressActiveRef.current = false;
                    return;
                  }
                  if (isSelectionMode) {
                    toggleSelect(p.id);
                  }
                }}
                className={`relative bg-white rounded-2xl p-3.5 sm:p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none ${
                  isSelected
                    ? 'ring-2 ring-emerald-600 bg-emerald-50/50 border-emerald-300 shadow-md'
                    : 'border-stone-200/90 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Top Area: Selection Checkbox, Icon / Foto, and Full-Width Title */}
                <div className="flex items-center gap-3 w-full">
                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(p.id);
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'border-2 border-slate-300 bg-white hover:border-emerald-600'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  )}

                  {/* Icon or Uploaded Foto Container */}
                  <div
                    className={`w-12 h-12 rounded-xl ${
                      preset.bg
                    } flex items-center justify-center text-2xl shrink-0 overflow-hidden relative shadow-2xs ${
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

                  {/* Full-width Title */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 break-words leading-snug">
                      {p.name}
                    </h4>
                  </div>
                </div>

                {/* LINE DIVIDER YANG LEBIH JELAS & HARGA JUAL/BELI LEBIH BESAR + KATEGORI RATA KANAN */}
                <div className="w-full border-t border-slate-300 pt-2.5 flex items-center justify-between gap-2 text-xs sm:text-sm">
                  {/* Harga Jual dan Beli diperbesar 1 ukuran */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-slate-600 font-medium">
                      Jual: <span className="text-emerald-700 font-extrabold tabular-nums">{formatRupiah(p.sellPrice)}</span>
                    </span>
                    <span className="text-slate-400 font-normal">|</span>
                    <span className="text-slate-600 font-medium">
                      Beli: <span className="text-slate-900 font-bold tabular-nums">{formatRupiah(p.buyPrice)}</span>
                    </span>
                  </div>

                  {/* Kategori dipindahkan sejajar setelah beli, rata kanan */}
                  <div className="ml-auto flex items-center gap-1.5 shrink-0">
                    {p.shelf && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/90 shadow-2xs truncate max-w-[90px] sm:max-w-[120px]" title={`Rak / Etalase: ${p.shelf}`}>
                        🏷️ {p.shelf}
                      </span>
                    )}
                    <span className="inline-block w-22 sm:w-24 text-center text-[10px] text-slate-700 bg-slate-100 px-2 py-1 rounded-md uppercase font-bold tracking-wider border border-slate-300 shadow-2xs truncate">
                      {p.category}
                    </span>
                  </div>
                </div>

                {/* Bottom / Actions Area (Status di kiri, Stepper di kanan) */}
                <div className="flex items-center justify-between gap-2.5 sm:gap-3 pt-2.5 border-t border-slate-200/80 w-full shrink-0">
                  {/* Status Aman / Menipis / Habis dengan Lebar Seragam (w-20) */}
                  <div className="shrink-0">
                    <span
                      className={`inline-flex items-center justify-center w-20 py-1 rounded-xl text-xs font-bold border ${
                        isOutOfStock
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isLowStock
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isOutOfStock ? 'Habis' : isLowStock ? 'Menipis' : 'Aman'}
                    </span>
                  </div>

                  {/* Stepper dengan input angka manual di antara [-] dan [+], satuan tepat di bawahnya */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200/80 shadow-2xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
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
                        pattern="[0-9]*"
                        value={p.stock}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          const newQty = digits === '' ? 0 : parseInt(digits, 10);
                          onQuickAdjustStock(p, newQty - p.stock);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-12 sm:w-14 text-center font-black text-slate-900 text-xs sm:text-sm bg-transparent outline-none focus:bg-white focus:rounded-md tabular-nums py-0.5"
                        title="Ketik jumlah stok (hanya angka)"
                        aria-label="Jumlah stok"
                      />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAdjustStock(p, 1);
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-slate-800 hover:text-emerald-700 flex items-center justify-center shadow-2xs active:scale-90 transition-transform cursor-pointer"
                        title="Tambah 1 stok"
                        aria-label="Tambah stok"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Satuan tepat di bawah angka */}
                    <span className="text-[10px] font-semibold text-slate-500 mt-0.5 text-center truncate max-w-[80px]">
                      {p.unit}
                    </span>
                  </div>

                  {/* Tombol Edit & Delete HANYA untuk Desktop (lg). Tablet & mobile menggunakan seleksi tekan lama */}
                  <div className="hidden lg:flex items-center gap-1 shrink-0 ml-1 border-l border-slate-200 pl-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProduct(p);
                      }}
                      className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                      title="Ubah Rincian"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWithConfirm(p);
                      }}
                      className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer transition-colors"
                      title="Hapus Barang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
