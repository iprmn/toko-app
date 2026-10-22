import React, { useState, useRef } from 'react';
import { Store, Save, Plus, Check, Trash2, Edit2, ShieldAlert, CheckCircle2, Camera, Image as ImageIcon } from 'lucide-react';
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
}

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
  transactions,
}) => {
  const activeStore = stores.find((s) => s.id === activeStoreId) || stores[0];

  const [activeStoreName, setActiveStoreName] = useState(activeStore?.name || '');
  const [activeOwnerName, setActiveOwnerName] = useState(activeStore?.ownerName || '');
  const [activeCategory, setActiveCategory] = useState(activeStore?.categoryOrType || '');
  const [activeLogoUrl, setActiveLogoUrl] = useState<string | undefined>(activeStore?.logoUrl);
  const [isSaved, setIsSaved] = useState(false);

  // New store form state
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newCategory, setNewCategory] = useState('Sembako & Kelontong');
  const [newLogoUrl, setNewLogoUrl] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const newStoreFileInputRef = useRef<HTMLInputElement>(null);

  // Sync when active store changes
  React.useEffect(() => {
    if (activeStore) {
      setActiveStoreName(activeStore.name);
      setActiveOwnerName(activeStore.ownerName);
      setActiveCategory(activeStore.categoryOrType || 'Toko Kelontong');
      setActiveLogoUrl(activeStore.logoUrl);
    }
  }, [activeStoreId, activeStore]);

  const totalAssetValue = products.reduce((acc, p) => acc + p.buyPrice * p.stock, 0);
  const totalPotentialSales = products.reduce((acc, p) => acc + p.sellPrice * p.stock, 0);
  const potentialProfit = totalPotentialSales - totalAssetValue;

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
    if (!activeStore) return;
    onUpdateStore(activeStore.id, {
      name: activeStoreName.trim() || 'Toko Saya',
      ownerName: activeOwnerName.trim() || 'Ibu Warung',
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
      ownerName: newOwnerName.trim() || activeStore?.ownerName || 'Pengelola Toko',
      categoryOrType: newCategory.trim() || 'Toko Kelontong',
      logoUrl: newLogoUrl,
    });

    setNewStoreName('');
    setNewOwnerName('');
    setNewLogoUrl(undefined);
    setIsAddingStore(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">
      
      {/* 1. KELOLA DAFTAR TOKO (MAX 3 TOKO) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-sm shadow-emerald-950/20 shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-normal">
                Kelola Toko ({stores.length}/3)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                Kelola hingga maksimal 3 cabang toko atau warung berbeda
              </p>
            </div>
          </div>

          {stores.length < 3 && !isAddingStore && (
            <button
              type="button"
              onClick={() => setIsAddingStore(true)}
              className="h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tambah Toko</span>
            </button>
          )}
        </div>

        {/* List of Existing Stores */}
        <div className="space-y-3">
          {stores.map((store, idx) => {
            const isActive = store.id === activeStoreId;
            return (
              <div
                key={store.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-600/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Store Logo / Icon */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative shadow-2xs ${
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
                      <span>{idx + 1}</span>
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate leading-normal">
                        {store.name}
                      </h4>
                      {isActive && (
                        <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktif
                        </span>
                      )}
                    </div>
                    {/* Jenis Toko */}
                    <p className="text-xs text-slate-500 font-medium leading-relaxed truncate">
                      {store.categoryOrType || 'Usaha Toko'}
                    </p>
                    {/* Informasi Pemilik Dijadikan Line Berikutnya */}
                    <p className="text-xs text-slate-500 font-medium leading-relaxed truncate">
                      Informasi Pemilik: <span className="text-slate-800 font-semibold">{store.ownerName}</span>
                    </p>
                  </div>
                </div>

                {/* Buttons: Pada mobile, Gunakan Toko Ini tombolnya sejajar dengan tombol hapus */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                  {!isActive ? (
                    <button
                      type="button"
                      onClick={() => onSelectStore(store.id)}
                      className="flex-1 sm:flex-initial sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-700 hover:text-white border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer text-center"
                    >
                      Gunakan Toko Ini
                    </button>
                  ) : (
                    <span className="flex-1 sm:flex-initial sm:w-auto text-xs font-semibold text-emerald-800 bg-emerald-100/60 sm:bg-transparent px-3 py-2.5 rounded-xl text-center">
                      Toko Sedang Digunakan
                    </span>
                  )}

                  {stores.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteStore(store.id)}
                      className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 sm:border-transparent rounded-xl transition-colors cursor-pointer shrink-0 flex items-center justify-center"
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
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 font-medium leading-relaxed flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-800 shrink-0" />
            <span>Maksimal 3 toko telah tercapai. Hapus salah satu cabang bila ingin membuka toko baru.</span>
          </div>
        )}

        {/* Add Store Form Modal / Drawer Inline */}
        {isAddingStore && stores.length < 3 && (
          <form
            onSubmit={handleCreateNewStore}
            className="p-4 sm:p-5 bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl space-y-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5 leading-normal">
                  Nama Toko Baru <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="Contoh: Toko Berkah Cabang 2, Toko Elektronik Jaya..."
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl text-sm font-bold text-slate-900 outline-none leading-normal"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 leading-normal">
                    Nama Pemilik / Kasir:
                  </label>
                  <input
                    type="text"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="Contoh: Ibu Siti / Pak Budi"
                    className="w-full h-11 px-3.5 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 outline-none leading-normal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 leading-normal">
                    Jenis Toko / Usaha:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 outline-none cursor-pointer leading-normal"
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
              </div>

              {/* Upload Logo untuk Toko Baru */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
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
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
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
                className="flex-1 h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan & Buka Toko Ini</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddingStore(false)}
                className="h-11 px-4 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. UBAH INFORMASI TOKO YANG SEDANG AKTIF */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-normal">
            Pengaturan Toko Aktif: "{activeStore?.name}"
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Perubahan ini berlaku untuk toko yang sedang Anda gunakan saat ini.
          </p>
        </div>

        <form onSubmit={handleSaveActiveStore} className="space-y-4">
          {/* Logo Toko Aktif */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-emerald-600/40 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs relative">
              {activeLogoUrl ? (
                <img
                  src={activeLogoUrl}
                  alt="Logo Toko"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-8 h-8 text-slate-400" />
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
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 leading-normal">
              Nama Toko:
            </label>
            <input
              type="text"
              value={activeStoreName}
              onChange={(e) => setActiveStoreName(e.target.value)}
              placeholder="Nama Toko..."
              className="w-full h-11 px-3.5 bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-600 rounded-xl text-sm font-bold text-slate-900 outline-none leading-normal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 leading-normal">
                Nama Pemilik / Kasir:
              </label>
              <input
                type="text"
                value={activeOwnerName}
                onChange={(e) => setActiveOwnerName(e.target.value)}
                placeholder="Nama Pemilik..."
                className="w-full h-11 px-3.5 bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 outline-none leading-normal"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 leading-normal">
                Jenis Usaha / Kategori:
              </label>
              <input
                type="text"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                placeholder="Contoh: Toko Kelontong..."
                className="w-full h-11 px-3.5 bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 outline-none leading-normal"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-800/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaved ? 'Perubahan Berhasil Disimpan!' : 'Simpan Nama Toko Ini'}</span>
          </button>
        </form>
      </div>

      {/* 3. RINGKASAN NILAI MODAL DAGANGAN TOKO */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider leading-normal">
            💎 Nilai Modal Barang di Toko Ini
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-1">
            Perkiraan modal yang sedang tersimpan dalam bentuk stok barang aktif:
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1">
            <span className="text-xs text-slate-500 font-medium leading-normal">
              Total Nilai Modal (Harga Beli):
            </span>
            <div className="text-base sm:text-xl font-black text-slate-900 tabular-nums leading-normal">
              {formatRupiah(totalAssetValue)}
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl space-y-1">
            <span className="text-xs text-emerald-800 font-medium leading-normal">
              Potensi Keuntungan:
            </span>
            <div className="text-base sm:text-xl font-black text-emerald-800 tabular-nums leading-normal">
              +{formatRupiah(potentialProfit)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
