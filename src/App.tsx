import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BannerHero } from './components/BannerHero';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { AddProductModal } from './components/AddProductModal';
import { RestockModal } from './components/RestockModal';
import { SalesHistoryView } from './components/SalesHistoryView';
import { BottomNav } from './components/BottomNav';
import { InventoryView, StockStatusFilter } from './components/InventoryView';
import { SettingsView } from './components/SettingsView';
import {
  FeedbackModal,
  ConfirmModalState,
  SuccessModalState,
} from './components/FeedbackModal';
import { Product, CartItem, Transaction, StoreAccount } from './types/store';
import { dataService } from './services/dataService';
import { playSound } from './utils/sound';
import { Plus, Package, Database } from 'lucide-react';

// Helper to strictly keep only transactions within the last 7 calendar days
const prune7DaysTransactions = (txs: Transaction[]): Transaction[] => {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - SEVEN_DAYS_MS;
  return txs.filter((t) => {
    const time = new Date(t.timestamp).getTime();
    return time >= cutoff;
  });
};

export default function App() {
  // --- Database-Backed State (SQLite on Server / Device DB on Offline APK) ---
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(true);
  const [stores, setStores] = useState<StoreAccount[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>('store-1');
  const [productsMap, setProductsMap] = useState<{ [storeId: string]: Product[] }>({});
  const [transactionsMap, setTransactionsMap] = useState<{ [storeId: string]: Transaction[] }>({});
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(2);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-level', String(fontSizeLevel));
  }, [fontSizeLevel]);

  const loadFromDatabase = useCallback(async () => {
    try {
      const data = await dataService.bootstrap();
      setStores(data.stores || []);
      setActiveStoreId(data.activeStoreId || data.stores?.[0]?.id || 'store-1');
      setProductsMap(data.productsMap || {});
      setTransactionsMap(data.transactionsMap || {});
      if (data.fontSizeLevel && data.fontSizeLevel >= 1 && data.fontSizeLevel <= 4) {
        setFontSizeLevel(data.fontSizeLevel);
      }
    } catch (err) {
      console.error('Database fetch error:', err);
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    loadFromDatabase();
  }, [loadFromDatabase]);

  // Current active store data
  const currentStore = useMemo<StoreAccount>(() => {
    return (
      stores.find((s) => s.id === activeStoreId) ||
      stores[0] || {
        id: 'store-1',
        name: 'Memuat Toko...',
        ownerName: '-',
        categoryOrType: 'Toko',
        createdAt: new Date().toISOString(),
      }
    );
  }, [stores, activeStoreId]);

  const products = useMemo(() => {
    return productsMap[activeStoreId] || [];
  }, [productsMap, activeStoreId]);

  const transactions = useMemo(() => {
    return prune7DaysTransactions(transactionsMap[activeStoreId] || []);
  }, [transactionsMap, activeStoreId]);

  // Sound enabled
  const soundEnabled = true;

  // --- UI Navigation & Filter State ---
  const [activeTab, setActiveTab] = useState<'catalog' | 'inventory' | 'history' | 'settings'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedShelf, setSelectedShelf] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<StockStatusFilter>('all');

  // --- Cart State (In-memory active cashier session) ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // --- Modals State ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockProductId, setRestockProductId] = useState<string | undefined>(undefined);

  // --- Confirmation & Success Popup State ---
  const [confirmState, setConfirmState] = useState<ConfirmModalState | null>(null);
  const [successState, setSuccessState] = useState<SuccessModalState | null>(null);

  const showConfirmPopup = (opts: Omit<ConfirmModalState, 'isOpen'>) => {
    setConfirmState({ ...opts, isOpen: true });
  };

  const showSuccessPopup = (title: string, message: React.ReactNode) => {
    setSuccessState({ isOpen: true, title, message });
  };

  // Toast feedback state (for quick non-blocking actions like +1 cart or quick stepper)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Helper to update products state for current store
  const setStoreProducts = (updater: (prev: Product[]) => Product[]) => {
    setProductsMap((prevMap) => {
      const currentList = prevMap[activeStoreId] || [];
      return {
        ...prevMap,
        [activeStoreId]: updater(currentList),
      };
    });
  };

  // Helper to update transactions state for current store
  const setStoreTransactions = (updater: (prev: Transaction[]) => Transaction[]) => {
    setTransactionsMap((prevMap) => {
      const currentList = prevMap[activeStoreId] || [];
      const updated = updater(currentList);
      return {
        ...prevMap,
        [activeStoreId]: prune7DaysTransactions(updated),
      };
    });
  };

  // --- Calculations ---
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock > 0 && p.stock <= p.minStock),
    [products]
  );

  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = { all: products.length };
    products.forEach((p) => {
      const cat = p.category.toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Unique shelves in the current store & counts per shelf
  const availableShelves = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.shelf && p.shelf.trim()) {
        set.add(p.shelf.trim());
      }
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

  // Today's total revenue (excluding cancelled transactions)
  const todayRevenue = useMemo(() => {
    const todayStr = new Date().toDateString();
    return transactions
      .filter((t) => t.status !== 'cancelled' && new Date(t.timestamp).toDateString() === todayStr)
      .reduce((sum, t) => sum + t.totalAmount, 0);
  }, [transactions]);

  // Filtered Products for Catalog
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search check
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCat = p.category.toLowerCase().includes(query);
        const matchesShelf = p.shelf ? p.shelf.toLowerCase().includes(query) : false;
        if (!matchesName && !matchesCat && !matchesShelf) return false;
      }

      // Shelf check
      if (selectedShelf !== 'all') {
        const itemShelf = p.shelf && p.shelf.trim() ? p.shelf.trim() : 'Etalase Utama';
        if (itemShelf.toLowerCase() !== selectedShelf.toLowerCase()) {
          return false;
        }
      }

      // Category check
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'low-stock') {
        return p.stock <= p.minStock;
      }
      return p.category.toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [products, searchQuery, selectedCategory, selectedShelf]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.product.sellPrice * item.quantity, 0);

  // --- Multi-Store Actions (Saved to DB) ---
  const handleFontSizeChange = async (level: number) => {
    const clamped = Math.max(1, Math.min(4, Math.round(level)));
    if (clamped === fontSizeLevel) return;
    if (soundEnabled) playSound.tap();
    setFontSizeLevel(clamped);
    await dataService.setFontSizeLevel(clamped);
  };

  const handleSelectStore = async (storeId: string) => {
    if (storeId === activeStoreId) return;
    const targetStore = stores.find((s) => s.id === storeId);
    setActiveStoreId(storeId);
    setCart([]);
    setSelectedCategory('all');
    setSelectedShelf('all');
    showToast(`Beralih ke: ${targetStore?.name || 'Toko Lain'}`);

    await dataService.setActiveStore(storeId);
  };

  const handleAddStore = (newStoreData: {
    name: string;
    ownerName: string;
    categoryOrType: string;
    logoUrl?: string;
  }) => {
    if (stores.length >= 3) {
      alert('Maksimal 3 toko! Hapus salah satu cabang bila ingin membuka toko baru.');
      return;
    }

    showConfirmPopup({
      title: 'Konfirmasi Tambah Toko',
      message: `Apakah Anda yakin ingin membuat cabang toko baru "${newStoreData.name}"?`,
      confirmLabel: 'Ya, Buat Toko',
      variant: 'primary',
      onConfirm: async () => {
        const newStoreId = 'store-' + Date.now();
        const newStore: StoreAccount = {
          id: newStoreId,
          name: newStoreData.name,
          ownerName: newStoreData.ownerName,
          categoryOrType: newStoreData.categoryOrType,
          logoUrl: newStoreData.logoUrl,
          createdAt: new Date().toISOString(),
        };

        const ok = await dataService.createStore(newStore);
        if (ok) {
          setStores((prev) => [...prev, newStore]);
          setProductsMap((prev) => ({ ...prev, [newStoreId]: [] }));
          setTransactionsMap((prev) => ({ ...prev, [newStoreId]: [] }));
          setActiveStoreId(newStoreId);
          setCart([]);
          setActiveTab('catalog');
          showSuccessPopup(
            'Toko Baru Berhasil Dibuat!',
            `Toko "${newStore.name}" telah berhasil disimpan ke Database dan siap digunakan.`
          );
        }
      },
    });
  };

  const handleUpdateStore = (storeId: string, data: Partial<StoreAccount>) => {
    showConfirmPopup({
      title: 'Simpan Perubahan Toko',
      message: 'Apakah Anda yakin ingin menyimpan perubahan informasi toko ini ke Database?',
      confirmLabel: 'Ya, Simpan',
      variant: 'primary',
      onConfirm: async () => {
        const ok = await dataService.updateStore(storeId, data);
        if (ok) {
          setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, ...data } : s)));
          showSuccessPopup(
            'Perubahan Toko Disimpan!',
            'Informasi toko berhasil diperbarui di Database.'
          );
        }
      },
    });
  };

  const handleDeleteStore = (storeId: string) => {
    if (stores.length <= 1) {
      alert('Tidak dapat menghapus toko utama!');
      return;
    }

    const targetStore = stores.find((s) => s.id === storeId);
    showConfirmPopup({
      title: 'Konfirmasi Hapus Toko',
      message: `Apakah Anda yakin ingin menghapus toko "${targetStore?.name}" beserta seluruh data barang dan transaksinya dari Database?`,
      confirmLabel: 'Ya, Hapus Toko',
      variant: 'danger',
      onConfirm: async () => {
        const res = await dataService.deleteStore(storeId);
        if (res.ok) {
          const remainingStores = stores.filter((s) => s.id !== storeId);
          setStores(remainingStores);

          if (activeStoreId === storeId) {
            setActiveStoreId(res.activeStoreId || remainingStores[0].id);
            setCart([]);
          }

          setProductsMap((prev) => {
            const next = { ...prev };
            delete next[storeId];
            return next;
          });

          setTransactionsMap((prev) => {
            const next = { ...prev };
            delete next[storeId];
            return next;
          });

          showSuccessPopup(
            'Toko Berhasil Dihapus!',
            `Toko "${targetStore?.name}" telah dihapus secara permanen dari Database.`
          );
        }
      },
    });
  };

  const handleClearTransactions = () => {
    showConfirmPopup({
      title: 'Kosongkan Riwayat Penjualan',
      message:
        'Apakah Anda yakin ingin menghapus seluruh catatan transaksi penjualan 7 hari terakhir pada toko ini dari Database?',
      confirmLabel: 'Ya, Kosongkan',
      variant: 'danger',
      onConfirm: async () => {
        const ok = await dataService.clearTransactions(activeStoreId);
        if (ok) {
          setStoreTransactions(() => []);
          showSuccessPopup(
            'Riwayat Berhasil Dikosongkan!',
            'Catatan transaksi kas 7 hari terakhir telah dihapus dari Database.'
          );
        }
      },
    });
  };

  const handleCancelTransaction = (tx: Transaction) => {
    if (tx.status === 'cancelled') return;

    const txDate = new Date(tx.timestamp);
    const formattedDateTime = `${txDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} pukul ${txDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    showConfirmPopup({
      title: 'Konfirmasi Batalkan Transaksi',
      message: (
        <div className="space-y-2.5 text-left">
          <p>
            Apakah Anda yakin ingin membatalkan transaksi pada{' '}
            <span className="font-bold text-slate-800">{formattedDateTime}</span>?
          </p>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Barang pada transaksi ini:
            </p>
            <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {tx.items.map((item, idx) => (
                <li
                  key={`${item.productId}-${idx}`}
                  className="flex items-center justify-between text-xs text-slate-700 gap-2"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{item.productName}</span>
                  </span>
                  <span className="font-bold text-emerald-700 shrink-0">
                    +{item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-600">
            Stok barang di atas akan dikembalikan ke stok toko, dan status transaksi akan berubah menjadi{' '}
            <span className="font-semibold text-slate-800">"Transaksi Dibatalkan"</span>.
          </p>
        </div>
      ),
      confirmLabel: 'Ya, Batalkan Transaksi',
      variant: 'danger',
      onConfirm: async () => {
        if (soundEnabled) playSound.tap();
        const res = await dataService.cancelTransaction(activeStoreId, tx.id);
        if (res.ok && res.products && res.transactions) {
          setStoreProducts(() => res.products!);
          setStoreTransactions(() => res.transactions!);
          showSuccessPopup(
            'Transaksi Berhasil Dibatalkan!',
            <div className="space-y-2.5 text-left mt-1">
              <p className="text-center">
                Transaksi pada <span className="font-bold text-slate-800">{formattedDateTime}</span> telah dibatalkan.
              </p>
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 space-y-1.5">
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Stok dikembalikan ke gudang:
                </p>
                <ul className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {tx.items.map((item, idx) => (
                    <li
                      key={`${item.productId}-${idx}`}
                      className="flex items-center justify-between text-xs text-slate-700 gap-2"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{item.productName}</span>
                      </span>
                      <span className="font-bold text-emerald-700 shrink-0">
                        +{item.quantity} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        }
      },
    });
  };

  // --- Cart Actions ---
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      if (soundEnabled) playSound.warning();
      showToast(`Stok ${product.name} sedang habis!`);
      return;
    }

    const existing = cart.find((item) => item.product.id === product.id);
    if (existing && existing.quantity >= product.stock) {
      if (soundEnabled) playSound.warning();
      showToast(`Maksimal stok tersedia (${product.stock} ${product.unit})`);
      return;
    }

    if (soundEnabled) playSound.tap();

    const nextQty = existing ? existing.quantity + 1 : 1;

    setCart((prev) => {
      const currentExisting = prev.find((item) => item.product.id === product.id);
      if (currentExisting) {
        if (currentExisting.quantity >= product.stock) {
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });

    showToast(`+${nextQty} ${product.name} dimasukkan ke keranjang`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (soundEnabled) playSound.tap();

    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    if (soundEnabled) playSound.tap();
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    if (soundEnabled) playSound.tap();
    setCart([]);
  };

  // Complete cashier sale -> Persist to DB
  const handleCompleteSale = async (cashPaid: number, change: number) => {
    if (cart.length === 0) return;

    if (soundEnabled) playSound.cashRegister();

    let transactionProfit = 0;
    const transactionItems = cart.map((item) => {
      const itemProfit = (item.product.sellPrice - item.product.buyPrice) * item.quantity;
      transactionProfit += itemProfit;
      return {
        productId: item.product.id,
        productName: item.product.name,
        sellPrice: item.product.sellPrice,
        buyPrice: item.product.buyPrice,
        quantity: item.quantity,
        unit: item.product.unit,
      };
    });

    const newTransaction: Transaction = {
      id: 'TRX-' + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      items: transactionItems,
      totalAmount: totalCartAmount,
      totalProfit: Math.max(0, transactionProfit),
      cashPaid,
      change,
    };

    const res = await dataService.recordTransaction(activeStoreId, newTransaction);
    if (res.ok && res.products && res.transactions) {
      setStoreProducts(() => res.products!);
      setStoreTransactions(() => res.transactions!);
      setCart([]);
      showToast('Penjualan tersimpan di Database! Stok otomatis berkurang.');
    }
  };

  // Quick In-place stock stepper -> Persist to DB without changing activeTab
  const handleQuickAdjustStock = async (product: Product, delta: number) => {
    if (soundEnabled) playSound.tap();

    const newStock = Math.max(0, product.stock + delta);
    const updatedAt = new Date().toISOString();

    setStoreProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: newStock, updatedAt } : p))
    );

    await dataService.adjustStock(activeStoreId, product.id, newStock, updatedAt);

    if (delta > 0) {
      showToast(`Stok ${product.name} bertambah jadi ${newStock}`);
    } else if (delta < 0) {
      showToast(`Stok ${product.name} berkurang jadi ${newStock}`);
    }
  };

  // Restock bulk amount -> Persist to DB with Confirmation & Success Popup
  const handleAddStock = (productId: string, quantityToAdd: number) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    showConfirmPopup({
      title: 'Konfirmasi Tambah Stok',
      message: `Apakah Anda yakin ingin menambah +${quantityToAdd} ${target.unit} untuk "${target.name}"?`,
      confirmLabel: 'Ya, Tambah Stok',
      variant: 'primary',
      onConfirm: async () => {
        if (soundEnabled) playSound.tap();
        const updatedStock = target.stock + quantityToAdd;
        const updatedAt = new Date().toISOString();

        setStoreProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: updatedStock, updatedAt } : p))
        );

        const ok = await dataService.adjustStock(
          activeStoreId,
          productId,
          updatedStock,
          updatedAt
        );

        if (ok) {
          showSuccessPopup(
            'Stok Berhasil Ditambahkan!',
            `Stok "${target.name}" bertambah +${quantityToAdd} ${target.unit} menjadi ${updatedStock} ${target.unit}.`
          );
        }
      },
    });
  };

  // Save or Edit Product -> Persist to DB with Confirmation & Success Popup
  const handleSaveProduct = (productData: Partial<Product>) => {
    const isEdit = Boolean(productData.id);
    const productName = productData.name || 'Barang Baru';

    showConfirmPopup({
      title: isEdit ? 'Konfirmasi Ubah Barang' : 'Konfirmasi Tambah Barang',
      message: isEdit
        ? `Apakah Anda yakin ingin menyimpan perubahan pada barang "${productName}"?`
        : `Apakah Anda yakin ingin menambahkan barang baru "${productName}" ke toko?`,
      confirmLabel: isEdit ? 'Ya, Simpan Perubahan' : 'Ya, Tambahkan Barang',
      variant: 'primary',
      onConfirm: async () => {
        if (soundEnabled) playSound.tap();

        const nowIso = new Date().toISOString();
        let savedProduct: Product;

        if (isEdit) {
          const existing = products.find((p) => p.id === productData.id);
          savedProduct = {
            ...(existing as Product),
            ...productData,
            updatedAt: nowIso,
          } as Product;
        } else {
          savedProduct = {
            id: 'prod-' + Date.now(),
            name: productName,
            category: productData.category || 'sembako',
            sellPrice: productData.sellPrice || 0,
            buyPrice: productData.buyPrice || 0,
            stock: productData.stock || 0,
            minStock: productData.minStock || 3,
            unit: productData.unit || 'pcs',
            shelf: productData.shelf,
            barcode: productData.barcode,
            iconType: productData.iconType || 'box',
            imageUrl: productData.imageUrl,
            bgColor: productData.bgColor || 'bg-slate-50 text-slate-700',
            updatedAt: nowIso,
          };
        }

        const ok = await dataService.upsertProduct(activeStoreId, savedProduct);
        if (ok) {
          if (isEdit) {
            setStoreProducts((prev) =>
              prev.map((p) => (p.id === savedProduct.id ? savedProduct : p))
            );
            showSuccessPopup(
              'Data Barang Diperbarui!',
              `Rincian barang "${savedProduct.name}" telah berhasil diperbarui di Database.`
            );
          } else {
            setStoreProducts((prev) => [savedProduct, ...prev]);
            showSuccessPopup(
              'Barang Baru Ditambahkan!',
              `"${savedProduct.name}" berhasil ditambahkan dan tersimpan di Database.`
            );
          }
        }

        setEditingProduct(null);
      },
    });
  };

  // Delete single product -> Persist to DB with Confirmation & Success Popup
  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    showConfirmPopup({
      title: 'Konfirmasi Hapus Barang',
      message: `Apakah Anda yakin ingin menghapus "${target?.name || 'barang ini'}" secara permanen dari Database?`,
      confirmLabel: 'Ya, Hapus Barang',
      variant: 'danger',
      onConfirm: async () => {
        if (soundEnabled) playSound.tap();
        const ok = await dataService.deleteProducts(activeStoreId, [productId]);
        if (ok) {
          setStoreProducts((prev) => prev.filter((p) => p.id !== productId));
          setCart((prev) => prev.filter((c) => c.product.id !== productId));
          showSuccessPopup(
            'Barang Berhasil Dihapus!',
            `"${target?.name || 'Barang'}" telah dihapus dari Database.`
          );
        }
      },
    });
  };

  // Delete multiple products -> Persist to DB with Confirmation & Success Popup
  const handleDeleteMultipleProducts = (productIds: string[]) => {
    if (productIds.length === 0) return;
    const count = productIds.length;
    showConfirmPopup({
      title: `Konfirmasi Hapus ${count} Barang`,
      message: `Apakah Anda yakin ingin menghapus ${count} barang yang dipilih dari stok toko? Data ini akan dihapus secara permanen dari Database.`,
      confirmLabel: `Ya, Hapus (${count})`,
      variant: 'danger',
      onConfirm: async () => {
        if (soundEnabled) playSound.tap();
        const ok = await dataService.deleteProducts(activeStoreId, productIds);
        if (ok) {
          setStoreProducts((prev) => prev.filter((p) => !productIds.includes(p.id)));
          setCart((prev) => prev.filter((c) => !productIds.includes(c.product.id)));
          showSuccessPopup(
            'Barang Berhasil Dihapus!',
            `${count} barang yang dipilih telah dihapus secara permanen dari Database.`
          );
        }
      },
    });
  };

  if (isLoadingDb) {
    return (
      <div className="min-h-screen bg-[#e9eee7] flex flex-col items-center justify-center p-6 text-slate-800">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-200/80 flex flex-col items-center gap-3 max-w-xs text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center animate-pulse">
            <Database className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Memuat Database Toko...</h2>
          <p className="text-xs text-slate-500">Menyiapkan penyimpanan database lokal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e9eee7] text-slate-900 pb-28 sm:pb-24 selection:bg-emerald-700 selection:text-white leading-relaxed">
      {/* Main Content Area (Tanpa Navbar Putih di Atas) */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-6 pt-2.5 sm:pt-6 space-y-2 sm:space-y-2.5">
        {/* TAB 1: ETALASE & KASIR */}
        {activeTab === 'catalog' && (
          <>
            {/* Earth Green Banner Hero (Dengan Dropdown Toko & Searchbox di Dalamnya) */}
            <BannerHero
              stores={stores}
              activeStoreId={activeStoreId}
              onSelectStore={handleSelectStore}
              onOpenAddStore={() => setActiveTab('settings')}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalProducts={products.length}
              lowStockCount={lowStockProducts.length}
              todayRevenue={todayRevenue}
              onFilterLowStock={() => {
                setInventoryStatusFilter('low');
                setActiveTab('inventory');
              }}
              onOpenSalesHistory={() => setActiveTab('history')}
            />

            {/* Filter Bar (Langsung dekat di bawah Card Hijau tanpa teks "Terapkan Filter") */}
            <div>
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                categoryCounts={categoryCounts}
                availableShelves={availableShelves}
                selectedShelf={selectedShelf}
                onSelectShelf={setSelectedShelf}
                shelfCounts={shelfCounts}
              />
            </div>

            {/* Product Display Grid */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-normal">
                  {selectedCategory === 'all'
                    ? selectedShelf === 'all'
                      ? 'Semua Dagangan Toko'
                      : `Rak: ${selectedShelf}`
                    : selectedCategory === 'low-stock'
                    ? '⚠️ Barang Perlu Ditambah (Stok Sedikit)'
                    : `Kategori: ${selectedCategory.toUpperCase()}`}
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    ({filteredProducts.length} barang)
                  </span>
                </h3>
                {(searchQuery || selectedShelf !== 'all' || selectedCategory !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedShelf('all');
                      setSelectedCategory('all');
                    }}
                    className="text-xs text-emerald-800 font-semibold underline leading-normal cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-2xs space-y-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-100/70 text-emerald-800 mx-auto flex items-center justify-center mb-3">
                    <Package className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 leading-normal">
                    Tidak ada barang ditemukan
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {searchQuery
                      ? `Tidak ada barang yang cocok dengan kata kunci "${searchQuery}". Coba kata lain.`
                      : 'Belum ada barang di etalase toko ini. Mulai tambahkan barang pertama Anda.'}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setIsAddModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm shadow-emerald-200 cursor-pointer inline-flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Barang Baru</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4 items-end">
                  {filteredProducts.map((product) => {
                    const inCartQty =
                      cart.find((item) => item.product.id === product.id)?.quantity || 0;
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        cartQuantity={inCartQty}
                        onAddToCart={handleAddToCart}
                        onRestockProduct={(p) => {
                          if (soundEnabled) playSound.tap();
                          setRestockProductId(p.id);
                          setIsRestockModalOpen(true);
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: STOK BARANG & GUDANG */}
        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            initialStatusFilter={inventoryStatusFilter}
            onStatusFilterChange={setInventoryStatusFilter}
            onQuickAdjustStock={handleQuickAdjustStock}
            onEditProduct={(p) => {
              setEditingProduct(p);
              setIsAddModalOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
            onDeleteMultipleProducts={handleDeleteMultipleProducts}
            onOpenRestock={(id) => {
              setRestockProductId(id);
              setIsRestockModalOpen(true);
            }}
            onOpenAddProduct={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
          />
        )}

        {/* TAB 3: CATATAN KAS & PENJUALAN (Halaman Penuh dengan Grafik 7 Hari) */}
        {activeTab === 'history' && (
          <SalesHistoryView
            transactions={transactions}
            onClearHistory={handleClearTransactions}
            onCancelTransaction={handleCancelTransaction}
            storeName={currentStore.name}
            onBackToCatalog={() => setActiveTab('catalog')}
          />
        )}

        {/* TAB 4: KELOLA TOKO & PENGATURAN */}
        {activeTab === 'settings' && (
          <SettingsView
            stores={stores}
            activeStoreId={activeStoreId}
            onSelectStore={handleSelectStore}
            onAddStore={handleAddStore}
            onUpdateStore={handleUpdateStore}
            onDeleteStore={handleDeleteStore}
            products={products}
            transactions={transactions}
            fontSizeLevel={fontSizeLevel}
            onChangeFontSizeLevel={handleFontSizeChange}
          />
        )}
      </main>

      {/* Floating Action Button (FAB) & Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        cartItemCount={totalCartCount}
        cartTotalAmount={totalCartAmount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Modals & Drawers */}

      {/* 1. Kasir / Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCompleteSale={handleCompleteSale}
        storeName={currentStore.name}
      />

      {/* 2. Tambah / Ubah Barang Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        onSaveProduct={handleSaveProduct}
        initialProduct={editingProduct}
      />

      {/* 3. Kulak / Tambah Pasokan Cepat Modal */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        products={products}
        onAddStock={handleAddStock}
        defaultProductId={restockProductId}
      />

      {/* 4. Global Confirmation & Success Popup Modal */}
      <FeedbackModal
        confirmState={confirmState}
        onCloseConfirm={() => setConfirmState(null)}
        successState={successState}
        onCloseSuccess={() => setSuccessState(null)}
      />

      {/* Toast Notification (Quick actions - Positioned at Top) */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 flex items-center gap-2 max-w-[90vw]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
