import React, { useState, useRef } from 'react';
import { Store, Save, Plus, Trash2, ShieldAlert, Camera, ChevronDown } from 'lucide-react';
import { StoreAccount, Product, Transaction } from '../types/store';
import { formatRupiah, formatRupiahFull } from '../utils/format';

interface SettingsViewProps {
  stores: StoreAccount[];
  activeStoreId: string;
  onSelectStore: (storeId: string) => void;
  onAddStore: (newStore: { name: string; ownerName: string; categoryOrType: string; logoUrl?: string }) => void;
  onUpdateStore: (storeId: string, data: Partial<StoreAccount>) => void;
  onDeleteStore: (storeId: string) => void;
  products: Product[];
  transactions: Transaction[];
  fontSizeLevel: number;
  onChangeFontSizeLevel: (level: number) => void;
}

const FONT_CHECKPOINTS = [
  { level: 1, label: 'Kecil' },
  { level: 2, label: 'Normal' },
  { level: 3, label: 'Besar' },
  { level: 4, label: 'Ekstra' },
];

// Client-side image compression for store logo
const compressStoreLogo = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  stores,
  activeStoreId,
  onSelectStore,
  onAddStore,
  onUpdateStore,
  onDeleteStore,
  products,
  fontSizeLevel,
  onChangeFontSizeLevel,
}) => {
  const activeStore = stores.find((s) => s.id === activeStoreId) || stores[0];

  const [activeStoreName, setActiveStoreName] = useState(activeStore?.name || '');
  const [activeCategory, setActiveCategory] = useState(activeStore?.categoryOrType || '');
  const [activeLogoUrl, setActiveLogoUrl] = useState<string | undefined>(activeStore?.logoUrl);
  const [isSaved, setIsSaved] = useState(false);

  // New store form state
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newCategory, setNewCategory] = useState('Sembako & Kelontong');
  const [newLogoUrl, setNewLogoUrl] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const newStoreFileInputRef = useRef<HTMLInputElement>(null);

  // Sync when active store changes
  React.useEffect(() => {
    if (activeStore) {
      setActiveStoreName(activeStore.name);
      setActiveCategory(activeStore.categoryOrType || 'Toko Kelontong');
      setActiveLogoUrl(activeStore.logoUrl);
    } else {
      setActiveStoreName('');
      setActiveCategory('');
      setActiveLogoUrl(undefined);
    }
  }, [activeStoreId, activeStore]);

  const totalAssetValue = products.reduce((acc, p) => acc + p.buyPrice * Math.max(0, p.stock), 0);
  
  const [isProfitDetailOpen, setIsProfitDetailOpen] = useState(false);
  const [detailFilter, setDetailFilter] = useState<'all' | 'profit' | 'loss' | 'neutral'>('all');

  const profitableProducts: Array<{ product: Product; profitPerUnit: number; totalProfit: number }> = [];
  const lossProducts: Array<{ product: Product; lossPerUnit: number; totalLoss: number }> = [];
  const neutralProducts: Array<{ product: Product }> = [];

  let potentialGain = 0;
  let potentialLoss = 0;
  products.forEach((p) => {
    const stock = Math.max(0, p.stock);
    const diff = p.sellPrice - p.buyPrice;
    if (diff > 0) {
      const totalDiff = diff * stock;
      potentialGain += totalDiff;
      profitableProducts.push({ product: p, profitPerUnit: diff, totalProfit: totalDiff });
    } else if (diff < 0) {
      const totalDiff = Math.abs(diff) * stock;
      potentialLoss += totalDiff;
      lossProducts.push({ product: p, lossPerUnit: Math.abs(diff), totalLoss: totalDiff });
    } else {
      neutralProducts.push({ product: p });
    }
  });

  const netProfit = potentialGain - potentialLoss;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNewStore = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressStoreLogo(file);
      if (isNewStore) {
        setNewLogoUrl(compressed);
      } else {
        setActiveLogoUrl(compressed);
        if (activeStore) {
          onUpdateStore(activeStore.id, { logoUrl: compressed });
        }
      }
    } catch {
      alert('Gagal memproses gambar logo. Coba gunakan foto lain.');
    }
  };

  const handleSaveActiveStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) {
      onAddStore({
        name: activeStoreName.trim() || 'Toko Saya',
        ownerName: '-',
        categoryOrType: activeCategory.trim() || 'Toko Kelontong',
        logoUrl: activeLogoUrl,
      });
      return;
    }
    onUpdateStore(activeStore.id, {
      name: activeStoreName.trim() || 'Toko Saya',
      categoryOrType: activeCategory.trim() || 'Toko Kelontong',
      logoUrl: activeLogoUrl,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCreateNewStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      alert('Mohon isi nama toko baru!');
      return;
    }
    if (stores.length >= 3) {
      alert('Maksimal 3 toko! Hapus salah satu toko jika ingin menambah toko baru.');
      return;
    }

    onAddStore({
      name: newStoreName.trim(),
      ownerName: '-',
      categoryOrType: newCategory.trim() || 'Toko Kelontong',
      logoUrl: newLogoUrl,
    });

    setNewStoreName('');
    setNewLogoUrl(undefined);
    setIsAddingStore(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 pb-6">
      {/* 1. KELOLA DAFTAR TOKO (MAX 3 TOKO) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-stone-200/90 shadow-sm space-y-3.5 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-100 pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-sm shadow-emerald-950/20 shrink-0">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-normal">
                Kelola Toko ({stores.length}/3)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                Kelola hingga maksimal 3 toko
              </p>
            </div>
          </div>

          {stores.length < 3 && !isAddingStore && (
            <button
              type="button"
              onClick={() => setIsAddingStore(true)}
              className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Toko</span>
            </button>
          )}
        </div>

        {/* List of Existing Stores */}
        <div className="space-y-2.5 sm:space-y-3">
          {stores.length === 0 && !isAddingStore && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs sm:text-sm text-slate-500 font-medium">
              Belum ada toko terdaftar. Klik tombol <span className="font-bold text-emerald-800">+ Tambah Toko</span> untuk membuat toko pertama Anda.
            </div>
          )}
          {stores.map((store) => {
            const isActive = store.id === activeStoreId;
            return (
              <div
                key={store.id}
                className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 ${
                  isActive
                    ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-600/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative shadow-2xs ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {store.logoUrl ? (
                      <img
                        src={store.logoUrl}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate leading-normal">
                        {store.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed truncate">
                      {store.categoryOrType || 'Usaha Toko'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto mt-1 sm:mt-0">
                  {!isActive ? (
                    <button
                      type="button"
                      onClick={() => onSelectStore(store.id)}
                      className="flex-1 sm:flex-initial sm:w-auto px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white hover:bg-emerald-700 hover:text-white border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer text-center"
                    >
                      Gunakan Toko Ini
                    </button>
                  ) : (
                    <span className="flex-1 sm:flex-initial sm:w-auto text-xs font-semibold text-emerald-800 bg-emerald-100/60 sm:bg-transparent px-3 py-2 sm:py-2.5 rounded-xl text-center">
                      Toko Sedang Digunakan
                    </span>
                  )}

                  {stores.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteStore(store.id)}
                      className="p-2 sm:p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 sm:border-transparent rounded-xl transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                      title="Hapus cabang toko ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Max Stores Reached Notice */}
        {stores.length >= 3 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 font-medium leading-relaxed flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-800 shrink-0" />
            <span>Maksimal 3 toko telah tercapai. Hapus salah satu cabang bila ingin membuka toko baru.</span>
          </div>
        )}

        {/* Add Store Form Modal / Drawer Inline */}
        {isAddingStore && stores.length < 3 && (
          <form
            onSubmit={handleCreateNewStore}
            className="p-3.5 sm:p-5 bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl space-y-3.5 sm:space-y-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-800" />
                <span>Tambah Toko Baru (Toko ke-{stores.length + 1} dari 3)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingStore(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Batal
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 leading-normal">
                  Nama Toko Baru <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="Contoh: Toko Berkah Cabang 2, Toko Elektronik Jaya..."
                  className="w-full h-10 sm:h-11 px-3 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none leading-normal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 leading-normal">
                  Jenis Toko / Usaha:
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-10 sm:h-11 px-3 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none cursor-pointer leading-normal"
                >
                  <option value="Sembako & Kelontong">🍚 Sembako & Kelontong</option>
                  <option value="Elektronik & Gadget">⚡ Elektronik & Gadget</option>
                  <option value="Pakaian & Fashion">👕 Pakaian & Fashion</option>
                  <option value="Aksesoris & Perhiasan">👜 Aksesoris & Perhiasan</option>
                  <option value="Minuman & Kopi">☕ Minuman & Kopi</option>
                  <option value="ATK & Buku">📚 ATK & Buku</option>
                  <option value="Usaha Lainnya">📦 Usaha Lainnya</option>
                </select>
              </div>

              {/* Upload Logo untuk Toko Baru */}
              <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                    {newLogoUrl ? (
                      <img src={newLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Logo Toko (Opsional)</span>
                    <span className="text-[10px] text-slate-400">Pilih foto logo toko baru</span>
                  </div>
                </div>
                <div>
                  <input
                    type="file"
                    ref={newStoreFileInputRef}
                    onChange={(e) => handleLogoUpload(e, true)}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => newStoreFileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{newLogoUrl ? 'Ganti' : 'Pilih Logo'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 h-10 sm:h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan & Buka Toko Ini</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddingStore(false)}
                className="h-10 sm:h-11 px-3.5 sm:px-4 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. UBAH INFORMASI TOKO YANG SEDANG AKTIF */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-stone-200/90 shadow-sm space-y-3.5 sm:space-y-5">
        <div className="border-b border-slate-100 pb-2.5 sm:pb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-normal">
            Pengaturan Toko
          </h2>
        </div>

        <form onSubmit={handleSaveActiveStore} className="space-y-3.5 sm:space-y-4">
          {/* Logo Toko Aktif */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-dashed border-emerald-600/40 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative">
              {activeLogoUrl ? (
                <img
                  src={activeLogoUrl}
                  alt="Logo Toko"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400" />
              )}
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="text-xs font-bold text-slate-800">Logo Toko</div>
              <p className="text-[11px] text-slate-500">
                Unggah foto atau logo toko Anda (tampil di navbar & kartu toko).
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleLogoUpload(e, false)}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{activeLogoUrl ? 'Ganti Logo' : 'Upload Logo Toko'}</span>
                </button>
                {activeLogoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveLogoUrl(undefined);
                      if (activeStore) {
                        onUpdateStore(activeStore.id, { logoUrl: undefined });
                      }
                    }}
                    className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Hapus Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 leading-normal">
                Nama Toko:
              </label>
              <input
                type="text"
                value={activeStoreName}
                onChange={(e) => setActiveStoreName(e.target.value)}
                placeholder="Nama Toko..."
                className="w-full h-10 sm:h-11 px-3 sm:px-3.5 bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-600 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none leading-normal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 leading-normal">
                Jenis Usaha / Kategori:
              </label>
              <input
                type="text"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                placeholder="Contoh: Toko Kelontong..."
                className="w-full h-10 sm:h-11 px-3 sm:px-3.5 bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-600 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none leading-normal"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-10 sm:h-12 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-800/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaved ? 'Perubahan Berhasil Disimpan!' : 'Simpan Nama Toko Ini'}</span>
          </button>
        </form>
      </div>

      {/* 3. RINGKASAN NILAI MODAL DAGANGAN TOKO */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-stone-200/90 shadow-sm space-y-3 sm:space-y-4">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider leading-normal">
            💎 Nilai Modal Barang di Toko Ini
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-0.5 sm:mt-1">
            Perkiraan modal yang sedang tersimpan dalam bentuk stok barang aktif:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-0.5">
          {/* Card 1: Total Nilai Modal */}
          <div className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-2xl space-y-1">
            <span className="text-xs text-slate-500 font-medium leading-snug block truncate">
              Total Nilai Modal:
            </span>
            <div className="text-base sm:text-xl font-black text-slate-900 tabular-nums leading-snug truncate">
              {formatRupiahFull(totalAssetValue)}
            </div>
          </div>

          {/* Card 2: Total Keuntungan (Bisa Untung / Rugi) dengan Dropdown Detail */}
          <div
            onClick={() => setIsProfitDetailOpen(!isProfitDetailOpen)}
            className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer space-y-1 select-none ${
              netProfit > 0
                ? 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-300 ring-1 ring-emerald-500/10'
                : netProfit < 0
                ? 'bg-rose-50/80 border-rose-200 hover:border-rose-300 ring-1 ring-rose-500/10'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-xs font-bold leading-snug block truncate ${
                  netProfit > 0
                    ? 'text-emerald-800'
                    : netProfit < 0
                    ? 'text-rose-700'
                    : 'text-slate-600'
                }`}
              >
                Total Keuntungan:
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfitDetailOpen(!isProfitDetailOpen);
                }}
                className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all shrink-0 cursor-pointer ${
                  netProfit > 0
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                    : netProfit < 0
                    ? 'bg-rose-100 text-rose-700 border-rose-300 hover:bg-rose-200'
                    : 'bg-slate-200/80 text-slate-700 border-slate-300 hover:bg-slate-300'
                }`}
              >
                <span>{isProfitDetailOpen ? 'Tutup Detail' : 'Lihat Detail'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isProfitDetailOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
            <div
              className={`text-base sm:text-xl font-black tabular-nums leading-snug truncate ${
                netProfit > 0
                  ? 'text-emerald-800'
                  : netProfit < 0
                  ? 'text-rose-700'
                  : 'text-slate-900'
              }`}
            >
              {netProfit > 0
                ? `+${formatRupiahFull(netProfit)}`
                : netProfit < 0
                ? `-${formatRupiahFull(Math.abs(netProfit))}`
                : 'Rp 0'}
            </div>
          </div>
        </div>

        {/* Dropdown Rincian: Barang Untung, Barang Rugi, Barang Tidak Untung */}
        {isProfitDetailOpen && (
          <div className="mt-3 p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* 4 Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
              <button
                type="button"
                onClick={() => setDetailFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  detailFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Semua ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailFilter('profit')}
                className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  detailFilter === 'profit'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Untung ({profitableProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailFilter('loss')}
                className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  detailFilter === 'loss'
                    ? 'bg-rose-700 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                Rugi ({lossProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailFilter('neutral')}
                className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  detailFilter === 'neutral'
                    ? 'bg-amber-800 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Tidak Untung ({neutralProducts.length})
              </button>
            </div>

            {/* 3 Summary Mini-Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* 1. Barang Untung */}
              <div
                onClick={() => setDetailFilter('profit')}
                className={`p-2.5 rounded-xl space-y-0.5 border cursor-pointer transition-all ${
                  detailFilter === 'profit'
                    ? 'bg-emerald-100/80 border-emerald-400 ring-2 ring-emerald-600/20'
                    : 'bg-emerald-50/90 border-emerald-200/90 hover:bg-emerald-100/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900">Barang Untung</span>
                  <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded-full">
                    {profitableProducts.length}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-black text-emerald-800 tabular-nums">
                  +{formatRupiahFull(potentialGain)}
                </div>
              </div>

              {/* 2. Barang Rugi */}
              <div
                onClick={() => setDetailFilter('loss')}
                className={`p-2.5 rounded-xl space-y-0.5 border cursor-pointer transition-all ${
                  detailFilter === 'loss'
                    ? 'bg-rose-100/80 border-rose-400 ring-2 ring-rose-600/20'
                    : 'bg-rose-50/90 border-rose-200/90 hover:bg-rose-100/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-900">Barang Rugi</span>
                  <span className="text-[10px] font-bold bg-rose-200/80 text-rose-900 px-1.5 py-0.2 rounded-full">
                    {lossProducts.length}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-black text-rose-700 tabular-nums">
                  -{formatRupiahFull(potentialLoss)}
                </div>
              </div>

              {/* 3. Barang Tidak Untung */}
              <div
                onClick={() => setDetailFilter('neutral')}
                className={`p-2.5 rounded-xl space-y-0.5 border cursor-pointer transition-all ${
                  detailFilter === 'neutral'
                    ? 'bg-amber-100/80 border-amber-400 ring-2 ring-amber-600/20'
                    : 'bg-amber-50/90 border-amber-200/90 hover:bg-amber-100/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900">Barang Tidak Untung</span>
                  <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-full">
                    {neutralProducts.length}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-black text-amber-800 tabular-nums">
                  Rp 0
                </div>
              </div>
            </div>

            {/* List Barang sesuai filter */}
            <div className="space-y-1.5 max-h-64 sm:max-h-80 overflow-y-auto pr-1">
              {/* Rincian Barang Untung */}
              {(detailFilter === 'all' || detailFilter === 'profit') && (
                <div className="space-y-1">
                  {detailFilter === 'all' && (
                    <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider px-1 pt-1">
                      🟢 Barang Untung ({profitableProducts.length})
                    </div>
                  )}
                  {profitableProducts.length === 0 ? (
                    <div className="p-2 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                      Tidak ada barang dengan margin untung
                    </div>
                  ) : (
                    profitableProducts.map(({ product: p, profitPerUnit, totalProfit }) => (
                      <div
                        key={`profit-${p.id}`}
                        className="bg-white border border-emerald-100 hover:border-emerald-200 p-2 sm:p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 truncate">{p.name}</div>
                          <div className="text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 mt-1 sm:mt-0.5 leading-snug">
                            <span>Beli: {formatRupiahFull(p.buyPrice)}</span>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span>Jual: {formatRupiahFull(p.sellPrice)}</span>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span className="text-emerald-700 font-bold">
                              Untung + {formatRupiahFull(profitPerUnit)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-black text-emerald-800 tabular-nums text-xs sm:text-sm">
                            +{formatRupiahFull(totalProfit)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Stok: {p.stock} {p.unit}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Rincian Barang Rugi */}
              {(detailFilter === 'all' || detailFilter === 'loss') && (
                <div className="space-y-1 pt-1.5">
                  {detailFilter === 'all' && (
                    <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider px-1 pt-1">
                      🔴 Barang Rugi ({lossProducts.length})
                    </div>
                  )}
                  {lossProducts.length === 0 ? (
                    <div className="p-2 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                      Tidak ada barang rugi (Aman)
                    </div>
                  ) : (
                    lossProducts.map(({ product: p, lossPerUnit, totalLoss }) => (
                      <div
                        key={`loss-${p.id}`}
                        className="bg-white border border-rose-100 hover:border-rose-200 p-2 sm:p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 truncate">{p.name}</div>
                          <div className="text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 mt-1 sm:mt-0.5 leading-snug">
                            <span>Beli: {formatRupiahFull(p.buyPrice)}</span>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span>Jual: {formatRupiahFull(p.sellPrice)}</span>
                            <span className="hidden sm:inline text-slate-300">•</span>
                            <span className="text-rose-600 font-bold">
                              Rugi - {formatRupiahFull(lossPerUnit)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-black text-rose-700 tabular-nums text-xs sm:text-sm">
                            -{formatRupiahFull(totalLoss)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Stok: {p.stock} {p.unit}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Rincian Barang Tidak Untung */}
              {(detailFilter === 'all' || detailFilter === 'neutral') && (
                <div className="space-y-1 pt-1.5">
                  {detailFilter === 'all' && (
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider px-1 pt-1">
                      ⚖️ Barang Tidak Untung ({neutralProducts.length})
                    </div>
                  )}
                  {neutralProducts.length === 0 ? (
                    <div className="p-2 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                      Tidak ada barang tidak untung
                    </div>
                  ) : (
                    neutralProducts.map(({ product: p }) => (
                      <div
                        key={`neutral-${p.id}`}
                        className="bg-white border border-amber-100 hover:border-amber-200 p-2 sm:p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-800 truncate">{p.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 sm:gap-2 flex-wrap mt-0.5">
                            <span>Harga Beli = Jual: {formatRupiahFull(p.sellPrice)}</span>
                            <span>•</span>
                            <span className="text-amber-800 font-bold">Tidak untung</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-slate-700 tabular-nums text-xs sm:text-sm">
                            Rp 0
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Stok: {p.stock} {p.unit}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. ATUR UKURAN HURUF (CHECKPOINT BAR 4 UKURAN) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-stone-200/90 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-2.5 sm:pb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-normal">
            Atur Ukuran Huruf
          </h2>
        </div>

        <div className="pt-1 pb-1 px-2 sm:px-4">
          {/* Checkpoint Bar Track & Nodes */}
          <div className="relative flex items-center justify-between">
            {/* Background Track (Neutral Gray) */}
            <div className="absolute left-4 right-4 h-1.5 bg-slate-200 rounded-full pointer-events-none" />

            {FONT_CHECKPOINTS.map((cp) => {
              const isSelected = fontSizeLevel === cp.level;
              return (
                <button
                  key={cp.level}
                  type="button"
                  onClick={() => onChangeFontSizeLevel(cp.level)}
                  className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-emerald-700 text-white ring-4 ring-emerald-600/25 scale-110 shadow-sm'
                        : 'bg-white border-2 border-slate-300 text-slate-500 hover:border-emerald-500'
                    }`}
                  >
                    {cp.level}
                  </div>
                  <span
                    className={`text-xs font-bold transition-colors ${
                      isSelected ? 'text-emerald-800' : 'text-slate-500'
                    }`}
                  >
                    {cp.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Powered By */}
      <div className="pt-5 pb-3 text-center">
        <p className="text-xs font-medium text-slate-400 tracking-wide">
          Powered by: Wong Cilik Digital
        </p>
      </div>
    </div>
  );
};
