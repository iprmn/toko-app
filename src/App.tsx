import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { BannerHero } from './components/BannerHero';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { AddProductModal } from './components/AddProductModal';
import { RestockModal } from './components/RestockModal';
import { SalesHistoryView } from './components/SalesHistoryView';
import { BottomNav } from './components/BottomNav';
import { InventoryView } from './components/InventoryView';
import { SettingsView } from './components/SettingsView';
import {
  INITIAL_PRODUCTS,
  INITIAL_ELECTRONICS_PRODUCTS,
  INITIAL_FASHION_PRODUCTS,
  INITIAL_STORES,
  getInitialSampleTransactions,
} from './data/initialProducts';
import { Product, CartItem, Transaction, StoreAccount } from './types/store';
import { playSound } from './utils/sound';
import { Plus, Package, ShoppingCart } from 'lucide-react';

const STORAGE_KEYS = {
  STORES: 'warung_stores_v3',
  ACTIVE_STORE_ID: 'warung_active_store_id_v3',
  PRODUCTS_MAP: 'warung_products_map_v3',
  TRANSACTIONS_MAP: 'warung_transactions_map_v3',
  // Legacy keys for migration
  LEGACY_PRODUCTS: 'warung_products_v1',
  LEGACY_TRANSACTIONS: 'warung_transactions_v1',
  LEGACY_PROFILE: 'warung_profile_v1',
};

// Default initial stores (3 stores)
const DEFAULT_STORES: StoreAccount[] = INITIAL_STORES;

const DEFAULT_PRODUCTS_MAP: { [storeId: string]: Product[] } = {
  'store-1': INITIAL_PRODUCTS,
  'store-2': INITIAL_ELECTRONICS_PRODUCTS,
  'store-3': INITIAL_FASHION_PRODUCTS,
};

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
  // --- Multi-Store State ---
  const [stores, setStores] = useState<StoreAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STORES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_STORES;
  });

  const [activeStoreId, setActiveStoreId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_STORE_ID);
      if (saved) return saved;
    } catch {
      // Fallback
    }
    return 'store-1';
  });

  // Products map per store
  const [productsMap, setProductsMap] = useState<{ [storeId: string]: Product[] }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS_MAP);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Backfill shelf for initial products if missing
        const enrichList = (list: Product[]) =>
          list.map((p) => {
            if (p.shelf) return p;
            const match = INITIAL_PRODUCTS.find((init) => init.id === p.id);
            return match?.shelf ? { ...p, shelf: match.shelf } : p;
          });

        return {
          'store-1': enrichList(parsed['store-1'] || INITIAL_PRODUCTS),
          'store-2': parsed['store-2'] || INITIAL_ELECTRONICS_PRODUCTS,
          'store-3': parsed['store-3'] || INITIAL_FASHION_PRODUCTS,
          ...parsed,
        };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PRODUCTS_MAP;
  });

  // Transactions map per store (pruned to max 7 days)
  const [transactionsMap, setTransactionsMap] = useState<{ [storeId: string]: Transaction[] }>(() => {
    const initialTxs = getInitialSampleTransactions();
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS_MAP);
      if (saved) {
        const parsed = JSON.parse(saved);
        const pruned: { [key: string]: Transaction[] } = {};
        const allKeys = Array.from(new Set([...Object.keys(initialTxs), ...Object.keys(parsed)]));
        allKeys.forEach((k) => {
          pruned[k] = prune7DaysTransactions(parsed[k] && parsed[k].length > 0 ? parsed[k] : initialTxs[k] || []);
        });
        return pruned;
      }
    } catch {
      // Fallback
    }
    return initialTxs;
  });

  // Current active store data
  const currentStore = useMemo(() => {
    return stores.find((s) => s.id === activeStoreId) || stores[0] || DEFAULT_STORES[0];
  }, [stores, activeStoreId]);

  const products = useMemo(() => {
    return productsMap[activeStoreId] || [];
  }, [productsMap, activeStoreId]);

  const transactions = useMemo(() => {
    return prune7DaysTransactions(transactionsMap[activeStoreId] || []);
  }, [transactionsMap, activeStoreId]);

  // Persist multi-store state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
    } catch {}
  }, [stores]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_STORE_ID, activeStoreId);
    } catch {}
  }, [activeStoreId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS_MAP, JSON.stringify(productsMap));
    } catch {}
  }, [productsMap]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS_MAP, JSON.stringify(transactionsMap));
    } catch {}
  }, [transactionsMap]);

  // Sound enabled
  const soundEnabled = true;

  // --- UI Navigation & Filter State ---
  const [activeTab, setActiveTab] = useState<'catalog' | 'inventory' | 'history' | 'settings'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedShelf, setSelectedShelf] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // --- Cart State ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // --- Modals State ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockProductId, setRestockProductId] = useState<string | undefined>(undefined);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2400);
  };

  // Helper to update products for current store
  const setStoreProducts = (updater: (prev: Product[]) => Product[]) => {
    setProductsMap((prevMap) => {
      const currentList = prevMap[activeStoreId] || [];
      return {
        ...prevMap,
        [activeStoreId]: updater(currentList),
      };
    });
  };

  // Helper to update transactions for current store
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

  const outOfStockProducts = useMemo(
    () => products.filter((p) => p.stock <= 0),
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

  // Unique shelves in the current store
  const availableShelves = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.shelf && p.shelf.trim()) {
        set.add(p.shelf.trim());
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Today's total revenue
  const todayRevenue = useMemo(() => {
    const todayStr = new Date().toDateString();
    return transactions
      .filter((t) => new Date(t.timestamp).toDateString() === todayStr)
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

  // Group filtered products by shelf for realistic ambalan display
  const shelfGroups = useMemo(() => {
    const map = new Map<string, Product[]>();
    filteredProducts.forEach((p) => {
      const s = p.shelf && p.shelf.trim() ? p.shelf.trim() : 'Etalase Utama';
      if (!map.has(s)) {
        map.set(s, []);
      }
      map.get(s)!.push(p);
    });

    const groups: { shelfName: string; items: Product[] }[] = [];
    map.forEach((items, shelfName) => {
      groups.push({ shelfName, items });
    });

    // Sort: specific shelves first, 'Etalase Utama' last
    groups.sort((a, b) => {
      if (a.shelfName === 'Etalase Utama') return 1;
      if (b.shelfName === 'Etalase Utama') return -1;
      return a.shelfName.localeCompare(b.shelfName);
    });

    return groups;
  }, [filteredProducts]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.product.sellPrice * item.quantity, 0);

  // --- Multi-Store Actions ---
  const handleSelectStore = (storeId: string) => {
    if (storeId === activeStoreId) return;
    const targetStore = stores.find((s) => s.id === storeId);
    setActiveStoreId(storeId);
    setCart([]); // Clear cart when switching stores
    showToast(`Beralih ke: ${targetStore?.name || 'Toko Lain'}`);
  };

  const handleAddStore = (newStoreData: { name: string; ownerName: string; categoryOrType: string; logoUrl?: string }) => {
    if (stores.length >= 3) {
      alert('Maksimal 3 toko! Hapus salah satu cabang bila ingin membuka toko baru.');
      return;
    }

    const newStoreId = 'store-' + Date.now();
    const newStore: StoreAccount = {
      id: newStoreId,
      name: newStoreData.name,
      ownerName: newStoreData.ownerName,
      categoryOrType: newStoreData.categoryOrType,
      logoUrl: newStoreData.logoUrl,
      createdAt: new Date().toISOString(),
    };

    setStores((prev) => [...prev, newStore]);

    // Initialize with a blank inventory or sample items for this new store
    setProductsMap((prev) => ({
      ...prev,
      [newStoreId]: [],
    }));

    setTransactionsMap((prev) => ({
      ...prev,
      [newStoreId]: [],
    }));

    setActiveStoreId(newStoreId);
    setCart([]);
    setActiveTab('catalog');
    showToast(`Toko baru "${newStore.name}" siap digunakan!`);
  };

  const handleUpdateStore = (storeId: string, data: Partial<StoreAccount>) => {
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, ...data } : s))
    );
    showToast('Informasi toko berhasil disimpan');
  };

  const handleDeleteStore = (storeId: string) => {
    if (stores.length <= 1) {
      alert('Tidak dapat menghapus toko utama!');
      return;
    }

    const targetStore = stores.find((s) => s.id === storeId);
    const remainingStores = stores.filter((s) => s.id !== storeId);
    setStores(remainingStores);

    // If currently active store was deleted, switch to first remaining store
    if (activeStoreId === storeId) {
      setActiveStoreId(remainingStores[0].id);
      setCart([]);
    }

    // Clean up stored data
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

    showToast(`Toko "${targetStore?.name}" telah dihapus`);
  };

  const handleClearTransactions = () => {
    setStoreTransactions(() => []);
    showToast('Catatan transaksi kas 7 hari telah direset');
  };

  // --- Cart Actions ---
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      if (soundEnabled) playSound.warning();
      showToast(`Stok ${product.name} sedang habis!`);
      return;
    }

    if (soundEnabled) playSound.tap();

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Maksimal stok tersedia (${product.stock} ${product.unit})`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1 }];
      }
    });

    showToast(`+1 ${product.name} dimasukkan ke kasir`);
  };

  // Update cart item quantity
  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (soundEnabled) playSound.tap();

    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
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

  // Complete cashier sale
  const handleCompleteSale = (cashPaid: number, change: number) => {
    if (cart.length === 0) return;

    if (soundEnabled) playSound.cashRegister();

    // 1. Calculate profit and create transaction items
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

    // 2. Reduce product stock for this store
    setStoreProducts((prev) =>
      prev.map((p) => {
        const soldItem = cart.find((c) => c.product.id === p.id);
        if (soldItem) {
          const newStock = Math.max(0, p.stock - soldItem.quantity);
          return { ...p, stock: newStock, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );

    // 3. Save transaction to history
    setStoreTransactions((prev) => [newTransaction, ...prev]);

    // 4. Clear cart items
    setCart([]);
    showToast('Penjualan dicatat! Stok otomatis berkurang.');
  };

  // Quick In-place stock stepper
  const handleQuickAdjustStock = (product: Product, delta: number) => {
    if (soundEnabled) playSound.tap();

    const newStock = Math.max(0, product.stock + delta);
    setStoreProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, stock: newStock, updatedAt: new Date().toISOString() } : p
      )
    );

    if (delta > 0) {
      showToast(`Stok ${product.name} bertambah jadi ${newStock}`);
    } else {
      showToast(`Stok ${product.name} berkurang jadi ${newStock}`);
    }
  };

  // Restock bulk amount
  const handleAddStock = (productId: string, quantityToAdd: number) => {
    if (soundEnabled) playSound.tap();

    setStoreProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const updated = p.stock + quantityToAdd;
          showToast(`Berhasil menambah +${quantityToAdd} ${p.unit} ${p.name}`);
          return { ...p, stock: updated, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );
  };

  // Save or Edit Product
  const handleSaveProduct = (productData: Partial<Product>) => {
    if (soundEnabled) playSound.tap();

    if (productData.id) {
      // Edit existing
      setStoreProducts((prev) =>
        prev.map((p) =>
          p.id === productData.id
            ? ({ ...p, ...productData, updatedAt: new Date().toISOString() } as Product)
            : p
        )
      );
      showToast(`Data "${productData.name}" berhasil diubah`);
    } else {
      // Create new
      const newProduct: Product = {
        id: 'prod-' + Date.now(),
        name: productData.name || 'Barang Baru',
        category: productData.category || 'sembako',
        sellPrice: productData.sellPrice || 0,
        buyPrice: productData.buyPrice || 0,
        stock: productData.stock || 0,
        minStock: productData.minStock || 3,
        unit: productData.unit || 'pcs',
        iconType: productData.iconType || 'box',
        imageUrl: productData.imageUrl,
        bgColor: productData.bgColor || 'bg-slate-50 text-slate-700',
        updatedAt: new Date().toISOString(),
      };
      setStoreProducts((prev) => [newProduct, ...prev]);
      showToast(`"${newProduct.name}" berhasil ditambahkan ke etalase toko!`);
    }

    setEditingProduct(null);
  };

  // Delete single product
  const handleDeleteProduct = (productId: string) => {
    if (soundEnabled) playSound.tap();
    setStoreProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
    showToast('Barang dihapus dari toko');
  };

  // Delete multiple products
  const handleDeleteMultipleProducts = (productIds: string[]) => {
    if (soundEnabled) playSound.tap();
    setStoreProducts((prev) => prev.filter((p) => !productIds.includes(p.id)));
    setCart((prev) => prev.filter((c) => !productIds.includes(c.product.id)));
    showToast(`${productIds.length} barang dihapus dari toko`);
  };

  return (
    <div className="min-h-screen bg-[#e9eee7] text-slate-900 pb-28 sm:pb-24 selection:bg-emerald-700 selection:text-white leading-relaxed">
      {/* Top Header with Store Switcher Dropdown */}
      <Header
        stores={stores}
        activeStoreId={activeStoreId}
        onSelectStore={handleSelectStore}
        onOpenAddStore={() => setActiveTab('settings')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch={activeTab === 'catalog'}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 space-y-6 sm:space-y-8">
        
        {/* TAB 1: ETALASE & KASIR */}
        {activeTab === 'catalog' && (
          <>
            {/* Earth Green Banner Hero */}
            <BannerHero
              totalProducts={products.length}
              lowStockCount={lowStockProducts.length}
              todayRevenue={todayRevenue}
              onFilterLowStock={() => setSelectedCategory('low-stock')}
              onOpenSalesHistory={() => setActiveTab('history')}
            />

            {/* Category Filter Horizontal Buttons */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider leading-normal">
                  Kategori Dagangan:
                </span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-emerald-800 font-semibold underline leading-normal cursor-pointer"
                  >
                    Reset Cari: "{searchQuery}"
                  </button>
                )}
              </div>
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                categoryCounts={categoryCounts}
                lowStockCount={lowStockProducts.length}
              />
            </div>

            {/* Shelf Filter Horizontal Pills */}
            {availableShelves.length > 0 && (
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider leading-normal flex items-center gap-1.5">
                    <span>🏷️ Lokasi Rak / Etalase:</span>
                  </span>
                  {selectedShelf !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedShelf('all')}
                      className="text-xs text-amber-900 font-semibold underline leading-normal cursor-pointer"
                    >
                      Tampilkan Semua Rak
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSelectedShelf('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                      selectedShelf === 'all'
                        ? 'bg-amber-800 text-white border-amber-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200/90 hover:bg-amber-50'
                    }`}
                  >
                    Semua Rak ({products.length})
                  </button>
                  {availableShelves.map((s) => {
                    const count = products.filter((p) => p.shelf?.trim().toLowerCase() === s.toLowerCase()).length;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedShelf(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                          selectedShelf.toLowerCase() === s.toLowerCase()
                            ? 'bg-amber-800 text-white border-amber-900 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200/90 hover:bg-amber-50'
                        }`}
                      >
                        <span>🗄️ {s}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          selectedShelf.toLowerCase() === s.toLowerCase()
                            ? 'bg-amber-950 text-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Product Display by Shelf (Visualisasi Ambalan Rak Pajang) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-normal">
                  {selectedCategory === 'all'
                    ? selectedShelf === 'all'
                      ? 'Semua Dagangan di Rak & Etalase'
                      : `Rak: ${selectedShelf}`
                    : selectedCategory === 'low-stock'
                    ? '⚠️ Barang Perlu Ditambah (Stok Sedikit)'
                    : `Kategori: ${selectedCategory.toUpperCase()}`}
                  <span className="text-xs text-slate-500 font-normal ml-2">
                    ({filteredProducts.length} barang)
                  </span>
                </h3>
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
                /* Grouped Shelves (Ambalan Rak Pajang Fisik) */
                <div className="space-y-8">
                  {shelfGroups.map((group) => (
                    <div key={group.shelfName} className="space-y-3">
                      {/* Shelf Header Plaque */}
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100/90 text-amber-900 border border-amber-300 font-extrabold text-xs sm:text-sm shadow-2xs">
                            <span>🗄️</span>
                            <span>{group.shelfName}</span>
                          </span>
                          <span className="text-xs text-slate-500 font-semibold">
                            ({group.items.length} barang)
                          </span>
                        </div>
                      </div>

                      {/* Product Cards on this shelf */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 items-end">
                        {group.items.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={handleAddToCart}
                            onRestockProduct={(p) => {
                              if (soundEnabled) playSound.tap();
                              setRestockProductId(p.id);
                              setActiveTab('inventory');
                              setIsRestockModalOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: STOK BARANG & GUDANG */}
        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2 max-w-[90vw]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
