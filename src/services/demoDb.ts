import { Product, StoreAccount, Transaction } from '../types/store';

export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if ((window as any).__TOKO_FORCE_DEMO__ === true) return true;
    const params = new URLSearchParams(window.location.search);
    if (
      params.has('demo') &&
      params.get('demo') !== '0' &&
      params.get('demo') !== 'false'
    ) {
      return true;
    }
    if (params.get('mode') === 'demo') return true;
    const hash = (window.location.hash || '').toLowerCase();
    if (hash === '#demo' || hash.startsWith('#demo?') || hash.startsWith('#/demo')) {
      return true;
    }
    const hostname = (window.location.hostname || '').toLowerCase();
    if (
      hostname.includes('demo') ||
      hostname.endsWith('.pages.dev') ||
      hostname.endsWith('.workers.dev')
    ) {
      return true;
    }
    const pathname = (window.location.pathname || '').toLowerCase();
    if (
      pathname.endsWith('/demo') ||
      pathname.endsWith('/demo/') ||
      pathname.endsWith('/demo.html')
    ) {
      return true;
    }
  } catch {
    // Ignore URL parsing errors
  }
  return false;
}

interface DemoState {
  stores: StoreAccount[];
  activeStoreId: string;
  fontSizeLevel: number;
  productsMap: { [storeId: string]: Product[] };
  transactionsMap: { [storeId: string]: Transaction[] };
}

function createInitialDemoState(): DemoState {
  const storeId1 = 'demo-store-utama';
  const storeId2 = 'demo-store-cabang-2';
  const now = Date.now();
  const hourMs = 3600 * 1000;
  const dayMs = 24 * hourMs;

  const stores: StoreAccount[] = [
    {
      id: storeId1,
      name: 'Warung Berkah Ibu Siti',
      ownerName: 'Ibu Siti',
      categoryOrType: 'Toko Sembako & Kelontong',
      createdAt: new Date(now - 30 * dayMs).toISOString(),
    },
    {
      id: storeId2,
      name: 'Warung Berkah 2 (Pasar)',
      ownerName: 'Ibu Siti',
      categoryOrType: 'Kios Pasar Tradisional',
      createdAt: new Date(now - 10 * dayMs).toISOString(),
    },
  ];

  const productsStore1: Product[] = [
    {
      id: 'p-1',
      name: 'Beras Ramos Super 5kg',
      category: 'sembako',
      sellPrice: 68000,
      buyPrice: 62000,
      stock: 18,
      minStock: 5,
      unit: 'karung',
      shelf: 'Rak A1',
      iconType: 'rice',
      updatedAt: new Date(now - 2 * hourMs).toISOString(),
    },
    {
      id: 'p-2',
      name: 'Minyak Goreng Bimoli 1L',
      category: 'sembako',
      sellPrice: 18000,
      buyPrice: 15500,
      stock: 24,
      minStock: 6,
      unit: 'pouch',
      shelf: 'Rak A1',
      iconType: 'oil',
      updatedAt: new Date(now - 3 * hourMs).toISOString(),
    },
    {
      id: 'p-3',
      name: 'Telur Ayam Negeri 1kg',
      category: 'sembako',
      sellPrice: 29000,
      buyPrice: 26000,
      stock: 4,
      minStock: 5,
      unit: 'kg',
      shelf: 'Meja Kasir',
      iconType: 'egg',
      updatedAt: new Date(now - 4 * hourMs).toISOString(),
    },
    {
      id: 'p-4',
      name: 'Gula Pasir Gulaku 1kg',
      category: 'sembako',
      sellPrice: 17500,
      buyPrice: 15000,
      stock: 15,
      minStock: 5,
      unit: 'bks',
      shelf: 'Rak A2',
      iconType: 'sugar',
      updatedAt: new Date(now - 5 * hourMs).toISOString(),
    },
    {
      id: 'p-5',
      name: 'Indomie Goreng Spesial',
      category: 'makanan',
      sellPrice: 3500,
      buyPrice: 2800,
      stock: 45,
      minStock: 10,
      unit: 'bks',
      shelf: 'Rak B1',
      iconType: 'noodle',
      updatedAt: new Date(now - 6 * hourMs).toISOString(),
    },
    {
      id: 'p-6',
      name: 'Kopi Kapal Api Special',
      category: 'minuman',
      sellPrice: 2000,
      buyPrice: 1500,
      stock: 30,
      minStock: 10,
      unit: 'sachet',
      shelf: 'Gantungan',
      iconType: 'coffee',
      updatedAt: new Date(now - 7 * hourMs).toISOString(),
    },
    {
      id: 'p-7',
      name: 'Teh Pucuk Harum 350ml',
      category: 'minuman',
      sellPrice: 4000,
      buyPrice: 3000,
      stock: 20,
      minStock: 6,
      unit: 'btl',
      shelf: 'Kulkas',
      iconType: 'drink',
      updatedAt: new Date(now - 8 * hourMs).toISOString(),
    },
    {
      id: 'p-8',
      name: 'Kerupuk Udang Sidoarjo',
      category: 'makanan',
      sellPrice: 12000,
      buyPrice: 9500,
      stock: 12,
      minStock: 4,
      unit: 'bks',
      shelf: 'Rak B2',
      iconType: 'snack',
      updatedAt: new Date(now - 9 * hourMs).toISOString(),
    },
  ];

  const productsStore2: Product[] = [
    {
      id: 'p2-1',
      name: 'Beras Pandan Wangi 5kg',
      category: 'sembako',
      sellPrice: 72000,
      buyPrice: 65000,
      stock: 14,
      minStock: 4,
      unit: 'karung',
      shelf: 'Blok Depan',
      iconType: 'rice',
      updatedAt: new Date(now - 3 * hourMs).toISOString(),
    },
    {
      id: 'p2-2',
      name: 'Minyak Kita 1L',
      category: 'sembako',
      sellPrice: 16500,
      buyPrice: 14500,
      stock: 20,
      minStock: 5,
      unit: 'pouch',
      shelf: 'Rak Tengah',
      iconType: 'oil',
      updatedAt: new Date(now - 5 * hourMs).toISOString(),
    },
  ];

  const transactionsStore1: Transaction[] = [
    {
      id: 'tx-demo-101',
      timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
      totalAmount: 104000,
      totalProfit: 11000,
      cashPaid: 110000,
      change: 6000,
      status: 'completed',
      items: [
        {
          productId: 'p-1',
          productName: 'Beras Ramos Super 5kg',
          quantity: 1,
          unit: 'karung',
          buyPrice: 62000,
          sellPrice: 68000,
        },
        {
          productId: 'p-2',
          productName: 'Minyak Goreng Bimoli 1L',
          quantity: 2,
          unit: 'pouch',
          buyPrice: 15500,
          sellPrice: 18000,
        },
      ],
    },
    {
      id: 'tx-demo-102',
      timestamp: new Date(now - 3 * hourMs).toISOString(),
      totalAmount: 46500,
      totalProfit: 5500,
      cashPaid: 50000,
      change: 3500,
      status: 'completed',
      items: [
        {
          productId: 'p-3',
          productName: 'Telur Ayam Negeri 1kg',
          quantity: 1,
          unit: 'kg',
          buyPrice: 26000,
          sellPrice: 29000,
        },
        {
          productId: 'p-4',
          productName: 'Gula Pasir Gulaku 1kg',
          quantity: 1,
          unit: 'bks',
          buyPrice: 15000,
          sellPrice: 17500,
        },
      ],
    },
    {
      id: 'tx-demo-103',
      timestamp: new Date(now - 1 * dayMs).toISOString(),
      totalAmount: 122000,
      totalProfit: 13500,
      cashPaid: 150000,
      change: 28000,
      status: 'completed',
      items: [
        {
          productId: 'p-1',
          productName: 'Beras Ramos Super 5kg',
          quantity: 1,
          unit: 'karung',
          buyPrice: 62000,
          sellPrice: 68000,
        },
        {
          productId: 'p-2',
          productName: 'Minyak Goreng Bimoli 1L',
          quantity: 3,
          unit: 'pouch',
          buyPrice: 15500,
          sellPrice: 18000,
        },
      ],
    },
  ];

  const transactionsStore2: Transaction[] = [
    {
      id: 'tx-demo-201',
      timestamp: new Date(now - 2 * hourMs).toISOString(),
      totalAmount: 88500,
      totalProfit: 9000,
      cashPaid: 100000,
      change: 11500,
      status: 'completed',
      items: [
        {
          productId: 'p2-1',
          productName: 'Beras Pandan Wangi 5kg',
          quantity: 1,
          unit: 'karung',
          buyPrice: 65000,
          sellPrice: 72000,
        },
        {
          productId: 'p2-2',
          productName: 'Minyak Kita 1L',
          quantity: 1,
          unit: 'pouch',
          buyPrice: 14500,
          sellPrice: 16500,
        },
      ],
    },
  ];

  return {
    stores,
    activeStoreId: storeId1,
    fontSizeLevel: 2,
    productsMap: {
      [storeId1]: productsStore1,
      [storeId2]: productsStore2,
    },
    transactionsMap: {
      [storeId1]: transactionsStore1,
      [storeId2]: transactionsStore2,
    },
  };
}

// Purely in-memory temporary state (never touches IndexedDB or SQLite)
let memoryState: DemoState = createInitialDemoState();

function cloneState<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export const demoDb = {
  reset(): DemoState {
    memoryState = createInitialDemoState();
    return cloneState(memoryState);
  },

  async bootstrap(): Promise<DemoState> {
    return cloneState(memoryState);
  },

  async setActiveStore(storeId: string): Promise<void> {
    if (memoryState.stores.some((s) => s.id === storeId)) {
      memoryState.activeStoreId = storeId;
    }
  },

  async setFontSizeLevel(level: number): Promise<void> {
    memoryState.fontSizeLevel = Math.max(1, Math.min(4, Math.round(level)));
  },

  async createStore(store: StoreAccount): Promise<void> {
    memoryState.stores.push({ ...store });
    memoryState.activeStoreId = store.id;
    if (!memoryState.productsMap[store.id]) {
      memoryState.productsMap[store.id] = [];
    }
    if (!memoryState.transactionsMap[store.id]) {
      memoryState.transactionsMap[store.id] = [];
    }
  },

  async updateStore(storeId: string, data: Partial<StoreAccount>): Promise<void> {
    memoryState.stores = memoryState.stores.map((s) =>
      s.id === storeId ? { ...s, ...data } : s
    );
  },

  async deleteStore(storeId: string): Promise<string> {
    memoryState.stores = memoryState.stores.filter((s) => s.id !== storeId);
    delete memoryState.productsMap[storeId];
    delete memoryState.transactionsMap[storeId];
    const nextId = memoryState.stores[0]?.id || '';
    memoryState.activeStoreId = nextId;
    return nextId;
  },

  async upsertProduct(storeId: string, product: Product): Promise<void> {
    const list = memoryState.productsMap[storeId] || [];
    const idx = list.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      list[idx] = { ...product };
    } else {
      list.unshift({ ...product });
    }
    memoryState.productsMap[storeId] = list;
  },

  async adjustStock(
    storeId: string,
    productId: string,
    stock: number,
    updatedAt: string
  ): Promise<void> {
    const list = memoryState.productsMap[storeId] || [];
    memoryState.productsMap[storeId] = list.map((p) =>
      p.id === productId ? { ...p, stock: Math.max(0, stock), updatedAt } : p
    );
  },

  async deleteProducts(storeId: string, productIds: string[]): Promise<void> {
    const idSet = new Set(productIds);
    const list = memoryState.productsMap[storeId] || [];
    memoryState.productsMap[storeId] = list.filter((p) => !idSet.has(p.id));
  },

  async recordTransaction(
    storeId: string,
    transaction: Transaction
  ): Promise<{ products: Product[]; transactions: Transaction[] }> {
    const list = memoryState.productsMap[storeId] || [];
    const nowIso = new Date().toISOString();

    for (const item of transaction.items) {
      const target = list.find((p) => p.id === item.productId);
      if (target) {
        target.stock = Math.max(0, target.stock - item.quantity);
        target.updatedAt = nowIso;
      }
    }

    const txList = memoryState.transactionsMap[storeId] || [];
    txList.unshift({
      ...transaction,
      status: transaction.status || 'completed',
    });
    memoryState.transactionsMap[storeId] = txList;

    return {
      products: cloneState(list),
      transactions: cloneState(txList),
    };
  },

  async cancelTransaction(
    storeId: string,
    transactionId: string
  ): Promise<{ products: Product[]; transactions: Transaction[] }> {
    const list = memoryState.productsMap[storeId] || [];
    const txList = memoryState.transactionsMap[storeId] || [];
    const targetTx = txList.find((t) => t.id === transactionId);

    if (targetTx && targetTx.status !== 'cancelled') {
      targetTx.status = 'cancelled';
      const nowIso = new Date().toISOString();
      for (const item of targetTx.items) {
        const prod = list.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock = Number(prod.stock) + Number(item.quantity);
          prod.updatedAt = nowIso;
        }
      }
    }

    return {
      products: cloneState(list),
      transactions: cloneState(txList),
    };
  },

  async clearTransactions(storeId: string): Promise<void> {
    memoryState.transactionsMap[storeId] = [];
  },
};
