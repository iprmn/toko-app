import React, { useState, useRef } from 'react';
import { Store, Save, Plus, Trash2, ShieldAlert, Camera } from 'lucide-react';
import { StoreAccount, Product, Transaction } from '../types/store';
import { formatRupiah } from '../utils/format';

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
  let potentialGain = 0;
  let potentialLoss = 0;
  products.forEach((p) => {
    const stock = Math.max(0, p.stock);
    const diff = (p.sellPrice - p.buyPrice) * stock;
    if (diff > 0) {
      potentialGain += diff;
    } else if (diff < 0) {
      potentialLoss += Math.abs(diff);
    }
  });

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-0.5">
          <div className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-2xl space-y-1">
            <span className="text-xs text-slate-500 font-medium leading-snug block truncate">
              Total Nilai Modal:
            </span>
            <div className="text-base sm:text-xl font-black text-slate-900 tabular-nums leading-snug truncate">
              {formatRupiah(totalAssetValue)}
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-3 sm:p-4 rounded-2xl space-y-1">
            <span className="text-xs text-emerald-800 font-medium leading-snug block truncate">
              Potensi Keuntungan:
            </span>
            <div className="text-base sm:text-xl font-black text-emerald-800 tabular-nums leading-snug truncate">
              +{formatRupiah(potentialGain)}
            </div>
          </div>
          <div className="bg-rose-50 border border-rose-100 p-3 sm:p-4 rounded-2xl space-y-1">
            <span className="text-xs text-rose-700 font-medium leading-snug block truncate">
              Potensi Kerugian:
            </span>
            <div className="text-base sm:text-xl font-black text-rose-700 tabular-nums leading-snug truncate">
              -{formatRupiah(potentialLoss)}
            </div>
          </div>
        </div>
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
