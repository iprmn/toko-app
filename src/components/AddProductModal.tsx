import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Check, Package, Camera, Upload, Trash2, ChevronDown, RefreshCw } from 'lucide-react';
import { Product, ProductCategory } from '../types/store';
import { PRESET_ICONS, MASTER_DEPARTMENTS } from '../data/initialProducts';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (productData: Partial<Product>) => void;
  initialProduct?: Product | null;
  existingShelves?: string[];
}

// Helper to compress raw camera/gallery images into compact data URL
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 500;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSaveProduct,
  initialProduct,
  existingShelves = [],
}) => {
  const [departmentId, setDepartmentId] = useState<string>('sembako');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('sembako');
  const [sellPrice, setSellPrice] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [minStock, setMinStock] = useState('3');
  const [unit, setUnit] = useState('pcs');
  const [shelf, setShelf] = useState('');
  const [isShelfFocused, setIsShelfFocused] = useState(false);
  const [iconType, setIconType] = useState('box');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [visualMode, setVisualMode] = useState<'icon' | 'photo'>('icon');
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // Live Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Separate inputs for Gallery Upload vs Native Camera Capture fallback
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const currentDept = MASTER_DEPARTMENTS.find((d) => d.id === departmentId) || MASTER_DEPARTMENTS[0];

  const shelfSuggestions = useMemo(() => {
    const query = shelf.trim().toLowerCase();
    if (!query) return [];
    const pool =
      existingShelves && existingShelves.length > 0
        ? existingShelves
        : [
            'Rak 1 - Sembako & Beras',
            'Rak 2 - Makanan & Mi Instan',
            'Rak 3 - Bumbu & Dapur',
            'Rak 4 - Sabun & Kebersihan',
            'Etalase Minuman Dingin',
            'Etalase Kasir Utama',
            'Gantungan Snack & Renceng',
          ];
    return pool.filter(
      (s) => s.toLowerCase().includes(query) && s.toLowerCase() !== query
    );
  }, [shelf, existingShelves]);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(
    async (facing: 'environment' | 'user' = cameraFacing) => {
      setVisualMode('photo');

      // Check if WebRTC getUserMedia is available
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
          }
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facing },
              width: { ideal: 720 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          streamRef.current = stream;
          setIsCameraActive(true);
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
            }
          }, 50);
          return;
        } catch {
          // Fallback to native HTML5 camera capture input if permission denied or unavailable
          stopCameraStream();
          cameraInputRef.current?.click();
          return;
        }
      }

      // Fallback to native HTML5 camera capture input
      cameraInputRef.current?.click();
    },
    [cameraFacing, stopCameraStream]
  );

  const handleCapturePhotoFromVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    const maxDim = 500;
    let width = video.videoWidth || 500;
    let height = video.videoHeight || 500;

    if (width > height && width > maxDim) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else if (height > maxDim) {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setImageUrl(dataUrl);
      setVisualMode('photo');
    }
    stopCameraStream();
  };

  const handleSwitchCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      return;
    }

    if (initialProduct) {
      setName(initialProduct.name);
      setCategory(initialProduct.category);
      setSellPrice(initialProduct.sellPrice.toString());
      setBuyPrice(initialProduct.buyPrice.toString());
      setStock(initialProduct.stock.toString());
      setMinStock(initialProduct.minStock.toString());
      setUnit(initialProduct.unit);
      setShelf(initialProduct.shelf || '');
      setIconType(initialProduct.iconType);
      setImageUrl(initialProduct.imageUrl || '');
      setVisualMode(initialProduct.imageUrl ? 'photo' : 'icon');

      // Detect matching department by icon or category
      const foundDept =
        MASTER_DEPARTMENTS.find((d) => d.iconKeys.includes(initialProduct.iconType)) ||
        MASTER_DEPARTMENTS.find((d) => d.suggestedCategories.some((c) => c.id === initialProduct.category)) ||
        MASTER_DEPARTMENTS[0];
      setDepartmentId(foundDept.id);
    } else {
      setName('');
      setDepartmentId('sembako');
      const defaultDept = MASTER_DEPARTMENTS[0];
      setCategory(defaultDept.suggestedCategories[0]?.id || 'sembako');
      setSellPrice('');
      setBuyPrice('');
      setStock('10');
      setMinStock('3');
      setUnit(defaultDept.defaultUnit || 'bks');
      setShelf('');
      setIconType(defaultDept.iconKeys[0] || 'rice');
      setImageUrl('');
      setVisualMode('icon');
      setCustomCategoryInput('');
    }
  }, [initialProduct, isOpen, stopCameraStream]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  // Handle department change: adapt suggested category, unit, and icon
  const handleDepartmentChange = (newDeptId: string) => {
    setDepartmentId(newDeptId);
    const targetDept = MASTER_DEPARTMENTS.find((d) => d.id === newDeptId) || MASTER_DEPARTMENTS[0];

    // Automatically suggest default category for this department
    if (targetDept.suggestedCategories.length > 0) {
      setCategory(targetDept.suggestedCategories[0].id);
    } else {
      setCategory(targetDept.id);
    }

    // Automatically suggest default unit
    setUnit(targetDept.defaultUnit);

    // Automatically pick the first icon of this department
    if (targetDept.iconKeys.length > 0) {
      setIconType(targetDept.iconKeys[0]);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImage(file);
      setImageUrl(compressedDataUrl);
      setVisualMode('photo');
    } catch (err) {
      console.error('Gagal membaca gambar:', err);
      alert('Gagal memuat foto. Coba gunakan foto lain dengan format JPG atau PNG.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    stopCameraStream();
    if (!name.trim()) {
      alert('Mohon isi nama barang!');
      return;
    }

    const sPrice = parseFloat(sellPrice) || 0;
    const bPrice = parseFloat(buyPrice) || 0;
    const sStock = parseInt(stock) || 0;
    const mStock = parseInt(minStock) || 3;

    const finalCategory = customCategoryInput.trim() || category || currentDept.id;

    onSaveProduct({
      ...(initialProduct ? { id: initialProduct.id } : {}),
      name: name.trim(),
      category: finalCategory,
      sellPrice: sPrice,
      buyPrice: bPrice,
      stock: sStock,
      minStock: mStock,
      unit: unit.trim() || 'pcs',
      shelf: shelf.trim() || undefined,
      iconType,
      imageUrl: visualMode === 'photo' && imageUrl.trim() ? imageUrl.trim() : undefined,
      bgColor: PRESET_ICONS[iconType]?.bg || 'bg-slate-50 text-slate-700',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="absolute inset-0"
        onClick={() => {
          stopCameraStream();
          onClose();
        }}
      />

      <div className="relative z-10 w-full max-w-lg max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-800 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {initialProduct ? 'Ubah Rincian Barang' : 'Tambah Barang Baru'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Hidden File Input (Galeri / File) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
          />

          {/* Hidden Camera Input (Direct Camera Capture fallback) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageFileChange}
          />

          {/* 1. KELOMPOK / BIDANG USAHA DENGAN ICON KAMERA BULAT DI SAMPINGNYA */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Pilih Kelompok / Bidang Usaha:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <select
                  value={departmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full h-11 pl-3.5 pr-10 bg-white border-2 border-emerald-600/40 focus:border-emerald-700 rounded-xl text-sm font-bold text-slate-900 appearance-none outline-none transition-all cursor-pointer shadow-2xs truncate"
                >
                  {MASTER_DEPARTMENTS.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.icon} {dept.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-600 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Icon kamera bulat di samping dropdown -> Langsung buka Kamera */}
              <button
                type="button"
                onClick={() => startCamera()}
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs border ${
                  visualMode === 'photo' || imageUrl
                    ? 'bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-300'
                    : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}
                title="Buka Kamera untuk Foto Barang"
                aria-label="Buka Kamera"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CARD PILIH IKON / UNGGAH FOTO */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Pilih Ikon / Unggah Foto
              </span>
            </div>

            {visualMode === 'photo' ? (
              <div className="p-3 bg-white rounded-xl border border-emerald-200/80 space-y-2.5">
                {/* Jika Live Kamera sedang aktif */}
                {isCameraActive ? (
                  <div className="space-y-2.5">
                    <div className="relative w-full h-52 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleSwitchCameraFacing}
                        className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs cursor-pointer"
                        title="Putar Kamera Depan/Belakang"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCapturePhotoFromVideo}
                        className="flex-1 h-10 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Jepret Foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="h-10 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      {imageUrl ? (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-emerald-300 shrink-0 shadow-2xs group">
                          <img
                            src={imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                            title="Hapus foto"
                          >
                            <Trash2 className="w-3.5 h-3.5 mb-0.5" />
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => startCamera()}
                          className="w-14 h-14 rounded-xl bg-slate-100 hover:bg-emerald-50 border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center text-emerald-700 shrink-0 cursor-pointer transition-colors"
                          title="Klik untuk buka kamera"
                        >
                          <Camera className="w-5 h-5" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {imageUrl ? 'Foto Barang Terpasang' : 'Ambil Kamera / Upload Foto'}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight line-clamp-2">
                          {imageUrl
                            ? 'Foto akan ditampilkan di etalase & kasir.'
                            : 'Bisa jepret langsung dari kamera HP atau pilih foto dari galeri.'}
                        </p>
                      </div>
                    </div>

                    {/* Tombol Aksi: Kamera, Upload Galeri, atau Pakai Ikon */}
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="h-9 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                      >
                        <Camera className="w-3.5 h-3.5 shrink-0" />
                        <span>Kamera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                      >
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                        <span>Upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          stopCameraStream();
                          setVisualMode('icon');
                          setImageUrl('');
                        }}
                        className="h-9 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold flex items-center justify-center transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <span>Pakai Ikon</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Jika mode icon: tampilkan pilihan preset icon */
              <div>
                <div className="grid grid-cols-6 gap-2">
                  {currentDept.iconKeys.map((key) => {
                    const val = PRESET_ICONS[key];
                    if (!val) return null;
                    const isSelected = iconType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setIconType(key)}
                        className={`h-11 rounded-xl flex items-center justify-center text-2xl transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2.5 ring-emerald-700 bg-emerald-100/90 scale-105 shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/80'
                        }`}
                        title={val.label}
                      >
                        <span>{val.icon}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* CARD 1: NAMA BARANG, PILIHAN KATEGORI, SATUAN BARANG */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-3.5">
            {/* Nama Barang */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Nama Barang <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Beras Rojo 5kg, Kabel Data Type C, Kaos Polos..."
                className="w-full h-11 px-3.5 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-900 outline-none shadow-2xs"
              />
            </div>

            {/* Pilihan Kategori (Scroll Kesamping) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Pilihan Kategori:
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar shrink-0">
                {currentDept.suggestedCategories.map((c) => {
                  const isSelected = category.toLowerCase() === c.id.toLowerCase() && !customCategoryInput;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCategory(c.id);
                        setCustomCategoryInput('');
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-2xs scale-[1.02]'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={customCategoryInput}
                onChange={(e) => {
                  setCustomCategoryInput(e.target.value);
                  setCategory(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }}
                placeholder="Atau ketik nama kategori baru..."
                className="w-full h-9 px-3 mt-1 bg-white border border-slate-200 focus:border-emerald-600 rounded-lg text-xs font-medium text-slate-800 outline-none"
              />
            </div>

            {/* Satuan Barang (Scroll Kesamping + Textbox Full Width) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Satuan Barang:
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar shrink-0">
                {currentDept.suggestedUnits.map((u) => {
                  const isSelected = unit.toLowerCase() === u.toLowerCase() && currentDept.suggestedUnits.includes(unit);
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                        isSelected
                          ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {u}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={currentDept.suggestedUnits.includes(unit) ? '' : unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="+ Ketik satuan lain..."
                className="w-full h-9 px-3 mt-1 bg-white border border-slate-200 focus:border-emerald-600 rounded-lg text-xs font-medium text-slate-800 outline-none"
              />
            </div>
          </div>

          {/* CARD 2: HARGA JUAL, HARGA BELI, JUMLAH STOK, BATAS STOK */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-3.5">
            {/* Harga Jual & Harga Beli */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Harga Jual (Rp) <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="number"
                  required
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="Contoh: 15000"
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl text-sm font-bold text-emerald-800 outline-none tabular-nums shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Harga Beli (Rp):
                </label>
                <input
                  type="number"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  placeholder="Contoh: 12000"
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl text-sm font-semibold text-slate-700 outline-none tabular-nums shadow-2xs"
                />
              </div>
            </div>

            {/* Jumlah Stok & Batas Stok */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Jumlah Stok:
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="10"
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl text-sm font-bold text-slate-900 outline-none tabular-nums shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Batas Stok Menipis:
                </label>
                <input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="3"
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl text-sm font-semibold text-amber-800 outline-none tabular-nums shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* CARD 3: PILIH RAK */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Pilih Rak
            </label>
            <div className="relative">
              <input
                type="text"
                autoComplete="off"
                value={shelf}
                onFocus={() => setIsShelfFocused(true)}
                onBlur={() => setTimeout(() => setIsShelfFocused(false), 200)}
                onChange={(e) => setShelf(e.target.value)}
                placeholder="Contoh: Rak 1 - Sembako, Etalase Depan, Rak Bumbu..."
                className="w-full h-11 px-3.5 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none transition-all shadow-2xs"
              />
              {isShelfFocused && shelfSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                  {shelfSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShelf(s);
                        setIsShelfFocused(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>{s}</span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                        Gunakan
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SUBMIT CTA */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-800/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{initialProduct ? 'Simpan Perubahan' : 'Tambahkan ke Toko'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
